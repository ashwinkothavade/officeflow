import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';

// Load environment variables
dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/officeflow');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Grant admin role to a user by email
const grantAdmin = async (email: string) => {
  try {
    console.log(`Attempting to grant admin access to: ${email}`);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }
    
    // Check if already admin
    if (user.role === 'admin') {
      console.log(`ℹ️ User ${email} is already an admin`);
      process.exit(0);
    }
    
    // Update user role to admin
    user.role = 'admin';
    await user.save();
    
    console.log(`✅ Successfully granted admin access to: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    process.exit(1);
  }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: ts-node scripts/grantAdmin.ts user@example.com');
  process.exit(1);
}

// Run the script
(async () => {
  await connectDB();
  await grantAdmin(email);
  process.exit(0);
})();
