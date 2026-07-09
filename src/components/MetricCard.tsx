import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: string;
  icon?: string;
  onShare?: () => void;
}

// Translucent tint of an accent hex, for the soft icon badge.
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color,
  icon,
  onShare,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const accent = color ?? colors.primary;
  const trendColor = trend !== undefined && trend >= 0 ? colors.success : colors.error;
  const trendIcon = trend !== undefined && trend >= 0 ? 'arrow-up' : 'arrow-down';

  return (
    <Card style={styles.card} accessibilityLabel={`${title}: ${value}`}>
      <Card.Content>
        {onShare && (
          <TouchableOpacity
            onPress={onShare}
            style={styles.shareBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={`Share ${title}`}
          >
            <MaterialCommunityIcons name="share-variant" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconBadge, { backgroundColor: withAlpha(accent, isDark ? 0.24 : 0.14) }]}>
              <MaterialCommunityIcons name={icon as any} size={16} color={accent} />
            </View>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: accent }]}>{value}</Text>
          {trend !== undefined && (
            <View
              style={styles.trendContainer}
              accessibilityLabel={`Trend ${trend >= 0 ? 'up' : 'down'} ${Math.abs(trend)}%`}
            >
              <MaterialCommunityIcons name={trendIcon as any} size={14} color={trendColor} />
              <Text style={[styles.trendText, { color: trendColor }]}>{Math.abs(trend)}%</Text>
            </View>
          )}
        </View>

        {/* Always reserve the subtitle line so every card is the same height */}
        <View style={styles.subtitleArea}>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
    iconBadge: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareBtn: { position: 'absolute', top: 8, right: 8, zIndex: 2, padding: 2 },
    title: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    valueRow: { flexDirection: 'row', alignItems: 'baseline' },
    value: { fontFamily: Fonts.display, fontSize: FontSize.xxxl },
    trendContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.sm },
    trendText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, marginLeft: 2 },
    subtitleArea: { minHeight: 18, marginTop: Spacing.xs, justifyContent: 'center' },
    subtitle: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted },
  });

export default MetricCard;
