import React, { useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput, Chip, Text } from 'react-native-paper';
import { Dish } from '../types';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';

interface DishPickerProps {
  value: string;
  onChangeText: (text: string) => void;
  dishes: Dish[];
  recentDishes?: string[];
  onSelectDish?: (name: string) => void;
}

export const DishPicker: React.FC<DishPickerProps> = ({
  value,
  onChangeText,
  dishes,
  recentDishes = [],
  onSelectDish,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [isFocused, setIsFocused] = useState(false);

  const filtered = useMemo(() => {
    if (!value.trim()) return [];
    const query = value.toLowerCase();
    return dishes
      .filter((d) => d.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [value, dishes]);

  const showDropdown = isFocused && value.trim().length > 0 && filtered.length > 0;

  const handleSelect = (name: string) => {
    onChangeText(name);
    onSelectDish?.(name);
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Dish name"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        mode="outlined"
        style={styles.input}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        accessibilityLabel="Dish name input"
      />

      {showDropdown && (
        <View style={styles.dropdown}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleSelect(item.name)}
                accessibilityLabel={`Select ${item.name}`}
              >
                <Text style={styles.dropdownText}>{item.name}</Text>
                <Text style={styles.dropdownMeta}>{item.cuisineTag}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {recentDishes.length > 0 && (
        <View style={styles.quickPicks}>
          <Text style={styles.quickPicksLabel}>Quick picks</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {recentDishes.map((name) => (
              <Chip
                key={name}
                style={styles.chip}
                textStyle={styles.chipText}
                onPress={() => handleSelect(name)}
                compact
                accessibilityLabel={`Quick pick: ${name}`}
              >
                {name}
              </Chip>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: 'relative',
    },
    input: {
      backgroundColor: c.surface,
    },
    dropdown: {
      position: 'absolute',
      top: 64,
      left: 0,
      right: 0,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: c.border,
      maxHeight: 240,
      zIndex: 10,
      elevation: 4,
      shadowColor: c.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    dropdownText: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.text,
    },
    dropdownMeta: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.body,
      color: c.textMuted,
    },
    quickPicks: {
      marginTop: Spacing.sm,
    },
    quickPicksLabel: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.textSecondary,
      marginBottom: Spacing.xs,
    },
    chipsRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    chip: {
      backgroundColor: c.surfaceVariant,
    },
    chipText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.body,
      color: c.text,
    },
  });

export default DishPicker;
