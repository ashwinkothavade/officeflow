import React, { useState, useCallback } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Button, 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  SelectChangeEvent,
  CircularProgress,
  Alert,
  SxProps,
  Theme
} from '@mui/material';
import { CloudUpload, Close, CheckCircle } from '@mui/icons-material';
import { useDropzone, DropzoneOptions, FileWithPath } from 'react-dropzone';

interface BillData {
  vendor: string;
  date: string;
  amount: string;
  category: string;
  description: string;
  file: File | null;
}

const UploadBills: React.FC = () => {
  const [bill, setBill] = useState<BillData>({
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    file: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{success: boolean; message: string} | null>(null);
  const [extractedText, setExtractedText] = useState('');

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setBill(prev => ({ ...prev, file }));
      simulateTextExtraction(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const removeFile = useCallback(() => {
    setBill(prev => ({ ...prev, file: null }));
    setExtractedText('');
  }, []);

  const simulateTextExtraction = (file: File) => {
    setIsUploading(true);
    // Simulate API call for text extraction
    setTimeout(() => {
      setExtractedText('Sample extracted text from the bill...');
      setIsUploading(false);
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBill(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (e: SelectChangeEvent<string>) => {
    setBill(prev => ({
      ...prev,
      category: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill.file) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadStatus({
        success: true,
        message: 'Bill uploaded and processed successfully!'
      });
      
      // Reset form
      setBill({
        vendor: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: '',
        description: '',
        file: null
      });
      setExtractedText('');
    } catch (error) {
      setUploadStatus({
        success: false,
        message: 'Failed to upload bill. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const categories = [
    'Office Supplies',
    'Utilities',
    'Rent',
    'Software',
    'Hardware',
    'Travel',
    'Meals',
    'Other'
  ];

  const dropzoneSx: SxProps<Theme> = {
    p: 4,
    border: '2px dashed',
    borderColor: 'divider',
    textAlign: 'center',
    cursor: 'pointer',
    '&:hover': {
      borderColor: 'primary.main',
      backgroundColor: 'action.hover'
    },
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Upload Bills
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Box>
          <Box 
            {...getRootProps()}
            sx={dropzoneSx}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <>
                <CircularProgress />
                <Typography>Processing your bill...</Typography>
              </>
            ) : bill.file ? (
              <Box textAlign="center">
                <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="subtitle1">{bill.file.name}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {Math.round(bill.file.size / 1024)} KB
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  sx={{ mt: 2 }}
                  startIcon={<Close />}
                >
                  Remove File
                </Button>
              </Box>
            ) : (
              <>
                <CloudUpload sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="h6">Drag & drop your bill here</Typography>
                  <Typography variant="body2" color="textSecondary">
                    or click to select a file (PDF, PNG, JPG)
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Box>
        <Box>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Bill Details
            </Typography>
            
            {uploadStatus && (
              <Alert 
                severity={uploadStatus.success ? 'success' : 'error'}
                sx={{ mb: 3 }}
              >
                {uploadStatus.message}
              </Alert>
            )}
            
            {extractedText && (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: 'action.hover',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '150px',
                  overflow: 'auto',
                  fontSize: '0.8rem'
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Extracted Information:
                </Typography>
                <Typography variant="body2">
                  {extractedText}
                </Typography>
              </Paper>
            )}
            
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Vendor"
                    name="vendor"
                    value={bill.vendor}
                    onChange={handleInputChange}
                    required
                    margin="normal"
                    size="small"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    name="date"
                    value={bill.date}
                    onChange={handleInputChange}
                    required
                    margin="normal"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    size="small"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    name="amount"
                    value={bill.amount}
                    onChange={handleInputChange}
                    required
                    margin="normal"
                    InputProps={{
                      startAdornment: '$',
                    }}
                    size="small"
                  />
                </Box>
                <Box>
                  <FormControl fullWidth margin="normal" size="small">
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      name="category"
                      value={bill.category}
                      onChange={handleCategoryChange}
                      label="Category"
                      required
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={bill.description}
                    onChange={handleInputChange}
                    margin="normal"
                    multiline
                    rows={3}
                    size="small"
                  />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isUploading || !bill.file}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    {isUploading ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Save Bill'
                    )}
                  </Button>
                </Box>
              </Box>
            </form>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default UploadBills;
