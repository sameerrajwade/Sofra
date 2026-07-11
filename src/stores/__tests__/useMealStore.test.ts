// Verifies the cache-first read profile: one network read per household/session,
// no re-read on screen navigation or local writes, re-read only on force
// (pull-to-refresh) or a household change. This is the guarantee that keeps
// Firestore reads flat instead of multiplying per screen.

jest.mock('../../services/firestore', () => ({
  getAllMeals: jest.fn(async () => [
    {
      id: '1', date: '2026-07-06', mealType: 'lunch', sourceType: 'home',
      dishName: 'Upma', cuisineTag: 'Indian', createdBy: 'u', householdId: 'h',
      createdAt: new Date(), updatedAt: new Date(),
    },
  ]),
  addMeal: jest.fn(async () => 'new-id'),
  updateMeal: jest.fn(async () => {}),
  deleteMeal: jest.fn(async () => {}),
  getDishByName: jest.fn(async () => null),
  incrementDishCount: jest.fn(async () => {}),
  addOrUpdateRestaurant: jest.fn(async () => {}),
  // Imported by useDishStore (not exercised here, but must exist on the mock):
  getDishes: jest.fn(async () => []),
  addDish: jest.fn(async () => 'd'),
  updateDish: jest.fn(async () => {}),
}));

import { useMealStore } from '../useMealStore';
import * as fs from '../../services/firestore';

const getAllMeals = fs.getAllMeals as jest.Mock;

const newMeal = (over: any = {}) => ({
  date: '2026-07-07', mealType: 'dinner', sourceType: 'home', dishName: 'Dal',
  cuisineTag: 'Indian', createdBy: 'u', householdId: 'h', ...over,
});

describe('useMealStore — cache-first reads', () => {
  beforeEach(() => {
    useMealStore.getState().clear();
    getAllMeals.mockClear();
  });

  it('reads once, then serves navigation from memory (no extra reads)', async () => {
    await useMealStore.getState().loadMeals('h');
    await useMealStore.getState().loadMeals('h');       // e.g. Calendar focus
    await useMealStore.getState().fetchAllMeals('h');    // e.g. Plan focus
    await useMealStore.getState().fetchMeals('h', 'x', 'y'); // e.g. Home focus
    expect(getAllMeals).toHaveBeenCalledTimes(1);
    expect(useMealStore.getState().meals).toHaveLength(1);
  });

  it('re-reads only on force (pull-to-refresh)', async () => {
    await useMealStore.getState().loadMeals('h');
    await useMealStore.getState().loadMeals('h', true);
    expect(getAllMeals).toHaveBeenCalledTimes(2);
  });

  it('a local write is visible immediately without a re-read', async () => {
    await useMealStore.getState().loadMeals('h');
    await useMealStore.getState().addMeal('h', newMeal() as any, { trackStats: false });
    await useMealStore.getState().loadMeals('h'); // navigating back to another screen
    expect(getAllMeals).toHaveBeenCalledTimes(1); // no re-read triggered by the write
    expect(useMealStore.getState().meals).toHaveLength(2); // yet the new meal is there
  });

  it('re-reads when the household changes', async () => {
    await useMealStore.getState().loadMeals('h');
    await useMealStore.getState().loadMeals('h2');
    expect(getAllMeals).toHaveBeenCalledTimes(2);
  });

  it('coalesces concurrent loads into one read (preload + first focus)', async () => {
    const p1 = useMealStore.getState().loadMeals('h');
    const p2 = useMealStore.getState().loadMeals('h'); // fires before p1 resolves
    await Promise.all([p1, p2]);
    expect(getAllMeals).toHaveBeenCalledTimes(1);
  });
});
