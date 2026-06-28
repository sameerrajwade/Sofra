# TEST_RESULTS_SCREENS.md
## Test Agent 3 of 3 -- Dashboard, Insights, Dish Library, Restaurant Tracker, Cross-screen Data Flow

---

### Dashboard (HomeScreen)

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | Shows 4 metric cards with correct data | PASS | Home Cooked %, Dine Outs, Unique Dishes, Outside Spend all rendered from `insights` object (lines 102-138). |
| 2 | Home cooked % calculated correctly | PASS | `computeInsights` calculates `homeCooked / total * 100` rounded (insights.ts:13). |
| 3 | Dine-out count matches actual dine-out meals | PASS | Filters `sourceType === 'dineout'` correctly (insights.ts:20). |
| 4 | Unique dishes count is accurate | PASS | Uses `new Set(meals.map(m => m.dishName)).size` (insights.ts:26). |
| 5 | Outside spend sums all takeout + dineout costs | PASS | Filters `sourceType !== 'home'` and sums `m.cost || 0` (insights.ts:29-30). |
| 6 | Trends compare to previous month correctly | PASS | `homeCookedTrend` is diff of percentages; `outsideSpendingTrend` is % change (insights.ts:17,36-40). |
| 7 | Today's meals section shows current day's lunch/dinner | PASS | Filters meals by `date === today && mealType === 'lunch'/'dinner'` (HomeScreen:52-56). |
| 8 | "Dishes you haven't made in a while" sorted by longest-ago first | PASS | Sorts `bDays - aDays` (descending days), takes top 10 (HomeScreen:58-68). |
| 9 | Tapping forgotten dishes section navigates to DishLibrary | PASS | `navigation.navigate('DishLibrary')` on TouchableOpacity (HomeScreen:171). |
| 10 | "View all restaurants" navigates to Restaurants | PASS | `navigation.navigate('Restaurants')` (HomeScreen:201). |
| 11 | "View history" navigates to History | PASS | `navigation.navigate('History')` (HomeScreen:207). |
| 12 | Pull-to-refresh reloads data | PASS | RefreshControl with `onRefresh={loadData}` which re-fetches meals, dishes, insights (HomeScreen:92-96). |
| 13 | FAB button opens AddMeal screen | PASS | `navigation.getParent()?.getParent()?.navigate('AddMeal')` (HomeScreen:71, 215-220). |
| 14 | Empty state when no meals logged | ISSUE | **Partial.** When `insights` is null AND not loading, shows "No insights available yet." (line 140). But Today's Meals section still renders with "No lunch/dinner planned" placeholders, and no overarching "Welcome, log your first meal" empty state. The forgotten dishes section is correctly hidden (length check). **Not a bug per se** -- each subsection handles its empty case -- but there is no single cohesive empty state message when the user has zero meals. |

**Fix for #14:** Add a check `if (!insights && meals.length === 0 && !isLoading)` to show a dedicated welcome/onboarding empty state before the metrics grid, today's meals, etc.

---

