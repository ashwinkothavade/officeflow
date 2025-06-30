import { Request, Response, NextFunction } from 'express';
import Vendor from '../models/Vendor';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Public
export const getVendors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Public
export const getVendor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return next(new ErrorResponse(`Vendor not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new vendor
// @route   POST /api/vendors
// @access  Private
export const addVendor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private
export const updateVendor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!vendor) {
      return next(new ErrorResponse(`Vendor not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private
export const deleteVendor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return next(new ErrorResponse(`Vendor not found with id of ${req.params.id}`, 404));
    }

    await vendor.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
