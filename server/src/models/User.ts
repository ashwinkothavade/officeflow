import { Schema, model, Document, Model } from 'mongoose';

// User role type
export type UserRole = 'user' | 'admin' | 'manager';

// Interface for the User document
export interface IUser {
  firebaseUid?: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  photoURL?: string;
  department?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for the User document with instance methods
export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  isAdmin: boolean;
}

// Interface for the User model
export interface IUserModel extends Model<IUserDocument> {}

// Define the schema
const userSchema = new Schema<IUserDocument, IUserModel>({
  firebaseUid: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    index: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: function() {
      return !this.firebaseUid; // Required only if not using Firebase
    },
    minlength: 6,
    select: false // Don't return password by default
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  photoURL: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Add virtual for isAdmin
userSchema.virtual('isAdmin').get(function(this: IUserDocument) {
  return this.role === 'admin';
});

// Add method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // For Firebase authentication, we don't store passwords in the database
  // So this is a placeholder that will always return true
  // In a real app with email/password auth, you would compare the hashed passwords here
  return true;
};

// Create and export the model
const User = model<IUserDocument, IUserModel>('User', userSchema);

export default User;
