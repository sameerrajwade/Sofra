import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../hooks/useTheme';

interface Props {
  rating?: number;
  onRate?: (n: number) => void;
  size?: number;
  readOnly?: boolean;
}

// Tappable 1–5 star row. Tapping the current rating again clears it (via onRate
// receiving the same value — callers decide toggle behavior).
export const StarRating: React.FC<Props> = ({ rating = 0, onRate, size = 22, readOnly }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityLabel={`Rating ${rating} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rating;
        const star = (
          <MaterialCommunityIcons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? colors.warning : colors.textMuted}
          />
        );
        if (readOnly || !onRate) return <View key={n} style={styles.star}>{star}</View>;
        return (
          <TouchableOpacity
            key={n}
            onPress={() => onRate(n)}
            style={styles.star}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${n} star${n === 1 ? '' : 's'}`}
          >
            {star}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { paddingHorizontal: 1 },
});

export default StarRating;
