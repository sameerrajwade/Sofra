import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'themeMode';

interface ThemeState {
  mode: ThemeMode;
  systemScheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  setSystemScheme: (scheme: 'light' | 'dark') => void;
  hydrate: () => Promise<void>;
}

// Default 'light' during the dark-mode rollout so unconverted screens don't
// render half-dark; flip default to 'auto' once all slices are dark-aware.
export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  systemScheme: Appearance.getColorScheme() ?? 'light',

  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  },

  setSystemScheme: (systemScheme) => set({ systemScheme }),

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'auto' || stored === 'light' || stored === 'dark') {
        set({ mode: stored });
      }
    } catch {
      // keep default
    }
  },
}));

export default useThemeStore;
