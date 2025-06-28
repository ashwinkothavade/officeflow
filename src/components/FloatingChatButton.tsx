import React from 'react';
import { Box, IconButton, Badge } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useChat } from '../contexts/ChatContext';

const FloatingChatButton: React.FC = () => {
  const { toggleChat } = useChat();

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
      }}
    >
      <IconButton
        onClick={toggleChat}
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          width: 60,
          height: 60,
          '&:hover': {
            backgroundColor: 'primary.dark',
            transform: 'scale(1.1)',
            transition: 'transform 0.2s',
          },
          boxShadow: 3,
        }}
        aria-label="Chat with AI Assistant"
      >
        <ChatIcon fontSize="large" />
      </IconButton>
    </Box>
  );
};

export default FloatingChatButton;
