import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Button, Text } from 'react-native-paper';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';

interface WeekNavigatorProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  currentDate,
  onPrevious,
  onNext,
  onToday,
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();

  let label: string;
  if (sameMonth) {
    label = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
  } else if (sameYear) {
    label = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  } else {
    label = `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  }

  return (
    <View style={styles.container} accessibilityLabel="Week navigator">
      <IconButton
        icon="chevron-left"
        size={24}
        onPress={onPrevious}
        accessibilityLabel="Previous week"
      />
      <Text style={styles.label} accessibilityLabel={`Week of ${label}`}>
        {label}
      </Text>
      <IconButton
        icon="chevron-right"
        size={24}
        onPress={onNext}
        accessibilityLabel="Next week"
      />
      <Button
        mode="text"
        compact
        onPress={onToday}
        labelStyle={styles.todayLabel}
        accessibilityLabel="Go to today"
      >
        Today
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  todayLabel: {
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
});

export default WeekNavigator;
