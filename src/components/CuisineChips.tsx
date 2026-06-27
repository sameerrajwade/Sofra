import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Chip, TextInput } from 'react-native-paper';
import { CuisineTag } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';

interface CuisineChipsProps {
  selected: CuisineTag;
  onSelect: (tag: CuisineTag) => void;
  customTags?: string[];
}

const DEFAULT_TAGS: CuisineTag[] = [
  'Indian',
  'Chinese',
  'Italian',
  'Mexican',
  'American',
  'Thai',
  'Japanese',
];

export const CuisineChips: React.FC<CuisineChipsProps> = ({
  selected,
  onSelect,
  customTags = [],
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const allTags = [...DEFAULT_TAGS, ...customTags.filter((t) => !DEFAULT_TAGS.includes(t))];

  const handleAddCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed) {
      onSelect(trimmed);
      setCustomValue('');
      setShowCustomInput(false);
    }
  };

  return (
    <View style={styles.container} accessibilityLabel="Cuisine selector">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {allTags.map((tag) => {
          const isSelected = selected === tag;
          return (
            <Chip
              key={tag}
              selected={isSelected}
              onPress={() => onSelect(tag)}
              style={[styles.chip, isSelected && styles.chipSelected]}
              textStyle={[styles.chipText, isSelected && styles.chipTextSelected]}
              accessibilityLabel={`${tag}${isSelected ? ', selected' : ''}`}
            >
              {tag}
            </Chip>
          );
        })}
        <Chip
          icon="plus"
          onPress={() => setShowCustomInput(!showCustomInput)}
          style={styles.addChip}
          textStyle={styles.addChipText}
          accessibilityLabel="Add custom cuisine"
        >
          Custom
        </Chip>
      </ScrollView>

      {showCustomInput && (
        <View style={styles.customInputRow}>
          <TextInput
            value={customValue}
            onChangeText={setCustomValue}
            placeholder="Enter cuisine name"
            mode="outlined"
            dense
            style={styles.customInput}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            onSubmitEditing={handleAddCustom}
            returnKeyType="done"
            accessibilityLabel="Custom cuisine name"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  chip: {
    backgroundColor: Colors.surfaceVariant,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  addChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  customInputRow: {
    marginTop: Spacing.sm,
  },
  customInput: {
    backgroundColor: Colors.surface,
  },
});

export default CuisineChips;
