# ThaliPlan -- PM Review

**Reviewed:** June 27, 2026
**Reviewer:** PM Review Team
**Scope:** REQUIREMENTS.md vs. actual implementation, ROADMAP.md, ARCHITECTURE.md

---

## 1. Requirements Coverage Matrix

### Screen 1 -- Dashboard (Home) [`src/screens/HomeScreen.tsx`]

| Feature | Status | Notes |
|---------|--------|-------|
| Header with app name, greeting, month/year | ⚠️ Partially | No greeting with user's name, no notification bell, no settings icon |
| Metric card: Home cooked % with trend | ✅ Fully implemented | |
| Metric card: Dine-out count with comparison | ✅ Fully implemented | |
| Metric card: Unique dishes this month | ✅ Fully implemented | |
| Metric card: Outside spending with trend | ✅ Fully implemented | |
| Today's meals card (lunch + dinner) | ✅ Fully implemented | |
| "Last made X days ago" label on today's meals | ❌ Not implemented | MealCard does not show days-since-last-made |
| Quick "Add meal" button on today's card | ✅ Fully implemented | FAB serves this purpose |
| Forgotten dishes section | ✅ Fully implemented | |
| Bottom navigation bar (5 tabs) | ✅ Fully implemented | |

### Screen 2 -- Weekly Calendar [`src/screens/CalendarScreen.tsx`]

| Feature | Status | Notes |
|---------|--------|-------|
| Week navigator with arrows and date range | ✅ Fully implemented | |
| View toggle: Week / Month | ❌ Not implemented | No monthly view toggle |
| Calendar grid: 7 days with Lunch/Dinner columns | ✅ Fully implemented | |
| Type badges (Home/Takeout/Dine out) with icons | ⚠️ Partially | Badges shown via MealCard but no icons per source type |
| Cost display in cells | ⚠️ Partially | Depends on MealCard implementation |
| Today's row highlighted | ✅ Fully implemented | |
| "TODAY" label on today's row | ❌ Not implemented | Row is highlighted but no explicit "TODAY" text label |
| Empty cells show "Not planned yet" | ✅ Fully implemented | Shows "Not planned" |
| "Add meal" action button | ⚠️ Partially | Tapping empty cell navigates to AddMeal, but no standalone "Add meal" button |
| "Auto-plan" button | ✅ Fully implemented | |
| Monthly view with colored dots | ❌ Not implemented | No month view at all |

### Screen 3 -- Add / Edit Meal [`src/screens/AddMealScreen.tsx`]

| Feature | Status | Notes |
|---------|--------|-------|
| Header with title and close (X) button | ⚠️ Partially | Title shown, but no explicit X button (uses navigation back) |
| Date picker (tappable) | ⚠️ Partially | Raw text input for date, not a proper date picker |
| Meal type selector (Breakfast/Lunch/Dinner/Snack) | ✅ Fully implemented | Via MealTypeToggle component |
| Smart defaults based on time of day | ❌ Not implemented | Always defaults to 'lunch' or existing meal type |
| Source type selector with icons and colors | ✅ Fully implemented | Via SourceTypeToggle component |
| Dish name with autocomplete from history | ✅ Fully implemented | Via DishPicker component |
| Quick picks from recent dishes | ✅ Fully implemented | |
| Cuisine tag selector (predefined chips) | ✅ Fully implemented | Via CuisineChips component |
| "+ Custom" button for new cuisine | ❌ Not implemented | Only predefined chips |
| Restaurant field (disabled for Home) | ✅ Fully implemented | |
| Restaurant autocomplete from history | ❌ Not implemented | Plain text input, no autocomplete |
| Cost field (disabled for Home) | ✅ Fully implemented | |
| Notes field | ✅ Fully implemented | |
| Cancel / Save buttons | ✅ Fully implemented | |
| Delete meal (edit mode) with confirmation | ✅ Fully implemented | |

### Screen 4 -- Auto-Plan Generator [`src/screens/PlanScreen.tsx`]

