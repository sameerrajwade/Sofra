# ThaliPlan Deep QA Audit

**Date:** 2026-06-27
**Auditor:** PM + UX Quality Team (automated deep read)
**Scope:** All 10 screens, 5 stores, firestore service, navigation, App.tsx

---

## P0 -- App Broken / Data Loss

### 1. Household creation on sign-up does NOT update local auth state
- **File:** `src/screens/AuthScreen.tsx` lines 73-84
- **What's wrong:** After `signUp()` completes, if the user typed a household name, `createHousehold()` is called (which writes `householdId` to Firestore on the user doc via `firestore.ts` line 219). But the local `useAuthStore` user object still has `householdId: null` (set at line 80 of `useAuthStore.ts`). The app immediately lands on HomeScreen which checks `householdId` (line 81) and shows "Please set up your household first" -- even though the household was just created in Firestore. The user is stuck until they force-quit and relaunch.
- **Fix:** After `createHousehold()` succeeds, re-fetch the user profile or manually set `user.householdId` in the store.
- **Why missed:** Reviewers tested sign-in (existing user with household) not fresh sign-up with household name.

### 2. `createHousehold` in householdStore does NOT update authStore.user.householdId
- **File:** `src/stores/useHouseholdStore.ts` lines 28-42
- **What's wrong:** `createHousehold` writes `householdId` to Firestore user doc (firestore.ts line 219), stores the household object locally in householdStore, but never updates `useAuthStore.user.householdId`. Every screen that gates on `user?.householdId` (Home, Calendar, AddMeal, History) remains broken until auth state is refreshed externally.
- **Fix:** After creating/joining a household, also call `useAuthStore.getState().setUser({...user, householdId: id})`.
- **Why missed:** The stores are reviewed in isolation; cross-store sync is easy to overlook.

### 3. Duplicate auth listener creates race condition
- **File:** `App.tsx` lines 29-48 and `src/hooks/useAuth.ts` lines 9-28
- **What's wrong:** `App.tsx` registers an `onAuthStateChanged` listener AND `AppNavigator.tsx` calls `useAuth()` which registers a SECOND listener. Both run `getUserProfile` and call `setUser`. On sign-in, two async profile fetches race. If the slower one resolves with stale data (or the user doc hasn't propagated yet), it can overwrite the correct state.
- **Fix:** Remove the listener from either App.tsx or useAuth.ts. Keep one source of truth.
- **Why missed:** Each file looks correct in isolation. The duplication only causes issues under network latency.

### 4. HistoryScreen never fetches initial data
- **File:** `src/screens/HistoryScreen.tsx` (entire file)
- **What's wrong:** There is no `useEffect` to load meals on mount. The screen relies on meals already being in the `useMealStore` from other screens. If the user navigates directly to History tab before visiting Home or Calendar, they see an empty list with no loading indicator. `handleLoadMore` (line 141) is only triggered by `onEndReached` of SectionList, which never fires on an empty list.
- **Fix:** Add a `useEffect` on mount that calls `fetchMealsByDateRange` for the initial 3-month window.
- **Why missed:** Testers always visited Home first, which populated the meal store.

### 5. InsightsScreen useEffect missing `loadData` dependency
- **File:** `src/screens/InsightsScreen.tsx` line 62
- **What's wrong:** `useEffect(() => { loadData(); }, [timeRange])` -- the effect depends on `loadData` but only lists `timeRange` in deps. On first render, if `household` is null (hasn't loaded yet), `loadData` returns early. When `household` later populates, this effect does NOT re-run because `timeRange` hasn't changed. Result: Insights screen shows empty state forever until user manually changes the time range chip.
- **Fix:** Change deps to `[loadData]` (which already captures `timeRange` and `household` via useCallback).
- **Why missed:** Household was already cached in store during review testing.

