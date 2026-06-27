import React, { useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput, Chip, Text } from 'react-native-paper';
import { Dish } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';

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
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
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

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    backgroundColor: Colors.surface,
  },
  dropdown: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 240,
    zIndex: 10,
    elevation: 4,
    shadowColor: Colors.black,
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
    borderBottomColor: Colors.border,
  },
  dropdownText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  dropdownMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  quickPicks: {
    marginTop: Spacing.sm,
  },
  quickPicksLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chip: {
    backgroundColor: Colors.surfaceVariant,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
});

export default DishPicker;
