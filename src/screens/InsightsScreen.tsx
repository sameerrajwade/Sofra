import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Text, Chip, Surface, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import { subDays, format } from 'date-fns';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';
import { MetricCard } from '../components/MetricCard';
import { useInsightStore } from '../stores/useInsightStore';
import { useMealStore } from '../stores/useMealStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useAuthStore } from '../stores/useAuthStore';
import { getCurrencySymbol } from '../utils/currency';
import type { MainTabScreenProps } from '../navigation/types';

type TimeRange = '7d' | '30d' | '90d' | '180d';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '7d': 'This week',
  '30d': 'This month',
  '90d': '3 months',
  '180d': '6 months',
};

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180,
};

const screenWidth = Dimensions.get('window').width;

export const InsightsScreen: React.FC<MainTabScreenProps<'Insights'>> = () => {
  const { insights, isLoading, computeFromMeals } = useInsightStore();
  const { meals, fetchMeals } = useMealStore();
  const { household, preferences } = useHouseholdStore();
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');

  const loadData = useCallback(async () => {
    if (!household) return;
    const now = new Date();
    const days = TIME_RANGE_DAYS[timeRange];
    const start = format(subDays(now, days), 'yyyy-MM-dd');
    const end = format(now, 'yyyy-MM-dd');
    const prevStart = format(subDays(now, days * 2), 'yyyy-MM-dd');

    await fetchMeals(household.id, prevStart, end);
  }, [household, timeRange, fetchMeals]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (meals.length === 0) return;
    const now = new Date();
    const days = TIME_RANGE_DAYS[timeRange];
    const cutoff = format(subDays(now, days), 'yyyy-MM-dd');
    const prevCutoff = format(subDays(now, days * 2), 'yyyy-MM-dd');

    const currentMeals = meals.filter((m) => m.date >= cutoff);
    const previousMeals = meals.filter((m) => m.date >= prevCutoff && m.date < cutoff);
    computeFromMeals(currentMeals, previousMeals);
  }, [meals, timeRange, computeFromMeals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const { takeoutPercent, dineOutPercent } = useMemo(() => {
    if (!insights) return { takeoutPercent: 0, dineOutPercent: 0 };
    const cutoff = format(subDays(new Date(), TIME_RANGE_DAYS[timeRange]), 'yyyy-MM-dd');
    const currentMeals = meals.filter((m) => m.date >= cutoff);
    const total = Math.max(currentMeals.length, 1);
    const takeoutCount = currentMeals.filter((m) => m.sourceType === 'takeout').length;
    const homePercent = insights.homeCookedPercent || 0;
    const rawTakeout = Math.round((takeoutCount / total) * 100);
    // Ensure all three sum to exactly 100
    const adjustedDineOut = 100 - homePercent - rawTakeout;
    return { takeoutPercent: rawTakeout, dineOutPercent: Math.max(adjustedDineOut, 0) };
  }, [insights, meals, timeRange]);

  const maxRestaurantVisits = insights?.topRestaurants?.[0]?.visits ?? 1;

  const chartData = insights?.monthlySpending?.length
    ? {
        labels: insights.monthlySpending.map((m) => m.month.slice(5)),
        datasets: [{ data: insights.monthlySpending.map((m) => m.amount) }],
      }
    : null;

  if (isLoading && !insights) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Time range selector */}
        <View style={styles.chipRow}>
          {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
            <Chip
              key={range}
              selected={timeRange === range}
              onPress={() => setTimeRange(range)}
              style={[
                styles.rangeChip,
                timeRange === range && styles.rangeChipSelected,
              ]}
              textStyle={[
                styles.rangeChipText,
                timeRange === range && styles.rangeChipTextSelected,
              ]}
              showSelectedOverlay={false}
            >
              {TIME_RANGE_LABELS[range]}
            </Chip>
          ))}
        </View>

        {!insights || meals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chart-bar" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No insights yet</Text>
            <Text style={styles.emptySubtitle}>Start logging your meals to see eating patterns, spending trends, and cuisine variety here.</Text>
          </View>
        ) : null}

        {insights && meals.length > 0 && (
          <>
            {/* Home vs Outside ratio */}
            <Surface style={styles.section} elevation={1}>
              <Text style={styles.sectionTitle}>Home vs. Outside</Text>
              <View style={styles.ratioBar}>
                <View
                  style={[
                    styles.ratioSegment,
                    {
                      flex: insights.homeCookedPercent || 1,
                      backgroundColor: Colors.home,
                      borderTopLeftRadius: BorderRadius.sm,
                      borderBottomLeftRadius: BorderRadius.sm,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.ratioSegment,
                    {
                      flex: takeoutPercent || 0,
                      backgroundColor: Colors.takeout,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.ratioSegment,
                    {
                      flex: dineOutPercent || 0,
                      backgroundColor: Colors.dineout,
                      borderTopRightRadius: BorderRadius.sm,
                      borderBottomRightRadius: BorderRadius.sm,
                    },
                  ]}
                />
              </View>
              <View style={styles.legendRow}>
                <Chip
                  icon={() => (
                    <View style={[styles.legendDot, { backgroundColor: Colors.home }]} />
                  )}
                  style={styles.legendChip}
                  textStyle={styles.legendChipText}
                >
                  Home {insights.homeCookedPercent}%
                </Chip>
                <Chip
                  icon={() => (
                    <View style={[styles.legendDot, { backgroundColor: Colors.takeout }]} />
                  )}
                  style={styles.legendChip}
                  textStyle={styles.legendChipText}
                >
                  Takeout {takeoutPercent}%
                </Chip>
                <Chip
                  icon={() => (
                    <View style={[styles.legendDot, { backgroundColor: Colors.dineout }]} />
                  )}
                  style={styles.legendChip}
                  textStyle={styles.legendChipText}
                >
                  Dine out {dineOutPercent}%
                </Chip>
              </View>
              {insights.homeCookedTrend !== 0 && (
                <Text style={styles.comparisonText}>
                  Last period was {insights.homeCookedPercent - insights.homeCookedTrend}% home
                </Text>
              )}
            </Surface>

            {/* Top restaurants */}
            {insights.topRestaurants.length > 0 && (
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>Top Restaurants</Text>
                {insights.topRestaurants.map((r) => (
                  <View key={r.name} style={styles.barRow}>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.round((r.visits / maxRestaurantVisits) * 100)}%`,
                            backgroundColor: Colors.dineout,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barValue}>{r.visits}</Text>
                  </View>
                ))}
                {insights.topRestaurants[0]?.visits >= 5 && (
                  <View style={styles.alertRow}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={16}
                      color={Colors.warning}
                    />
                    <Text style={styles.alertText}>
                      You visit {insights.topRestaurants[0].name} a lot -- try somewhere new!
                    </Text>
                  </View>
                )}
              </Surface>
            )}

            {/* Cuisine variety */}
            {insights.cuisineBreakdown.length > 0 && (
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>Cuisine Variety</Text>
                {insights.cuisineBreakdown.map((c) => (
                  <View key={c.cuisine} style={styles.barRow}>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {c.cuisine}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${c.percent}%`,
                            backgroundColor: Colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barValue}>{c.percent}%</Text>
                  </View>
                ))}
              </Surface>
            )}

            {/* Spending trend */}
            {chartData && chartData.datasets[0].data.length > 1 && (
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>Spending Trend</Text>
                <LineChart
                  data={chartData}
                  width={screenWidth - Spacing.md * 4}
                  height={200}
                  yAxisLabel={currencySymbol}
                  chartConfig={{
                    backgroundColor: Colors.surface,
                    backgroundGradientFrom: Colors.surface,
                    backgroundGradientTo: Colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(83, 74, 183, ${opacity})`,
                    labelColor: () => Colors.textSecondary,
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: Colors.primaryLight,
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </Surface>
            )}

            {/* Most cooked dishes */}
            {insights.mostCookedDishes.length > 0 && (
              <View>
                <Text style={styles.sectionTitleStandalone}>Most Cooked Dishes</Text>
                <View style={styles.metricsRow}>
                  {insights.mostCookedDishes.slice(0, 3).map((d, i) => (
                    <View key={d.name} style={styles.metricWrapper}>
                      <MetricCard
                        title={`#${i + 1}`}
                        value={d.count}
                        subtitle={d.name}
                        icon="pot-steam"
                        color={Colors.home}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {!insights && !isLoading && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chart-bar" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              Log some meals to see your insights here.
            </Text>
          </View>
        )}
      </ScrollView>
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
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  rangeChip: {
    backgroundColor: Colors.surfaceVariant,
  },
  rangeChipSelected: {
    backgroundColor: Colors.primary,
  },
  rangeChipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  rangeChipTextSelected: {
    color: Colors.white,
  },
  section: {
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionTitleStandalone: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  ratioBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  ratioSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendChip: {
    backgroundColor: Colors.surfaceVariant,
  },
  legendChipText: {
    fontSize: FontSize.xs,
  },
  comparisonText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  barLabel: {
    width: 80,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  barValue: {
    width: 36,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  alertText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    flex: 1,
  },
  chart: {
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricWrapper: {
    flex: 1,
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
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 22,
  },
});

export default InsightsScreen;
