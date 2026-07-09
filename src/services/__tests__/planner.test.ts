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

  it('adds a kids tiffin on weekdays from kids history when enabled', () => {
    // 2026-07-06..08 = Mon..Wed (all weekdays)
    const kidHistory = [meal('Veg Sandwich', '2026-07-01', { audience: 'kids' })];
    const plan = generateMealPlan(dishes, kidHistory, prefs({ planKidsTiffin: true }), '2026-07-06', 3);
    expect(plan.every((d) => d.kids?.dishName === 'Veg Sandwich')).toBe(true);
  });

  it('does not auto-plan kids tiffin on weekends', () => {
    // 2026-07-06 is a Monday, so a 7-day plan spans Mon..Sun with
    // Sat 2026-07-11 and Sun 2026-07-12 as the weekend.
    const kidHistory = [meal('Veg Sandwich', '2026-07-01', { audience: 'kids' })];
    const plan = generateMealPlan(dishes, kidHistory, prefs({ planKidsTiffin: true }), '2026-07-06', 7);
    const byDate = Object.fromEntries(plan.map((d) => [d.date, d]));
    expect(byDate['2026-07-11'].kids).toBeUndefined(); // Saturday
    expect(byDate['2026-07-12'].kids).toBeUndefined(); // Sunday
    // Weekdays still receive a kids tiffin
    expect(byDate['2026-07-06'].kids?.dishName).toBe('Veg Sandwich'); // Monday
    expect(byDate['2026-07-10'].kids?.dishName).toBe('Veg Sandwich'); // Friday
  });

  it('avoids dishes cooked within avoidRepeatDays', () => {
    const today = new Date().toISOString().slice(0, 10);
    const recent = [meal('Chole', today)];
    const plan = generateMealPlan(dishes, recent, prefs({ avoidRepeatDays: 30 }), today, 2);
    const names = plan.flatMap((d) => [d.lunch.dishName, d.dinner.dishName]);
    expect(names).not.toContain('Chole');
  });
});
