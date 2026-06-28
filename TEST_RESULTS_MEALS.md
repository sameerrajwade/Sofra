# Test Results: Meals, Calendar, History & Auto-Plan

**Date**: 2026-06-27  
**Agent**: Test Agent 2 of 3  
**Method**: Static code trace analysis of full code paths

---

## Add Meal Form

### TC-1: Add home-cooked meal (date, meal type, source=home, dish name, cuisine)
**PASS**  
Flow: `handleSave` -> `isOutside = false` -> `mealData` built with `restaurantName: ''`, `cost: 0` -> `addMeal(householdId, {...})` -> `addMealApi` writes to Firestore -> local state updated via `set()` -> `navigation.goBack()`.  
Restaurant/cost fields are correctly excluded for home meals.

### TC-2: Add takeout meal (source=takeout, dish name, restaurant, cost)
**PASS**  
Flow: `isOutside = true` -> validates `restaurantName.trim()` not empty -> `mealData` includes `restaurantName` and parsed `cost` -> saves correctly. Restaurant stats updated via fire-and-forget `addOrUpdateRestaurant`.

### TC-3: Add dine-out meal (source=dineout, dish name, restaurant, cost)
**PASS**  
Same flow as TC-2. `sourceType === 'dineout'` triggers `isOutside = true`.

### TC-4: Add meal with empty dish name
**PASS**  
`handleSave` line 119: `if (!dishName.trim())` -> shows `Alert.alert('Validation', 'Dish name is required.')` and returns early.

### TC-5: Add home meal -> restaurant/cost fields HIDDEN (not disabled)
**PASS**  
Line 288: `{sourceType !== 'home' && (<>...</>)}` — conditional rendering, fields are unmounted entirely, not just disabled.

### TC-6: Switch between source types -> fields show/hide correctly
**PASS**  
`SourceTypeToggle` calls `setSourceType` -> re-render -> conditional `{sourceType !== 'home' && ...}` toggles restaurant/cost fields.

### TC-7: Date picker -> can select past dates, future dates, today
**PASS**  
Custom calendar modal renders all days of month with no date restrictions. `handleDateSelect` accepts any `Date` object.

### TC-8: Smart meal type default based on time of day
**PASS**  
`getDefaultMealType()` lines 30-35: `<11` = breakfast, `<15` = lunch, `<17` = snack, else dinner. Used as initial state when no existing meal.

### TC-9: Quick pick chips -> tapping fills dish name
**PASS**  
`DishPicker` renders `recentDishes` as `Chip` components. `onPress={() => handleSelect(name)}` calls `onChangeText(name)` and `onSelectDish?.(name)`. In `AddMealScreen`, `handleSelectDish` also sets `cuisineTag` from matched dish.

### TC-10: Cuisine chips -> only one selectable at a time
**PASS**  
`CuisineChips` takes single `selected: CuisineTag` and `onSelect`. Each chip `onPress={() => onSelect(tag)}` replaces previous selection. State is `useState<CuisineTag>`, so only one value at a time.

### TC-11: Custom cuisine -> should be addable
**ISSUE**  
The `CuisineChips` component accepts `customTags` prop but `AddMealScreen` never passes `customTags`. When user enters a custom cuisine via the text input and submits, `handleAddCustom` calls `onSelect(trimmed)` which sets `cuisineTag` state to the custom value. However, the custom tag does NOT appear as a chip in the list because it's not in `DEFAULT_TAGS` and `customTags` is empty. If the user navigates away and returns, the custom tag is lost from the UI chip list (though the saved meal retains the value).  
**Fix**: `AddMealScreen` should maintain a `customCuisineTags` state array, appending new custom values, and pass it to `<CuisineChips customTags={customCuisineTags} />`. Alternatively, derive custom tags from the dishes collection's unique cuisine tags.

### TC-12: Edit existing meal -> pre-fills all fields, saves changes
**PASS**  
`existingMeal = route.params?.meal`, `isEditing = !!(existingMeal && existingMeal.id)`. All `useState` hooks initialize from `existingMeal?.field ?? default`. `handleSave` calls `updateMeal(householdId, existingMeal.id, mealData)`.

### TC-13: Delete meal -> shows confirmation, removes from all screens
**PASS**  
`handleDelete` shows `Alert.alert` with Cancel/Delete. On Delete press, calls `deleteMeal(householdId, existingMeal.id)`. Store's `deleteMeal` calls `deleteMealApi` (Firestore `deleteDoc`) then filters meal from `state.meals`. `navigation.goBack()` returns to previous screen.

