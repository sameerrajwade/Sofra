import { create } from 'zustand';
import { Dish } from '../types';
import { getDishes, addDish as addDishApi, updateDish as updateDishApi } from '../services/firestore';

interface DishState {
  dishes: Dish[];
  isLoading: boolean;
  error: string | null;
  fetchDishes: (householdId: string) => Promise<void>;
  addDish: (householdId: string, dish: Omit<Dish, 'id'>) => Promise<string>;
  updateDish: (householdId: string, dishId: string, data: Partial<Dish>) => Promise<void>;
  toggleFavorite: (householdId: string, dishId: string) => Promise<void>;
  searchDishes: (query: string) => Dish[];
  clear: () => void;
}

export const useDishStore = create<DishState>((set, get) => ({
  dishes: [],
  isLoading: false,
  error: null,

  fetchDishes: async (householdId) => {
    set({ isLoading: true, error: null });
    try {
      const dishes = await getDishes(householdId);
      set({ dishes, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  addDish: async (householdId, dish) => {
    set({ isLoading: true, error: null });
    try {
      const id = await addDishApi(householdId, dish);
      set((state) => ({
        dishes: [...state.dishes, { ...dish, id }],
        isLoading: false,
      }));
      return id;
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  updateDish: async (householdId, dishId, data) => {
    set({ isLoading: true, error: null });
    try {
      await updateDishApi(householdId, dishId, data);
      set((state) => ({
        dishes: state.dishes.map((d) =>
          d.id === dishId ? { ...d, ...data } : d,
        ),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  toggleFavorite: async (householdId, dishId) => {
    const dish = get().dishes.find((d) => d.id === dishId);
    if (!dish) return;
    const newFav = !dish.isFavorite;
    try {
      await updateDishApi(householdId, dishId, { isFavorite: newFav });
      set((state) => ({
        dishes: state.dishes.map((d) =>
          d.id === dishId ? { ...d, isFavorite: newFav } : d,
        ),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  searchDishes: (query) => {
    const q = query.toLowerCase();
    return get().dishes.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.cuisineTag.toLowerCase().includes(q) ||
        d.categoryTags.some((t) => t.toLowerCase().includes(q)),
    );
  },

  clear: () => set({ dishes: [], isLoading: false, error: null }),
}));

export default useDishStore;