### 6. Meals store overwrites all meals on each fetch
- **File:** `src/stores/useMealStore.ts` lines 33-39, 42-49, 52-59
- **What's wrong:** Every fetch method does `set({ meals, isLoading: false })` which replaces the entire meals array. HomeScreen fetches meals for today only (line 42). When user navigates to Calendar (which fetches a week), today's single-day fetch results are blown away. When they go back to Home, the meals array now contains the week's data, not re-fetched for today. History's `handleLoadMore` replaces rather than appends. This causes data to appear and disappear as the user navigates.
- **Fix:** Either merge meals by ID (deduplicate), or scope fetches to not clobber unrelated data. Consider a Map keyed by meal ID.
- **Why missed:** Each screen works correctly in isolation. The cross-screen navigation pattern exposes the overwrite.

---

## P1 -- Major UX Friction

### 7. Adding a meal does NOT update dish statistics (timesCooked, lastCookedDate)
- **File:** `src/stores/useMealStore.ts` lines 72-91, `src/services/firestore.ts`
- **What's wrong:** When a meal is saved, `addMeal` writes to Firestore meals collection but never calls `incrementDishCount()` (firestore.ts line 153). The dish's `timesCooked` and `lastCookedDate` never update. "Forgotten dishes" on HomeScreen, dish sorting in DishLibrary, and plan generation all rely on stale data.
- **Fix:** After successfully adding a meal, look up the dish by name and call `incrementDishCount`. Also update the local dish store.
- **Why missed:** The `incrementDishCount` function exists in firestore.ts but is never imported or called anywhere.

### 8. Adding a meal does NOT create/update restaurant records
- **File:** `src/stores/useMealStore.ts` lines 72-91
- **What's wrong:** `addOrUpdateRestaurant` exists in firestore.ts (line 167) but is never called. When a user logs a dine-out meal with a restaurant name, it never appears on the RestaurantScreen. The restaurant tracker is completely non-functional.
- **Fix:** In `addMeal`, when `sourceType !== 'home'` and `restaurantName` is provided, call `addOrUpdateRestaurant`.
- **Why missed:** RestaurantScreen has its own `getRestaurants` fetch, so it looks like it should work. But nothing populates the collection.

### 9. DishLibraryScreen never loads dishes on mount
- **File:** `src/screens/DishLibraryScreen.tsx` (entire file)
- **What's wrong:** There is no `useEffect` to call `fetchDishes(householdId)` on mount. The screen only gets dishes if they were previously loaded by HomeScreen or AddMealScreen. If user navigates to DishLibrary tab directly (via HomeStack), they see the loading spinner or empty state.
- **Fix:** Add `useEffect(() => { if (householdId) fetchDishes(householdId); }, [householdId])`.
- **Why missed:** HomeScreen loads dishes on mount, so they were always cached during testing.

### 10. ProfileScreen preferences saved to Firestore but NOT synced to householdStore
- **File:** `src/screens/ProfileScreen.tsx` lines 91-106
- **What's wrong:** `updatePreferences` calls `updateUserPreferences` (direct Firestore write) and updates local component state, but never updates `useHouseholdStore.preferences`. The rest of the app (HomeScreen currency symbol, PlanScreen planning rules, CalendarScreen auto-plan) continues using the old preferences until a full app restart.
- **Fix:** Call `useHouseholdStore.getState().updatePreferences(user.id, partial)` instead of the direct Firestore call, or sync both.
- **Why missed:** ProfileScreen uses its own local state for preferences, separate from the store. Reviewers saw the save succeed and assumed it propagated.

### 11. CalendarScreen auto-plan uses hardcoded preferences instead of user's
- **File:** `src/screens/CalendarScreen.tsx` lines 117-129
- **What's wrong:** `generateMealPlan` is called with hardcoded preferences object `{ defaultMeals: ['lunch', 'dinner'], monthlyDineOutBudget: 200, ... currency: 'USD' }` instead of the user's saved preferences from the store. The user's currency, budget, rotation days, and max dine-outs settings are all ignored.
- **Fix:** Read preferences from `useHouseholdStore` and pass them to `generateMealPlan`.
- **Why missed:** The hardcoded values happen to be reasonable defaults so the feature "works" -- just not with user settings.

