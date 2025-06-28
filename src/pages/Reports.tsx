import React from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

// Sample data - replace with real data from your backend
const expenseData = [
  { category: 'Supplies', amount: 1500, trend: 'up' },
  { category: 'Utilities', amount: 800, trend: 'down' },
  { category: 'Salaries', amount: 5000, trend: 'up' },
  { category: 'Rent', amount: 2000, trend: 'same' },
  { category: 'Other', amount: 1000, trend: 'up' },
];

const recentTransactions = [
  { id: 1, date: '2023-06-15', description: 'Office Supplies', amount: 150.00, category: 'Supplies' },
  { id: 2, date: '2023-06-14', description: 'Internet Bill', amount: 79.99, category: 'Utilities' },
  { id: 3, date: '2023-06-10', description: 'Team Lunch', amount: 120.50, category: 'Food' },
];

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = React.useState('month');

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value as string);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Reports</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl variant="outlined" size="small">
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<DownloadIcon />}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
        <Card elevation={3}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Expenses</Typography>
            <Typography variant="h4">$9,450.00</Typography>
            <Typography color="textSecondary" variant="body2">+12% from last month</Typography>
          </CardContent>
        </Card>
        <Card elevation={3}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Top Category</Typography>
            <Typography variant="h4">Salaries</Typography>
            <Typography color="textSecondary" variant="body2">52% of total expenses</Typography>
          </CardContent>
        </Card>
        <Card elevation={3}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Average Monthly</Typography>
            <Typography variant="h4">$3,150.00</Typography>
            <Typography color="textSecondary" variant="body2">Based on last 3 months</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mt: 3 }}>
        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Expense Categories</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenseData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.category}</TableCell>
                    <TableCell align="right">${row.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {row.trend === 'up' && '↑'}
                      {row.trend === 'down' && '↓'}
                      {row.trend === 'same' && '→'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{txn.date}</TableCell>
                    <TableCell>
                      <Box>
                        <div>{txn.description}</div>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>{txn.category}</div>
                      </Box>
                    </TableCell>
                    <TableCell align="right">${txn.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default Reports;
