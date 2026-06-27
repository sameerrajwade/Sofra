import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Text, Chip, ActivityIndicator, Button, Card, Banner } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Restaurant } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';
import { MetricCard } from '../components/MetricCard';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { getRestaurants } from '../services/firestore';
import { useMealStore } from '../stores/useMealStore';
import { getCurrencySymbol } from '../utils/currency';

type TimeRange = 'month' | '3months' | '6months' | 'all';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: 'all', label: 'All time' },
];

const getStartDate = (range: TimeRange): string | null => {
  const now = new Date();
  switch (range) {
    case 'month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return d.toISOString().split('T')[0];
    }
    case '3months': {
      const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return d.toISOString().split('T')[0];
    }
    case '6months': {
      const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return d.toISOString().split('T')[0];
    }
    case 'all':
      return null;
  }
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const RestaurantScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { meals } = useMealStore();
  const { preferences } = useHouseholdStore();
  const householdId = user?.householdId ?? '';

  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!householdId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRestaurants(householdId);
      setRestaurants(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const filteredRestaurants = useMemo(() => {
    const startDate = getStartDate(timeRange);
    if (!startDate) return restaurants;
    return restaurants.filter((r) => r.lastVisitDate >= startDate);
  }, [restaurants, timeRange]);

  const sortedRestaurants = useMemo(() => {
    return [...filteredRestaurants].sort((a, b) => b.totalVisits - a.totalVisits);
  }, [filteredRestaurants]);

  const totalSpend = useMemo(
    () => filteredRestaurants.reduce((sum, r) => sum + r.totalSpend, 0),
    [filteredRestaurants],
  );
  const totalVisits = useMemo(
    () => filteredRestaurants.reduce((sum, r) => sum + r.totalVisits, 0),
    [filteredRestaurants],
  );
  const uniquePlaces = filteredRestaurants.length;

  // Exploration nudge: top 2 restaurants have >60% of visits
  const showExplorationNudge = useMemo(() => {
    if (sortedRestaurants.length < 3 || totalVisits === 0) return false;
    const topTwoVisits = sortedRestaurants[0].totalVisits + sortedRestaurants[1].totalVisits;
    return topTwoVisits / totalVisits > 0.6;
  }, [sortedRestaurants, totalVisits]);

  const renderRestaurant = useCallback(
    ({ item }: { item: Restaurant }) => {
      const isFrequent = item.totalVisits > 4;
      return (
        <Card style={styles.restaurantCard}>
          <Card.Content>
            <View style={styles.restaurantHeader}>
              <View style={styles.restaurantInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.restaurantName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isFrequent && (
                    <Chip
                      compact
                      style={styles.frequentBadge}
                      textStyle={styles.frequentBadgeText}
                    >
                      Frequent
                    </Chip>
                  )}
                </View>
                <Text style={styles.cuisineText}>{item.cuisineType}</Text>
              </View>
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
    [currencySymbol],
  );

  if (isLoading && restaurants.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="outlined" onPress={fetchData}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={renderRestaurant}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListHeaderComponent={
          <View>
            {/* Time range selector */}
            <View style={styles.timeRangeRow}>
              {TIME_RANGES.map(({ value, label }) => (
                <Chip
                  key={value}
                  selected={timeRange === value}
                  onPress={() => setTimeRange(value)}
                  style={[styles.timeChip, timeRange === value && styles.timeChipSelected]}
                  textStyle={[
                    styles.timeChipText,
                    timeRange === value && styles.timeChipTextSelected,
                  ]}
                >
                  {label}
                </Chip>
              ))}
            </View>

            {/* Metric cards */}
            <View style={styles.metricsRow}>
              <View style={styles.metricWrapper}>
                <MetricCard
                  title="Total Spend"
                  value={`${currencySymbol}${totalSpend.toFixed(0)}`}
                  icon="currency-usd"
                  color={Colors.dineout}
                />
              </View>
              <View style={styles.metricWrapper}>
                <MetricCard
                  title="Total Visits"
                  value={totalVisits}
                  icon="map-marker-check"
                  color={Colors.primary}
                />
              </View>
              <View style={styles.metricWrapper}>
                <MetricCard
                  title="Unique Places"
                  value={uniquePlaces}
                  icon="store"
                  color={Colors.home}
                />
              </View>
            </View>

            {/* Exploration nudge */}
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
            <MaterialCommunityIcons name="store-off" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No restaurant visits yet</Text>
            <Text style={styles.emptySubtext}>
              Log a dine-out or takeout meal to start tracking
            </Text>
          </View>
        }
        contentContainerStyle={
          sortedRestaurants.length === 0 ? styles.emptyList : styles.listContent
        }
      />
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
    padding: Spacing.xl,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  timeRangeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  timeChip: {
    backgroundColor: Colors.surfaceVariant,
  },
  timeChipSelected: {
    backgroundColor: Colors.primary,
  },
  timeChipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  timeChipTextSelected: {
    color: Colors.white,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metricWrapper: {
    flex: 1,
  },
  nudgeBanner: {
    backgroundColor: Colors.takeoutLight,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  nudgeText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  restaurantCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    elevation: 1,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restaurantInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  restaurantName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  frequentBadge: {
    backgroundColor: Colors.primaryLight,
    height: 24,
  },
  frequentBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: '600',
  },
  cuisineText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  restaurantStats: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.error,
    marginVertical: Spacing.md,
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});

export default RestaurantScreen;