| Feature | Status | Notes |
|---------|--------|-------|
| Sparkle icon + "Plan your week" title | ✅ Fully implemented | |
| Subtitle with date range | ✅ Fully implemented | |
| Info banner explaining algorithm | ✅ Fully implemented | |
| Preference rule chips | ✅ Fully implemented | |
| "Edit rules" button | ❌ Not implemented | Chips are display-only, no edit functionality |
| Plan list with per-day lunch/dinner | ✅ Fully implemented | |
| "X days ago" label per dish | ✅ Fully implemented | |
| "New!" badge for never-made dishes | ✅ Fully implemented | |
| Red highlight for 60+ days | ✅ Fully implemented | Via daysAgoColor function |
| Dine-out slots with badge | ⚠️ Partially | Dine-out dinner slots exist but no "your pick!" label |
| Per-row refresh button | ✅ Fully implemented | |
| Tap any dish to edit/swap | ✅ Fully implemented | Opens edit dialog |
| Autocomplete in edit dialog | ❌ Not implemented | Plain text input in edit dialog |
| Change source type when editing suggestion | ❌ Not implemented | Can only change dish name, not source type |
| Drag to reorder days | ❌ Not implemented | |
| "Regenerate all" button | ✅ Fully implemented | |
| "Accept plan" button | ✅ Fully implemented | |

### Screen 5 -- Insights & Stats [`src/screens/InsightsScreen.tsx`]

| Feature | Status | Notes |
|---------|--------|-------|
| Time range selector (week/month/3mo/6mo) | ✅ Fully implemented | |
| Home vs. outside ratio (stacked bar) | ✅ Fully implemented | |
| Color-coded legend with percentages | ✅ Fully implemented | |
| Comparison to previous period | ✅ Fully implemented | |
| Trend indicator (Improving/Declining) | ⚠️ Partially | Shows numeric difference, not "Improving"/"Declining" text |
| Top restaurants (ranked bar chart) | ✅ Fully implemented | |
| Alert nudge for over-visited restaurant | ✅ Fully implemented | Triggers at 5+ visits |
| Cuisine variety (horizontal bars) | ✅ Fully implemented | |
| Outside spending trend (line chart) | ✅ Fully implemented | Uses react-native-chart-kit |
| Most cooked dishes (top 3) | ✅ Fully implemented | |

### Screen 6 -- Dish Library [`src/screens/DishLibraryScreen.tsx`]

| Feature | Status | Notes |
|---------|--------|-------|
| Search bar | ✅ Fully implemented | |
| Cuisine filter dropdown | ✅ Fully implemented | |
| Sort: Last made / Most made / A-Z / Favorites | ✅ Fully implemented | |
| Quick filter: All / Favorites / Not made 30+ days | ⚠️ Partially | Missing "Quick meals" filter chip (requires category tag filtering) |
| Quick filter counts | ❌ Not implemented | Chips don't show counts like "All (47)" |
| Favorite star toggle | ✅ Fully implemented | |
| Dish row: name, cuisine chip, category tags | ✅ Fully implemented | |
| Days since last made (red if 60+) | ✅ Fully implemented | |
| Total times made | ✅ Fully implemented | |
| Tap dish for full detail view | ❌ Not implemented | Tapping toggles favorite, no detail view |
| Detail: all dates made, notes, frequency chart | ❌ Not implemented | |
| "Add dish" button + form | ✅ Fully implemented | Via FAB + dialog |
| "Showing X of Y dishes" footer | ⚠️ Partially | Shows count of filtered dishes, but not "X of Y" format |

### Screen 7 -- Restaurant Tracker [`src/screens/RestaurantScreen.tsx`]

| Feature | Status | Notes |
|---------|--------|-------|
| Time range selector (month/3mo/6mo/all) | ✅ Fully implemented | |
| Summary cards: Total spend, visits, unique places | ✅ Fully implemented | |
| Restaurant list sorted by visit count | ✅ Fully implemented | |
| Each row: name, cuisine, visits, spend, last visit | ✅ Fully implemented | |
| "Frequent" badge | ✅ Fully implemented | Triggers at 4+ visits |
| Exploration nudge banner | ✅ Fully implemented | Triggers when top 2 > 60% of visits |

### Screen 8 -- Meal History [`src/screens/HistoryScreen.tsx`]

