import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SourceType } from '../types';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { sourceIcon } from '../utils/icons';

interface SourceTypeToggleProps {
  selected: SourceType;
  onSelect: (type: SourceType) => void;
}

// Color/lightColor resolved from the active theme at render time.
const SOURCE_TYPES: {
  value: SourceType;
  label: string;
  colorKey: 'home' | 'takeout' | 'dineout';
  lightKey: 'homeLight' | 'takeoutLight' | 'dineoutLight';
}[] = [
  { value: 'home', label: 'Home', colorKey: 'home', lightKey: 'homeLight' },
  { value: 'takeout', label: 'Takeout', colorKey: 'takeout', lightKey: 'takeoutLight' },
  { value: 'dineout', label: 'Dine Out', colorKey: 'dineout', lightKey: 'dineoutLight' },
];

export const SourceTypeToggle: React.FC<SourceTypeToggleProps> = ({ selected, onSelect }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container} accessibilityLabel="Source type selector">
      {SOURCE_TYPES.map(({ value, label, colorKey, lightKey }) => {
        const isSelected = selected === value;
        const color = colors[colorKey];
        const lightColor = colors[lightKey];
        return (
          <TouchableOpacity
            key={value}
            style={[
              styles.button,
              { borderColor: color },
              isSelected ? { backgroundColor: color } : { backgroundColor: lightColor },
            ]}
            onPress={() => onSelect(value)}
            accessibilityLabel={`${label}${isSelected ? ', selected' : ''}`}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={sourceIcon(value) as any}
              size={20}
              color={isSelected ? colors.white : color}
              style={styles.icon}
            />
            <Text style={[styles.buttonText, { color: isSelected ? colors.white : color }]}>
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
      gap: Spacing.sm,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
      borderWidth: 1.5,
    },
    icon: {
      marginRight: Spacing.xs,
    },
    buttonText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodySemiBold,
    },
  });

export default SourceTypeToggle;
