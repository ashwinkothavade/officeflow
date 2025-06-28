import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrap async/await route handlers to automatically catch errors
 * and pass them to Express error handling middleware
 */
const asyncHandler = (fn: RequestHandler) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
