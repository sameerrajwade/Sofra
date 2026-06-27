# ThaliPlan — Product Roadmap

**Version:** 1.0
**Created:** June 27, 2026
**Timeline:** 14 weeks (Weeks 1–14)
**Tech stack:** React Native (Expo), Firebase (Auth + Firestore), TypeScript

---

## Phase 1: Foundation (Weeks 1–3)

### Deliverables
- Expo project scaffolding with TypeScript, ESLint, Prettier
- Bottom tab navigation shell (5 tabs: Home, Calendar, Plan, Insights, Profile)
- Firebase project setup (Auth, Firestore, Storage)
- Firebase Auth: email/password registration + Google Sign-in
- Onboarding / Sign Up screen (Screen 10) with registration form
- Sign In screen with email/password and forgot-password flow
- Profile picture / avatar system: upload photo, choose from curated set, auto-generated initials avatar
- Firestore data models: users, households, meals, dishes, restaurants
- Firestore security rules (household-scoped read/write)
- Household creation on registration (name field from Screen 10)

### Dependencies
- None (starting point)

### Key milestones
- Week 1: Expo project running on both platforms, Firebase connected
- Week 2: Auth flow complete — user can register, sign in, sign out
- Week 3: Avatar system working, Firestore models finalized, nav shell in place

### Risk flags
- Google Sign-in requires native configuration per platform (Expo plugin complexity)
- Avatar upload needs Firebase Storage — adds billing surface early
- Security rules must be right from the start; retrofitting is painful

---

## Phase 2: Core Meal Logging (Weeks 4–6)

### Deliverables
- Add / Edit Meal form (Screen 3): date picker, meal type selector, source type selector, dish name with autocomplete, cuisine tags, restaurant field, cost field, notes
- Quick picks from recent dishes (chip row on Screen 3)
- Smart defaults: meal type based on time of day
- Weekly Calendar View (Screen 2): week navigator, 7-day grid with lunch/dinner columns, today highlight, type badges, cost display
- Monthly calendar toggle on Screen 2 (dot indicators per day)
- Meal History / Log (Screen 8): infinite scroll timeline grouped by month, source type filters, search bar
- Dish autocomplete from Firestore history
- Restaurant name autocomplete from history
- Offline support: local queue for meal entries, sync on reconnect
- Edit and delete meal from calendar and history views

### Dependencies
- Phase 1: Auth, Firestore models, navigation shell

### Key milestones
- Week 4: Add Meal form functional, meals saving to Firestore
- Week 5: Weekly calendar rendering meals, edit/delete working
- Week 6: History log with filters, offline queue operational

### Risk flags
- Autocomplete performance depends on dish/restaurant volume — may need local caching strategy
- Offline sync conflict resolution (two family members editing the same meal)
- Calendar grid layout complexity on small screens

---

## Phase 3: Dashboard & Library (Weeks 7–8)

### Deliverables
- Dashboard Home screen (Screen 1): greeting header, notification bell placeholder, settings icon
- 4 metric cards: home cooked %, dine-out count, unique dishes this month, outside spending total — each with trend vs. last month
- Today's meals card with quick "Add meal" button
- Forgotten dishes section (sorted by days since last made)
- "Days since last made" calculation engine (reusable across screens)
- Dish Library (Screen 6): searchable list of all logged dishes, search bar, cuisine filter, sort options (last made / most made / A–Z / favorites)
- Quick filter chips: All, Favorites, Not made in 30+ days, Quick meals
- Favorite toggle (star) per dish
- Dish detail view: all dates made, notes, frequency
- Add dish directly from library (not just through meal logging)
- CSV export from Meal History (Screen 8)

### Dependencies
- Phase 2: Meal data must exist in Firestore for dashboard metrics and dish library population

### Key milestones
- Week 7: Dashboard rendering live metrics from Firestore, forgotten dishes list working
- Week 8: Dish library with search, filters, and favorites complete

### Risk flags
- Metric calculations on large datasets may be slow — consider Firestore aggregation or precomputed counters
- "Days since last made" must handle dishes with no prior history gracefully

---

## Phase 4: Intelligence (Weeks 9–10)

### Deliverables
- Auto-Plan Generator screen (Screen 4): header with sparkle icon, info banner explaining algorithm decisions, plan list with per-day lunch/dinner suggestions
- Planning algorithm:
  - Avoid dishes made within last N days (default 14)
  - Prioritize dishes not made in 30+ days
  - Balance cuisine types across the week
  - Respect max dine-out limit per week
  - Include 0–2 new dish suggestions if enabled
  - Use weekend dine-out patterns from history