### Insights (InsightsScreen)

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 15 | Time range selector (week/month/3mo/6mo) changes data | PASS | `setTimeRange` triggers `useEffect` that calls `loadData` and `computeFromMeals` with filtered meals (InsightsScreen:61-75). |
| 16 | Home vs outside ratio bar correct percentages, totals 100% | ISSUE | **The three percentages may not sum to exactly 100%.** `homeCookedPercent` comes from `computeInsights` (rounded). `takeoutPercent` is recalculated locally in InsightsScreen (lines 91-106) by filtering meals again. `dineOutPercent = 100 - homeCookedPercent - takeoutPercent` (line 108). The problem: `homeCookedPercent` is rounded in `computeInsights`, and `takeoutPercent` is independently rounded with `Math.round` in InsightsScreen. Two independent rounds can cause the three to sum to 99 or 101. Example: 3 home, 2 takeout, 2 dineout = 43% + 29% + 28% = 100 (ok), but 1 home, 1 takeout, 1 dineout = 33% + 33% + dineOut=34% which works. Edge: 2 home, 1 takeout, 0 dineout = 67% + 33% + 0% = 100. Rounding errors are possible with certain distributions. Additionally, `dineOutPercent` can go negative if rounding pushes home+takeout over 100. |
| 17 | Top restaurants sorted by visit count | PASS | `computeInsights` sorts by `b.visits - a.visits` (insights.ts:55). |
| 18 | Alert when restaurant over-visited | PASS | Shows alert when `topRestaurants[0]?.visits >= 5` (InsightsScreen:247). |
| 19 | Cuisine variety bars correct percentages | PASS | `cuisineBreakdown` computed as `count/total*100` rounded per cuisine (insights.ts:63-68). |
| 20 | Spending trend chart shows monthly data points | PASS | `monthlySpending` aggregated by YYYY-MM, sorted chronologically, rendered via LineChart (InsightsScreen:289-314). |
| 21 | Most cooked dishes top 3 with correct counts | PASS | `mostCookedDishes` sliced to 3 in render (InsightsScreen:321). Only counts home meals (insights.ts:72). |
| 22 | Insights load on screen mount | PASS | `useEffect(() => { loadData(); }, [loadData])` (InsightsScreen:61-63). |
| 23 | Currency symbol matches user preference (not hardcoded $) | ISSUE | **Partial.** The spending trend chart uses `currencySymbol` for `yAxisLabel` (line 297) -- PASS. But the "Outside Spend" MetricCard icon is hardcoded to `"currency-usd"` in HomeScreen:131 regardless of the user's currency preference. If user is using INR, the icon still shows a dollar sign. |

**Fix for #16:** Compute all three percentages from the same source in a single pass, then adjust the largest to force the sum to exactly 100. Or compute takeout% and dineout% inside `computeInsights` alongside `homeCookedPercent` and return them as part of InsightData.

**Fix for #23:** In HomeScreen line 131, change icon from hardcoded `"currency-usd"` to a dynamic icon based on currency preference, e.g.:
```tsx
const currencyIcon = preferences?.currency === 'INR' ? 'currency-inr' :
  preferences?.currency === 'EUR' ? 'currency-eur' :
  preferences?.currency === 'GBP' ? 'currency-gbp' :
  preferences?.currency === 'JPY' ? 'currency-jpy' : 'currency-usd';
```
Apply same fix in RestaurantScreen MetricCard for "Total Spend" (line 220).

---

### Dish Library (DishLibraryScreen)

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 24 | Shows all dishes from household | PASS | `fetchDishes(householdId)` on mount, renders via FlatList (DishLibraryScreen:52-54). |
| 25 | Search filters by name | PASS | Filters by `name`, `cuisineTag`, and `categoryTags` (DishLibraryScreen:76-84). |
| 26 | Cuisine filter works | PASS | Menu with unique cuisines, filters `d.cuisineTag === cuisineFilter` (DishLibraryScreen:87-89). |
| 27 | Sort by last made / most made / A-Z / favorites | PASS | All four sort modes implemented correctly (DishLibraryScreen:99-112). |
| 28 | Quick filter: Favorites shows only favorited | PASS | `result.filter(d => d.isFavorite)` (DishLibraryScreen:93). |
| 29 | Quick filter: 30+ days shows only dishes not made in 30+ days | PASS | `getDaysSince(d.lastCookedDate) >= 30` (DishLibraryScreen:95). |
| 30 | Favorite toggle -- star turns yellow/gray, persists | ISSUE | **UX problem.** Tapping a dish row calls `toggleFavorite` (DishLibraryScreen:178), which calls `updateDish` then re-fetches all dishes. This works for persistence, but the entire row's `onPress` is the favorite toggle -- there is no way to tap a dish to view/edit its details. The star icon visually toggles (yellow via `Colors.warning` when favorite, muted when not). The toggle itself PASS for persistence via Firestore `updateDish`. |
| 31 | Each dish shows: name, cuisine tag, category, days since last made, total times | PASS | All fields rendered: name (line 189), cuisineTag chip (line 193), categoryTags (line 199), days ago (line 207-209), timesCooked (line 210). |
| 32 | Dishes load on screen mount | PASS | `useEffect` calls `fetchDishes` (DishLibraryScreen:52-54). |
| 33 | "Add dish" button allows manual dish creation | PASS | FAB opens dialog with name, cuisine, category tags, favorite toggle; calls `addDish` (DishLibraryScreen:137-163, 359-413). |