### TC-14: After saving meal -> navigates back, meal appears in calendar immediately
**PASS**  
`addMeal` in store appends to `state.meals` synchronously after Firestore write. `CalendarScreen` reads from `useMealStore().meals` via `getMealForSlot`, which is a `useCallback` depending on `meals`. New meal in store triggers re-render.

### TC-15: After saving meal -> dish stats update (timesCooked, lastCookedDate)
**ISSUE**  
The store's `addMeal` does fire-and-forget `getDishByName` + `incrementDishCount` which updates Firestore correctly. However, the local `useDishStore` is NOT updated — `incrementDishCount` writes to Firestore but does not call `useDishStore.updateDish` or refetch. The dish stats shown in UI will be stale until next `fetchDishes`.  
**Fix**: After `incrementDishCount` succeeds, update `useDishStore` locally:
```ts
// In useMealStore.addMeal, after incrementDishCount:
const { dishes } = useDishStore.getState();
const localDish = dishes.find(d => d.name === meal.dishName);
if (localDish) {
  useDishStore.setState(state => ({
    dishes: state.dishes.map(d =>
      d.id === localDish.id
        ? { ...d, timesCooked: d.timesCooked + 1, lastCookedDate: meal.date }
        : d
    ),
  }));
}
```

### TC-16: After saving takeout/dineout -> restaurant stats update
**ISSUE** (same pattern as TC-15)  
`addOrUpdateRestaurant` updates Firestore but the local restaurant store (if any) is not updated. This is less critical since there's no visible `useRestaurantStore` in the codebase — restaurant data is fetched fresh. However, any cached restaurant data will be stale.  
**Severity**: Low. The restaurant list screen presumably re-fetches on mount.

---

## Calendar

### TC-17: Week view shows Mon-Sun with lunch/dinner columns
**PASS**  
`startOfWeek(currentDate, { weekStartsOn: 1 })` starts on Monday. `eachDayOfInterval` generates 7 days. Header row has "Day", "Lunch", "Dinner" columns. Each day row renders `MealCard` for lunch and dinner.

### TC-18: Navigate to previous/next week -> loads meals for that week
**PASS**  
`onPrevious={() => setCurrentDate(d => addWeeks(d, -1))}` changes `currentDate`. `weekStart`/`weekEnd` recompute via `useMemo`. `loadWeek` useEffect triggers `fetchMealsByDateRange` for new range.

### TC-19: Today is highlighted
**PASS**  
`isToday(day)` from date-fns -> `todayHighlight` -> applies `todayRow` style (tinted background) and `todayText` style (primary color, bold).

### TC-20: Tap empty cell -> opens AddMeal with date and meal type pre-filled
**PASS**  
`handleCellPress` when `existingMeal` is null -> navigates to `AddMeal` with `meal: { id: '', date, mealType, ... }`. In `AddMealScreen`, `isEditing = !!(existingMeal && existingMeal.id)` -> `id` is `''` (falsy) -> `isEditing = false` -> form is in add mode with date and mealType pre-filled from the passed object.

### TC-21: Tap filled cell -> opens AddMeal in edit mode
**PASS**  
`handleCellPress` when `existingMeal` exists -> `navigation.navigate('AddMeal', { meal: existingMeal })`. `isEditing = true` because `existingMeal.id` is truthy.

### TC-22: Auto-plan button -> generates plan for empty slots
**PASS**  
`handleAutoPlan` finds `unplannedDays` (days missing lunch or dinner). Calls `generateMealPlan`. Iterates results, only adds meals where slot is empty (`!getMealForSlot`). Calls `loadWeek()` to refresh.

### TC-23: Month view toggle -> shows monthly calendar
**FAIL**  
There is NO month view toggle in `CalendarScreen`. The screen only renders a week view. No toggle button or state for switching between week/month views exists.  
**Fix**: Add a `viewMode` state (`'week' | 'month'`), a toggle button, and render a monthly grid when `viewMode === 'month'`. The monthly grid would show days of the month with meal indicators, similar to how `AddMealScreen`'s date picker renders a month calendar.

---

## History

### TC-24: Shows meals grouped by month
**PASS**  
`sections` useMemo groups `filteredMeals` into `monthMap` by `YYYY-MM` key, then nests days within months. `SectionList` renders section headers with "Month Year" format.

