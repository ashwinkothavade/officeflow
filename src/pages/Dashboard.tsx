import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  Button, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Insights as InsightsIcon,
  Info as InfoIcon,
  AttachMoney as ExpenseIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import MainLayout from '../components/layout/MainLayout';
import { expenseApi } from '../services/api';
import { inventoryApi } from '../services/inventoryApi';
import { formatCurrency } from '../utils/format';

interface DashboardStats {
  totalExpenses: number;
  monthlyExpenses: number;
  expenseTrend: number;
  lowStockItems: number;
  totalInventoryValue: number;
  recentActivities: Array<{
    id: string;
    type: 'expense' | 'inventory' | 'report';
    title: string;
    description: string;
    date: string;
    amount?: number;
  }>;
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    monthlyExpenses: 0,
    expenseTrend: 0,
    lowStockItems: 0,
    totalInventoryValue: 0,
    recentActivities: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch expenses summary
        const expenses = await expenseApi.getExpenses();
        const monthlyExpense = expenses
          .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth())
          .reduce((sum, exp) => sum + Number(exp.amount), 0);
        
        // Fetch inventory summary
        const inventory = await inventoryApi.getInventory();
        const lowStockCount = inventory.filter(item => item.quantity <= item.minStockLevel).length;
        const inventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);

        // Mock recent activities (replace with actual data)
        const activities = [
          {
            id: '1',
            type: 'expense' as const,
            title: 'Office Supplies',
            description: 'Purchased stationery items',
            date: new Date().toISOString(),
            amount: 1250
          },
          {
            id: '2',
            type: 'inventory' as const,
            title: 'Low Stock Alert',
            description: 'Printer paper running low',
            date: new Date(Date.now() - 86400000).toISOString()
          }
        ];

        setStats({
          totalExpenses: expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
          monthlyExpenses: monthlyExpense,
          expenseTrend: 0, // Calculate based on previous month
          lowStockItems: lowStockCount,
          totalInventoryValue: inventoryValue,
          recentActivities: activities
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <ExpenseIcon color="primary" />;
      case 'inventory':
        return <InventoryIcon color="warning" />;
      case 'report':
        return <InsightsIcon color="info" />;
      default:
        return <CategoryIcon />;
    }
  };

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard" noSidebar>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {currentUser?.email?.split('@')[0] || 'User'}! 👋
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Here's what's happening with your office today
        </Typography>
      </Box>
        
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          {/* Total Expenses Card */}
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                  <ExpenseIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">Total Expenses</Typography>
                  <Typography variant="h6">{formatCurrency(stats.totalExpenses)}</Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center">
                <Typography variant="body2" color={stats.expenseTrend >= 0 ? 'error.main' : 'success.main'} sx={{ display: 'flex', alignItems: 'center' }}>
                  {stats.expenseTrend >= 0 ? '↑' : '↓'} {Math.abs(stats.expenseTrend)}% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Monthly Expenses Card */}
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'info.light', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">This Month</Typography>
                  <Typography variant="h6">{formatCurrency(stats.monthlyExpenses)}</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {new Date().toLocaleString('default', { month: 'long' })}'s spending
              </Typography>
            </CardContent>
          </Card>

          {/* Inventory Status Card */}
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'warning.light', mr: 2 }}>
                  <InventoryIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">Inventory Value</Typography>
                  <Typography variant="h6">{formatCurrency(stats.totalInventoryValue)}</Typography>
                </Box>
              </Box>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="textSecondary">Low Stock Items</Typography>
                  <Typography variant="body2">{stats.lowStockItems}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, (stats.lowStockItems / 10) * 100)} 
                  color="warning"
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/expenses/new')}
                  fullWidth
                >
                  Add Expense
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<InventoryIcon />}
                  onClick={() => navigate('/inventory')}
                  fullWidth
                >
                  Manage Inventory
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<ReceiptIcon />}
                  onClick={() => navigate('/reports')}
                  fullWidth
                >
                  View Reports
                </Button>
              </Box>
            </CardContent>
          </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 4 }}>
          {/* Recent Activities */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Activities</Typography>
                <List>
                  {stats.recentActivities.length > 0 ? (
                    stats.recentActivities.map((activity) => (
                      <React.Fragment key={activity.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemIcon>
                            {getActivityIcon(activity.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={activity.title}
                            secondary={
                              <>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                >
                                  {activity.description}
                                </Typography>
                                {activity.amount && (
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="primary"
                                    sx={{ display: 'block', mt: 0.5 }}
                                  >
                                    {formatCurrency(activity.amount)}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.date).toLocaleDateString()}
                          </Typography>
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                      No recent activities
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Inventory Status */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Inventory Status</Typography>
                {stats.lowStockItems > 0 ? (
                  <Box>
                    <Box display="flex" alignItems="center" mb={2}>
                      <WarningIcon color="warning" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {stats.lowStockItems} item{stats.lowStockItems !== 1 ? 's' : ''} need{stats.lowStockItems === 1 ? 's' : ''} restocking
                      </Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      color="warning" 
                      size="small"
                      startIcon={<InventoryIcon />}
                      onClick={() => navigate('/inventory')}
                    >
                      View Inventory
                    </Button>
                  </Box>
                ) : (
                  <Box textAlign="center" py={2}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      All inventory items are well-stocked
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
    </MainLayout>
  );
};

export default Dashboard;
