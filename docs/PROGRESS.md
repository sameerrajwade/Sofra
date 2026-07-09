# Sofra — Progress

## Current State
Family meal-planning app (React Native / Expo + Firebase, TypeScript). Rebranded **ThaliPlan → Sofra** ("shared table/spread"). Pre-launch overhaul mostly done: Terracotta & Sage theme with light/dark/auto, Fraunces + Inter fonts, motion primitives, all live screens dark-aware. Multi-dish + per-dish ratings and kids-tiffin planning are in MVP1 and built. Jest suite (13 tests) passing via `npm test`. Local notifications (expo-notifications) in progress. Package id stays `com.thaliplan.app` (Firebase-linked — do not rename).

## Constraints
- Repo: https://github.com/sameerrajwade/Sofra (renamed from DiningPlan on 2026-07-09).
- Do NOT rename package id `com.thaliplan.app` without updating google-services.json + Firebase console.
- Never handle signing/keystore passwords — Sameer does all signing.
- Motion = built-in RN Animated + LayoutAnimation only (no Reanimated, no native rebuild).
- Paywall + monetization DEFERRED, not in MVP1.
- Develop → test → show results → only then build/deliver.

## Last Session
Shipped 6 UX fixes + 4 follow-ups (tsc=0, 14/14 Jest pass); built + installed debug-signed release APK on device 57150DLCH002E1 over wireless ADB; verified on device via adb screencap.
First 6: (1) "Add side dish"→"Add a dish"; (2) MealCard lists all dishes by name (was "+N more") [verified]; (3) share exports actual PNG card via expo-sharing; (4) Home "Kids Tiffins" card shows unique count + taps into kids-only DishLibrary subset [verified]; (5) kids tiffin fully suppressed on Sat/Sun even with toggle on; (6) History/DishLibrary dates use local time not UTC.
Follow-ups (2026-07-09 pt2): (7) Home todayTypes now excludes kids meals — a kids breakfast was spawning a phantom empty "Breakfast" family slot on Home (Calendar already filtered kids); (8) AddMeal getDefaultMealType respects enabled meal types (no more auto-breakfast before 11am); (9) MealTypeToggle shows only enabled types (+ selected); (10) AddMeal home "sides" relabeled "Main dish" + "More dishes in this meal" with a food icon so they don't read like a comment field. Rebuild in progress. Logged NOTIF-DEEPLINK-1/2 (MVP2).

All 10 fixes verified on-device via ADB screencap (incl. share sheet showing "Sharing image" + the real PNG card). Pushed branch ux-improvements-jul9 → PR #2 (https://github.com/sameerrajwade/Sofra/pull/2). Logged Sameer OUT of the app for onboarding-screen captures (he must re-login via Google himself).

## Device-test findings — ALL FIXED (2026-07-09 pt3, phased, tsc=0/14 tests)
- DUPMEAL: Home now runs dedupeMeals on load + picks newest record per slot (matches Calendar/Plan) → no more Home/Calendar divergence.
- COLDBOOT: App.tsx loading gate now shows branded splash (Sofra logo circle + wordmark + tagline).
- LOADFLASH: Home "Today's meals" shows Skeleton placeholders during load instead of "No meal planned" flash.
- SIGNUP-LOGO: AuthScreen resets scroll to top on sign-in↔sign-up toggle (logo was clipped from retained offset).
- COPY-AI: "AI-powered weekly plans" → "Personalized weekly plans from your cooking history".
- DELIGHT: new Celebration.tsx (native-driver confetti burst) fires on Plan accept. (dish-rate omitted — confetti on every star tap = noisy.)
Pending: rebuild+install+device-verify, then commit to PR #2.

## Next Up
1. Merge PR #2.
2. NOTIF-DEEPLINK-1/2 (MVP2) — notification tap → focused card.
3. Regenerate icon/splash PNG art (old purple branding).
4. Crash reporting decision (Sentry vs Crashlytics) + keys.
5. Compliance: privacy/terms review, store data-safety, version bump, EAS submit; deploy+verify rules in prod.

## 4b / delight status (verified in code+device 2026-07-09)
Notifications DONE (daily/weekly/monthly local reminders live in Settings). Charts/visualization DONE (chart-kit Spending Trend + custom bars). Motion DONE (motion.tsx used across 11 screens). Icons DONE (MaterialCommunityIcons + cuisine/meal/source via icons.ts). OPEN: micro-celebration (confetti on plan-accept/dish-rate) not built; full skeleton-loader coverage.
