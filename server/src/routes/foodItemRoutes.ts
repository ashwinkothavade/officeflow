import express from 'express';
import {
  getFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getFoodItemStats
} from '../controllers/foodItemController';

const router = express.Router();

// All endpoints are public
router.route('/')
  .get(getFoodItems)
  .post(createFoodItem);

router.route('/:id')
  .patch(updateFoodItem)
  .delete(deleteFoodItem);

router.route('/stats').get(getFoodItemStats);

export default router;
