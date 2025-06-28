import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Inventory, { IInventoryItem } from '../models/Inventory';

// Extend Express Request type for our routes
declare global {
  namespace Express {
    interface Request {
      inventoryItem?: IInventoryItem;
    }
  }
}

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, lowStock, expiringSoon } = req.query;
    
    const query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (lowStock === 'true') {
      query.quantity = { $lte: 10 }; // Adjust threshold as needed
    }
    
    const items = await Inventory.find(query).sort({ name: 1 });
    
    // Filter for expiring soon if needed
    let result = items;
    if (expiringSoon === 'true') {
      result = items.filter(item => item.isAboutToExpire());
    }
    
    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
export const getInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private
export const createInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      category,
      quantity,
      unit,
      pricePerUnit,
      expiryDate,
      minStockLevel,
      supplier,
      location,
      barcode
    } = req.body;

    const item = new Inventory({
      name,
      description,
      category,
      quantity: Number(quantity) || 0,
      unit,
      pricePerUnit: Number(pricePerUnit) || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      minStockLevel: Number(minStockLevel) || 5,
      supplier,
      location,
      barcode,
      lastRestocked: new Date()
    });

    const createdItem = await item.save();

    res.status(201).json({
      success: true,
      data: createdItem
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    next(error);
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private
export const updateInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      category,
      quantity,
      unit,
      pricePerUnit,
      expiryDate,
      minStockLevel,
      supplier,
      location,
      barcode
    } = req.body;

    const updateData: any = {
      name,
      description,
      category,
      unit,
      supplier,
      location,
      barcode
    };

    if (quantity !== undefined) {
      updateData.quantity = Number(quantity);
    }
    
    if (pricePerUnit !== undefined) {
      updateData.pricePerUnit = Number(pricePerUnit);
    }
    
    if (expiryDate !== undefined) {
      updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }
    
    if (minStockLevel !== undefined) {
      updateData.minStockLevel = Number(minStockLevel);
    }

    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    next(error);
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
export const deleteInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory summary
// @route   GET /api/inventory/summary
// @access  Private
export const getInventorySummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalItems, lowStockItems, expiringSoon, byCategory] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments({ quantity: { $lte: 5 } }), // Adjust threshold as needed
      Inventory.find({ expiryDate: { $ne: null, $gte: new Date() } })
        .then(items => items.filter(item => item.isAboutToExpire(30))), // Items expiring in next 30 days
      Inventory.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$quantity', '$pricePerUnit'] } }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalItems,
        lowStockItems,
        expiringSoon: expiringSoon.length,
        byCategory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get items expiring soon
// @route   GET /api/inventory/expiring-soon
// @access  Private
export const getExpiringSoon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(Number(days) || 30, 90); // Cap at 90 days
    
    // Find items with expiry date in the future
    const items = await Inventory.find({
      expiryDate: { $ne: null, $gte: new Date() }
    });
    
    // Filter items expiring within the specified days
    const expiringItems = items.filter(item => {
      if (!item.expiryDate) return false;
      const today = new Date();
      const expiry = new Date(item.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= daysNum && diffDays >= 0;
    });
    
    res.json({
      success: true,
      count: expiringItems.length,
      data: expiringItems
    });
  } catch (error) {
    next(error);
  }
};
