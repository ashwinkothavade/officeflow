import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { updateUserRole, getUsers, getUser } from '../controllers/userController';

const router = Router();

// All routes below are protected and require admin access
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUser);

router.route('/:id/role')
  .put(updateUserRole);

export default router;
