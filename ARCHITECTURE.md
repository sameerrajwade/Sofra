# ThaliPlan -- Architecture Document

*Version: 1.0*
*Last updated: June 27, 2026*

---

## 1. System Architecture Overview

### High-Level Architecture

```
React Native (Expo) Client
    |
    +-- Firebase Auth (Google Sign-in, Email/Password)
    +-- Cloud Firestore (primary data store)
    +-- Firebase Storage (avatar images)
    +-- Cloud Functions (auto-plan generation, insights, household invites)
    +-- Firebase Cloud Messaging (push notifications)
```

The app follows a **serverless architecture** where the React Native client communicates directly with Firebase services. Business logic that requires server-side execution (meal plan generation, analytics aggregation, household invite management) runs in Cloud Functions.

### Data Flow

1. **Authentication:** User signs in via Firebase Auth (Google or email/password). On first sign-in, a Cloud Function trigger creates the user profile document and default household.
2. **Reading data:** The client subscribes to Firestore real-time listeners on household meals, dishes, and restaurants. Firestore delivers snapshots and incremental updates.
3. **Writing data:** The client writes directly to Firestore (meals, dishes, restaurants). Security rules enforce authorization and field validation.
4. **Auto-planning:** The client calls the `generateWeeklyPlan` Cloud Function, which reads the household's meal history, applies planning rules, and returns a suggested plan. The client displays the draft; on acceptance, the client writes the meals to Firestore.
5. **Insights:** The `calculateInsights` Cloud Function aggregates meal data for the requested time range and returns computed metrics (home/outside ratio, spending trends, cuisine distribution, top restaurants).
6. **Household management:** Invite codes are generated and validated via Cloud Functions (`inviteToHousehold`, `joinHousehold`) to prevent unauthorized household access.

### Offline-First Strategy

- **Firestore offline persistence** is enabled on app startup. All reads are served from the local cache when offline.
- Writes made offline are queued locally and automatically synced when connectivity is restored.
- The client uses `onSnapshot` listeners which seamlessly handle the cache-to-server transition.
- Real-time listeners include `{ includeMetadataChanges: true }` so the UI can indicate pending/synced status.
- Image uploads (avatars) are deferred until online; the app shows a local URI in the meantime.

---

## 2. Firestore Data Models

### 2.1 `users/{userId}`

