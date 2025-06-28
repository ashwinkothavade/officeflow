import { Types } from 'mongoose';
import { Response, NextFunction } from 'express';
import User, { UserRole, IUserDocument } from '../models/User';
import { protect } from '../middleware/auth';
import { requireAdmin, protectUserRole } from '../middleware/admin';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import { AuthenticatedRequest } from '../types/express';

// Custom type for async request handlers with proper typing
type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<Response | void> | Response | void;

// Extend the user document with role and _id
type AuthenticatedUser = IUserDocument & {
  _id: Types.ObjectId;
  role: UserRole;
  name: string;
  email: string;
  save: () => Promise<AuthenticatedUser>;
};

// Remove the duplicate Request extension since we're importing it from types/express

// Update user role
const updateUserRoleHandler: AsyncRequestHandler = async (req, res, next) => {
  try {
    const { role } = req.body as { role: UserRole };
    const { id } = req.params;
    const currentUser = req.user as IUserDocument;

    // Validate role
    if (!['user', 'admin', 'manager'].includes(role)) {
      return next(new ErrorResponse('Invalid role', 400));
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return next(new ErrorResponse('Invalid user ID', 400));
    }

    // Check if user is trying to modify themselves
    if (req.user?._id.toString() === id) {
      return next(new ErrorResponse('Cannot modify your own role', 403));
    }

    // Find the target user
    const targetUser = await User.findById(id) as AuthenticatedUser | null;
    if (!targetUser) {
      return next(new ErrorResponse(`User not found with id of ${id}`, 404));
    }

    // Prevent modifying admin users
    if (targetUser.role === 'admin') {
      if (currentUser.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to modify admin users', 403));
      }
      return next(new ErrorResponse('Cannot modify role of another admin', 403));
    }

    // Update the user's role
    targetUser.role = role;
    await targetUser.save();

    // Return the updated user without sensitive data
    const { password, ...userData } = targetUser.toObject();
    
    res.status(200).json({
      success: true,
      data: userData,
      message: 'User role updated successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorResponse(error.message, 500));
    }
    next(new ErrorResponse('Server error', 500));
  }
};

// Get all users
const getUsersHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-password -__v');
  
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Get single user
const getUserHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return next(new ErrorResponse('User ID is required', 400));
    }
    
    const user = await User.findById(userId).select('-password -__v');
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Export route handlers with middleware
export const updateUserRole = [
  protect as any, // Bypass type checking for middleware
  requireAdmin as any,
  protectUserRole as any,
  asyncHandler(updateUserRoleHandler as any)
];

// Get all users (only name, email, role, and _id)
export const getUsers = [
  protect as any, // Bypass type checking for middleware
  requireAdmin as any,
  asyncHandler(async (req, res, next) => {
    const users = await User.find({}, 'name email role') as Array<{
      _id: Types.ObjectId;
      name: string;
      email: string;
      role: UserRole;
    }>;
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  })
];

// Get single user by ID (only name, email, role, and _id)
export const getUser = [
  protect as any, // Bypass type checking for middleware
  requireAdmin as any,
  asyncHandler(async (req, res, next) => {
    const userId = (req as any).params?.id;
    if (!userId) {
      return next(new ErrorResponse('User ID is required', 400));
    }
    
    const user = await User.findById(userId, 'name email role') as {
      _id: Types.ObjectId;
      name: string;
      email: string;
      role: UserRole;
    } | null;
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  })
];
