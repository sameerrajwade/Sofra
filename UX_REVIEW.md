# ThaliPlan UX Review

*Reviewed: June 27, 2026*
*Reviewer: Senior UX Audit*

---

## 1. Screen-by-Screen UX Audit

### 1.1 AuthScreen (Onboarding/Login)

**Information hierarchy:** Good. Logo and branding are prominent, form fields are logically ordered. Value proposition cards appear only during sign-up, reducing clutter on sign-in.

**Interaction patterns:** Well-structured. Password visibility toggle, Google sign-in, and forgot password are all discoverable. The toggle between sign-in/sign-up is clear.

**Visual consistency:** Consistent use of theme colors. `Colors.primary` used for CTAs. Form inputs use outlined mode throughout.

**Cognitive load:** Low for sign-in (just 2 fields). Sign-up adds name + household name, which is reasonable. The household name being optional is good -- reduces friction.

**Error states:** Handled well. Local validation catches empty fields and short passwords. Server errors bubble up through `displayError`. Password reset confirmation is shown inline.

**Empty states:** N/A -- this is a form screen.

**Accessibility:** Input icons provide visual cues. However, the password toggle icon (`eye`/`eye-off`) lacks an explicit `accessibilityLabel`. The `TextInput.Icon` onPress for show/hide password should have a label like "Show password" / "Hide password".

**Issues:**
- The tagline says "Plan meals, not stress" but the PRD says "Your family's meal memory" -- inconsistency in branding.
- Household name placeholder says "e.g. The Smiths" -- should use a culturally neutral or Indian-context example like "e.g. The Rajwades" given the target audience.
- No avatar picker during registration, though the PRD specifies one.
- `submitButtonContent` padding of `Spacing.xs` (4pt) makes the button touch target borderline small vertically. The button text area itself may be fine due to Paper's defaults, but worth verifying.

---

### 1.2 HomeScreen (Dashboard)

**Information hierarchy:** Strong. Metric cards at top give at-a-glance monthly overview. Today's meals are front and center. Forgotten dishes section adds unique value.

**Interaction patterns:** FAB for adding meals is standard and well-placed (bottom-right). Meal cards are tappable. Pull-to-refresh is implemented.

**Visual consistency:** Uses `MetricCard` component consistently. Section titles use consistent `FontSize.xl` with `fontWeight: '700'`.

**Cognitive load:** Moderate. Four metric cards + today's meals + up to 10 forgotten dishes is a lot of content, but the scroll layout handles it.

**Error states:** Shows "No insights available yet" when no data. Shows "Please set up your household first" when no household. No error state for network failures during refresh.

**Empty states:** Adequate but could be more actionable. "No insights available yet" does not guide the user to log their first meal.

**Accessibility:** FAB has `accessibilityLabel="Add meal"`. MetricCard has accessibility labels. Good.

**Issues:**
- Hardcoded `$` currency symbol on line 130: `$${insights.outsideSpending.toFixed(0)}`. Should use the user's currency preference.
- Currency icon is `currency-usd` regardless of user setting.
- `FlatList` nested inside `ScrollView` (line 173) with `scrollEnabled={false}` -- this works but is a known anti-pattern that can cause layout issues on some devices. Consider using a simple `.map()` instead.
- Forgotten dishes section has no "View all" or navigation to the Dish Library.
- The greeting with user's name mentioned in the PRD is missing from the header.

---

### 1.3 CalendarScreen (Weekly Calendar)

**Information hierarchy:** Good. Week navigator at top, grid layout with Day/Lunch/Dinner columns is clear. Today's row is highlighted.

**Interaction patterns:** Tapping empty cells or filled cells both navigate to AddMeal -- intuitive. Week navigation arrows and "Today" button work well. Auto-plan button is persistently visible in bottom bar.

**Visual consistency:** Consistent with theme. Today highlight uses `primaryLight + '20'` for subtle emphasis.

**Cognitive load:** Low. The grid format is familiar (resembles the physical whiteboard it replaces).

**Error states:** Alert dialogs for auto-plan errors. "Cannot Auto-Plan" when no dishes exist gives clear guidance.

**Empty states:** "Not planned" placeholder text in empty cells is helpful.

**Accessibility:** WeekNavigator component has good accessibility labels. MealCard has accessibility labels.

