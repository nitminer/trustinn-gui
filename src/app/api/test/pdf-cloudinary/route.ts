import { NextRequest, NextResponse } from 'next/server';
import { generateHTMLPDFReceiptBuffer } from '@/lib/pdfReceiptGeneratorHTML';
import { uploadReceiptPDFToCloudinary } from '@/lib/cloudinaryUpload';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('\n=== TEST: HTML-based PDF Generation and Cloudinary Upload ===\n');

    // Generate test PDF
    console.log('Step 1: Generating HTML-based PDF...');
    const pdfBuffer = await generateHTMLPDFReceiptBuffer({
      receiptNumber: 'TEST-RCP-HTML-001',
      receiptDate: 'January 24, 2026',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerId: '507f1f77bcf86cd799439011',
      serviceDescription: 'Test Premium Subscription (1 Year - Unlimited Access)',
      amountInRupees: 599400,
      paymentMethod: 'Razorpay',
      transactionId: 'pay_TEST123',
      serviceStartDate: 'January 24, 2026',
      serviceEndDate: 'January 24, 2027',
      paymentStatus: 'Paid',
      duration: 1
    });

    console.log(`Step 1 Success: PDF generated (${pdfBuffer.length} bytes)`);

    // Upload to Cloudinary
    console.log('\nStep 2: Uploading to Cloudinary...');
    const cloudinaryURL = await uploadReceiptPDFToCloudinary(
      pdfBuffer,
      'test-receipt-html',
      'TEST-RCP-HTML-001'
    );

    console.log(`Step 2 Success: Uploaded to ${cloudinaryURL}`);

    return NextResponse.json({
      success: true,
      message: 'HTML-based PDF test completed successfully',
      pdfSize: pdfBuffer.length,
      cloudinaryURL: cloudinaryURL
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
