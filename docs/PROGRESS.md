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

## Open PRs (2026-07-09)
- **PR #2 (MERGED)** — 14 UX/device-test fixes (dish labels, all-dishes cards, image share, kids-weekends, breakfast fixes, dedupe, splash, skeletons, celebration).
- **PR #3 (open)** — GitHub Pages site: 9-screen gallery + 7-screen guide (login/register/celebration) + status-bar-cropped clean screenshots + share = card-only. Pages serves main/docs; merge to publish.
- **PR #4 (open)** — Firestore read reduction (this session).

## Last Session — Firestore read reduction (branch reads-cache-first / PR #4)
Meals + dishes now **cache-first single-source**: load ALL once per household/session, every screen filters in memory, writes update memory locally (same-phone edits show instantly everywhere, 0 reads), re-read only on pull-to-refresh or household change. Removed 20s TTL + write-invalidation; coalesced concurrent loads; App.tsx warms caches at startup. No onSnapshot by design (user OK with cross-device refresh). New useMealStore.test.ts (5 tests) locks it. tsc=0, 19/19 Jest. Effect: ~2-3k reads/day → ~1 getAllMeals+getDishes per launch/refresh, flat. Built RELEASE APK (assembleRelease, standalone) + installed on device 57150DLCH002E1; copied to C:\Users\samee\Downloads\Sofra-beta.apk for Sameer to share with wife via Google Drive (chose private Drive over a public GitHub release). PAUSED: Sameer monitors Firebase read count tomorrow (2026-07-11) to confirm the drop; if good → move to release.

## Bug fixes (2026-07-10, branch reads-cache-first, tsc=0)
- FUTURE-DISH-STAT: DishLibrary "unique dishes" derived `lastCookedDate` as the MAX of ALL meal dates incl. future-planned ones, so an upcoming dish (e.g. Upma next Sunday) beat the real last-cooked date and skewed "Xd ago" + counts. Fixed by skipping meals with `m.date > today` (local yyyy-MM-dd) in DishLibraryScreen allDishes aggregation. (commit 98e6420)
- EXTRA-DISH-DELETE: Removing an added side from a home meal didn't persist — AddMealScreen only wrote `items` when >1 dish, so reducing to a single dish dropped the key and the merge-only Firestore/store update left the stale array; the removed dish reappeared on Home/Calendar. Fixed: home meals always persist `items` (len>0). (commit bdc7370)
- Added top-level README.md (overview, features, stack, architecture, setup/build). (commit 31e7057)
- IN PROGRESS this session: building release APK (assembleRelease) → install on device 57150DLCH002E1 → push branch → open PR → merge to main.

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

## Next Up
1. Merge PR #2.
2. NOTIF-DEEPLINK-1/2 (MVP2) — notification tap → focused card.
3. Regenerate icon/splash PNG art (old purple branding).
4. Crash reporting decision (Sentry vs Crashlytics) + keys.
5. Compliance: privacy/terms review, store data-safety, version bump, EAS submit; deploy+verify rules in prod.

## 4b / delight status (verified in code+device 2026-07-09)
Notifications DONE (daily/weekly/monthly local reminders live in Settings). Charts/visualization DONE (chart-kit Spending Trend + custom bars). Motion DONE (motion.tsx used across 11 screens). Icons DONE (MaterialCommunityIcons + cuisine/meal/source via icons.ts). OPEN: micro-celebration (confetti on plan-accept/dish-rate) not built; full skeleton-loader coverage.