**Issues:**
- `dayCol` width is fixed at 50px. On smaller screens, day labels may feel cramped. On larger tablets, it wastes space.
- No month view toggle exists yet, though the PRD specifies one (Week/Month toggle).
- Auto-plan hardcodes `currency: 'USD'` and `monthlyDineOutBudget: 200` (line 128-129) instead of using user preferences.
- Auto-plan hardcodes `cuisineTag: 'Indian'` for all generated meals (lines 143, 153) -- this is incorrect for non-Indian dishes.
- No visual distinction between past days and future days in the calendar.
- The `paddingVertical: Spacing.xs` (4pt) on day rows makes them quite compact -- touch targets for meal cells may be tight on smaller phones.

---

### 1.4 AddMealScreen (Add/Edit Meal Form)

**Information hierarchy:** Good vertical flow: date, meal type, source, dish, cuisine, restaurant, cost, notes, actions.

**Interaction patterns:** Toggle buttons for meal type and source type are clear. DishPicker with autocomplete and quick picks is excellent for speed. Conditional enabling of restaurant/cost fields based on source type is smart.

**Visual consistency:** Consistent label styling with uppercase + letter spacing. Consistent input styling.

**Cognitive load:** Moderate. Many fields visible at once, but the form is logically grouped. The conditional disabling helps.

**Error states:** Validation alert for empty dish name. Error alert for save failures. Delete has confirmation dialog.

**Empty states:** N/A -- form screen.

**Accessibility:** All inputs have `accessibilityLabel`. DishPicker items have labels. MealTypeToggle and SourceTypeToggle have `accessibilityRole="button"`.

**Issues:**
- **Date input is a plain text field** with placeholder "YYYY-MM-DD". This is a major UX problem. Users should not type dates manually. A date picker component is essential.
- No smart default for meal type based on time of day, despite the PRD requiring it (before noon = lunch, after 5pm = dinner). The default is always 'lunch'.
- Cost field shows hardcoded `$` prefix (line 219) regardless of user's currency setting.
- Restaurant field label says "Restaurant / Source" but the placeholder says "Restaurant name" -- inconsistent.
- The form requires scrolling on most phones. Primary action (Save) is at the bottom, requiring full scroll to reach.
- No character count or limit indication on notes field.
- The restaurant/cost fields remain visible (just disabled) for home-cooked meals. They should collapse entirely to reduce visual noise.

---

### 1.5 PlanScreen (Auto-Plan Generator)

**Information hierarchy:** Excellent. Header with icon, explanatory subtitle, info banner, preference chips, then day-by-day plan. Clear action buttons at bottom.

**Interaction patterns:** Pull-to-refresh regenerates. Per-day refresh buttons. Tap dish name to edit (via dialog). "Regenerate all" and "Accept plan" buttons are clearly differentiated.

**Visual consistency:** Good use of Surface components with elevation. Consistent chip styling.

**Cognitive load:** Well-managed. Info banner explains the algorithm. Preference chips provide transparency. Each day row is compact.

**Error states:** Loading state with spinner and text. Empty state when no dishes exist guides user to add dishes first.

**Empty states:** Good -- shows chef hat icon with guidance text.

**Accessibility:** Missing accessibility labels on several interactive elements. Dish names are tappable via `onPress` on `Text`, but `Text` is not announced as interactive by screen readers.

**Issues:**
- Tappable dish names use `Text.onPress` which has no visual affordance -- users do not know they can tap to edit. Should use a TouchableOpacity or show an edit icon.
- The edit dialog is a simple text input with no autocomplete from the dish library, unlike the AddMealScreen's DishPicker.
- No drag-to-reorder functionality mentioned in PRD.
- Import paths reference different store files than other screens (`dishStore` vs `useDishStore`, `mealStore` vs `useMealStore`, `householdStore` vs `useHouseholdStore`). This will cause build errors unless these are aliases.
- Default preferences use `'₹'` for currency (line 54) while the rest of the app defaults to `'USD'` -- inconsistency.
- `DAY_LABELS` array starts with 'SUN' (index 0) matching `Date.getDay()` -- correct, but week display should probably start on Monday to match CalendarScreen.
- No undo after accepting a plan.

---

### 1.6 InsightsScreen (Stats/Charts)

