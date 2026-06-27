# ThaliPlan — Product Requirements Document

## 1. Overview

**ThaliPlan** is a family meal planning and tracking mobile app (Android & iOS) that replaces the traditional whiteboard calendar used to plan weekly meals. It provides permanent meal history, intelligent auto-planning from your own cooking patterns, and insights into eating habits and spending.

**Tagline:** Your family's meal memory.

**App name:** ThaliPlan ("Thali" = plate in Hindi/Marathi + Plan)

**Repository:** https://github.com/sameerrajwade/DiningPlan

**Platform:** Android & iOS (mobile app)

---

## 2. Problem Statement

Many families use physical whiteboards or paper calendars to plan weekly meals. This approach has critical limitations:

1. **No history** — The board erases monthly. All past entries are lost.
2. **No repetition awareness** — Without memory, families avoid dishes thinking they were made recently when it's actually been months (e.g., Batata Bhaji made April 1st feels recent in July).
3. **No pattern visibility** — No way to see dining-out frequency, spending trends, or cuisine variety. Going to Honest Restaurant 3 times in consecutive months goes unnoticed.
4. **No intelligent planning** — Each week's plan is built from scratch with no data-driven suggestions.

---

## 3. Target Users

- **Primary:** Families (2–6 members) who actively plan meals together
- **Secondary:** Individuals who want to track eating habits and spending
- **Cultural context:** Designed with Indian household meal patterns in mind (lunch + dinner as primary meals, Indian dish names, familiar restaurant names) but universally usable

---

## 4. Screens & Features

### 4.1 Screen 1 — Dashboard (Home)

The landing screen after login. Provides an at-a-glance summary of the current month and today's meals.

**Components:**
- **Header:** App name, greeting with user's name, current month/year, notification bell, settings icon
- **Metric cards (4):**
  - Home cooked % (with trend vs last month)
  - Dine-out count (with comparison to last month)
  - Unique dishes this month
  - Outside spending total (with trend vs last month)
- **Today's meals card:**
  - Shows lunch and dinner for today
  - Each meal shows: dish name, type badge (Home / Takeout / Dine out), "last made X days ago" label
  - Quick "Add meal" button
- **Forgotten dishes section:**
  - List of dishes not made in a long time, sorted by days since last made
  - Shows dish name + "X days ago"
- **Bottom navigation bar:**
  - Home (active), Calendar, Plan, Insights, Profile
  - Icons with labels

---

### 4.2 Screen 2 — Weekly Calendar View

The primary planning and viewing interface. Shows one week at a time with lunch and dinner columns.

**Components:**
- **Week navigator:** Left/right arrows with date range label (e.g., "Jun 23 – 29, 2026")
- **View toggle:** Week / Month buttons
- **Calendar grid:**
  - Rows: 7 days (Mon–Sun)
  - Columns: Day label (day name + date) | Lunch | Dinner
  - Each cell shows:
    - Type badge (Home / Takeout / Dine out) with icon
    - Dish name (or restaurant name for dine-out)
    - Cost (if applicable, for takeout/dine-out)
  - Today's row is highlighted with a distinct background color and "TODAY" label
  - Empty/unplanned cells show "Not planned yet" in muted text
- **Action buttons:**
  - "Add meal" — opens the add meal form
  - "Auto-plan weekend" / "Auto-plan week" — triggers the auto-plan generator for unplanned days

**Monthly view (toggle):**
- Traditional calendar grid (7 columns × 4–5 rows)
- Each day cell shows colored dots indicating meal types logged
- Tap a day to expand and see/edit meals

---

### 4.3 Screen 3 — Add / Edit Meal

A form for logging a new meal or editing an existing one. Designed for speed — must take under 10 seconds for a typical entry.

**Components:**
- **Header:** "Add meal" or "Edit meal" title with close (X) button
- **Date picker:** Pre-filled with today, tappable to change
- **Meal type selector (toggle buttons):**
  - Breakfast | Lunch | Dinner | Snack
  - Single selection, default to contextual time (before noon = lunch, after 5pm = dinner)
