const successResponse = (res, data, message = 'Success', statusCode = 200, debugMessage = '') => {
  const env = process.env.FAVMOV_NODE_ENV;
  if (env != 'development') {
    debugMessage = undefined;
  }
  return res.status(statusCode).json({
    success: true,
    message,
    debugMessage,
    data,
  });
};

const errorResponse = (res, message = 'Server Error', statusCode = 500, debugMessage = '') => {
  const env = process.env.FAVMOV_NODE_ENV;
  if (env != 'development') {
    debugMessage = undefined;
  }
  return res.status(statusCode).json({
    success: false,
    message,
    debugMessage,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