**Information hierarchy:** Strong. Time range selector at top, then sections flow logically: ratio overview, restaurants, cuisine variety, spending trend, most cooked dishes.

**Interaction patterns:** Time range chips for filtering. Pull-to-refresh. Charts are non-interactive (view only) which is appropriate.

**Visual consistency:** Consistent use of Surface sections. Bar charts use custom View-based rendering that matches theme colors.

**Cognitive load:** High but manageable. Many data sections, but each is in its own card. The stacked ratio bar is visually intuitive.

**Error states:** Empty state with icon and guidance text. Loading spinner.

**Empty states:** Good guidance: "Log some meals to see your insights here."

**Accessibility:** Missing accessibility labels on ratio bar segments. Bar chart rows lack descriptive labels. The LineChart component (react-native-chart-kit) has limited built-in accessibility.

**Issues:**
- Spending chart uses hardcoded `yAxisLabel="$"` (line 293) -- should use user's currency.
- Chart width calculation `screenWidth - Spacing.md * 4` (line 292) does not account for device rotation or split-screen.
- The "last period" comparison text (line 217) can produce confusing sentences like "Last period was 68% home" without clear context of what "last period" means.
- Alert text uses `--` (double hyphen) instead of an em dash on line 253.
- No way to drill into specific data points (e.g., tap a restaurant to see visit history).

---

### 1.7 DishLibraryScreen (Dish Catalog)

**Information hierarchy:** Good. Search bar prominent, filter/sort controls below, then dish list. Each dish row shows name, cuisine, days since last made, and count.

**Interaction patterns:** Search with real-time filtering. Sort and cuisine filter menus. Quick filter chips. FAB for adding. Star toggle for favorites. Add dish via dialog.

**Visual consistency:** Consistent with other list screens. Chips match theme.

**Cognitive load:** Low. Filters are optional; default view is useful. Dish rows show essential info without overload.

**Error states:** Error state with icon, message, and retry button -- well done. This is the best error handling of all screens.

**Empty states:** Different messages for "no dishes" vs "no search results" -- good contextual guidance.

**Accessibility:** Dish rows have `accessibilityLabel` with name, cuisine, and count. FAB has label.

**Issues:**
- Tapping a dish row toggles favorite (line 172-173). This is unexpected -- users expect tap to open detail/edit. The star icon alone should handle favoriting, and the row tap should navigate to detail.
- The "Add Dish" dialog is too constrained for the CuisineChips component -- horizontal scrolling inside a dialog may clip or behave poorly.
- Quick filter chips show labels ("All", "Favorites", "Not made 30+ days") but no counts, despite the PRD specifying counts.
- No "Quick meals" filter mentioned in PRD is implemented.
- Dish detail view (seeing all dates a dish was made, frequency chart) is missing entirely.
- The `lastMade` sort puts oldest-last-made first. This is the reverse of what most users would expect -- they likely want recently-made dishes first, or the sort name should be "Longest ago".

---

### 1.8 RestaurantScreen (Restaurant Tracker)

**Information hierarchy:** Good. Time range selector, summary metrics, then restaurant list sorted by visits. Exploration nudge banner when appropriate.

**Interaction patterns:** Time range chips for filtering. Pull-to-refresh. Cards are not tappable (no navigation to detail).

**Visual consistency:** Consistent with other screens. MetricCard reuse is good.

**Cognitive load:** Low. Clean layout with clear metrics and simple cards.

**Error states:** Error state with retry button. Loading state.

**Empty states:** Good guidance: "Log a dine-out or takeout meal to start tracking."

**Accessibility:** Missing `accessibilityLabel` on restaurant cards. The Banner nudge is announced but may not convey urgency.

**Issues:**
- Hardcoded `$` for spending display (line 146, 214). Should use user's currency.
- No way to add a restaurant manually -- restaurants are only created through meal logging.
- No tap action on restaurant cards -- users cannot see visit history or details for a restaurant.
- The "Frequent" badge threshold is hardcoded to 4 visits (line 117). This should probably be configurable or contextual.
- Time range filtering only filters by `lastVisitDate >= startDate` which misses restaurants visited before the start date but with visits within the range (it compares against restaurant-level lastVisitDate, not individual visit dates).

---

### 1.9 HistoryScreen (Meal Log)

**Information hierarchy:** Good. Filters at top, search below, then chronological SectionList grouped by month.

