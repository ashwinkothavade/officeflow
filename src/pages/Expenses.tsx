import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import { expenseApi, Expense as ApiExpense } from '../services/api';

interface Expense {
  _id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  status?: string;
}

type Order = 'asc' | 'desc';

const Expenses: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ApiExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof Expense>('date');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [summary, setSummary] = useState({
    totalThisMonth: 0,
    topCategories: [] as [string, number][],
    statusCounts: {
      approved: 0,
      pending: 0,
      rejected: 0
    }
  });

  const handleRequestSort = (property: keyof Expense) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getComparator = (order: Order, orderBy: keyof Expense): (a: Expense, b: Expense) => number => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = <T, >(a: T, b: T, orderBy: keyof T): number => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  const stableSort = <T, >(array: T[], comparator: (a: T, b: T) => number): T[] => {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  // Format currency in Indian Rupees
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Apply filters to expenses
  useEffect(() => {
    const filtered = expenses.filter(expense => {
      // Filter by search term (description or amount)
      const matchesSearch = searchTerm === '' || 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.amount.toString().includes(searchTerm);
      
      // Filter by status
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'pending' && !expense.status) || 
        expense.status === statusFilter;
      
      // Filter by category
      const matchesCategory = categoryFilter === 'all' || 
        expense.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
    
    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, statusFilter, categoryFilter]);

  // Update summary when filtered expenses change
  useEffect(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filter expenses for current month
    const currentMonthExpenses = filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
    
    // Calculate total for current month
    const totalThisMonth = currentMonthExpenses.reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0), 0
    );
    
    // Calculate totals by category
    const byCategory = currentMonthExpenses.reduce<Record<string, number>>((acc, expense) => {
      const category = categories.find(cat => cat.value === expense.category)?.label || expense.category;
      acc[category] = (acc[category] || 0) + (Number(expense.amount) || 0);
      return acc;
    }, {});
    
    // Sort categories by amount (descending) and take top 3
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    // Count statuses
    const statusCounts = expenses.reduce((acc, expense) => {
      const status = expense.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { approved: 0, pending: 0, rejected: 0 });
    
    setSummary({
      totalThisMonth,
      topCategories,
      statusCounts
    });
  }, [expenses]);
  
  // Helper function to format date for form input
  const formatDateForInput = (date: Date | string): string => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date.split('T')[0];
  };
  
  // Form state interface
  interface ExpenseFormData {
    description: string;
    amount: string; // Keep as string in form state for controlled input
    category: string;
    date: string;
  }

  // Define categories and statuses for filters
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'office-supplies', label: 'Office Supplies' },
    { value: 'food', label: 'Food' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'travel', label: 'Travel' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other', label: 'Other' }
  ] as const;

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ] as const;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({ 
    description: '', 
    amount: '', 
    category: 'office-supplies', 
    date: formatDateForInput(new Date()) 
  });

  // Apply filters to expenses
  useEffect(() => {
    const filtered = expenses.filter(expense => {
      // Filter by search term (description or amount)
      const matchesSearch = searchTerm === '' || 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.amount.toString().includes(searchTerm);
      
      // Filter by status
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'pending' && !expense.status) || 
        expense.status === statusFilter;
      
      // Filter by category
      const matchesCategory = categoryFilter === 'all' || 
        expense.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
    
    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, statusFilter, categoryFilter]);

  // Fetch expenses on component mount
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const data = await expenseApi.getExpenses();
        setExpenses(data);
        setFilteredExpenses(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError('Failed to load expenses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const handleOpen = () => setOpen(true);
  
  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setExpenseForm({
      description: '',
      amount: '',
      category: 'office-supplies',
      date: formatDateForInput(new Date())
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExpenseForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? value.replace(/[^0-9.]/g, '') : value
    }));
  };

  const handleEdit = (expense: ApiExpense) => {
    setEditingId(expense._id);
    setExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: formatDateForInput(expense.date)
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        console.log('Deleting expense with ID:', id);
        const result = await expenseApi.deleteExpense(id);
        console.log('Delete API response:', result);
        
        if (result && result.success) {
          setExpenses(prev => prev.filter(exp => exp._id !== id));
          setSnackbar({
            open: true,
            message: 'Expense deleted successfully!',
            severity: 'success',
          });
        } else {
          throw new Error('Delete operation was not successful');
        }
      } catch (err) {
        console.error('Error deleting expense:', err);
        setSnackbar({
          open: true,
          message: 'Failed to delete expense. Please try again.',
          severity: 'error',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const expenseData = {
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        date: expenseForm.date,
        status: 'pending' as const,
      };

      if (editingId) {
        // Update existing expense
        const response = await expenseApi.updateExpense(editingId, expenseData);
        if (response && response._id) {
          setExpenses(prev => prev.map(exp => 
            exp._id === editingId ? { ...exp, ...expenseData } : exp
          ));
        } else {
          throw new Error('Failed to update expense');
        }
      } else {
        // Create new expense
        const response = await expenseApi.createExpense(expenseData);
        if (!response || !response._id) {
          throw new Error('No expense data returned from server');
        }
        
        const formattedExpense = {
          _id: response._id.toString(),
          description: response.description,
          amount: Number(response.amount) || 0,
          category: response.category,
          date: response.date ? new Date(response.date).toISOString() : new Date().toISOString(),
          status: response.status || 'pending',
          user: response.user?.toString() || 'public-user',
          receipt: response.receipt || '',
          notes: response.notes || ''
        };
        
        setExpenses(prev => [formattedExpense, ...prev]);
      }
      
      // Reset form and close dialog
      setExpenseForm({
        description: '',
        amount: '',
        category: 'office-supplies',
        date: formatDateForInput(new Date())
      });
      
      setSnackbar({
        open: true,
        message: `Expense ${editingId ? 'updated' : 'added'} successfully!`,
        severity: 'success',
      });
      
      setEditingId(null);
      handleClose();
    } catch (err) {
      console.error('Error creating expense:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to add expense';
      
      setSnackbar({ 
        open: true, 
        message: errorMessage,
        severity: 'error' 
      });
    }
  };

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handle search and filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value);
  };

  const handleCategoryFilterChange = (e: SelectChangeEvent) => {
    setCategoryFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  if (loading && expenses.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Expenses
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            sx={{ minWidth: '150px' }}
          >
            Add Expense
          </Button>
        </Box>

        {/* Search and Filter Section */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} alignItems="flex-end">
            <TextField
              label="Search by description or amount"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                {statuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              onClick={clearFilters}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Clear Filters
            </Button>
          </Box>
        </Paper>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
          Expense Summary
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={4}>
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total This Month
            </Typography>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {formatCurrency(summary.totalThisMonth)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {expenses.length} total expenses
            </Typography>
          </Box>
          
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Top Categories
            </Typography>
            {summary.topCategories.length > 0 ? (
              <Box>
                {summary.topCategories.map(([category, amount]) => (
                  <Box key={category} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">{category}</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(amount)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No expenses this month
              </Typography>
            )}
          </Box>
          
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status Overview
            </Typography>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center">
                  <Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%', mr: 1 }} />
                  <Typography variant="body2">Approved</Typography>
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {summary.statusCounts.approved}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center">
                  <Box sx={{ width: 8, height: 8, bgcolor: 'warning.main', borderRadius: '50%', mr: 1 }} />
                  <Typography variant="body2">Pending</Typography>
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {summary.statusCounts.pending}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <Box sx={{ width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%', mr: 1 }} />
                  <Typography variant="body2">Rejected</Typography>
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {summary.statusCounts.rejected}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650, tableLayout: 'fixed' }} aria-label="expenses table">
          <TableHead>
            <TableRow>
              <TableCell
                sortDirection={orderBy === 'date' ? order : false}
                onClick={() => handleRequestSort('date')}
                sx={{ cursor: 'pointer' }}
              >
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={orderBy === 'date' ? order : 'desc'}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={orderBy === 'description' ? order : false}
                onClick={() => handleRequestSort('description')}
                sx={{ cursor: 'pointer' }}
              >
                <TableSortLabel
                  active={orderBy === 'description'}
                  direction={orderBy === 'description' ? order : 'asc'}
                >
                  Description
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={orderBy === 'category' ? order : false}
                onClick={() => handleRequestSort('category')}
                sx={{ cursor: 'pointer' }}
              >
                <TableSortLabel
                  active={orderBy === 'category'}
                  direction={orderBy === 'category' ? order : 'asc'}
                >
                  Category
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell 
                align="right"
                sortDirection={orderBy === 'amount' ? order : false}
                onClick={() => handleRequestSort('amount')}
                sx={{ cursor: 'pointer' }}
              >
                <TableSortLabel
                  active={orderBy === 'amount'}
                  direction={orderBy === 'amount' ? order : 'desc'}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExpenses.length > 0 ? (
              stableSort(filteredExpenses, getComparator(order, orderBy)).map((expense) => (
                <TableRow key={expense._id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    {categories.find(cat => cat.value === expense.category)?.label || expense.category}
                  </TableCell>
                  <TableCell>
                    <Box 
                      component="span" 
                      sx={{
                        p: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 
                          expense.status === 'approved' ? 'success.light' : 
                          expense.status === 'rejected' ? 'error.light' : 'warning.light',
                        color: 'white',
                        fontSize: '0.75rem',
                        textTransform: 'capitalize'
                      }}
                    >
                      {expense.status || 'pending'}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(Number(expense.amount) || 0)}</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => handleEdit(expense)}
                      disabled={expense.status === 'approved'}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(expense._id)}
                      disabled={expense.status === 'approved'}
                      sx={{ ml: 1 }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {expenses.length === 0 
                    ? 'No expenses found. Add your first expense!' 
                    : 'No expenses match your search criteria.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingId ? 'Edit Expense' : 'Add New Expense'}
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Date"
                type="date"
                name="date"
                value={expenseForm.date}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="Description"
                name="description"
                value={expenseForm.description}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                select
                label="Category"
                name="category"
                value={expenseForm.category}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="text"
                value={expenseForm.amount}
                onChange={handleInputChange}
                margin="normal"
                required
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*(\.[0-9]{0,2})?',
                  min: '0',
                  step: '0.01'
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingId ? 'Update' : 'Add'} Expense
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Expenses;
