import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MealType } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';

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
            <Text
              style={[styles.buttonText, isSelected && styles.buttonTextSelected]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  buttonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  buttonTextSelected: {
    color: Colors.white,
  },
});

export default MealTypeToggle;
