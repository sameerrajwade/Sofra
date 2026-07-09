import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SectionList,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Searchbar, Text, Chip, ActivityIndicator, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { Meal, SourceType } from '../types';
import {
  Spacing,
  FontSize,
  BorderRadius,
  Fonts,
  ThemeColors,
  sourceTypeLabel,
} from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { sourceIcon } from '../utils/icons';
import { useAuthStore } from '../stores/useAuthStore';
import { useMealStore } from '../stores/useMealStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { getCurrencySymbol } from '../utils/currency';

type SourceFilter = 'all' | SourceType;

interface HistorySection {
  title: string;
  data: DayGroup[];
}

interface DayGroup {
  date: string;
  meals: Meal[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatDayLabel = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const srcColor = (c: ThemeColors, type: string) => {
  switch (type) {
    case 'home':
      return c.home;
    case 'takeout':
      return c.takeout;
    case 'dineout':
      return c.dineout;
    default:
      return c.textSecondary;
  }
};

interface Props {
  navigation: any;
}

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user } = useAuthStore();
  const { meals, isLoading, fetchMealsByDateRange } = useMealStore();
  const { preferences } = useHouseholdStore();
  const householdId = user?.householdId ?? '';

  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [loadedMonths, setLoadedMonths] = useState(3);

