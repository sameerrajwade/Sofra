import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar, View, Text, ActivityIndicator, StyleSheet, Appearance } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  NavigationContainer,
  DefaultTheme as NavLightTheme,
  DarkTheme as NavDarkTheme,
} from '@react-navigation/native';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from './src/hooks/useTheme';
import { useFonts } from 'expo-font';
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Colors } from './src/config/theme';
import { onAuthStateChanged } from './src/services/auth';
import { getUserProfile } from './src/services/firestore';
import { useAuthStore } from './src/stores/useAuthStore';
import { useHouseholdStore } from './src/stores/useHouseholdStore';
import * as Notifications from 'expo-notifications';
import { useThemeStore } from './src/stores/useThemeStore';
import { useNotificationStore } from './src/stores/useNotificationStore';
import { navigationRef, navigate } from './src/navigation/navigationRef';
import { migrateDishNamesToTitleCase } from './src/services/migration';

// Themed shell — reads the resolved palette so React Native Paper, React
// Navigation, and the status bar all follow light/dark (fixes invisible input
// text, light headers, and washed-out legends in dark mode).
function ThemedApp() {
  const { colors, isDark } = useTheme();

  const paperTheme = useMemo(() => {
    const base = isDark ? MD3DarkTheme : MD3LightTheme;
    return {
      ...base,
      roundness: 10,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        surface: colors.surface,
        surfaceVariant: colors.surfaceVariant,
        error: colors.error,
        onSurface: colors.text,
        onSurfaceVariant: colors.textSecondary,
        onBackground: colors.text,
        outline: colors.border,
        placeholder: colors.textMuted,
        elevation: {
          ...base.colors.elevation,
          level0: 'transparent',
          level1: colors.surface,
          level2: colors.surface,
          level3: colors.surface,
        },
      },
    };
  }, [isDark, colors]);

  const navTheme = useMemo(() => {
    const base = isDark ? NavDarkTheme : NavLightTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [isDark, colors]);

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navTheme} ref={navigationRef}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
          translucent={false}
        />
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  const setUser = useAuthStore((s) => s.setUser);
  const [isInitializing, setIsInitializing] = useState(true);
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Load saved theme mode + keep the OS color scheme in sync (for 'auto').
  useEffect(() => {
    useThemeStore.getState().hydrate();
    useNotificationStore.getState().hydrate().catch(() => {});

    // Route to the right screen when the user taps a reminder notification.
    const notifSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { screen?: string; range?: string };
      if (data?.screen === 'Insights') {
        navigate('Main', { screen: 'Insights', params: { range: data.range } });
      } else if (data?.screen === 'Plan') {
        navigate('Main', { screen: 'Plan' });
      }
    });
    const appearanceSub = Appearance.addChangeListener(({ colorScheme }) => {
      useThemeStore.getState().setSystemScheme(colorScheme ?? 'light');
    });
    return () => {
      notifSub.remove();
      appearanceSub.remove();
    };
  }, []);

  useEffect(() => {
    let didFinish = false;
    const timeout = setTimeout(() => {
      if (!didFinish) {
        didFinish = true;
        setIsInitializing(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          let profile = null;
          try {
            profile = await getUserProfile(firebaseUser.uid);
          } catch {
            // Firestore may be unreachable on first launch
          }
          const resolvedUser = profile || {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || null,
            householdId: null,
            createdAt: new Date(),
          };
          setUser(resolvedUser);
          // Load household + preferences once at startup so every screen reads a
          // single, in-sync copy (screens must NOT refetch prefs on focus — that
          // would clobber in-memory edits like toggling a meal type off).
          if (resolvedUser.householdId) {
            useHouseholdStore
              .getState()
              .fetchHousehold(resolvedUser.householdId, resolvedUser.id)
              .catch(() => {});
          }
          // Run once-per-device migration to title-case existing dish names
          if (resolvedUser.householdId) {
            migrateDishNamesToTitleCase(resolvedUser.householdId).catch(() => {});
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
      if (!didFinish) {
        didFinish = true;
        clearTimeout(timeout);
        setIsInitializing(false);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [setUser]);

  if (isInitializing || !fontsLoaded) {
    // Branded cold-boot splash (fonts may not be ready yet, so the wordmark
    // falls back to the system font for this brief moment).
    return (
      <View style={initStyles.container}>
        <View style={initStyles.logoCircle}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={40} color="#FFFFFF" />
        </View>
        <Text style={initStyles.brand}>Sofra</Text>
        <Text style={initStyles.tagline}>Your family's meal memory</Text>
        <ActivityIndicator size="small" color={Colors.primary} style={initStyles.spinner} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemedApp />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const initStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    marginTop: 20,
    fontSize: 34,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  spinner: { marginTop: 28 },
});
