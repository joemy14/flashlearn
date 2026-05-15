import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { authService, UserProfile } from '../../services/authService';
import { offlineService } from '../../services/offlineService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
  isAuthenticated: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      try {
        setUser(currentUser);

        if (currentUser) {
          // Get user profile from Firestore
          const profile = await authService.getUserProfile(currentUser.uid);
          setUserProfile(profile);

          // Sync offline changes
          await offlineService.syncOfflineChanges(currentUser.uid);
        } else {
          setUserProfile(null);
        }
      } catch (err: any) {
        console.error('Error in auth state change:', err);
        setError(err.message || 'Authentication error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      setError(null);
      setLoading(true);
      await authService.signup(email, password, displayName);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign up';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signin = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await authService.signin(email, password);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signout = async () => {
    try {
      setError(null);
      setLoading(true);
      await authService.signout();
      await offlineService.clearCache();
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign out';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    signup,
    signin,
    signout,
    isAuthenticated: user !== null,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}