  useEffect(() => {
    if (!householdId) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - loadedMonths, 1);
    fetchMealsByDateRange(
      householdId,
      format(start, 'yyyy-MM-dd'),
      format(now, 'yyyy-MM-dd'),
    );
  }, [householdId]);

  const filteredMeals = useMemo(() => {
    let result = [...meals];

    if (sourceFilter !== 'all') {
      result = result.filter((m) => m.sourceType === sourceFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.dishName.toLowerCase().includes(q) ||
          (m.restaurantName && m.restaurantName.toLowerCase().includes(q)),
      );
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [meals, sourceFilter, search]);

  const sections: HistorySection[] = useMemo(() => {
    const monthMap = new Map<string, Map<string, Meal[]>>();

    for (const meal of filteredMeals) {
      const d = new Date(meal.date + 'T00:00:00');
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, new Map());
      }
      const dayMap = monthMap.get(monthKey)!;
      if (!dayMap.has(meal.date)) {
        dayMap.set(meal.date, []);
      }
      dayMap.get(meal.date)!.push(meal);
    }

    const result: HistorySection[] = [];
    const sortedMonths = Array.from(monthMap.keys()).sort().reverse();

    for (const monthKey of sortedMonths) {
      const d = new Date(monthKey + '-01T00:00:00');
      const title = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      const dayMap = monthMap.get(monthKey)!;
      const days: DayGroup[] = Array.from(dayMap.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dayMeals]) => ({ date, meals: dayMeals }));

      result.push({ title, data: days });
    }

    return result;
  }, [filteredMeals]);

  const handleExport = useCallback(async () => {
    if (filteredMeals.length === 0) {
      Alert.alert('No data', 'Nothing to export.');
      return;
    }

    const header = 'Date,Meal Type,Dish,Source,Restaurant,Cost\n';
    const rows = filteredMeals
      .map(
        (m) =>
          `${m.date},${m.mealType},"${m.dishName}",${m.sourceType},"${m.restaurantName ?? ''}",${m.cost ?? 0}`,
      )
      .join('\n');

    try {
      await Share.share({ message: header + rows, title: 'Sofra Meal History' });
    } catch {
      Alert.alert('Error', 'Could not share data.');
    }
  }, [filteredMeals]);

  const handleLoadMore = useCallback(() => {
    const newMonths = loadedMonths + 3;
    setLoadedMonths(newMonths);
    if (!householdId) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - newMonths, 1);
    fetchMealsByDateRange(
      householdId,
      format(start, 'yyyy-MM-dd'),
      format(now, 'yyyy-MM-dd'),
    );
  }, [loadedMonths, householdId, fetchMealsByDateRange]);

  const handleMealPress = useCallback(
    (meal: Meal) => {
      // Navigate to AddMeal screen for editing via root navigator
      navigation.getParent()?.getParent()?.navigate('AddMeal', { meal });
    },
    [navigation],
  );

  const renderMealCell = (meal: Meal | undefined, type: string) => {
    if (!meal) {
      return (
        <View style={styles.mealCell}>
          <Text style={styles.mealTypeLabel}>{type}</Text>
          <Text style={styles.emptyMealText}>--</Text>
        </View>
      );
    }

    const chipColor = srcColor(colors, meal.sourceType);
    return (
      <TouchableOpacity
        style={styles.mealCell}
        onPress={() => handleMealPress(meal)}
        accessibilityLabel={`${type}: ${meal.dishName}`}
      >
        <Text style={styles.mealTypeLabel}>{type}</Text>
        <Text style={styles.mealDishName} numberOfLines={1}>
          {meal.dishName}
        </Text>
        {meal.items && meal.items.length > 1 && (
          <Text style={styles.itemsMore}>+{meal.items.length - 1} more</Text>
        )}
        <View style={styles.mealBadgeRow}>
          <View style={[styles.sourceBadge, { backgroundColor: chipColor }]}>
            <MaterialCommunityIcons name={sourceIcon(meal.sourceType) as any} size={10} color={colors.white} />
            <Text style={styles.sourceBadgeText}>{sourceTypeLabel(meal.sourceType)}</Text>
          </View>
          {meal.cost !== undefined && meal.cost > 0 && (
            <Text style={styles.mealCost}>{currencySymbol}{meal.cost.toFixed(0)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDayGroup = useCallback(
    ({ item }: { item: DayGroup }) => {
      // Show family meals in the grid; kids tiffins live in their own views.
      const lunch = item.meals.find((m) => m.mealType === 'lunch' && m.audience !== 'kids');
      const dinner = item.meals.find((m) => m.mealType === 'dinner' && m.audience !== 'kids');

      return (
        <View style={styles.dayRow}>
          <Text style={styles.dayLabel}>{formatDayLabel(item.date)}</Text>
          <View style={styles.mealsRow}>
            {renderMealCell(lunch, 'Lunch')}
            {renderMealCell(dinner, 'Dinner')}
          </View>
        </View>
      );
    },
    [currencySymbol, handleMealPress, colors, styles],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: HistorySection }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    [styles],
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleExport} style={styles.headerButton}>
          <MaterialCommunityIcons name="export-variant" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleExport, colors, styles]);

  if (isLoading && meals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter buttons */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'home', label: 'Home' },
            { key: 'takeout', label: 'Takeout' },
            { key: 'dineout', label: 'Dine Out' },
          ] as const
        ).map(({ key, label }) => (
          <Chip
            key={key}
            selected={sourceFilter === key}
            onPress={() => setSourceFilter(key)}
            style={[styles.filterChip, sourceFilter === key && styles.filterChipSelected]}
            textStyle={[
              styles.filterChipText,
              sourceFilter === key && styles.filterChipTextSelected,
            ]}
          >
            {label}
          </Chip>
        ))}
      </View>

      <Searchbar
        placeholder="Search dish or restaurant..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
        iconColor={colors.textSecondary}
        placeholderTextColor={colors.textMuted}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.date + index}
        renderItem={renderDayGroup}
        renderSectionHeader={renderSectionHeader}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No meal history</Text>
            <Text style={styles.emptySubtext}>
              {search ? 'Try a different search' : 'Start logging meals to see your history'}
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.footerLoader}
            />
          ) : null
        }
        stickySectionHeadersEnabled
        contentContainerStyle={sections.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      gap: Spacing.xs,
    },
    filterChip: {
      backgroundColor: c.surfaceVariant,
    },
    filterChipSelected: {
      backgroundColor: c.primary,
    },
    filterChipText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.text,
    },
    filterChipTextSelected: {
      color: c.white,
    },
    searchbar: {
      margin: Spacing.md,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      elevation: 1,
    },
    searchInput: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.text,
    },
    sectionHeader: {
      backgroundColor: c.background,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    sectionTitle: {
      fontSize: FontSize.lg,
      fontFamily: Fonts.display,
      color: c.text,
    },
    dayRow: {
      backgroundColor: c.surface,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.xs,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      elevation: 1,
    },
    dayLabel: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodySemiBold,
      color: c.textSecondary,
      marginBottom: Spacing.xs,
    },
    mealsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    mealCell: {
      flex: 1,
      backgroundColor: c.surfaceVariant,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
    },
    mealTypeLabel: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.bodyMedium,
      color: c.textMuted,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    mealDishName: {
      fontSize: FontSize.md,
      fontFamily: Fonts.bodySemiBold,
      color: c.text,
      marginBottom: Spacing.xs,
    },
    emptyMealText: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.textMuted,
    },
    mealBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    sourceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    sourceBadgeText: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.bodySemiBold,
      color: c.white,
    },
    mealCost: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.bodySemiBold,
      color: c.textSecondary,
    },
    itemsMore: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.body,
      color: c.textMuted,
      marginBottom: 2,
    },
    headerButton: {
      marginRight: Spacing.md,
      padding: Spacing.xs,
    },
    loadingText: {
      marginTop: Spacing.md,
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.textSecondary,
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
      fontFamily: Fonts.displayMedium,
      color: c.textSecondary,
      marginTop: Spacing.md,
    },
    emptySubtext: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.textMuted,
      marginTop: Spacing.xs,
      textAlign: 'center',
    },
    footerLoader: {
      paddingVertical: Spacing.lg,
    },
  });

export default HistoryScreen;
