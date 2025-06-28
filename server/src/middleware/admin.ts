import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import User from '../models/User';
import ErrorResponse from '../utils/errorResponse';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    // Find the user in the database to get the latest role
    const user = await User.findById(req.user._id);
    
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized as an admin', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const protectUserRole = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if trying to modify another admin's role
    if (req.params.id && req.user && req.user.role === 'admin') {
      // If the target user is also an admin, prevent the change
      if (req.body.role && req.body.role !== 'admin') {
        return next(new ErrorResponse('Cannot change role of another admin', 403));
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
