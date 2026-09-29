type RateLimitEntry = {
    count: number;
    resetTime: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    });
}, 60 * 1000);

export const checkRateLimit = (
    ipKey: string,
    limit = 10,
    windowMs = 60 * 1000
): { success: boolean; remaining: number } => {
    const now = Date.now();
    const entry = rateLimitStore.get(ipKey);

    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(ipKey, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { success: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0 };
    }

    entry.count += 1;
    return { success: true, remaining: limit - entry.count };
};
