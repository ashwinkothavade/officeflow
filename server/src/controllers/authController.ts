import { Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import User, { IUserDocument, UserRole } from '../models/User';
import { AuthenticatedRequest, JwtPayload } from '../types/express';
import { setSecureCookie, clearCookie } from '../utils/cookieUtils';

// Define the shape of the user data we'll be working with
interface IAuthUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  comparePassword?: (password: string) => Promise<boolean>;
  toObject?: () => any;
  photoURL?: string;
  firebaseUid?: string;
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
  photoURL?: string;
  firebaseUid?: string;
};

// Generate JWT Token
const generateToken = (id: string): string => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    throw new Error('Server configuration error');
  }
  
  try {
    return jwt.sign(
      { id },
      process.env.JWT_SECRET,
      { 
        expiresIn: '30d',
        algorithm: 'HS256',
        issuer: 'officeflow-api',
        audience: 'officeflow-web',
      }
    );
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, firebaseUid, role = 'user' } = req.body;

    // Validate input
    if (!name || !email) {
      sendError(res, 400, 'Please provide name and email');
      return;
    }

    // If this is a Firebase auth user, we don't need a password
    if (!firebaseUid && !password) {
      sendError(res, 400, 'Password is required');
      return;
    }

    // Check if user already exists by email or firebaseUid
    const existingUser = await User.findOne({
      $or: [
        { email },
        ...(firebaseUid ? [{ firebaseUid }] : [])
      ]
    }).exec();

    if (existingUser) {
      // If user exists with same email but different auth method
      if (existingUser.email === email) {
        sendError(res, 400, 'Email already in use');
        return;
      }
      // If user exists with same firebaseUid but different email (shouldn't happen)
      if (existingUser.firebaseUid === firebaseUid) {
        sendError(res, 400, 'User already exists');
        return;
      }
    }

    // Validate role
    const validRoles: UserRole[] = ['user', 'manager', 'admin'];
    if (role && !validRoles.includes(role)) {
      sendError(res, 400, 'Invalid role specified');
      return;
    }

    // Create user with specified role (defaults to 'user')
    const userData: any = {
      name,
      email,
      role: role as UserRole,
      ...(firebaseUid && { firebaseUid }),
      ...(password && { password }) // Only include password if provided
    };

    // For Firebase users, we don't store a password
    if (firebaseUid) {
      delete userData.password;
    }

    const newUser = await User.create(userData);

    if (!newUser) {
      sendError(res, 400, 'Invalid user data');
      return;
    }

    // Convert to plain object and type it
    const user = (newUser.toObject ? newUser.toObject() : newUser) as IAuthUser;

    // Generate token with user ID
    const token = generateToken(user._id.toString());
    
    if (!token) {
      throw new Error('Failed to generate authentication token');
    }

    // Set secure cookie using our utility
    setSecureCookie(res, 'token', token);
    
    // Also set the token in the response header for API clients
    res.setHeader('Authorization', `Bearer ${token}`);

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
    const { email, password, firebaseUid } = req.body;

    // Validate input
    if (!email) {
      sendError(res, 400, 'Please provide an email');
      return;
    }

    let userDoc;

    // Check if this is a Firebase login
    if (firebaseUid) {
      userDoc = await User.findOne({ firebaseUid }).exec();
      
      // If no user found with this firebaseUid, try to find by email and update
      if (!userDoc) {
        userDoc = await User.findOne({ email }).exec();
        
        // If user exists but doesn't have firebaseUid, update it
        if (userDoc) {
          userDoc.firebaseUid = firebaseUid;
          await userDoc.save();
        }
      }
    } else {
      // Traditional email/password login
      if (!password) {
        sendError(res, 400, 'Password is required');
        return;
      }
      
      userDoc = await User.findOne({ email }).select('+password').exec();
      
      if (userDoc) {
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
      }
    }
    
    // Check if user exists
    if (!userDoc) {
      sendError(res, 401, 'Invalid credentials');
      return;
    }

    // Convert to plain object and type it
    const user = (userDoc.toObject ? userDoc.toObject() : userDoc) as IAuthUser;

    // Generate token with user ID
    const token = generateToken(user._id.toString());
    
    if (!token) {
      throw new Error('Failed to generate authentication token');
    }

    // Set secure cookie using our utility
    setSecureCookie(res, 'token', token);
    
    // Also set the token in the response header for API clients
    res.setHeader('Authorization', `Bearer ${token}`);

    // Send response
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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
// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, photoURL, firebaseUid } = req.body;

    // Validate input
    if (!email || !firebaseUid) {
      sendError(res, 400, 'Missing required fields');
      return;
    }

    // Check if user already exists by firebaseUid or email
    let user = await User.findOne({ firebaseUid });
    
    if (!user) {
      // Try to find by email if not found by firebaseUid
      user = await User.findOne({ email });
      
      if (user) {
        // Update existing user with firebaseUid
        user.set('firebaseUid', firebaseUid);
        if (photoURL) user.set('photoURL', photoURL);
      } else {
        // Create new user
        user = new User({
          name: name || email.split('@')[0],
          email,
          firebaseUid,
          role: 'user', // Default role
          ...(photoURL && { photoURL })
        });
      }
      
      await user.save();
    }

    // Generate token
    const userId = (user as any)._id?.toString();
    if (!userId) {
      throw new Error('User ID is missing');
    }
    const token = generateToken(userId);

    // Set secure cookie using our utility
    setSecureCookie(res, 'token', token);
    
    // Also set the token in the response header for API clients
    res.setHeader('Authorization', `Bearer ${token}`);

    // Send response
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    sendError(res, 500, 'Server error during Google authentication');
  }
};

export const logout = (req: Request, res: Response): void => {
  try {
    // Use our utility to clear the cookie
    clearCookie(res, 'token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 500, 'Server error during logout');
  }
};
