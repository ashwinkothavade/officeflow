import { Router } from 'express';
import { register, login, logout, getUserProfile } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate, validationRules } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// Public routes
router.post(
  '/register',
  validate(validationRules.register),
  (req, res) => register(req, res)
);

router.post(
  '/login',
  validate(validationRules.login),
  (req, res) => login(req, res)
);

// Protected routes
router.get('/profile', protect, (req, res) => getUserProfile(req, res));
router.post('/logout', protect, (req, res) => logout(req, res));

export default router;
