import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware to log all incoming requests
 */
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Skip logging for health checks and favicon
  if (req.path === '/health' || req.path === '/favicon.ico') {
    return next();
  }

  const start = Date.now();
  const { method, originalUrl, ip } = req;
  const userAgent = req.get('user-agent') || '';

  // Log request details
  logger.info(`Request: ${method} ${originalUrl}`, {
    ip,
    userAgent,
    body: method !== 'GET' ? req.body : undefined,
    query: Object.keys(req.query).length ? req.query : undefined,
    params: Object.keys(req.params).length ? req.params : undefined,
  });

  // Log response details when the response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get('content-length') || 0;

    logger.info(`Response: ${method} ${originalUrl} ${statusCode}`, {
      statusCode,
      duration: `${duration}ms`,
      contentLength: `${contentLength}b`,
    });
  });

  next();
};

export default requestLogger;
