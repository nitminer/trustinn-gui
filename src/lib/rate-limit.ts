import { NextRequest, NextResponse } from 'next/server';

// Simple rate limiter for tool execution - max 5 executions per minute per user
const rateLimitMap: { [userId: string]: { count: number; resetTime: number } } = {};

export function checkRateLimit(userId: string, maxRequests: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const userLimit = rateLimitMap[userId];

  if (!userLimit || now > userLimit.resetTime) {
    // New window or first request
    rateLimitMap[userId] = {
      count: 1,
      resetTime: now + windowMs
    };
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (userLimit.count < maxRequests) {
    userLimit.count++;
    return { allowed: true, remaining: maxRequests - userLimit.count, resetIn: userLimit.resetTime - now };
  }

  return { allowed: false, remaining: 0, resetIn: userLimit.resetTime - now };
}

export function rateLimitMiddleware(userId: string, maxRequests: number = 5, windowMs: number = 60000) {
  const { allowed, remaining, resetIn } = checkRateLimit(userId, maxRequests, windowMs);

  if (!allowed) {
    const response = NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        message: `Too many tool executions. Maximum ${maxRequests} per minute. Try again in ${Math.ceil(resetIn / 1000)} seconds.`,
        retryAfter: Math.ceil(resetIn / 1000)
      },
      { status: 429 }
    );
    response.headers.set('Retry-After', Math.ceil(resetIn / 1000).toString());
    return response;
  }

  return null; // Rate limit check passed
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const userId in rateLimitMap) {
    if (now > rateLimitMap[userId].resetTime) {
      delete rateLimitMap[userId];
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[rate-limit] Cleaned ${cleaned} expired rate limit entries`);
  }
}, 300000);
