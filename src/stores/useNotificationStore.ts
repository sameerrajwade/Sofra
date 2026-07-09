import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ensurePermission,
  scheduleDaily,
  scheduleWeekly,
  scheduleMonthly,
  cancel,
  NOTIF_IDS,
} from '../services/notifications';

const STORAGE_KEY = 'notifPrefs';

export interface NotifPrefs {
  daily: boolean;
  dailyHour: number; // 24h
  weekly: boolean;
  monthly: boolean;
}

const DEFAULTS: NotifPrefs = { daily: false, dailyHour: 19, weekly: false, monthly: false };

interface NotifState extends NotifPrefs {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDaily: (on: boolean) => Promise<boolean>;
  setDailyHour: (hour: number) => Promise<void>;
  setWeekly: (on: boolean) => Promise<boolean>;
  setMonthly: (on: boolean) => Promise<boolean>;
}

async function persist(prefs: NotifPrefs) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
}

export const useNotificationStore = create<NotifState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const prefs: NotifPrefs = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
      set({ ...prefs, hydrated: true });
      // Re-assert schedules so they survive reinstalls / OS clears.
      if (prefs.daily) await scheduleDaily(prefs.dailyHour);
      if (prefs.weekly) await scheduleWeekly();
      if (prefs.monthly) await scheduleMonthly();
    } catch {
      set({ hydrated: true });
    }
  },

  setDaily: async (on) => {
    if (on && !(await ensurePermission())) return false;
    const next = { ...currentPrefs(get), daily: on };
    set({ daily: on });
    persist(next);
    if (on) await scheduleDaily(next.dailyHour);
    else await cancel(NOTIF_IDS.daily);
    return true;
  },

  setDailyHour: async (hour) => {
    const next = { ...currentPrefs(get), dailyHour: hour };
    set({ dailyHour: hour });
    persist(next);
    if (next.daily) await scheduleDaily(hour);
  },

  setWeekly: async (on) => {
    if (on && !(await ensurePermission())) return false;
    const next = { ...currentPrefs(get), weekly: on };
    set({ weekly: on });
    persist(next);
    if (on) await scheduleWeekly();
    else await cancel(NOTIF_IDS.weekly);
    return true;
  },

  setMonthly: async (on) => {
    if (on && !(await ensurePermission())) return false;
    const next = { ...currentPrefs(get), monthly: on };
    set({ monthly: on });
    persist(next);
    if (on) await scheduleMonthly();
    else await cancel(NOTIF_IDS.monthly);
    return true;
  },
}));

function currentPrefs(get: () => NotifState): NotifPrefs {
  const s = get();
  return { daily: s.daily, dailyHour: s.dailyHour, weekly: s.weekly, monthly: s.monthly };
}