- **Source type selector (toggle buttons):**
  - Home cooked | Takeout | Dine out
  - Visual distinction with icons and colors:
    - Home: green with home icon
    - Takeout: amber with car icon
    - Dine out: coral with store icon
- **Dish name field:**
  - Free text input with autocomplete from history
  - Quick picks: row of chip buttons showing recently used dishes (tappable to auto-fill)
  - Label: "Quick picks from your recent dishes"
- **Cuisine tag selector:**
  - Predefined chips: Indian, Chinese, Italian, Mexican, American, Thai, Japanese
  - "+ Custom" button to add a new cuisine tag
  - Single selection
- **Restaurant / source field:**
  - Only enabled when Takeout or Dine out is selected
  - Free text with autocomplete from previously entered restaurants
  - Disabled/grayed out for Home cooked
- **Cost field (optional):**
  - Only enabled when Takeout or Dine out is selected
  - Numeric input with currency prefix
  - Disabled/grayed out for Home cooked
- **Notes field (optional):**
  - Multi-line text area
  - Placeholder: "Tried a new recipe, kids loved it..."
- **Action buttons:**
  - Cancel (secondary) | Save meal (primary, prominent)
- **Edit mode additions:**
  - Delete meal button (with confirmation)
  - Pre-populated fields from existing entry

---

### 4.4 Screen 4 — Auto-Plan Generator

AI-powered weekly meal plan based on the family's cooking history. The generated plan is a **draft** — fully editable before accepting.

**Components:**
- **Header:** Sparkle icon + "Plan your week" title
- **Subtitle:** "Based on your history, here's a suggested plan for [date range]"
- **Info banner:** Explains what the algorithm did (e.g., "Avoided 12 dishes you've had in the last 14 days. Prioritized 5 dishes not made in 30+ days.")
- **Preferences section:**
  - Active rule chips showing current planning rules:
    - Max dine-outs per week
    - Mix cuisines
    - Include new dish suggestions
  - "Edit rules" button to modify preferences
- **Plan list (one row per day):**
  - Each row shows: Day label (MON 29) | Lunch suggestion | Dinner suggestion | Refresh button
  - Each suggestion shows:
    - Dish name
    - "X days ago" label (how long since last made)
    - Special badges: "New!" for never-made suggestions, red highlight for 60+ days
  - Dine-out slots marked with badge and "your pick!" label
  - **Per-row refresh button:** Regenerates suggestions for that single day
  - **Tap any dish to edit it:** Opens inline edit or dish picker to swap the suggestion
    - Can change the dish name (with autocomplete from dish library)
    - Can change source type (Home / Takeout / Dine out)
    - Can type in any custom dish not in history
  - **Drag to reorder** days if needed
- **Action buttons:**
  - "Regenerate all" — creates an entirely new plan
  - "Accept plan" — saves all suggestions to the calendar (primary, prominent)

