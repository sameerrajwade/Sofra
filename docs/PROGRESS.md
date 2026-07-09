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

## Next Up
1. **On-device verify** the 6 fixes (esp. share-as-image on Android, weekend kids suppression). APK already installed.
2. Finish Batch 4b — local notifications (verify on device).
3. NOTIF-DEEPLINK-1/2 (MVP2) — notification tap → focused card via data payload + nav handler.
4. Regenerate icon/splash PNG art (may still carry old purple branding).
5. Decide crash reporting (Sentry vs Firebase Crashlytics) + keys/DSN.
6. Compliance: privacy/terms review, store data-safety forms, version bump, EAS submit profiles; deploy + verify firestore/storage rules in prod.
