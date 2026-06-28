import { addDays, differenceInDays, format, getDay, parseISO } from 'date-fns';
import { Dish, Meal, MealPlan, UserPreferences } from '../types';

export function generateMealPlan(
  dishes: Dish[],
  recentMeals: Meal[],
  preferences: UserPreferences,
  startDate: string,
  days: number,
): MealPlan[] {
  const start = parseISO(startDate);
  const today = new Date();

  // Step 1: Filter out dishes made within avoidRepeatDays
  const recentDishNames = new Set(
    recentMeals
      .filter(
        (m) =>
          differenceInDays(today, parseISO(m.date)) < preferences.avoidRepeatDays,
      )
      .map((m) => m.dishName),
  );

  const eligible = dishes.filter((d) => !recentDishNames.has(d.name));
  const fallback = eligible.length > 0 ? eligible : dishes;

  // Step 2: Score remaining dishes
  const scored = fallback.map((dish) => {
    const daysSinceLast = dish.lastCookedDate
      ? differenceInDays(today, parseISO(dish.lastCookedDate))
      : 999;
    const favoriteBonus = dish.isFavorite ? 20 : 0;
    const score = daysSinceLast + favoriteBonus;
    return { dish, score, daysSinceLast };
  });

  scored.sort((a, b) => b.score - a.score);

  // Step 3: Select dishes ensuring cuisine variety
  const plan: MealPlan[] = [];
  const usedDishes: string[] = [];
  const usedCuisinesInRow: string[] = [];
  let dineOutCount = 0;

  for (let i = 0; i < days; i++) {
    const currentDate = addDays(start, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = getDay(currentDate); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Only assign dine-out on weekends and within the user's maxDineOutsPerWeek limit
    const dineOutDinner = isWeekend && dineOutCount < preferences.maxDineOutsPerWeek && Math.random() < 0.6;
    if (dineOutDinner) dineOutCount++;

    // Pick lunch dish
    const lunchDish = pickDish(scored, usedDishes, usedCuisinesInRow);
    usedDishes.push(lunchDish.dish.name);
    usedCuisinesInRow.push(lunchDish.dish.cuisineTag);
    if (usedCuisinesInRow.length > 3) usedCuisinesInRow.shift();

    // Pick dinner dish or dine-out
    let dinnerEntry: MealPlan['dinner'];
    if (dineOutDinner) {
      dinnerEntry = {
        dishName: 'Dine Out',
        sourceType: 'dineout',
        lastMadeDaysAgo: 0,
        isNew: false,
      };
    } else {
      const dinnerDish = pickDish(scored, usedDishes, usedCuisinesInRow);
      usedDishes.push(dinnerDish.dish.name);
      usedCuisinesInRow.push(dinnerDish.dish.cuisineTag);
      if (usedCuisinesInRow.length > 3) usedCuisinesInRow.shift();

      dinnerEntry = {
        dishName: dinnerDish.dish.name,
        sourceType: 'home',
        lastMadeDaysAgo: dinnerDish.daysSinceLast,
        isNew: dinnerDish.dish.timesCooked === 0,
      };
    }

    plan.push({
      date: dateStr,
      lunch: {
        dishName: lunchDish.dish.name,
        sourceType: 'home',
        lastMadeDaysAgo: lunchDish.daysSinceLast,
        isNew: lunchDish.dish.timesCooked === 0,
      },
      dinner: dinnerEntry,
    });
  }

  return plan;
}

interface ScoredDish {
  dish: Dish;
  score: number;
  daysSinceLast: number;
}

function pickDish(
  scored: ScoredDish[],
  usedDishes: string[],
  recentCuisines: string[],
): ScoredDish {
  // Prefer dishes not yet used and with different cuisine from recent
  const available = scored.filter((s) => !usedDishes.includes(s.dish.name));
  const pool = available.length > 0 ? available : scored;

  // Boost score for cuisine diversity
  const diversified = pool.map((s) => {
    const cuisinePenalty = recentCuisines.filter(
      (c) => c === s.dish.cuisineTag,
    ).length * 10;
    return { ...s, adjustedScore: s.score - cuisinePenalty };
  });

  diversified.sort((a, b) => b.adjustedScore - a.adjustedScore);

  // Pick from top candidates with slight randomness
  const topN = Math.min(3, diversified.length);
  const idx = Math.floor(Math.random() * topN);
  return diversified[idx];
}