```typescript
interface UserProfile {
  uid: string;                   // Firebase Auth UID
  email: string;
  displayName: string;
  avatarUrl: string | null;      // Firebase Storage URL
  avatarType: 'upload' | 'preset' | 'initials';
  presetAvatarId: string | null; // if avatarType === 'preset'
  householdId: string;           // reference to household
  role: 'admin' | 'member';
  preferences: {
    defaultMeals: ('breakfast' | 'lunch' | 'dinner' | 'snack')[];
    monthlyDineOutBudget: number;
    budgetCurrency: 'USD' | 'INR' | 'GBP' | 'EUR';
    dishRotationReminderDays: number | null; // 30, 45, 60, or null (off)
    notifications: {
      weeklyPlanReminder: boolean;
      dailyLogNudge: boolean;
      budgetAlert: boolean;
      dishRotation: boolean;
    };
  };
  autoPlanRules: {
    maxDineOutsPerWeek: number | null; // null = no limit
    avoidRepeatWithinDays: number;     // default 14
    includeNewDishes: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2.2 `households/{householdId}`

```typescript
interface Household {
  name: string;                  // e.g., "Rajwade Family"
  members: string[];             // array of user UIDs
  adminUid: string;              // UID of household creator/admin
  inviteCode: string;            // 6-char alphanumeric code
  inviteCodeExpiresAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2.3 `households/{householdId}/meals/{mealId}`

```typescript
interface Meal {
  date: string;                  // ISO date 'YYYY-MM-DD'
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  sourceType: 'home' | 'takeout' | 'dineout';
  dishName: string;
  cuisineTag: string;            // e.g., 'Indian', 'Chinese'
  restaurantName: string | null; // only for takeout/dineout
  cost: number | null;           // only for takeout/dineout
  notes: string | null;
  createdBy: string;             // user UID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2.4 `households/{householdId}/dishes/{dishId}`

```typescript
interface Dish {
  name: string;
  cuisineTag: string;
  categoryTags: string[];        // 'Quick meal', 'Comfort food', 'Elaborate', etc.
  isFavorite: boolean;
  timesCooked: number;
  lastCookedDate: string | null; // ISO date
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2.5 `households/{householdId}/restaurants/{restaurantId}`

```typescript
interface Restaurant {
  name: string;
  cuisineType: string;
  totalVisits: number;
  totalSpend: number;
  lastVisitDate: string | null;  // ISO date
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Index Requirements

The following composite indexes are needed in `firestore.indexes.json`:

| Collection | Fields | Purpose |
|---|---|---|
| `meals` | `date` ASC, `mealType` ASC | Calendar view queries |
| `meals` | `sourceType` ASC, `date` DESC | Filtered history (home/takeout/dineout) |
| `meals` | `dishName` ASC, `date` DESC | Dish detail: all dates a dish was made |
| `meals` | `createdBy` ASC, `date` DESC | Meals by a specific user |
| `meals` | `cuisineTag` ASC, `date` DESC | Cuisine-filtered queries |
| `meals` | `restaurantName` ASC, `date` DESC | Restaurant visit history |
| `dishes` | `isFavorite` DESC, `name` ASC | Favorite dishes sorted alphabetically |
| `dishes` | `lastCookedDate` ASC | "Forgotten dishes" sorted by staleness |
| `dishes` | `timesCooked` DESC | Most cooked dishes |
| `restaurants` | `totalVisits` DESC | Top restaurants by visit count |
| `restaurants` | `lastVisitDate` DESC | Recently visited restaurants |

---

## 3. Firebase Security Rules

Security rules are defined in `firestore.rules` at the project root. Key principles:

- Users can only read/write their own profile document.
- Household data (meals, dishes, restaurants) is accessible only to users whose UID is in the household's `members` array.
- All writes require specific fields to be present and correctly typed.
- Only household admins can delete the household or remove members.
- Meal deletion is restricted to the meal creator or household admin.

See `firestore.rules` for the full rule set.

---

## 4. Firebase Auth Setup

### Google Sign-In

**Android:**
- Configure SHA-1 fingerprint in Firebase console.
- Enable Google sign-in provider in Firebase Auth.
- Use `@react-native-google-signin/google-signin` with the web client ID from `google-services.json`.

**iOS:**
- Add the reversed client ID as a URL scheme in `Info.plist`.
- Enable Google sign-in provider in Firebase Auth.
- Use the same `@react-native-google-signin/google-signin` library.

### Email/Password Registration

- Enable Email/Password provider in Firebase Auth console.
- Registration flow: collect name, email, password, household name, avatar selection.
- On successful `createUserWithEmailAndPassword`, a Cloud Function `onCreate` trigger creates the user profile and household documents.

### Profile Picture Upload

- **Storage path:** `avatars/{userId}` (single file per user, overwritten on change).
- **Upload flow:**
  1. User picks image from camera/gallery or selects a preset avatar.
  2. For uploads: compress to max 512x512, JPEG quality 80%, upload to Storage.
  3. Get the download URL and update `users/{userId}.avatarUrl`.
- **Storage rules** ensure only the owning user can write to their avatar path. See `storage.rules`.

---

## 5. API Design (Cloud Functions)

All functions are HTTPS callable functions using `functions.https.onCall`.

### 5.1 `generateWeeklyPlan`

**Purpose:** Generate a suggested weekly meal plan based on household cooking history.

```typescript
// Request
interface GenerateWeeklyPlanRequest {
  householdId: string;
  startDate: string;           // ISO date, Monday of the target week
  rules?: {
    avoidRepeatWithinDays?: number;
    maxDineOutsPerWeek?: number;
    includeNewDishes?: boolean;
  };
}

// Response
interface GenerateWeeklyPlanResponse {
  plan: Array<{
    date: string;
    lunch: { dishName: string; daysSinceLastMade: number | null; isNew: boolean } | null;
    dinner: { dishName: string; daysSinceLastMade: number | null; isNew: boolean } | null;
  }>;
  meta: {
    dishesAvoided: number;      // dishes skipped due to recency
    dishesPrioritized: number;  // dishes suggested because not made in 30+ days
  };
}
```

**Algorithm:**
1. Fetch all meals from the last 90 days and all dishes for the household.
2. Build a recency map: dish name to last-made date.
3. Exclude dishes made within `avoidRepeatWithinDays`.
4. Prioritize dishes not made in 30+ days, weighted by `timesCooked` (prefer familiar dishes).
5. Balance cuisine distribution across the week.
6. Allocate dine-out slots based on historical weekend patterns, respecting `maxDineOutsPerWeek`.
7. Optionally insert 0-2 new dish suggestions (dishes never logged) from the cuisine tags the household uses.

### 5.2 `calculateInsights`

**Purpose:** Compute aggregated insights for a given time range.

```typescript
// Request
interface CalculateInsightsRequest {
  householdId: string;
  period: 'week' | 'month' | '3months' | '6months';
}

// Response
interface CalculateInsightsResponse {
  homeVsOutside: {
    homePercent: number;
    takeoutPercent: number;
    dineOutPercent: number;
    previousPeriodHomePercent: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  topRestaurants: Array<{
    name: string;
    visitCount: number;
    totalSpend: number;
  }>;
  cuisineDistribution: Array<{
    cuisine: string;
    percent: number;
    count: number;
  }>;
  spendingTrend: Array<{
    month: string;
    totalSpend: number;
  }>;
  mostCookedDishes: Array<{
    dishName: string;
    count: number;
  }>;
  totalMeals: number;
  totalSpend: number;
}
```

### 5.3 `inviteToHousehold`

**Purpose:** Generate or refresh an invite code for a household.

```typescript
// Request
interface InviteToHouseholdRequest {
  householdId: string;
}

// Response
interface InviteToHouseholdResponse {
  inviteCode: string;          // 6-char alphanumeric
  expiresAt: string;           // ISO datetime, 7 days from now
  inviteLink: string;          // deep link: thaliplan://join?code=XXXXXX
}
```

**Logic:**
1. Verify caller is the household admin.
2. Generate a unique 6-character alphanumeric code.
3. Store the code and expiry on the household document.
4. Return the code and a shareable deep link.

### 5.4 `joinHousehold`

**Purpose:** Join an existing household using an invite code.

```typescript
// Request
interface JoinHouseholdRequest {
  inviteCode: string;
}

// Response
interface JoinHouseholdResponse {
  householdId: string;
  householdName: string;
}
```

**Logic:**
1. Query all households for matching, non-expired invite code.
2. Verify the user is not already in a household (or handle multi-household if supported).
3. Add the user's UID to the household `members` array.
4. Update the user's profile with the new `householdId` and role `member`.
5. Return household details.

---

## 6. Security and Compliance

### Data Encryption

- **In transit:** All communication uses TLS (enforced by Firebase SDKs).
- **At rest:** Firestore and Firebase Storage encrypt data at rest by default (Google-managed keys).

### PII Handling

- PII stored: email, display name, profile photo.
- PII is scoped to the `users/{userId}` document; household data uses UIDs only in the `members` array and `createdBy` fields.
- No PII is logged in Cloud Functions. Structured logging uses UIDs, not emails.

### GDPR Compliance

- **Data export:** Users can export all their data as CSV from the Profile screen. The export Cloud Function gathers all meals, dishes, and restaurants for the household and the user's profile.
- **Account deletion:** A `deleteAccount` Cloud Function:
  1. Removes the user from their household's `members` array.
  2. Deletes the user's profile document.
  3. Deletes the user's avatar from Storage.
  4. Deletes the Firebase Auth account.
  5. If the user was the sole household member, deletes the entire household and its subcollections.
- **Data portability:** CSV export satisfies portability requirements.

### App Store Compliance

- Apple App Store: Include a privacy nutrition label disclosing data collected (name, email, usage data). Provide account deletion per Apple's requirements.
- Google Play: Privacy policy link in listing. Data safety section disclosing data types.
- Privacy policy and terms of service hosted at a public URL, linked from the app.

---

## 7. Performance Considerations

### Firestore Query Optimization

- Use composite indexes (see Section 2) for all filtered/sorted queries.
- Scope all queries to the household subcollection to minimize documents scanned.
- Use `where` + `orderBy` with matching indexes; avoid in-memory filtering of large datasets.
- Cache frequently accessed data (dish list, restaurant list) using Firestore's built-in persistence.

### Pagination

- **Meal history:** Use cursor-based pagination with `startAfter` on the date field. Load 30 days per page.
- **Dish library:** Paginate with `limit(50)` and `startAfter` cursor on the sort field.
- **Restaurant list:** Typically small (under 100), load all at once.

### Image Compression

- Avatars compressed to max 512x512 pixels, JPEG quality 80% before upload.
- Use `expo-image-manipulator` for client-side resize/compress.
- Resulting file size target: under 100 KB.

### Bundle Size

- Use Expo's tree-shaking and code splitting.
- Lazy-load screens with `React.lazy` and `Suspense` (via React Navigation lazy loading).
- Import only needed Firebase modules (`firebase/auth`, `firebase/firestore`, etc.), not the full SDK.
- Target initial bundle under 5 MB (compressed).
- Use Hermes engine for faster startup on Android.

### Real-Time Listeners

- Detach Firestore listeners when screens unmount to avoid unnecessary reads.
- Use a single listener per collection per household (not per-document).
- Batch UI updates with `onSnapshot` to prevent excessive re-renders.

---

## 8. Project Folder Structure

```
src/
  assets/               # Images, fonts, preset avatars, icons
    avatars/             # Preset avatar images
    icons/               # App icons and tab bar icons
    fonts/               # Custom fonts

