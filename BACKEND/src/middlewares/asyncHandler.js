

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 * This eliminates the need for try-catch in every controller
 * 
 * Usage:
 * router.post('/route', asyncHandler(async (req, res) => {
 *   // Your async code here
 * }));
 */

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;