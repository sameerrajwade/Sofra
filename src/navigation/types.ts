import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { Meal } from '../types';

export type RootStackParamList = {
  Auth: undefined;
  HouseholdSetup: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  AddMeal: { meal?: Meal } | undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Calendar: undefined;
  Plan: undefined;
  Insights: { range?: string } | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  DishLibrary: { monthDishes?: string[]; title?: string } | undefined;
  Restaurants: undefined;
  RestaurantDetail: { name: string };
  History: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Family: undefined;
  Settings: undefined;
  Legal: { doc: 'privacy' | 'terms' };
};

// Screen prop helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<MainTabParamList, 'Home'>,
      NativeStackScreenProps<RootStackParamList>
    >
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<MainTabParamList, 'Profile'>,
      NativeStackScreenProps<RootStackParamList>
    >
  >;
