import { create } from 'zustand';
import { Meal } from '../types';
import {
  getMealsByDateRange,
  getMealsByDate,
  getMealsForMonth,
  addMeal as addMealApi,
  updateMeal as updateMealApi,
  deleteMeal as deleteMealApi,
  getDishByName,
  incrementDishCount,
  addOrUpdateRestaurant,
} from '../services/firestore';
import { useDishStore } from './useDishStore';

interface MealState {
  meals: Meal[];
  isLoading: boolean;
  error: string | null;
  fetchMeals: (householdId: string, startDate: string, endDate: string) => Promise<void>;
  fetchMealsByDateRange: (householdId: string, start: string, end: string) => Promise<void>;
  fetchMealsByDate: (householdId: string, date: string) => Promise<void>;
  fetchMealsForMonth: (householdId: string, year: number, month: number) => Promise<void>;
  addMeal: (householdId: string, meal: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMeal: (householdId: string, mealId: string, data: Partial<Meal>) => Promise<void>;
  deleteMeal: (householdId: string, mealId: string) => Promise<void>;
  getMealsByDate: (date: string) => Meal[];
  clear: () => void;
}

export const useMealStore = create<MealState>((set, get) => ({
  meals: [],
  isLoading: false,
  error: null,

  fetchMeals: async (householdId, startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const fetched = await getMealsByDateRange(householdId, startDate, endDate);
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

  fetchMealsByDateRange: async (householdId, start, end) => {
    set({ isLoading: true, error: null });
    try {
      const fetched = await getMealsByDateRange(householdId, start, end);
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

  fetchMealsByDate: async (householdId, date) => {
    set({ isLoading: true, error: null });
    try {
      const fetched = await getMealsByDate(householdId, date);
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

  addMeal: async (householdId, meal) => {
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
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  getMealsByDate: (date) => {
    return get().meals.filter((m) => m.date === date);
  },

  clear: () => set({ meals: [], isLoading: false, error: null }),
}));

export default useMealStore;
