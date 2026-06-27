import { format } from 'date-fns';
import { Meal, InsightData } from '../types';

export function computeInsights(
  meals: Meal[],
  previousPeriodMeals: Meal[],
): InsightData {
  const total = meals.length;
  const prevTotal = previousPeriodMeals.length;

  // Home cooked %
  const homeCooked = meals.filter((m) => m.sourceType === 'home').length;
  const homeCookedPercent = total > 0 ? Math.round((homeCooked / total) * 100) : 0;
  const prevHomeCooked = previousPeriodMeals.filter((m) => m.sourceType === 'home').length;
  const prevHomeCookedPercent =
    prevTotal > 0 ? Math.round((prevHomeCooked / prevTotal) * 100) : 0;
  const homeCookedTrend = homeCookedPercent - prevHomeCookedPercent;

  // Dine out count
  const dineOutCount = meals.filter((m) => m.sourceType === 'dineout').length;
  const dineOutCountLastMonth = previousPeriodMeals.filter(
    (m) => m.sourceType === 'dineout',
  ).length;

  // Unique dishes
  const uniqueDishes = new Set(meals.map((m) => m.dishName)).size;

  // Outside spending (dineout + takeout)
  const outsideMeals = meals.filter((m) => m.sourceType !== 'home');
  const outsideSpending = outsideMeals.reduce((sum, m) => sum + (m.cost || 0), 0);
  const prevOutsideMeals = previousPeriodMeals.filter((m) => m.sourceType !== 'home');
  const prevOutsideSpending = prevOutsideMeals.reduce(
    (sum, m) => sum + (m.cost || 0),
    0,
  );
  const outsideSpendingTrend =
    prevOutsideSpending > 0
      ? Math.round(
          ((outsideSpending - prevOutsideSpending) / prevOutsideSpending) * 100,
        )
      : 0;

  // Top restaurants
  const restMap = new Map<string, { visits: number; spend: number }>();
  for (const m of meals) {
    if (m.restaurantName) {
      const entry = restMap.get(m.restaurantName) || { visits: 0, spend: 0 };
      entry.visits++;
      entry.spend += m.cost || 0;
      restMap.set(m.restaurantName, entry);
    }
  }
  const topRestaurants = Array.from(restMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  // Cuisine breakdown
  const cuisineMap = new Map<string, number>();
  for (const m of meals) {
    cuisineMap.set(m.cuisineTag, (cuisineMap.get(m.cuisineTag) || 0) + 1);
  }
  const cuisineBreakdown = Array.from(cuisineMap.entries())
    .map(([cuisine, count]) => ({
      cuisine,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.percent - a.percent);

  // Most cooked dishes (home only)
  const dishMap = new Map<string, number>();
  for (const m of meals.filter((m) => m.sourceType === 'home')) {
    dishMap.set(m.dishName, (dishMap.get(m.dishName) || 0) + 1);
  }
  const mostCookedDishes = Array.from(dishMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Monthly spending
  const monthMap = new Map<string, number>();
  for (const m of [...meals, ...previousPeriodMeals]) {
    if (m.sourceType !== 'home' && m.cost) {
      const monthKey = format(new Date(m.date), 'yyyy-MM');
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + m.cost);
    }
  }
  const monthlySpending = Array.from(monthMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    homeCookedPercent,
    homeCookedTrend,
    dineOutCount,
    dineOutCountLastMonth,
    uniqueDishes,
    outsideSpending,
    outsideSpendingTrend,
    topRestaurants,
    cuisineBreakdown,
    mostCookedDishes,
    monthlySpending,
  };
}
