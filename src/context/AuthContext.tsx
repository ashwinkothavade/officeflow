import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// Debug logger
const debug = (message: string, data?: any) => {
  console.log(`[Auth] ${message}`, data || '');
};

type User = firebase.User | null;

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<firebase.auth.UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// List of admin emails with full access
const ADMIN_EMAILS = ['ashwinkothawade@mplgaming.com'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    debug('Setting up auth state listener');
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        debug('Auth state changed', { 
          user: user ? { uid: user.uid, email: user.email } : 'no user' 
        });
        
        // Check if the current user is an admin
        const userIsAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;
        setIsAdmin(userIsAdmin);
        
        if (userIsAdmin && user?.email) {
          debug('Admin user detected', { email: user.email });
        }
        
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state error:', error);
        setIsAdmin(false);
        setLoading(false);
      }
    );

    return () => {
      debug('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    try {
      debug('Attempting to login', { email });
      const result = await auth.signInWithEmailAndPassword(email, password);
      debug('Login successful', { uid: result.user?.uid });
    } catch (error: any) {
      debug('Login error', error);
      throw error;
    }
  }

  async function signup(email: string, password: string) {
    try {
      debug('Attempting to sign up', { email });
      const result = await auth.createUserWithEmailAndPassword(email, password);
      debug('Signup successful', { uid: result.user?.uid });
    } catch (error: any) {
      debug('Signup error', error);
      throw error;
    }
  }

  async function loginWithGoogle() {
    try {
      debug('Attempting Google sign in');
      
      // Additional debug info
      debug('Available providers:', {
        googleProvider: !!googleProvider,
        auth: !!auth,
        window: typeof window !== 'undefined'
      });
      
      const result = await auth.signInWithPopup(googleProvider);
      
      debug('Google sign in successful', { 
        uid: result.user?.uid,
        email: result.user?.email,
        providerId: result.credential?.providerId
      });
      
      return result;
    } catch (error: any) {
      debug('Google sign in error', {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential
      });
      
      // Provide more detailed error information
      const errorInfo = {
        code: error.code || 'unknown',
        message: error.message || 'Unknown error during Google sign in',
        email: error.email,
        credential: error.credential ? 'present' : 'none'
      };
      
      console.error('Google Sign-In Error Details:', errorInfo);
      
      throw new Error(`Google Sign-In failed: ${error.message || 'Unknown error'}`);
    }
  }

  async function logout() {
    try {
      debug('Logging out');
      await auth.signOut();
      debug('Logout successful');
    } catch (error: any) {
      debug('Logout error', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    loading,
    isAdmin,
    login,
    signup,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
