import { Router } from 'express';
import {
  getVendors,
  getVendor,
  addVendor,
  updateVendor,
  deleteVendor
} from '../controllers/vendorController';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.route('/').get(getVendors);
router.route('/:id').get(getVendor);

// Protected routes
router.use(protect);
router.route('/').post(addVendor);
router.route('/:id').put(updateVendor).delete(deleteVendor);

export default router;
