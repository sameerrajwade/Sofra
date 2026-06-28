import React from 'react';
import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, FontSize } from '../config/theme';
import { useAuth } from '../hooks/useAuth';

import type { RootStackParamList, MainTabParamList, HomeStackParamList } from './types';

// Screens
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import PlanScreen from '../screens/PlanScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DishLibraryScreen from '../screens/DishLibraryScreen';
import RestaurantScreen from '../screens/RestaurantScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AddMealScreen from '../screens/AddMealScreen';
import HouseholdSetupScreen from '../screens/HouseholdSetupScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Home: 'home',
  Calendar: 'calendar-week',
  Plan: 'auto-fix',
  Insights: 'chart-bar',
  Profile: 'account',
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'ThaliPlan' }}
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
        name="History"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
    </HomeStack.Navigator>
  );
}

function MainTabs() {
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
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ headerShown: true, headerTitle: 'Calendar' }}
      />
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{ headerShown: true, headerTitle: 'Meal Plan' }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ headerShown: true, headerTitle: 'Insights' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerTitle: 'Profile' }} />
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