| Feature | Status | Notes |
|---------|--------|-------|
| "Export" button (CSV) | ✅ Fully implemented | Via Share API |
| Filter: All / Home / Takeout / Dine out | ✅ Fully implemented | |
| Search bar | ✅ Fully implemented | |
| Timeline grouped by month | ✅ Fully implemented | |
| Day rows with lunch/dinner columns | ✅ Fully implemented | |
| Source type badges | ✅ Fully implemented | |
| Cost display | ✅ Fully implemented | |
| Tap meal to edit | ⚠️ Partially | handleMealPress is a no-op (empty function body) |
| Infinite scroll | ✅ Fully implemented | Loads 3 more months on end reached |
| Today highlighted | ❌ Not implemented | No today highlighting in history view |

### Screen 9 -- Profile & Family Settings [`src/screens/ProfileScreen.tsx`]

| Feature | Status | Notes |
|---------|--------|-------|
| Household member list with avatars | ✅ Fully implemented | |
| Roles (Admin/Member) | ✅ Fully implemented | |
| "You" badge on current user | ✅ Fully implemented | |
| Edit button per member | ❌ Not implemented | No per-member edit capability |
| "Invite family member" button | ✅ Fully implemented | Shows invite code in alert |
| Invite via shareable link or code | ⚠️ Partially | Shows code in alert, no shareable link, no deep link |
| Default meals toggle | ✅ Fully implemented | |
| Monthly dine-out budget field | ✅ Fully implemented | |
| Budget alerts when approaching limit | ❌ Not implemented | |
| Dish rotation reminder dropdown | ✅ Fully implemented | |
| Currency selector | ✅ Fully implemented | |
| Auto-plan rules: max dine-outs | ✅ Fully implemented | |
| Auto-plan rules: avoid repeat within | ✅ Fully implemented | |
| Auto-plan rules: include new dishes toggle | ✅ Fully implemented | |
| Export all data | ⚠️ Partially | Placeholder -- says "Feature coming soon" |
| Notification preferences | ❌ Not implemented | |
| Change password | ❌ Not implemented | |
| Sign out | ✅ Fully implemented | |

### Screen 10 -- Onboarding / Sign Up [`src/screens/AuthScreen.tsx`]

| Feature | Status | Notes |
|---------|--------|-------|
| App logo and branding | ✅ Fully implemented | |
| App name + tagline | ⚠️ Partially | Tagline is "Plan meals, not stress" instead of req'd "Your family's meal memory" |
| Name field (sign up) | ✅ Fully implemented | |
| Email field | ✅ Fully implemented | |
| Password field | ✅ Fully implemented | |
| Household name field | ✅ Fully implemented | |
| Profile picture / avatar picker | ❌ Not implemented | No avatar picker on registration form |
| "Get started" button | ✅ Fully implemented | |
| "Already have an account?" link | ✅ Fully implemented | |
| Value proposition cards | ✅ Fully implemented | Different text than spec but same concept |
| Sign in: email + password | ✅ Fully implemented | |
| "Forgot password?" link | ✅ Fully implemented | |
| Google sign-in | ✅ Fully implemented | |

### Profile Picture / Avatar System (Section 5)

| Feature | Status | Notes |
|---------|--------|-------|
| Upload photo from camera/gallery | ⚠️ Partially | AvatarPicker component exists on Profile, needs verification |
| Choose from curated preset avatars | ❌ Not implemented | No preset avatar selection visible |
| Auto-generated initials avatar | ✅ Fully implemented | getInitials function in ProfileScreen |
| Avatar in navigation bar | ❌ Not implemented | No avatar in header/nav bar |
| Avatar in profile screen | ✅ Fully implemented | |
| Avatar in household member list | ✅ Fully implemented | |

### Cross-Cutting Requirements (Section 6)

