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
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { expenseApi, Expense as ApiExpense } from '../services/api';

interface Expense {
  _id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  status?: string;
}

const Expenses: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({ 
    description: '', 
    amount: '', 
    category: 'office-supplies', 
    date: formatDateForInput(new Date()) 
  });

  const categories = [
    { value: 'office-supplies', label: 'Office Supplies' },
    { value: 'food', label: 'Food' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'travel', label: 'Travel' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch expenses on component mount
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const data = await expenseApi.getExpenses();
        setExpenses(data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create the expense data
      const expenseData = {
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        date: expenseForm.date,
        status: 'pending' as const, // Ensure status is typed as 'pending'
      };
      
      // Call the API
      const response = await expenseApi.createExpense(expenseData);
      
      // The server returns the expense directly, not wrapped in a data property
      const serverExpense = response;
      
      if (!serverExpense) {
        throw new Error('No expense data returned from server');
      }
      
      // Format the expense for the UI
      const formattedExpense = {
        _id: serverExpense._id.toString(),
        description: serverExpense.description,
        amount: Number(serverExpense.amount) || 0,
        category: serverExpense.category,
        date: serverExpense.date ? new Date(serverExpense.date).toISOString() : new Date().toISOString(),
        status: serverExpense.status || 'pending',
        user: serverExpense.user?.toString() || 'public-user',
        receipt: serverExpense.receipt || '',
        notes: serverExpense.notes || ''
      };
      
      setExpenses(prevExpenses => [formattedExpense, ...prevExpenses]);
      
      // Reset form
      setExpenseForm({
        description: '',
        amount: '',
        category: 'office-supplies',
        date: formatDateForInput(new Date())
      });
      
      setSnackbar({
        open: true,
        message: 'Expense added successfully!',
        severity: 'success',
      });
      
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
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
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Expense Summary</Typography>
        <Box display="flex" gap={3}>
          <Box>
            <Typography variant="subtitle2">Total This Month</Typography>
            <Typography variant="h5">$315.49</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">By Category</Typography>
            <Typography>Supplies: $150.00</Typography>
            <Typography>Food: $85.50</Typography>
            <Typography>Utilities: $79.99</Typography>
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650, tableLayout: 'fixed' }} aria-label="expenses table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
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
                  <TableCell align="right">${expense.amount ? Number(expense.amount).toFixed(2) : '0.00'}</TableCell>
                  <TableCell>
                    <Button size="small" color="primary">Edit</Button>
                    <Button size="small" color="error">Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No expenses found. Add your first expense!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            Add New Expense
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
              Add Expense
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
