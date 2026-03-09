import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import TokenBlacklist from '@/lib/models/TokenBlacklist';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

/**
 * POST /api/auth/validate-nitminer-token
 * Validates JWT token from NitMiner using local JWT verification
 * 
 * Security:
 * - Validates JWT signature locally using JWT_SECRET
 * - Checks token expiration and blacklist
 * - Creates or updates user in TrustInn database
 * - Returns sanitized user data and session info
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[validate-nitminer-token] Starting token validation...');
    
    const { token } = await request.json();
    console.log('[validate-nitminer-token] Token received:', token ? 'present' : 'missing');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // SECURITY: Check token expiration locally first (don't trust expired tokens)
    console.log('[validate-nitminer-token] Checking token expiration...');
    try {
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded) {
        console.warn('[validate-nitminer-token] Invalid token structure');
        return NextResponse.json(
          { error: 'Invalid token format' },
          { status: 401 }
        );
      }

      const payload = decoded.payload as any;
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const expirationTime = payload.exp;

      if (!expirationTime) {
        console.warn('[validate-nitminer-token] Token has no expiration time');
        return NextResponse.json(
          { error: 'Token missing expiration' },
          { status: 401 }
        );
      }

      // Check if token is expired
      if (now >= expirationTime) {
        console.warn('[validate-nitminer-token] Token has expired', {
          now,
          expirationTime,
          expiredBy: now - expirationTime
        });
        return NextResponse.json(
          { 
            error: 'Token expired',
            reason: 'Your session has expired. Please log in again.'
          },
          { status: 401 }
        );
      }

      console.log('[validate-nitminer-token] Token is not expired, expires in:', expirationTime - now, 'seconds');
    } catch (decodeError) {
      console.error('[validate-nitminer-token] Token decode error:', decodeError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // SECURITY: Check if token has been blacklisted/revoked
    console.log('[validate-nitminer-token] Checking if token is blacklisted...');
    try {
      await dbConnect();
      const blacklistedToken = await TokenBlacklist.findOne({ token });
      if (blacklistedToken) {
        console.warn('[validate-nitminer-token] Token is blacklisted/revoked', {
          revokedAt: blacklistedToken.revokedAt,
          reason: blacklistedToken.reason
        });
        return NextResponse.json(
          { 
            error: 'Token revoked',
            reason: 'Your session has been revoked. Please log in again.'
          },
          { status: 401 }
        );
      }
      console.log('[validate-nitminer-token] Token is not blacklisted');
    } catch (blacklistError) {
      console.error('[validate-nitminer-token] Blacklist check error:', blacklistError);
      // Don't fail on blacklist check error, continue with validation
    }

    // Validate token locally using JWT secret
    let validationResult;
    try {
      console.log('[validate-nitminer-token] Validating JWT token locally...');
      
      // Verify token signature using JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', {
        issuer: 'nitminer-trustinn',
        audience: 'trustinn-app',
      }) as any;

      console.log('[validate-nitminer-token] JWT token verified successfully');

      // Check if token is for TrustInn access
      if (decoded.purpose !== 'trustinn_access') {
        console.warn('[validate-nitminer-token] Token is not for TrustInn access:', decoded.purpose);
        return NextResponse.json(
          { error: 'Invalid token', reason: 'Token not for TrustInn access' },
          { status: 401 }
        );
      }

      // CRITICAL: Check if token has been invalidated by logout
      // If user logged out, their tokenVersion is incremented
      // Token's tokenVersion won't match current user's tokenVersion
      if (decoded.tokenVersion !== undefined) {
        console.log('[validate-nitminer-token] Checking token invalidation status...');
        try {
          await dbConnect();
          const user = await User.findById(decoded.id);
          
          if (!user) {
            console.warn('[validate-nitminer-token] User not found in database');
            return NextResponse.json(
              { error: 'Invalid token', reason: 'User not found' },
              { status: 401 }
            );
          }

          // Compare tokenVersion in token with current user's tokenVersion
          if (decoded.tokenVersion !== user.tokenVersion) {
            console.log('[validate-nitminer-token] Token invalidated by logout', {
              tokenVersion: decoded.tokenVersion,
              currentTokenVersion: user.tokenVersion
            });
            return NextResponse.json(
              { error: 'Token invalidated', reason: 'Your session was logged out. Please log in again.' },
              { status: 401 }
            );
          }
          console.log('[validate-nitminer-token] Token version valid');
        } catch (versionCheckError) {
          console.error('[validate-nitminer-token] Error checking token version:', versionCheckError);
          return NextResponse.json(
            { error: 'Unable to verify token', reason: 'Session validation failed' },
            { status: 401 }
          );
        }
      }

      // Extract user data from token
      validationResult = {
        isValid: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          isPremium: decoded.isPremium,
          trialCount: decoded.trialCount,
        },
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        issuedAt: decoded.issuedAt,
      };

      console.log('[validate-nitminer-token] Token validated successfully, user:', validationResult.user.email);
    } catch (jwtError: any) {
      let reason = 'Invalid token';

      if (jwtError.name === 'TokenExpiredError') {
        reason = 'Token expired';
      } else if (jwtError.name === 'JsonWebTokenError') {
        reason = 'Invalid token signature';
      } else if (jwtError.name === 'NotBeforeError') {
        reason = 'Token not active yet';
      }

      console.warn('[validate-nitminer-token] JWT validation failed:', reason);
      return NextResponse.json(
        { error: 'Invalid token', reason },
        { status: 401 }
      );
    }

    const nitMinerUser = validationResult.user;

    if (!nitMinerUser || !nitMinerUser.id || !nitMinerUser.email) {
      return NextResponse.json(
        { error: 'Invalid user data from NitMiner' },
        { status: 400 }
      );
    }

    // Sync or create user in TrustInn database
    console.log('[validate-nitminer-token] Syncing user with database...');
    try {
      // Note: dbConnect already called above in blacklist check
      
      let user = await User.findOne({ email: nitMinerUser.email.toLowerCase() });
      console.log('[validate-nitminer-token] User lookup result:', user ? 'existing user found' : 'user not found');

      if (!user) {
        // User not in TrustInn but has valid NitMiner token - create them
        console.log('[validate-nitminer-token] User not found, creating new user from NitMiner data...', {
          email: nitMinerUser.email,
          name: nitMinerUser.name
        });
        
        user = new User({
          name: nitMinerUser.name || 'User',
          email: nitMinerUser.email.toLowerCase(),
          password: 'nitminer-auth', // Placeholder - auth is via NitMiner token
          role: nitMinerUser.role || 'user',
          isPremium: nitMinerUser.isPremium || false,
          trialCount: 5, // Default trial count for new users
          isEmailVerified: false // New users need email verification
        });
        
        await user.save();
        console.log('[validate-nitminer-token] New user created:', {
          userId: user._id,
          email: user.email
        });
      }

      // User exists - verify they're in good standing
      console.log('[validate-nitminer-token] Verifying user account status...');
      
      // Update user info from NitMiner data (name, role, premium status)
      // NOTE: Do NOT sync trial count from NitMiner - our database is the source of truth
      // Trial count is managed locally by consume-trail endpoint
      user.name = nitMinerUser.name || user.name;
      user.role = nitMinerUser.role || user.role;
      user.isPremium = nitMinerUser.isPremium;
      
      console.log('[validate-nitminer-token] User info synced from NitMiner:', {
        name: user.name,
        role: user.role,
        isPremium: user.isPremium,
        isEmailVerified: user.isEmailVerified,
        trialCount: user.trialCount
      });
      
      await user.save();
      console.log('[validate-nitminer-token] User verified and updated:', user._id, {
        isPremium: user.isPremium,
        isEmailVerified: user.isEmailVerified,
        trialCount: user.trialCount
      });

      // Return session data with email verification status
      console.log('[validate-nitminer-token] Validation successful, returning session data');
      return NextResponse.json({
        isValid: true,
        requiresEmailVerification: !user.isEmailVerified,
        user: {
          id: user._id.toString(),
          mongoId: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isPremium: user.isPremium,
          trialCount: user.trialCount,
          isEmailVerified: user.isEmailVerified,
          subscription: user.subscription
        },
        token: token,
        expiresAt: validationResult.expiresAt,
        issuedAt: validationResult.issuedAt
      });
    } catch (dbError) {
      console.error('[validate-nitminer-token] Database operation failed:', dbError);
      console.error('[validate-nitminer-token] Database error details:', dbError instanceof Error ? {
        message: dbError.message,
        stack: dbError.stack
      } : String(dbError));
      
      // FALLBACK: If DB is unavailable but NitMiner validation succeeded, 
      // allow access with NitMiner user data
      console.log('[validate-nitminer-token] Falling back to NitMiner user data (DB unavailable)');
      if (validationResult && validationResult.user && validationResult.isValid) {
        const nitMinerUser = validationResult.user;
        return NextResponse.json({
          isValid: true,
          user: {
            id: nitMinerUser.id,
            mongoId: nitMinerUser.id,
            name: nitMinerUser.name || 'User',
            email: nitMinerUser.email,
            role: nitMinerUser.role || 'user',
            isPremium: nitMinerUser.isPremium || false,
            trialCount: nitMinerUser.trialCount || 5,
            subscription: {
              plan: null,
              status: null,
              startDate: null,
              endDate: null,
              paymentId: null
            }
          },
          token: token,
          expiresAt: validationResult.expiresAt,
          issuedAt: validationResult.issuedAt,
          warning: 'Using cached NitMiner data due to database unavailability'
        });
      }
      
      // If no fallback available, return error
      return NextResponse.json(
        { 
          error: 'Database error', 
          details: dbError instanceof Error ? dbError.message : String(dbError) 
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('[validate-nitminer-token] Unhandled error:', error);
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : String(error);
    
    console.error('[validate-nitminer-token] Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Server error during token validation',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
