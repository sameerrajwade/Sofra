import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { createHousehold } from '../services/firestore';

type AuthMode = 'signIn' | 'signUp';

const VALUE_PROPS = [
  { icon: 'chef-hat', title: 'Smart Meal Planning', desc: 'AI-powered weekly plans based on your preferences' },
  { icon: 'chart-line', title: 'Track & Insights', desc: 'See spending patterns and cooking habits' },
  { icon: 'account-group', title: 'Family Friendly', desc: 'Plan meals for the whole household together' },
];

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, resetPassword, isLoading, error, clearError } =
    useAuthStore();

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
    clearError();
    setLocalError(null);
    setResetSent(false);
  }, [clearError]);

  const validate = (): boolean => {
    if (!email.trim() || !password.trim()) {
      setLocalError('Email and password are required.');
      return false;
    }
    if (mode === 'signUp' && !name.trim()) {
      setLocalError('Name is required.');
      return false;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return false;
    }
    setLocalError(null);
    return true;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    if (mode === 'signIn') {
      await signIn(email.trim(), password);
    } else {
      await signUp(email.trim(), password, name.trim());
      // Create household if name provided
      if (householdName.trim()) {
        try {
          const { user } = useAuthStore.getState();
          if (user) {
            await createHousehold(householdName.trim(), user.id);
          }
        } catch {
          // Non-critical, user can set up household later
        }
      }
    }
  }, [mode, email, password, name, householdName, signIn, signUp]);

  const handleGoogleSignIn = useCallback(async () => {
    clearError();
    setLocalError(null);
    await signInWithGoogle();
  }, [signInWithGoogle, clearError]);

  const handleForgotPassword = useCallback(async () => {
    if (!email.trim()) {
      setLocalError('Enter your email address first.');
      return;
    }
    await resetPassword(email.trim());
    setResetSent(true);
  }, [email, resetPassword]);

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View style={styles.branding}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={40} color={Colors.white} />
          </View>
          <Text style={styles.appName}>ThaliPlan</Text>
          <Text style={styles.tagline}>Plan meals, not stress</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === 'signUp' && (
            <TextInput
              label="Your name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              left={<TextInput.Icon icon="account" />}
              autoCapitalize="words"
            />
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setLocalError(null);
            }}
            mode="outlined"
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            left={<TextInput.Icon icon="email" />}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setLocalError(null);
            }}
            mode="outlined"
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          {mode === 'signUp' && (
            <TextInput
              label="Household name (optional)"
              value={householdName}
              onChangeText={setHouseholdName}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              left={<TextInput.Icon icon="home-group" />}
              placeholder="e.g. The Smiths"
            />
          )}

          {displayError ? (
            <HelperText type="error" visible style={styles.errorText}>
              {displayError}
            </HelperText>
          ) : null}

          {resetSent && (
            <HelperText type="info" visible style={styles.infoText}>
              Password reset email sent. Check your inbox.
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitButton}
            buttonColor={Colors.primary}
            textColor={Colors.white}
            contentStyle={styles.submitButtonContent}
          >
            {mode === 'signIn' ? 'Sign In' : 'Get Started'}
          </Button>

          {mode === 'signIn' && (
            <Button
              mode="text"
              onPress={handleForgotPassword}
              disabled={isLoading}
              style={styles.forgotButton}
              textColor={Colors.primary}
            >
              Forgot password?
            </Button>
          )}

          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <Button
            mode="outlined"
            icon="google"
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            style={styles.googleButton}
            textColor={Colors.text}
            contentStyle={styles.submitButtonContent}
          >
            Continue with Google
          </Button>

          <Button
            mode="text"
            onPress={toggleMode}
            disabled={isLoading}
            style={styles.toggleButton}
            textColor={Colors.primary}
          >
            {mode === 'signIn'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Button>
        </View>

        {/* Value proposition cards (sign up only) */}
        {mode === 'signUp' && (
          <View style={styles.valueProps}>
            {VALUE_PROPS.map((prop) => (
              <Card key={prop.title} style={styles.valuePropCard}>
                <Card.Content style={styles.valuePropContent}>
                  <MaterialCommunityIcons
                    name={prop.icon as any}
                    size={28}
                    color={Colors.primary}
                    style={styles.valuePropIcon}
                  />
                  <View style={styles.valuePropText}>
                    <Text style={styles.valuePropTitle}>{prop.title}</Text>
                    <Text style={styles.valuePropDesc}>{prop.desc}</Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
  branding: {
    alignItems: 'center',
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  form: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.sm,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.success,
  },
  submitButton: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  submitButtonContent: {
    paddingVertical: Spacing.xs,
  },
  forgotButton: {
    marginTop: Spacing.xs,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  orText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
  },
  googleButton: {
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  toggleButton: {
    marginTop: Spacing.md,
  },
  valueProps: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  valuePropCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    elevation: 1,
  },
  valuePropContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valuePropIcon: {
    marginRight: Spacing.md,
  },
  valuePropText: {
    flex: 1,
  },
  valuePropTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  valuePropDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default AuthScreen;
