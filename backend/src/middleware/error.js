import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

export const notFound = (req, _res, next) => next(ApiError.notFound(`Route ${req.originalUrl} not found`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  if (err.name === 'ValidationError') { statusCode = 400; message = err.message; }
  if (err.name === 'CastError') { statusCode = 400; message = `Invalid ${err.path}`; }
  if (err.code === 11000) { statusCode = 409; message = `Duplicate value: ${Object.keys(err.keyValue || {}).join(', ')}`; }
  if (statusCode >= 500) logger.error(`${statusCode} ${message} ${err.stack || ''}`);
  res.status(statusCode).json({
    success: false,
    message,
    ...(err.details && { details: err.details }),
    ...(config.env === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
};
