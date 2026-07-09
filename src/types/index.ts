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

// One dish within a meal, with an optional 1–5 star rating (used mainly for
// dine-out / takeout where multiple dishes are ordered).
export interface MealItem {
  name: string;
  rating?: number;
}

// Who the meal is for. 'kids' powers the Lean kids-tiffin track; absent = family.
export type MealAudience = 'family' | 'kids';

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  sourceType: SourceType;
  dishName: string; // primary/summary dish (items[0] when multiple)
  items?: MealItem[]; // multiple dishes ordered, each with an optional rating
  audience?: MealAudience; // 'kids' = kids tiffin track; undefined = family
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
  // Per-dish star ratings (1–5) the household assigns for this restaurant.
  dishRatings?: Record<string, number>;
}

export interface MealPlanSlot {
  dishName: string;
  sourceType: SourceType;
  lastMadeDaysAgo: number;
  isNew: boolean;
}

export interface MealPlan {
  date: string;
  lunch: MealPlanSlot;
  dinner: MealPlanSlot;
  kids?: MealPlanSlot; // Lean kids-tiffin track (only when planKidsTiffin is on)
}

export interface UserPreferences {
  defaultMeals: MealType[];
  monthlyDineOutBudget: number;
  dishRotationDays: number;
  currency: string;
  maxDineOutsPerWeek: number;
  avoidRepeatDays: number;
  includeNewDishes: boolean;
  planKidsTiffin?: boolean; // include a kids tiffin track when generating plans
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
