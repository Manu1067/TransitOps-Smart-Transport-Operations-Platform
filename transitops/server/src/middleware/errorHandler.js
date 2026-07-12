const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Express error-handling middleware.
 *
 * @param {Error & { status?: number, statusCode?: number }} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isDevelopment) {
    console.error('[TransitOps Error]', {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      message: err.message,
      stack: err.stack,
    });
  } else {
    console.error('[TransitOps Error]', {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      message: err.message,
    });
  }

  const message = isServerError && !isDevelopment
    ? 'Internal server error.'
    : (err.message || 'Internal server error.');

  const error = isDevelopment
    ? (err.stack || err.message || 'Unknown error')
    : (isServerError ? 'Internal server error.' : (err.message || 'Request failed.'));

  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
}

module.exports = errorHandler;
