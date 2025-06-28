import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import User, { IUser, IUserDocument } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: Types.ObjectId };
    }
  }
}

export const protect: RequestHandler = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Not authorized, no token' });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      // Get user and attach to request
      const user = await User.findById(decoded.id).select('-password').lean().exec();
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }
      
      // Type assertion to IUser since we've excluded password
      req.user = user as unknown as IUser & { _id: Types.ObjectId };
      next();
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        return;
      }
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    const user = req.user as IUser | undefined;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: `User role ${user.role} is not authorized to access this route`
      });
      return;
    }
    
    next();
  };
};
