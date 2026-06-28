import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { format, addDays, subDays, eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';
import { MealTypeToggle } from '../components/MealTypeToggle';
import { SourceTypeToggle } from '../components/SourceTypeToggle';
import { DishPicker } from '../components/DishPicker';
import { CuisineChips } from '../components/CuisineChips';
import { useAuthStore } from '../stores/useAuthStore';
import { useMealStore } from '../stores/useMealStore';
import { useDishStore } from '../stores/useDishStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { getCurrencySymbol } from '../utils/currency';
import type { RootStackScreenProps } from '../navigation/types';
import type { MealType, SourceType, CuisineTag } from '../types';

type Props = RootStackScreenProps<'AddMeal'>;

function getDefaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 17) return 'snack';
  return 'dinner';
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AddMealScreen: React.FC<Props> = ({ route, navigation }) => {
  const existingMeal = route.params?.meal;
  const isEditing = !!(existingMeal && existingMeal.id);

  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';
  const { addMeal, updateMeal, deleteMeal } = useMealStore();
  const [isSaving, setIsSaving] = useState(false);
  const { dishes, fetchDishes } = useDishStore();
  const { preferences } = useHouseholdStore();

  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');

  const [date, setDate] = useState(
    existingMeal?.date ?? format(new Date(), 'yyyy-MM-dd'),
  );
  const [mealType, setMealType] = useState<MealType>(
    existingMeal?.mealType ?? getDefaultMealType(),
  );
  const [sourceType, setSourceType] = useState<SourceType>(
    existingMeal?.sourceType ?? 'home',
  );
  const [dishName, setDishName] = useState(existingMeal?.dishName ?? '');
  const [cuisineTag, setCuisineTag] = useState<CuisineTag>(
    existingMeal?.cuisineTag ?? 'Indian',
  );
  const [restaurantName, setRestaurantName] = useState(
    existingMeal?.restaurantName ?? '',
  );
  const [cost, setCost] = useState(
    existingMeal?.cost !== undefined ? String(existingMeal.cost) : '',
  );
  const [notes, setNotes] = useState(existingMeal?.notes ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => {
    const d = date ? new Date(date + 'T00:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const { meals: allMeals } = useMealStore();

  useEffect(() => {
    if (householdId) fetchDishes(householdId);
  }, [householdId, fetchDishes]);

  const allKnownDishes = useMemo(() => {
    const dishMap = new Map<string, typeof dishes[0]>();
    dishes.forEach((d) => dishMap.set(d.name.toLowerCase(), d));
    allMeals.forEach((m) => {
      if (m.dishName && !dishMap.has(m.dishName.toLowerCase())) {
        dishMap.set(m.dishName.toLowerCase(), {
          id: m.dishName,
          name: m.dishName,
          cuisineTag: m.cuisineTag || 'Other',
          categoryTags: [],
          isFavorite: false,
          timesCooked: 1,
          lastCookedDate: m.date,
        });
      }
    });
    return Array.from(dishMap.values());
  }, [dishes, allMeals]);

  const recentDishNames = useMemo(() => {
    return allKnownDishes
      .filter((d) => d.lastCookedDate)
      .sort(
        (a, b) =>
          new Date(b.lastCookedDate).getTime() -
          new Date(a.lastCookedDate).getTime(),
      )
      .slice(0, 8)
      .map((d) => d.name);
  }, [allKnownDishes]);

  const handleSelectDish = useCallback(
    (name: string) => {
      setDishName(name);
      const dish = allKnownDishes.find((d) => d.name === name);
      if (dish) setCuisineTag(dish.cuisineTag);
    },
    [allKnownDishes],
  );

  // Date picker calendar data
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(pickerMonth);
    const monthEnd = endOfMonth(pickerMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDow = getDay(monthStart);
    const blanks: (Date | null)[] = Array(startDow).fill(null);
    return [...blanks, ...days];
  }, [pickerMonth]);

  const handleDateSelect = useCallback((d: Date) => {
    setDate(format(d, 'yyyy-MM-dd'));
    setShowDatePicker(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!dishName.trim()) {
      Alert.alert('Validation', 'Dish name is required.');
      return;
    }
    if (!householdId) {
      Alert.alert('Error', 'No household set up.');
      return;
    }

    setIsSaving(true);
    try {
      const isOutside = sourceType === 'takeout' || sourceType === 'dineout';
      if (isOutside && !restaurantName.trim()) {
        Alert.alert('Validation', 'Restaurant name is required for takeout and dine-out meals.');
        return;
      }

      const mealData = {
        date,
        mealType,
        sourceType,
        dishName: dishName.trim(),
        cuisineTag,
        restaurantName: isOutside ? restaurantName.trim() : '',
        cost: isOutside && cost ? parseFloat(cost) : 0,
        notes: notes.trim() || '',
      };

      if (isEditing && existingMeal) {
        await updateMeal(householdId, existingMeal.id, mealData);
      } else {
        // Check for duplicate meal (same date + mealType)
        const existingForSlot = useMealStore.getState().meals.find(
          (m) => m.date === date && m.mealType === mealType,
        );
        if (existingForSlot) {
          await new Promise<void>((resolve, reject) => {
            Alert.alert(
              'Meal Already Exists',
              `A ${mealType} is already logged for this date. Do you want to replace it?`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('cancelled')) },
                {
                  text: 'Replace',
                  onPress: async () => {
                    try {
                      await updateMeal(householdId, existingForSlot.id, mealData);
                      resolve();
                    } catch (e) {
                      reject(e);
                    }
                  },
                },
              ],
            );
          });
        } else {
          await addMeal(householdId, {
            ...mealData,
            createdBy: user?.id ?? '',
            householdId,
          });
        }
      }
      navigation.goBack();
    } catch (e: any) {
      if (e.message !== 'cancelled') {
        Alert.alert('Error', e.message ?? 'Failed to save meal.');
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    dishName, householdId, isEditing, existingMeal, date, mealType,
    sourceType, cuisineTag, restaurantName, cost, notes, user,
    addMeal, updateMeal, navigation,
  ]);

  const handleDelete = useCallback(() => {
    if (!existingMeal || !householdId) return;
    Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMeal(householdId, existingMeal.id);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to delete meal.');
          }
        },
      },
    ]);
  }, [existingMeal, householdId, deleteMeal, navigation]);

  const formattedDate = useMemo(() => {
    if (!date) return 'Select date';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }, [date]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>
          {isEditing ? 'Edit Meal' : 'Add Meal'}
        </Text>

        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          accessibilityLabel="Select date"
        >
          <Text style={styles.dateButtonText}>{formattedDate}</Text>
        </TouchableOpacity>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}>
                  <Text style={styles.pickerNav}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>
                  {format(pickerMonth, 'MMMM yyyy')}
                </Text>
                <TouchableOpacity onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}>
                  <Text style={styles.pickerNav}>{'>'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dayNamesRow}>
                {DAY_NAMES.map((d) => (
                  <Text key={d} style={styles.dayNameText}>{d}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, i) => {
                  if (!day) {
                    return <View key={`blank-${i}`} style={styles.calendarCell} />;
                  }
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isSelected = dayStr === date;
                  return (
                    <TouchableOpacity
                      key={dayStr}
                      style={[styles.calendarCell, isSelected && styles.calendarCellSelected]}
                      onPress={() => handleDateSelect(day)}
                    >
                      <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
                        {day.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Button mode="text" onPress={() => setShowDatePicker(false)} textColor={Colors.textSecondary}>
                Cancel
              </Button>
            </View>
          </View>
        </Modal>

        {/* Meal Type */}
        <Text style={styles.label}>Meal Type</Text>
        <MealTypeToggle selected={mealType} onSelect={setMealType} />

        {/* Source Type */}
        <Text style={[styles.label, { marginTop: Spacing.md }]}>Source</Text>
        <SourceTypeToggle selected={sourceType} onSelect={setSourceType} />

        {/* Dish Name */}
        <Text style={[styles.label, { marginTop: Spacing.md }]}>Dish</Text>
        <DishPicker
          value={dishName}
          onChangeText={setDishName}
          dishes={allKnownDishes}
          recentDishes={recentDishNames}
          onSelectDish={handleSelectDish}
        />

        {/* Cuisine */}
        <Text style={[styles.label, { marginTop: Spacing.md }]}>Cuisine</Text>
        <CuisineChips selected={cuisineTag} onSelect={setCuisineTag} />

        {/* Restaurant & Cost - only shown for outside meals */}
        {sourceType !== 'home' && (
          <>
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Restaurant / Source</Text>
            <TextInput
              value={restaurantName}
              onChangeText={setRestaurantName}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              placeholder="Restaurant name"
              accessibilityLabel="Restaurant name"
            />

            <Text style={styles.label}>Cost</Text>
            <TextInput
              value={cost}
              onChangeText={setCost}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              placeholder="0.00"
              keyboardType="decimal-pad"
              left={<TextInput.Affix text={currencySymbol} />}
              accessibilityLabel="Cost"
            />
          </>
        )}

        {/* Notes */}
        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          style={[styles.input, styles.notesInput]}
          outlineColor={Colors.border}
          activeOutlineColor={Colors.primary}
          placeholder="Optional notes..."
          multiline
          numberOfLines={3}
          accessibilityLabel="Notes"
        />

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            buttonColor={Colors.primary}
            textColor={Colors.white}
            style={styles.saveButton}
            contentStyle={styles.buttonContent}
          >
            {isEditing ? 'Update Meal' : 'Save Meal'}
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={isSaving}
            style={styles.cancelButton}
            textColor={Colors.textSecondary}
          >
            Cancel
          </Button>

          {isEditing && (
            <Button
              mode="text"
              onPress={handleDelete}
              disabled={isSaving}
              textColor={Colors.error}
              style={styles.deleteButton}
            >
              Delete Meal
            </Button>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },
  notesInput: {
    minHeight: 80,
  },
  dateButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  dateButtonText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: 320,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pickerNav: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
    paddingHorizontal: Spacing.md,
  },
  pickerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayNameText: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCellSelected: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  calendarDayText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  calendarDayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  saveButton: {
    borderRadius: BorderRadius.md,
  },
  buttonContent: {
    paddingVertical: Spacing.xs,
  },
  cancelButton: {
    borderRadius: BorderRadius.md,
    borderColor: Colors.border,
  },
  deleteButton: {
    marginTop: Spacing.sm,
  },
});

export default AddMealScreen;
