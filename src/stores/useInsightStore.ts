import { create } from 'zustand';
import { InsightData, Meal } from '../types';
import { getMealsByDateRange } from '../services/firestore';
import { computeInsights } from '../services/insights';
import { format, subMonths, startOfWeek, startOfMonth } from 'date-fns';

type TimePeriod = 'week' | 'month' | '3months' | '6months';

interface InsightState {
  insights: InsightData | null;
  isLoading: boolean;
  error: string | null;
  period: TimePeriod;
  setPeriod: (period: TimePeriod) => void;
  fetchInsights: (householdId: string, period?: TimePeriod) => Promise<void>;
  computeFromMeals: (meals: Meal[], previousMeals: Meal[]) => void;
  clear: () => void;
}

function getDateRange(period: TimePeriod): { start: string; end: string; prevStart: string; prevEnd: string } {
  const now = new Date();
  const end = format(now, 'yyyy-MM-dd');
  let start: Date;
  let prevStart: Date;
  let prevEnd: Date;

  switch (period) {
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 });
      prevEnd = new Date(start.getTime() - 1);
      prevStart = startOfWeek(prevEnd, { weekStartsOn: 1 });
      break;
    case 'month':
      start = startOfMonth(now);
      prevEnd = new Date(start.getTime() - 1);
      prevStart = startOfMonth(prevEnd);
      break;
    case '3months':
      start = subMonths(now, 3);
      prevEnd = new Date(start.getTime() - 1);
      prevStart = subMonths(start, 3);
      break;
    case '6months':
      start = subMonths(now, 6);
      prevEnd = new Date(start.getTime() - 1);
      prevStart = subMonths(start, 6);
      break;
  }

  return {
    start: format(start, 'yyyy-MM-dd'),
    end,
    prevStart: format(prevStart, 'yyyy-MM-dd'),
    prevEnd: format(prevEnd, 'yyyy-MM-dd'),
  };
}

export const useInsightStore = create<InsightState>((set, get) => ({
  insights: null,
  isLoading: false,
  error: null,
  period: 'month',

  setPeriod: (period) => set({ period }),

  fetchInsights: async (householdId, period) => {
    const p = period ?? get().period;
    set({ isLoading: true, error: null, period: p });
    try {
      const range = getDateRange(p);
      const [meals, prevMeals] = await Promise.all([
        getMealsByDateRange(householdId, range.start, range.end),
        getMealsByDateRange(householdId, range.prevStart, range.prevEnd),
      ]);
      const insights = computeInsights(meals, prevMeals);
      set({ insights, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  computeFromMeals: (meals, previousMeals) => {
    set({ isLoading: true });
    try {
      const insights = computeInsights(meals, previousMeals);
      set({ insights, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  clear: () => set({ insights: null, isLoading: false, error: null }),
}));

export default useInsightStore;
