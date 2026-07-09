import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Alert, Share } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale, FadeSlideIn } from '../components/motion';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const FamilyScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuthStore();
  const { household, members, fetchMembers } = useHouseholdStore();
  const householdId = user?.householdId ?? '';

  useEffect(() => {
    if (householdId) fetchMembers(householdId).catch(() => {});
  }, [householdId, fetchMembers]);

  useFocusEffect(
    useCallback(() => {
      if (householdId) fetchMembers(householdId).catch(() => {});
    }, [householdId, fetchMembers]),
  );

  const handleInvite = useCallback(async () => {
    if (!household) return;
    try {
      await Share.share({
        message: `Join our household on Sofra! Use invite code ${household.inviteCode}.`,
      });
    } catch {
      Alert.alert('Invite code', household.inviteCode);
    }
  }, [household]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeSlideIn>
        <Text style={styles.sectionLabel}>
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </Text>
        <View style={styles.card}>
          {members.map((m, i) => (
            <View key={m.id} style={[styles.memberRow, i > 0 && styles.memberRowBorder]}>
              {m.avatarUrl ? (
                <Avatar.Image size={40} source={{ uri: m.avatarUrl }} />
              ) : (
                <Avatar.Text
                  size={40}
                  label={getInitials(m.name)}
                  style={{ backgroundColor: colors.home }}
                  labelStyle={{ color: colors.white }}
                />
              )}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.name}</Text>
                <Text style={styles.memberRole}>
                  {m.id === household?.adminId ? 'Admin' : 'Member'}
                </Text>
              </View>
              {m.id === user?.id && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>You</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </FadeSlideIn>

      <PressableScale style={styles.inviteBtn} onPress={handleInvite}>
        <MaterialCommunityIcons name="share-variant" size={18} color={colors.white} />
        <Text style={styles.inviteText}>Invite a family member</Text>
      </PressableScale>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing.md },
    sectionLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: Spacing.sm,
      marginLeft: Spacing.xs,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
    },
    memberRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    memberInfo: { flex: 1 },
    memberName: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.text },
    memberRole: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary },
    youBadge: {
      backgroundColor: c.dineoutLight,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    youBadgeText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.xs, color: c.primaryDark },
    inviteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: c.primary,
    },
    inviteText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.white },
  });

export default FamilyScreen;
