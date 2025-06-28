import { Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import User, { IUserDocument, UserRole } from '../models/User';
import { AuthenticatedRequest, JwtPayload } from '../types/express';

// Define the shape of the user data we'll be working with
interface IAuthUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  comparePassword?: (password: string) => Promise<boolean>;
  toObject?: () => any;
}

// Helper function to send error responses
const sendError = (res: Response, status: number, message: string) => {
  res.status(status).json({ success: false, message });
  return undefined;
};

// Extend the user document with role and _id
type AuthenticatedUser = IUserDocument & {
  _id: Types.ObjectId;
  role: UserRole;
  name: string;
  email: string;
  comparePassword: (password: string) => Promise<boolean>;
};

// Generate JWT Token
const generateToken = (id: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      sendError(res, 400, 'Please provide name, email and password');
      return;
    }

    // Check if user already exists
    const userExists = await User.findOne({ email }).exec();
    if (userExists) {
      sendError(res, 400, 'User already exists');
      return;
    }

    // Create user with default 'user' role
    const newUser = await User.create({
      name,
      email,
      password,
      role: 'user' as const,
    });

    if (!newUser) {
      sendError(res, 400, 'Invalid user data');
      return;
    }

    // Convert to plain object and type it
    const user = (newUser.toObject ? newUser.toObject() : newUser) as IAuthUser;

    // Generate token
    const userId = user._id?.toString();
    if (!userId) {
      throw new Error('User ID is missing');
    }
    const token = generateToken(userId);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, 500, 'Server error during registration');
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      sendError(res, 400, 'Please provide email and password');
      return;
    }

    // Check for user
    const userDoc = await User.findOne({ email }).select('+password').exec();
    if (!userDoc) {
      sendError(res, 401, 'Invalid credentials');
      return;
    }
    
    // Convert to plain object and type it
    const user = (userDoc.toObject ? userDoc.toObject() : userDoc) as IAuthUser;

    // Check if password matches
    if (!user.comparePassword) {
      sendError(res, 500, 'Authentication error - password comparison not available');
      return;
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      sendError(res, 401, 'Invalid credentials');
      return;
    }

    // Generate token
    const userId = user._id?.toString();
    if (!userId) {
      throw new Error('User ID is missing');
    }
    const token = generateToken(userId);

    // Send HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Create user data without sensitive information
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    };

    res.status(200).json({
      success: true,
      data: userData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 500, 'Server error during login');
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      sendError(res, 404, 'User not found');
      return;
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 500, 'Server error while fetching profile');
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req: Request, res: Response): void => {
  try {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 500, 'Server error during logout');
  }
};
