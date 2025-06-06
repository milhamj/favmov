/**
 * Async handler to wrap async route handlers
 * @param {Function} fn - Async function to execute
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;