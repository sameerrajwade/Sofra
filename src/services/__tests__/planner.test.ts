import { generateMealPlan } from '../planner';
import { Dish, Meal, UserPreferences } from '../../types';

const prefs = (over: Partial<UserPreferences> = {}): UserPreferences => ({
  defaultMeals: ['lunch', 'dinner'],
  monthlyDineOutBudget: 5000,
  dishRotationDays: 7,
  currency: 'INR',
  maxDineOutsPerWeek: 0, // disable dine-out randomness for deterministic asserts
  avoidRepeatDays: 3,
  includeNewDishes: true,
  ...over,
});

const dish = (name: string, over: Partial<Dish> = {}): Dish => ({
  id: name,
  name,
  cuisineTag: 'Indian',
  categoryTags: [],
  isFavorite: false,
  timesCooked: 1,
  lastCookedDate: '2000-01-01',
  householdId: 'h1',
  ...over,
});

const meal = (name: string, date: string, over: Partial<Meal> = {}): Meal => ({
  id: `${name}-${date}`,
  date,
  mealType: 'lunch',
  sourceType: 'home',
  dishName: name,
  cuisineTag: 'Indian',
  createdBy: 'u1',
  householdId: 'h1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const dishes = [dish('Chole'), dish('Dosa'), dish('Pulao'), dish('Rajma')];

describe('generateMealPlan', () => {
  it('produces one entry per requested day with filled slots', () => {
    const plan = generateMealPlan(dishes, [], prefs(), '2026-07-06', 3);
    expect(plan).toHaveLength(3);
    for (const day of plan) {
      expect(day.lunch.dishName.length).toBeGreaterThan(0);
      expect(day.dinner.dishName.length).toBeGreaterThan(0);
    }
  });

  it('omits the kids track when planKidsTiffin is off', () => {
    const plan = generateMealPlan(dishes, [], prefs({ planKidsTiffin: false }), '2026-07-06', 3);
    expect(plan.every((d) => d.kids === undefined)).toBe(true);
  });

  it('adds a kids tiffin per day from kids history when enabled', () => {
    const kidHistory = [meal('Veg Sandwich', '2026-07-01', { audience: 'kids' })];
    const plan = generateMealPlan(dishes, kidHistory, prefs({ planKidsTiffin: true }), '2026-07-06', 3);
    expect(plan.every((d) => d.kids?.dishName === 'Veg Sandwich')).toBe(true);
  });

  it('avoids dishes cooked within avoidRepeatDays', () => {
    const today = new Date().toISOString().slice(0, 10);
    const recent = [meal('Chole', today)];
    const plan = generateMealPlan(dishes, recent, prefs({ avoidRepeatDays: 30 }), today, 2);
    const names = plan.flatMap((d) => [d.lunch.dishName, d.dinner.dishName]);
    expect(names).not.toContain('Chole');
  });
});