**Interaction patterns:** Source type filter chips. Search bar. Sticky section headers. Infinite scroll with `onEndReached`. Export via header button.

**Visual consistency:** Consistent chip and card styling. Section headers match theme.

**Cognitive load:** Low. Each day row shows lunch + dinner side by side -- compact and scannable.

**Error states:** Loading spinner for initial load. Footer loader for pagination.

**Empty states:** Different messages for search vs no data.

**Accessibility:** Meal cells have `accessibilityLabel`. Export button in header.

**Issues:**
- `handleMealPress` callback is empty (line 150-154) -- tapping meals does nothing. This is a critical gap since the PRD says "tap any meal entry to edit it."
- Export uses `Share.share()` which shares raw CSV text as a message. On mobile, this will produce a wall of text in the share sheet. Should generate a file and share that.
- Hardcoded `$` for cost display (line 183).
- No "Today" indicator in the timeline, unlike the calendar.
- The initial data load depends on `loadedMonths` starting at 3, but there is no initial `fetchMealsByDateRange` call in a useEffect -- data relies on the store already having meals.

---

### 1.10 ProfileScreen (Settings)

**Information hierarchy:** Good vertical flow: avatar/profile info, household, meal preferences, auto-plan rules, account actions.

**Interaction patterns:** Menu dropdowns for numeric selections. Switches for toggles. Inline text input for budget. Avatar picker with camera/gallery/initials options.

**Visual consistency:** Card-based sections with consistent styling. Dividers between sections.

**Cognitive load:** High. This is the longest screen with many settings. Could benefit from collapsible sections.

**Error states:** Alert dialogs for save failures. Sign-out has confirmation dialog.

**Empty states:** "No household set up" shown when missing.

**Accessibility:** AvatarPicker buttons have labels. Switch components have associated text labels.

**Issues:**
- Budget input affix shows `$` hardcoded (line 252) regardless of currency setting. The currency selector is on the same screen, which makes this obviously wrong.
- No "Change password" option exists, though the PRD mentions it.
- No notification preferences exist, though the PRD mentions them.
- The invite button shows the raw invite code in the button label (`Invite (ABC123)`) -- this is both a privacy concern (visible on screen) and confusing UX. Should be a separate action to copy/share the code.
- Preferences save on every single change (each toggle, each menu selection) with individual API calls. Should debounce or batch saves.
- The "Export Data" button shows a placeholder message ("Feature coming soon") -- should either work or be hidden.
- No visual feedback when preferences save successfully (only shows "Saving..." text that disappears).

---

## 2. User Flow Analysis

### 2.1 First-time user: Register -> Onboard -> First meal entry

**Flow:** AuthScreen (sign up) -> MainTabs (Home) -> tap FAB -> AddMealScreen

**Friction points:**
1. **No onboarding flow.** After signing up, the user lands on HomeScreen with empty data and no guidance. The PRD mentions onboarding but there is no tutorial, walkthrough, or first-run guidance.
2. **Household setup is unclear.** If user skips household name during registration, they see "Please set up your household first" on HomeScreen with no way to create one from that screen.
3. **Empty dashboard is discouraging.** All four metric cards are empty. No progressive disclosure or "get started" CTA.
4. **First meal entry requires knowing the form.** No pre-populated examples or tutorial overlay.

**Recommendation:** Add a first-run experience: either a brief walkthrough or a prominent "Log your first meal" card on the empty dashboard that pre-fills today's date and suggests common setup steps.

### 2.2 Daily use: Open app -> Log today's meals (target: <10 seconds)

**Flow:** HomeScreen -> tap empty meal card OR FAB -> AddMealScreen -> fill form -> save

**Friction points:**
1. **Date is a text field.** Even though it pre-fills today, the user might accidentally edit it. A locked date (with option to change via picker) would be faster.
2. **Meal type does not auto-select based on time of day.** Extra tap required.
3. **Dish picker is fast** thanks to autocomplete + quick picks -- this is the strength of the flow.
4. **Cuisine selection is an extra step** that could auto-fill from dish library matches.
5. **Save button requires scrolling** past the notes field.

**Assessment:** For a returning user logging a home-cooked dish, the minimum path is: tap FAB -> type 2 letters of dish name -> select from autocomplete -> tap Save. This is approximately 5-8 seconds with quick picks, meeting the target. However, for takeout/dine-out entries with restaurant and cost, it exceeds 10 seconds due to additional field entry.

