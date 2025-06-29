import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// Debug logger
const debug = (message: string, data?: any) => {
  console.log(`[Auth] ${message}`, data || '');
};

// Extend the Firebase User type with our custom fields
type AppUser = firebase.User & {
  role?: string;
  isAdmin?: boolean;
};

// For context value
type AuthContextUser = AppUser | null;

interface AuthContextType {
  currentUser: AuthContextUser;
  setCurrentUser: (user: AuthContextUser) => void;
  loading: boolean;
  isAdmin: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<firebase.auth.UserCredential>;
  logout: () => Promise<void>;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Admin emails that should have admin role
const ADMIN_EMAILS = [
  'ashwinkothawade@mplgaming.com',
  'madhur@mplgaming.com'
];



export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthContextUser>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin based on email
  const checkIsAdmin = useCallback((email: string | null): boolean => {
    return email ? ADMIN_EMAILS.includes(email) : false;
  }, []);

  // Get the current user's ID token
  const getToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    if (!currentUser) return null;
    try {
      const token = await (currentUser as firebase.User).getIdToken(forceRefresh);
      setToken(token);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }, [currentUser]);

  // Update user data and admin status
  const updateUserData = useCallback(async (user: firebase.User | null): Promise<AppUser | null> => {
    if (!user) {
      setCurrentUser(null);
      setIsAdmin(false);
      setToken(null);
      return null;
    }

    try {
      // Get the ID token to check for custom claims
      const idTokenResult = await user.getIdTokenResult();
      const role = (idTokenResult.claims.role as string) || 'user';
      const userIsAdmin = checkIsAdmin(user.email);
      
      // Create enhanced user object with role and admin status
      const userWithRole: AppUser = Object.assign(user, {
        role,
        isAdmin: userIsAdmin
      });
      
      setCurrentUser(userWithRole);
      setIsAdmin(userIsAdmin);
      
      debug('User data updated', { 
        uid: user.uid, 
        email: user.email, 
        role,
        isAdmin: userIsAdmin 
      });
      
      return userWithRole;
    } catch (error) {
      console.error('Error updating user data:', error);
      setCurrentUser(user);
      setIsAdmin(checkIsAdmin(user.email));
      return user;
    }
  }, [checkIsAdmin]);

  // Get token when currentUser changes
  useEffect(() => {
    if (currentUser) {
      getToken();
    } else {
      setToken(null);
    }
  }, [currentUser, getToken]);

  // Listen for auth state changes
  useEffect(() => {
    debug('Setting up auth state listener');
    
    const handleAuthStateChanged = async (user: firebase.User | null) => {
      try {
        debug('Auth state changed', { 
          uid: user?.uid,
          email: user?.email 
        });
        
        const updatedUser = await updateUserData(user);
        
        if (updatedUser?.email) {
          debug('User authenticated', { 
            email: updatedUser.email,
            role: updatedUser.role,
            isAdmin: updatedUser.isAdmin 
          });
        } else {
          debug('No user authenticated');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(
      handleAuthStateChanged,
      (error) => {
        console.error('Auth state error:', error);
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    );

    return () => {
      debug('Cleaning up auth state listener');
      unsubscribe();
    };
  }, [updateUserData]);

  async function login(email: string, password: string) {
    try {
      debug('Attempting to login', { email });
      
      // 1. Try Firebase login first
      const result = await auth.signInWithEmailAndPassword(email, password);
      const user = result.user;
      
      if (!user) {
        throw new Error('Failed to authenticate with Firebase');
      }
      
      // 2. Get the Firebase ID token
      const idToken = await user.getIdToken();
      
      // 3. Authenticate with our backend to get JWT
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ email, firebaseUid: user.uid }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // If backend authentication fails, log out from Firebase
        await auth.signOut();
        throw new Error(data.message || 'Failed to authenticate with backend');
      }
      
      debug('Login successful', { 
        uid: user.uid,
        email: user.email,
        role: data.data?.role || 'user'
      });
      
      // The auth state listener will handle updating the currentUser state
      
    } catch (error: any) {
      debug('Login error', error);
      throw error;
    }
  }

  async function signup(email: string, password: string, name: string) {
    try {
      debug('Attempting to sign up', { email });
      
      // 1. Create user in Firebase
      const result = await auth.createUserWithEmailAndPassword(email, password);
      const user = result.user;
      
      if (!user) throw new Error('Failed to create user');
      
      // 2. Update user profile with display name
      await user.updateProfile({
        displayName: name
      });
      
      // 3. Get the updated user with the new profile
      await user.reload();
      const updatedUser = auth.currentUser;
      
      if (!updatedUser) throw new Error('Failed to update user profile');
      
      // 4. Get the Firebase ID token
      const idToken = await updatedUser.getIdToken(true); // Force token refresh
      
      // 5. Create user in MongoDB with default role 'user'
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          name,
          email,
          role: 'user', // Default role
          firebaseUid: updatedUser.uid
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // If MongoDB user creation fails, delete the Firebase user
        await updatedUser.delete();
        throw new Error(data.message || 'Failed to create user profile');
      }
      
      debug('Signup successful', { 
        uid: updatedUser.uid,
        email: updatedUser.email,
        role: 'user'
      });
      
      // 6. Sign in the user after successful registration
      const loginResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          email: updatedUser.email,
          firebaseUid: updatedUser.uid 
        }),
        credentials: 'include'
      });
      
      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.message || 'Failed to sign in after registration');
      }
      
      // The auth state listener will handle updating the currentUser state
      
    } catch (error: any) {
      debug('Signup error', error);
      throw error;
    }
  }

  async function loginWithGoogle(): Promise<firebase.auth.UserCredential> {
    try {
      debug('Attempting Google sign in');
      
      // 1. Sign in with Google
      const result = await auth.signInWithPopup(googleProvider);
      const user = result.user;
      
      if (!user) {
        throw new Error('Failed to authenticate with Google');
      }

      debug('Google sign in successful', { 
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });

      // 2. Get the Firebase ID token
      const idToken = await user.getIdToken();
      
      // 3. Authenticate with our backend to get JWT
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          name: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          firebaseUid: user.uid
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // If backend authentication fails, log out from Firebase
        await auth.signOut();
        throw new Error(data.message || 'Failed to authenticate with backend');
      }

      debug('Backend authentication successful', { 
        email: user.email,
        role: data.data?.role || 'user'
      });

      return result;
    } catch (error: any) {
      debug('Google sign in error', {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential ? 'present' : 'none'
      });
      
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }

  async function logout() {
    try {
      debug('Logging out');
      
      // 1. Sign out from Firebase
      await auth.signOut();
      
      // 2. Clear the JWT token from the backend
      try {
        await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include' // Important for cookies
        });
      } catch (error) {
        console.error('Error during backend logout:', error);
        // Continue with local logout even if backend logout fails
      }
      
      // 3. Clear local state
      setCurrentUser(null);
      setIsAdmin(false);
      
      debug('Logout successful');
    } catch (error: any) {
      debug('Logout error', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    setCurrentUser,
    loading,
    isAdmin,
    token,
    login,
    signup,
    loginWithGoogle,
    logout,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