**Fix for #30:** Separate the favorite toggle from the row press. Make the star icon its own `TouchableOpacity` with `onPress={() => toggleFavorite(item)}`, and make the row `onPress` navigate to a dish detail/edit screen (or do nothing).

---

### Restaurant Tracker (RestaurantScreen)

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 34 | Shows summary metrics (total spend, visits, unique places) | PASS | Three MetricCards rendered (RestaurantScreen:217-241). |
| 35 | Restaurant list sorted by visits | PASS | `sortedRestaurants` sorts by `b.totalVisits - a.totalVisits` (RestaurantScreen:98-100). |
| 36 | Each row shows: name, cuisine, visits, spend, last visit | PASS | All fields rendered in `renderRestaurant` (RestaurantScreen:119-161). |
| 37 | "Frequent" badge on over-visited restaurants | PASS | Shows when `item.totalVisits > 4` (RestaurantScreen:122). |
| 38 | Exploration nudge banner when visits concentrated | PASS | Shows when top 2 restaurants have >60% of total visits (RestaurantScreen:113-117). |
| 39 | Time range filter works | ISSUE | **Filtering is incorrect.** `filteredRestaurants` filters by `r.lastVisitDate >= startDate` (RestaurantScreen:95). This filters based on the restaurant's *last* visit date, not whether the restaurant had visits *within* the range. A restaurant visited 20 times in January but last visited in January would be excluded from a "This month" filter in June, but a restaurant visited once in June would be included. The `totalVisits` and `totalSpend` are all-time aggregates stored on the restaurant doc, not recalculated per time range. So the metrics shown are **all-time numbers** even when a time range filter is applied. |
| 40 | Data loads on screen mount | PASS | `useEffect(() => { fetchData(); }, [fetchData])` (RestaurantScreen:82-84). |
| 41 | Currency symbol matches preference | PASS | Uses `getCurrencySymbol(preferences?.currency ?? 'USD')` (RestaurantScreen:60). But see #23 about hardcoded icon. |

**Fix for #39:** The restaurant tracker needs per-visit data to properly filter by time range. Options:
1. **Best:** Compute restaurant stats from meals in the meal store filtered by date range, rather than from the pre-aggregated restaurant documents.
2. **Quick fix:** Remove the time range filter or clarify that "Total Spend" and "Total Visits" are always all-time figures, and the time range only controls which restaurants are shown (those active within the range).

---

### Cross-screen Data Flow

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 42 | Add home meal -> dashboard home% updates, dish library timesCooked updates | ISSUE | **Partial.** `addMeal` in useMealStore calls `incrementDishCount` fire-and-forget (useMealStore:102-110), which updates Firestore. However, the **local** dish store is NOT updated -- it requires a `fetchDishes` call to see the new `timesCooked`. The dashboard uses `useInsightStore` which fetches from Firestore, so it will reflect changes on next fetch. But if user adds a meal and immediately navigates to Dish Library without pull-to-refresh, the timesCooked will be stale. |
| 43 | Add dineout meal -> dashboard dine-out count updates, restaurant tracker updates, spend updates | ISSUE | **Similar staleness.** `addMeal` calls `addOrUpdateRestaurant` fire-and-forget (useMealStore:113-126). Restaurant store in RestaurantScreen uses local state (`useState`) not a shared Zustand store, so it won't reflect the new restaurant until `fetchData` is called again. Dashboard insights also need a re-fetch. |
| 44 | Edit a meal -> changes reflect everywhere | ISSUE | **`updateMeal` does NOT update dish stats or restaurant stats.** Only `addMeal` has the side-effect logic for `incrementDishCount` and `addOrUpdateRestaurant`. If a user changes a meal's dish name or restaurant, the old dish/restaurant stats are not decremented and the new ones are not incremented. |
| 45 | Delete a meal -> removed from calendar, history, stats recalculate | ISSUE | **`deleteMeal` does NOT decrement dish counts or restaurant stats.** The meal is removed from the local Zustand array and deleted from Firestore, but `timesCooked`, `lastCookedDate` on Dish, and `totalVisits`/`totalSpend` on Restaurant are not adjusted. Stats become permanently inflated. |
| 46 | Change currency in profile -> all screens reflect new symbol | PASS | All screens read `preferences?.currency` from `useHouseholdStore` and call `getCurrencySymbol`. Currency change via `updatePreferences` updates the store, and all screens will pick up the new value on next render. |
| 47 | Data persists across screen navigation | PASS | Zustand stores persist in memory across tab switches. Only RestaurantScreen uses local `useState` (which loses data on unmount), but React Navigation keeps screens mounted by default. |

