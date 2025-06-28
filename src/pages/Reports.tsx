import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip,
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  CircularProgress,
  Alert,
  Snackbar,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';

interface ExpenseReport {
  totalExpenses: number;
  totalAmount: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  monthlyBreakdown: Record<string, number>;
  expenses: Array<{
    _id: string;
    description: string;
    amount: number;
    category: string;
    status: string;
    date: string;
    notes?: string;
    user?: {
      name: string;
      email: string;
    };
  }>;
}

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ExpenseReport | null>(null);
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    category: '',
    status: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      
      // Use the full URL for API requests
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.get<{ data: ExpenseReport }>(`${baseUrl}/reports/expenses?${params.toString()}`, {
        withCredentials: true, // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setReportData(response.data.data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data');
      setSnackbar({
        open: true,
        message: 'Failed to load report data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      window.open(`${baseUrl}/reports/expenses/export?${params.toString()}`, '_blank');
    } catch (err) {
      console.error('Error exporting report:', err);
      setSnackbar({
        open: true,
        message: 'Failed to export report',
        severity: 'error'
      });
    }
  };

  const handleFilterChange = (field: string, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchReportData();
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      category: '',
      status: ''
    });
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Helper function to format currency in Indian format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading && !reportData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Expense Reports</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loading}
          >
            Export to CSV
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" gutterBottom>Filters</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          <Box sx={{ width: { xs: '100%', md: '23%' } }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters({ ...filters, startDate: date || new Date() })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ width: { xs: '100%', md: '23%' } }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters({ ...filters, endDate: date || new Date() })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ width: { xs: '100%', md: '20%' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="food">Food</MenuItem>
                <MenuItem value="travel">Travel</MenuItem>
                <MenuItem value="accommodation">Accommodation</MenuItem>
                <MenuItem value="office">Office</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ width: { xs: '100%', md: '20%' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ width: { xs: '100%', md: '30%' }, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleApplyFilters}
              disabled={loading}
              fullWidth
            >
              Apply
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleResetFilters}
              disabled={loading}
              fullWidth
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {reportData && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          {/* Summary Cards */}
          <Box sx={{ width: { xs: '100%', md: 'calc(25% - 16px)' } }}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #3f51b5' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography color="textSecondary">Total Spent</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {formatCurrency(reportData.totalAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {reportData.totalExpenses} total expenses
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: { xs: '100%', md: 'calc(25% - 16px)' } }}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography color="textSecondary">Avg. Expense</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {formatCurrency(reportData.totalAmount / (reportData.totalExpenses || 1))}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  per expense
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: { xs: '100%', md: 'calc(25% - 16px)' } }}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography color="textSecondary">Top Category</Typography>
                </Box>
                {Object.keys(reportData.byCategory).length > 0 ? (
                  <>
                    <Typography variant="h6" fontWeight="bold" color="warning.main">
                      {Object.entries(reportData.byCategory).sort((a, b) => b[1] - a[1])[0][0]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {formatCurrency(Math.max(...(Object.values(reportData.byCategory).length ? Object.values(reportData.byCategory) : [0])))}

                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No category data
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: { xs: '100%', md: 'calc(25% - 16px)' } }}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #9c27b0' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography color="textSecondary">Status Overview</Typography>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%', mr: 1 }} />
                      <Typography variant="body2">Approved</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="medium">
                      {reportData.byStatus.approved || 0}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ width: 8, height: 8, bgcolor: 'warning.main', borderRadius: '50%', mr: 1 }} />
                      <Typography variant="body2">Pending</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="medium">
                      {reportData.byStatus.pending || 0}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center">
                      <Box sx={{ width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%', mr: 1 }} />
                      <Typography variant="body2">Rejected</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="medium">
                      {reportData.byStatus.rejected || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 16px)' } }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Status Overview</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Approved:</Typography>
                    <Typography variant="body2" color="success.main">{reportData.byStatus.approved || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Pending:</Typography>
                    <Typography variant="body2" color="warning.main">{reportData.byStatus.pending || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Rejected:</Typography>
                    <Typography variant="body2" color="error.main">{reportData.byStatus.rejected || 0}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Categories Card and Monthly Breakdown */}
          <Box sx={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
            <Box sx={{ width: { xs: '100%', md: 'calc(50% - 16px)' } }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Expenses by Category</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(reportData.byCategory).map(([category, amount]) => (
                          <TableRow key={category}>
                            <TableCell>{category.charAt(0).toUpperCase() + category.slice(1)}</TableCell>
                            <TableCell align="right">{formatCurrency(amount)}</TableCell>
                            <TableCell align="right">
                              {((amount / reportData.totalAmount) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ width: { xs: '100%', md: 'calc(50% - 16px)' } }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Monthly Breakdown</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Month</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(reportData.monthlyBreakdown).map(([month, amount]) => (
                          <TableRow key={month}>
                            <TableCell>{month}</TableCell>
                            <TableCell align="right">{formatCurrency(amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Recent Transactions */}
          <Box sx={{ width: '100%', mt: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Recent Transactions</Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={handleExport}
                    startIcon={<DownloadIcon />}
                  >
                    Export to CSV
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.expenses.slice(0, 10).map((expense) => (
                        <TableRow key={expense._id}>
                          <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={expense.status} 
                              size="small" 
                              color={
                                expense.status === 'approved' ? 'success' : 
                                expense.status === 'rejected' ? 'error' : 'default'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Reports;