| Requirement | Status | Notes |
|-------------|--------|-------|
| **6.1 Data persists permanently** | ✅ Fully implemented | Firestore-backed |
| **6.1 Offline support** | ⚠️ Partially | Architecture describes it, but no explicit enablePersistence call visible in code |
| **6.1 CSV export** | ⚠️ Partially | History screen exports via Share API; Profile export is placeholder |
| **6.2 Shared meal calendar** | ✅ Fully implemented | Household-scoped data model |
| **6.2 Any member can add/edit/delete** | ✅ Fully implemented | |
| **6.2 Admin invite/remove members** | ⚠️ Partially | Invite code shown, no remove member functionality |
| **6.2 Invite via link or code** | ⚠️ Partially | Code only, no shareable link or deep link |
| **6.3 Under 10 seconds entry** | ⚠️ Partially | Quick picks help, but date is a text field (slow), no time-based defaults |
| **6.3 Autocomplete dish names** | ✅ Fully implemented | |
| **6.3 Autocomplete restaurants** | ❌ Not implemented | |
| **6.3 Smart defaults (time of day)** | ❌ Not implemented | |
| **6.4 "Plan your week" reminder** | ❌ Not implemented | No notification system |
| **6.4 "Log today's meals" nudge** | ❌ Not implemented | |
| **6.4 Budget alert** | ❌ Not implemented | |
| **6.4 Dish rotation nudge** | ❌ Not implemented | |
| **6.5 5-tab bottom navigation** | ✅ Fully implemented | |

---

## 2. Gap Analysis

### P0 -- Critical (Blocks core value proposition)

**GAP-01: Navigator uses PlaceholderScreen for Calendar, Plan, Insights, and AddMeal**
- **Specified:** All 10 screens functional and navigable.
- **Actual:** `src/navigation/AppNavigator.tsx` wires Calendar, Plan, Insights, and AddMeal tabs to `PlaceholderScreen` (a component returning `null`). HomeMain also uses PlaceholderScreen. The actual screen implementations exist in `src/screens/` but are NOT connected in the navigator.
- **Impact:** The app renders blank screens for 4 of 5 tabs plus the home screen. The app is non-functional despite having complete screen code.
- **Priority:** P0 -- must fix immediately.

**GAP-02: Date entry is a raw text field, not a date picker**
- **Specified:** "Date picker: Pre-filled with today, tappable to change."
- **Actual:** `AddMealScreen.tsx` line 160-168 uses a plain `TextInput` with placeholder "YYYY-MM-DD".
- **Impact:** Users must type dates manually in ISO format. Unusable for non-technical users. Violates the "under 10 seconds" requirement.
- **Priority:** P0.

**GAP-03: Meal history tap-to-edit is broken**
- **Specified:** "Tap any meal entry to edit it."
- **Actual:** `HistoryScreen.tsx` line 150-154 -- `handleMealPress` has an empty function body with only a comment.
- **Impact:** Users cannot edit meals from history view.
- **Priority:** P0.

### P1 -- High (Degrades key experience)

**GAP-04: No monthly calendar view**
- **Specified:** Week/Month toggle with "traditional calendar grid (7 columns x 4-5 rows)" and colored dots.
- **Actual:** No toggle, no monthly view code exists.
- **Impact:** Users lose the bird's-eye view of an entire month. Reduces planning value.
- **Priority:** P1.

**GAP-05: No smart meal-type defaults based on time of day**
- **Specified:** "Default to contextual time (before noon = lunch, after 5pm = dinner)."
- **Actual:** Defaults to 'lunch' always.
- **Impact:** Extra tap needed every evening entry. Hurts speed-of-entry goal.
- **Priority:** P1.

**GAP-06: No restaurant name autocomplete**
- **Specified:** "Free text with autocomplete from previously entered restaurants."
- **Actual:** Plain TextInput with no autocomplete.
- **Impact:** Slower entry, inconsistent restaurant naming (e.g., "Honest" vs "Honest Restaurant").
- **Priority:** P1.

**GAP-07: No dish detail view in Dish Library**
- **Specified:** "Tap a dish to see full detail: all dates it was made, notes, frequency chart."
- **Actual:** Tapping a dish toggles its favorite status. No detail screen.
- **Impact:** Users cannot see the history of individual dishes -- a core insight.
- **Priority:** P1.

**GAP-08: Notifications system entirely missing**
- **Specified:** 4 configurable notification types (plan reminder, log nudge, budget alert, rotation nudge).
- **Actual:** No notification infrastructure. No FCM setup. No notification preferences UI.
- **Impact:** Users get no proactive engagement. Budget tracking is passive-only.
- **Priority:** P1 (but expected in Roadmap Phase 5).

