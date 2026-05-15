import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth persistence for web
if (Platform.OS === 'web') {
  setPersistence(auth, browserLocalPersistence).catch(err => {
    console.error('Error setting persistence:', err);
  });
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profilePicture?: string;
  bio?: string;
  totalDecks: number;
  totalCards: number;
  settings: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    dailyReminder: boolean;
  };
}

export const authService = {
  /**
   * Sign up with email and password
   */
  async signup(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    try {
      // Validate inputs
      if (!email || !password || !displayName) {
        throw new Error('Email, password, and display name are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Create user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update profile
      await updateProfile(userCredential.user, {
        displayName,
      });

      // Create user document in Firestore
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        email,
        displayName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        totalDecks: 0,
        totalCards: 0,
        settings: {
          theme: 'auto',
          notifications: true,
          dailyReminder: false,
        },
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);

      // Store user ID in AsyncStorage for offline access
      await AsyncStorage.setItem(
        'flashlearn_user_id',
        userCredential.user.uid
      );

      return userCredential.user;
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  },

  /**
   * Sign in with email and password
   */
  async signin(email: string, password: string): Promise<User> {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Store user ID in AsyncStorage
      await AsyncStorage.setItem(
        'flashlearn_user_id',
        userCredential.user.uid
      );

      return userCredential.user;
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('User not found');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Wrong password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email');
      }
      throw new Error(error.message || 'Failed to sign in');
    }
  },

  /**
   * Sign out current user
   */
  async signout(): Promise<void> {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('flashlearn_user_id');
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      throw new Error(error.message || 'Failed to get user profile');
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(
    uid: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          ...updates,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return auth.currentUser !== null;
  },

  /**
   * Get user ID from AsyncStorage (for offline access)
   */
  async getStoredUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('flashlearn_user_id');
    } catch (error) {
      console.error('Error getting stored user ID:', error);
      return null;
    }
  },
};