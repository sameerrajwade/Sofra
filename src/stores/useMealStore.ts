import { create } from 'zustand';
import { Meal } from '../types';
import {
  getMealsByDateRange,
  getMealsByDate,
  getMealsForMonth,
  getAllMeals,
  addMeal as addMealApi,
  updateMeal as updateMealApi,
  deleteMeal as deleteMealApi,
  getDishByName,
  incrementDishCount,
  addOrUpdateRestaurant,
} from '../services/firestore';
import { useDishStore } from './useDishStore';

// ── Read-cost guard ──────────────────────────────────────────────
// Screens re-fetch meals on every focus; without this, tab-hopping re-reads the
// whole collection each time. We skip a network read if the same query ran very
// recently (mutations clear the cache; pull-to-refresh passes force=true).
const FETCH_TTL_MS = 20000;
const fetchTimes = new Map<string, number>();
const isFresh = (key: string) => {
  const t = fetchTimes.get(key);
  return t !== undefined && Date.now() - t < FETCH_TTL_MS;
};
const touch = (key: string) => fetchTimes.set(key, Date.now());
const invalidateFetchCache = () => fetchTimes.clear();

interface MealState {
  meals: Meal[];
  isLoading: boolean;
  error: string | null;
  fetchMeals: (householdId: string, startDate: string, endDate: string, force?: boolean) => Promise<void>;
  fetchAllMeals: (householdId: string, force?: boolean) => Promise<void>;
  fetchMealsByDateRange: (householdId: string, start: string, end: string, force?: boolean) => Promise<void>;
  fetchMealsByDate: (householdId: string, date: string) => Promise<void>;
  fetchMealsForMonth: (householdId: string, year: number, month: number) => Promise<void>;
  addMeal: (
    householdId: string,
    meal: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>,
    opts?: { trackStats?: boolean },
  ) => Promise<string>;
  updateMeal: (householdId: string, mealId: string, data: Partial<Meal>) => Promise<void>;
  deleteMeal: (householdId: string, mealId: string) => Promise<void>;
  dedupeMeals: (householdId: string) => Promise<void>;
  getMealsByDate: (date: string) => Meal[];
  clear: () => void;
}