**GAP-09: Profile data export is a placeholder**
- **Specified:** "Export all data (CSV) at any time."
- **Actual:** `ProfileScreen.tsx` line 131 -- Share message says "Feature coming soon."
- **Impact:** GDPR data portability requirement unmet.
- **Priority:** P1.

**GAP-10: No "Edit rules" button on Auto-Plan screen**
- **Specified:** Preferences section with "Edit rules" button to modify preferences.
- **Actual:** Chips are display-only. Rules can only be changed from Profile > Auto-plan Rules.
- **Impact:** Users must leave the plan screen to adjust rules. Breaks flow.
- **Priority:** P1.

### P2 -- Medium (Nice to have for MVP)

**GAP-11: No avatar picker during registration**
- **Specified:** Registration form includes profile picture / avatar picker.
- **Actual:** AuthScreen has no avatar selection. Only available post-registration on Profile screen.
- **Impact:** Missed onboarding personalization moment.
- **Priority:** P2.

**GAP-12: No preset avatar gallery**
- **Specified:** "Choose from a set of pre-designed avatars (illustrated faces, food-themed icons)."
- **Actual:** AvatarPicker component exists but no evidence of preset avatar images in assets.
- **Impact:** Users limited to photo upload or initials.
- **Priority:** P2.

**GAP-13: No drag-to-reorder on Auto-Plan**
- **Specified:** "Drag to reorder days if needed."
- **Actual:** No drag functionality.
- **Impact:** Minor -- users can refresh individual days instead.
- **Priority:** P2.

**GAP-14: Source type change not possible when editing a plan suggestion**
- **Specified:** "Can change source type (Home / Takeout / Dine out)."
- **Actual:** Edit dialog only allows changing dish name.
- **Impact:** Cannot convert a home-cooked slot to dine-out from the plan editor.
- **Priority:** P2.

**GAP-15: No "+ Custom" cuisine button**
- **Specified:** '+ Custom" button to add a new cuisine tag.'
- **Actual:** CuisineChips only shows predefined chips.
- **Impact:** Families cooking Korean, Vietnamese, Middle Eastern, etc. cannot tag properly.
- **Priority:** P2.

**GAP-16: "Quick meals" filter chip missing in Dish Library**
- **Specified:** Quick filter chips include "Quick meals (count)."
- **Actual:** Only All, Favorites, Not made 30+ days.
- **Impact:** Minor feature gap.
- **Priority:** P2.

**GAP-17: Tagline mismatch**
- **Specified:** "Your family's meal memory."
- **Actual:** "Plan meals, not stress."
- **Impact:** Brand inconsistency.
- **Priority:** P2.

**GAP-18: No "Frequent" badge in red per spec**
- **Specified:** '"Frequent" badge (red) if visit count exceeds threshold.'
- **Actual:** Badge uses `Colors.primaryLight` (purple), not red.
- **Impact:** Visual inconsistency with spec.
- **Priority:** P3.

### P3 -- Low

**GAP-19: No "last made X days ago" on today's meals dashboard card**
- **Specified:** Each meal shows "last made X days ago" label.
- **Actual:** MealCard shows dish name and source type but not days-since-last-made.
- **Priority:** P3.

**GAP-20: No change password in Profile**
- **Specified:** Account section includes "Change password."
- **Actual:** Not implemented.
- **Priority:** P3.

**GAP-21: No member removal / edit capability**
- **Specified:** Admin can remove members; edit button per member.
- **Actual:** No edit or remove buttons.
- **Priority:** P3 (low usage in early MVP).

**GAP-22: Invite flow lacks shareable link / deep link**
- **Specified:** "Invite via shareable link or code" with deep link `thaliplan://join?code=XXXXXX`.
- **Actual:** Invite code shown in an Alert dialog. No copy/share/deep-link.
- **Priority:** P2.

---

## 3. Roadmap Review

### Phasing Assessment

The 6-phase, 14-week roadmap is **logically sequenced**. Dependencies are correctly identified:
- Phase 1 (Foundation) has no dependencies -- correct.
- Phase 2 (Core Meal Logging) depends on Phase 1 -- correct.
- Phase 3 (Dashboard & Library) depends on Phase 2 for data -- correct.
- Phase 4 (Intelligence) depends on Phases 2+3 -- correct.
- Phase 5 (Insights & Polish) depends on all prior -- correct.

