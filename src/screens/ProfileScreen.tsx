import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Switch,
  Divider,
  ActivityIndicator,
  Avatar,
  Card,
  Menu,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { UserPreferences, MealType } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';
import { AvatarPicker } from '../components/AvatarPicker';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { getCurrencySymbol } from '../utils/currency';
import { updateUserPreferences, getUserPreferences, updateUserProfile } from '../services/firestore';
import { uploadProfilePicture } from '../services/storage';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'];
const ROTATION_OPTIONS = [3, 5, 7, 10, 14];
const MAX_DINEOUT_OPTIONS = [1, 2, 3, 4, 5];
const AVOID_REPEAT_OPTIONS = [1, 2, 3, 5, 7];
const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const DEFAULT_PREFS: UserPreferences = {
  defaultMeals: ['lunch', 'dinner'],
  monthlyDineOutBudget: 200,
  dishRotationDays: 7,
  currency: 'USD',
  maxDineOutsPerWeek: 2,
  avoidRepeatDays: 3,
  includeNewDishes: true,
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const ProfileScreen: React.FC = () => {
  const { user, signOut, isLoading: authLoading } = useAuthStore();
  const { household, members, fetchHousehold, fetchMembers } = useHouseholdStore();
  const householdId = user?.householdId ?? '';

  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rotationMenuVisible, setRotationMenuVisible] = useState(false);
  const [currencyMenuVisible, setCurrencyMenuVisible] = useState(false);
  const [maxDineOutMenuVisible, setMaxDineOutMenuVisible] = useState(false);
  const [avoidRepeatMenuVisible, setAvoidRepeatMenuVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const prefs = await getUserPreferences(user.id);
        if (prefs) setPreferences(prefs);
      } catch {
        // Use defaults
      } finally {
        setPrefsLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (householdId) {
      fetchHousehold(householdId);
      fetchMembers(householdId);
    }
  }, [householdId, fetchHousehold, fetchMembers]);

  const updatePreferences = useCallback(
    async (partial: Partial<UserPreferences>) => {
      if (!user) return;
      const updated = { ...preferences, ...partial };
      setPreferences(updated);
      setSaving(true);
      try {
        await updateUserPreferences(user.id, partial);
        // Sync to household store local state only (Firestore already written above)
        useHouseholdStore.setState((state) => ({
          preferences: state.preferences ? { ...state.preferences, ...partial } : (partial as UserPreferences),
        }));
      } catch {
        Alert.alert('Error', 'Could not save preferences.');
      } finally {
        setSaving(false);
      }
    },
    [user, preferences],
  );

  const toggleMealType = useCallback(
    (type: MealType) => {
      const current = preferences.defaultMeals;
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      updatePreferences({ defaultMeals: updated });
    },
    [preferences.defaultMeals, updatePreferences],
  );

  const handleAvatarChange = useCallback(
    async (uri: string | null) => {
      if (!user) return;
      try {
        let finalUrl = uri;
        if (uri) {
          finalUrl = await uploadProfilePicture(user.id, uri);
        }
        await updateUserProfile(user.id, { avatarUrl: finalUrl });
        useAuthStore.getState().setUser({ ...user, avatarUrl: finalUrl });
      } catch {
        Alert.alert('Error', 'Could not update avatar.');
      }
    },
    [user],
  );

  const handleExport = useCallback(async () => {
    try {
      await Share.share({
        message: 'ThaliPlan data export requested. Feature coming soon.',
        title: 'Export ThaliPlan Data',
      });
    } catch {
      Alert.alert('Error', 'Could not export data.');
    }
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar & Profile */}
      <AvatarPicker
        currentAvatar={user.avatarUrl}
        userName={user.name}
        onSelect={handleAvatarChange}
      />
      <Text style={styles.userName}>{user.name}</Text>
      <Text style={styles.userEmail}>{user.email}</Text>

      <Divider style={styles.divider} />

      {/* Household Section */}
      <Text style={styles.sectionTitle}>Household</Text>
      {household ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.householdName}>{household.name}</Text>
            {members.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  {member.avatarUrl ? (
                    <Avatar.Image size={36} source={{ uri: member.avatarUrl }} />
                  ) : (
                    <Avatar.Text
                      size={36}
                      label={getInitials(member.name)}
                      style={{ backgroundColor: Colors.primaryLight }}
                    />
                  )}
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>
                    {member.id === household.adminId ? 'Admin' : 'Member'}
                  </Text>
                </View>
                {member.id === user.id && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>You</Text>
                  </View>
                )}
              </View>
            ))}
            <Button
              mode="outlined"
              icon="share-variant"
              onPress={() =>
                Alert.alert('Invite Code', household.inviteCode, [{ text: 'OK' }])
              }
              style={styles.inviteButton}
            >
              Invite ({household.inviteCode})
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <Text style={styles.noHousehold}>No household set up.</Text>
      )}

      <Divider style={styles.divider} />

      {/* Meal Preferences */}
      <Text style={styles.sectionTitle}>Meal Preferences</Text>

      {prefsLoading ? (
        <ActivityIndicator size="small" color={Colors.primary} style={styles.prefsLoader} />
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.prefLabel}>Default meals</Text>
            <View style={styles.mealToggles}>
              {MEAL_TYPES.map(({ value, label }) => (
                <View key={value} style={styles.mealToggleRow}>
                  <Text style={styles.mealToggleLabel}>{label}</Text>
                  <Switch
                    value={preferences.defaultMeals.includes(value)}
                    onValueChange={() => toggleMealType(value)}
                    color={Colors.primary}
                  />
                </View>
              ))}
            </View>

            <Text style={styles.prefLabel}>Monthly dine-out budget</Text>
            <TextInput
              value={String(preferences.monthlyDineOutBudget ?? '')}
              onChangeText={(v) => {
                const cleaned = v.replace(/[^0-9]/g, '');
                const num = cleaned === '' ? 0 : parseInt(cleaned, 10);
                updatePreferences({ monthlyDineOutBudget: num });
              }}
              keyboardType="numeric"
              mode="outlined"
              dense
              left={<TextInput.Affix text={getCurrencySymbol(preferences.currency)} />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />

            <Text style={styles.prefLabel}>Dish rotation (days)</Text>
            <Menu
              visible={rotationMenuVisible}
              onDismiss={() => setRotationMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setRotationMenuVisible(true)}
                  style={styles.dropdownButton}
                >
                  {preferences.dishRotationDays} days
                </Button>
              }
            >
              {ROTATION_OPTIONS.map((d) => (
                <Menu.Item
                  key={d}
                  title={`${d} days`}
                  onPress={() => {
                    updatePreferences({ dishRotationDays: d });
                    setRotationMenuVisible(false);
                  }}
                />
              ))}
            </Menu>

            <Text style={styles.prefLabel}>Currency</Text>
            <Menu
              visible={currencyMenuVisible}
              onDismiss={() => setCurrencyMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setCurrencyMenuVisible(true)}
                  style={styles.dropdownButton}
                >
                  {preferences.currency}
                </Button>
              }
            >
              {CURRENCIES.map((c) => (
                <Menu.Item
                  key={c}
                  title={c}
                  onPress={() => {
                    updatePreferences({ currency: c });
                    setCurrencyMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
          </Card.Content>
        </Card>
      )}

      <Divider style={styles.divider} />

      {/* Auto-plan Rules */}
      <Text style={styles.sectionTitle}>Auto-plan Rules</Text>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.prefLabel}>Max dine-outs per week</Text>
          <Menu
            visible={maxDineOutMenuVisible}
            onDismiss={() => setMaxDineOutMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMaxDineOutMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {preferences.maxDineOutsPerWeek}
              </Button>
            }
          >
            {MAX_DINEOUT_OPTIONS.map((n) => (
              <Menu.Item
                key={n}
                title={String(n)}
                onPress={() => {
                  updatePreferences({ maxDineOutsPerWeek: n });
                  setMaxDineOutMenuVisible(false);
                }}
              />
            ))}
          </Menu>

          <Text style={styles.prefLabel}>Avoid repeat within (days)</Text>
          <Menu
            visible={avoidRepeatMenuVisible}
            onDismiss={() => setAvoidRepeatMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setAvoidRepeatMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {preferences.avoidRepeatDays} days
              </Button>
            }
          >
            {AVOID_REPEAT_OPTIONS.map((n) => (
              <Menu.Item
                key={n}
                title={`${n} days`}
                onPress={() => {
                  updatePreferences({ avoidRepeatDays: n });
                  setAvoidRepeatMenuVisible(false);
                }}
              />
            ))}
          </Menu>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Include new dishes in plans</Text>
            <Switch
              value={preferences.includeNewDishes}
              onValueChange={(v) => updatePreferences({ includeNewDishes: v })}
              color={Colors.primary}
            />
          </View>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Account Section */}
      <Text style={styles.sectionTitle}>Account</Text>
      <Button
        mode="outlined"
        icon="export"
        onPress={handleExport}
        style={styles.accountButton}
      >
        Export Data
      </Button>
      <Button
        mode="contained"
        icon="logout"
        onPress={handleSignOut}
        loading={authLoading}
        buttonColor={Colors.error}
        textColor={Colors.white}
        style={styles.signOutButton}
      >
        Sign Out
      </Button>

      {saving && (
        <Text style={styles.savingText}>Saving...</Text>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  divider: {
    marginVertical: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    elevation: 1,
  },
  householdName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  memberAvatar: {
    marginRight: Spacing.sm,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  memberRole: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  youBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  youBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: '600',
  },
  inviteButton: {
    marginTop: Spacing.md,
    borderColor: Colors.primary,
  },
  noHousehold: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    fontStyle: 'italic',
  },
  prefLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  mealToggles: {
    gap: Spacing.xs,
  },
  mealToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  mealToggleLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  dropdownButton: {
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  switchLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  accountButton: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderColor: Colors.border,
  },
  signOutButton: {
    marginHorizontal: Spacing.md,
  },
  prefsLoader: {
    padding: Spacing.lg,
  },
  savingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});

export default ProfileScreen;
