import React, { useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';
import { MetricCard } from '../components/MetricCard';
import { MealCard } from '../components/MealCard';
import { useAuthStore } from '../stores/useAuthStore';
import { useMealStore } from '../stores/useMealStore';
import { useDishStore } from '../stores/useDishStore';
import { useInsightStore } from '../stores/useInsightStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { getCurrencySymbol } from '../utils/currency';
import type { HomeStackScreenProps } from '../navigation/types';
import type { Dish } from '../types';

type Props = HomeStackScreenProps<'HomeMain'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';

  const { meals, isLoading: mealsLoading, fetchMealsByDate } = useMealStore();
  const { dishes, isLoading: dishesLoading, fetchDishes } = useDishStore();
  const { insights, isLoading: insightsLoading, fetchInsights } = useInsightStore();
  const { preferences } = useHouseholdStore();

  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');
  const today = format(new Date(), 'yyyy-MM-dd');
  const isLoading = mealsLoading || dishesLoading || insightsLoading;

  const loadData = useCallback(async () => {
    if (!householdId) return;
    await Promise.all([
      fetchMealsByDate(householdId, today),
      fetchDishes(householdId),
      fetchInsights(householdId),
    ]);
  }, [householdId, today, fetchMealsByDate, fetchDishes, fetchInsights]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todayMeals = useMemo(() => {
    const lunch = meals.find((m) => m.date === today && m.mealType === 'lunch') ?? null;
    const dinner = meals.find((m) => m.date === today && m.mealType === 'dinner') ?? null;
    return { lunch, dinner };
  }, [meals, today]);

  const forgottenDishes = useMemo(() => {
    const now = new Date();
    return [...dishes]
      .filter((d) => d.lastCookedDate)
      .sort((a, b) => {
        const aDays = differenceInDays(now, parseISO(a.lastCookedDate));
        const bDays = differenceInDays(now, parseISO(b.lastCookedDate));
        return bDays - aDays;
      })
      .slice(0, 10);
  }, [dishes]);

  const handleAddMeal = useCallback(() => {
    navigation.getParent()?.getParent()?.navigate('AddMeal');
  }, [navigation]);

  const handleMealPress = useCallback(
    (meal: any) => {
      navigation.getParent()?.getParent()?.navigate('AddMeal', { meal });
    },
    [navigation],
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
      >
        {/* Metrics Grid */}
        <Text style={styles.sectionTitle}>This Month</Text>
        {insightsLoading && !insights ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} />
        ) : insights ? (
          <View style={styles.metricsGrid}>
            <View style={styles.metricCol}>
              <MetricCard
                title="Home Cooked"
                value={`${insights.homeCookedPercent}%`}
                trend={insights.homeCookedTrend}
                icon="pot-steam"
                color={Colors.home}
              />
            </View>
            <View style={styles.metricCol}>
              <MetricCard
                title="Dine Outs"
                value={insights.dineOutCount}
                subtitle={`${insights.dineOutCountLastMonth} last month`}
                icon="store"
                color={Colors.dineout}
              />
            </View>
            <View style={styles.metricCol}>
              <MetricCard
                title="Unique Dishes"
                value={insights.uniqueDishes}
                icon="food-variant"
                color={Colors.primary}
              />
            </View>
            <View style={styles.metricCol}>
              <MetricCard
                title="Outside Spend"
                value={`${currencySymbol}${insights.outsideSpending.toFixed(0)}`}
                trend={insights.outsideSpendingTrend}
                icon="currency-usd"
                color={Colors.takeout}
              />
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>No insights available yet.</Text>
        )}

        {/* Today's Meals */}
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        <View style={styles.todayMeals}>
          <Text style={styles.mealLabel}>Lunch</Text>
          <MealCard
            meal={todayMeals.lunch}
            placeholder="No lunch planned"
            onPress={() =>
              todayMeals.lunch
                ? handleMealPress(todayMeals.lunch)
                : handleAddMeal()
            }
          />
          <Text style={styles.mealLabel}>Dinner</Text>
          <MealCard
            meal={todayMeals.dinner}
            placeholder="No dinner planned"
            onPress={() =>
              todayMeals.dinner
                ? handleMealPress(todayMeals.dinner)
                : handleAddMeal()
            }
          />
        </View>

        {/* Forgotten Dishes */}
        {forgottenDishes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Dishes you haven't made in a while
            </Text>
            <FlatList
              data={forgottenDishes}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const daysAgo = differenceInDays(
                  new Date(),
                  parseISO(item.lastCookedDate),
                );
                return (
                  <View style={styles.forgottenRow}>
                    <Text style={styles.forgottenName}>{item.name}</Text>
                    <Text style={styles.forgottenDays}>
                      {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago
                    </Text>
                  </View>
                );
              }}
            />
          </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddMeal}
        color={Colors.white}
        accessibilityLabel="Add meal"
      />
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
    paddingBottom: Spacing.xxl + Spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  metricCol: {
    width: '50%',
    paddingHorizontal: Spacing.xs,
  },
  todayMeals: {
    marginBottom: Spacing.sm,
  },
  mealLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: Spacing.lg,
  },
  forgottenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  forgottenName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  forgottenDays: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
});

export default HomeScreen;