- Editable draft: tap any dish to swap, per-row refresh button, "Regenerate all" button
- "Accept plan" saves suggestions to calendar
- Preferences section with active rule chips and "Edit rules" button
- Restaurant Tracker (Screen 7): time range selector, 3 summary metric cards (total spend, visits, unique places), restaurant list sorted by visit count, "Frequent" badge, exploration nudge banner

### Dependencies
- Phase 2: Calendar and meal data (algorithm input)
- Phase 3: Dish library and "days since last made" engine (algorithm input)

### Key milestones
- Week 9: Planning algorithm producing reasonable suggestions, editable draft UI complete
- Week 10: Restaurant tracker live with metrics, accept-plan flow saving to calendar

### Risk flags
- Algorithm quality is subjective — needs tuning with real data; poor suggestions will erode trust
- Planning with sparse history (new users) needs graceful fallback
- Restaurant tracker "Frequent" badge threshold needs to be configurable or smart

---

## Phase 5: Insights & Polish (Weeks 11–12)

### Deliverables
- Insights & Stats screen (Screen 5):
  - Time range selector (week / month / 3 months / 6 months)
  - Home vs. outside ratio (stacked bar with comparison to previous period)
  - Top restaurants (ranked bar chart with over-visited alert nudge)
  - Cuisine variety (horizontal bars by cuisine)
  - Outside spending trend (line chart over time)
  - Most cooked dishes (top 3 with count)
- Profile & Family Settings screen (Screen 9):
  - Household member list with roles (Admin / Member) and avatars
  - "Invite family member" via shareable link or code
  - Meal preferences: default meals per day, dine-out budget with alerts, dish rotation reminder, currency selector
  - Auto-plan rules: max dine-outs, repeat avoidance window, new dish toggle
  - Account section: export all data, notification preferences, change password, sign out
- Family sharing: invited members see shared calendar, any member can add/edit/delete meals
- Notifications: "Plan your week" reminder, "Log today's meals" nudge, budget alert, dish rotation nudge

### Dependencies
- Phase 1: Auth and household model (for family sharing)
- Phase 2–4: All meal/dish/restaurant data (for insights calculations)

### Key milestones
- Week 11: Insights charts rendering with real data, profile screen functional
- Week 12: Family invite flow working end-to-end, notifications configured

### Risk flags
- Charting library selection (react-native-chart-kit vs. Victory Native vs. SVG) — performance and customization tradeoffs
- Family sharing invite flow requires Firebase Dynamic Links or a custom deep-link solution
- Push notifications require Expo push token setup and a notification service
- Budget alerts need background calculation — consider Cloud Functions

---

## Phase 6: Launch Prep (Weeks 13–14)

### Deliverables
- End-to-end testing across all 10 screens
- Bug fixes from internal testing
- Performance optimization (Firestore query efficiency, list virtualization, app startup time)
- App store assets: icon, screenshots, feature graphic, description, keywords
- Privacy policy and terms of service
- Beta testing with 5–10 families (TestFlight + Google Play Internal Testing)
- Incorporate beta feedback
- Production Firebase configuration (indexes, backup, monitoring)
- App Store and Google Play submission

### Dependencies
- All prior phases complete

### Key milestones
- Week 13: Internal testing complete, beta build distributed
- Week 14: Beta feedback incorporated, store submissions sent

### Risk flags
- App Store review can take 1–7 days — build in buffer
- Beta testers may surface UX issues requiring Phase 2–5 rework
- Firestore pricing under real multi-family load needs monitoring

---

## Success Metrics

### Engagement (first 30 days post-launch)
- **Meal logging rate:** Average 10+ meals logged per household per week
- **Return rate:** 60%+ of registered users active after 7 days
- **Speed of entry:** Median meal log time under 10 seconds for returning users

### Feature adoption (first 60 days)
- **Auto-plan usage:** 40%+ of active households use auto-plan at least once per week
- **Dish library engagement:** 50%+ of users mark at least 5 favorites
- **Insights views:** Average 2+ insights screen visits per user per week

### Growth
- **Household size:** Average 2.5+ members per household (family sharing working)
- **Retention:** 40%+ monthly active retention at 90 days
- **Organic invites:** 30%+ of new users join via family invite link

### Quality
- **Crash-free rate:** 99.5%+
- **App store rating:** 4.0+ stars
- **Offline sync success:** 99%+ of offline entries sync without data loss

---

*Document version: 1.0*
*Last updated: June 27, 2026*
*Author: ThaliPlan Product Team*
