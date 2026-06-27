import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { Meal } from '../types';
import { Colors, Spacing, FontSize, BorderRadius, sourceTypeColor, sourceTypeLabel } from '../config/theme';

interface MealCardProps {
  meal: Meal | null;
  onPress?: () => void;
  placeholder?: string;
}

const getDaysAgo = (dateStr: string): number | null => {
  const then = new Date(dateStr);
  const now = new Date();
  if (isNaN(then.getTime())) return null;
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const MealCard: React.FC<MealCardProps> = ({ meal, onPress, placeholder }) => {
  if (!meal) {
    return (
      <Card
        style={styles.card}
        onPress={onPress}
        accessibilityLabel={placeholder ?? 'No meal planned'}
      >
        <Card.Content style={styles.placeholderContent}>
          <Text style={styles.placeholderText}>
            {placeholder ?? 'No meal planned'}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const daysAgo = getDaysAgo(meal.date);
  const chipColor = sourceTypeColor(meal.sourceType);
  const chipLabel = sourceTypeLabel(meal.sourceType);

  return (
    <Card
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`${meal.dishName}, ${chipLabel}`}
    >
      <Card.Content>
        <View style={styles.row}>
          <Text style={styles.dishName} numberOfLines={1}>
            {meal.dishName}
          </Text>
          <Chip
            style={[styles.chip, { backgroundColor: chipColor }]}
            textStyle={styles.chipText}
            compact
            accessibilityLabel={`Source: ${chipLabel}`}
          >
            {chipLabel}
          </Chip>
        </View>

        <View style={styles.metaRow}>
          {daysAgo !== null && daysAgo > 0 && (
            <Text style={styles.metaText} accessibilityLabel={`Last made ${daysAgo} days ago`}>
              Last made {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago
            </Text>
          )}
          {meal.cost !== undefined && meal.cost > 0 && (
            <Text style={styles.costText} accessibilityLabel={`Cost ${meal.cost}`}>
              ${meal.cost.toFixed(2)}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  chip: {
    height: 28,
  },
  chipText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  costText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  placeholderContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  placeholderText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});

export default MealCard;
