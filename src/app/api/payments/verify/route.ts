import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Subscription from '@/lib/models/Subscription';
import Payment from '@/lib/models/Payment';
import { sendPaymentSuccessEmail, sendPaymentReceiptEmailWithCloudinary } from '@/lib/email';
import { generateReceiptHTML } from '@/lib/receiptGenerator';
import { generateHTMLPDFReceiptBuffer } from '@/lib/pdfReceiptGeneratorHTML';
import { uploadReceiptPDFToCloudinary } from '@/lib/cloudinaryUpload';

// Configure this route to use Node.js runtime (required for PDF generation and Cloudinary)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { orderId, paymentId, signature, email, amount, duration = 1, durationUnit = 'years' } = await request.json();

    if (!orderId || !paymentId || !signature || !email) {
      return NextResponse.json(
        { message: 'Missing required payment details' },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { message: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already premium
    if (user.hasPremium) {
      return NextResponse.json(
        { message: 'User already has premium access' },
        { status: 400 }
      );
    }

    // Calculate end date based on duration and unit
    const startDate = new Date();
    const durationMs = durationUnit === 'months' 
      ? duration * 30 * 24 * 60 * 60 * 1000  // months × 30 days
      : duration * 365 * 24 * 60 * 60 * 1000; // years × 365 days
    const endDate = new Date(Date.now() + durationMs);

    // Update user to premium
    user.hasPremium = true;
    user.premiumToken = `premium_${paymentId}_${Date.now()}`;
    user.trialExceeded = false; // Reset trial exceeded flag
    await user.save();

    // Create or update subscription record
    let subscription = await Subscription.findOne({ email: email.toLowerCase() });
    
    if (subscription) {
      // Update existing subscription
      subscription.userId = user._id;
      subscription.plan = 'premium';
      subscription.amountPaid = amount; // Use actual amount
      subscription.currency = 'INR';
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.isActive = true;
      subscription.autoRenew = true;
      subscription.paymentId = paymentId;
    } else {
      // Create new subscription
      subscription = new Subscription({
        email: email.toLowerCase(),
        userId: user._id,
        plan: 'premium',
        amountPaid: amount, // Use actual amount
        currency: 'INR',
        startDate: startDate,
        endDate: endDate,
        isActive: true,
        autoRenew: true,
        paymentId: paymentId
      });
    }
    await subscription.save();

    // Create payment record
    const receiptNumber = `RCP-${Date.now().toString().slice(-8)}-${paymentId.slice(-4).toUpperCase()}`;
    const payment = new Payment({
      email: email.toLowerCase(),
      userId: user._id,
      subscriptionId: subscription._id, // Link to subscription
      transactionId: paymentId,
      amount: amount, // Use actual amount
      currency: 'INR',
      paymentMethod: 'razorpay', // Razorpay payment
      status: 'completed', // Use correct enum value
      plan: 'premium',
      billingPeriod: `${duration}-${durationUnit}`,
      receiptNumber: receiptNumber,
      metadata: {
        orderId: orderId,
        paymentId: paymentId,
        duration: duration,
        durationUnit: durationUnit
      }
    });
    await payment.save();

    // Generate receipt
    const receiptDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const serviceStartDate = startDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const serviceEndDate = endDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const receiptHTML = generateReceiptHTML({
      receiptNumber,
      receiptDate,
      customerName: `${user.firstName} ${user.lastName}`,
      customerEmail: user.email,
      customerId: user._id.toString(),
      serviceDescription: `TrustInn Premium Subscription (${duration} ${durationUnit === 'months' ? 'Month' : 'Year'}${duration > 1 ? 's' : ''} - Unlimited Access)`,
      amountInRupees: amount, // Use actual amount from payment
      amountInPaise: amount,
      paymentMethod: 'Razorpay (Card/UPI/Net Banking)',
      transactionId: paymentId,
      serviceStartDate,
      serviceEndDate,
      paymentStatus: 'Paid',
      duration
    });

    // Generate PDF receipt buffer
    let pdfBuffer: Buffer | undefined;
    let cloudinaryURL: string | undefined;
    try {
      console.log('🎨 Starting HTML-based PDF generation...');
      console.log('Receipt data:', {
        receiptNumber,
        customerName: `${user.firstName} ${user.lastName}`,
        amount: 99900 * duration * 6
      });

      pdfBuffer = await generateHTMLPDFReceiptBuffer({
        receiptNumber,
        receiptDate,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        customerId: user._id.toString(),
        serviceDescription: `TrustInn Premium Subscription (${duration} ${durationUnit === 'months' ? 'Month' : 'Year'}${duration > 1 ? 's' : ''} - Unlimited Access)`,
        amountInRupees: amount,
        paymentMethod: 'Razorpay (Card/UPI/Net Banking)',
        transactionId: paymentId,
        serviceStartDate,
        serviceEndDate,
        paymentStatus: 'Paid',
        duration
      });
      console.log('✅ PDF receipt generated successfully, size:', pdfBuffer?.length, 'bytes');

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF buffer is empty');
      }

      // Upload PDF to Cloudinary
      console.log('🔄 Uploading PDF to Cloudinary with receipt number:', receiptNumber);
      try {
        cloudinaryURL = await uploadReceiptPDFToCloudinary(
          pdfBuffer,
          `receipt-${payment._id}`,
          receiptNumber
        );
        console.log('✅ PDF uploaded to Cloudinary successfully:', cloudinaryURL);

        // Store Cloudinary URL in payment record
        console.log('🔄 Storing Cloudinary URL in database...');
        payment.receiptPdfUrl = cloudinaryURL;
        payment.pdfUploadedAt = new Date();
        await payment.save();
        console.log('✅ Payment record updated with Cloudinary URL');
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary upload error:', cloudinaryError);
        throw cloudinaryError;
      }
    } catch (pdfError) {
      console.error('❌ Failed to generate/upload PDF receipt:', pdfError);
      if (pdfError instanceof Error) {
        console.error('Error message:', pdfError.message);
        console.error('Error stack:', pdfError.stack);
      }
      // Continue without PDF, but log the error
    }

    // Send receipt email with Cloudinary download link
    let receiptEmailSent = false;
    if (cloudinaryURL) {
      const formattedAmount = `₹${(amount / 100).toFixed(2)}`;
      receiptEmailSent = await sendPaymentReceiptEmailWithCloudinary(
        email,
        user.firstName,
        receiptNumber,
        cloudinaryURL,
        formattedAmount
      );
    } else {
      console.warn('Cloudinary URL not available, skipping receipt email');
    }

    // Also send success email
    const successEmailSent = await sendPaymentSuccessEmail(
      email,
      user.firstName,
      user.lastName,
      'premium',
      amount
    );

    if (!receiptEmailSent || !successEmailSent) {
      console.warn('Failed to send one or more emails');
      // Don't fail the API call, payment is already verified
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and premium activated successfully',
      receiptHTML: receiptHTML, // Return receipt HTML to client for printing/download
      user: {
        id: user._id,
        email: user.email,
        hasPremium: true,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { message: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
