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
export const protect: RequestHandler = async (req, res, next) => {
  const handleError = (message: string, status = 401) => {
    console.error('Auth error:', message);
    return sendError(res, status, message);
  };

  try {
    let token: string | undefined;
    
    // Log incoming request headers for debugging
    console.log('Auth headers:', {
      authorization: !!req.headers.authorization,
      cookies: !!req.cookies,
      cookieHeader: req.headers.cookie ? 'present' : 'missing'
    });
    
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('Using token from Authorization header');
    } else if (req.cookies?.token) {
      token = req.cookies.token;
      console.log('Using token from cookie');
    } else if (req.headers.cookie) {
      // Try to parse the cookie header manually
      const cookies = req.headers.cookie.split(';').reduce((acc: Record<string, string>, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      
      if (cookies.token) {
        token = cookies.token;
        console.log('Using token from parsed cookie header');
      }
    }

    if (!token) {
      return handleError('Not authorized, no token provided');
    }

    // Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return handleError('Server configuration error', 500);
    }
    
    try {
      // Verify and decode the token with the same options used for signing
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'officeflow-api',
        audience: 'officeflow-web',
      }) as JwtPayload;
      
      if (!decoded?.id) {
        console.error('Invalid token payload:', { decoded });
        return handleError('Invalid token payload');
      }
      
      console.log('Decoded token:', { 
        id: decoded.id, 
        exp: decoded.exp,
        iat: decoded.iat,
        issuer: decoded.iss,
        audience: decoded.aud 
      });
      
      // Get user from the token
      const user = await User.findById(decoded.id).select('-password').lean().exec();
      
      if (!user) {
        console.error('User not found for token:', { userId: decoded.id });
        return handleError('User not found');
      }
      
      // Convert to plain object if needed
      const userObj = user.toObject ? user.toObject() : user;
      
      // Add user to request object
      (req as AuthenticatedRequest).user = {
        ...userObj,
        _id: userObj._id.toString(),
      };
      
      // Log successful authentication for debugging
      console.log(`User authenticated: ${userObj.email} (${userObj.role})`);
      
      next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      
      if (verifyError instanceof jwt.TokenExpiredError) {
        return handleError('Token has expired', 401);
      } else if (verifyError instanceof jwt.JsonWebTokenError) {
        return handleError('Invalid token', 401);
      } else if (verifyError instanceof Error) {
        return handleError(`Token verification failed: ${verifyError.message}`, 401);
      }
      
      return handleError('Not authorized, token verification failed');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return handleError('Authentication failed');
  }
};

// Authorize based on user role
export const authorize = (...allowedRoles: string[]): RequestHandler => 
  (req, res, next) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      console.error('Authorization failed: No user in request');
      return sendError(res, 401, 'Not authorized to access this route');
    }

    if (!allowedRoles.includes(user.role)) {
      console.error(`Authorization failed: User role ${user.role} not in allowed roles`, { 
        allowedRoles,
        userId: user._id,
        email: user.email 
      });
      return sendError(res, 403, 'You are not authorized to perform this action');
    }

    next();
    return undefined;
  };

// Middleware to check if user is admin
export const isAdmin: RequestHandler = (req, res, next) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    console.error('Admin check failed: No user in request');
    return sendError(res, 401, 'Not authorized to access this route');
  }

  if (user.role !== 'admin') {
    console.error(`Admin check failed: User ${user.email} is not an admin`);
    return sendError(res, 403, 'Not authorized to access this route as admin');
  }

  next();
  return undefined;
};
