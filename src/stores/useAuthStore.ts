import { create } from 'zustand';
import { User, UserPreferences } from '../types';
import * as authService from '../services/auth';
import { createUserProfile, getUserProfile, getUserPreferences } from '../services/firestore';
import { useHouseholdStore } from './useHouseholdStore';
import { useMealStore } from './useMealStore';
import { useDishStore } from './useDishStore';

interface AuthState {
  user: User | null;
  preferences: UserPreferences | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  fetchUser: (userId: string) => Promise<void>;
  fetchPreferences: (userId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  preferences: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),

  fetchUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await getUserProfile(userId);
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchPreferences: async (userId: string) => {
    try {
      const preferences = await getUserPreferences(userId);
      set({ preferences });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const firebaseUser = await authService.signInWithEmail(email, password);
      let profile = await getUserProfile(firebaseUser.uid);
      if (!profile) {
        profile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          avatarUrl: firebaseUser.photoURL || null,
          householdId: null,
          createdAt: new Date(),
        };
        await createUserProfile(profile);
      }
      set({
        user: profile,
        isAuthenticated: !!profile,
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const firebaseUser = await authService.signUpWithEmail(email, password, name);
      const newUser: User = {
        id: firebaseUser.uid,
        name,
        email,
        avatarUrl: null,
        householdId: null,
        createdAt: new Date(),
      };
      await createUserProfile(newUser);
      set({ user: newUser, isAuthenticated: true, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      useHouseholdStore.getState().clear();
      useMealStore.getState().clear();
      useDishStore.getState().clear();
      set({ user: null, preferences: null, isAuthenticated: false, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const firebaseUser = await authService.signInWithGoogle();
      let profile = await getUserProfile(firebaseUser.uid);
      if (!profile) {
        profile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          avatarUrl: firebaseUser.photoURL,
          householdId: null,
          createdAt: new Date(),
        };
        await createUserProfile(profile);
      }
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(email);
      set({ isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  clear: () => set({ user: null, preferences: null, isAuthenticated: false, isLoading: false, error: null }),
}));

export default useAuthStore;
