import type { Context, Next } from "hono";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  statusCode: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: "Too Many Requests",
  statusCode: 429,
};

const ipHits = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (config: Partial<RateLimitConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async (c: Context, next: Next) => {
    // Get IP address from Cloudflare header or fallback
    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    const now = Date.now();
    let record = ipHits.get(ip);

    // Reset if window expired or new IP
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + finalConfig.windowMs };
      ipHits.set(ip, record);
    }

    // Increment request count
    record.count++;

    // Check limit
    if (record.count > finalConfig.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      c.header("Retry-After", retryAfter.toString());
      return c.text(finalConfig.message, finalConfig.statusCode as any);
    }

    // Lazy cleanup to prevent memory leak (if map grows too large)
    // In a real production system with many nodes, this would be handled differently (e.g. KV TTL)
    if (ipHits.size > 5000) {
      ipHits.clear();
    }

    await next();
  };
};
