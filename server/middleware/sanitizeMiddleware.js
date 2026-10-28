/**
 * NoSQL Injection Sanitization Middleware
 * Recursively inspects req.body, req.query, and req.params and removes
 * any object keys starting with '$' or containing '.' (MongoDB operators and dot-notation paths).
 */

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  // Handle plain objects
  const cleanObj = {};
  for (const [key, value] of Object.entries(obj)) {
    // Prohibit keys starting with '$' (e.g. $gt, $ne, $where) or containing '.'
    if (key.startsWith('$') || key.includes('.')) {
      // Omit prohibited key
      continue;
    }

    if (value && typeof value === 'object') {
      cleanObj[key] = sanitizeObject(value);
    } else {
      cleanObj[key] = value;
    }
  }

  return cleanObj;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

module.exports = {
  sanitizeMiddleware,
  sanitizeObject,
};
