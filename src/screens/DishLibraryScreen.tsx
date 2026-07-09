import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Searchbar,
  Text,
  FAB,
  Chip,
  Portal,
  Dialog,
  Button,
  TextInput,
  Switch,
  ActivityIndicator,
  Menu,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Dish, CuisineTag } from '../types';
import { toTitleCase } from '../utils/text';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import type { HomeStackParamList } from '../navigation/types';
import { CuisineChips } from '../components/CuisineChips';
import { cuisineIcon } from '../utils/icons';
import { useDishStore } from '../stores/useDishStore';
import { useMealStore } from '../stores/useMealStore';
import { useAuthStore } from '../stores/useAuthStore';

type SortMode = 'lastMade' | 'mostMade' | 'az' | 'favorites';
type QuickFilter = 'all' | 'favorites' | 'stale';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'lastMade', label: 'Last made' },
  { value: 'mostMade', label: 'Most made' },
  { value: 'az', label: 'A-Z' },
  { value: 'favorites', label: 'Favorites' },
];

const getDaysSince = (dateStr: string): number => {
  if (!dateStr) return 999;
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
};

export const DishLibraryScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { dishes, isLoading, error, fetchDishes, addDish, updateDish, toggleFavorite: storeFavorite } = useDishStore();
  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';

  const { meals, fetchAllMeals } = useMealStore();
  const route = useRoute<RouteProp<HomeStackParamList, 'DishLibrary'>>();
  const navigation = useNavigation<any>();
  const monthDishes = route.params?.monthDishes;
  const monthDishSet = useMemo(
    () => (monthDishes ? new Set(monthDishes.map((n) => n.toLowerCase())) : null),
    [monthDishes],
  );

  useEffect(() => {
    if (householdId) {
      fetchDishes(householdId);
      fetchAllMeals(householdId).catch(() => {});
    }
  }, [householdId, fetchDishes]);

  const allDishes = useMemo(() => {
    const dishMap = new Map<string, Dish>();
    // Seed from saved dishes but reset counts — timesCooked/lastCookedDate are
    // DERIVED from meals below (fixes DISH-COUNT-2: stored + derived double count).
    dishes.forEach((d) => dishMap.set(d.name.toLowerCase(), { ...d, timesCooked: 0, lastCookedDate: '' }));
    meals.forEach((m) => {
      if (!m.dishName) return;
      const key = m.dishName.toLowerCase();
      if (dishMap.has(key)) {
        const existing = dishMap.get(key)!;
        dishMap.set(key, {
          ...existing,
          timesCooked: existing.timesCooked + 1,
          lastCookedDate: m.date > (existing.lastCookedDate || '') ? m.date : existing.lastCookedDate,
        });
      } else {
        dishMap.set(key, {
          id: m.dishName,
          name: m.dishName,
          cuisineTag: m.cuisineTag || 'Other',
          categoryTags: [],
          isFavorite: false,
          timesCooked: 1,
          lastCookedDate: m.date,
          householdId: m.householdId,
        });
      }
    });
    return Array.from(dishMap.values());
  }, [dishes, meals]);

  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('lastMade');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [cuisineFilter, setCuisineFilter] = useState<CuisineTag | null>(null);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [cuisineMenuVisible, setCuisineMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Add dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCuisine, setNewCuisine] = useState<CuisineTag>('Indian');
  const [newTags, setNewTags] = useState('');
  const [newFavorite, setNewFavorite] = useState(false);
  const [addingDish, setAddingDish] = useState(false);

  const filteredDishes = useMemo(() => {
    let result = [...allDishes];

    // Contextual subset (e.g. tapped "Unique Dishes" on Home → this month's dishes)
    if (monthDishSet) {
      result = result.filter((d) => monthDishSet.has(d.name.toLowerCase()));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.cuisineTag.toLowerCase().includes(q) ||
          d.categoryTags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Cuisine filter
    if (cuisineFilter) {
      result = result.filter((d) => d.cuisineTag === cuisineFilter);
    }

    // Quick filter
    if (quickFilter === 'favorites') {
      result = result.filter((d) => d.isFavorite);
    } else if (quickFilter === 'stale') {
      result = result.filter((d) => getDaysSince(d.lastCookedDate) >= 30);
    }

    // Sort
    switch (sortMode) {
      case 'lastMade':
        result.sort((a, b) => getDaysSince(b.lastCookedDate) - getDaysSince(a.lastCookedDate));
        break;
      case 'mostMade':
        result.sort((a, b) => b.timesCooked - a.timesCooked);
        break;
      case 'az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'favorites':
        result.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
        break;
    }

    return result;
  }, [allDishes, search, sortMode, quickFilter, cuisineFilter, monthDishSet]);

  const onRefresh = useCallback(async () => {
    if (!householdId) return;
    setRefreshing(true);
    await fetchDishes(householdId);
    setRefreshing(false);
  }, [householdId, fetchDishes]);

  const toggleFavorite = useCallback(
    async (dish: Dish) => {
      if (!householdId) return;
      try {
        const isRealDish = dishes.some((d) => d.id === dish.id);
        if (!isRealDish) {
          // Virtual dish from meal history — create it in Firestore with favorite=true
          await addDish(householdId, {
            name: dish.name,
            cuisineTag: dish.cuisineTag,
            categoryTags: dish.categoryTags ?? [],
            isFavorite: true,
            timesCooked: dish.timesCooked,
            lastCookedDate: dish.lastCookedDate,
            householdId,
          });
        } else {
          await updateDish(householdId, dish.id, { isFavorite: !dish.isFavorite });
        }
        await fetchDishes(householdId);
      } catch {
        Alert.alert('Error', 'Could not update favorite status.');
      }
    },
    [householdId, dishes, addDish, updateDish, fetchDishes],
  );

  const handleAddDish = useCallback(async () => {
    if (!householdId || !newName.trim()) return;
    setAddingDish(true);
    try {
      await addDish(householdId, {
        name: toTitleCase(newName.trim()),
        cuisineTag: newCuisine,
        categoryTags: newTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isFavorite: newFavorite,
        timesCooked: 0,
        lastCookedDate: '',
        householdId,
      });
      await fetchDishes(householdId);
      setDialogVisible(false);
      setNewName('');
      setNewTags('');
      setNewFavorite(false);
    } catch {
      Alert.alert('Error', 'Could not add dish.');
    } finally {
      setAddingDish(false);
    }
  }, [householdId, newName, newCuisine, newTags, newFavorite, addDish, fetchDishes]);

  const uniqueCuisines = useMemo(() => {
    const set = new Set(dishes.map((d) => d.cuisineTag));
    return Array.from(set).sort();
  }, [dishes]);

  const renderDish = useCallback(
    ({ item }: { item: Dish }) => {
      const daysSince = getDaysSince(item.lastCookedDate);
      const daysColor = daysSince >= 60 ? colors.error : colors.textSecondary;

      return (
        <TouchableOpacity
          style={styles.dishRow}
          onPress={() => toggleFavorite(item)}
          accessibilityLabel={`${item.name}, ${item.cuisineTag}, made ${item.timesCooked} times`}
        >
          <MaterialCommunityIcons
            name={item.isFavorite ? 'star' : 'star-outline'}
            size={24}
            color={item.isFavorite ? colors.warning : colors.textMuted}
            style={styles.starIcon}
          />
          <View style={styles.dishInfo}>
            <Text style={styles.dishName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.dishMeta}>
              <View style={styles.cuisinePill}>
                <MaterialCommunityIcons
                  name={cuisineIcon(item.cuisineTag) as any}
                  size={11}
                  color={colors.white}
                />
                <Text style={styles.cuisinePillText}>{item.cuisineTag}</Text>
              </View>
              {item.categoryTags.slice(0, 2).map((tag) => (
                <Text key={tag} style={styles.categoryTag}>
                  {tag}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.dishStats}>
            <Text style={[styles.daysText, { color: daysColor }]}>
              {item.lastCookedDate ? `${daysSince}d ago` : 'Never'}
            </Text>
            <Text style={styles.countText}>{item.timesCooked}x</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [toggleFavorite, colors, styles],
  );

  if (isLoading && dishes.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dishes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search dishes..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
        iconColor={colors.textSecondary}
        placeholderTextColor={colors.textMuted}
      />

      {/* Filters row */}
      <View style={styles.filterRow}>
        <Menu
          visible={cuisineMenuVisible}
          onDismiss={() => setCuisineMenuVisible(false)}
          anchor={
            <Chip
              icon="filter-variant"
              onPress={() => setCuisineMenuVisible(true)}
              style={styles.filterChip}
              textStyle={styles.filterChipText}
            >
              {cuisineFilter ?? 'All cuisines'}
            </Chip>
          }
        >
          <Menu.Item
            title="All cuisines"
            onPress={() => {
              setCuisineFilter(null);
              setCuisineMenuVisible(false);
            }}
          />
          {uniqueCuisines.map((c) => (
            <Menu.Item
              key={c}
              title={c}
              onPress={() => {
                setCuisineFilter(c);
                setCuisineMenuVisible(false);
              }}
            />
          ))}
        </Menu>

        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Chip
              icon="sort"
              onPress={() => setSortMenuVisible(true)}
              style={styles.filterChip}
              textStyle={styles.filterChipText}
            >
              {SORT_OPTIONS.find((s) => s.value === sortMode)?.label}
            </Chip>
          }
        >
          {SORT_OPTIONS.map((opt) => (
            <Menu.Item
              key={opt.value}
              title={opt.label}
              onPress={() => {
                setSortMode(opt.value);
                setSortMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      {/* Quick filter chips ("All" becomes "Show all" when viewing a subset) */}
      <View style={styles.quickFilterRow}>
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'favorites', label: 'Favorites' },
            { key: 'stale', label: 'Not made 30+ days' },
          ] as const
        ).map(({ key, label }) => {
          const isAll = key === 'all';
          const displayLabel = isAll && monthDishes ? 'Show all' : label;
          const selected = isAll ? quickFilter === 'all' && !monthDishes : quickFilter === key;
          return (
            <Chip
              key={key}
              selected={selected}
              onPress={() => {
                if (isAll && monthDishes) {
                  navigation.setParams({ monthDishes: undefined, title: undefined });
                }
                setQuickFilter(key);
              }}
              style={[styles.quickChip, selected && styles.quickChipSelected]}
              textStyle={[styles.quickChipText, selected && styles.quickChipTextSelected]}
            >
              {displayLabel}
            </Chip>
          );
        })}
      </View>

      {error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="outlined" onPress={onRefresh}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredDishes}
          keyExtractor={(item) => item.id}
          renderItem={renderDish}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialCommunityIcons name="food-off" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No dishes found</Text>
              <Text style={styles.emptySubtext}>
                {search ? 'Try a different search' : 'Tap + to add your first dish'}
              </Text>
            </View>
          }
          ListFooterComponent={
            filteredDishes.length > 0 ? (
              <Text style={styles.footer}>
                {filteredDishes.length} {filteredDishes.length === 1 ? 'dish' : 'dishes'}
              </Text>
            ) : null
          }
          contentContainerStyle={filteredDishes.length === 0 ? styles.emptyList : undefined}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.white}
        onPress={() => setDialogVisible(true)}
        accessibilityLabel="Add dish"
      />

      {/* Add Dish Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Add Dish</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Dish name"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              style={styles.dialogInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
            <Text style={styles.dialogLabel}>Cuisine</Text>
            <CuisineChips selected={newCuisine} onSelect={setNewCuisine} />
            <TextInput
              label="Category tags (comma separated)"
              value={newTags}
              onChangeText={setNewTags}
              mode="outlined"
              style={styles.dialogInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Favorite</Text>
              <Switch
                value={newFavorite}
                onValueChange={setNewFavorite}
                color={colors.primary}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleAddDish}
              loading={addingDish}
              disabled={!newName.trim() || addingDish}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    filterChip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    filterChipText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.text,
    },
    quickFilterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    quickChip: {
      backgroundColor: c.surfaceVariant,
    },
    quickChipSelected: {
      backgroundColor: c.primary,
    },
    quickChipText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.text,
    },
    quickChipTextSelected: {
      color: c.white,
    },
    dishRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.xs,
      borderRadius: BorderRadius.md,
      elevation: 1,
    },
    starIcon: {
      marginRight: Spacing.sm,
    },
    dishInfo: {
      flex: 1,
    },
    dishName: {
      fontSize: FontSize.lg,
      fontFamily: Fonts.bodySemiBold,
      color: c.text,
      marginBottom: 2,
    },
    dishMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      flexWrap: 'wrap',
    },
    cuisinePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      backgroundColor: c.primaryLight,
    },
    cuisinePillText: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.bodySemiBold,
      color: c.white,
    },
    categoryTag: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.body,
      color: c.textSecondary,
      backgroundColor: c.surfaceVariant,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      overflow: 'hidden',
    },
    dishStats: {
      alignItems: 'flex-end',
      marginLeft: Spacing.sm,
    },
    daysText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
    },
    countText: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.body,
      color: c.textMuted,
      marginTop: 2,
    },
    loadingText: {
      marginTop: Spacing.md,
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.textSecondary,
    },
    errorText: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.error,
      marginVertical: Spacing.md,
      textAlign: 'center',
    },
    emptyList: {
      flexGrow: 1,
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
    },
    footer: {
      textAlign: 'center',
      fontSize: FontSize.sm,
      fontFamily: Fonts.body,
      color: c.textMuted,
      paddingVertical: Spacing.md,
    },
    fab: {
      position: 'absolute',
      right: Spacing.md,
      bottom: Spacing.md,
      backgroundColor: c.primary,
      borderRadius: BorderRadius.full,
    },
    dialog: {
      backgroundColor: c.surface,
    },
    dialogTitle: {
      fontFamily: Fonts.display,
      color: c.text,
    },
    dialogInput: {
      backgroundColor: c.surface,
      marginBottom: Spacing.sm,
    },
    dialogLabel: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.textSecondary,
      marginBottom: Spacing.xs,
      marginTop: Spacing.xs,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    switchLabel: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.text,
    },
  });

export default DishLibraryScreen;
