# Sofra 🍲

**Sofra** ("shared table") is a family meal-planning app for the home kitchen. It learns from what you actually cook, generates personalized weekly plans, keeps a searchable dish library, tracks takeout/dine-out spending, and surfaces insights — so deciding "what's for dinner?" stops being a daily negotiation.

Built with React Native (Expo) and Firebase. Households sync across devices; a parent and partner share one plan.

---

## Features

- **Personalized weekly plans** — generates a plan from your real cooking history and dish rotation preferences, not generic recipe lists.
- **Multi-dish meals (thali)** — log a main dish plus sides as one meal; each dish can carry a 1–5★ rating.
- **Kids tiffin track** — a separate audience so a kids' lunchbox and the family meal can share the same day/slot.
- **Dish library** — every dish you've cooked, sortable by *last made*, *most made*, favorites, or A–Z, with a "forgotten dishes" nudge for anything outside your rotation window.
- **Eating out** — track takeout and dine-out visits by restaurant, with per-dish ratings ("what to order / what to avoid") and spend.
- **Insights** — monthly spend trends, home-vs-out ratio, and cooking patterns via charts.
- **Reminders** — optional daily / weekly / monthly local notifications (no server push required).
- **Households** — invite a partner; meals, dishes, and restaurants are shared and update live on the same device.
- **Polished UX** — Terracotta & Sage theme with light / dark / auto, Fraunces + Inter typography, motion and skeleton loaders throughout.

## Tech stack

| Layer | Choice |
| --- | --- |
| App | React Native 0.76 · Expo SDK 52 · TypeScript |
| Navigation | React Navigation (native-stack + bottom-tabs) |
| State | Zustand (cache-first single-source stores) |
| UI | React Native Paper · custom theme · react-native-svg / chart-kit |
| Backend | Firebase — Auth, Cloud Firestore, Storage |
| Auth | Google Sign-in + email/password |
| Tests | Jest |

## Architecture notes

- **Cache-first reads.** Meals and dishes load once per household/session; every screen filters in memory and writes update the local cache immediately. Firestore is re-read only on pull-to-refresh or household change — keeping read volume flat. See `src/stores/useMealStore.ts` and `src/stores/useDishStore.ts`.
- **Derived dish stats.** `timesCooked` / `lastCookedDate` are derived from the meals list (future-planned meals excluded) rather than double-counted from stored fields.
- **Single meal, many dishes.** A multi-dish meal is one `Meal` document with an `items[]` array; `dishName` is the primary/summary dish.

## Project layout

```
src/
  components/   Reusable UI (MealCard, DishPicker, Celebration, …)
  config/       Firebase & app config
  hooks/        Shared hooks
  navigation/   Stack + tab navigators
  screens/      15 screens (Home, Calendar, Plan, DishLibrary, AddMeal, Insights, …)
  services/     firestore, auth, planner, notifications, insights, storage, migration
  stores/       Zustand stores (meal, dish, auth, household, insight, notification, theme)
  types/        Shared TypeScript types
  utils/        Helpers
docs/           PROGRESS.md and project docs
android/        Native Android project (release APK builds here)
```

## Getting started

### Prerequisites
- Node.js 18+
- A Firebase project with **Authentication**, **Cloud Firestore**, and **Storage** enabled
- For Android release builds: JDK 17 + Android SDK

### Setup

```bash
npm install
```

Add your Firebase credentials (config lives under `src/config/`) and, for Android, place `google-services.json` in `android/app/`.

> **Note:** the Android/iOS package id is `com.thaliplan.app` and is linked to the Firebase project — do not rename it without also updating `google-services.json` and the Firebase console.

### Run in development

```bash
npm start          # Expo dev server
npm run android    # build & run on a device/emulator
```

### Test

```bash
npm test
```

### Build a release APK

```bash
cd android
./gradlew assembleRelease
# output: android/app/build/outputs/apk/release/app-release.apk
```

Install on a connected device:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Signing keystore/passwords are handled by the project owner and are not committed.

---

*Private project — not currently open to external contributions.*