### Timeline Realism

| Phase | Estimate | Assessment |
|-------|----------|------------|
| Phase 1: Foundation (3 weeks) | Realistic | Google Sign-in + avatar upload may push to 3.5 weeks |
| Phase 2: Core Meal Logging (3 weeks) | **Tight** | Offline sync, monthly calendar, autocomplete, and the full AddMeal form is heavy for 3 weeks. Recommend 4 weeks. |
| Phase 3: Dashboard & Library (2 weeks) | Realistic | Metrics are computations, not heavy UI. Dish detail view is the stretch. |
| Phase 4: Intelligence (2 weeks) | **Tight** | Auto-plan algorithm + editable draft UI + restaurant tracker in 2 weeks is aggressive, especially the drag-to-reorder and edit dialog polish. Recommend 3 weeks. |
| Phase 5: Insights & Polish (2 weeks) | **Very tight** | Charts, family sharing invite flow, notifications (FCM setup), profile settings all in 2 weeks is unrealistic. Recommend 3-4 weeks. |
| Phase 6: Launch Prep (2 weeks) | Realistic if beta is small | |

**Overall: The 14-week timeline is likely 18-20 weeks realistically.** Phase 5 is the biggest risk -- it bundles three complex systems (charts, family invites, notifications).

### Missing Milestones

1. **No milestone for Firestore offline persistence enablement** -- this is listed as a Phase 2 deliverable but is architecturally fundamental.
2. **No milestone for Cloud Functions deployment** -- the architecture assumes Cloud Functions for planning and insights, but the actual implementation uses client-side computation. The roadmap should clarify whether Cloud Functions are in scope.
3. **No milestone for `firestore.indexes.json` deployment** -- required for queries to work at scale.

### Risk Assessment Accuracy

The identified risks are relevant but incomplete:
- **Missing risk:** The planner runs client-side (`src/services/planner.ts`) despite the architecture specifying Cloud Functions. This will need reconciliation.
- **Missing risk:** No testing framework or strategy is mentioned anywhere in the codebase.
- **Missing risk:** Currency is hardcoded to "$" in several screens (HomeScreen line 129, RestaurantScreen) despite the settings supporting multiple currencies.

---

## 4. Architecture Review (PM Perspective)

### Data Model Support

| Required Feature | Supported? | Notes |
|-----------------|------------|-------|
| All meal types (breakfast/lunch/dinner/snack) | ✅ | MealType union type |
| All source types (home/takeout/dineout) | ✅ | SourceType union type |
| Dish categorization (Quick meal, Comfort food, etc.) | ✅ | categoryTags: string[] |
| Restaurant tracking | ✅ | Separate Restaurant collection |
| Household sharing | ✅ | Meals scoped to household subcollection |
| User preferences | ⚠️ | Defined in types but stored separately from Firestore UserProfile model in ARCHITECTURE.md. Architecture has `preferences` nested in user doc; implementation has separate `getUserPreferences` call. |
| Notification preferences | ❌ | In Architecture spec but not in TypeScript types |
| Avatar system (upload/preset/initials) | ⚠️ | User type has `avatarUrl` but no `avatarType` or `presetAvatarId` fields as specified in Architecture |

### Architecture vs. Implementation Divergences

1. **Cloud Functions vs. Client-Side Computation**: The architecture specifies `generateWeeklyPlan` and `calculateInsights` as Cloud Functions. The implementation runs both client-side in `src/services/planner.ts` and `src/services/insights.ts`. This is fine for MVP but will not scale for large households.

2. **No `functions/` directory**: The architecture spec includes a `functions/` directory for Cloud Functions. This does not exist in the codebase. The `inviteToHousehold` and `joinHousehold` functions are also unimplemented.

3. **No `firestore.indexes.json`**: The architecture specifies 11 composite indexes. No index file exists.

