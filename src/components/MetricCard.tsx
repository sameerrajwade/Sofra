import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: string;
  icon?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color = Colors.primary,
  icon,
}) => {
  const trendColor = trend !== undefined && trend >= 0 ? Colors.success : Colors.error;
  const trendIcon = trend !== undefined && trend >= 0 ? 'arrow-up' : 'arrow-down';

  return (
    <Card style={styles.card} accessibilityLabel={`${title}: ${value}`}>
      <Card.Content>
        <View style={styles.header}>
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={color}
              style={styles.icon}
            />
          )}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.valueRow}>
          <Text style={[styles.value, { color }]}>{value}</Text>
          {trend !== undefined && (
            <View
              style={styles.trendContainer}
              accessibilityLabel={`Trend ${trend >= 0 ? 'up' : 'down'} ${Math.abs(trend)}%`}
            >
              <MaterialCommunityIcons
                name={trendIcon as any}
                size={14}
                color={trendColor}
              />
              <Text style={[styles.trendText, { color: trendColor }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>

        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  title: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  trendText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginLeft: 2,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});

export default MetricCard;
