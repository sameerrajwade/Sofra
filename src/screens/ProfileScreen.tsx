import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Dimensions } from 'react-native';
import { Text, Avatar, ActivityIndicator } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { AvatarPicker } from '../components/AvatarPicker';
import { PreferencesSection } from '../components/PreferencesSection';
import { PressableScale, FadeSlideIn, AnimatedRing } from '../components/motion';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { updateUserProfile } from '../services/firestore';
import { uploadProfilePicture } from '../services/storage';
import type { ProfileStackScreenProps } from '../navigation/types';

type Props = ProfileStackScreenProps<'ProfileMain'>;

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const STACK_COLORS = ['#C0532E', '#5E8B6A', '#E0A63C', '#4E7CB0'];

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user } = useAuthStore();
  const { household, members, fetchHousehold, fetchMembers } = useHouseholdStore();
  const householdId = user?.householdId ?? '';
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (householdId) {
      // Pass the user id so preferences load with the household (otherwise the
      // store's preferences get wiped to null, breaking the meal-type toggles).
      fetchHousehold(householdId, user?.id).catch(() => {});
      fetchMembers(householdId).catch(() => {});
    }
  }, [householdId, user?.id, fetchHousehold, fetchMembers]);

  useFocusEffect(
    useCallback(() => {
      if (householdId) fetchMembers(householdId).catch(() => {});
    }, [householdId, fetchMembers]),
  );

  const handleAvatarChange = useCallback(
    async (uri: string | null) => {
      if (!user) return;
      if (uri === null) {
        try {
          await updateUserProfile(user.id, { avatarUrl: null });
          useAuthStore.getState().setUser({ ...user, avatarUrl: null });
        } catch {
          Alert.alert('Couldn\'t update', 'Try again.');
        }
        return;
      }
      setUploading(true);
      try {
        const remoteUrl = await uploadProfilePicture(user.id, uri);
        await updateUserProfile(user.id, { avatarUrl: remoteUrl });
        useAuthStore.getState().setUser({ ...user, avatarUrl: remoteUrl });
      } catch {
        Alert.alert('Upload failed', 'Your photo couldn\'t upload. Your current photo is unchanged — try again.');
      } finally {
        setUploading(false);
      }
    },
    [user],
  );

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const memberSince = user.createdAt ? format(user.createdAt, 'MMM yyyy') : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero — one cohesive identity block: avatar + name + email on terracotta */}
      <View style={styles.hero}>
        {/* faint thali motif texture */}
        <Svg width={Dimensions.get('window').width} height={230} style={styles.heroTexture}>
          <Circle cx={44} cy={40} r={30} stroke={colors.white} strokeWidth={1.5} opacity={0.07} fill="none" />
          <Circle cx={44} cy={40} r={8} stroke={colors.white} strokeWidth={1.5} opacity={0.07} fill="none" />
          <Circle cx={Dimensions.get('window').width - 40} cy={150} r={40} stroke={colors.white} strokeWidth={1.5} opacity={0.06} fill="none" />
          <Circle cx={Dimensions.get('window').width - 40} cy={150} r={11} stroke={colors.white} strokeWidth={1.5} opacity={0.06} fill="none" />
        </Svg>
        <View style={styles.avatarWrap}>
          {uploading && <AnimatedRing size={92} color={colors.white} style={styles.ring} />}
          {user.avatarUrl ? (
            <Avatar.Image size={80} source={{ uri: user.avatarUrl }} />
          ) : (
            <View style={styles.initials}>
              <Text style={styles.initialsText}>{getInitials(user.name)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.subtitle}>
          {user.email}
          {memberSince ? ` · member since ${memberSince}` : ''}
        </Text>
      </View>

      <FadeSlideIn delay={40}>
        <View style={styles.pickerWrap}>
          <AvatarPicker
            currentAvatar={user.avatarUrl}
            userName={user.name}
            onSelect={handleAvatarChange}
            showAvatar={false}
          />
          {uploading && <Text style={styles.uploadingText}>Uploading photo…</Text>}
        </View>
      </FadeSlideIn>

      {/* Household */}
      {household && (
        <FadeSlideIn delay={80}>
          <Text style={styles.sectionLabel}>Household</Text>
          <View style={styles.card}>
            <Text style={styles.householdName}>{household.name}</Text>
            <View style={styles.codeRow}>
              <MaterialCommunityIcons name="key-variant" size={15} color={colors.textMuted} />
              <Text style={styles.codeText}>Invite code {household.inviteCode}</Text>
            </View>
            <PressableScale style={styles.familyRow} onPress={() => navigation.navigate('Family')}>
              {members.length > 0 ? (
                <View style={styles.avatarStack}>
                  {members.slice(0, 4).map((m, i) => (
                    <View
                      key={m.id}
                      style={[
                        styles.stackAvatar,
                        { marginLeft: i === 0 ? 0 : -9, backgroundColor: STACK_COLORS[i % STACK_COLORS.length], borderColor: colors.surface },
                      ]}
                    >
                      <Text style={styles.stackInitials}>{getInitials(m.name)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <MaterialCommunityIcons name="account-group-outline" size={20} color={colors.primary} />
              )}
              <Text style={styles.familyText}>Family</Text>
              <Text style={styles.familyCount}>
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </PressableScale>
          </View>
        </FadeSlideIn>
      )}

      {/* Meal preferences + auto-plan rules */}
      <FadeSlideIn delay={120}>
        <PreferencesSection />
      </FadeSlideIn>

      {/* Settings */}
      <FadeSlideIn delay={160}>
        <Text style={styles.sectionLabel}>General</Text>
        <View style={styles.card}>
          <PressableScale style={styles.navRow} onPress={() => navigation.navigate('Settings')}>
            <MaterialCommunityIcons name="cog-outline" size={20} color={colors.primary} />
            <Text style={styles.navText}>Settings</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </PressableScale>
        </View>
      </FadeSlideIn>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: Spacing.xl },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    hero: {
      backgroundColor: c.primary,
      alignItems: 'center',
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      overflow: 'hidden',
    },
    heroTexture: { position: 'absolute', top: 0, left: 0 },
    avatarStack: { flexDirection: 'row' },
    stackAvatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    stackInitials: { fontFamily: Fonts.bodySemiBold, fontSize: 10, color: '#FFFFFF' },
    avatarWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
    ring: { position: 'absolute' },
    initials: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.home,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: c.white,
    },
    initialsText: { fontFamily: Fonts.display, fontSize: FontSize.xxl, color: c.white },
    name: {
      fontFamily: Fonts.display,
      fontSize: FontSize.xxl,
      color: c.white,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: Fonts.body,
      fontSize: FontSize.sm,
      color: c.white,
      opacity: 0.85,
      textAlign: 'center',
      marginTop: 2,
    },
    pickerWrap: { alignItems: 'center', marginTop: Spacing.md },
    uploadingText: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary, marginTop: Spacing.xs },
    sectionLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
      marginHorizontal: Spacing.md + Spacing.xs,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing.md,
      marginHorizontal: Spacing.md,
    },
    householdName: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.lg, color: c.text },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    codeText: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted, letterSpacing: 0.5 },
    familyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      minHeight: 44,
      marginTop: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingTop: Spacing.sm,
    },
    familyText: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.text },
    familyCount: { flex: 1, textAlign: 'right', fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted },
    navRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 44 },
    navText: { flex: 1, fontFamily: Fonts.body, fontSize: FontSize.md, color: c.text },
  });

export default ProfileScreen;
