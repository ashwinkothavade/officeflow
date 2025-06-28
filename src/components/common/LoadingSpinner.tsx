import React from 'react';
import { CircularProgress, Box, BoxProps } from '@mui/material';

interface LoadingSpinnerProps extends BoxProps {
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullScreen = false, ...props }) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={fullScreen ? '100vh' : '100%'}
      width="100%"
      {...props}
    >
      <CircularProgress />
    </Box>
  );
};

export default LoadingSpinner;
