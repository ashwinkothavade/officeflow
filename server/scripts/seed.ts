import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import User, { IUser, IUserDocument } from '../src/models/User';
import Expense, { IExpense, IExpenseDocument } from '../src/models/Expense';
import FoodItem, { IFoodItem, IFoodItemDocument } from '../src/models/FoodItem';
import { faker } from '@faker-js/faker';

type UserRole = 'user' | 'admin' | 'manager';

// Helper function to safely get user ID as string
const getUserIdString = (user: IUserDocument): string => {
  return user._id ? user._id.toString() : new Types.ObjectId().toString();
};

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/officeflow';

const categories = [
  'travel',
  'food',
  'accommodation',
  'supplies',
  'equipment',
  'other'
];

const foodCategories = [
  'dairy',
  'meat',
  'vegetables',
  'fruits',
  'beverages',
  'snacks',
  'grains',
  'spices',
  'others'
];

const units = ['g', 'kg', 'ml', 'l', 'pcs', 'boxes', 'bottles', 'packets'];

interface ISeedUser {
  firebaseUid: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL?: string;
  department?: string;
}

const createUsers = async (count = 5): Promise<IUserDocument[]> => {
  const users: ISeedUser[] = [];
  
  // Create admin user
  users.push({
    firebaseUid: 'admin123',
    email: 'admin@officeflow.com',
    name: 'Admin User',
    role: 'admin',
    photoURL: faker.image.avatar(),
    department: 'Administration'
  });

  // Create manager
  users.push({
    firebaseUid: 'manager123',
    email: 'manager@officeflow.com',
    name: 'Manager User',
    role: 'manager',
    photoURL: faker.image.avatar(),
    department: 'Management'
  });

  // Create regular users
  for (let i = 0; i < count - 2; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    users.push({
      firebaseUid: faker.string.uuid(),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      name: `${firstName} ${lastName}`,
      role: 'user',
      photoURL: faker.image.avatar(),
      department: faker.commerce.department()
    });
  }

  await User.deleteMany({});
  // Create users one by one to ensure proper typing
  const createdUsers: IUserDocument[] = [];
  for (const user of users) {
    const createdUser = await User.create(user);
    createdUsers.push(createdUser);
  }
  console.log(`Created ${createdUsers.length} users`);
  return createdUsers;
};

interface ISeedExpense {
  user: string; // Store as string for simplicity
  description: string;
  amount: number;
  category: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string;
  notes?: string;
  paymentMethod?: string;
  vendor?: string;
  location?: string;
  isBillable?: boolean;
  project?: string;
}

const createExpenses = async (users: IUserDocument[], countPerUser = 20): Promise<void> => {
  const expenses: ISeedExpense[] = [];
  const statuses: Array<'pending' | 'approved' | 'rejected'> = ['pending', 'approved', 'rejected'];
  
  await Expense.deleteMany({});
  
  for (const user of users) {
    for (let i = 0; i < countPerUser; i++) {
      const date = faker.date.between({ 
        from: '2023-01-01', 
        to: '2025-12-31' 
      });
      
      const amount = parseFloat(faker.finance.amount({ min: 5, max: 2000, dec: 2 }));
      
      const expense: ISeedExpense = {
        user: getUserIdString(user),
        description: faker.commerce.productName(),
        amount,
        category: faker.helpers.arrayElement(categories),
        date,
        status: faker.helpers.arrayElement(statuses) as 'pending' | 'approved' | 'rejected',
        receipt: faker.image.urlPicsumPhotos(),
        notes: faker.lorem.sentence(),
        paymentMethod: faker.helpers.arrayElement(['credit_card', 'debit_card', 'cash', 'bank_transfer']),
        vendor: faker.company.name(),
        location: `${faker.location.city()}, ${faker.location.country()}`,
        isBillable: faker.datatype.boolean(),
        project: faker.company.buzzNoun()
      };
      expenses.push(expense);
    }
  }

  // Insert expenses with proper typing
  const createdExpenses = await Expense.insertMany(expenses as unknown as IExpenseDocument[]);
  console.log(`Created ${createdExpenses.length} expenses`);
};

interface ISeedFoodItem {
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
  user: string; // Store as string for consistency
}

const createFoodItems = async (users: IUserDocument[], countPerUser = 10): Promise<void> => {
  const foodItems: ISeedFoodItem[] = [];
  const today = new Date();
  
  await FoodItem.deleteMany({});
  
  for (const user of users) {
    for (let i = 0; i < countPerUser; i++) {
      const quantity = faker.number.int({ min: 1, max: 100 });
      const minQuantity = Math.max(1, Math.floor(quantity * 0.2));
      
      const expiryDate = faker.date.future();
      
      const foodItem: ISeedFoodItem = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        quantity,
        unit: faker.helpers.arrayElement(units),
        category: faker.helpers.arrayElement(foodCategories),
        expiryDate,
        minQuantity,
        lastRestocked: faker.date.recent({ days: 30 }),
        supplier: faker.company.name(),
        location: faker.location.streetAddress(),
        user: getUserIdString(user)
      };
      foodItems.push(foodItem);
    }
  }

  // Insert food items with proper typing
  const createdFoodItems = await FoodItem.insertMany(foodItems as unknown as IFoodItemDocument[]);
  console.log(`Created ${createdFoodItems.length} food items`);
};

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('Creating users...');
    const users = await createUsers(5);
    
    console.log('Creating expenses...');
    await createExpenses(users, 10);
    
    console.log('Creating food items...');
    await createFoodItems(users, 5);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
