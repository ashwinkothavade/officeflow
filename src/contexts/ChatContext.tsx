import React, { createContext, useContext, ReactNode } from 'react';

interface ChatContextType {
  isChatOpen: boolean;
  toggleChat: () => void;
  apiKey: string | null;
  setApiKey: (key: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [apiKey, setApiKey] = React.useState<string | null>(() => {
    // Load API key from localStorage if available
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key');
    }
    return null;
  });

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  return (
    <ChatContext.Provider 
      value={{ 
        isChatOpen, 
        toggleChat, 
        apiKey, 
        setApiKey: handleSetApiKey 
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
