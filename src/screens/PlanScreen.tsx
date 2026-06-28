import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  Chip,
  IconButton,
  ActivityIndicator,
  Badge,
  Portal,
  Dialog,
  TextInput,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format, addDays, parseISO } from 'date-fns';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';
import { generateMealPlan } from '../services/planner';
import { useDishStore } from '../stores/useDishStore';
import { useMealStore } from '../stores/useMealStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useAuthStore } from '../stores/useAuthStore';
import type { MealPlan } from '../types';
import type { MainTabScreenProps } from '../navigation/types';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const PlanScreen: React.FC<MainTabScreenProps<'Plan'>> = ({ navigation }) => {
  const { dishes, fetchDishes } = useDishStore();
  const { meals, addMeal, fetchMeals } = useMealStore();
  const { preferences, household } = useHouseholdStore();
  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';

  const [plan, setPlan] = useState<MealPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [editIndex, setEditIndex] = useState<{ dayIdx: number; slot: 'lunch' | 'dinner' } | null>(null);
  const [editDishName, setEditDishName] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);

  const startDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dateRangeLabel = `${format(addDays(new Date(), 1), 'MMM d')} - ${format(addDays(new Date(), 7), 'MMM d')}`;

  const defaultPrefs = preferences ?? {
    defaultMeals: ['lunch', 'dinner'] as const,
    monthlyDineOutBudget: 5000,
    dishRotationDays: 7,
    currency: 'INR',
    maxDineOutsPerWeek: 2,
    avoidRepeatDays: 3,
    includeNewDishes: true,
  };

  useEffect(() => {
    if (!householdId) return;
    Promise.all([
      fetchDishes(householdId).catch(() => {}),
      fetchMeals(householdId).catch(() => {}),
    ]).then(() => setDataLoaded(true));
  }, [householdId]);

  const allDishes = React.useMemo(() => {
    const dishMap = new Map<string, typeof dishes[0]>();
    dishes.forEach((d) => dishMap.set(d.name.toLowerCase(), d));
    meals.forEach((m) => {
      if (m.dishName && !dishMap.has(m.dishName.toLowerCase())) {
        dishMap.set(m.dishName.toLowerCase(), {
          id: m.dishName,
          name: m.dishName,
          cuisineTag: m.cuisineTag || 'Other',
          categoryTags: [],
          isFavorite: false,
          timesCooked: 1,
          lastCookedDate: m.date,
        });
      }
    });
    return Array.from(dishMap.values());
  }, [dishes, meals]);

  const generate = useCallback(() => {
    if (allDishes.length === 0) {
      Alert.alert('No dishes yet', 'Add some meals first so ThaliPlan can learn your preferences and generate a plan.');
      return;
    }
    setIsGenerating(true);
    try {
      const result = generateMealPlan(
        allDishes,
        meals,
        defaultPrefs,
        startDate,
        7,
      );
      setPlan(result);
    } finally {
      setIsGenerating(false);
    }
  }, [allDishes, meals, defaultPrefs, startDate]);

  useEffect(() => {
    if (dataLoaded && allDishes.length > 0 && plan.length === 0) {
      generate();
    }
  }, [dataLoaded, allDishes.length]);

  const refreshDay = useCallback(
    (dayIdx: number) => {
      if (dishes.length === 0) return;
      const dayPlan = generateMealPlan(
        dishes,
        meals,
        defaultPrefs,
        plan[dayIdx].date,
        1,
      );
      setPlan((prev) => prev.map((p, i) => (i === dayIdx ? dayPlan[0] : p)));
    },
    [dishes, meals, defaultPrefs, plan],
  );

  const openEdit = (dayIdx: number, slot: 'lunch' | 'dinner') => {
    setEditIndex({ dayIdx, slot });
    setEditDishName(plan[dayIdx][slot].dishName);
  };

  const confirmEdit = () => {
    if (!editIndex || !editDishName.trim()) return;
    setPlan((prev) =>
      prev.map((p, i) => {
        if (i !== editIndex.dayIdx) return p;
        return {
          ...p,
          [editIndex.slot]: {
            ...p[editIndex.slot],
            dishName: editDishName.trim(),
            isNew: !dishes.some((d) => d.name === editDishName.trim()),
            lastMadeDaysAgo: 0,
          },
        };
      }),
    );
    setEditIndex(null);
    setEditDishName('');
  };

  const acceptPlan = useCallback(async () => {
    if (!household || !user) return;
    setIsAccepting(true);
    try {
      for (const day of plan) {
        if (day.lunch.dishName) {
          await addMeal(household.id, {
            date: day.date,
            mealType: 'lunch',
            sourceType: day.lunch.sourceType,
            dishName: day.lunch.dishName,
            cuisineTag: dishes.find((d) => d.name === day.lunch.dishName)?.cuisineTag || 'Indian',
            createdBy: user.id,
            householdId: household.id,
          });
        }
        if (day.dinner.dishName) {
          await addMeal(household.id, {
            date: day.date,
            mealType: 'dinner',
            sourceType: day.dinner.sourceType,
            dishName: day.dinner.dishName,
            cuisineTag: dishes.find((d) => d.name === day.dinner.dishName)?.cuisineTag || 'Indian',
            createdBy: user.id,
            householdId: household.id,
          });
        }
      }
      navigation.navigate('Calendar' as any);
    } finally {
      setIsAccepting(false);
    }
  }, [plan, household, user, dishes, addMeal, navigation]);

  const daysAgoColor = (days: number) => {
    if (days > 60) return Colors.error;
    if (days < 30) return Colors.success;
    return Colors.textSecondary;
  };

  if (isGenerating && plan.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Generating your meal plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isGenerating} onRefresh={generate} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="auto-fix" size={28} color={Colors.primary} />
            <Text style={styles.headerTitle}>Plan your week</Text>
          </View>
          <Text style={styles.subtitle}>
            Based on your history, here's a suggested plan for {dateRangeLabel}
          </Text>
        </View>

        {/* Info banner */}
        <Surface style={styles.infoBanner} elevation={1}>
          <MaterialCommunityIcons name="information-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            This plan avoids dishes you made in the last {defaultPrefs.avoidRepeatDays} days,
            mixes cuisines, and reserves weekend dinners for dining out.
          </Text>
        </Surface>

        {/* Preference chips */}
        <View style={styles.chipRow}>
          <Chip icon="food-off" style={styles.chip} textStyle={styles.chipText}>
            Max {defaultPrefs.maxDineOutsPerWeek} dine-outs
          </Chip>
          <Chip icon="palette-swatch" style={styles.chip} textStyle={styles.chipText}>
            Mix cuisines
          </Chip>
          {defaultPrefs.includeNewDishes && (
            <Chip icon="new-box" style={styles.chip} textStyle={styles.chipText}>
              Include new
            </Chip>
          )}
        </View>

        {/* Plan list */}
        {plan.map((day, idx) => {
          const date = parseISO(day.date);
          const dayLabel = `${DAY_LABELS[date.getDay()]} ${format(date, 'd')}`;
          return (
            <Surface key={day.date} style={styles.dayRow} elevation={1}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{dayLabel}</Text>
                <IconButton
                  icon="refresh"
                  size={18}
                  iconColor={Colors.textSecondary}
                  onPress={() => refreshDay(idx)}
                />
              </View>
              <View style={styles.mealRow}>
                {/* Lunch */}
                <View style={styles.mealSlot}>
                  <Text style={styles.mealTypeLabel}>Lunch</Text>
                  <Text
                    style={styles.dishName}
                    onPress={() => openEdit(idx, 'lunch')}
                    numberOfLines={1}
                  >
                    {day.lunch.dishName}
                  </Text>
                  <View style={styles.dishMeta}>
                    {day.lunch.isNew ? (
                      <Badge style={styles.newBadge} size={18}>
                        New!
                      </Badge>
                    ) : (
                      <Text
                        style={[
                          styles.daysAgoText,
                          { color: daysAgoColor(day.lunch.lastMadeDaysAgo) },
                        ]}
                      >
                        {day.lunch.lastMadeDaysAgo}d ago
                      </Text>
                    )}
                  </View>
                </View>
                {/* Dinner */}
                <View style={styles.mealSlot}>
                  <Text style={styles.mealTypeLabel}>Dinner</Text>
                  <Text
                    style={styles.dishName}
                    onPress={() => openEdit(idx, 'dinner')}
                    numberOfLines={1}
                  >
                    {day.dinner.dishName}
                  </Text>
                  <View style={styles.dishMeta}>
                    {day.dinner.isNew ? (
                      <Badge style={styles.newBadge} size={18}>
                        New!
                      </Badge>
                    ) : day.dinner.sourceType !== 'dineout' ? (
                      <Text
                        style={[
                          styles.daysAgoText,
                          { color: daysAgoColor(day.dinner.lastMadeDaysAgo) },
                        ]}
                      >
                        {day.dinner.lastMadeDaysAgo}d ago
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </Surface>
          );
        })}

        {/* Action buttons */}
        {plan.length > 0 && (
          <View style={styles.actions}>
            <Button
              mode="outlined"
              icon="refresh"
              onPress={generate}
              loading={isGenerating}
              disabled={isGenerating || isAccepting}
              style={styles.actionButton}
              textColor={Colors.primary}
            >
              Regenerate all
            </Button>
            <Button
              mode="contained"
              icon="check"
              onPress={acceptPlan}
              loading={isAccepting}
              disabled={isGenerating || isAccepting}
              style={styles.actionButton}
              buttonColor={Colors.primary}
              textColor={Colors.white}
            >
              Accept plan
            </Button>
          </View>
        )}

        {plan.length === 0 && !isGenerating && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chef-hat" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              Add some dishes to your library first to generate a meal plan.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit dialog */}
      <Portal>
        <Dialog visible={editIndex !== null} onDismiss={() => setEditIndex(null)}>
          <Dialog.Title>Edit dish</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Dish name"
              value={editDishName}
              onChangeText={setEditDishName}
              mode="outlined"
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditIndex(null)}>Cancel</Button>
            <Button onPress={confirmEdit}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    backgroundColor: Colors.surfaceVariant,
  },
  chipText: {
    fontSize: FontSize.xs,
  },
  dayRow: {
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  mealRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  mealSlot: {
    flex: 1,
  },
  mealTypeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  dishName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  dishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysAgoText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  newBadge: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: FontSize.xs,
    alignSelf: 'flex-start',
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    borderRadius: BorderRadius.md,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});

export default PlanScreen;
