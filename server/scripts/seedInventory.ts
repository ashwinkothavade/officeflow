import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Inventory from '../src/models/Inventory';
import { IInventoryItem } from '../src/models/Inventory';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/officeflow';

// Sample inventory data
const sampleItems: Partial<IInventoryItem>[] = [
  {
    name: 'Laptop',
    description: 'Dell XPS 15',
    category: 'supplies',
    quantity: 5,
    unit: 'pcs',
    pricePerUnit: 1499.99,
    minStockLevel: 2,
    location: 'IT Department',
    supplier: 'Dell Technologies',
    barcode: 'DLXPS15001',
    lastRestocked: new Date()
  },
  {
    name: 'Coffee',
    description: 'Premium Arabica Beans',
    category: 'beverage',
    quantity: 10,
    unit: 'kg',
    pricePerUnit: 29.99,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    minStockLevel: 5,
    location: 'Pantry',
    supplier: 'Local Roastery',
    barcode: 'CFE12345',
    lastRestocked: new Date()
  },
  {
    name: 'Notebooks',
    description: 'A4 Size, 100 pages',
    category: 'supplies',
    quantity: 50,
    unit: 'pcs',
    pricePerUnit: 4.99,
    minStockLevel: 20,
    location: 'Storage Room',
    supplier: 'Office Supplies Inc.',
    lastRestocked: new Date()
  },
  {
    name: 'Mineral Water',
    description: '500ml Bottles',
    category: 'beverage',
    quantity: 100,
    unit: 'pcs',
    pricePerUnit: 0.99,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    minStockLevel: 30,
    location: 'Pantry',
    supplier: 'AquaPure',
    barcode: 'WTR500ML',
    lastRestocked: new Date()
  },
  {
    name: 'Whiteboard Markers',
    description: 'Assorted Colors, Pack of 8',
    category: 'supplies',
    quantity: 12,
    unit: 'pcs',
    pricePerUnit: 12.99,
    minStockLevel: 5,
    location: 'Meeting Room A',
    supplier: 'OfficeMax',
    lastRestocked: new Date()
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing inventory data...');
    await Inventory.deleteMany({});

    console.log('Seeding database with sample inventory items...');
    
    // Insert sample data
    const createdItems = await Inventory.insertMany(sampleItems);
    
    console.log(`Successfully seeded ${createdItems.length} inventory items`);
    console.log('Sample data:');
    createdItems.forEach(item => {
      console.log(`- ${item.name} (${item.quantity} ${item.unit})`);
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
