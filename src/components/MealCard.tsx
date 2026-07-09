import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Meal } from '../types';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { sourceIcon, cuisineIcon } from '../utils/icons';

// Translucent tint of an accent hex, for the food thumbnail.
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${alpha})`;
}

interface MealCardProps {
  meal: Meal | null;
  onPress?: () => void;
  placeholder?: string;
}

const sourceColor = (c: ThemeColors, type: string) => {
  switch (type) {
    case 'home':
      return c.home;
    case 'takeout':
      return c.takeout;
    case 'dineout':
      return c.dineout;
    default:
      return c.textSecondary;
  }
};
const sourceLabel = (type: string) => {
  switch (type) {
    case 'home':
      return 'Home';
    case 'takeout':
      return 'Takeout';
    case 'dineout':
      return 'Dine Out';
    default:
      return type;
  }
};

// Append T00:00:00 so parseISO treats it as local midnight, not UTC midnight
const getDaysAgo = (dateStr: string): number | null => {
  try {
    return differenceInCalendarDays(new Date(), parseISO(dateStr + 'T00:00:00'));
  } catch {
    return null;
  }
};

export const MealCard: React.FC<MealCardProps> = ({ meal, onPress, placeholder }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!meal) {
    return (
      <Card style={styles.card} onPress={onPress} accessibilityLabel={placeholder ?? 'No meal planned'}>
        <Card.Content style={styles.placeholderContent}>
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <MaterialCommunityIcons name="plus" size={20} color={colors.textMuted} />
          </View>
          <Text style={styles.placeholderText}>{placeholder ?? 'No meal planned'}</Text>
        </Card.Content>
      </Card>
    );
  }

  const daysAgo = getDaysAgo(meal.date);
  const chipColor = sourceColor(colors, meal.sourceType);
  const chipLabel = sourceLabel(meal.sourceType);
  // Additional dishes beyond the primary (items[0] is the primary/summary dish).
  const extraDishes =
    meal.items && meal.items.length > 1
      ? meal.items.slice(1).map((it) => it.name).filter(Boolean)
      : [];

  return (
    <Card style={styles.card} onPress={onPress} accessibilityLabel={`${meal.dishName}, ${chipLabel}`}>
      <Card.Content style={styles.content}>
        {/* Cuisine-tinted food thumbnail — food is the product */}
        <View style={[styles.thumb, { backgroundColor: withAlpha(chipColor, 0.14) }]}>
          <MaterialCommunityIcons name={cuisineIcon(meal.cuisineTag) as any} size={22} color={chipColor} />
        </View>
        <View style={styles.textCol}>
          <View style={styles.row}>
            <Text style={styles.dishName} numberOfLines={1}>
              {meal.dishName}
            </Text>
            <View style={[styles.pill, { backgroundColor: chipColor }]}>
              <MaterialCommunityIcons name={sourceIcon(meal.sourceType) as any} size={12} color={colors.white} />
              <Text style={styles.pillText} accessibilityLabel={`Source: ${chipLabel}`}>
                {chipLabel}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {extraDishes.length > 0 ? (
              <Text
                style={styles.metaText}
                numberOfLines={2}
                accessibilityLabel={`With ${extraDishes.join(', ')}`}
              >
                {extraDishes.join(' · ')}
              </Text>
            ) : daysAgo !== null && daysAgo > 0 ? (
              <Text style={styles.metaText} accessibilityLabel={`Last made ${daysAgo} days ago`}>
                Last made {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago
              </Text>
            ) : null}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      marginVertical: Spacing.xs,
    },
    content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    textCol: { flex: 1 },
    thumb: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbEmpty: {
      backgroundColor: c.surfaceVariant,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderStyle: 'dashed',
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dishName: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSize.md,
      color: c.text,
      flex: 1,
      marginRight: Spacing.sm,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      alignSelf: 'center',
    },
    pillText: { color: c.white, fontSize: FontSize.xs, fontFamily: Fonts.bodySemiBold },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
    metaText: { flex: 1, fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary },
    placeholderContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    placeholderText: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.textMuted },
  });

export default MealCard;
