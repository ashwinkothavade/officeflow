import { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to automatically catch errors and pass them to Express's error handling middleware
 * @param fn Async route handler function
 * @returns Async route handler with error handling
 */
const asyncHandler = <T = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any> | any
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as T, res, next)).catch(next);
  };
};

export default asyncHandler;
