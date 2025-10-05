const db = require('../config/database');

const idempotencyStore = new Map();

const checkIdempotency = (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  if (!idempotencyKey) {
    return next();
  }

  // Check if we've seen this key before
  if (idempotencyStore.has(idempotencyKey)) {
    const cachedResponse = idempotencyStore.get(idempotencyKey);
    return res.status(cachedResponse.status).json(cachedResponse.data);
  }

  // Store the original res.json method
  const originalJson = res.json;
  
  // Override res.json to cache the response
  res.json = function(data) {
    // Cache the response for this idempotency key
    idempotencyStore.set(idempotencyKey, {
      status: res.statusCode,
      data: data
    });
    
    // Call the original json method
    return originalJson.call(this, data);
  };

  next();
};

module.exports = { checkIdempotency };
