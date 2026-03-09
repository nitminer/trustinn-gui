import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';

// Initialize transporter once
let transporter: any = null;
let transporterReady = false;

async function initializeTransporter() {
  if (transporterReady) return transporter;

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      console.log('[send-otp] Using configured SMTP provider');
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      console.log('[send-otp] SMTP not configured, falling back to Ethereal');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    // Verify connection
    await transporter.verify();
    console.log('[send-otp] Email transporter ready');
    transporterReady = true;
    return transporter;
  } catch (error) {
    console.error('[send-otp] Transporter initialization failed:', error);
    throw error;
  }
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    console.log('[send-otp] Starting OTP generation and email send...');
    
    const { email, userId } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Initialize/get transporter
    const mailTransporter = await initializeTransporter();

    // Connect to database
    await dbConnect();

    // Find user by email
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user && userId) {
      // Try finding by userId if provided
      user = await User.findById(userId);
    }

    if (!user) {
      console.warn('[send-otp] User not found:', email);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      console.log('[send-otp] User already verified:', email);
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 200 }
      );
    }

    // Rate limiting: Check if OTP was sent in last minute
    if (user.lastOtpSentAt) {
      const timeSinceLastOtp = Date.now() - new Date(user.lastOtpSentAt).getTime();
      if (timeSinceLastOtp < 60000) { // 1 minute
        return NextResponse.json(
          { 
            message: 'Please wait before requesting a new OTP',
            retryAfter: Math.ceil((60000 - timeSinceLastOtp) / 1000)
          },
          { status: 429 }
        );
      }
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    console.log('[send-otp] Generated OTP for user:', {
      email,
      otpLength: otp.length,
      expiresIn: '10 minutes'
    });

    // Send OTP via email
    try {
      const mailResponse = await mailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || '"TrustInn" <noreply@trustinn.com>',
        to: email,
        subject: '🔐 Your TrustInn Email Verification OTP',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #333; text-align: center;">Welcome to TrustInn</h1>
              <p style="color: #666; font-size: 16px; text-align: center;">Email Verification Required</p>
              
              <div style="background-color: #f0f7ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #333; margin: 0 0 15px 0;">Hi ${user.name},</p>
                <p style="color: #666;">To complete your TrustInn account setup and access our powerful testing tools, please verify your email address using the OTP below:</p>
                
                <div style="background-color: white; border: 2px dashed #3b82f6; padding: 20px; margin: 20px 0; text-align: center;">
                  <p style="font-size: 12px; color: #999; margin: 0 0 10px 0;">Your Verification Code</p>
                  <p style="font-size: 48px; font-weight: bold; color: #3b82f6; margin: 0; letter-spacing: 5px;">${otp}</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  <strong>⏱️ This code expires in 10 minutes.</strong> If you didn't request this, please ignore this email.
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                <strong>Never share your OTP</strong> - TrustInn support will never ask for your verification code.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                If you did not sign up for TrustInn, please contact our support team at nitminer@nitw.ac.in
              </p>
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                © 2026 TrustInn - Secure Software Testing Platform
              </p>
            </div>
          </div>
        `,
      });

      // Update user with OTP and timestamps in database
      user.otpCode = otp;
      user.otpExpiresAt = otpExpiresAt;
      user.lastOtpSentAt = new Date();
      await user.save();

      console.log('[send-otp] OTP sent and saved to database:', {
        email,
        messageId: mailResponse.messageId
      });

      // For Ethereal test accounts, log the preview URL
      if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_USER) {
        console.log('📧 Ethereal preview URL:', nodemailer.getTestMessageUrl(mailResponse));
      }
      
      return NextResponse.json({
        message: 'OTP sent successfully',
        expiresIn: 600000, // 10 minutes in milliseconds
      }, { status: 200 });
    } catch (emailError) {
      console.error('[send-otp] Email sending failed:', emailError);
      return NextResponse.json(
        { message: 'Failed to send OTP. Please check email configuration.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[send-otp] Unhandled error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}

