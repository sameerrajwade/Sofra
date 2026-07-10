# Sofra — Progress

## Current State
Family meal-planning app (React Native / Expo + Firebase, TypeScript), rebranded ThaliPlan → Sofra. Pre-launch overhaul near-done: Terracotta & Sage theme (light/dark/auto), Fraunces/Inter, motion, all screens dark-aware. MVP1 includes multi-dish + per-dish ratings, kids-tiffin planning, local notifications (daily/weekly/monthly), Insights charts. 14 Jest tests pass (`npm test`), tsc=0. Active branch `ux-improvements-jul9` → PR #2 (open, unmerged).

## Constraints
- Repo: github.com/sameerrajwade/Sofra. Package id `com.thaliplan.app` must NOT change (Firebase-linked).
- Never handle signing/keystore passwords — Sameer signs. Release APK is debug-signed (template config).
- Motion = built-in RN Animated only (no Reanimated). Paywall/monetization DEFERRED.
- Develop → test → show results → only then build/deliver.

## Last Session
Shipped 14 UX/device-test fixes (tsc=0, 14/14 Jest), built + installed the release APK on device 57150DLCH002E1, verified ALL on-device incl. the confetti Celebration. Pushed to PR #2 (commit 49868cc, unmerged). Then updated the GitHub Pages site (docs/): added Sign in / Register / Celebration to the guide's screen-by-screen; expanded the homepage gallery to 9 captioned screens; swapped the share image to the card-only modal (no personal contacts); and CROPPED the phone status bar (time + notification icons) off every published screenshot via sharp (top 150px → 1280x2706) so no personal info shows. Persistent screenshot archive lives in docs/screens/ (22 files + README); web assets in docs/assets/screens/. Site changes are LOCAL/uncommitted; publish needs a commit+push.

## Next Up
1. Merge PR #2.
2. (Optional) copy keeper screenshots to a permanent folder; delete the 3 personal ones.
3. NOTIF-DEEPLINK-1/2 (MVP2): notification tap → focused card, not tab.
4. Regenerate icon/splash PNG art (old purple branding); crash reporting decision (Sentry vs Crashlytics) + keys.
5. Compliance: privacy/terms review, store data-safety, version bump, EAS submit; deploy+verify Firestore/Storage rules in prod.
