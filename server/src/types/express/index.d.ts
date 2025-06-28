import { IUser } from '../../models/User';
import { Types } from 'mongoose';
import { Request as ExpressRequest, Response, NextFunction, RequestHandler as ExpressRequestHandler } from 'express';

// Extend the Express namespace to include our custom properties
declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: Types.ObjectId };
    }
  }
}

// Export the authenticated request type with all necessary properties
export interface AuthenticatedRequest extends ExpressRequest {
  user: IUser & { _id: Types.ObjectId };
}

// Type for our async route handlers
export type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

// Type for our route handlers that works with Express
interface RequestHandler {
  (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> | void;
}
