import { IUser, IUserDocument, UserRole } from '../../models/User';
import { Types } from 'mongoose';
import { Request as ExpressRequest, Response, NextFunction } from 'express';

// Extend the Express namespace to include our custom properties
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument & {
        _id: Types.ObjectId;
        role: UserRole;
      };
    }
  }
}

// Export the authenticated request type with all necessary properties
export interface AuthenticatedRequest extends ExpressRequest {
  user: IUserDocument & {
    _id: Types.ObjectId;
    role: UserRole;
  };
}

// Type for our async route handlers
export type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

// Type for our route handlers that works with Express
export interface RequestHandler {
  (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> | void;
}

// Type for JWT payload
export interface JwtPayload {
  id: string;
  [key: string]: any;
}
