import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Text, Switch, TextInput, Menu, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { UserPreferences, MealType } from '../types';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { getCurrencySymbol } from '../utils/currency';
import { updateUserPreferences, getUserPreferences } from '../services/firestore';
import { PressableScale } from './motion';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'];
const ROTATION_OPTIONS = [3, 5, 7, 10, 14];
const MAX_DINEOUT_OPTIONS = [1, 2, 3, 4, 5];
const AVOID_REPEAT_OPTIONS = [1, 2, 3, 5, 7];
const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const DEFAULT_PREFS: UserPreferences = {
  defaultMeals: ['lunch', 'dinner'],
  monthlyDineOutBudget: 200,
  dishRotationDays: 7,
  currency: 'USD',
  maxDineOutsPerWeek: 2,
  avoidRepeatDays: 3,
  includeNewDishes: true,
};

// Meal preferences + auto-plan rules. Self-loads/saves; used on the Profile screen.
export const PreferencesSection: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuthStore();

  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [rotationMenu, setRotationMenu] = useState(false);
  const [currencyMenu, setCurrencyMenu] = useState(false);
  const [maxDineOutMenu, setMaxDineOutMenu] = useState(false);
  const [avoidRepeatMenu, setAvoidRepeatMenu] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const prefs = await getUserPreferences(user.id);
        if (prefs) setPreferences(prefs);
      } catch {
        // defaults
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const updatePrefs = useCallback(
    async (partial: Partial<UserPreferences>) => {
      if (!user) return;
      setPreferences((p) => ({ ...p, ...partial }));
      try {
        await updateUserPreferences(user.id, partial);
        useHouseholdStore.setState((state) => ({
          preferences: state.preferences
            ? { ...state.preferences, ...partial }
            : (partial as UserPreferences),
        }));
      } catch {
        Alert.alert('Couldn\'t save', 'Your change didn\'t save. Try again.');
      }
    },
    [user],
  );

  const toggleMealType = useCallback(
    (type: MealType) => {
      const current = preferences.defaultMeals ?? [];
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      updatePrefs({ defaultMeals: updated });
    },
    [preferences.defaultMeals, updatePrefs],
  );

  const currencySymbol = getCurrencySymbol(preferences.currency);

  const Dropdown = ({
    visible,
    setVisible,
    value,
    options,
    onPick,
    format,
  }: {
    visible: boolean;
    setVisible: (v: boolean) => void;
    value: string | number;
    options: (string | number)[];
    onPick: (v: any) => void;
    format?: (v: any) => string;
  }) => (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <PressableScale style={styles.dropdown} onPress={() => setVisible(true)}>
          <Text style={styles.dropdownText}>{format ? format(value) : value}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textMuted} />
        </PressableScale>
      }
    >
      {options.map((o) => (
        <Menu.Item
          key={String(o)}
          title={format ? format(o) : String(o)}
          onPress={() => {
            onPick(o);
            setVisible(false);
          }}
        />
      ))}
    </Menu>
  );

  return (
    <View>
      <Text style={styles.sectionLabel}>Meal preferences</Text>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <View style={styles.card}>
          <Text style={styles.rowLabel}>Default meals</Text>
          {MEAL_TYPES.map(({ value, label }) => (
            <View key={value} style={styles.switchRow}>
              <Text style={styles.rowText}>{label}</Text>
              <Switch
                value={(preferences.defaultMeals ?? []).includes(value)}
                onValueChange={() => toggleMealType(value)}
                color={colors.primary}
              />
            </View>
          ))}

          <Text style={styles.rowLabel}>Monthly dine-out budget</Text>
          <TextInput
            value={String(preferences.monthlyDineOutBudget ?? '')}
            onChangeText={(v) => {
              const cleaned = v.replace(/[^0-9]/g, '');
              updatePrefs({ monthlyDineOutBudget: cleaned === '' ? 0 : parseInt(cleaned, 10) });
            }}
            keyboardType="numeric"
            mode="outlined"
            dense
            left={<TextInput.Affix text={currencySymbol} />}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            textColor={colors.text}
          />

          <Text style={styles.rowLabel}>Dish rotation</Text>
          <Dropdown
            visible={rotationMenu}
            setVisible={setRotationMenu}
            value={preferences.dishRotationDays}
            options={ROTATION_OPTIONS}
            onPick={(v) => updatePrefs({ dishRotationDays: v })}
            format={(v) => `${v} days`}
          />

          <Text style={styles.rowLabel}>Currency</Text>
          <Dropdown
            visible={currencyMenu}
            setVisible={setCurrencyMenu}
            value={preferences.currency}
            options={CURRENCIES}
            onPick={(v) => updatePrefs({ currency: v })}
          />
        </View>
      )}

      <Text style={styles.sectionLabel}>Auto-plan rules</Text>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>Max dine-outs per week</Text>
        <Dropdown
          visible={maxDineOutMenu}
          setVisible={setMaxDineOutMenu}
          value={preferences.maxDineOutsPerWeek}
          options={MAX_DINEOUT_OPTIONS}
          onPick={(v) => updatePrefs({ maxDineOutsPerWeek: v })}
        />

        <Text style={styles.rowLabel}>Avoid repeat within</Text>
        <Dropdown
          visible={avoidRepeatMenu}
          setVisible={setAvoidRepeatMenu}
          value={preferences.avoidRepeatDays}
          options={AVOID_REPEAT_OPTIONS}
          onPick={(v) => updatePrefs({ avoidRepeatDays: v })}
          format={(v) => `${v} days`}
        />

        <View style={styles.switchRow}>
          <Text style={styles.rowText}>Include new dishes in plans</Text>
          <Switch
            value={preferences.includeNewDishes}
            onValueChange={(v) => updatePrefs({ includeNewDishes: v })}
            color={colors.primary}
          />
        </View>
      </View>
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sectionLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
      marginHorizontal: Spacing.md + Spacing.xs,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing.md,
      marginHorizontal: Spacing.md,
    },
    rowLabel: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSize.sm,
      color: c.textSecondary,
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
    },
    rowText: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.text },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
      minHeight: 44,
    },
    input: { backgroundColor: c.surface },
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      alignSelf: 'flex-start',
      minWidth: 120,
      minHeight: 44,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surfaceVariant,
    },
    dropdownText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSize.md,
      color: c.text,
      marginRight: Spacing.sm,
    },
    loader: { padding: Spacing.lg },
  });

export default PreferencesSection;
