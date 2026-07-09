import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import type { MealAudience } from '../types';

interface Props {
  selected: MealAudience;
  onSelect: (a: MealAudience) => void;
}

const OPTIONS: { value: MealAudience; label: string; icon: string }[] = [
  { value: 'family', label: 'Family', icon: 'account-group' },
  { value: 'kids', label: 'Kids tiffin', icon: 'emoticon-happy-outline' },
];

export const AudienceToggle: React.FC<Props> = ({ selected, onSelect }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container} accessibilityLabel="Meal audience selector">
      {OPTIONS.map(({ value, label, icon }) => {
        const isSelected = selected === value;
        const accent = value === 'kids' ? colors.kids : colors.primary;
        return (
          <TouchableOpacity
            key={value}
            style={[
              styles.button,
              { borderColor: accent },
              isSelected && { backgroundColor: accent },
            ]}
            onPress={() => onSelect(value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${label}${isSelected ? ', selected' : ''}`}
          >
            <MaterialCommunityIcons
              name={icon as any}
              size={16}
              color={isSelected ? colors.white : accent}
            />
            <Text style={[styles.label, { color: isSelected ? colors.white : accent }]}>
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
    container: { flexDirection: 'row', gap: Spacing.sm },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
      borderWidth: 1.5,
    },
    label: { fontSize: FontSize.sm, fontFamily: Fonts.bodySemiBold },
  });

export default AudienceToggle;
