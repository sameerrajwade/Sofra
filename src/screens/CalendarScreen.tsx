import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, ActivityIndicator, Switch, Surface } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  format,
  eachDayOfInterval,
  isToday,
} from 'date-fns';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { WeekNavigator } from '../components/WeekNavigator';
import { MealCard } from '../components/MealCard';
import { PressableScale, FadeSlideIn } from '../components/motion';
import { useAuthStore } from '../stores/useAuthStore';
import { useMealStore } from '../stores/useMealStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import type { MainTabScreenProps } from '../navigation/types';
import type { Meal, MealType } from '../types';

type Props = MainTabScreenProps<'Calendar'>;

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';
  const { meals, isLoading, fetchMealsByDateRange, dedupeMeals } = useMealStore();
  const { preferences, updatePreferences } = useHouseholdStore();

  const [currentDate, setCurrentDate] = useState(new Date());

  const kidsOn = !!preferences?.planKidsTiffin;
  const toggleKids = useCallback(async () => {
    if (!user) return;
    await updatePreferences(user.id, { planKidsTiffin: !kidsOn }).catch(() => {});
  }, [user, kidsOn, updatePreferences]);

  const addKidsTiffin = useCallback(
    (dateStr: string) => {
      navigation.navigate('AddMeal', {
        meal: {
          id: '',
          date: dateStr,
          mealType: 'lunch',
          sourceType: 'home',
          dishName: '',
          audience: 'kids',
          cuisineTag: 'Indian',
          createdBy: user?.id ?? '',
          householdId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    },
    [navigation, user, householdId],
  );

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const days = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  const loadWeek = useCallback(async () => {
    if (!householdId) return;
    await fetchMealsByDateRange(householdId, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'));
    await dedupeMeals(householdId).catch(() => {});
  }, [householdId, weekStart, weekEnd, fetchMealsByDateRange, dedupeMeals]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  const getMealForSlot = useCallback(
    (date: string, mealType: MealType): Meal | null =>
      meals.find((m) => m.date === date && m.mealType === mealType && m.audience !== 'kids') ?? null,
    [meals],
  );

  const kidsForDay = useCallback(
    (dateStr: string): Meal[] => meals.filter((m) => m.date === dateStr && m.audience === 'kids'),
    [meals],
  );

  // Meal types to show for a day = configured defaults ∪ any FAMILY type already
  // logged that day (so breakfast/snack meals are never hidden; kids show separately).
  const mealTypesForDay = useCallback(
    (dateStr: string): MealType[] => {
      const base = new Set<MealType>(preferences?.defaultMeals ?? ['lunch', 'dinner']);
      meals.forEach((m) => {
        if (m.date === dateStr && m.audience !== 'kids') base.add(m.mealType);
      });
      return MEAL_ORDER.filter((t) => base.has(t));
    },
    [preferences, meals],
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

      <Surface style={styles.kidsToggle} elevation={0}>
        <MaterialCommunityIcons name="emoticon-happy-outline" size={18} color={colors.kids} />
        <Text style={styles.kidsToggleText}>Show kids tiffin</Text>
        <Switch value={kidsOn} onValueChange={toggleKids} color={colors.kids} />
      </Surface>

      {isLoading && meals.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {days.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const today = isToday(day);
            const types = mealTypesForDay(dateStr);
            return (
              <FadeSlideIn key={dateStr} delay={idx * 30}>
                <View style={[styles.dayCard, today && styles.dayCardToday]}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayNameRow}>
                      <Text style={[styles.dayName, today && styles.todayText]}>
                        {format(day, 'EEEE')}
                      </Text>
                      {today && (
                        <View style={styles.todayPill}>
                          <Text style={styles.todayPillText}>Today</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.dayDate, today && styles.todayText]}>
                      {format(day, 'MMM d')}
                    </Text>
                  </View>
                  {types.map((t) => {
                    const meal = getMealForSlot(dateStr, t);
                    return (
                      <View key={t} style={styles.slot}>
                        <Text style={styles.slotLabel}>{MEAL_LABEL[t]}</Text>
                        <MealCard
                          meal={meal}
                          placeholder="Not planned"
                          onPress={() => handleCellPress(dateStr, t, meal)}
                        />
                      </View>
                    );
                  })}
                  {kidsForDay(dateStr).map((meal) => (
                    <View key={meal.id} style={styles.slot}>
                      <View style={styles.kidsLabelRow}>
                        <MaterialCommunityIcons name="emoticon-happy-outline" size={12} color={colors.kids} />
                        <Text style={[styles.slotLabel, { color: colors.kids }]}>Kids tiffin</Text>
                      </View>
                      <MealCard meal={meal} onPress={() => navigation.navigate('AddMeal', { meal })} />
                    </View>
                  ))}
                  {kidsOn && kidsForDay(dateStr).length === 0 && (
                    <View style={styles.slot}>
                      <View style={styles.kidsLabelRow}>
                        <MaterialCommunityIcons name="emoticon-happy-outline" size={12} color={colors.kids} />
                        <Text style={[styles.slotLabel, { color: colors.kids }]}>Kids tiffin</Text>
                      </View>
                      <MealCard meal={null} placeholder="Add kids tiffin" onPress={() => addKidsTiffin(dateStr)} />
                    </View>
                  )}
                </View>
              </FadeSlideIn>
            );
          })}
          <View style={{ height: 96 }} />
        </ScrollView>
      )}

      <View style={styles.bottomBar}>
        <PressableScale style={styles.planBtn} onPress={() => navigation.navigate('Plan' as any)}>
          <MaterialCommunityIcons name="auto-fix" size={18} color={colors.white} />
          <Text style={styles.planBtnText}>Plan your week</Text>
        </PressableScale>
      </View>
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    loader: { marginTop: Spacing.xxl },
    scrollContent: { padding: Spacing.md, paddingTop: Spacing.sm },
    kidsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    kidsToggleText: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: c.text },
    dayCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    dayCardToday: { borderColor: c.primary, borderWidth: 1 },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: Spacing.sm,
    },
    dayNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    dayName: { fontFamily: Fonts.display, fontSize: FontSize.lg, color: c.text },
    todayPill: { backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingHorizontal: 9, paddingVertical: 2 },
    todayPillText: { fontFamily: Fonts.bodySemiBold, fontSize: 10, color: c.white, textTransform: 'uppercase', letterSpacing: 0.5 },
    dayDate: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted },
    todayText: { color: c.primary },
    slot: { marginBottom: Spacing.xs },
    slotLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    kidsLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    emptyText: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.textMuted, textAlign: 'center' },
    bottomBar: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    planBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: c.primary,
    },
    planBtnText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.white },
  });

export default CalendarScreen;
