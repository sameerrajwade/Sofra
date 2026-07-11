import { create } from 'zustand';
import { Meal } from '../types';
import {
  getAllMeals,
  addMeal as addMealApi,
  updateMeal as updateMealApi,
  deleteMeal as deleteMealApi,
  getDishByName,
  incrementDishCount,
  addOrUpdateRestaurant,
} from '../services/firestore';
import { useDishStore } from './useDishStore';

// ── Single-source, cache-first meal store ─────────────────────────────────
// The household's meals are loaded ONCE per session (cold start or explicit
// pull-to-refresh) and held in memory. Every screen reads and filters from this
// one array, so navigating between tabs costs ZERO Firestore reads. Writes on
// this device update the in-memory array locally, so a meal added/edited on one
// screen shows instantly on every other screen — again with no read. Changes
// made on a *different* device appear on the next pull-to-refresh (force=true).
// This is the cheapest read profile short of a live onSnapshot listener, which
// we intentionally avoid (it would keep billing reads for real-time sync we
// don't need for a single-phone experience).

interface MealState {
  meals: Meal[];
  hydratedFor: string | null; // householdId the in-memory meals belong to
  isLoading: boolean;
  error: string | null;
  loadMeals: (householdId: string, force?: boolean) => Promise<void>;
  // Back-compat aliases — every screen's fetch resolves to the one cache-first
  // load (range/date args are ignored; screens filter the full set in memory).
  fetchMeals: (householdId: string, startDate?: string, endDate?: string, force?: boolean) => Promise<void>;
  fetchAllMeals: (householdId: string, force?: boolean) => Promise<void>;
  fetchMealsByDateRange: (householdId: string, start?: string, end?: string, force?: boolean) => Promise<void>;
  fetchMealsByDate: (householdId: string) => Promise<void>;
  fetchMealsForMonth: (householdId: string) => Promise<void>;
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

export const useMealStore = create<MealState>((set, get) => {
  // Coalesces concurrent loads (e.g. the startup preload + Home's first focus)
  // into a single network read instead of racing two.
  let inFlight: { householdId: string; promise: Promise<void> } | null = null;

  // The one place a meal read hits the network.
  const load = async (householdId: string, force = false): Promise<void> => {
    if (!householdId) return;
    // Cache-first: skip the read entirely if we already hold this household's
    // meals in memory and the caller didn't explicitly ask to refresh.
    if (!force && get().hydratedFor === householdId) return;
    if (!force && inFlight && inFlight.householdId === householdId) return inFlight.promise;
    const promise = (async () => {
      set({ isLoading: true, error: null });
      try {
        const meals = await getAllMeals(householdId);
        set({ meals, hydratedFor: householdId, isLoading: false });
      } catch (e: any) {
        set({ error: e.message, isLoading: false });
      } finally {
        inFlight = null;
      }
    })();
    inFlight = { householdId, promise };
    return promise;
  };

  return {
    meals: [],
    hydratedFor: null,
    isLoading: false,
    error: null,

    loadMeals: load,
    fetchMeals: (householdId, _s, _e, force) => load(householdId, force),
    fetchAllMeals: (householdId, force) => load(householdId, force),
    fetchMealsByDateRange: (householdId, _s, _e, force) => load(householdId, force),
    fetchMealsByDate: (householdId) => load(householdId),
    fetchMealsForMonth: (householdId) => load(householdId),

    addMeal: async (householdId, meal, opts) => {
      const trackStats = opts?.trackStats !== false; // default true
      set({ error: null });
      try {
        const id = await addMealApi(householdId, meal);
        const newMeal: Meal = {
          ...meal,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // Local update → every screen reflects it immediately, no re-read.
        set((state) => ({ meals: [...state.meals, newMeal] }));

        // Bulk/plan writes skip stored-aggregate updates (screens derive from
        // meals); avoids inflating timesCooked / restaurant visits on re-accept.
        if (!trackStats) {
          return id;
        }

        // Update dish stats (fire-and-forget)
        try {
          const dish = await getDishByName(householdId, meal.dishName);
          if (dish) {
            await incrementDishCount(householdId, dish.id, meal.date);
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
        set({ error: e.message });
        throw e;
      }
    },

    updateMeal: async (householdId, mealId, data) => {
      set({ error: null });
      try {
        await updateMealApi(householdId, mealId, data);
        set((state) => ({
          meals: state.meals.map((m) =>
            m.id === mealId ? { ...m, ...data, updatedAt: new Date() } : m,
          ),
        }));
      } catch (e: any) {
        set({ error: e.message });
        throw e;
      }
    },

    deleteMeal: async (householdId, mealId) => {
      set({ error: null });
      try {
        await deleteMealApi(householdId, mealId);
        set((state) => ({ meals: state.meals.filter((m) => m.id !== mealId) }));
      } catch (e: any) {
        set({ error: e.message });
        throw e;
      }
    },

    // Enforce one meal per (date, mealType, audience): keep the most recently
    // updated record, delete the rest from Firestore. Heals duplicate docs left
    // by earlier bugs. Operates on the in-memory set (no extra reads).
    dedupeMeals: async (householdId) => {
      const current = get().meals;
      const keepBySlot = new Map<string, Meal>();
      const toDelete: string[] = [];
      for (const m of current) {
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

    getMealsByDate: (date) => get().meals.filter((m) => m.date === date),

    clear: () => set({ meals: [], hydratedFor: null, isLoading: false, error: null }),
  };
});

export default useMealStore;