  components/            # Reusable UI components
    common/              # Buttons, cards, badges, chips, inputs
    meals/               # MealCard, MealForm, QuickPicks
    calendar/            # CalendarGrid, WeekNavigator, DayCell
    insights/            # ChartCard, StatCard, TrendIndicator
    dishes/              # DishRow, DishDetail, DishForm
    restaurants/         # RestaurantRow, SpendingSummary
    household/           # MemberCard, InviteModal
    navigation/          # BottomTabBar, HeaderBar

  screens/               # Screen components (one per app screen)
    DashboardScreen.tsx
    CalendarScreen.tsx
    AddEditMealScreen.tsx
    AutoPlanScreen.tsx
    InsightsScreen.tsx
    DishLibraryScreen.tsx
    RestaurantTrackerScreen.tsx
    MealHistoryScreen.tsx
    ProfileScreen.tsx
    OnboardingScreen.tsx
    SignInScreen.tsx

  navigation/            # React Navigation configuration
    AppNavigator.tsx      # Root navigator (auth vs main)
    MainTabNavigator.tsx  # Bottom tab navigator
    AuthStackNavigator.tsx
    types.ts              # Navigation param types

  services/              # Firebase and external service wrappers
    firebase.ts           # Firebase app initialization
    auth.ts               # Auth methods (sign in, sign up, sign out)
    firestore.ts          # Firestore CRUD helpers
    storage.ts            # Firebase Storage upload/download
    cloudFunctions.ts     # Callable function wrappers
    notifications.ts      # FCM setup and handlers

