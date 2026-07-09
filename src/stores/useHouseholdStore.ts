import { create } from 'zustand';
import { Household, User, UserPreferences } from '../types';
import * as firestoreService from '../services/firestore';
import { useAuthStore } from './useAuthStore';

interface HouseholdState {
  household: Household | null;
  members: User[];
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  inviteCode: string | null;
  createHousehold: (name: string, userId: string) => Promise<void>;
  joinHousehold: (inviteCode: string, userId: string) => Promise<void>;
  fetchHousehold: (householdId: string, userId?: string) => Promise<void>;
  fetchMembers: (householdId: string) => Promise<void>;
  updatePreferences: (userId: string, prefs: Partial<UserPreferences>) => Promise<void>;
  clear: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  household: null,
  members: [],
  preferences: null,
  isLoading: false,
  error: null,
  inviteCode: null,

  createHousehold: async (name, userId) => {
    set({ isLoading: true, error: null });
    try {
      const id = await firestoreService.createHousehold(name, userId);
      const household = await firestoreService.getHousehold(id);
      set({
        household,
        members: [],
        inviteCode: household?.inviteCode || null,
        isLoading: false,
      });
      // Update auth store so the app knows the user now has a household
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({ ...currentUser, householdId: id });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  joinHousehold: async (inviteCode, userId) => {
    set({ isLoading: true, error: null });
    try {
      // Core join — this is the only operation that must succeed
      const id = await firestoreService.joinHousehold(inviteCode, userId);
      // Update auth store immediately so the app knows the user has a household
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({ ...currentUser, householdId: id });
      }
      // Fetch household details — non-fatal if this fails
      const [household, members] = await Promise.all([
        firestoreService.getHousehold(id).catch(() => null),
        firestoreService.getHouseholdMembers(id).catch(() => []),
      ]);
      set({
        household,
        members,
        inviteCode: household?.inviteCode || null,
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  fetchHousehold: async (householdId, userId?) => {
    set({ isLoading: true, error: null });
    try {
      // The household doc is the critical read; members/preferences are non-fatal.
      // A single failed member read must never blank out the whole household.
      const [household, members, preferences] = await Promise.all([
        firestoreService.getHousehold(householdId),
        firestoreService.getHouseholdMembers(householdId).catch(() => [] as User[]),
        userId
          ? firestoreService.getUserPreferences(userId).catch(() => null)
          : Promise.resolve(null),
      ]);
      set({
        household,
        members,
        preferences: preferences ?? null,
        inviteCode: household?.inviteCode || null,
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchMembers: async (householdId) => {
    try {
      const members = await firestoreService.getHouseholdMembers(householdId);
      set({ members });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  updatePreferences: async (userId, prefs) => {
    set({ isLoading: true, error: null });
    try {
      await firestoreService.updateUserPreferences(userId, prefs);
      set((state) => ({
        preferences: state.preferences ? { ...state.preferences, ...prefs } : (prefs as UserPreferences),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  clear: () => set({ household: null, members: [], preferences: null, isLoading: false, error: null, inviteCode: null }),
}));

export default useHouseholdStore;
