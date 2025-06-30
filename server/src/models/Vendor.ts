import { Schema, model, Document } from 'mongoose';

export interface IVendor {
  name: string;
  email: string;
  mobileNumber: string;
  category: string;
  address?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVendorDocument extends IVendor, Document {}

const vendorSchema = new Schema<IVendorDocument>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default model<IVendorDocument>('Vendor', vendorSchema);
