import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IFoodItem {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate: Date;
  minQuantity: number;
  lastRestocked: Date;
  supplier?: string;
  location?: string;
  user?: Types.ObjectId;
  isExpired?: boolean;
  daysUntilExpiry?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFoodItemDocument extends IFoodItem, Document {}

export interface IFoodItemModel extends Model<IFoodItemDocument> {
  findExpiringSoon(days?: number): Promise<IFoodItemDocument[]>;
}

const foodItemSchema = new Schema<IFoodItemDocument, IFoodItemModel>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['g', 'kg', 'ml', 'l', 'pcs', 'boxes', 'bottles', 'packets'],
    default: 'pcs'
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Dairy', 'Meat', 'Vegetables', 'Fruits', 'Beverages', 
      'Snacks', 'Grains', 'Condiments', 'Bakery', 'Frozen', 
      'Canned Goods', 'Deli', 'Seafood', 'Desserts', 'Other'
    ],
    default: 'Other'
  },
  expiryDate: {
    type: Date,
    required: true
  },
  minQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  supplier: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  daysUntilExpiry: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
foodItemSchema.index({ expiryDate: 1 });
foodItemSchema.index({ user: 1, category: 1 });

// Virtual for checking if item is low in stock
foodItemSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minQuantity;
});

// Method to find items expiring soon
foodItemSchema.statics.findExpiringSoon = async function(days = 7) {
  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setDate(today.getDate() + days);
  
  return this.find({
    expiryDate: { $lte: expiryDate, $gte: today }
  });
};

// Pre-save hook to update isExpired and daysUntilExpiry
foodItemSchema.pre<IFoodItemDocument>('save', function(next) {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const timeDiff = expiry.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  this.isExpired = daysDiff < 0;
  this.daysUntilExpiry = daysDiff < 0 ? 0 : daysDiff;
  
  next();
});

const FoodItem = model<IFoodItemDocument, IFoodItemModel>('FoodItem', foodItemSchema);

export default FoodItem;
