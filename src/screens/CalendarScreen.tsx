import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  format,
  eachDayOfInterval,
  isToday,
} from 'date-fns';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';
import { WeekNavigator } from '../components/WeekNavigator';
import { MealCard } from '../components/MealCard';
import { useAuthStore } from '../stores/useAuthStore';
import { useMealStore } from '../stores/useMealStore';
import { useDishStore } from '../stores/useDishStore';
import { generateMealPlan } from '../services/planner';
import type { MainTabScreenProps } from '../navigation/types';
import type { Meal, MealType } from '../types';

type Props = MainTabScreenProps<'Calendar'>;

export const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';

  const { meals, isLoading, fetchMealsByDateRange, addMeal } = useMealStore();
  const { dishes, fetchDishes } = useDishStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [planningLoading, setPlanningLoading] = useState(false);

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate],
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate],
  );
  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd],
  );

  const loadWeek = useCallback(async () => {
    if (!householdId) return;
    const start = format(weekStart, 'yyyy-MM-dd');
    const end = format(weekEnd, 'yyyy-MM-dd');
    await fetchMealsByDateRange(householdId, start, end);
  }, [householdId, weekStart, weekEnd, fetchMealsByDateRange]);

  useEffect(() => {
    loadWeek();
    if (householdId) fetchDishes(householdId);
  }, [loadWeek, householdId, fetchDishes]);

  const getMealForSlot = useCallback(
    (date: string, mealType: MealType): Meal | null => {
      return meals.find((m) => m.date === date && m.mealType === mealType) ?? null;
    },
    [meals],
  );

  const handleCellPress = useCallback(
    (date: string, mealType: MealType, existingMeal: Meal | null) => {
      if (existingMeal) {
        navigation.navigate('AddMeal', { meal: existingMeal });
      } else {
        navigation.navigate('AddMeal', {
          meal: {
            id: '',
            date,
            mealType,
            sourceType: 'home',
            dishName: '',
            cuisineTag: 'Indian',
            createdBy: user?.id ?? '',
            householdId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    },
    [navigation, user, householdId],
  );

  const handleAutoPlan = useCallback(async () => {
    if (!householdId || dishes.length === 0) {
      Alert.alert('Cannot Auto-Plan', 'Add some dishes to your library first.');
      return;
    }

    const unplannedDays = days.filter((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const hasLunch = getMealForSlot(dateStr, 'lunch');
      const hasDinner = getMealForSlot(dateStr, 'dinner');
      return !hasLunch || !hasDinner;
    });

    if (unplannedDays.length === 0) {
      Alert.alert('All Planned', 'Every day this week already has meals planned.');
      return;
    }

    setPlanningLoading(true);
    try {
      const startDate = format(unplannedDays[0], 'yyyy-MM-dd');
      const plan = generateMealPlan(
        dishes,
        meals,
        {
          defaultMeals: ['lunch', 'dinner'],
          monthlyDineOutBudget: 200,
          dishRotationDays: 7,
          currency: 'USD',
          maxDineOutsPerWeek: 2,
          avoidRepeatDays: 3,
          includeNewDishes: true,
        },
        startDate,
        unplannedDays.length,
      );

      for (let i = 0; i < plan.length; i++) {
        const p = plan[i];
        const dateStr = format(unplannedDays[i], 'yyyy-MM-dd');

        if (!getMealForSlot(dateStr, 'lunch')) {
          const lunchDish = dishes.find((d) => d.name === p.lunch.dishName);
          await addMeal(householdId, {
            date: dateStr,
            mealType: 'lunch',
            sourceType: p.lunch.sourceType,
            dishName: p.lunch.dishName,
            cuisineTag: lunchDish?.cuisineTag ?? 'Indian',
            createdBy: user?.id ?? '',
            householdId,
          });
        }
        if (!getMealForSlot(dateStr, 'dinner')) {
          const dinnerDish = dishes.find((d) => d.name === p.dinner.dishName);
          await addMeal(householdId, {
            date: dateStr,
            mealType: 'dinner',
            sourceType: p.dinner.sourceType,
            dishName: p.dinner.dishName,
            cuisineTag: dinnerDish?.cuisineTag ?? 'Indian',
            createdBy: user?.id ?? '',
            householdId,
          });
        }
      }

      await loadWeek();
      Alert.alert('Done', 'Meals have been auto-planned for unplanned days.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to auto-plan meals.');
    } finally {
      setPlanningLoading(false);
    }
  }, [householdId, dishes, meals, days, getMealForSlot, addMeal, user, loadWeek]);

  if (!householdId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Please set up your household first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WeekNavigator
        currentDate={currentDate}
        onPrevious={() => setCurrentDate((d) => addWeeks(d, -1))}
        onNext={() => setCurrentDate((d) => addWeeks(d, 1))}
        onToday={() => setCurrentDate(new Date())}
      />

      <View style={styles.viewToggleRow}>
        <Button
          mode="contained"
          compact
          buttonColor={Colors.primary}
          textColor={Colors.white}
          style={styles.viewToggleButton}
        >
          Week
        </Button>
        <Button
          mode="outlined"
          compact
          disabled
          style={styles.viewToggleButton}
          onPress={() => {}}
        >
          Month (Coming soon)
        </Button>
      </View>

      {isLoading && meals.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.dayCol}>
              <Text style={styles.headerText}>Day</Text>
            </View>
            <View style={styles.mealCol}>
              <Text style={styles.headerText}>Lunch</Text>
            </View>
            <View style={styles.mealCol}>
              <Text style={styles.headerText}>Dinner</Text>
            </View>
          </View>

          {/* Day Rows */}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const todayHighlight = isToday(day);
            const lunch = getMealForSlot(dateStr, 'lunch');
            const dinner = getMealForSlot(dateStr, 'dinner');

            return (
              <View
                key={dateStr}
                style={[
                  styles.dayRow,
                  todayHighlight && styles.todayRow,
                ]}
              >
                <View style={styles.dayCol}>
                  <Text
                    style={[
                      styles.dayName,
                      todayHighlight && styles.todayText,
                    ]}
                  >
                    {format(day, 'EEE')}
                  </Text>
                  <Text
                    style={[
                      styles.dayDate,
                      todayHighlight && styles.todayText,
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                </View>
                <View style={styles.mealCol}>
                  <MealCard
                    meal={lunch}
                    placeholder="Not planned"
                    onPress={() => handleCellPress(dateStr, 'lunch', lunch)}
                  />
                </View>
                <View style={styles.mealCol}>
                  <MealCard
                    meal={dinner}
                    placeholder="Not planned"
                    onPress={() => handleCellPress(dateStr, 'dinner', dinner)}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.bottomBar}>
        <Button
          mode="contained"
          icon="auto-fix"
          onPress={handleAutoPlan}
          loading={planningLoading}
          disabled={planningLoading || isLoading}
          buttonColor={Colors.primary}
          textColor={Colors.white}
          style={styles.autoPlanButton}
          contentStyle={styles.autoPlanContent}
        >
          Auto-plan unplanned days
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  scrollContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xxl + Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  todayRow: {
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: BorderRadius.sm,
  },
  dayCol: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCol: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  headerText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  dayName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  dayDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  todayText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  autoPlanButton: {
    borderRadius: BorderRadius.md,
  },
  autoPlanContent: {
    paddingVertical: Spacing.xs,
  },
  viewToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  viewToggleButton: {
    borderRadius: BorderRadius.sm,
  },
});

export default CalendarScreen;