**Recommendation:** Auto-select meal type by time of day. Auto-fill cuisine from matched dish. Consider a sticky Save button at bottom of screen.

### 2.3 Weekly planning: View calendar -> Generate plan -> Edit -> Accept

**Flow:** Calendar tab -> view week -> tap "Auto-plan unplanned days" OR Plan tab -> review plan -> tap dishes to edit -> "Accept plan"

**Friction points:**
1. **Two paths to auto-plan** (Calendar bottom bar and Plan tab) with different behavior. Calendar auto-plans in-place; Plan tab generates a preview. This could confuse users about which to use.
2. **Calendar auto-plan has no preview.** It immediately writes meals to the calendar with no undo.
3. **Plan screen edit dialog lacks autocomplete.** Editing a suggested dish requires typing the full name.
4. **No drag-to-reorder** on the Plan screen.
5. **After accepting plan**, user is navigated to Calendar, but there is no success confirmation beyond an Alert in the Calendar flow.

**Recommendation:** Consolidate planning into the Plan tab with a clear preview-edit-accept flow. Calendar auto-plan should link to the Plan tab rather than silently writing meals.

### 2.4 Checking insights: Open insights -> Switch time ranges -> Understand patterns

**Flow:** Insights tab -> view default (30d) -> tap time range chip -> view updated data

**Friction points:**
1. **No guided interpretation.** Numbers are shown but the user must draw their own conclusions. The PRD mentions trend indicators (Improving/Declining) but only one comparison text exists.
2. **Time range change triggers a full data reload** which can feel slow.
3. **Charts are not interactive.** Users cannot tap a bar to see details.
4. **Spending chart months use raw month numbers** (e.g., "06") instead of names.

**Recommendation:** Add brief interpretive text to each section (e.g., "You cooked more at home this month compared to last month"). Make spending chart labels more readable.

---

## 3. Mobile-Specific Concerns

### 3.1 Touch Target Sizes (minimum 44x44pt)

- **MealTypeToggle buttons:** `paddingVertical: 8` with `FontSize.sm` (12) gives roughly 28pt height. **Below minimum.** Should be at least 44pt.
- **SourceTypeToggle buttons:** Same issue -- `paddingVertical: 8` gives roughly 36pt height with icon. **Borderline.**
- **Calendar day rows:** `paddingVertical: Spacing.xs` (4pt) makes meal cells within each row very tight. Each MealCard adds its own padding, but the row itself is cramped.
- **CuisineChips:** Default Chip height from react-native-paper is 32pt. **Below 44pt minimum** but chips are commonly accepted at this size.
- **Forgotten dishes rows:** `paddingVertical: Spacing.sm` (8pt) gives approximately 32pt total. **Below minimum.**
- **DishPicker dropdown items:** `paddingVertical: Spacing.sm` (8pt) -- **below minimum.**

### 3.2 Thumb-Zone Accessibility

- **FAB placement** (bottom-right) is within easy thumb reach -- good.
- **Bottom tab bar** at 60pt height is accessible -- good.
- **WeekNavigator** at top of CalendarScreen requires reaching up. The "Today" button is especially small and high.
- **Save/Cancel buttons on AddMealScreen** are at the bottom of a scrollable form -- may require scrolling past fold, but once there, they are reachable.
- **Auto-plan button** on CalendarScreen is in a persistent bottom bar -- excellent.

### 3.3 Scroll Behavior and Keyboard Handling

- **KeyboardAvoidingView** used on AuthScreen and AddMealScreen -- good.
- **`keyboardShouldPersistTaps="handled"`** on scroll views -- correctly prevents keyboard dismissal when tapping buttons.
- **Missing on CalendarScreen** -- tapping a meal cell while keyboard is up (if from search or other input) may not work as expected.
- **DishPicker dropdown** uses absolute positioning with `top: 64`. If the input field height changes (e.g., on larger font sizes or different devices), the dropdown will misalign.

### 3.4 Bottom Navigation Usability

- 5 tabs with icons and labels at 60pt height -- standard and usable.
- `FontSize.xs` (10pt) for tab labels is small but acceptable for navigation.
- Active/inactive colors provide clear state indication.
- **Missing:** Several tabs (Calendar, Plan, Insights) still point to `PlaceholderScreen` in the navigator, though actual screen files exist. This appears to be a wiring issue.

