// =====================================================
// RATE LIMITING UTILITIES
// TODO: Integrate with Upstash Redis or implement in-memory rate limiting
// =====================================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory store for development (replace with Redis in production)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // TODO: Implement proper rate limiting with Upstash Redis
  // Example Upstash implementation:
  // const redis = new Redis(process.env.UPSTASH_REDIS_URL!);
  // const key = `${config.keyPrefix || 'rate_limit'}:${identifier}`;
  // const current = await redis.incr(key);
  // if (current === 1) {
  //   await redis.expire(key, Math.floor(config.windowMs / 1000));
  // }
  // const ttl = await redis.ttl(key);
  // return {
  //   success: current <= config.maxRequests,
  //   remaining: Math.max(0, config.maxRequests - current),
  //   resetTime: Date.now() + (ttl * 1000),
  //   retryAfter: current > config.maxRequests ? ttl : undefined
  // };

  // Temporary in-memory implementation for development
  const key = `${config.keyPrefix || 'rate_limit'}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  const current = memoryStore.get(key);
  if (!current || current.resetTime < now) {
    memoryStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }
  
  if (current.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    };
  }
  
  current.count++;
  return {
    success: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime
  };
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // API endpoints
  API_GENERAL: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  API_AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 auth attempts per 15 minutes
  API_UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 uploads per minute
  API_CHECKOUT: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 checkout attempts per minute
  
  // User actions
  USER_LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 login attempts per 15 minutes
  USER_PURCHASE: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 purchases per minute
  USER_DOWNLOAD: { maxRequests: 50, windowMs: 60 * 1000 }, // 50 downloads per minute
} as const;

// Helper function to get client identifier
export function getClientIdentifier(req: Request): string {
  // TODO: Implement proper client identification
  // Could use IP address, user ID, or combination of both
  // For now, using a simple approach
  
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return ip;
}

// Helper function to get user identifier
export function getUserIdentifier(userId?: string): string {
  return userId || 'anonymous';
}

// Rate limit middleware for API routes
export async function withRateLimit(
  req: Request,
  config: RateLimitConfig,
  identifier?: string
): Promise<RateLimitResult> {
  const clientId = getClientIdentifier(req);
  const userId = identifier || 'anonymous';
  const key = `${clientId}:${userId}`;
  
  return await checkRateLimit(key, config);
}

// Clear rate limit data (useful for testing)
export function clearRateLimitData(): void {
  memoryStore.clear();
} 