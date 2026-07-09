import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Text, ActivityIndicator, Card, Banner } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { MetricCard } from '../components/MetricCard';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useMealStore } from '../stores/useMealStore';
import { getCurrencySymbol } from '../utils/currency';

type TimeRange = 'month' | 'lastMonth' | '3months' | 'all';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: '3months', label: 'Last 3 months' },
  { value: 'all', label: 'All' },
];

// Closed [start, end] window (end null = up to today). Uses local-time format().
const getRange = (range: TimeRange): { start: string | null; end: string | null } => {
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth();
  switch (range) {
    case 'month':
      return { start: format(new Date(y, mo, 1), 'yyyy-MM-dd'), end: null };
    case 'lastMonth':
      return {
        start: format(new Date(y, mo - 1, 1), 'yyyy-MM-dd'),
        end: format(new Date(y, mo, 0), 'yyyy-MM-dd'), // day 0 = last day of prev month
      };
    case '3months':
      return { start: format(new Date(y, mo - 2, 1), 'yyyy-MM-dd'), end: null };
    case 'all':
      return { start: null, end: null };
  }
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

interface RestaurantSummary {
  id: string;
  name: string;
  cuisineType: string;
  totalVisits: number;
  totalSpend: number;
  lastVisitDate: string;
}

export const RestaurantScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { meals, fetchAllMeals, isLoading } = useMealStore();
  const { preferences } = useHouseholdStore();
  const householdId = user?.householdId ?? '';

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<any>();

  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (householdId) {
        fetchAllMeals(householdId).catch(() => {});
      }
    }, [householdId, fetchAllMeals]),
  );

  const onRefresh = useCallback(async () => {
    if (!householdId) return;
    setRefreshing(true);
    await fetchAllMeals(householdId, true).catch(() => {});
    setRefreshing(false);
  }, [householdId, fetchAllMeals]);

  // Compute restaurant summary directly from meals (always up-to-date with edits)
  const restaurants = useMemo((): RestaurantSummary[] => {
    const { start, end } = getRange(timeRange);
    const upper = end ?? format(new Date(), 'yyyy-MM-dd');
    const outsideMeals = meals.filter((m) => {
      const isOutside = m.sourceType === 'dineout' || m.sourceType === 'takeout';
      if (!isOutside || !m.restaurantName) return false;
      if (start && m.date < start) return false;
      if (m.date > upper) return false; // exclude future/out-of-window meals
      return true;
    });

    const map = new Map<string, RestaurantSummary>();
    for (const m of outsideMeals) {
      const key = m.restaurantName!.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.totalVisits += 1;
        existing.totalSpend += m.cost ?? 0;
        if (m.date > existing.lastVisitDate) existing.lastVisitDate = m.date;
      } else {
        map.set(key, {
          id: m.restaurantName!,
          name: m.restaurantName!,
          cuisineType: m.cuisineTag ?? '',
          totalVisits: 1,
          totalSpend: m.cost ?? 0,
          lastVisitDate: m.date,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalVisits - a.totalVisits);
  }, [meals, timeRange]);

  const totalSpend = useMemo(() => restaurants.reduce((s, r) => s + r.totalSpend, 0), [restaurants]);
  const totalVisits = useMemo(() => restaurants.reduce((s, r) => s + r.totalVisits, 0), [restaurants]);
  const uniquePlaces = restaurants.length;

  const showExplorationNudge = useMemo(() => {
    if (restaurants.length < 3 || totalVisits === 0) return false;
    const topTwoVisits = restaurants[0].totalVisits + restaurants[1].totalVisits;
    return topTwoVisits / totalVisits > 0.6;
  }, [restaurants, totalVisits]);

  // Compact row for the "All" list — with a large restaurant count, full stat
  // cards don't scale, so show a scannable line and defer details to the tap.
  const renderRestaurantCompact = useCallback(
    ({ item }: { item: RestaurantSummary }) => (
      <Card
        style={styles.compactCard}
        onPress={() => navigation.navigate('RestaurantDetail', { name: item.name })}
      >
        <Card.Content style={styles.compactContent}>
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.compactMeta} numberOfLines={1}>
              {item.totalVisits} {item.totalVisits === 1 ? 'visit' : 'visits'} · last {formatDate(item.lastVisitDate)}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
        </Card.Content>
      </Card>
    ),
    [styles, colors, navigation],
  );

  const renderRestaurant = useCallback(
    ({ item }: { item: RestaurantSummary }) => {
      const isFrequent = item.totalVisits > 4;
      return (
        <Card
          style={styles.restaurantCard}
          onPress={() => navigation.navigate('RestaurantDetail', { name: item.name })}
        >
          <Card.Content>
            <View style={styles.restaurantHeader}>
              <View style={styles.restaurantInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.restaurantName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isFrequent && (
                    <View style={styles.frequentPill}>
                      <Text style={styles.frequentPillText}>Frequent</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cuisineText}>{item.cuisineType}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
            </View>
            <View style={styles.restaurantStats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{item.totalVisits}</Text>
                <Text style={styles.statLabel}>visits</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{currencySymbol}{item.totalSpend.toFixed(0)}</Text>
                <Text style={styles.statLabel}>spent</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatDate(item.lastVisitDate)}</Text>
                <Text style={styles.statLabel}>last visit</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    },
    [currencySymbol, styles, colors, navigation],
  );

  if (isLoading && meals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        renderItem={timeRange === 'all' ? renderRestaurantCompact : renderRestaurant}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.segment}>
              {TIME_RANGES.map(({ value, label }) => {
                const selected = timeRange === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setTimeRange(value)}
                    style={[styles.segmentItem, selected && styles.segmentItemSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[styles.segmentText, selected && styles.segmentTextSelected]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricWrapper}>
                <MetricCard
                  title="Total Spend"
                  value={`${currencySymbol}${totalSpend.toFixed(0)}`}
                  icon="currency-usd"
                  color={colors.dineout}
                />
              </View>
              <View style={styles.metricWrapper}>
                <MetricCard
                  title="Total Visits"
                  value={totalVisits}
                  icon="map-marker-check"
                  color={colors.primary}
                />
              </View>
              <View style={styles.metricWrapper}>
                <MetricCard
                  title="Unique Places"
                  value={uniquePlaces}
                  icon="store"
                  color={colors.home}
                />
              </View>
            </View>

            {showExplorationNudge && (
              <Banner
                visible
                style={styles.nudgeBanner}
                icon="lightbulb-outline"
                actions={[]}
              >
                <Text style={styles.nudgeText}>
                  Your top 2 restaurants account for over 60% of visits. Try exploring new places!
                </Text>
              </Banner>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="store-off" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No restaurant visits yet</Text>
            <Text style={styles.emptySubtext}>
              Log a dine-out or takeout meal to start tracking
            </Text>
          </View>
        }
        contentContainerStyle={
          restaurants.length === 0 ? styles.emptyList : styles.listContent
        }
      />
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    listContent: { paddingBottom: Spacing.xl },
    segment: {
      flexDirection: 'row',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
      backgroundColor: c.surfaceVariant,
      borderRadius: BorderRadius.full,
      padding: 3,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: 7,
      paddingHorizontal: 4,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentItemSelected: { backgroundColor: c.primary },
    segmentText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.xs, color: c.textSecondary },
    segmentTextSelected: { color: c.white, fontFamily: Fonts.bodySemiBold },
    metricsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm },
    metricWrapper: { flex: 1 },
    nudgeBanner: {
      backgroundColor: c.takeoutLight,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    nudgeText: { fontSize: FontSize.sm, color: c.text },
    restaurantCard: {
      backgroundColor: c.surface,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    compactCard: {
      backgroundColor: c.surface,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.xs,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    compactContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    compactInfo: { flex: 1, marginRight: Spacing.sm },
    compactName: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.md, color: c.text },
    compactMeta: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 },
    restaurantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    restaurantInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    restaurantName: { fontFamily: Fonts.display, fontSize: FontSize.lg, color: c.text, flex: 1 },
    frequentPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      backgroundColor: c.primaryLight,
    },
    frequentPillText: { fontSize: FontSize.xs, color: c.white, fontWeight: '600' },
    cuisineText: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary, marginTop: 2 },
    restaurantStats: { flexDirection: 'row', marginTop: Spacing.sm, gap: Spacing.lg },
    stat: { alignItems: 'center' },
    statValue: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.md, color: c.text },
    statLabel: { fontSize: FontSize.xs, color: c.textMuted },
    loadingText: { marginTop: Spacing.md, fontSize: FontSize.md, color: c.textSecondary },
    emptyList: { flexGrow: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, marginTop: Spacing.xxl },
    emptyText: { fontFamily: Fonts.display, fontSize: FontSize.lg, color: c.textSecondary, marginTop: Spacing.md },
    emptySubtext: { fontSize: FontSize.md, color: c.textMuted, marginTop: Spacing.xs, textAlign: 'center' },
  });

export default RestaurantScreen;