### TC-25: Filter by type (All/Home/Takeout/DineOut) -> filters correctly
**PASS**  
Filter chips set `sourceFilter` state. `filteredMeals` useMemo applies `result.filter(m => m.sourceType === sourceFilter)` when not 'all'.

### TC-26: Search by dish name -> finds matches
**PASS**  
`Searchbar` updates `search` state. `filteredMeals` filters by `m.dishName.toLowerCase().includes(q)` and also `m.restaurantName`.

### TC-27: Tap a meal -> opens edit mode
**ISSUE**  
`handleMealPress` calls `navigation.getParent()?.getParent()?.navigate('AddMeal', { meal })`. This relies on the exact navigation nesting: HistoryScreen is inside HomeStack inside MainTab inside RootStack. The double `getParent()` works IF the nesting is exactly 3 levels deep (HomeStack -> Tab -> RootStack). If the nesting changes, this breaks silently (returns undefined, no navigation happens).  
**Severity**: Medium. Works with current nav structure but is fragile.  
**Fix**: Use the `navigation` composite type properly or use `navigation.navigate('AddMeal' as any, { meal })` directly since `CompositeScreenProps` should handle cross-navigator navigation. Alternatively, use `CommonActions.navigate` from `@react-navigation/native`.

### TC-28: Scroll loads more history (pagination)
**PASS**  
`SectionList` has `onEndReached={handleLoadMore}` with `onEndReachedThreshold={0.3}`. `handleLoadMore` increments `loadedMonths` by 3 and calls `fetchMealsByDateRange` with expanded date range.

### TC-29: History loads on screen mount (not empty)
**ISSUE**  
The `useEffect` on line 67 depends only on `[householdId]`, NOT on `loadedMonths`. This means the initial fetch happens correctly, but if `householdId` doesn't change (stable), the effect won't re-fire when navigating back to the screen after adding a meal. The meals store is shared (Zustand), so newly added meals will appear IF they were added to the store. However, if the user adds a meal for a date outside the initially fetched range (older than 3 months), it won't appear until manual scroll triggers `handleLoadMore`.  
**Severity**: Low. For typical usage (recent meals), this works because the store is shared.

---

## Auto-Plan (PlanScreen)

### TC-30: Generate plan -> shows 7 days with suggestions
**PASS**  
`generate()` calls `generateMealPlan(dishes, meals, defaultPrefs, startDate, 7)`. Result is 7 `MealPlan` objects. Each rendered as a `Surface` card with date, lunch, and dinner.

### TC-31: Each suggestion shows "X days ago"
**PASS**  
Each meal slot renders `{day.lunch.lastMadeDaysAgo}d ago` or "New!" badge if `isNew`. `daysAgoColor` applies red/green coloring based on staleness.

### TC-32: Tap to edit a suggestion -> can swap dish
**PASS**  
Dish name `Text` has `onPress={() => openEdit(idx, 'lunch'/'dinner')}`. Opens `Dialog` with `TextInput`. `confirmEdit` updates `plan` state with new dish name.

### TC-33: Per-day refresh button -> regenerates that day only
**PASS**  
`IconButton` with `onPress={() => refreshDay(idx)}`. `refreshDay` calls `generateMealPlan` for 1 day with that day's date, replaces single entry in `plan` array.

### TC-34: Regenerate all -> new plan
**PASS**  
"Regenerate all" `Button` calls `generate()` which replaces entire `plan` state.

### TC-35: Accept plan -> saves all meals to calendar
**PASS**  
`acceptPlan` iterates `plan`, calls `addMeal` for each lunch/dinner slot. Then navigates to Calendar tab. Meals are in the Zustand store so Calendar will show them.

### TC-36: Preferences (max dine-outs, cuisine mix) -> respected by algorithm
**ISSUE**  
The `maxDineOutsPerWeek` preference is displayed in the UI chip but NOT enforced by the `generateMealPlan` algorithm. The planner uses `Math.random() < 0.6` for weekend dine-out decisions (line 51 of planner.ts) without counting total dine-outs against the preference. Could exceed the max.  
**Fix**: In `generateMealPlan`, track a `dineOutCount` counter. Before setting `dineOutDinner = true`, check `dineOutCount < preferences.maxDineOutsPerWeek`. Increment counter when a dine-out is assigned:
```ts
let dineOutCount = 0;
// ...
const dineOutDinner = isWeekend && dineOutCount < preferences.maxDineOutsPerWeek && Math.random() < 0.6;
if (dineOutDinner) dineOutCount++;
```

