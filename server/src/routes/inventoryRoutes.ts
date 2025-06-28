import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { 
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventorySummary,
  getExpiringSoon
} from '../controllers/inventoryController';

const router = Router();

// Public routes for now - add authentication middleware later
router.get('/', asyncHandler(getInventory));
router.get('/summary', asyncHandler(getInventorySummary));
router.get('/expiring-soon', asyncHandler(getExpiringSoon));
router.get('/:id', asyncHandler(getInventoryItem));
router.post('/', asyncHandler(createInventoryItem));
router.put('/:id', asyncHandler(updateInventoryItem));
router.delete('/:id', asyncHandler(deleteInventoryItem));

export default router;
