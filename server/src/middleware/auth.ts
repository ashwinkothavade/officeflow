import { Response, NextFunction, Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthenticatedRequest, JwtPayload } from '../types/express';

// Custom type for async request handlers
type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

// Helper to convert AsyncRequestHandler to Express RequestHandler
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => 
  (req, res, next) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
    return undefined;
  };

// Helper to handle responses in a type-safe way
const sendError = (res: Response, status: number, message: string) => {
  res.status(status).json({ success: false, message });
  return undefined;
};

// Protect routes - require authentication
export const protect: RequestHandler = (req, res, next) => {
  const handleError = (message: string) => {
    sendError(res, 401, message);
    return undefined;
  };

  let token: string | undefined;
  
  // Get token from header or cookie
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return handleError('Not authorized, no token');
  }

  const verifyToken = async () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret not configured');
    }
    
    const decoded = jwt.verify(token as string, secret) as JwtPayload;
    
    // Get user from the token
    const user = await User.findById(decoded.id).select('-password').lean().exec();
    
    if (!user) {
      return handleError('User not found');
    }
    
    // Convert the user to a plain object and ensure it has the correct type
    const userObj = user.toObject ? user.toObject() : user;
    (req as AuthenticatedRequest).user = userObj as unknown as AuthenticatedRequest['user'];
    next();
    return undefined;
  };

  verifyToken().catch(() => {
    handleError('Not authorized, token failed');
  });
};

// Authorize based on user role
export const authorize = (...allowedRoles: string[]): RequestHandler => 
  (req, res, next) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return sendError(res, 401, 'Not authorized to access this route');
    }

    if (!allowedRoles.includes(user.role)) {
      return sendError(res, 403, 'You are not authorized to perform this action');
    }

    next();
    return undefined;
  };

// Middleware to check if user is admin
export const isAdmin: RequestHandler = (req, res, next) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return sendError(res, 401, 'Not authorized to access this route');
  }

  if (user.role !== 'admin') {
    return sendError(res, 403, 'Not authorized to access this route as admin');
  }

  next();
  return undefined;
};
