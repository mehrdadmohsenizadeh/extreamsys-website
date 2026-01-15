import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy initialization to avoid build-time errors
let redis: Redis | null = null;
let contactRateLimitInstance: Ratelimit | null = null;
let newsletterRateLimitInstance: Ratelimit | null = null;
let globalRateLimitInstance: Ratelimit | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
      );
    }

    redis = new Redis({ url, token });
  }

  return redis;
}

/**
 * Contact form rate limiter
 * Sliding window: 5 submissions per 60 minutes per IP
 */
export function getContactRateLimit(): Ratelimit {
  if (!contactRateLimitInstance) {
    contactRateLimitInstance = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, "60 m"),
      analytics: true,
      prefix: "ratelimit:contact",
    });
  }

  return contactRateLimitInstance;
}

/**
 * Newsletter rate limiter
 * Sliding window: 3 subscriptions per 60 minutes per IP
 */
export function getNewsletterRateLimit(): Ratelimit {
  if (!newsletterRateLimitInstance) {
    newsletterRateLimitInstance = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(3, "60 m"),
      analytics: true,
      prefix: "ratelimit:newsletter",
    });
  }

  return newsletterRateLimitInstance;
}

/**
 * Global API rate limiter (fallback protection)
 * 100 requests per 15 minutes per IP
 */
export function getGlobalRateLimit(): Ratelimit {
  if (!globalRateLimitInstance) {
    globalRateLimitInstance = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(100, "15 m"),
      analytics: true,
      prefix: "ratelimit:global",
    });
  }

  return globalRateLimitInstance;
}

/**
 * Penalty box for abusive IPs
 * Temporarily block IPs that exceed rate limits multiple times
 */
export async function checkPenaltyBox(identifier: string): Promise<boolean> {
  const key = `penalty:${identifier}`;
  const violations = await getRedis().get<number>(key);

  // If violations >= 3, they're in the penalty box
  if (violations && violations >= 3) {
    return true;
  }

  return false;
}

/**
 * Add IP to penalty box
 */
export async function addToPenaltyBox(identifier: string): Promise<void> {
  const key = `penalty:${identifier}`;
  const violations = await getRedis().get<number>(key);

  if (violations) {
    // Increment violations and extend TTL
    await getRedis().set(key, violations + 1, { ex: 3600 }); // 1 hour
  } else {
    // First violation
    await getRedis().set(key, 1, { ex: 3600 }); // 1 hour
  }
}

/**
 * Extract client IP from request headers
 * Supports Cloudflare, Vercel, and standard headers
 */
export function getClientIP(headers: Headers): string {
  // Cloudflare CF-Connecting-IP
  const cfIP = headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  // Vercel x-forwarded-for
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  // Vercel x-real-ip
  const realIP = headers.get("x-real-ip");
  if (realIP) return realIP;

  // Fallback
  return "unknown";
}

/**
 * Log rate limit event for monitoring
 */
export interface RateLimitEvent {
  type: "rate_limit_blocked" | "rate_limit_passed";
  identifier: string;
  endpoint: string;
  remaining: number;
  limit: number;
  reset: number;
  timestamp: string;
}

export async function logRateLimitEvent(event: RateLimitEvent): Promise<void> {
  try {
    // In production, send to logging service (e.g., Sentry, DataDog)
    // For now, store in Redis for audit trail
    const key = `logs:ratelimit:${event.type}:${Date.now()}`;
    await getRedis().set(key, JSON.stringify(event), { ex: 86400 }); // 24 hours

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Rate Limit]", event);
    }
  } catch (error) {
    // Don't throw - logging failures shouldn't break the app
    console.error("[Rate Limit Logging Error]", error);
  }
}
