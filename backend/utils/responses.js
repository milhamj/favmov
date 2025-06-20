/**
 * Standard success response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200, debugMessage = '') => {
  const env = process.env.NODE_ENV;
  if (env != 'development') {
      debugMessage = undefined
  }
  return res.status(statusCode).json({
    success: true,
    message,
    debugMessage,
    data
  });
};

/**
 * Standard error response
 */
const errorResponse = (res, message = 'Server Error', statusCode = 500, debugMessage = '') => {
  const env = process.env.NODE_ENV;
  if (env != 'development') {
      debugMessage = undefined
  }
  return res.status(statusCode).json({
    success: false,
    message,
    debugMessage
  });
};

module.exports = {
  successResponse,
  errorResponse
};