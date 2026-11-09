const buckets = new Map();

export function rateLimit(req, { limit = 20, windowMs = 60_000 } = {}) {
    const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const now = Date.now();
    if (buckets.size > 5000) for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
    const b = buckets.get(ip);
    if (!b || now > b.reset) { buckets.set(ip, { count: 1, reset: now + windowMs }); return true; }
    return ++b.count <= limit;
}