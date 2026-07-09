import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format, parseISO } from 'date-fns';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { FadeSlideIn } from '../components/motion';
import { useAuthStore } from '../stores/useAuthStore';
import { useMealStore } from '../stores/useMealStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { getCurrencySymbol } from '../utils/currency';
import { getRestaurantByName, setRestaurantDishRating } from '../services/firestore';
import type { HomeStackScreenProps } from '../navigation/types';

type Props = HomeStackScreenProps<'RestaurantDetail'>;

const StarRating: React.FC<{ value: number; onRate: (n: number) => void; color: string; muted: string }> = ({
  value,
  onRate,
  color,
  muted,
}) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Pressable key={n} onPress={() => onRate(n)} hitSlop={6} accessibilityLabel={`Rate ${n} stars`}>
        <MaterialCommunityIcons name={n <= value ? 'star' : 'star-outline'} size={22} color={n <= value ? color : muted} />
      </Pressable>
    ))}
  </View>
);

export const RestaurantDetailScreen: React.FC<Props> = ({ route }) => {
  const { name } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';
  const { meals, fetchAllMeals } = useMealStore();
  const { preferences } = useHouseholdStore();
  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (householdId) fetchAllMeals(householdId).catch(() => {});
  }, [householdId, fetchAllMeals]);

  useEffect(() => {
    if (!householdId) return;
    getRestaurantByName(householdId, name)
      .then((r) => setRatings(r?.dishRatings ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [householdId, name]);

  const visits = useMemo(
    () => meals.filter((m) => m.restaurantName?.toLowerCase() === name.toLowerCase()),
    [meals, name],
  );

  const totalSpend = useMemo(() => visits.reduce((s, m) => s + (m.cost ?? 0), 0), [visits]);
  const lastVisit = useMemo(() => {
    const dates = visits.map((m) => m.date).sort();
    return dates.length ? dates[dates.length - 1] : '';
  }, [visits]);
  const cuisine = visits.find((m) => m.cuisineTag)?.cuisineTag ?? '';

  // Dishes ordered here, most-ordered first. Counts each dish in a multi-dish
  // order (meal.items); falls back to the single dishName for older entries.
  const dishes = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach((m) => {
      if (m.items && m.items.length > 0) {
        m.items.forEach((it) => {
          if (it.name) map.set(it.name, (map.get(it.name) ?? 0) + 1);
        });
      } else if (m.dishName) {
        map.set(m.dishName, (map.get(m.dishName) ?? 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([dishName, count]) => ({ dishName, count }))
      .sort((a, b) => b.count - a.count);
  }, [visits]);

  const rate = useCallback(
    (dishName: string, n: number) => {
      setRatings((prev) => ({ ...prev, [dishName]: n }));
      setRestaurantDishRating(householdId, name, dishName, n).catch(() => {});
    },
    [householdId, name],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeSlideIn>
        <Text style={styles.name}>{name}</Text>
        {cuisine ? <Text style={styles.cuisine}>{cuisine}</Text> : null}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{visits.length}</Text>
            <Text style={styles.statLabel}>visits</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{currencySymbol}{totalSpend.toFixed(0)}</Text>
            <Text style={styles.statLabel}>spent</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{lastVisit ? format(parseISO(lastVisit + 'T00:00:00'), 'MMM d') : '—'}</Text>
            <Text style={styles.statLabel}>last visit</Text>
          </View>
        </View>
      </FadeSlideIn>

      <Text style={styles.sectionLabel}>Dishes you've ordered</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: Spacing.lg }} color={colors.primary} />
      ) : dishes.length === 0 ? (
        <Text style={styles.empty}>No dishes logged here yet. Add a meal with this restaurant to track what you order.</Text>
      ) : (
        <View style={styles.card}>
          {dishes.map((d, i) => (
            <View key={d.dishName} style={[styles.dishRow, i > 0 && styles.dishRowBorder]}>
              <View style={styles.dishInfo}>
                <Text style={styles.dishName}>{d.dishName}</Text>
                <Text style={styles.dishCount}>ordered {d.count}×</Text>
              </View>
              <StarRating
                value={ratings[d.dishName] ?? 0}
                onRate={(n) => rate(d.dishName, n)}
                color={colors.takeout}
                muted={colors.border}
              />
            </View>
          ))}
        </View>
      )}
      <Text style={styles.hint}>Tap the stars to remember what to order (or avoid) next time.</Text>
      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing.md },
    name: { fontFamily: Fonts.display, fontSize: FontSize.xxl, color: c.text },
    cuisine: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
    statsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingVertical: Spacing.md,
    },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontFamily: Fonts.display, fontSize: FontSize.lg, color: c.text },
    statLabel: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 },
    sectionLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
      marginLeft: Spacing.xs,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
    },
    dishRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
    },
    dishRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    dishInfo: { flex: 1, marginRight: Spacing.sm },
    dishName: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.text },
    dishCount: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted, marginTop: 1 },
    empty: {
      fontFamily: Fonts.body,
      fontSize: FontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      lineHeight: 22,
    },
    hint: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', marginTop: Spacing.md },
  });

export default RestaurantDetailScreen;
