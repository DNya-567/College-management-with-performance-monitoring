/**
 * Async Error Wrapper Utility
 *
 * Wraps async route handlers to catch errors and pass them to Express error handler
 * This ensures all promise rejections are properly caught and logged
 *
 * Usage:
 * router.get('/endpoint', asyncHandler(async (req, res) => { ... }))
 */

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Pass error to Express error handler middleware
      next(error);
    });
  };
};

module.exports = asyncHandler;