  stores/                # State management (Zustand)
    useAuthStore.ts
    useMealStore.ts
    useDishStore.ts
    useRestaurantStore.ts
    useHouseholdStore.ts
    useInsightsStore.ts

  hooks/                 # Custom React hooks
    useFirestoreListener.ts
    useMeals.ts
    useDishes.ts
    useRestaurants.ts
    useAutoPlan.ts
    useInsights.ts
    useImagePicker.ts
    useDebounce.ts

  utils/                 # Pure utility functions
    dateUtils.ts          # Date formatting, week boundaries
    currencyUtils.ts      # Currency formatting
    csvExport.ts          # CSV generation
    mealDefaults.ts       # Smart defaults (meal type from time of day)
    validation.ts         # Form validation helpers
    constants.ts          # App-wide constants

  types/                 # TypeScript type definitions
    models.ts             # Firestore document types
    navigation.ts         # Navigation param types
    api.ts                # Cloud Function request/response types
    enums.ts              # Meal types, source types, cuisines

functions/               # Firebase Cloud Functions (deployed separately)
  src/
    index.ts
    generateWeeklyPlan.ts
    calculateInsights.ts
    inviteToHousehold.ts
    joinHousehold.ts
    triggers/
      onUserCreate.ts
      onUserDelete.ts

firestore.rules          # Firestore security rules
firestore.indexes.json   # Composite index definitions
storage.rules            # Storage security rules
firebase.json            # Firebase project configuration
app.json                 # Expo configuration
tsconfig.json
package.json
```

---

*End of Architecture Document*