**Fix for #42/#43:** After `incrementDishCount` and `addOrUpdateRestaurant` succeed, dispatch updates to the local Zustand stores (dishStore, or add a restaurantStore) so the UI reflects changes immediately without requiring a re-fetch.

**Fix for #44:** In `updateMeal`, detect changes to `dishName`, `restaurantName`, `cost`, `sourceType` and:
- Decrement old dish's `timesCooked` if dish name changed
- Decrement old restaurant's visits/spend if restaurant changed
- Increment new dish/restaurant accordingly

**Fix for #45:** In `deleteMeal`, before deleting:
- Look up the meal's dish and decrement `timesCooked` (and recalculate `lastCookedDate`)
- Look up the meal's restaurant and decrement `totalVisits` / `totalSpend`

---

### Edge Cases

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 48 | No meals at all -- all screens show appropriate empty states | ISSUE | **Partial.** InsightsScreen: shows empty state with icon + text (line 338-345) -- PASS. DishLibraryScreen: shows "No dishes found" empty component -- PASS. RestaurantScreen: shows "No restaurant visits yet" -- PASS. HomeScreen: shows "No insights available yet" for metrics and "No lunch/dinner planned" for today, but no cohesive empty state (see #14). |
| 49 | Only home meals, no dine-outs -- restaurant section empty, insights handles gracefully | PASS | InsightsScreen: `topRestaurants.length > 0` guard hides the section. RestaurantScreen: empty list shows "No restaurant visits yet". `dineOutCount` = 0, `outsideSpending` = 0. All handled. |
| 50 | 100+ meals -- performance acceptable | ISSUE | **Potential concern.** HomeScreen `fetchMealsByDate` replaces the entire meals array (useMealStore:70-74), which is fine. But InsightsScreen `fetchMeals` merges into a Map (useMealStore:39-44), so the meals array grows across navigation. If user switches time ranges repeatedly, meals accumulate. Not a memory leak per se (Map dedupes by id), but the array could grow large. The `computeFromMeals` and all the `filter/map/reduce` in `computeInsights` run on every render cycle of InsightsScreen due to local `takeoutPercent`/`dineOutPercent` calculations outside useMemo (lines 91-109). These should be memoized. |

**Fix for #50:** Wrap the `takeoutPercent` and `dineOutPercent` calculations in InsightsScreen inside a `useMemo` dependent on `[meals, insights, timeRange]`.

---

## Summary

| Category | PASS | ISSUE | Total |
|----------|------|-------|-------|
| Dashboard | 12 | 1 | 13 |
| Insights | 7 | 2 | 9 |
| Dish Library | 9 | 1 | 10 |
| Restaurant Tracker | 6 | 1 | 7 |
| Cross-screen Data Flow | 2 | 4 | 6 |
| Edge Cases | 1 | 2 | 3 |
| **Total** | **37** | **11** | **50** |

## Critical Issues (must fix before MVP)

1. **#44 -- Edit meal does not update dish/restaurant stats.** Data integrity problem. Stats drift from reality over time.
2. **#45 -- Delete meal does not decrement dish/restaurant stats.** Same data integrity problem.
3. **#39 -- Restaurant time range filter is misleading.** Shows all-time aggregated stats but filters by last visit date, giving incorrect per-period numbers.

## Important Issues (should fix before MVP)

4. **#16 -- Home/Takeout/DineOut percentages may not sum to 100%.** Rounding error from independent Math.round calls.
5. **#42/#43 -- Cross-screen staleness.** Adding a meal does not immediately update dish/restaurant stores in local state.
6. **#23 -- Currency icon hardcoded to USD.** Shows dollar icon for INR/EUR/GBP users.

## Minor Issues (nice to fix)

7. **#14 -- No cohesive empty state on HomeScreen when zero meals.**
8. **#30 -- Dish row onPress is only favorite toggle, no detail navigation.**
9. **#50 -- InsightsScreen takeout/dineout percent calculations not memoized.**
