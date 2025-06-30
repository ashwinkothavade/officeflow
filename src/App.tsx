import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Toolbar, Modal, TextField, Button, Typography, Paper } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import PrivateRoute from './components/auth/PrivateRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import MainLayout from './components/layout/MainLayout';
import ChatBot from './components/ChatBot';
import FloatingChatButton from './components/FloatingChatButton';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Reports = lazy(() => import('./pages/Reports'));
const UploadBills = lazy(() => import('./pages/UploadBills'));
const Home = lazy(() => import('./pages/Home'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const InventoryOrder = lazy(() => import('./pages/InventoryOrder'));
const FoodInventory = lazy(() => import('./pages/FoodInventory'));
const Vendors = lazy(() => import('./pages/Vendors'));

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

const ChatModal: React.FC<{ open: boolean; onClose: () => void; apiKey: string | null; setApiKey: (key: string) => void }> = ({ 
  open, 
  onClose, 
  apiKey, 
  setApiKey 
}) => {
  const [key, setKey] = React.useState(apiKey || '');
  const [isValid, setIsValid] = React.useState(false);

  React.useEffect(() => {
    setKey(apiKey || '');
  }, [apiKey]);

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      onClose();
    }
  };

  const validateKey = (value: string) => {
    // Basic validation for Gemini API key (starts with 'AIza' and is at least 30 chars)
    return value.startsWith('AIza') && value.length >= 30;
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
      }}>
        <Typography variant="h6" gutterBottom>
          Enter Your Gemini API Key
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          To use the AI chat assistant, please enter your Gemini API key. 
          Your key is stored locally in your browser and only sent to Google's servers.
        </Typography>
        <TextField
          fullWidth
          label="Gemini API Key"
          variant="outlined"
          margin="normal"
          value={key}
          onChange={(e) => {
            const value = e.target.value;
            setKey(value);
            setIsValid(validateKey(value));
          }}
          placeholder="AIza..."
          helperText="Enter a valid Gemini API key that starts with 'AIza'"
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            disabled={!isValid}
          >
            Save & Continue
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

function App() {
  const [showApiKeyModal, setShowApiKeyModal] = React.useState(false);
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [inventory, setInventory] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Check if API key exists in localStorage
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowApiKeyModal(false);
  };

  // The ChatBot component will fetch its own data when needed

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <ChatProvider>
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              {/* Chat UI Components */}
              <PrivateRoute>
                <FloatingChatButton />
                {apiKey && <ChatBot apiKey={apiKey} />}
              </PrivateRoute>
              
              {/* API Key Modal */}
              <ChatModal 
                open={showApiKeyModal} 
                onClose={() => setShowApiKeyModal(false)}
                apiKey={apiKey}
                setApiKey={handleSetApiKey}
              />
              
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <LoginPage />
                  </Suspense>
                } />
                <Route path="/register" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <RegisterPage />
                  </Suspense>
                } />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <PrivateRoute>
                    <MainLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Home />
                      </Suspense>
                    </MainLayout>
                  </PrivateRoute>
                } />
                <Route path="/dashboard" element={
                  <PrivateRoute>
                    <MainLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Dashboard />
                      </Suspense>
                    </MainLayout>
                  </PrivateRoute>
                } />
                <Route path="/expenses" element={
                  <PrivateRoute>
                    <MainLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Expenses />
                      </Suspense>
                    </MainLayout>
                  </PrivateRoute>
                } />
                <Route path="/inventory" element={
                  <PrivateRoute>
                    <MainLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Inventory />
                      </Suspense>
                    </MainLayout>
                  </PrivateRoute>
                } />
                <Route path="/reports" element={
                  <PrivateRoute>
                    <MainLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Reports />
                      </Suspense>
                    </MainLayout>
                  </PrivateRoute>
                } />
                <Route path="/upload-bills" element={
                  <PrivateRoute>
                    <MainLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <UploadBills />
                      </Suspense>
                    </MainLayout>
                  </PrivateRoute>
                } />
                <Route path="/user-management" element={
                  <PrivateRoute>
                    <MainLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <UserManagement />
                      </Suspense>
                    </MainLayout>
                  </PrivateRoute>
                } />
                <Route path="/inventory/order" element={
                  <PrivateRoute>
                    <MainLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <InventoryOrder />
                      </Suspense>
                    </MainLayout>
                  </PrivateRoute>
                } />
                <Route path="/inventory/food" element={
                  <PrivateRoute>
                    <MainLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <FoodInventory />
                      </Suspense>
                    </MainLayout>
                  </PrivateRoute>
                } />

                <Route path="/vendors" element={
                  <PrivateRoute>
                    <MainLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Vendors />
                      </Suspense>
                    </MainLayout>
                  </PrivateRoute>
                } />
                
                {/* Catch all other routes - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ChatProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