**Planning algorithm rules (configurable in settings):**
- Avoid dishes made within the last N days (default: 14)
- Prioritize dishes not made in 30+ days
- Balance cuisine types (don't suggest 5 of the same cuisine)
- Respect max dine-out limit per week
- Include 0–2 new dish suggestions if enabled
- Use weekend dine-out patterns from history

---

### 4.5 Screen 5 — Insights & Stats

Data visualizations showing eating patterns, spending, and habits over time.

**Components:**
- **Header:** "Insights" title
- **Time range selector:** This week | This month (default) | 3 months | 6 months
- **Home vs outside ratio card:**
  - Horizontal stacked bar: Home % | Takeout % | Dine out %
  - Color-coded legend with percentages
  - Comparison to previous period (e.g., "May was 68% home")
  - Trend indicator (Improving / Declining)
- **Top restaurants card:**
  - Ranked list with horizontal bar chart showing visit count
  - Each row: restaurant name + bar + visit count
  - Alert nudge at bottom if one restaurant is over-visited (e.g., "Honest 5x in 2 months — try somewhere new?")
- **Cuisine variety card:**
  - Horizontal bars showing percentage per cuisine
  - Color-coded by cuisine
  - Shows all cuisines used in the selected period
- **Outside spending trend card:**
  - Line chart showing monthly outside spend over time
  - Trend indicator (spending up/down %)
- **Most cooked dishes card:**
  - Top 3 dishes displayed as metric cards with count (e.g., "8x — Dal + Rice")

---

### 4.6 Screen 6 — Dish Library

A searchable, filterable catalog of every dish the family has ever logged.

**Components:**
- **Header:** "Dish library" title + "Add dish" button
- **Search bar:** Full-text search across dish names
- **Filter dropdowns:**
  - Cuisine filter: All cuisines / Indian / Chinese / Italian / Mexican / etc.
  - Sort: Last made / Most made / A–Z / Favorites
- **Quick filter chips:**
  - All (count) | Favorites (count) | Not made in 30+ days (count) | Quick meals (count)
- **Dish list (scrollable):**
  - Each row shows:
    - Favorite star (tappable to toggle, yellow when favorited)
    - Dish name (bold)
    - Tags: Cuisine chip + Category chip (Quick meal, Comfort food, Elaborate, Rich/Heavy, Light, etc.)
    - Days since last made (red if 60+ days, normal otherwise)
    - Total times made
  - Tap a dish to see full detail: all dates it was made, notes, frequency chart
- **Footer:** "Showing X of Y dishes"

**Adding a new dish:**
- Can be added from this screen directly (not just through meal logging)
- Fields: dish name, cuisine tag, category tags, mark as favorite

---

### 4.7 Screen 7 — Restaurant Tracker

Dedicated view of all outside dining activity — restaurants, spending, and exploration patterns.

**Components:**
- **Header:** "Restaurants" title
- **Time range selector:** This month | Last 3 months (default) | Last 6 months | All time
- **Summary metric cards (3):**
  - Total spend (dollar amount)
  - Total visits (count)
  - Unique places (count)
- **Restaurant list (sorted by visit count, descending):**
  - Each row shows:
    - Restaurant name
    - Cuisine type (subtitle)
    - Visit count
    - Total spend
    - Last visit date
    - "Frequent" badge (red) if visit count exceeds threshold
- **Exploration nudge banner:**
  - Appears when visit concentration is high
  - Shows percentage going to top 2 restaurants
  - Suggests trying somewhere new

---

### 4.8 Screen 8 — Meal History / Log

An infinite scrollable timeline of every meal ever logged, grouped by month.

**Components:**
- **Header:** "Meal history" title + "Export" button (CSV download)
- **Filter buttons:**
  - All (default) | Home | Takeout | Dine out
- **Search bar:** Search by dish name, restaurant name
- **Timeline (grouped by month):**
  - Month/year section header (e.g., "June 2026")
  - Each day shows as a row:
    - Date column (day name + date number, today highlighted)
    - Lunch column: dish name + source type badge + cost if applicable
    - Dinner column: dish name + source type badge + cost if applicable
  - Tap any meal entry to edit it
- **Infinite scroll:** Loads older months as user scrolls down
- **Export:** Downloads complete meal history as CSV file

---

### 4.9 Screen 9 — Profile & Family Settings

Account management, household configuration, and app preferences.

**Components:**
- **Household section:**
  - List of household members with:
    - Profile picture / avatar (circular)
    - Name
    - Role (Admin / Member)
    - "You" badge on current user
    - Edit button per member
  - "Invite family member" button (share via link/code)
- **Meal preferences section:**
  - Default meals per day: toggle chips for Breakfast / Lunch / Dinner / Snack
  - Monthly dine-out budget: editable currency field with alerts when approaching limit
  - Dish rotation reminder: dropdown (After 30 / 45 / 60 days / Off)
  - Currency selector: USD / INR / GBP / EUR
- **Auto-plan rules section:**
  - Max dine-outs per week: dropdown (1 / 2 / 3 / No limit)
  - Avoid repeating within: dropdown (7 / 14 / 21 days)
  - Include new dish suggestions: toggle switch
- **Account section:**
  - Export all data (CSV)
  - Notification preferences
  - Change password
  - Sign out

---

### 4.10 Screen 10 — Onboarding / Sign Up

First-time user registration with value proposition.

**Components:**
- **App logo and branding:**
  - ThaliPlan icon (kitchen/utensil icon in purple circle)
  - App name + tagline ("Your family's meal memory")
- **Registration form:**
  - Name field
  - Email field
  - Password field
  - Household name field (e.g., "Rajwade Family")
  - **Profile picture / avatar picker:**
    - Option to upload a photo from camera or gallery
    - OR choose from a set of pre-designed avatars (illustrated faces, food-themed icons, initials-based)
    - Default: auto-generated initials avatar from name
  - "Get started" button (primary, prominent)
  - "Already have an account? Sign in" link
- **Value proposition cards (below form):**
  - "Never forget a meal" — Permanent history your whiteboard can't keep
  - "Smart weekly plans" — Auto-generated from what you actually cook
  - "Know your food habits" — Home vs outside ratio, spend trends, variety score

**Sign in screen (separate):**
- Email + password fields
- "Forgot password?" link
- "Create an account" link
- Social login options (Google, Apple) — future consideration

---

## 5. Profile Picture / Avatar System

Available across registration and profile settings.

**Options:**
1. **Upload photo** — from device camera or photo gallery, cropped to circle
2. **Choose avatar** — curated set of pre-designed avatars:
   - Illustrated face avatars (diverse skin tones, hairstyles)
   - Food-themed avatars (thali plate, chef hat, spoon & fork, various dishes)
   - Color-based initials avatar (auto-generated from name, e.g., "SR" on blue circle)
3. **Default** — If nothing selected, auto-generate initials avatar with a random color from the app palette

**Where it appears:**
- Navigation bar (small, top-right)
- Profile/settings screen
- Household member list
- Any shared/collaborative views

---

## 6. Cross-Cutting Requirements

### 6.1 Data & Storage
- All meal data persists permanently — no automatic deletion
- Support offline entry — sync when connection is restored
- Data export as CSV at any time

### 6.2 Family Sharing
- One household = shared meal calendar
- Any member can add, edit, or delete meals
- Admin can invite/remove members
- Invite via shareable link or code

### 6.3 Speed of Entry
- Logging a meal must take under 10 seconds for a returning user
- Autocomplete on dish names and restaurant names from history
- Quick picks from recent dishes
- Smart defaults (meal type based on time of day)

### 6.4 Notifications (optional, configurable)
- "Plan your week" reminder (e.g., Sunday evening)
- "You haven't logged today's meals" nudge
- Budget alert when approaching monthly dine-out limit
- "Dish rotation" nudge when a favorite hasn't been made in X days

### 6.5 Platform
- **Android & iOS** mobile app
- Responsive design optimized for phone screens
- Bottom tab navigation (5 tabs: Home, Calendar, Plan, Insights, Profile)

---

## 7. Competitive Landscape

No existing app fills this exact niche:

| App | Focus | Missing from ThaliPlan's POV |
|-----|-------|------------------------------|
| Plan to Eat | Recipe-first weekly planner | No home vs dine-out tracking, no history insights |
| Mealime | Meal plans with recipes | Focused on recipes, not logging what you actually ate |
| Eat This Much | Auto plans from nutrition goals | Calorie/macro focused, not family/cultural cooking |
| Ollie AI | AI-suggested recipe plans | Recipe-driven, no dining-out tracking |
| FoodiePrep | Pantry & recipe management | No historical analysis or spending patterns |

**ThaliPlan's unique differentiators:**
1. Tracks home-cooked vs dine-out/takeout ratio
2. Shows "days since last made" for every dish
3. Restaurant visit frequency and spending tracking
4. Auto-plans from your own cooking history (not a recipe database)
5. Exploration nudges and habit awareness

---

## 8. Future Considerations (Post-MVP)

These are NOT in scope for MVP but noted for future planning:

- Grocery list auto-generation from planned meals (requires dish → ingredient mapping)
- Nutritional tags (high-protein, light, heavy) — awareness, not calorie counting
- Meal photos — build a family food journal over time
- Social login (Google, Apple)
- Web companion app
- Recipe links or notes per dish
- Seasonal/festival meal suggestions
- Multi-language support (Hindi, Marathi, etc.)

---

*Document version: 1.0*
*Last updated: June 27, 2026*
*Author: Sameer Rajwade + ThaliPlan Product Team*
