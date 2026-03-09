import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
function initializeTransporter() {
  if (!transporter) {
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.warn('⚠️ Email credentials not configured. Email sending disabled.');
      console.warn('Please set SMTP_USER and SMTP_PASSWORD environment variables.');
      // Return a dummy transporter that logs instead of sending
      return {
        sendMail: async (options: any) => {
          console.log('📧 [Email Simulation] Would send email to:', options.to);
          console.log('Subject:', options.subject);
          return Promise.resolve({ messageId: 'simulated' });
        }
      } as unknown as nodemailer.Transporter;
    }

    console.log('✅ Email transporter initialized with user:', emailUser);
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  }
  return transporter;
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const transporter = initializeTransporter();

    const mailOptions: EmailOptions = {
      to: email,
      subject: 'Your TrustInn OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Your TrustInn OTP verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="letter-spacing: 5px; color: #2563eb;">${otp}</h1>
          </div>
          <p style="color: #666;">This code is valid for 5 minutes only.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    if (error instanceof Error) {
      console.error('Email error details:', error.message);
    }
    return false;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
  try {
    const transporter = initializeTransporter();

    const mailOptions: EmailOptions = {
      to: email,
      subject: 'Welcome to TrustInn!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to TrustInn, ${firstName}!</h2>
          <p>Your account has been successfully created.</p>
          <p>You can now log in and start using our platform.</p>
          <p style="color: #999; font-size: 12px;">Best regards, The TrustInn Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail(
  email: string,
  firstName: string,
  lastName: string,
  plan: string,
  amount: number
): Promise<boolean> {
  try {
    const transporter = initializeTransporter();
    const amountInRupees = (amount / 100).toFixed(2);

    const mailOptions: EmailOptions = {
      to: email,
      subject: '🎉 Congratulations! Your Premium Upgrade is Complete',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px;">
          <div style="background-color: #ffffff; border-radius: 10px; overflow: hidden;">
            
            <!-- Header Section -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0 0 10px 0; font-size: 36px;">🎉 Kudos! 🎉</h1>
              <p style="margin: 0; font-size: 18px; font-weight: 300;">Payment Successful!</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Welcome to Premium, ${firstName}!</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 20px;">
              
              <!-- Welcome Message -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; font-size: 24px; margin-top: 0;">🚀 Congratulations on Your Upgrade!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  You've successfully unlocked unlimited access to all premium tools and features. <br>
                  <strong style="color: #667eea;">Your journey to advanced security testing begins now!</strong>
                </p>
              </div>

              <!-- Payment Details Card -->
              <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; padding: 20px; margin: 25px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #333; margin-top: 0; text-align: center;">✅ Payment Confirmation</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-weight: 500;">Transaction ID:</td>
                    <td style="padding: 12px 0; text-align: right; color: #667eea; font-weight: bold;">${new Date().getTime()}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 12px 0; color: #666; font-weight: 500;">Plan Purchased:</td>
                    <td style="padding: 12px 0; text-align: right; color: #333;"><strong style="font-size: 16px;">${plan.toUpperCase()}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-weight: 500;">Amount Paid:</td>
                    <td style="padding: 12px 0; text-align: right; color: #22c55e;"><strong style="font-size: 20px;">₹${amountInRupees}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-weight: 500;">Payment Date:</td>
                    <td style="padding: 12px 0; text-align: right; color: #666;">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  </tr>
                </table>
              </div>

              <!-- Unlimited Access Highlight -->
              <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; border-radius: 10px; padding: 25px; margin: 25px 0; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <h2 style="margin: 0 0 15px 0; font-size: 28px;">∞ UNLIMITED ACCESS</h2>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #e5e7eb;">You now have full access to all premium tools without any restrictions!</p>
              </div>

              <!-- Premium Features -->
              <div style="background-color: #f0f9ff; border-radius: 10px; padding: 20px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                <h3 style="color: #1e40af; margin-top: 0; text-align: center; font-size: 18px;">✨ Your Premium Benefits</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px;">
                  <div style="padding: 10px; background: white; border-radius: 6px; text-align: center;">
                    <p style="color: #3b82f6; font-weight: bold; margin: 5px 0;">∞ Unlimited Executions</p>
                    <p style="color: #666; font-size: 12px; margin: 0;">Run code without limits</p>
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px; text-align: center;">
                    <p style="color: #3b82f6; font-weight: bold; margin: 5px 0;">🔧 All Premium Tools</p>
                    <p style="color: #666; font-size: 12px; margin: 0;">Full access to every feature</p>
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px; text-align: center;">
                    <p style="color: #3b82f6; font-weight: bold; margin: 5px 0;">⚡ Priority Queue</p>
                    <p style="color: #666; font-size: 12px; margin: 0;">Fast execution priority</p>
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px; text-align: center;">
                    <p style="color: #3b82f6; font-weight: bold; margin: 5px 0;">📊 Advanced Analytics</p>
                    <p style="color: #666; font-size: 12px; margin: 0;">Detailed insights & reports</p>
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px; text-align: center;">
                    <p style="color: #3b82f6; font-weight: bold; margin: 5px 0;">🎯 Custom Settings</p>
                    <p style="color: #666; font-size: 12px; margin: 0;">Personalized configuration</p>
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px; text-align: center;">
                    <p style="color: #3b82f6; font-weight: bold; margin: 5px 0;">🆘 24/7 Support</p>
                    <p style="color: #666; font-size: 12px; margin: 0;">Priority customer support</p>
                  </div>
                </div>
              </div>

              <!-- Tools Available -->
              <div style="background-color: #fef3c7; border-radius: 10px; padding: 20px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #92400e; margin-top: 0; text-align: center; font-size: 18px;">🛠️ Premium Tools You Can Access</h3>
                <ul style="color: #92400e; padding-left: 20px; margin: 15px 0;">
                  <li style="margin: 8px 0;"><strong>C/C++ Testing</strong> - CBMC, KLEE, Mutation Testing</li>
                  <li style="margin: 8px 0;"><strong>Java Analysis</strong> - Static analysis and verification</li>
                  <li style="margin: 8px 0;"><strong>Python Tools</strong> - Code coverage and fuzzing</li>
                  <li style="margin: 8px 0;"><strong>Smart Contracts</strong> - Solidity verification with VeriSol</li>
                  <li style="margin: 8px 0;"><strong>Test Generation</strong> - Automated test case creation</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="http://localhost:4040/tools" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4); transition: transform 0.3s;">
                  🚀 Start Using Premium Tools Now
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
                <p style="color: #999; font-size: 13px; margin: 8px 0;">
                  <strong>Thank you for choosing TrustInn!</strong>
                </p>
                <p style="color: #999; font-size: 12px; margin: 8px 0;">
                  If you have any questions or need assistance, reach out to us at <strong>support@trustinn.com</strong>
                </p>
                <p style="color: #999; font-size: 11px; margin: 15px 0 0 0;">
                  © 2026 NITMiner Technologies Private Limited. All rights reserved. <br>
                  <a href="http://localhost:4040/dashboard" style="color: #667eea; text-decoration: none;">View Your Dashboard</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending payment success email:', error);
    return false;
  }
}

/**
 * Send payment receipt with Cloudinary download link
 */
export async function sendPaymentReceiptEmailWithCloudinary(
  email: string,
  firstName: string,
  receiptNumber: string,
  cloudinaryURL: string,
  amount: string
): Promise<boolean> {
  try {
    const transporter = initializeTransporter();

    const mailOptions: EmailOptions = {
      to: email,
      subject: '📄 Your TrustInn Payment Receipt - Premium Subscription',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0; font-size: 24px;">📄 Payment Receipt</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your subscription is now active!</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Hi ${firstName},
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for your purchase! Your payment has been successfully processed. Your official payment receipt is ready for download.
            </p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #1e40af; font-weight: bold; margin: 0 0 8px 0;">✓ What's Next?</p>
              <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                <li>Your premium access is now active</li>
                <li>Enjoy unlimited tool executions</li>
                <li>Access all premium features immediately</li>
              </ul>
            </div>

            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #856404; font-weight: bold; margin: 0 0 10px 0;">📋 Receipt Details</p>
              <p style="color: #856404; margin: 5px 0; font-size: 13px;">
                <strong>Receipt #:</strong> ${receiptNumber}
              </p>
              <p style="color: #856404; margin: 5px 0; font-size: 13px;">
                <strong>Amount:</strong> ${amount}
              </p>
              <p style="color: #856404; margin: 5px 0; font-size: 13px;">
                <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${cloudinaryURL}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                📥 Download Receipt PDF
              </a>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin: 25px 0 0 0;">
              The download link is valid for 30 days. You can also access your receipt anytime from your account.
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; margin: 8px 0;">
                If you have any questions about your receipt, please contact us at <strong>support@trustinn.com</strong>
              </p>
              <p style="color: #999; font-size: 11px; margin: 8px 0;">
                © 2026 NITMiner Technologies Private Limited. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending payment receipt email with Cloudinary:', error);
    return false;
  }
}

/**
 * Send payment receipt with PDF attachment
 */
export async function sendPaymentReceiptEmail(
  email: string,
  firstName: string,
  receiptHTML: string,
  pdfBuffer?: Buffer
): Promise<boolean> {
  try {
    const transporter = initializeTransporter();

    const mailOptions: EmailOptions = {
      to: email,
      subject: '📄 Your TrustInn Payment Receipt - Premium Subscription',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0; font-size: 24px;">📄 Payment Receipt</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your subscription is now active!</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Hi ${firstName},
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for your purchase! Your payment has been successfully processed. We've attached your official payment receipt below.
            </p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #1e40af; font-weight: bold; margin: 0 0 8px 0;">✓ What's Next?</p>
              <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                <li>Your premium access is now active</li>
                <li>Enjoy unlimited tool executions</li>
                <li>Access all premium features immediately</li>
              </ul>
            </div>

            <p style="color: #666; font-size: 14px; margin: 30px 0 0 0;">
              <strong>Invoice Details:</strong><br>
              Please find the detailed invoice attached to this email as a PDF.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:4040/tools" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Start Using Premium Tools
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; margin: 8px 0;">
                If you have any questions about your receipt, please contact us at <strong>support@trustinn.com</strong>
              </p>
              <p style="color: #999; font-size: 11px; margin: 8px 0;">
                © 2026 NITMiner Technologies Private Limited. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: pdfBuffer ? [
        {
          filename: `TrustInn-Receipt-${Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : undefined
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending payment receipt email:', error);
    return false;
  }
}
