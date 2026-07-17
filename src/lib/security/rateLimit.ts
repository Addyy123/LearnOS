type RateLimitEntry = {
  tokens: number;
  lastRefill: number;
};

const rateLimitCache = new Map<string, RateLimitEntry>();

const MAX_TOKENS = 10;
const REFILL_RATE_MS = 60000; // 1 minute

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitCache.get(userId);

  if (!entry) {
    rateLimitCache.set(userId, { tokens: MAX_TOKENS - 1, lastRefill: now });
    return true;
  }

  // Refill tokens based on time passed
  const timePassed = now - entry.lastRefill;
  const tokensToAdd = Math.floor(timePassed / (REFILL_RATE_MS / MAX_TOKENS));

  if (tokensToAdd > 0) {
    entry.tokens = Math.min(MAX_TOKENS, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }

  if (entry.tokens > 0) {
    entry.tokens -= 1;
    return true; // Allowed
  }

  return false; // Rate limited
}
