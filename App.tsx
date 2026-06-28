import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/config/theme';
import { onAuthStateChanged } from './src/services/auth';
import { getUserProfile } from './src/services/firestore';
import { useAuthStore } from './src/stores/useAuthStore';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    surface: Colors.surface,
    error: Colors.error,
    text: Colors.text,
    onSurface: Colors.text,
  },
  roundness: 10,
};

export default function App() {
  const setUser = useAuthStore((s) => s.setUser);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(
          profile || {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || null,
            householdId: null,
            createdAt: new Date(),
          },
        );
      } else {
        setUser(null);
      }
      setIsInitializing(false);
    });
    return unsubscribe;
  }, [setUser]);

  if (isInitializing) {
    return (
      <View style={initStyles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={Colors.background}
            translucent={false}
          />
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const initStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
