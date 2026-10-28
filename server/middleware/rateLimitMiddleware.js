/**
 * In-memory sliding window rate limiter middleware.
 * Zero external dependencies, self-cleaning, sets standard RateLimit headers.
 */

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100, // Limit each IP to 100 requests per windowMs
  message = 'Too many requests from this IP, please try again later.',
  statusCode = 429,
  skip = () => false,
}) => {
  const hits = new Map();

  // Periodically clean up expired entries every 5 minutes
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupTimer.unref) {
    cleanupTimer.unref(); // Don't hold Node process open in test runs
  }

  return (req, res, next) => {
    // Optional skip condition (e.g. Health checks or test environment if explicitly desired)
    if (skip(req)) {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let record = hits.get(ip);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(statusCode).json({
        success: false,
        message,
        retryAfter: resetSeconds,
      });
    }

    next();
  };
};

// Strict limiter for authentication endpoints (prevent brute-force password guessing)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per 15 minutes
  message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
});

// General API limiter
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  message: 'API rate limit exceeded. Please slow down your requests.',
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
};