### 12. PlanScreen `defaultPrefs` uses stale reference in generate callback
- **File:** `src/screens/PlanScreen.tsx` lines 48-56, 58-72
- **What's wrong:** `defaultPrefs` is computed on every render (not memoized), then captured in `generate` useCallback. But `generate`'s deps include `defaultPrefs` -- since it's a new object each render, `generate` is recreated every render, defeating memoization. More critically, `useEffect` at line 74 only depends on `dishes.length`, not `generate`, so if preferences change after initial load, the plan isn't regenerated.
- **Fix:** Memoize `defaultPrefs` with `useMemo`, and include `generate` in the useEffect deps (or better, let user explicitly trigger regeneration).
- **Why missed:** Functional but wasteful; the stale closure doesn't cause visible errors on first use.

### 13. PlanScreen `acceptPlan` doesn't check for duplicate meals
- **File:** `src/screens/PlanScreen.tsx` lines 120-152
- **What's wrong:** If user accepts a plan, navigates to Calendar, comes back, and accepts again, duplicate meals are created for the same date/mealType slots. There's no check whether a meal already exists for that date+mealType.
- **Fix:** Before adding each meal, check if one already exists for that date+mealType. Skip or update instead of creating duplicates.
- **Why missed:** Reviewers accepted the plan once and moved on.

### 14. HomeScreen navigation to DishLibrary, Restaurants, History is impossible
- **File:** `src/screens/HomeScreen.tsx` (entire file), `src/navigation/AppNavigator.tsx` lines 43-64
- **What's wrong:** DishLibrary, Restaurants, and History are registered as HomeStack screens (lines 49-63 of AppNavigator) but HomeScreen has no buttons or links to navigate to them. There is no menu, drawer, or navigation action that takes the user to these screens. They are dead screens accessible only if another screen navigates there (none do via HomeStack).
- **Fix:** Add navigation buttons/cards on HomeScreen for "Dish Library", "Restaurants", and "History". Or move them to the tab bar.
- **Why missed:** Reviewers assumed these screens were accessible from the tab bar, but they're nested under HomeStack with no entry point.

### 15. CalendarScreen navigates to AddMeal with a fake meal object for empty slots
- **File:** `src/screens/CalendarScreen.tsx` lines 76-90
- **What's wrong:** When tapping an empty slot, the code navigates to AddMeal with `meal: { id: '', ... }`. In AddMealScreen, `isEditing` is `!!(existingMeal && existingMeal.id)` (line 42). Since `id` is empty string (falsy), `isEditing` is false, which is correct. However, the meal object pre-fills all fields including `dishName: ''`, which means the form appears to be in "edit" mode visually (date, mealType pre-filled) but is actually creating. This is confusing but technically works. The bigger issue: `createdAt` and `updatedAt` are set to `new Date()` objects -- these are not Firestore Timestamps and may cause type mismatches downstream.
- **Fix:** Pass only `{ date, mealType }` as route params, not a full fake meal object.
- **Why missed:** The form renders correctly because falsy `id` triggers create mode, masking the conceptual confusion.

---

## P1 -- Missing Safety / Confirmation

### 16. No confirmation dialog before accepting a meal plan
- **File:** `src/screens/PlanScreen.tsx` line 306 (`acceptPlan`)
- **What's wrong:** Accepting a plan creates 14 meals (7 days x lunch + dinner) with a single tap and no confirmation. If tapped accidentally, user must delete each meal individually.
- **Fix:** Add `Alert.alert('Accept Plan', 'This will add 14 meals to your calendar. Continue?', ...)`.
- **Why missed:** Reviewers saw it as a positive action, not a destructive one. But 14 writes is significant.

### 17. No "are you sure" on sign out -- wait, this IS handled
- **File:** `src/screens/ProfileScreen.tsx` lines 142-147
- **Note:** Sign out confirmation IS implemented. Good.

---

## P1 -- Empty State / First-Time User Issues

