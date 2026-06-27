import { create } from 'zustand';
import { Household, User, UserPreferences } from '../types';
import * as firestoreService from '../services/firestore';

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
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  joinHousehold: async (inviteCode, userId) => {
    set({ isLoading: true, error: null });
    try {
      const id = await firestoreService.joinHousehold(inviteCode, userId);
      const household = await firestoreService.getHousehold(id);
      const members = await firestoreService.getHouseholdMembers(id);
      set({
        household,
        members,
        inviteCode: household?.inviteCode || null,
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchHousehold: async (householdId, userId?) => {
    set({ isLoading: true, error: null });
    try {
      const promises: [Promise<Household | null>, Promise<User[]>, Promise<UserPreferences | null>?] = [
        firestoreService.getHousehold(householdId),
        firestoreService.getHouseholdMembers(householdId),
      ];
      if (userId) {
        promises.push(firestoreService.getUserPreferences(userId));
      }
      const results = await Promise.all(promises);
      const household = results[0] as Household | null;
      const members = results[1] as User[];
      const preferences = results[2] as UserPreferences | null | undefined;
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
