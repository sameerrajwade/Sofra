import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';

export const HouseholdSetupScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user } = useAuthStore();
  const { createHousehold, joinHousehold, isLoading } = useHouseholdStore();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = async () => {
    if (!householdName.trim()) {
      Alert.alert('Required', 'Please enter a household name');
      return;
    }
    if (!user) return;
    try {
      await createHousehold(householdName.trim(), user.id);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create household');
    }
  };

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Required', 'Please enter an invite code');
      return;
    }
    if (!user) return;
    try {
      await joinHousehold(code, user.id);
    } catch (e: any) {
      const msg = e.message || 'Failed to join household';
      const isNotFound = msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('not found');
      Alert.alert(
        'Could not join household',
        isNotFound
          ? 'Invite code not found. Please check the code and try again — codes are case-insensitive.'
          : msg,
      );
    }
  };

  if (mode === 'choose') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="home-group" size={64} color={colors.primary} />
          </View>
          <Text style={styles.title}>Set up your household</Text>
          <Text style={styles.subtitle}>
            A household is where your family shares meal plans, tracks dishes, and builds your food memory together.
          </Text>

          <Surface style={styles.optionCard} elevation={1}>
            <MaterialCommunityIcons name="plus-circle-outline" size={32} color={colors.primary} />
            <Text style={styles.optionTitle}>Create a new household</Text>
            <Text style={styles.optionDesc}>Start fresh — you can invite family members later</Text>
            <Button mode="contained" onPress={() => setMode('create')} style={styles.optionButton} buttonColor={colors.primary}>
              Create household
            </Button>
          </Surface>

          <Surface style={styles.optionCard} elevation={1}>
            <MaterialCommunityIcons name="account-group-outline" size={32} color={colors.home} />
            <Text style={styles.optionTitle}>Join an existing household</Text>
            <Text style={styles.optionDesc}>Enter the invite code shared by a family member</Text>
            <Button mode="outlined" onPress={() => setMode('join')} style={styles.optionButton} textColor={colors.home}>
              Join household
            </Button>
          </Surface>
        </View>
      </View>
    );
  }

  if (mode === 'create') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <MaterialCommunityIcons name="home-plus-outline" size={48} color={colors.primary} />
          <Text style={styles.title}>Name your household</Text>
          <Text style={styles.subtitle}>This is how your family's meal hub will be identified</Text>
          <TextInput
            label="Household name"
            value={householdName}
            onChangeText={setHouseholdName}
            placeholder="e.g. Rajwade Family"
            style={styles.input}
            mode="outlined"
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />
          <Button mode="contained" onPress={handleCreate} loading={isLoading} disabled={isLoading} style={styles.button} buttonColor={colors.primary}>
            Create household
          </Button>
          <Button mode="text" onPress={() => setMode('choose')} textColor={colors.textSecondary}>
            Back
          </Button>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="key-variant" size={48} color={colors.home} />
        <Text style={styles.title}>Join a household</Text>
        <Text style={styles.subtitle}>Enter the invite code shared by your family member</Text>
        <TextInput
          label="Invite code"
          value={inviteCode}
          onChangeText={setInviteCode}
          placeholder="Enter code"
          style={styles.input}
          mode="outlined"
          outlineColor={colors.border}
          activeOutlineColor={colors.home}
          autoCapitalize="characters"
        />
        <Button mode="contained" onPress={handleJoin} loading={isLoading} disabled={isLoading} style={styles.button} buttonColor={colors.home}>
          Join household
        </Button>
        <Button mode="text" onPress={() => setMode('choose')} textColor={colors.textSecondary}>
          Back
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: FontSize.xxl,
      fontFamily: Fonts.display,
      color: c.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.xl,
      lineHeight: 22,
      paddingHorizontal: Spacing.md,
    },
    optionCard: {
      width: '100%',
      borderRadius: BorderRadius.lg,
      backgroundColor: c.surface,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      alignItems: 'center',
      gap: Spacing.sm,
    },
    optionTitle: {
      fontSize: FontSize.lg,
      fontFamily: Fonts.displayMedium,
      color: c.text,
    },
    optionDesc: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.body,
      color: c.textSecondary,
      textAlign: 'center',
    },
    optionButton: {
      marginTop: Spacing.sm,
      width: '100%',
      borderRadius: BorderRadius.md,
    },
    input: {
      width: '100%',
      marginBottom: Spacing.md,
      backgroundColor: c.surface,
    },
    button: {
      width: '100%',
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
    },
  });

export default HouseholdSetupScreen;