### TC-37: Plan doesn't suggest dishes from last 14 days (configurable)
**PASS**  
`planner.ts` line 17-21: filters `recentMeals` where `differenceInDays(today, parseISO(m.date)) < preferences.avoidRepeatDays`. Eligible dishes exclude those. `avoidRepeatDays` is configurable via preferences (default 3 in CalendarScreen, 7 in PlanScreen's `defaultPrefs`).

---

## Edge Cases

### TC-38: Add meal for a date that already has a lunch/dinner
**ISSUE**  
No duplicate detection. If user opens AddMeal manually and saves a second lunch for the same date, both are saved to Firestore. `getMealForSlot` uses `Array.find()` which returns only the first match — the second meal becomes invisible in the calendar but exists in the database.  
**Fix**: In `handleSave` (AddMealScreen) or `addMeal` (store), check for existing meal with same `date + mealType`. Either prevent the save with an alert, or offer to replace the existing meal:
```ts
const existing = get().meals.find(m => m.date === meal.date && m.mealType === meal.mealType);
if (existing) {
  // Update instead of add, or warn user
}
```

### TC-39: Very long dish name -> doesn't break layout
**PASS**  
`MealCard` uses `numberOfLines={1}` on dish name text, which truncates with ellipsis. `DishPicker` input has no length limit but is a single-line text input. History's `mealDishName` also uses `numberOfLines={1}`. Calendar `MealCard` handles overflow.

### TC-40: Special characters in dish name (Unicode)
**PASS**  
React Native `TextInput` and Firestore both support Unicode natively. `dishName.trim()` is safe with Unicode. No regex-based validation that could strip diacritics. `Masoor Dal`, `Creme brulee` with accents will save correctly.

### TC-41: Cost with decimal (e.g., $12.50)
**PASS**  
`keyboardType="decimal-pad"` allows decimal input. `parseFloat(cost)` in `handleSave` correctly parses `"12.50"` to `12.5`. Stored as number in Firestore. `MealCard` displays with `.toFixed(2)`.

### TC-42: Rapid-fire adding multiple meals -> no race conditions
**ISSUE**  
The save button is disabled only via `isLoading` from the meal store. However, `isLoading` is set to `true` at the start of `addMeal` and `false` at the end. Since `navigation.goBack()` is called after save, the user would have to navigate back very fast and tap save again. The real concern is `handleAutoPlan` in CalendarScreen which does sequential `await addMeal(...)` calls in a loop — if `addMeal` sets `isLoading: false` after each meal, intermediate renders could show a flash. But since `handleAutoPlan` has its own `planningLoading` state gate, the UI button stays disabled throughout. Similarly `acceptPlan` in PlanScreen uses `isAccepting` gate.  
**Severity**: Low. The `isLoading` toggling per-meal in batch operations is cosmetically imperfect but functionally safe because the UI gates are separate.

---

## Summary

| Category | Pass | Fail | Issue |
|----------|------|------|-------|
| Add Meal Form (1-16) | 13 | 0 | 3 |
| Calendar (17-23) | 6 | 1 | 0 |
| History (24-29) | 4 | 0 | 2 |
| Auto-Plan (30-37) | 7 | 0 | 1 |
| Edge Cases (38-42) | 3 | 0 | 2 |
| **Total** | **33** | **1** | **8** |

## Critical Fixes Required

1. **TC-23 (FAIL)**: No month view toggle exists in CalendarScreen. Must implement.
2. **TC-36 (ISSUE)**: `maxDineOutsPerWeek` not enforced by planner algorithm.
3. **TC-38 (ISSUE)**: No duplicate meal detection — can create multiple meals for same date+mealType slot.

## Recommended Fixes

4. **TC-11**: Pass custom cuisine tags to `CuisineChips` component.
5. **TC-15**: Sync local dish store after `incrementDishCount`.
6. **TC-27**: Use safer cross-navigator navigation in HistoryScreen.
7. **TC-29**: Add `fetchMealsByDateRange` to useEffect deps or use useFocusEffect.
8. **TC-42**: Consider batching Firestore writes in auto-plan/accept-plan to avoid per-meal `isLoading` toggling.
