import { Router, Request, Response, NextFunction } from 'express';
import { register, login, logout, getUserProfile } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate, validationRules } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimit';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// Public routes
router.post(
  '/register',
  validate(validationRules.register),
  asyncHandler(register)
);

router.post(
  '/login',
  validate(validationRules.login),
  asyncHandler(login)
);

// Protected routes
router.use(protect);

router.get('/profile', asyncHandler(getUserProfile));
router.post('/logout', asyncHandler(logout));

export default router;
