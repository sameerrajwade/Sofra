import React, { useState, useCallback, useMemo } from 'react';
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
import { Dish, CuisineTag } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';
import { CuisineChips } from '../components/CuisineChips';
import { useDishStore } from '../stores/useDishStore';
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
  const { dishes, isLoading, error, fetchDishes, addDish, updateDish } = useDishStore();
  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';

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
    let result = [...dishes];

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
  }, [dishes, search, sortMode, quickFilter, cuisineFilter]);

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
        await updateDish(householdId, dish.id, { isFavorite: !dish.isFavorite });
        await fetchDishes(householdId);
      } catch {
        Alert.alert('Error', 'Could not update favorite status.');
      }
    },
    [householdId, updateDish, fetchDishes],
  );

  const handleAddDish = useCallback(async () => {
    if (!householdId || !newName.trim()) return;
    setAddingDish(true);
    try {
      await addDish(householdId, {
        name: newName.trim(),
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
      const daysColor = daysSince >= 60 ? Colors.error : Colors.textSecondary;

      return (
        <TouchableOpacity
          style={styles.dishRow}
          onPress={() => toggleFavorite(item)}
          accessibilityLabel={`${item.name}, ${item.cuisineTag}, made ${item.timesCooked} times`}
        >
          <MaterialCommunityIcons
            name={item.isFavorite ? 'star' : 'star-outline'}
            size={24}
            color={item.isFavorite ? Colors.warning : Colors.textMuted}
            style={styles.starIcon}
          />
          <View style={styles.dishInfo}>
            <Text style={styles.dishName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.dishMeta}>
              <Chip
                compact
                style={styles.cuisineChip}
                textStyle={styles.cuisineChipText}
              >
                {item.cuisineTag}
              </Chip>
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
    [toggleFavorite],
  );

  if (isLoading && dishes.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
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

      {/* Quick filter chips */}
      <View style={styles.quickFilterRow}>
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'favorites', label: 'Favorites' },
            { key: 'stale', label: 'Not made 30+ days' },
          ] as const
        ).map(({ key, label }) => (
          <Chip
            key={key}
            selected={quickFilter === key}
            onPress={() => setQuickFilter(key)}
            style={[styles.quickChip, quickFilter === key && styles.quickChipSelected]}
            textStyle={[
              styles.quickChipText,
              quickFilter === key && styles.quickChipTextSelected,
            ]}
          >
            {label}
          </Chip>
        ))}
      </View>

      {error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.error} />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialCommunityIcons name="food-off" size={48} color={Colors.textMuted} />
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
        color={Colors.white}
        onPress={() => setDialogVisible(true)}
        accessibilityLabel="Add dish"
      />

      {/* Add Dish Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Add Dish</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Dish name"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              style={styles.dialogInput}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            <Text style={styles.dialogLabel}>Cuisine</Text>
            <CuisineChips selected={newCuisine} onSelect={setNewCuisine} />
            <TextInput
              label="Category tags (comma separated)"
              value={newTags}
              onChangeText={setNewTags}
              mode="outlined"
              style={styles.dialogInput}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Favorite</Text>
              <Switch
                value={newFavorite}
                onValueChange={setNewFavorite}
                color={Colors.primary}
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
  searchbar: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    elevation: 1,
  },
  searchInput: {
    fontSize: FontSize.md,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipText: {
    fontSize: FontSize.sm,
  },
  quickFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  quickChip: {
    backgroundColor: Colors.surfaceVariant,
  },
  quickChipSelected: {
    backgroundColor: Colors.primary,
  },
  quickChipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  quickChipTextSelected: {
    color: Colors.white,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
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
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  dishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  cuisineChip: {
    height: 24,
    backgroundColor: Colors.primaryLight,
  },
  cuisineChipText: {
    fontSize: FontSize.xs,
    color: Colors.white,
  },
  categoryTag: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceVariant,
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
    fontWeight: '500',
  },
  countText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
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
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    paddingVertical: Spacing.md,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  dialogInput: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  dialogLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
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
    color: Colors.text,
  },
});

export default DishLibraryScreen;
