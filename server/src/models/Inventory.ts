import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInventoryItem extends Document {
  name: string;
  description?: string;
  category: 'food' | 'beverage' | 'supplies' | 'other';
  quantity: number;
  unit: string; // e.g., 'pcs', 'kg', 'liters', 'boxes'
  pricePerUnit: number;
  expiryDate?: Date;
  minStockLevel: number;
  supplier?: string;
  lastRestocked: Date;
  location?: string;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isAboutToExpire(days?: number): boolean;
  isLowInStock(): boolean;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['food', 'beverage', 'supplies', 'other'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['pcs', 'kg', 'g', 'liters', 'ml', 'boxes', 'packets', 'bottles', 'cans'],
      default: 'pcs'
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0
    },
    expiryDate: {
      type: Date
    },
    minStockLevel: {
      type: Number,
      default: 5,
      min: 0
    },
    supplier: {
      type: String,
      trim: true
    },
    lastRestocked: {
      type: Date,
      default: Date.now
    },
    location: {
      type: String,
      trim: true
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    }
  },
  { timestamps: true }
);

// Index for faster queries on commonly searched fields
inventoryItemSchema.index({ name: 'text', description: 'text', category: 1 });

// Add a pre-save hook to update lastRestocked when quantity increases
inventoryItemSchema.pre('save', function(next) {
  if (this.isModified('quantity')) {
    // Get the current document before the update
    const Model = this.constructor as mongoose.Model<IInventoryItem>;
    Model.findById(this._id)
      .then((doc: IInventoryItem | null) => {
        // If quantity has increased, update lastRestocked
        if (doc && this.quantity > doc.quantity) {
          this.lastRestocked = new Date();
        }
        next();
      })
      .catch((err: Error) => {
        console.error('Error in pre-save hook:', err);
        next(err);
      });
  } else {
    next();
  }
});

// Add a method to check if item is about to expire (within 7 days)
inventoryItemSchema.methods.isAboutToExpire = function(days = 7): boolean {
  if (!this.expiryDate) return false;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays >= 0;
};

// Add a method to check if item is low in stock
inventoryItemSchema.methods.isLowInStock = function(): boolean {
  return this.quantity <= this.minStockLevel;
};

const Inventory = mongoose.model<IInventoryItem>('Inventory', inventoryItemSchema);

export default Inventory;
