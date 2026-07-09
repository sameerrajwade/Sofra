import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format, addDays, differenceInDays, parseISO, startOfMonth, subMonths } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { MetricCard } from '../components/MetricCard';
import { MealCard } from '../components/MealCard';
import { ShareStatModal, ShareStat } from '../components/ShareStatModal';
import { FadeSlideIn, PressableScale } from '../components/motion';
import { useAuthStore } from '../stores/useAuthStore';
import { useMealStore } from '../stores/useMealStore';
import { useDishStore } from '../stores/useDishStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { scheduleDaily } from '../services/notifications';
import { getCurrencySymbol } from '../utils/currency';
import { mealTypeIcon } from '../utils/icons';
import { getFestival } from '../utils/festival';
import type { HomeStackScreenProps } from '../navigation/types';
import type { MealType } from '../types';

type Props = HomeStackScreenProps<'HomeMain'>;

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [shareStat, setShareStat] = React.useState<ShareStat | null>(null);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';
  const { meals, isLoading: mealsLoading, fetchMeals } = useMealStore();
  const { dishes, fetchDishes } = useDishStore();
  const { preferences } = useHouseholdStore();

  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');
  const currencyIcon = (() => {
    switch (preferences?.currency) {
      case 'INR': return 'currency-inr';
      case 'EUR': return 'currency-eur';
      case 'GBP': return 'currency-gbp';
      case 'JPY': return 'currency-jpy';
      case 'CAD': return 'currency-cad';
      default: return 'currency-usd';
    }
  })();

  const today = format(new Date(), 'yyyy-MM-dd');
  const thisMonthStart = useMemo(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'), []);
  const prevMonthStart = useMemo(() => format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'), []);

  const loadData = useCallback(async (force = false) => {
    if (!householdId) return;
    await Promise.all([fetchMeals(householdId, prevMonthStart, today, force), fetchDishes(householdId)]);
  }, [householdId, prevMonthStart, today, fetchMeals, fetchDishes]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Family dashboard metrics exclude the kids-tiffin track (shown separately).
  const monthMeals = useMemo(
    () => meals.filter((m) => m.date >= thisMonthStart && m.date <= today && m.audience !== 'kids'),
    [meals, thisMonthStart, today],
  );
  const prevMonthMeals = useMemo(
    () => meals.filter((m) => m.date >= prevMonthStart && m.date < thisMonthStart && m.audience !== 'kids'),
    [meals, prevMonthStart, thisMonthStart],
  );
  const kidsMonthCount = useMemo(
    () => meals.filter((m) => m.date >= thisMonthStart && m.date <= today && m.audience === 'kids').length,
    [meals, thisMonthStart, today],
  );

  const homeCookedPercent = useMemo(() => {
    if (monthMeals.length === 0) return 0;
    return Math.round((monthMeals.filter((m) => m.sourceType === 'home').length / monthMeals.length) * 100);
  }, [monthMeals]);
  const homeCookedTrend = useMemo(() => {
    if (prevMonthMeals.length === 0) return 0;
    const prev = Math.round((prevMonthMeals.filter((m) => m.sourceType === 'home').length / prevMonthMeals.length) * 100);
    return homeCookedPercent - prev;
  }, [prevMonthMeals, homeCookedPercent]);
  const dineOutCount = useMemo(() => monthMeals.filter((m) => m.sourceType === 'dineout').length, [monthMeals]);
  const dineOutCountLastMonth = useMemo(
    () => prevMonthMeals.filter((m) => m.sourceType === 'dineout').length,
    [prevMonthMeals],
  );
  const uniqueDishNames = useMemo(
    () => Array.from(new Set(monthMeals.filter((m) => m.dishName).map((m) => m.dishName))),
    [monthMeals],
  );
  const outsideSpending = useMemo(
    () => monthMeals.filter((m) => m.sourceType !== 'home').reduce((s, m) => s + (m.cost ?? 0), 0),
    [monthMeals],
  );
  const outsideSpendingTrend = useMemo(() => {
    const prevSpend = prevMonthMeals.filter((m) => m.sourceType !== 'home').reduce((s, m) => s + (m.cost ?? 0), 0);
    if (prevSpend === 0) return 0;
    return Math.round(((outsideSpending - prevSpend) / prevSpend) * 100);
  }, [prevMonthMeals, outsideSpending]);
  const hasMonthData = monthMeals.length > 0;

  // Today's meals for every configured meal type (∪ anything logged today).
  const todayTypes = useMemo(() => {
    const base = new Set<MealType>(preferences?.defaultMeals ?? ['lunch', 'dinner']);
    meals.forEach((m) => {
      if (m.date === today) base.add(m.mealType);
    });
    return MEAL_ORDER.filter((t) => base.has(t));
  }, [preferences, meals, today]);

  const mealForToday = useCallback(
    (t: MealType) => meals.find((m) => m.date === today && m.mealType === t && m.audience !== 'kids') ?? null,
    [meals, today],
  );

  const kidsForToday = useMemo(
    () => meals.filter((m) => m.date === today && m.audience === 'kids'),
    [meals, today],
  );

  // Keep the daily reminder's text in sync with tomorrow's actual plan (local
  // notifications carry fixed text, so we re-schedule with fresh content here).
  const dailyOn = useNotificationStore((s) => s.daily);
  const dailyHour = useNotificationStore((s) => s.dailyHour);
  const notifHydrated = useNotificationStore((s) => s.hydrated);
  useEffect(() => {
    if (!notifHydrated || !dailyOn) return;
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const lunch = meals.find((m) => m.date === tomorrow && m.mealType === 'lunch' && m.audience !== 'kids');
    const dinner = meals.find((m) => m.date === tomorrow && m.mealType === 'dinner' && m.audience !== 'kids');
    const kids = meals.find((m) => m.date === tomorrow && m.audience === 'kids');
    const parts: string[] = [];
    if (lunch?.dishName) parts.push(`Lunch: ${lunch.dishName}`);
    if (dinner?.dishName) parts.push(`Dinner: ${dinner.dishName}`);
    if (kids?.dishName) parts.push(`Kids: ${kids.dishName}`);
    const body = parts.length
      ? `Tomorrow — ${parts.join(' · ')}`
      : 'Nothing planned for tomorrow yet. Tap to plan.';
    scheduleDaily(dailyHour, body).catch(() => {});
  }, [meals, dailyOn, dailyHour, notifHydrated, today]);

  // #4: only surface dishes NOT made within the rotation window (default 14d).
  const forgottenDishes = useMemo(() => {
    const threshold = preferences?.dishRotationDays ?? 14;
    const now = new Date();
    return [...dishes]
      .filter((d) => {
        if (!d.lastCookedDate || d.lastCookedDate > today) return false;
        return differenceInDays(now, parseISO(d.lastCookedDate + 'T00:00:00')) >= threshold;
      })
      .sort(
        (a, b) =>
          differenceInDays(now, parseISO(b.lastCookedDate + 'T00:00:00')) -
          differenceInDays(now, parseISO(a.lastCookedDate + 'T00:00:00')),
      )
      .slice(0, 10);
  }, [dishes, today, preferences]);

  const handleAddMeal = useCallback(() => {
    navigation.getParent()?.getParent()?.navigate('AddMeal');
  }, [navigation]);

  const handleMealPress = useCallback(
    (meal: any) => navigation.getParent()?.getParent()?.navigate('AddMeal', { meal }),
    [navigation],
  );

  const firstName = (user?.name ?? '').trim().split(/\s+/)[0] || '';
  const festival = getFestival();
  const greeting = festival
    ? festival.greeting
    : (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
      })();
  const headerWidth = Dimensions.get('window').width;
  const headerHeight = insets.top + 156;

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
        refreshControl={<RefreshControl refreshing={mealsLoading} onRefresh={() => loadData(true)} tintColor={colors.primary} />}
      >
        <View style={[styles.brandHeaderWrap, { height: headerHeight }]}>
          {/* Soft radial terracotta wash — anchors the brand the instant Home opens */}
          <Svg width={headerWidth} height={headerHeight} style={styles.brandWash}>
            <Defs>
              <RadialGradient id="wash" cx="50%" cy="34%" rx="62%" ry="62%">
                <Stop offset="0" stopColor={colors.primary} stopOpacity={isDark ? 0.28 : 0.16} />
                <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={headerWidth} height={headerHeight} fill="url(#wash)" />
            {/* faint thali motif: a plate ring with three small bowls; turns
                golden on festival days */}
            {(() => {
              const motif = festival ? colors.takeout : colors.primary;
              const cx = headerWidth / 2;
              return (
                <>
                  <Circle cx={cx} cy={insets.top + 60} r="52" stroke={motif} strokeWidth="1.5" opacity={0.09} fill="none" />
                  <Circle cx={cx - 26} cy={insets.top + 46} r="11" stroke={motif} strokeWidth="1.5" opacity={0.09} fill="none" />
                  <Circle cx={cx + 26} cy={insets.top + 46} r="11" stroke={motif} strokeWidth="1.5" opacity={0.09} fill="none" />
                  <Circle cx={cx} cy={insets.top + 78} r="13" stroke={motif} strokeWidth="1.5" opacity={0.09} fill="none" />
                  {festival && (
                    <>
                      <Circle cx={cx - 92} cy={insets.top + 40} r="4" fill={colors.takeout} opacity={0.5} />
                      <Circle cx={cx + 92} cy={insets.top + 40} r="4" fill={colors.takeout} opacity={0.5} />
                      <Circle cx={cx - 70} cy={insets.top + 24} r="3" fill={colors.takeout} opacity={0.4} />
                      <Circle cx={cx + 70} cy={insets.top + 24} r="3" fill={colors.takeout} opacity={0.4} />
                    </>
                  )}
                </>
              );
            })()}
          </Svg>
          <View style={[styles.brandHeader, { paddingTop: insets.top + Spacing.md }]}>
            {firstName ? (
              <Text style={styles.greeting}>{greeting}, {firstName}</Text>
            ) : (
              <Text style={styles.greeting}>{greeting}</Text>
            )}
            <View style={styles.brandRow}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.primary} />
              <Text style={styles.brandName}>Sofra</Text>
              <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.primary} />
            </View>
            <Text style={styles.brandTagline}>Your family's meal memory</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>This month</Text>
        {mealsLoading && monthMeals.length === 0 ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : hasMonthData ? (
          <FadeSlideIn>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCol}>
                <PressableScale onPress={() => navigation.getParent()?.navigate('Insights')}>
                  <MetricCard title="Home Cooked" value={`${homeCookedPercent}%`} trend={homeCookedTrend} icon="pot-steam" color={colors.home} />
                </PressableScale>
              </View>
              <View style={styles.metricCol}>
                <PressableScale onPress={() => navigation.navigate('Restaurants')}>
                  <MetricCard title="Dine Outs" value={dineOutCount} subtitle={`${dineOutCountLastMonth} last month`} icon="store" color={colors.dineout} />
                </PressableScale>
              </View>
              <View style={styles.metricCol}>
                <PressableScale onPress={() => navigation.navigate('DishLibrary', { monthDishes: uniqueDishNames, title: 'Dishes this month' })}>
                  <MetricCard
                    title="Unique Dishes"
                    value={uniqueDishNames.length}
                    icon="food-variant"
                    color={colors.primary}
                    onShare={() =>
                      setShareStat({
                        headline: 'Unique dishes this month',
                        value: `${uniqueDishNames.length}`,
                        sub: 'Cooking with variety',
                        accent: colors.primary,
                      })
                    }
                  />
                </PressableScale>
              </View>
              <View style={styles.metricCol}>
                <PressableScale onPress={() => navigation.getParent()?.navigate('Insights')}>
                  <MetricCard title="Outside Spend" value={`${currencySymbol}${outsideSpending.toFixed(0)}`} trend={outsideSpendingTrend} icon={currencyIcon} color={colors.takeout} />
                </PressableScale>
              </View>
              {kidsMonthCount > 0 && (
                <View style={styles.metricCol}>
                  <PressableScale onPress={() => navigation.getParent()?.navigate('Insights')}>
                    <MetricCard title="Kids Tiffins" value={kidsMonthCount} icon="emoticon-happy-outline" color={colors.kids} />
                  </PressableScale>
                </View>
              )}
            </View>
          </FadeSlideIn>
        ) : (
          <View style={styles.emptyBlock}>
            <Svg width={80} height={80} viewBox="0 0 80 80">
              <Circle cx="40" cy="40" r="30" stroke={colors.border} strokeWidth="2.5" fill="none" />
              <Circle cx="40" cy="40" r="18" stroke={colors.primary} strokeWidth="2" strokeDasharray="3 5" fill="none" opacity={0.55} />
              <Circle cx="40" cy="22" r="3" fill={colors.primary} opacity={0.5} />
            </Svg>
            <Text style={styles.emptyTitle}>Start your meal memory</Text>
            <Text style={styles.emptyText}>
              Tap the + button to log your first meal. Your dashboard fills in as you go.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Today's meals</Text>
        <View style={styles.todayMeals}>
          {todayTypes.map((t) => {
            const meal = mealForToday(t);
            return (
              <View key={t}>
                <View style={styles.mealLabelRow}>
                  <MaterialCommunityIcons name={mealTypeIcon(t) as any} size={13} color={colors.textMuted} />
                  <Text style={styles.mealLabel}>{MEAL_LABEL[t]}</Text>
                </View>
                <MealCard
                  meal={meal}
                  placeholder={`No ${MEAL_LABEL[t].toLowerCase()} planned`}
                  onPress={() => (meal ? handleMealPress(meal) : handleAddMeal())}
                />
              </View>
            );
          })}
        </View>

        {kidsForToday.length > 0 && (
          <>
            <View style={styles.mealLabelRow}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={13} color={colors.kids} />
              <Text style={[styles.mealLabel, { color: colors.kids }]}>Kids tiffin</Text>
            </View>
            {kidsForToday.map((meal) => (
              <MealCard key={meal.id} meal={meal} onPress={() => handleMealPress(meal)} />
            ))}
          </>
        )}

        {forgottenDishes.length > 0 && (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('DishLibrary')}>
              <Text style={styles.sectionTitle}>Dishes you haven't made in a while {'›'}</Text>
            </TouchableOpacity>
            {forgottenDishes.map((item) => {
              const daysAgo = differenceInDays(new Date(), parseISO(item.lastCookedDate + 'T00:00:00'));
              return (
                <View key={item.id} style={styles.forgottenRow}>
                  <Text style={styles.forgottenName}>{item.name}</Text>
                  <Text style={styles.forgottenDays}>{daysAgo} days ago</Text>
                </View>
              );
            })}
          </>
        )}

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>Sofra</Text>
          <View style={styles.footerLine} />
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={handleAddMeal} color={colors.white} accessibilityLabel="Add meal" />

      <ShareStatModal stat={shareStat} onClose={() => setShareStat(null)} />
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl + Spacing.xl },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    loader: { marginVertical: Spacing.lg },
    sectionTitle: {
      fontFamily: Fonts.display,
      fontSize: FontSize.xl,
      color: c.text,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    brandHeaderWrap: {
      marginHorizontal: -Spacing.md, // full-bleed wash to screen edges
      marginBottom: Spacing.xs,
      justifyContent: 'flex-end',
    },
    brandWash: { position: 'absolute', top: 0, left: 0 },
    brandHeader: {
      alignItems: 'center',
      paddingBottom: Spacing.md,
    },
    greeting: {
      fontFamily: Fonts.body,
      fontSize: FontSize.sm,
      color: c.textSecondary,
      marginBottom: 2,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    brandName: {
      fontFamily: Fonts.display,
      fontSize: 30,
      color: c.text,
    },
    brandTagline: {
      fontFamily: Fonts.displayMedium,
      fontSize: FontSize.sm,
      color: c.textSecondary,
      marginTop: 2,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
      marginTop: Spacing.xl,
    },
    footerLine: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, flex: 1, maxWidth: 60 },
    footerText: {
      fontFamily: Fonts.display,
      fontSize: FontSize.md,
      color: c.textMuted,
      letterSpacing: 1,
    },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -Spacing.xs },
    metricCol: { width: '50%', paddingHorizontal: Spacing.xs },
    todayMeals: { marginBottom: Spacing.sm },
    mealLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    mealLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    emptyBlock: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
    emptyTitle: { fontFamily: Fonts.display, fontSize: FontSize.lg, color: c.text, marginTop: Spacing.sm },
    emptyText: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.textMuted, textAlign: 'center', marginVertical: Spacing.xs, paddingHorizontal: Spacing.lg, lineHeight: 21 },
    forgottenRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: BorderRadius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    forgottenName: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.text },
    forgottenDays: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted },
    fab: {
      position: 'absolute',
      right: Spacing.md,
      bottom: Spacing.md,
      backgroundColor: c.primary,
      borderRadius: BorderRadius.full,
    },
  });

export default HomeScreen;