export const useMealStore = create<MealState>((set, get) => ({
  meals: [],
  isLoading: false,
  error: null,

  fetchMeals: async (householdId, startDate, endDate, force = false) => {
    const key = `range:${householdId}:${startDate}:${endDate}`;
    if (!force && isFresh(key)) return;
    set({ isLoading: true, error: null });
    try {
      const fetched = await getMealsByDateRange(householdId, startDate, endDate);
      touch(key);
      set((state) => {
        // Reconcile the window: drop in-memory meals inside [start,end] that
        // weren't returned (evicts docs deleted in Firestore); keep the rest.
        const outside = state.meals.filter(
          (m) => m.date < startDate || m.date > endDate,
        );
        return { meals: [...outside, ...fetched], isLoading: false };
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchAllMeals: async (householdId, force = false) => {
    const key = `all:${householdId}`;
    if (!force && isFresh(key)) return;
    set({ isLoading: true, error: null });
    try {
      const fetched = await getAllMeals(householdId);
      touch(key);
      // Full fetch is authoritative — replace entirely so deletions propagate.
      set({ meals: fetched, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchMealsByDateRange: async (householdId, start, end, force = false) => {
    const key = `range:${householdId}:${start}:${end}`;
    if (!force && isFresh(key)) return;
    set({ isLoading: true, error: null });
    try {
      const fetched = await getMealsByDateRange(householdId, start, end);
      touch(key);
      set((state) => {
        const outside = state.meals.filter((m) => m.date < start || m.date > end);
        return { meals: [...outside, ...fetched], isLoading: false };
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchMealsByDate: async (householdId, date) => {
    set({ isLoading: true, error: null });
    try {
      const fetched = await getMealsByDate(householdId, date);
      set((state) => {
        const other = state.meals.filter((m) => m.date !== date);
        return { meals: [...other, ...fetched], isLoading: false };
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchMealsForMonth: async (householdId, year, month) => {
    set({ isLoading: true, error: null });
    try {
      const fetched = await getMealsForMonth(householdId, year, month);
      set((state) => {
        const existing = new Map(state.meals.map((m) => [m.id, m]));
        for (const meal of fetched) {
          existing.set(meal.id, meal);
        }
        return { meals: Array.from(existing.values()), isLoading: false };
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  addMeal: async (householdId, meal, opts) => {
    const trackStats = opts?.trackStats !== false; // default true
    set({ isLoading: true, error: null });
    try {
      const id = await addMealApi(householdId, meal);
      const newMeal: Meal = {
        ...meal,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({
        meals: [...state.meals, newMeal],
        isLoading: false,
      }));
      invalidateFetchCache();

      // Bulk/plan writes skip stored-aggregate updates (screens derive from meals);
      // avoids inflating timesCooked / restaurant visits on plan re-accept.
      if (!trackStats) {
        return id;
      }

      // Update dish stats (fire-and-forget)
      try {
        const dish = await getDishByName(householdId, meal.dishName);
        if (dish) {
          await incrementDishCount(householdId, dish.id, meal.date);
          // Sync local dish store
          useDishStore.setState((state) => ({
            dishes: state.dishes.map((d) =>
              d.id === dish.id
                ? { ...d, timesCooked: d.timesCooked + 1, lastCookedDate: meal.date }
                : d,
            ),
          }));
        }
      } catch {
        // Non-critical: don't block meal save
      }

      // Update restaurant stats for outside meals (fire-and-forget)
      try {
        const isOutside = meal.sourceType === 'takeout' || meal.sourceType === 'dineout';
        if (isOutside && meal.restaurantName) {
          await addOrUpdateRestaurant(
            householdId,
            meal.restaurantName,
            meal.cuisineTag ?? '',
            meal.cost ?? 0,
            meal.date,
          );
        }
      } catch {
        // Non-critical
      }

      return id;
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  updateMeal: async (householdId, mealId, data) => {
    set({ isLoading: true, error: null });
    try {
      await updateMealApi(householdId, mealId, data);
      set((state) => ({
        meals: state.meals.map((m) =>
          m.id === mealId ? { ...m, ...data, updatedAt: new Date() } : m,
        ),
        isLoading: false,
      }));
      invalidateFetchCache();
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  deleteMeal: async (householdId, mealId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteMealApi(householdId, mealId);
      set((state) => ({
        meals: state.meals.filter((m) => m.id !== mealId),
        isLoading: false,
      }));
      invalidateFetchCache();
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  // Enforce one meal per (date, mealType): keep the most recently updated record,
  // delete the rest from Firestore. Heals duplicate docs left by earlier bugs.
  dedupeMeals: async (householdId) => {
    const current = get().meals;
    const keepBySlot = new Map<string, Meal>();
    const toDelete: string[] = [];
    for (const m of current) {
      // Include audience so a family meal and a kids tiffin in the same
      // date+type slot aren't treated as duplicates of each other.
      const key = `${m.date}|${m.mealType}|${m.audience ?? 'family'}`;
      const existing = keepBySlot.get(key);
      if (!existing) {
        keepBySlot.set(key, m);
        continue;
      }
      const mTime = m.updatedAt?.getTime?.() ?? 0;
      const eTime = existing.updatedAt?.getTime?.() ?? 0;
      const keep = mTime >= eTime ? m : existing;
      const drop = keep === m ? existing : m;
      keepBySlot.set(key, keep);
      toDelete.push(drop.id);
    }
    if (toDelete.length === 0) return;
    const deleteSet = new Set(toDelete);
    await Promise.all(
      toDelete.map((id) => deleteMealApi(householdId, id).catch(() => {})),
    );
    set((state) => ({ meals: state.meals.filter((m) => !deleteSet.has(m.id)) }));
  },

  getMealsByDate: (date) => {
    return get().meals.filter((m) => m.date === date);
  },

  clear: () => set({ meals: [], isLoading: false, error: null }),
}));

export default useMealStore;
