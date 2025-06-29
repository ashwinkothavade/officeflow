import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import FoodItem, { IFoodItem } from '../models/FoodItem';
import ErrorResponse from '../utils/errorResponse';

class BadRequestError extends ErrorResponse {
  constructor(message: string) {
    super(message, 400);
  }
}

class NotFoundError extends ErrorResponse {
  constructor(message: string) {
    super(message, 404);
  }
}

// @desc    Get all food items
// @route   GET /api/food-items
// @access  Public
export const getFoodItems = async (req: Request, res: Response) => {
  const { category, expiringSoon } = req.query;
  const query: any = {};

  if (category && category !== 'all') {
    query.category = category;
  }

  if (expiringSoon === 'true') {
    const items = await FoodItem.findExpiringSoon(7);
    return res.status(StatusCodes.OK).json({ items });
  }

  const items = await FoodItem.find(query).sort('expiryDate');
  res.status(StatusCodes.OK).json({ items, count: items.length });
};

// @desc    Create food item
// @route   POST /api/food-items
// @access  Public
export const createFoodItem = async (req: Request, res: Response) => {
  const { name, description, quantity, unit, category, expiryDate, minQuantity, supplier, location } = req.body;
  
  if (!name || !quantity || !unit || !category || !expiryDate) {
    throw new BadRequestError('Please provide all required fields');
  }

  const foodItem = await FoodItem.create({
    name,
    description,
    quantity,
    unit,
    category,
    expiryDate,
    minQuantity: minQuantity || 0,
    supplier,
    location,
  });

  res.status(StatusCodes.CREATED).json({ foodItem });
};

// @desc    Update food item
// @route   PATCH /api/food-items/:id
// @access  Public
export const updateFoodItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, quantity, unit, category, expiryDate, minQuantity, supplier, location } = req.body;

  const foodItem = await FoodItem.findById(id);

  if (!foodItem) {
    throw new NotFoundError(`No food item found with id ${id}`);
  }

  const updates = {
    name: name || foodItem.name,
    description: description !== undefined ? description : foodItem.description,
    quantity: quantity || foodItem.quantity,
    unit: unit || foodItem.unit,
    category: category || foodItem.category,
    expiryDate: expiryDate || foodItem.expiryDate,
    minQuantity: minQuantity !== undefined ? minQuantity : foodItem.minQuantity,
    supplier: supplier !== undefined ? supplier : foodItem.supplier,
    location: location !== undefined ? location : foodItem.location,
  };

  const updatedItem = await FoodItem.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ foodItem: updatedItem });
};

// @desc    Delete food item
// @route   DELETE /api/food-items/:id
// @access  Public
export const deleteFoodItem = async (req: Request, res: Response) => {
  const { id } = req.params;

  const foodItem = await FoodItem.findByIdAndDelete(id);

  if (!foodItem) {
    throw new NotFoundError(`No food item found with id ${id}`);
  }

  res.status(StatusCodes.OK).json({ success: true, data: {} });
};

// @desc    Get food item stats
// @route   GET /api/food-items/stats
// @access  Public
export const getFoodItemStats = async (req: Request, res: Response) => {
  const stats = await FoodItem.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        expiredItems: {
          $sum: {
            $cond: [{ $lt: ['$expiryDate', new Date()] }, 1, 0]
          }
        },
        expiringSoon: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ['$expiryDate', new Date()] },
                  { $lt: ['$expiryDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] }]
              },
              1,
              0
            ]
          }
        },
        lowStock: {
          $sum: {
            $cond: [
              { $lte: ['$quantity', '$minQuantity'] },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get total counts
  const totalItems = stats.reduce((acc, curr) => acc + curr.totalItems, 0);
  const expiredItems = stats.reduce((acc, curr) => acc + (curr.expiredItems || 0), 0);
  const expiringSoon = stats.reduce((acc, curr) => acc + (curr.expiringSoon || 0), 0);
  const lowStock = stats.reduce((acc, curr) => acc + (curr.lowStock || 0), 0);

  res.status(StatusCodes.OK).json({
    stats,
    summary: {
      totalItems,
      expiredItems,
      expiringSoon,
      lowStock
    }
  });
};
