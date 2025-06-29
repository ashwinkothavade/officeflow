import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FoodItem, { IFoodItem } from '../src/models/FoodItem';
import User from '../src/models/User';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/officeflow';

// Sample food items data
const sampleFoodItems: Omit<IFoodItem, 'user' | 'isExpired' | 'daysUntilExpiry'>[] = [
  {
    name: 'Milk',
    description: 'Fresh whole milk',
    quantity: 2,
    unit: 'l',
    category: 'dairy',
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    minQuantity: 1,
    lastRestocked: new Date(),
    supplier: 'Local Dairy',
    location: 'Fridge 1, Shelf 2'
  },
  {
    name: 'Eggs',
    description: 'Large free-range eggs',
    quantity: 12,
    unit: 'pcs',
    category: 'dairy',
    expiryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    minQuantity: 6,
    lastRestocked: new Date(),
    supplier: 'Happy Hens Farm',
    location: 'Fridge 1, Door'
  },
  {
    name: 'Chicken Breast',
    description: 'Boneless skinless chicken breast',
    quantity: 1.5,
    unit: 'kg',
    category: 'meat',
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    minQuantity: 0.5,
    lastRestocked: new Date(),
    location: 'Freezer 1, Drawer 1'
  },
  {
    name: 'Tomatoes',
    description: 'Organic cherry tomatoes',
    quantity: 0.5,
    unit: 'kg',
    category: 'vegetables',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    minQuantity: 0.2,
    lastRestocked: new Date(),
    location: 'Fridge 2, Crisper'
  },
  {
    name: 'Apples',
    description: 'Red delicious apples',
    quantity: 2,
    unit: 'kg',
    category: 'fruits',
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    minQuantity: 1,
    lastRestocked: new Date(),
    location: 'Pantry, Fruit Bowl'
  },
  {
    name: 'Mineral Water',
    description: '500ml bottles',
    quantity: 24,
    unit: 'bottles',
    category: 'beverages',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    minQuantity: 12,
    lastRestocked: new Date(),
    supplier: 'AquaPure',
    location: 'Pantry, Bottom Shelf'
  },
  {
    name: 'Potato Chips',
    description: 'Sea salt flavor',
    quantity: 5,
    unit: 'packets',
    category: 'snacks',
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    minQuantity: 3,
    lastRestocked: new Date(),
    supplier: 'Crispy Chips Co.',
    location: 'Pantry, Snack Shelf'
  },
  {
    name: 'Rice',
    description: 'Basmati rice',
    quantity: 5,
    unit: 'kg',
    category: 'grains',
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
    minQuantity: 2,
    lastRestocked: new Date(),
    supplier: 'Rice Masters',
    location: 'Pantry, Top Shelf'
  },
  {
    name: 'Black Pepper',
    description: 'Ground black pepper',
    quantity: 0.2,
    unit: 'kg',
    category: 'spices',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    minQuantity: 0.05,
    lastRestocked: new Date(),
    location: 'Spice Rack'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get an admin user to associate with the food items
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      throw new Error('No admin user found. Please create an admin user first.');
    }

    // Clear existing data
    console.log('Clearing existing food items data...');
    await FoodItem.deleteMany({});

    console.log('Seeding database with sample food items...');
    
    // Add user ID to each food item
    const foodItemsWithUser = sampleFoodItems.map(item => ({
      ...item,
      user: adminUser._id
    }));
    
    // Insert sample data
    const createdItems = await FoodItem.insertMany(foodItemsWithUser);
    
    console.log(`Successfully seeded ${createdItems.length} food items`);
    console.log('Sample data:');
    createdItems.forEach(item => {
      console.log(`- ${item.name} (${item.quantity} ${item.unit}), Expires: ${item.expiryDate.toLocaleDateString()}`);
    });
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seed function
seedDatabase();