### 3.5 Form Input on Mobile

- **Email field:** `keyboardType="email-address"`, `autoCapitalize="none"`, `autoComplete="email"` -- all correct.
- **Cost field:** `keyboardType="decimal-pad"` -- correct.
- **Dish name:** No `autoCapitalize` set -- defaults to "sentences" which is reasonable for dish names.
- **Date field:** Plain text input with no picker -- the worst form input in the app. Typing "2026-06-27" on a phone keyboard is error-prone and slow.
- **Budget input in ProfileScreen:** `keyboardType="numeric"` -- correct, but `parseInt` on every keystroke (line 246) means typing "1" then "0" then "0" fires three preference saves.

---

## 4. Cultural/Context Considerations

### 4.1 Indian Household Welcome

- App name "ThaliPlan" with Hindi/Marathi cultural reference is strong.
- Default cuisine chips include "Indian" first in the list -- appropriate.
- The app structure (lunch + dinner as primary meals) matches Indian household patterns.
- Forgotten dishes concept resonates with "what haven't we made in a while" family discussions.

### 4.2 Dish Name Flexibility

- Free text input with no language restrictions -- any script (Devanagari, etc.) can be typed.
- Autocomplete works on string matching, which works across languages.
- Quick picks show dish names as entered -- preserves original language.
- **Good:** No assumption that dish names must be in English.

### 4.3 Currency Handling

**This is a significant issue across the app:**
- The `ProfileScreen` has a currency selector with USD, EUR, GBP, INR, CAD, AUD.
- However, every other screen hardcodes `$` as the currency symbol:
  - HomeScreen line 130: `$${insights.outsideSpending.toFixed(0)}`
  - AddMealScreen line 219: `<TextInput.Affix text="$" />`
  - RestaurantScreen line 146: `$${item.totalSpend.toFixed(0)}`
  - HistoryScreen line 183: `$${meal.cost.toFixed(0)}`
  - InsightsScreen line 293: `yAxisLabel="$"`
  - ProfileScreen line 252: `<TextInput.Affix text="$" />`
- The currency preference is stored but never read for display purposes.
- For Indian users (the primary audience), seeing `$` instead of a rupee symbol is wrong and confusing.

### 4.4 Cross-Cultural Assumptions

- The placeholder "e.g. The Smiths" on the household name field is culturally Western. Should use "e.g. Rajwade Family" or be locale-aware.
- The tagline "Plan meals, not stress" differs from the PRD's "Your family's meal memory" -- the latter has more universal appeal.
- No assumption about number of meals per day is forced -- the toggle supports breakfast/lunch/dinner/snack.
- **Date format:** The manual date entry format `YYYY-MM-DD` is ISO standard but unfamiliar to most users who expect DD/MM/YYYY (India, UK) or MM/DD/YYYY (US). A date picker would eliminate this issue.

---

## 5. Top 10 UX Recommendations (Prioritized)

### 1. Replace text date input with a proper date picker
- **Issue:** AddMealScreen uses a plain text input for date entry with "YYYY-MM-DD" format. Users must type dates manually, which is slow and error-prone.
- **Impact:** High -- this is on the critical path of the most common user action (logging a meal).
- **Effort:** Low -- use `@react-native-community/datetimepicker` or similar.
- **Recommendation:** Replace with a tappable date display that opens a native date picker. Pre-fill with today. Show date in human-readable format (e.g., "Fri, Jun 27").

### 2. Fix hardcoded currency symbol across all screens
- **Issue:** Every screen displays `$` regardless of user's currency preference. The currency selector exists in ProfileScreen but its value is never consumed.
- **Impact:** High -- Indian users (primary audience) see dollar signs for rupee amounts.
- **Effort:** Low -- create a `formatCurrency(amount, currency)` utility and use it everywhere. Read currency from user preferences.
- **Recommendation:** Create a shared currency formatter. Pass currency symbol from preferences store. Update HomeScreen, AddMealScreen, CalendarScreen, RestaurantScreen, HistoryScreen, InsightsScreen, and ProfileScreen.

