// In-memory OTP store (replace with Redis for production)
interface OtpEntry {
  otp: string;
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    termsAccepted: boolean;
  };
  createdAt: number;
}

const otpStore: { [key: string]: OtpEntry } = {};

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP with user data
 */
export function storeOTP(email: string, otp: string, userData: OtpEntry['data']): void {
  otpStore[email] = {
    otp,
    data: userData,
    createdAt: Date.now()
  };
}

/**
 * Get stored OTP entry
 */
export function getOTPEntry(email: string): OtpEntry | null {
  return otpStore[email] || null;
}

/**
 * Check if OTP is expired (5 minutes validity)
 */
export function isOTPExpired(createdAt: number): boolean {
  return Date.now() - createdAt > 5 * 60 * 1000;
}

/**
 * Verify OTP
 */
export function verifyOTP(email: string, otp: string): { valid: boolean; data?: OtpEntry['data']; error?: string } {
  const entry = otpStore[email];

  if (!entry) {
    return { valid: false, error: 'No OTP request found for this email' };
  }

  if (isOTPExpired(entry.createdAt)) {
    delete otpStore[email];
    return { valid: false, error: 'OTP expired. Please try signing up again.' };
  }

  if (entry.otp !== otp) {
    return { valid: false, error: 'Incorrect OTP' };
  }

  return { valid: true, data: entry.data };
}

/**
 * Clear OTP after successful verification
 */
export function clearOTP(email: string): void {
  delete otpStore[email];
}

/**
 * Clear expired OTPs (cleanup)
 */
export function clearExpiredOTPs(): void {
  for (const [email, entry] of Object.entries(otpStore)) {
    if (isOTPExpired(entry.createdAt)) {
      delete otpStore[email];
    }
  }
}
