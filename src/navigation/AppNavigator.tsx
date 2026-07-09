import React from 'react';
import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, FontSize, Fonts } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

import type {
  RootStackParamList,
  MainTabParamList,
  HomeStackParamList,
  ProfileStackParamList,
} from './types';

// Screens
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import PlanScreen from '../screens/PlanScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FamilyScreen from '../screens/FamilyScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LegalScreen from '../screens/LegalScreen';
import DishLibraryScreen from '../screens/DishLibraryScreen';
import RestaurantScreen from '../screens/RestaurantScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AddMealScreen from '../screens/AddMealScreen';
import HouseholdSetupScreen from '../screens/HouseholdSetupScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Header blended into the content background (no white bar/shadow), Fraunces title.
const blendedHeader = (c: ReturnType<typeof useTheme>['colors']) =>
  ({
    headerStyle: { backgroundColor: c.background },
    headerShadowVisible: false,
    headerTintColor: c.primary,
    headerTitleStyle: { fontFamily: Fonts.display, fontSize: 22, color: c.text },
    headerTitleAlign: 'left' as const,
    contentStyle: { backgroundColor: c.background },
  }) as const;

function ProfileStackNavigator() {
  const { colors } = useTheme();
  return (
    <ProfileStack.Navigator screenOptions={blendedHeader(colors)}>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="Family"
        component={FamilyScreen}
        options={{ title: 'Family' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStack.Screen
        name="Legal"
        component={LegalScreen}
        options={({ route }) => ({
          title: route.params?.doc === 'privacy' ? 'Privacy Policy' : 'Terms of Service',
        })}
      />
    </ProfileStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Home: 'home',
  Calendar: 'calendar-week',
  Plan: 'auto-fix',
  Insights: 'chart-bar',
  Profile: 'account',
};

function HomeStackNavigator() {
  const { colors } = useTheme();
  return (
    <HomeStack.Navigator screenOptions={blendedHeader(colors)}>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="DishLibrary"
        component={DishLibraryScreen}
        options={{ title: 'Dish Library' }}
      />
      <HomeStack.Screen
        name="Restaurants"
        component={RestaurantScreen}
        options={{ title: 'Restaurants' }}
      />
      <HomeStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ title: 'Restaurant' }}
      />
      <HomeStack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
    </HomeStack.Navigator>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  const tabHeader = (title: string) => ({
    headerShown: true,
    headerTitle: title,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerTintColor: colors.text,
    headerTitleStyle: { fontFamily: Fonts.display, fontSize: 22, color: colors.text },
    headerTitleAlign: 'left' as const,
  });
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={TAB_ICONS[route.name] as any}
            size={size}
            color={color}
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.border }],
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Always reset Home stack to root when the Home tab is tapped
            navigation.navigate('Home', { screen: 'HomeMain' });
          },
        })}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={tabHeader('Calendar')}
      />
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={tabHeader('Insights')}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Reset the Profile stack to root when the tab is tapped
            navigation.navigate('Profile', { screen: 'ProfileMain' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const needsHousehold = isAuthenticated && user && !user.householdId;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthScreen} />
      ) : needsHousehold ? (
        <RootStack.Screen
          name="HouseholdSetup"
          component={HouseholdSetupScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen
            name="AddMeal"
            component={AddMealScreen}
            options={{ presentation: 'modal', headerShown: true, headerTitle: 'Add Meal' }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 4,
    height: 60,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});

export default AppNavigator;
