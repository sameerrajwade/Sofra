import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SourceType } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';

interface SourceTypeToggleProps {
  selected: SourceType;
  onSelect: (type: SourceType) => void;
}

const SOURCE_TYPES: {
  value: SourceType;
  label: string;
  icon: string;
  color: string;
  lightColor: string;
}[] = [
  { value: 'home', label: 'Home', icon: 'home', color: Colors.home, lightColor: Colors.homeLight },
  { value: 'takeout', label: 'Takeout', icon: 'car', color: Colors.takeout, lightColor: Colors.takeoutLight },
  { value: 'dineout', label: 'Dine Out', icon: 'store', color: Colors.dineout, lightColor: Colors.dineoutLight },
];

export const SourceTypeToggle: React.FC<SourceTypeToggleProps> = ({ selected, onSelect }) => {
  return (
    <View style={styles.container} accessibilityLabel="Source type selector">
      {SOURCE_TYPES.map(({ value, label, icon, color, lightColor }) => {
        const isSelected = selected === value;
        return (
          <TouchableOpacity
            key={value}
            style={[
              styles.button,
              { borderColor: color },
              isSelected && { backgroundColor: color },
              !isSelected && { backgroundColor: lightColor },
            ]}
            onPress={() => onSelect(value)}
            accessibilityLabel={`${label}${isSelected ? ', selected' : ''}`}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={isSelected ? Colors.white : color}
              style={styles.icon}
            />
            <Text
              style={[
                styles.buttonText,
                { color: isSelected ? Colors.white : color },
              ]}
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
    fontWeight: '600',
  },
});

export default SourceTypeToggle;