### 3. Add smart meal type default based on time of day
- **Issue:** The PRD specifies "before noon = lunch, after 5pm = dinner" but the form always defaults to 'lunch'.
- **Impact:** Medium -- saves one tap per meal entry, directly affects the <10 second entry target.
- **Effort:** Low -- 3 lines of code.
- **Recommendation:** `const hour = new Date().getHours(); const defaultMealType = hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : 'dinner';`

### 4. Wire up missing screen connections in navigator
- **Issue:** Calendar, Plan, and Insights tabs use `PlaceholderScreen` in the navigator despite screen implementations existing.
- **Impact:** High -- three of five tabs do not work.
- **Effort:** Low -- import and wire the components.
- **Recommendation:** Import `CalendarScreen`, `PlanScreen`, and `InsightsScreen` in `AppNavigator.tsx` and replace the `PlaceholderScreen` references. Also wire `HomeScreen` for `HomeMain`.

### 5. Make HistoryScreen meal tap functional
- **Issue:** `handleMealPress` is an empty callback. Users cannot edit meals from history, despite the PRD requiring it.
- **Impact:** Medium -- blocks a key user flow (correcting past entries).
- **Effort:** Low -- navigate to AddMeal with meal data, similar to CalendarScreen.
- **Recommendation:** `navigation.getParent()?.navigate('AddMeal', { meal });`

### 6. Increase touch target sizes on toggle buttons and list rows
- **Issue:** MealTypeToggle and SourceTypeToggle buttons have ~28-36pt height. Forgotten dish rows and DishPicker dropdown items are also undersized.
- **Impact:** Medium -- affects usability for all users, especially those with larger fingers or motor difficulties.
- **Effort:** Low -- increase padding values.
- **Recommendation:** Set minimum `paddingVertical: 12` on toggle buttons (achieving ~44pt total). Set `minHeight: 44` on list rows.

### 7. Add first-run empty state guidance on HomeScreen
- **Issue:** New users see an empty dashboard with "No insights available yet" and no guidance on what to do first.
- **Impact:** Medium -- directly affects first-time user retention.
- **Effort:** Medium -- design and implement a "get started" card.
- **Recommendation:** Show a welcome card with "Log your first meal" CTA when no meals exist. Include a brief explanation of the app's value.

### 8. Fix DishLibraryScreen row tap behavior
- **Issue:** Tapping a dish row toggles its favorite status. Users expect tap to open detail/edit. Favoriting should only happen via the star icon.
- **Impact:** Medium -- causes accidental favorites and blocks access to dish details.
- **Effort:** Low -- split the TouchableOpacity: star icon gets its own onPress for favoriting, row tap navigates to detail.
- **Recommendation:** Make the star icon a separate `TouchableOpacity` with favoriting. Make row tap navigate to a dish detail view (or at minimum, open the edit dialog).

### 9. Add autocomplete to PlanScreen's edit dialog
- **Issue:** When editing a suggested dish in the plan, the dialog has a plain text input with no autocomplete. The AddMealScreen's DishPicker (with autocomplete and quick picks) is far superior.
- **Impact:** Medium -- slows down plan customization.
- **Effort:** Medium -- reuse DishPicker component in the dialog.
- **Recommendation:** Replace the plain TextInput in the edit dialog with the DishPicker component or a simplified version of it.

### 10. Collapse irrelevant fields on AddMealScreen based on source type
- **Issue:** Restaurant and cost fields are always visible, just disabled for home-cooked meals. This adds visual noise for the most common use case.
- **Impact:** Low -- cosmetic, but reduces cognitive load.
- **Effort:** Low -- conditional rendering based on `sourceType !== 'home'`.
- **Recommendation:** Only render restaurant name and cost fields when source type is 'takeout' or 'dineout'. Use a smooth animation (LayoutAnimation) for the transition.

---

## Appendix: Additional Observations

- **PlanScreen imports inconsistent store paths** (`dishStore` vs `useDishStore`). This will cause runtime errors unless resolved.
- **CalendarScreen auto-plan hardcodes `cuisineTag: 'Indian'`** for all generated meals. Should inherit from the dish or default to user preference.
- **No offline support** is implemented despite the PRD mentioning it.
- **No notification system** is implemented despite the PRD mentioning configurable notifications.
- **Month view toggle** on CalendarScreen is specified in the PRD but not implemented.
- **ProfileScreen saves preferences on every keystroke** for the budget field. Should debounce.
