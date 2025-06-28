# OfficeFlow - Smart Office Management System

![OfficeFlow Logo](public/logo192.png)

OfficeFlow is a comprehensive office management solution designed to streamline expense tracking, inventory management, and administrative tasks through an intuitive web interface powered by AI assistance.

## 🚀 Features

### 📊 Expense Management
- Track and categorize expenses
- Generate detailed expense reports
- Set budget limits and get alerts
- Upload and process bill receipts

### 📦 Inventory Control
- Real-time inventory tracking
- Low stock alerts
- Supplier management
- Item categorization and search

### 🤖 AI-Powered Assistant
- Natural language processing for queries
- Smart expense analysis
- Inventory recommendations
- Office management automation

### 📱 Modern Dashboard
- Interactive data visualizations
- Quick access to key metrics
- Activity timeline
- Responsive design for all devices

## 🛠️ Tech Stack

### Frontend
- React with TypeScript
- Material-UI for UI components
- React Router for navigation
- Chart.js for data visualization
- React Hook Form for form handling

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- RESTful API architecture

### AI Integration
- Gemini API for natural language processing
- Smart data analysis
- Automated reporting

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm or yarn
- MongoDB instance
- Google Cloud API key (for Gemini AI)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/officeflow.git
   cd officeflow
   ```

2. Install dependencies:
   ```bash
   # Install client dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   cd ..
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_GOOGLE_API_KEY=your_google_api_key
   ```

   Create a `.env` file in the server directory:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

4. Start the development servers:
   ```bash
   # Start the React app
   npm start
   
   # In a new terminal, start the backend server
   cd server
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## 📚 Documentation

### API Endpoints
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Add new inventory item
- `POST /api/chat` - Process chat messages with AI

### Environment Variables
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_GOOGLE_API_KEY` - Google Cloud API key
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `NODE_ENV` - Application environment (development/production)

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Material-UI for the amazing UI components
- React for the frontend framework
- MongoDB for the database solution
- Google Cloud for the AI capabilities

---

Made with ❤️ by the OfficeFlow Team
To learn React, check out the [React documentation](https://reactjs.org/).
