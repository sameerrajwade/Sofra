# ThaliPlan -- Comprehensive Test Plan & Bug Report

Generated: 2026-06-27

---

## Table of Contents

1. [Screen-Level Test Cases](#1-screen-level-test-cases)
2. [Integration Test Cases](#2-integration-test-cases)
3. [Bug Report](#3-bug-report)
4. [Missing Test Infrastructure](#4-missing-test-infrastructure)

---

## 1. Screen-Level Test Cases

### 1.1 Screen 1 -- Dashboard (HomeScreen)

**Happy Path:**
- TC-HOME-001: Dashboard loads and displays 4 metric cards (Home Cooked %, Dine Out count, Unique Dishes, Outside Spend)
- TC-HOME-002: Today's meals section shows current lunch and dinner
- TC-HOME-003: Forgotten dishes section lists dishes sorted by days since last cooked
- TC-HOME-004: Pull-to-refresh reloads meals, dishes, and insights
- TC-HOME-005: FAB button navigates to AddMeal screen
- TC-HOME-006: Tapping a meal card navigates to AddMeal in edit mode
- TC-HOME-007: Tapping empty meal placeholder navigates to AddMeal

**Edge Cases:**
- TC-HOME-008: No household set up shows "Please set up your household first"
- TC-HOME-009: No meals logged shows empty today's meals with placeholders
- TC-HOME-010: No dishes in library shows no forgotten dishes section
- TC-HOME-011: Dishes with no lastCookedDate are excluded from forgotten dishes
- TC-HOME-012: User with very long name displays correctly in greeting

**Error Cases:**
- TC-HOME-013: Network failure on fetchMealsByDate shows error state
- TC-HOME-014: Network failure on fetchInsights still shows rest of dashboard
- TC-HOME-015: Null householdId prevents API calls

**Interaction Tests:**
- TC-HOME-016: Navigation to AddMeal via getParent().getParent() works from nested HomeStack
- TC-HOME-017: RefreshControl shows spinner during data load

### 1.2 Screen 2 -- Weekly Calendar (CalendarScreen)

**Happy Path:**
- TC-CAL-001: Calendar shows 7 days (Mon-Sun) with lunch and dinner columns
- TC-CAL-002: WeekNavigator displays correct date range
- TC-CAL-003: Previous/Next week buttons change week and reload data
- TC-CAL-004: Today button resets to current week
- TC-CAL-005: Today's row is highlighted with distinct background
- TC-CAL-006: Meal cells show dish name with type badge
- TC-CAL-007: Empty cells show "Not planned" placeholder
- TC-CAL-008: Auto-plan button generates meals for unplanned days

**Edge Cases:**
- TC-CAL-009: Week spanning two months shows correct date range
- TC-CAL-010: Week spanning two years shows correct date range
- TC-CAL-011: Auto-plan with all days already planned shows alert
- TC-CAL-012: Auto-plan with no dishes in library shows alert

**Error Cases:**
- TC-CAL-013: Network failure during auto-plan shows error alert
- TC-CAL-014: Network failure during week load shows loading indicator
- TC-CAL-015: No household shows empty state message

**Interaction Tests:**
- TC-CAL-016: Tapping planned cell navigates to AddMeal with meal data
- TC-CAL-017: Tapping unplanned cell navigates to AddMeal with pre-filled date and meal type
- TC-CAL-018: Auto-plan loading state disables button

### 1.3 Screen 3 -- Add/Edit Meal (AddMealScreen)

**Happy Path:**
- TC-ADD-001: Form pre-fills with today's date and "lunch" for new meal
- TC-ADD-002: All form fields accept and display input (date, meal type, source, dish, cuisine, restaurant, cost, notes)
- TC-ADD-003: Save creates new meal and navigates back
- TC-ADD-004: Edit mode pre-fills all fields from existing meal
- TC-ADD-005: Update modifies existing meal and navigates back
- TC-ADD-006: Delete shows confirmation dialog, deletes on confirm
- TC-ADD-007: DishPicker autocomplete shows matching dishes
- TC-ADD-008: Quick picks show recently used dishes
- TC-ADD-009: Selecting a quick pick auto-fills cuisine tag
- TC-ADD-010: Restaurant and cost fields disabled when source is "home"

**Edge Cases:**
- TC-ADD-011: Empty dish name shows validation alert on save
- TC-ADD-012: Very long dish name truncates in autocomplete
- TC-ADD-013: Special characters in dish name (apostrophes, accents) handled
- TC-ADD-014: Cost field accepts decimal values
- TC-ADD-015: Cost field with non-numeric input (parseFloat returns NaN)
- TC-ADD-016: Date field accepts free text (no date picker validation)

**Error Cases:**
- TC-ADD-017: No household shows error alert on save
- TC-ADD-018: Network failure on save shows error alert
- TC-ADD-019: Network failure on delete shows error alert

**Interaction Tests:**
- TC-ADD-020: Cancel button navigates back without saving
- TC-ADD-021: Keyboard avoiding view works on iOS
- TC-ADD-022: Delete button only shows in edit mode
- TC-ADD-023: Switching source type enables/disables restaurant and cost fields

### 1.4 Screen 4 -- Auto-Plan Generator (PlanScreen)

**Happy Path:**
- TC-PLAN-001: Plan generates 7 days of lunch and dinner suggestions
- TC-PLAN-002: Header shows sparkle icon and date range
- TC-PLAN-003: Info banner describes planning algorithm
- TC-PLAN-004: Preference chips display max dine-outs, mix cuisines, include new
- TC-PLAN-005: Each day row shows day label, lunch, and dinner suggestions
- TC-PLAN-006: "New!" badge shows for dishes with timesCooked === 0
- TC-PLAN-007: Days ago text shows for non-new home-cooked dishes
- TC-PLAN-008: Dine out dinner slots hide days-ago text
- TC-PLAN-009: Refresh button regenerates single day
- TC-PLAN-010: Tapping dish name opens edit dialog
- TC-PLAN-011: Edit dialog allows changing dish name
- TC-PLAN-012: "Regenerate all" creates entirely new plan
- TC-PLAN-013: "Accept plan" saves all meals to calendar

**Edge Cases:**
- TC-PLAN-014: No dishes in library shows empty state
- TC-PLAN-015: All dishes recently made (within avoidRepeatDays) falls back to full dish list
- TC-PLAN-016: Single dish in library generates plan with repeated dish
- TC-PLAN-017: Weekend days have 60% chance of dine-out dinner (randomness)

**Error Cases:**
- TC-PLAN-018: Accept plan with no household/user does nothing
- TC-PLAN-019: Network failure during accept plan (no error handling -- see BUG-009)

**Interaction Tests:**
- TC-PLAN-020: Pull-to-refresh triggers regeneration
- TC-PLAN-021: Edit dialog Cancel dismisses without changes
- TC-PLAN-022: Buttons disabled during generation/acceptance

### 1.5 Screen 5 -- Insights & Stats (InsightsScreen)

**Happy Path:**
- TC-INS-001: Time range chips (7d, 30d, 90d, 180d) switch data periods
- TC-INS-002: Home vs Outside ratio bar shows correct percentages
- TC-INS-003: Legend chips show Home, Takeout, Dine Out percentages
- TC-INS-004: Top restaurants section shows ranked list with bar chart
- TC-INS-005: Alert nudge appears when top restaurant has 5+ visits
- TC-INS-006: Cuisine variety shows horizontal bars with percentages
- TC-INS-007: Spending trend line chart renders monthly data
- TC-INS-008: Most cooked dishes shows top 3 with count

**Edge Cases:**
- TC-INS-009: No meals logged shows empty state
- TC-INS-010: Only home-cooked meals shows 100% home, 0% takeout/dine out
- TC-INS-011: Spending chart hidden when less than 2 data points
- TC-INS-012: No restaurants visited hides top restaurants section
- TC-INS-013: Zero total meals prevents division by zero in percent calculations

**Error Cases:**
- TC-INS-014: Network failure during data load (no error UI -- see BUG-012)

**Interaction Tests:**
- TC-INS-015: Pull-to-refresh reloads data
- TC-INS-016: Changing time range triggers new data fetch

### 1.6 Screen 6 -- Dish Library (DishLibraryScreen)

**Happy Path:**
- TC-DISH-001: Search filters dishes by name, cuisine, category tags
- TC-DISH-002: Cuisine filter dropdown filters by selected cuisine
- TC-DISH-003: Sort options (Last made, Most made, A-Z, Favorites) work correctly
- TC-DISH-004: Quick filter chips (All, Favorites, Not made 30+ days) work
- TC-DISH-005: Dish row shows star, name, cuisine chip, category tags, days ago, times cooked
- TC-DISH-006: Tapping star toggles favorite status
- TC-DISH-007: FAB opens add dish dialog
- TC-DISH-008: Add dish dialog creates new dish with all fields
- TC-DISH-009: Footer shows correct count of filtered dishes
- TC-DISH-010: Dishes with 60+ days show red color

**Edge Cases:**
- TC-DISH-011: Empty dish library shows empty state with helpful text
- TC-DISH-012: Search with no results shows "No dishes found"
- TC-DISH-013: Dish with empty lastCookedDate shows "Never"
- TC-DISH-014: Dish with no category tags shows no tag chips
- TC-DISH-015: Very long dish name truncates with numberOfLines={1}
- TC-DISH-016: Category tags limited to showing first 2

**Error Cases:**
- TC-DISH-017: Error fetching dishes shows error state with retry button
- TC-DISH-018: Error toggling favorite shows alert
- TC-DISH-019: Error adding dish shows alert

**Interaction Tests:**
- TC-DISH-020: Pull-to-refresh reloads dishes
- TC-DISH-021: Dialog cancel dismisses without adding
- TC-DISH-022: Add button disabled when name is empty

### 1.7 Screen 7 -- Restaurant Tracker (RestaurantScreen)

**Happy Path:**
- TC-REST-001: Time range chips filter restaurants by last visit date
- TC-REST-002: Summary cards show total spend, total visits, unique places
- TC-REST-003: Restaurant list sorted by visit count descending
- TC-REST-004: Each restaurant card shows name, cuisine, visits, spend, last visit
- TC-REST-005: "Frequent" badge on restaurants with 5+ visits
- TC-REST-006: Exploration nudge banner when top 2 restaurants have >60% visits

**Edge Cases:**
- TC-REST-007: No restaurants shows empty state
- TC-REST-008: Single restaurant shows correct metrics
- TC-REST-009: Restaurant with $0 spend displays correctly
- TC-REST-010: Time filter "All time" shows all restaurants

**Error Cases:**
- TC-REST-011: Network failure shows error state with retry
- TC-REST-012: No household prevents fetch

**Interaction Tests:**
- TC-REST-013: Pull-to-refresh reloads data
- TC-REST-014: Switching time range re-filters in place (client-side)

### 1.8 Screen 8 -- Meal History (HistoryScreen)

**Happy Path:**
- TC-HIST-001: Meals grouped by month with section headers
- TC-HIST-002: Each day shows lunch and dinner columns
- TC-HIST-003: Source filter chips (All, Home, Takeout, Dine Out) filter results
- TC-HIST-004: Search filters by dish name and restaurant name
- TC-HIST-005: Export button shares CSV data
- TC-HIST-006: Infinite scroll loads more months on end reached

**Edge Cases:**
- TC-HIST-007: No meals shows empty state
- TC-HIST-008: Day with only lunch shows dinner as "--"
- TC-HIST-009: Meal with $0 cost hides cost display
- TC-HIST-010: Very long history performance (many sections)

**Error Cases:**
- TC-HIST-011: Export with no data shows alert
- TC-HIST-012: Share API failure shows error alert

**Interaction Tests:**
- TC-HIST-013: Tapping meal entry should navigate to edit (currently no-op -- see BUG-014)
- TC-HIST-014: Section headers stick during scroll
- TC-HIST-015: Load more triggered at 30% threshold

### 1.9 Screen 9 -- Profile & Settings (ProfileScreen)

**Happy Path:**
- TC-PROF-001: Profile shows avatar, name, email
- TC-PROF-002: Household section shows members with role badges
- TC-PROF-003: Invite button displays invite code
- TC-PROF-004: Meal preferences: default meals toggles work
- TC-PROF-005: Monthly dine-out budget editable
- TC-PROF-006: Dish rotation dropdown works
- TC-PROF-007: Currency dropdown works
- TC-PROF-008: Auto-plan rules: max dine-outs, avoid repeat, include new dishes
- TC-PROF-009: Sign out shows confirmation, signs out on confirm
- TC-PROF-010: Avatar picker: camera, gallery, initials options
- TC-PROF-011: Export data button triggers share

**Edge Cases:**
- TC-PROF-012: No household shows "No household set up"
- TC-PROF-013: Budget field with non-numeric input (parseInt returns NaN)
- TC-PROF-014: User with no avatar shows initials
- TC-PROF-015: Single household member

**Error Cases:**
- TC-PROF-016: Error saving preferences shows alert
- TC-PROF-017: Error updating avatar shows alert
- TC-PROF-018: No user shows loading spinner

**Interaction Tests:**
- TC-PROF-019: Preferences saved immediately on change (no explicit save button)
- TC-PROF-020: "Saving..." text appears during preference update

### 1.10 Screen 10 -- Auth / Onboarding (AuthScreen)

**Happy Path:**
- TC-AUTH-001: Sign in with email and password
- TC-AUTH-002: Sign up with name, email, password, optional household name
- TC-AUTH-003: Google sign-in button works
- TC-AUTH-004: Toggle between sign in and sign up modes
- TC-AUTH-005: Forgot password sends reset email
- TC-AUTH-006: Household auto-created during sign up if name provided
- TC-AUTH-007: Value proposition cards shown in sign up mode only

**Edge Cases:**
- TC-AUTH-008: Empty email/password shows validation error
- TC-AUTH-009: Password under 6 characters shows validation error
- TC-AUTH-010: Empty name in sign up mode shows validation error
- TC-AUTH-011: Sign up without household name skips household creation
- TC-AUTH-012: Email with spaces handled (trim applied)
- TC-AUTH-013: Forgot password with empty email shows error

**Error Cases:**
- TC-AUTH-014: Firebase auth error (wrong password, user not found) displays
- TC-AUTH-015: Google sign-in failure (no play services) shows error
- TC-AUTH-016: Household creation failure during sign up is non-blocking
- TC-AUTH-017: Network offline during sign in shows error

**Interaction Tests:**
- TC-AUTH-018: Password visibility toggle works
- TC-AUTH-019: Loading state disables all buttons during auth
- TC-AUTH-020: Error clears when switching modes
- TC-AUTH-021: Keyboard avoiding view works on iOS

---

## 2. Integration Test Cases

### 2.1 Auth Flow
- TC-INT-001: Sign up -> auto-create household -> navigate to dashboard with household data
- TC-INT-002: Sign in -> fetch profile -> fetch household -> show dashboard
- TC-INT-003: Sign out -> return to auth screen -> sign in again
- TC-INT-004: Google sign in (new user) -> create profile -> navigate to dashboard
- TC-INT-005: Google sign in (existing user) -> load profile -> navigate to dashboard
- TC-INT-006: Auth state change listener updates app navigation (auth -> main, main -> auth)

### 2.2 Meal Logging Flow
- TC-INT-007: Add meal from dashboard -> meal appears in today's meals section
- TC-INT-008: Add meal from calendar -> meal appears in correct day/slot
- TC-INT-009: Add meal -> dish auto-added to dish library (NOT IMPLEMENTED -- see BUG-015)
- TC-INT-010: Add dine-out meal -> restaurant tracker updates
- TC-INT-011: Edit meal from calendar -> changes reflected
- TC-INT-012: Delete meal -> removed from calendar and history
- TC-INT-013: Add meal -> dashboard metrics update on refresh

### 2.3 Auto-Plan Flow
- TC-INT-014: Generate plan -> edit dishes -> accept -> meals saved to calendar
- TC-INT-015: Generate plan -> regenerate single day -> accept -> correct meals saved
- TC-INT-016: Accept plan -> navigate to Calendar tab -> see planned meals
- TC-INT-017: Plan avoids recently made dishes from meal history

### 2.4 Family Sharing
- TC-INT-018: Create household -> invite code generated -> share code
- TC-INT-019: Join household with invite code -> see shared meals
- TC-INT-020: Member adds meal -> other members see it on refresh
- TC-INT-021: Admin sees "Admin" role, member sees "Member" role

### 2.5 Dish Library Integration
- TC-INT-022: Log meals -> dishes appear in library (manual add only currently)
- TC-INT-023: Favorite a dish -> dish shows in favorites filter
- TC-INT-024: Dish not made in 30+ days -> shows in dashboard forgotten dishes
- TC-INT-025: Dish autocomplete in AddMeal pulls from dish library

### 2.6 Insights Integration
- TC-INT-026: Log home + dine-out meals -> insights show correct ratio
- TC-INT-027: Log meals with costs -> spending trend chart updates
- TC-INT-028: Log meals at multiple restaurants -> top restaurants ranked correctly

---

## 3. Bug Report

### Critical Bugs

```
**BUG-001**: [severity: critical]
File: src/stores/index.ts:1-5
Issue: Barrel export file re-exports from ambiguous duplicate stores. There are TWO
separate store files for each domain:
  - authStore.ts AND useAuthStore.ts (BOTH export `useAuthStore`)
  - mealStore.ts AND useMealStore.ts (BOTH export `useMealStore`)
  - dishStore.ts AND useDishStore.ts (BOTH export `useDishStore`)
  - householdStore.ts AND useHouseholdStore.ts (BOTH export `useHouseholdStore`)
  - insightStore.ts AND useInsightStore.ts (BOTH export `useInsightStore`)
Each pair has DIFFERENT interfaces, methods, and state shapes. Different screens import
from different files, so the app is using TWO SEPARATE ZUSTAND INSTANCES per domain.
State written to one store is invisible to screens reading from the other.
Fix: Consolidate each pair into a single store file. Remove duplicates. Update all imports.
```

```
**BUG-002**: [severity: critical]
File: src/screens/InsightsScreen.tsx:42
Issue: InsightsScreen imports `fetchMeals` from `useMealStore` (via stores/mealStore),
but the mealStore.ts version's `useMealStore` does NOT have a `fetchMeals` method. It has
`fetchMeals: (householdId, startDate, endDate)` defined in the mealStore.ts interface, but
the actual store in mealStore.ts defines different methods (fetchMeals matches the older
API shape). Meanwhile useMealStore.ts has `fetchMealsByDateRange`. The two stores have
incompatible APIs.
Fix: Unify stores and use consistent method names.
```

```
**BUG-003**: [severity: critical]
File: src/screens/PlanScreen.tsx:25-27
Issue: PlanScreen imports from `stores/dishStore`, `stores/mealStore`, and
`stores/householdStore` (the NON-use-prefixed versions). These stores have DIFFERENT
state shapes and methods than the ones used by other screens. For example:
- `householdStore` has `preferences` and `household` fields
- `useHouseholdStore` does NOT have `preferences`
- `mealStore`'s `useMealStore` has `addMeal` returning void
- `useMealStore`'s `useMealStore` has `addMeal` returning string
The Plan screen's `addMeal` call pattern matches mealStore.ts but not useMealStore.ts.
Fix: Consolidate to single store per domain.
```

```
**BUG-004**: [severity: critical]
File: src/navigation/AppNavigator.tsx:43-44,86-99
Issue: HomeScreen, CalendarScreen, AddMealScreen, PlanScreen, and InsightsScreen are all
BUILT but never registered in the navigator. The navigator uses `PlaceholderScreen`
(renders null) for HomeMain, Calendar, Plan, Insights, and AddMeal. The actual screen
components exist but are not wired up.
Fix: Import and register all screen components in AppNavigator.tsx.
```

### High Severity Bugs

```
**BUG-005**: [severity: high]
File: src/hooks/useAuth.ts:7-32
Issue: The `useAuth` hook imports from `stores/useAuthStore` (the non-auth-methods version
that has fetchUser/fetchPreferences/setUser/clear). But the useAuth hook calls `setUser`
which sets a plain User object. Meanwhile screens that use `stores/authStore` (the one with
signIn/signUp/signOut/isAuthenticated) are reading from a DIFFERENT store instance. The
auth state (`isAuthenticated`) is never set by the `useAuth` hook's listener, so the
navigator will never transition from Auth to Main screens.
Fix: Use a single auth store everywhere. The authStore.ts (with isAuthenticated) should be
the canonical one, and the onAuthStateChanged listener should update it.
```

```
**BUG-006**: [severity: high]
File: src/screens/CalendarScreen.tsx:74-93
Issue: When navigating to AddMeal for a new meal from an empty calendar cell, a full Meal
object is constructed with `id: ''`. In AddMealScreen, `isEditing` is computed as
`!!(existingMeal && existingMeal.id)`. Since `id: ''` is falsy, it will create a new meal
instead of editing -- this is actually correct behavior BUT the constructed meal object
includes `createdAt: new Date()` and `updatedAt: new Date()` which are not needed for new
meals and may cause confusion.
Fix: Pass only the needed pre-fill fields (date, mealType) rather than a full Meal shape.
```

```
**BUG-007**: [severity: high]
File: src/services/planner.ts:51-52
Issue: The planner algorithm uses `Math.random() < 0.6` for weekend dine-out decisions but
does NOT respect the `maxDineOutsPerWeek` preference. A 7-day plan could generate 0-2
weekend dine-outs randomly regardless of the configured limit.
Fix: Track dine-out count during plan generation and cap at maxDineOutsPerWeek.
```

```
**BUG-008**: [severity: high]
File: src/config/firebase.ts:8-14
Issue: Firebase config contains placeholder values ('YOUR_API_KEY', etc.). The app will
crash on startup when Firebase tries to initialize with these values.
Fix: Replace with actual Firebase project credentials or use environment variables.
```

```
**BUG-009**: [severity: high]
File: src/screens/PlanScreen.tsx:121-153
Issue: `acceptPlan` has no try/catch around the for loop of addMeal calls. If any single
meal fails to save, the function throws and remaining meals are lost. The finally block
sets isAccepting to false but the user gets no error feedback.
Fix: Add try/catch with error alert. Consider saving all meals or rolling back on failure.
```

### Medium Severity Bugs

```
**BUG-010**: [severity: medium]
File: src/screens/AddMealScreen.tsx:161-169
Issue: Date input is a plain TextInput accepting free text. There is no validation that the
entered date is a valid YYYY-MM-DD format. Users can type anything (e.g., "tomorrow",
"abc") and it will be saved to Firestore.
Fix: Use a date picker component (e.g., @react-native-community/datetimepicker) or add
date format validation before save.
```

```
**BUG-011**: [severity: medium]
File: src/screens/CalendarScreen.tsx:119-128
Issue: Auto-plan hardcodes `cuisineTag: 'Indian'` for all generated meals instead of using
the dish's actual cuisine tag from the dish library.
Fix: Use the dish's cuisineTag: `dishes.find(d => d.name === p.lunch.dishName)?.cuisineTag || 'Indian'`
```

```
**BUG-012**: [severity: medium]
File: src/screens/InsightsScreen.tsx:39-78
Issue: InsightsScreen has no error state UI. If data loading fails, the user sees either a
perpetual loading spinner or an empty screen with no way to retry.
Fix: Add error state handling similar to DishLibraryScreen (error message + retry button).
```

```
**BUG-013**: [severity: medium]
File: src/screens/InsightsScreen.tsx:88-106
Issue: `takeoutPercent` is calculated from raw `meals` array (which includes both current
and previous period meals since `fetchMeals` loads both). The calculation should only use
current period meals. Additionally, `dineOutPercent = 100 - home - takeout` can produce
negative numbers due to rounding.
Fix: Filter meals to current period only. Clamp dineOutPercent to Math.max(0, ...).
```

```
**BUG-014**: [severity: medium]
File: src/screens/HistoryScreen.tsx:149-154
Issue: `handleMealPress` is a no-op (empty function body). Tapping a meal entry in history
does nothing. The comment says "Navigate to AddMeal screen for editing" but no navigation
code is implemented.
Fix: Implement navigation: `navigation.getParent()?.getParent()?.navigate('AddMeal', { meal })`.
```

```
**BUG-015**: [severity: medium]
File: src/screens/AddMealScreen.tsx:80-118
Issue: When saving a new meal, the dish is NOT automatically added to or updated in the
dish library. The requirements state dishes should be auto-added to the library from meal
logging. The `incrementDishCount` and `addOrUpdateRestaurant` firestore functions exist but
are never called during meal save.
Fix: After saving a meal, call getDishByName, then either incrementDishCount or addDish,
and call addOrUpdateRestaurant for non-home meals.
```

```
**BUG-016**: [severity: medium]
File: src/screens/HomeScreen.tsx:28-29
Issue: HomeScreen calls `fetchMealsByDate` from useMealStore (the use-prefixed version)
which replaces the entire `meals` array with only today's meals. Other screens that read
from the same store will lose their loaded meals.
Fix: Either use a separate state field for today's meals, or use a selector pattern.
```

```
**BUG-017**: [severity: medium]
File: src/screens/RestaurantScreen.tsx:87-91
Issue: Restaurant time-range filtering compares `lastVisitDate >= startDate` as string
comparison. This works for ISO date strings but does not account for restaurants visited
multiple times -- it only checks the last visit date, not visit dates within the range.
A restaurant visited 10 times total but last visited outside the range would be excluded.
Fix: Either track per-visit dates or note this as a known limitation. The current
Restaurant type only stores aggregate data (totalVisits, totalSpend, lastVisitDate).
```

```
**BUG-018**: [severity: medium]
File: src/screens/AuthScreen.tsx:73-84
Issue: After `signUp` completes, the code calls `useAuthStore.getState()` to get the user.
But `signUp` in authStore.ts is async and sets the user in state. Due to the async gap, the
user might not be set yet when `getState()` is called, causing household creation to be
skipped silently.
Fix: Use the return value from signUp or await state update before reading user.
```

```
**BUG-019**: [severity: medium]
File: src/screens/ProfileScreen.tsx:90-93
Issue: The local `updatePreferences` function shadows the imported `updateUserPreferences`
from firestore. This is not a bug per se (it calls the imported function), but if
`useCallback` deps change, the stale `preferences` closure could cause preference values
to be overwritten incorrectly.
Fix: Rename the local function to avoid shadowing. Use functional state update.
```

### Low Severity Bugs

```
**BUG-020**: [severity: low]
File: src/screens/AddMealScreen.tsx:37-38
Issue: Default meal type is hardcoded to 'lunch'. Requirements specify smart defaults based
on time of day (before noon = lunch, after 5pm = dinner).
Fix: Add time-based default: `new Date().getHours() >= 17 ? 'dinner' : 'lunch'`.
```

```
**BUG-021**: [severity: low]
File: src/components/MealCard.tsx:13-19
Issue: `getDaysAgo` calculates days since the MEAL date, not days since the dish was last
cooked. For a meal planned in the future, this shows negative days or zero, which is
misleading. The requirement says "last made X days ago" which refers to the dish's history.
Fix: Pass lastCookedDate from the dish library instead of using the meal's own date.
```

```
**BUG-022**: [severity: low]
File: src/screens/DishLibraryScreen.tsx:97-98
Issue: "Last made" sort puts dishes with MOST days since last made at top (descending by
getDaysSince). This is counterintuitive -- "Last made" usually means most recently made
first.
Fix: Reverse sort order: `getDaysSince(a.lastCookedDate) - getDaysSince(b.lastCookedDate)`.
```

```
**BUG-023**: [severity: low]
File: src/screens/DishLibraryScreen.tsx:176
Issue: Tapping a dish row toggles favorite. The requirements say "Tap a dish to see full
detail: all dates it was made, notes, frequency chart." The star icon should toggle
favorite, but the whole row press handler is wired to toggleFavorite.
Fix: Separate the onPress for the star icon vs the row. Row press should navigate to dish
detail screen (not yet implemented).
```

```
**BUG-024**: [severity: low]
File: src/services/planner.ts:4-9
Issue: `generateMealPlan` function is synchronous but is called in PlanScreen as if it
might be async (in a try/finally). This works but the loading state flashes instantly since
there is no actual async work.
Fix: This is a UX concern. Consider wrapping in setTimeout or requestAnimationFrame for
perceived loading.
```

```
**BUG-025**: [severity: low]
File: src/screens/AuthScreen.tsx:121
Issue: Tagline says "Plan meals, not stress" but requirements say tagline should be
"Your family's meal memory."
Fix: Change to "Your family's meal memory".
```

```
**BUG-026**: [severity: low]
File: src/services/auth.ts:4-10
Issue: `react-native-image-picker` (used in AvatarPicker.tsx) uses `launchCamera` and
`launchImageLibrary` but the package is a native module that requires linking and
permissions setup (camera, photo library). No permissions are requested in the code.
Fix: Add permission requests using expo-image-picker instead, or add runtime permission
checks before calling camera/gallery.
```

```
**BUG-027**: [severity: low]
File: src/components/AvatarPicker.tsx:4
Issue: `react-native-image-picker` is imported but the Expo project should use
`expo-image-picker` instead, as react-native-image-picker requires native module linking
that conflicts with Expo managed workflow.
Fix: Replace with `import * as ImagePicker from 'expo-image-picker'`.
```

```
**BUG-028**: [severity: low]
File: package.json:18
Issue: Package depends on `@react-navigation/stack` but the code uses
`@react-navigation/native-stack` (createNativeStackNavigator). The stack package is
installed but unused; native-stack is used but not listed as a dependency.
Fix: Replace `@react-navigation/stack` with `@react-navigation/native-stack` in
package.json.
```

```
**BUG-029**: [severity: low]
File: src/screens/HistoryScreen.tsx:115-133
Issue: CSV export uses `Share.share()` which opens the system share sheet with raw text.
This is not a true CSV file download. On iOS, this will share as plain text, not a .csv
file. Requirements say "Downloads complete meal history as CSV file."
Fix: Use expo-file-system to write a .csv file, then use expo-sharing to share the file.
```

```
**BUG-030**: [severity: low]
File: src/screens/ProfileScreen.tsx:131-137
Issue: Avatar change calls `updateUserProfile` to save the URI, but does NOT upload the
image to Firebase Storage first. The local file URI will be invalid on other devices or
after app reinstall.
Fix: Call `uploadProfilePicture` from storage service first, then save the download URL.
```

---

## 4. Missing Test Infrastructure

### No test setup exists at all. The following must be created:

1. **Jest configuration**
   - `jest.config.js` or `jest.config.ts`
   - Add `jest` and `@testing-library/react-native` to devDependencies
   - Add `ts-jest` or `babel-jest` for TypeScript support
   - Configure module name mapper for path aliases

2. **Test setup file**
   - `jest.setup.ts` or `setupTests.ts`
   - Mock `firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/storage`
   - Mock `@react-native-google-signin/google-signin`
   - Mock `react-native-image-picker`
   - Mock `@react-navigation/native` and navigation hooks
   - Mock `react-native-chart-kit` (uses native SVG)
   - Mock `@expo/vector-icons/MaterialCommunityIcons`
   - Mock `react-native-paper` or provide PaperProvider wrapper

3. **Test utilities**
   - `src/test/utils.tsx` -- render wrapper with providers (PaperProvider, NavigationContainer)
   - `src/test/factories.ts` -- factory functions for creating test data (Meal, Dish, User, Household, etc.)
   - `src/test/mocks/firestore.ts` -- mock implementations for all firestore service functions
   - `src/test/mocks/auth.ts` -- mock implementations for auth service functions
   - `src/test/mocks/stores.ts` -- mock Zustand stores for component tests

4. **Missing devDependencies**
   - `jest` / `jest-expo`
   - `@testing-library/react-native`
   - `@testing-library/jest-native`
   - `@types/jest`
   - `ts-jest` or `babel-jest`
   - `react-test-renderer`

5. **Missing test scripts in package.json**
   - `"test": "jest"`
   - `"test:watch": "jest --watch"`
   - `"test:coverage": "jest --coverage"`

6. **No CI/CD pipeline**
   - No `.github/workflows` or similar CI config
   - No pre-commit hooks for running tests
   - No ESLint or Prettier configuration for code quality

---

## Summary

| Category | Count |
|----------|-------|
| Total test cases | 148 |
| Integration test cases | 28 |
| Critical bugs | 4 |
| High bugs | 5 |
| Medium bugs | 10 |
| Low bugs | 11 |
| Total bugs | 30 |

### Top Priority Issues (must fix before any testing is possible):
1. **BUG-001/002/003**: Duplicate Zustand stores -- the entire app has split-brain state
2. **BUG-004**: Screens built but not wired into navigator
3. **BUG-005**: Auth state listener does not update the store used by navigator
4. **BUG-008**: Firebase placeholder credentials prevent app from running
