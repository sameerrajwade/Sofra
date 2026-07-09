import React, { useState, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, TextInput } from 'react-native-paper';
import { CuisineTag } from '../types';
import { Spacing, FontSize, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';

interface CuisineChipsProps {
  selected: CuisineTag;
  onSelect: (tag: CuisineTag) => void;
  customTags?: string[];
}

// Curated popular GLOBAL cuisines (not exhaustive). Anything else → "Other" textbox.
const DEFAULT_TAGS: CuisineTag[] = [
  'Indian',
  'Chinese',
  'Italian',
  'Mexican',
  'American',
  'Thai',
  'Japanese',
  'Mediterranean',
  'Korean',
  'Middle Eastern',
  'French',
  'Vietnamese',
  'Continental',
];

export const CuisineChips: React.FC<CuisineChipsProps> = ({
  selected,
  onSelect,
  customTags = [],
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

  const isCustomSelected =
    !!selected && !DEFAULT_TAGS.includes(selected) && !customTags.includes(selected);

  return (
    <View style={styles.container} accessibilityLabel="Cuisine selector">
      <View style={styles.chipsRow}>
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
          selected={isCustomSelected}
          onPress={() => setShowCustomInput((v) => !v)}
          style={[styles.addChip, isCustomSelected && styles.chipSelected]}
          textStyle={[styles.addChipText, isCustomSelected && styles.chipTextSelected]}
          accessibilityLabel="Other cuisine"
        >
          {isCustomSelected ? selected : 'Other'}
        </Chip>
      </View>

      {showCustomInput && (
        <View style={styles.customInputRow}>
          <TextInput
            value={customValue}
            onChangeText={setCustomValue}
            placeholder="Enter cuisine name"
            mode="outlined"
            dense
            style={styles.customInput}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            onSubmitEditing={handleAddCustom}
            returnKeyType="done"
            accessibilityLabel="Custom cuisine name"
          />
        </View>
      )}
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {},
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
    },
    chip: {
      backgroundColor: c.surfaceVariant,
    },
    chipSelected: {
      backgroundColor: c.primary,
    },
    chipText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.text,
    },
    chipTextSelected: {
      color: c.white,
    },
    addChip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: 'dashed',
    },
    addChipText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.textSecondary,
    },
    customInputRow: {
      marginTop: Spacing.sm,
    },
    customInput: {
      backgroundColor: c.surface,
    },
  });

export default CuisineChips;