### 18. New user with no household sees unhelpful dead-end on every tab
- **File:** `src/screens/HomeScreen.tsx` line 83, `src/screens/CalendarScreen.tsx` line 173
- **What's wrong:** Both screens show "Please set up your household first" with no button to actually set one up. The user must discover that Profile tab (which doesn't say "Set up household" in the tab bar) has the household section -- and even then, ProfileScreen only shows "No household set up" (line 215) with no create/join action.
- **Fix:** Add a "Create Household" or "Join Household" CTA on the empty state screens. Or add a proper onboarding flow.
- **Why missed:** Reviewers tested with pre-existing household data.

### 19. RestaurantScreen has no empty-state CTA and no way to add restaurants manually
- **File:** `src/screens/RestaurantScreen.tsx` lines 259-266
- **What's wrong:** Empty state says "Log a dine-out or takeout meal to start tracking" but doesn't provide a button to do so. And per bug #8, logging meals doesn't actually populate restaurants anyway.
- **Fix:** Add a FAB or button that navigates to AddMeal. Also fix bug #8.
- **Why missed:** Screen was reviewed visually, not functionally.

---

## P2 -- Minor Polish / UX

### 20. DishLibraryScreen tapping a dish row toggles favorite (confusing interaction)
- **File:** `src/screens/DishLibraryScreen.tsx` lines 172-209
- **What's wrong:** The entire dish row's `onPress` handler calls `toggleFavorite`. Users expect tapping a dish to open details or edit it, not toggle favorite status. The star icon also has no separate press handler. This is a UX mismatch.
- **Fix:** Make the star icon its own `TouchableOpacity` for toggling favorite. Make the row press open a dish detail/edit dialog.
- **Why missed:** Behavior is intentional but unconventional. Reviewers noted "tap works" without considering user expectations.

