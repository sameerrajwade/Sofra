import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MealType } from '../types';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { mealTypeIcon } from '../utils/icons';

interface MealTypeToggleProps {
  selected: MealType;
  onSelect: (type: MealType) => void;
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export const MealTypeToggle: React.FC<MealTypeToggleProps> = ({ selected, onSelect }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container} accessibilityLabel="Meal type selector">
      {MEAL_TYPES.map(({ value, label }) => {
        const isSelected = selected === value;
        return (
          <TouchableOpacity
            key={value}
            style={[styles.button, isSelected && styles.buttonSelected]}
            onPress={() => onSelect(value)}
            accessibilityLabel={`${label}${isSelected ? ', selected' : ''}`}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={mealTypeIcon(value) as any}
              size={16}
              color={isSelected ? colors.white : colors.textSecondary}
              style={styles.icon}
            />
            <Text
              style={[styles.buttonText, isSelected && styles.buttonTextSelected]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
      backgroundColor: c.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    buttonSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    icon: {},
    buttonText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodySemiBold,
      color: c.textSecondary,
    },
    buttonTextSelected: {
      color: c.white,
    },
  });

export default MealTypeToggle;
