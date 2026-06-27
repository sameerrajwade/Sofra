import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useMealStore } from '../stores/useMealStore';
import { Meal, MealType, SourceType, CuisineTag } from '../types';

export function useMeals() {
  const store = useMealStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const todaysMeals = useMemo(
    () => store.meals.filter((m) => m.date === today),
    [store.meals, today],
  );

  const thisWeeksMeals = useMemo(() => {
    const now = new Date();
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    return store.meals.filter((m) => m.date >= weekStart && m.date <= weekEnd);
  }, [store.meals]);

  const addQuickMeal = (
    householdId: string,
    dishName: string,
    mealType: MealType,
    sourceType: SourceType,
    cuisineTag: CuisineTag,
    createdBy: string,
  ) => {
    return store.addMeal(householdId, {
      date: today,
      mealType,
      sourceType,
      dishName,
      cuisineTag,
      createdBy,
      householdId,
    });
  };

  return {
    ...store,
    todaysMeals,
    thisWeeksMeals,
    addQuickMeal,
  };
}