### 21. AddMealScreen shows Restaurant/Cost fields even when source is "home" (just disabled)
- **File:** `src/screens/AddMealScreen.tsx` lines 287-314
- **What's wrong:** When `sourceType === 'home'`, the Restaurant and Cost fields are visible but disabled (grayed out). This adds visual noise. For home-cooked meals (the majority use case), these fields are irrelevant clutter.
- **Fix:** Conditionally render these fields only when `sourceType !== 'home'`.
- **Why missed:** Technically correct (disabled = can't interact), but poor UX that wastes screen space.

### 22. HomeScreen `today` variable recomputed but stale across midnight
- **File:** `src/screens/HomeScreen.tsx` line 36
- **What's wrong:** `const today = format(new Date(), 'yyyy-MM-dd')` is computed once on render. If the app stays open past midnight, `today` is stale until the component re-renders. The `loadData` useCallback includes `today` in deps, but since `today` is a `const` from render scope, it won't change until a re-render is triggered.
- **Fix:** This is minor -- pull-to-refresh will fix it. But for correctness, consider a timer or app state change listener.
- **Why missed:** Edge case that only manifests if the app is open at midnight.

### 23. HistoryScreen only shows Lunch and Dinner in day groups
- **File:** `src/screens/HistoryScreen.tsx` lines 197-198
- **What's wrong:** `renderDayGroup` only extracts `lunch` and `dinner` meals. Breakfast and snack meals (which the app supports per MealTypeToggle) are silently dropped from history view.
- **Fix:** Show all meal types, or at least show breakfast/snack if they exist.
- **Why missed:** Most test data was lunch/dinner only.

### 24. InsightsScreen `fetchMeals` does not exist on useMealStore
- **File:** `src/screens/InsightsScreen.tsx` line 42
- **What's wrong:** The code destructures `fetchMeals` from `useMealStore()`. Looking at `useMealStore.ts`, this method exists (line 32) and delegates to `getMealsByDateRange`. However, it overwrites the meals array (bug #6). When InsightsScreen loads data, it replaces all meals in the store with the double-period range needed for insights comparison, breaking other screens' data.
- **Fix:** InsightsScreen should use its own fetch (via `useInsightStore.fetchInsights`) which already does this independently, or use a separate state slice.
- **Why missed:** This is a consequence of bug #6; reviewing InsightsScreen alone, the call looks correct.

### 25. ProfileScreen budget input fires Firestore write on EVERY keystroke
- **File:** `src/screens/ProfileScreen.tsx` lines 243-250
- **What's wrong:** `onChangeText` calls `updatePreferences({ monthlyDineOutBudget: num })` which immediately writes to Firestore. Typing "5000" fires 4 writes (5, 50, 500, 5000). This is wasteful and could hit rate limits.
- **Fix:** Debounce the Firestore write, or save on blur/submit instead of on every character.
- **Why missed:** Works correctly in testing with small numbers. Cost/rate-limit impact only visible at scale.

### 26. AddMealScreen date picker has no "Today" quick-select button
- **File:** `src/screens/AddMealScreen.tsx` lines 213-262
- **What's wrong:** The custom calendar picker requires navigating months to find today. There's no quick "Today" button. Since most meals are logged for today, this adds unnecessary friction.
- **Fix:** Add a "Today" button in the modal header.
- **Why missed:** Default date is already today on new meals, so the picker is rarely needed. But when editing old meals, getting back to today is tedious.

### 27. `useAuth` hook subscribes to entire store causing unnecessary re-renders
- **File:** `src/hooks/useAuth.ts` line 7
- **What's wrong:** `const store = useAuthStore()` subscribes to ALL state changes in the auth store (loading, error, user, preferences). `AppNavigator` only needs `isAuthenticated` but re-renders on every loading state change.
- **Fix:** Use selector: `const isAuthenticated = useAuthStore(s => s.isAuthenticated)`.
- **Why missed:** Performance issue, not a functional bug. Only noticeable with profiling.

### 28. CalendarScreen `handleCellPress` navigates to root `AddMeal` but uses wrong navigator method
- **File:** `src/screens/CalendarScreen.tsx` lines 71-93
- **What's wrong:** `navigation.navigate('AddMeal', ...)` works because CalendarScreen is a direct Tab child under RootStack, so `navigate` can reach the root-level `AddMeal` screen. But HomeScreen (nested in HomeStack) uses `navigation.getParent()?.getParent()?.navigate('AddMeal')` (line 71). This inconsistency means one could break without the other if navigation structure changes. The HomeScreen approach is also fragile -- it assumes exactly 2 levels of nesting.
- **Fix:** Use `navigation.navigate('AddMeal')` consistently, or use a `useNavigation<RootStackNavigationProp>()` typed hook.
- **Why missed:** Both approaches work currently; the fragility is latent.

### 29. PlanScreen navigation after accept uses type assertion
- **File:** `src/screens/PlanScreen.tsx` line 148
- **What's wrong:** `navigation.navigate('Calendar' as any)` uses `as any` type cast. If the tab name changes, this silently breaks at runtime with no compile-time error.
- **Fix:** Use proper typed navigation: `navigation.getParent()?.navigate('Calendar')`.
- **Why missed:** TypeScript `as any` suppresses the error; reviewers grep for errors, not casts.

### 30. HomeScreen FlatList inside ScrollView (nested scrolling)
- **File:** `src/screens/HomeScreen.tsx` lines 174-193
- **What's wrong:** `FlatList` (forgottenDishes) is inside a `ScrollView`. While `scrollEnabled={false}` is set on the FlatList, this defeats virtualization -- all items render at once. With 10 items max this is fine, but the pattern is a React Native anti-pattern.
- **Fix:** Use a `map()` instead of FlatList since scrolling is disabled and items are capped at 10.
- **Why missed:** Works correctly; only a code-quality concern at current scale.

---

## Summary

| Severity | Count | Key Themes |
|----------|-------|------------|
| P0       | 6     | Cross-store sync, overwriting data, missing initial fetches, race conditions |
| P1       | 7     | Dead features (restaurants, dish stats), unreachable screens, hardcoded prefs |
| P2       | 11    | UX friction, performance, type safety, edge cases |

**Root cause pattern:** The app was built screen-by-screen with stores that appear independent but share the same Zustand state. Cross-screen navigation reveals data overwrites (bug #6), and cross-store operations (household creation, meal logging side effects) were never wired up. Previous reviewers tested each screen in isolation on pre-seeded data, missing the integration failures a real user hits in their first 3 minutes.
