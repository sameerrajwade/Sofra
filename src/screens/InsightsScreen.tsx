import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  Pressable,
} from 'react-native';
import { Text, Chip, Surface, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import { format, startOfWeek, startOfMonth, endOfMonth, parseISO, subMonths } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { MetricCard } from '../components/MetricCard';
import { ShareStatModal, ShareStat } from '../components/ShareStatModal';
import { useInsightStore } from '../stores/useInsightStore';
import { useMealStore } from '../stores/useMealStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useAuthStore } from '../stores/useAuthStore';
import { getCurrencySymbol } from '../utils/currency';
import type { MainTabScreenProps } from '../navigation/types';

type TimeRange = '7d' | '30d' | 'lastMonth' | '90d' | 'all';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '7d': 'This week',
  '30d': 'This month',
  lastMonth: 'Last month',
  '90d': 'Last 3 months',
  all: 'All',
};

// Each range is a closed [start, end] window plus the equivalent prior window
// (for trend comparison). "lastMonth" is a fully closed past month; "all" spans
// all history with no prior window (trend suppressed).
function getRange(range: TimeRange): { start: string; end: string; prevStart: string; prevEnd: string } {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  const dayBefore = (d: Date) => fmt(new Date(d.getTime() - 86400000));
  switch (range) {
    case '7d': {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const prevStart = new Date(start.getTime() - 7 * 86400000);
      return { start: fmt(start), end: today, prevStart: fmt(prevStart), prevEnd: dayBefore(start) };
    }
    case '30d': {
      const start = startOfMonth(now);
      return { start: fmt(start), end: today, prevStart: fmt(startOfMonth(subMonths(now, 1))), prevEnd: dayBefore(start) };
    }
    case 'lastMonth': {
      const lm = subMonths(now, 1);
      return {
        start: fmt(startOfMonth(lm)),
        end: fmt(endOfMonth(lm)),
        prevStart: fmt(startOfMonth(subMonths(now, 2))),
        prevEnd: fmt(endOfMonth(subMonths(now, 2))),
      };
    }
    case '90d': {
      const start = subMonths(now, 3);
      return { start: fmt(start), end: today, prevStart: fmt(subMonths(now, 6)), prevEnd: dayBefore(start) };
    }
    case 'all': {
      // No prior window for all-time; use an empty past range so trend = 0.
      return { start: '1970-01-01', end: today, prevStart: '1970-01-01', prevEnd: '1970-01-01' };
    }
  }
}

const screenWidth = Dimensions.get('window').width;

