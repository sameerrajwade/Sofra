# Sofra — Progress

## Current State
Family meal-planning app (React Native / Expo + Firebase, TypeScript), rebranded ThaliPlan → Sofra. Pre-launch overhaul near-done: Terracotta & Sage theme (light/dark/auto), Fraunces/Inter, motion, all screens dark-aware. MVP1 includes multi-dish + per-dish ratings, kids-tiffin planning, local notifications (daily/weekly/monthly), Insights charts. 14 Jest tests pass (`npm test`), tsc=0. Active branch `ux-improvements-jul9` → PR #2 (open, unmerged).

## Constraints
- Repo: github.com/sameerrajwade/Sofra. Package id `com.thaliplan.app` must NOT change (Firebase-linked).
- Never handle signing/keystore passwords — Sameer signs. Release APK is debug-signed (template config).
- Motion = built-in RN Animated only (no Reanimated). Paywall/monetization DEFERRED.
- Develop → test → show results → only then build/deliver.

## Open PRs (2026-07-10)
- **PR #2 (MERGED)** — 14 UX/device-test fixes (dish labels, all-dishes cards, image share, kids-weekends, breakfast fixes, dedupe, splash, skeletons, celebration).
- **PR #3 (MERGED)** — GitHub Pages site: 9-screen gallery + 7-screen guide + status-bar-cropped clean screenshots + share = card-only. Now on main.
- **PR #4 (merging)** — Firestore read reduction + two meal bug fixes + README (this session).

## Last Session — Firestore read reduction (branch reads-cache-first / PR #4)
Meals + dishes now **cache-first single-source**: load ALL once per household/session, every screen filters in memory, writes update memory locally (same-phone edits show instantly everywhere, 0 reads), re-read only on pull-to-refresh or household change. Removed 20s TTL + write-invalidation; coalesced concurrent loads; App.tsx warms caches at startup. No onSnapshot by design (user OK with cross-device refresh). New useMealStore.test.ts (5 tests) locks it. tsc=0, 19/19 Jest. Effect: ~2-3k reads/day → ~1 getAllMeals+getDishes per launch/refresh, flat. Built RELEASE APK (assembleRelease, standalone) + installed on device 57150DLCH002E1; copied to C:\Users\samee\Downloads\Sofra-beta.apk for Sameer to share with wife via Google Drive (chose private Drive over a public GitHub release). PAUSED: Sameer monitors Firebase read count tomorrow (2026-07-11) to confirm the drop; if good → move to release.

## Bug fixes (2026-07-10, branch reads-cache-first, tsc=0)
- FUTURE-DISH-STAT: DishLibrary "unique dishes" derived `lastCookedDate` as the MAX of ALL meal dates incl. future-planned ones, so an upcoming dish (e.g. Upma next Sunday) beat the real last-cooked date and skewed "Xd ago" + counts. Fixed by skipping meals with `m.date > today` (local yyyy-MM-dd) in DishLibraryScreen allDishes aggregation. (commit 98e6420)
- EXTRA-DISH-DELETE: Removing an added side from a home meal didn't persist — AddMealScreen only wrote `items` when >1 dish, so reducing to a single dish dropped the key and the merge-only Firestore/store update left the stale array; the removed dish reappeared on Home/Calendar. Fixed: home meals always persist `items` (len>0). (commit bdc7370)
- Added top-level README.md (overview, features, stack, architecture, setup/build). (commit 31e7057)
- Built release APK (assembleRelease), installed on device 57150DLCH002E1, merged PR #4 to main.

## Next Up
1. **Tomorrow: confirm read count dropped** in Firebase console (target: from ~2-3k/day toward a few hundred). If wife's install works + reads look good → green-light release path.
2. Merge PR #3 (site) + PR #4 (reads) to main.
3. Release path: Play **Internal testing** (instant Play install, up to 100 testers) OR closed beta (12 testers/14 days → production); org account w/ D-U-N-S skips the gate. Prep: data-safety form, store listing, signed AAB via EAS.
4. Reads Tier 3 (only before large histories / scaling): denormalized stats docs + optional ~12-mo load cap; enable Firebase App Check.
5. Backlog: NOTIF-DEEPLINK MVP2; icon/splash PNG regen; crash reporting (Sentry vs Crashlytics); deploy+verify Firestore/Storage rules in prod.

## Device-test findings — ALL FIXED (2026-07-09 pt3, phased, tsc=0/14 tests)
- DUPMEAL: Home now runs dedupeMeals on load + picks newest record per slot (matches Calendar/Plan) → no more Home/Calendar divergence.
- COLDBOOT: App.tsx loading gate now shows branded splash (Sofra logo circle + wordmark + tagline).
- LOADFLASH: Home "Today's meals" shows Skeleton placeholders during load instead of "No meal planned" flash.
- SIGNUP-LOGO: AuthScreen resets scroll to top on sign-in↔sign-up toggle (logo was clipped from retained offset).
- COPY-AI: "AI-powered weekly plans" → "Personalized weekly plans from your cooking history".
- DELIGHT: new Celebration.tsx (native-driver confetti burst) fires on Plan accept. (dish-rate omitted — confetti on every star tap = noisy.)
Pending: rebuild+install+device-verify, then commit to PR #2.
