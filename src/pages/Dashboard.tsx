import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <MainLayout title="Dashboard">
      <Box className="dashboard-container" sx={{
        p: 3,
        width: '100%',
        maxWidth: '100%',
        '&.MuiBox-root': {
          margin: 0,
          padding: 0,
        },
        '& > .MuiBox-root': {
          width: '100%',
          maxWidth: '100%',
          margin: 0,
        }
      }}>
        <Box sx={{ mb: 4, '&.MuiBox-root': { m: 0, p: 0 } }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {currentUser?.email?.split('@')[0] || 'User'}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Here's what's happening with your office today
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)' 
          }, 
          gap: 3, 
          mb: 4,
          '&.MuiBox-root': {
            m: 0,
            p: 0,
            width: '100%',
            maxWidth: '100%'
          }
        }}>
          <Paper 
            elevation={2}
            sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recent Expenses
            </Typography>
            <Typography variant="body1" color="text.secondary">
              No recent expenses. Add your first expense to get started!
            </Typography>
          </Paper>

          <Paper 
            elevation={2}
            sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
            <Typography variant="h6" gutterBottom>
              Budget Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Set up your monthly budget to start tracking.
            </Typography>
          </Paper>

          <Paper 
            elevation={2}
            sx={{ 
              p: 3, 
              gridColumn: { xs: '1 / -1', lg: '3 / 4' },
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Track your office resources at a glance.
            </Typography>
          </Paper>
        </Box>

        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained"
              onClick={() => navigate('/expenses')}
            >
              Manage Expenses
            </Button>
            <Button 
              variant="outlined"
              onClick={() => navigate('/inventory')}
            >
              View Inventory
            </Button>
            <Button 
              variant="outlined"
              onClick={() => navigate('/reports')}
            >
              View Reports
            </Button>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default Dashboard;