export const InsightsScreen: React.FC<MainTabScreenProps<'Insights'>> = ({ route }) => {
  const { insights, isLoading, computeFromMeals } = useInsightStore();
  const { meals, fetchMeals, dedupeMeals } = useMealStore();
  const { household, preferences } = useHouseholdStore();
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Deep-link support: a notification (e.g. weekly → this week) can open Insights
  // with a preselected range.
  useEffect(() => {
    const r = route.params?.range;
    if (r && r in TIME_RANGE_LABELS) setTimeRange(r as TimeRange);
  }, [route.params?.range]);
  const [refreshing, setRefreshing] = useState(false);
  const [shareStat, setShareStat] = useState<ShareStat | null>(null);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');

  const loadData = useCallback(async (force = false) => {
    if (!household) return;
    const { prevStart, end } = getRange(timeRange);
    await fetchMeals(household.id, prevStart, end, force);
    await dedupeMeals(household.id).catch(() => {});
  }, [household, timeRange, fetchMeals, dedupeMeals]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data every time the Insights tab gains focus
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useEffect(() => {
    if (meals.length === 0) return;
    const { start, end, prevStart, prevEnd } = getRange(timeRange);
    // Family insights exclude the kids-tiffin track (shown in its own card).
    const currentMeals = meals.filter((m) => m.date >= start && m.date <= end && m.audience !== 'kids');
    const previousMeals = meals.filter((m) => m.date >= prevStart && m.date <= prevEnd && m.audience !== 'kids');
    computeFromMeals(currentMeals, previousMeals);
  }, [meals, timeRange, computeFromMeals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, [loadData]);

  // Compute all three shares from ONE range-filtered set so dine-out/takeout
  // never collapse to zero (previous bug: mixed datasets + subtraction).
  const { homePercent, takeoutPercent, dineOutPercent } = useMemo(() => {
    const { start, end } = getRange(timeRange);
    const cur = meals.filter((m) => m.date >= start && m.date <= end && m.audience !== 'kids');
    const total = cur.length;
    if (total === 0) return { homePercent: 0, takeoutPercent: 0, dineOutPercent: 0 };
    const share = (type: string) =>
      Math.round((cur.filter((m) => m.sourceType === type).length / total) * 100);
    return {
      homePercent: share('home'),
      takeoutPercent: share('takeout'),
      dineOutPercent: share('dineout'),
    };
  }, [meals, timeRange]);

  // Kids tiffin summary for the selected range (count, top dish, variety).
  const kidsStats = useMemo(() => {
    const { start, end } = getRange(timeRange);
    const cur = meals.filter((m) => m.date >= start && m.date <= end && m.audience === 'kids');
    if (cur.length === 0) return null;
    const counts = new Map<string, number>();
    cur.forEach((m) => {
      const n = m.dishName || 'Tiffin';
      counts.set(n, (counts.get(n) ?? 0) + 1);
    });
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      count: cur.length,
      unique: counts.size,
      topName: top?.[0] ?? '',
      topCount: top?.[1] ?? 0,
    };
  }, [meals, timeRange]);

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
        <ActivityIndicator size="large" color={colors.primary} />
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
        {/* Time range selector — horizontal swipe so all ranges fit one line */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rangeRow}
        >
          {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => {
            const selected = timeRange === range;
            return (
              <Pressable
                key={range}
                onPress={() => setTimeRange(range)}
                style={[styles.rangePill, selected && styles.rangePillSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]} numberOfLines={1}>
                  {TIME_RANGE_LABELS[range]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {(!insights || meals.length === 0) && !kidsStats ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chart-bar" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No insights yet</Text>
            <Text style={styles.emptySubtitle}>Start logging your meals to see eating patterns, spending trends, and cuisine variety here.</Text>
          </View>
        ) : null}

        {kidsStats && (
          <Surface style={[styles.section, { backgroundColor: colors.kidsLight }]} elevation={1}>
            <View style={styles.sectionHead}>
              <View style={styles.kidsTitleRow}>
                <MaterialCommunityIcons name="emoticon-happy-outline" size={18} color={colors.kids} />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Kids tiffin</Text>
              </View>
              <Pressable
                onPress={() =>
                  setShareStat({
                    headline: 'Kids tiffins packed',
                    value: `${kidsStats.count}`,
                    sub: kidsStats.topName ? `${kidsStats.unique} unique · most: ${kidsStats.topName}` : `${kidsStats.unique} unique`,
                    accent: colors.kids,
                  })
                }
                hitSlop={10}
                accessibilityLabel="Share kids tiffin insight"
              >
                <MaterialCommunityIcons name="share-variant" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.kidsStatRow}>
              <Text style={styles.kidsStatLabel}>Tiffins packed</Text>
              <Text style={[styles.kidsStatValue, { color: colors.kids }]}>{kidsStats.count}</Text>
            </View>
            {kidsStats.topName ? (
              <View style={styles.kidsStatRow}>
                <Text style={styles.kidsStatLabel}>Most packed</Text>
                <Text style={styles.kidsStatSub}>{kidsStats.topName} ×{kidsStats.topCount}</Text>
              </View>
            ) : null}
            <View style={styles.kidsStatRow}>
              <Text style={styles.kidsStatLabel}>Variety</Text>
              <Text style={styles.kidsStatSub}>{kidsStats.unique} unique</Text>
            </View>
            {kidsStats.topCount >= 3 && (
              <View style={styles.alertRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.warning} />
                <Text style={styles.alertText}>
                  {kidsStats.topName} packed {kidsStats.topCount} times — mix it up to beat tiffin fatigue.
                </Text>
              </View>
            )}
          </Surface>
        )}

        {insights && meals.length > 0 && (
          <>
            {/* Home vs Outside ratio */}
            <Surface style={styles.section} elevation={1}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Home vs. Outside</Text>
                <Pressable
                  onPress={() =>
                    setShareStat({
                      headline: 'Home-cooked this month',
                      value: `${homePercent}%`,
                      sub: `Takeout ${takeoutPercent}%  ·  Dine out ${dineOutPercent}%`,
                      accent: colors.home,
                    })
                  }
                  hitSlop={10}
                  accessibilityLabel="Share this insight"
                >
                  <MaterialCommunityIcons name="share-variant" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
              <View style={styles.ratioBar}>
                <View
                  style={[
                    styles.ratioSegment,
                    {
                      flex: homePercent || 1,
                      backgroundColor: colors.home,
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
                      backgroundColor: colors.takeout,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.ratioSegment,
                    {
                      flex: dineOutPercent || 0,
                      backgroundColor: colors.dineout,
                      borderTopRightRadius: BorderRadius.sm,
                      borderBottomRightRadius: BorderRadius.sm,
                    },
                  ]}
                />
              </View>
              <View style={styles.legendRow}>
                <Chip
                  icon={() => (
                    <View style={[styles.legendDot, { backgroundColor: colors.home }]} />
                  )}
                  style={styles.legendChip}
                  textStyle={styles.legendChipText}
                >
                  Home {homePercent}%
                </Chip>
                <Chip
                  icon={() => (
                    <View style={[styles.legendDot, { backgroundColor: colors.takeout }]} />
                  )}
                  style={styles.legendChip}
                  textStyle={styles.legendChipText}
                >
                  Takeout {takeoutPercent}%
                </Chip>
                <Chip
                  icon={() => (
                    <View style={[styles.legendDot, { backgroundColor: colors.dineout }]} />
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
                            backgroundColor: colors.dineout,
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
                      color={colors.warning}
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
                            backgroundColor: colors.primary,
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
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(192, 83, 46, ${opacity})`,
                    labelColor: () => colors.textSecondary,
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: colors.primaryLight,
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
                        color={colors.home}
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
            <MaterialCommunityIcons name="chart-bar" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              Log some meals to see your insights here.
            </Text>
          </View>
        )}
      </ScrollView>

      <ShareStatModal stat={shareStat} onClose={() => setShareStat(null)} />
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    rangeRow: { gap: Spacing.xs, paddingRight: Spacing.md, marginBottom: Spacing.md },
    rangePill: {
      paddingVertical: 7,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.full,
      backgroundColor: c.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rangePillSelected: { backgroundColor: c.primary },
    segmentText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: c.textSecondary },
    segmentTextSelected: { color: c.white, fontFamily: Fonts.bodySemiBold },
    section: {
      borderRadius: BorderRadius.md,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    sectionTitle: { fontFamily: Fonts.display, fontSize: FontSize.lg, color: c.text, marginBottom: Spacing.md },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    kidsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
    kidsStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    kidsStatLabel: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary },
    kidsStatValue: { fontFamily: Fonts.display, fontSize: FontSize.lg },
    kidsStatSub: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: c.text },
    sectionTitleStandalone: {
      fontFamily: Fonts.display,
      fontSize: FontSize.lg,
      color: c.text,
      marginBottom: Spacing.sm,
      marginTop: Spacing.sm,
    },
    ratioBar: { flexDirection: 'row', height: 24, borderRadius: BorderRadius.sm, overflow: 'hidden', marginBottom: Spacing.sm },
    ratioSegment: { height: '100%' },
    legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xs },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendChip: { backgroundColor: c.surfaceVariant },
    legendChipText: { fontSize: FontSize.xs, color: c.text },
    comparisonText: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted, marginTop: Spacing.xs },
    kidsRow: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.sm },
    kidsStat: { alignItems: 'flex-start' },
    kidsValue: { fontFamily: Fonts.display, fontSize: FontSize.xxxl },
    kidsLabel: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    kidsTop: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: c.text },
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
    barLabel: { width: 80, fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.text },
    barTrack: { flex: 1, height: 12, backgroundColor: c.surfaceVariant, borderRadius: BorderRadius.sm, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: BorderRadius.sm },
    barValue: { width: 36, fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: c.textSecondary, textAlign: 'right' },
    alertRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
    alertText: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.warning, flex: 1 },
    chart: { borderRadius: BorderRadius.md, marginTop: Spacing.xs },
    metricsRow: { flexDirection: 'row', gap: Spacing.sm },
    metricWrapper: { flex: 1 },
    emptyState: { alignItems: 'center', marginTop: Spacing.xxl, gap: Spacing.md },
    emptyText: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.textMuted, textAlign: 'center' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl * 2, gap: Spacing.md },
    emptyTitle: { fontFamily: Fonts.display, fontSize: FontSize.xl, color: c.text },
    emptySubtitle: {
      fontFamily: Fonts.body,
      fontSize: FontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: Spacing.xl,
      lineHeight: 22,
    },
  });

export default InsightsScreen;