4. **Store architecture divergence**: Architecture specifies Zustand stores like `useAuthStore`, `useMealStore`, etc. Code imports from both `../stores/authStore` and `../stores/useMealStore` (inconsistent naming). PlanScreen imports from `../stores/dishStore` and `../stores/mealStore` (without `use` prefix) while other screens import from `../stores/useDishStore` and `../stores/useMealStore`. This will cause import errors.

### Offline Support

- **Architecture says:** Firestore offline persistence enabled on app startup, `onSnapshot` with `includeMetadataChanges: true`.
- **Reality:** No evidence of `enablePersistence()` or `enableIndexedDbPersistence()` call in `src/config/firebase.ts` or anywhere else. Offline support is **not actually implemented** despite being listed in the roadmap.

### Family Sharing

- **Data model:** Properly designed with household-scoped subcollections.
- **Security rules:** `firestore.rules` exists at project root (unread but present).
- **Invite flow:** No Cloud Function for invite/join. Profile screen shows invite code in Alert but no actual join mechanism.
- **Verdict:** Data model supports it; implementation is incomplete.

---

## 5. Improvement Suggestions

### Features from Section 8 to Pull into MVP

1. **Recipe links/notes per dish** -- Already halfway there. The `notes` field exists on meals. Adding a `recipeUrl` field to the Dish model would be trivial and high-value. Users frequently ask "how did I make this last time?" Recommend pulling into Phase 3.

2. **Social login (Google, Apple)** -- Google Sign-in is already implemented. Apple Sign-in should be added before App Store submission as Apple requires it when other social logins are offered. Recommend pulling into Phase 6.

### UX Improvements

1. **Replace date text input with a proper date picker.** Use `@react-native-community/datetimepicker` or a modal calendar. This is the single biggest UX blocker.

2. **Add a "Today" quick-access button on the Dashboard** that scrolls the calendar to today and highlights it. Currently, navigating between Dashboard and Calendar loses context.

3. **Make the Dish Library accessible from the bottom tab bar.** Currently buried inside the Home stack. It's a frequently-accessed screen that deserves top-level navigation or a prominent entry point on Dashboard.

4. **Add haptic feedback on favorite toggle and meal save** for tactile confirmation on mobile.

5. **The planner's "avoidRepeatDays" defaults differ across screens**: CalendarScreen hardcodes 3, PlanScreen defaults to 3, but REQUIREMENTS.md specifies 14. The Profile screen's AVOID_REPEAT_OPTIONS are [1, 2, 3, 5, 7] -- none of which match the spec's default of 14. This needs alignment.

### Missing Edge Cases in Requirements

1. **Multi-meal-type per slot:** Requirements assume one meal per type per day. What if a family has two dishes for dinner (e.g., dal + rice as separate entries vs. "Dal + Rice" as one)? The data model allows multiple meals of the same type on the same day, but the calendar UI only shows one per slot.

2. **Household migration:** No requirement for what happens when a user leaves a household or joins a new one. Can a user be in multiple households? Architecture says "verify the user is not already in a household (or handle multi-household if supported)" but requirements don't address this.

3. **Data deletion / account deletion:** Architecture specifies a `deleteAccount` Cloud Function, but requirements don't mention account deletion. Apple App Store requires account deletion -- this should be added to the Profile screen requirements.

4. **Currency formatting:** Requirements mention "currency prefix" but the implementation hardcodes "$" in multiple places. The currency preference in settings is not propagated to display screens.

---

## Summary

**Overall implementation completeness: ~65%**

- 10 screens are coded, but only 3 are wired into the navigator (Auth, Profile, DishLibrary/Restaurants/History via HomeStack).
- Core data models, types, and service logic (planner, insights) are solid.
- The biggest blocker is **GAP-01**: the navigator not connecting screen implementations to the tab bar.
- Secondary blockers: date picker (GAP-02), broken history edit (GAP-03), and missing notifications (GAP-08).

**Recommended immediate actions:**
1. Wire all screens into AppNavigator (P0, ~1 hour)
2. Replace date text input with proper picker (P0, ~2 hours)
3. Fix history tap-to-edit (P0, ~30 minutes)
4. Align avoidRepeatDays default to 14 across all screens (P1, ~30 minutes)
5. Add monthly calendar view (P1, ~1-2 days)

---

*PM Review v1.0 -- June 27, 2026*
