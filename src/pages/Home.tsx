import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Box, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 8, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to OfficeFlow
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Smart Expense Tracker for Workspaces
        </Typography>
        
        <Box sx={{ mt: 4, mb: 8, display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          <Paper elevation={3} sx={{ p: 4, height: '100%', flex: '1 1 300px', maxWidth: '400px' }}>
            <Typography variant="h6" gutterBottom>Track Expenses</Typography>
            <Typography variant="body1">
              Easily track all office expenses in one place with our intuitive interface.
            </Typography>
          </Paper>
          <Paper elevation={3} sx={{ p: 4, height: '100%', flex: '1 1 300px', maxWidth: '400px' }}>
            <Typography variant="h6" gutterBottom>Manage Inventory</Typography>
            <Typography variant="body1">
              Keep track of office supplies and get alerts when items are running low.
            </Typography>
          </Paper>
          <Paper elevation={3} sx={{ p: 4, height: '100%', flex: '1 1 300px', maxWidth: '400px' }}>
            <Typography variant="h6" gutterBottom>Smart Insights</Typography>
            <Typography variant="body1">
              Get valuable insights into your office spending patterns.
            </Typography>
          </Paper>
        </Box>

        {!currentUser ? (
          <Box sx={{ '& > :not(style)': { m: 1 } }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/login')}
              sx={{ mr: 2 }}
            >
              Sign In
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              onClick={() => navigate('/signup')}
            >
              Create Account
            </Button>
          </Box>
        ) : (
          <Button 
            variant="contained" 
            size="large" 
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default Home;
