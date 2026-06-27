export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type SourceType = 'home' | 'takeout' | 'dineout';
export type CuisineTag =
  | 'Indian'
  | 'Chinese'
  | 'Italian'
  | 'Mexican'
  | 'American'
  | 'Thai'
  | 'Japanese'
  | string;

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  householdId: string | null;
  createdAt: Date;
}

export interface Household {
  id: string;
  name: string;
  memberIds: string[];
  adminId: string;
  inviteCode: string;
  createdAt: Date;
}

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  sourceType: SourceType;
  dishName: string;
  cuisineTag: CuisineTag;
  restaurantName?: string;
  cost?: number;
  notes?: string;
  createdBy: string;
  householdId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dish {
  id: string;
  name: string;
  cuisineTag: CuisineTag;
  categoryTags: string[];
  isFavorite: boolean;
  timesCooked: number;
  lastCookedDate: string;
  householdId: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisineType: string;
  totalVisits: number;
  totalSpend: number;
  lastVisitDate: string;
  householdId: string;
}

export interface MealPlan {
  date: string;
  lunch: {
    dishName: string;
    sourceType: SourceType;
    lastMadeDaysAgo: number;
    isNew: boolean;
  };
  dinner: {
    dishName: string;
    sourceType: SourceType;
    lastMadeDaysAgo: number;
    isNew: boolean;
  };
}

export interface UserPreferences {
  defaultMeals: MealType[];
  monthlyDineOutBudget: number;
  dishRotationDays: number;
  currency: string;
  maxDineOutsPerWeek: number;
  avoidRepeatDays: number;
  includeNewDishes: boolean;
}

export interface InsightData {
  homeCookedPercent: number;
  homeCookedTrend: number;
  dineOutCount: number;
  dineOutCountLastMonth: number;
  uniqueDishes: number;
  outsideSpending: number;
  outsideSpendingTrend: number;
  topRestaurants: { name: string; visits: number; spend: number }[];
  cuisineBreakdown: { cuisine: string; percent: number }[];
  mostCookedDishes: { name: string; count: number }[];
  monthlySpending: { month: string; amount: number }[];
}
