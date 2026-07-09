# Sofra — Test Matrix

Maps coverage across the 6 testing pillars. Run automated tests with `npm test`.

Last run: 4 suites, **13 passed / 0 failed**.

## Pillar coverage summary

| # | Pillar | Automated | Manual | Deferred |
|---|--------|-----------|--------|----------|
| 1 | Basic functions | ✅ core logic | ✅ flows | — |
| 2 | UI glitches | — | ✅ | E2E (Detox) deferred |
| 3 | Regression | ✅ on each run | ✅ | — |
| 4 | Load | — | ✅ | perf harness deferred |
| 5 | Edge cases | ✅ | ✅ | — |
| 6 | Negative | ✅ validation | ✅ | — |

## Automated tests (Jest — `src/**/__tests__`)

| Suite | Cases | Pillars | Status |
|-------|-------|---------|--------|
| `utils/text` (toTitleCase) | 4 | Basic, Edge | ✅ pass |
| `utils/currency` (getCurrencySymbol) | 2 | Basic, Negative (unknown code) | ✅ pass |
| `utils/icons` (source/mealType/cuisine) | 3 | Basic, Edge (unknown → default) | ✅ pass |
| `services/planner` (generateMealPlan) | 4 | Basic, Edge, Regression | ✅ pass |
| ↳ one entry per day, slots filled | | Basic | ✅ |
| ↳ kids track omitted when off | | Regression (kids opt-in) | ✅ |
| ↳ kids tiffin generated from history | | Basic (MVP1 feature) | ✅ |
| ↳ avoids dishes within avoidRepeatDays | | Edge | ✅ |

## Verified by structured review + on-device (this session)

| Area | Pillar | Result |
|------|--------|--------|
| Dark-mode across all screens (Paper/Nav/StatusBar theme) | UI glitches | ✅ fixed root cause |
| Range selectors single-line segmented control | UI glitches | ✅ |
| Restaurants "All" compact list at scale (100s) | Load | ✅ virtualized list |
| Insights "All" range with 0 meals | Edge | ✅ empty state |
| Multi-dish save + per-dish rating → restaurant | Basic | ✅ |
| Kids tiffin excluded from family metrics/insights | Regression | ✅ |
| `dedupeMeals` keyed by audience (no kids data loss) | Regression | ✅ fixed |
| Dine-out dish optional; home dish required | Negative | ✅ validation |
| Auth email-format validation | Negative | ✅ |
| Reads cache guard + force on pull-to-refresh | Load | ✅ |

## Deferred (with reason)

| Item | Why deferred |
|------|--------------|
| Component render tests (React Native Testing Library) | `jest-expo` preset conflicts with installed jest; pure-logic tests cover the risk-bearing code. Revisit when upgrading Expo/jest. |
| E2E flows (Detox) | Requires native test build + device farm; out of scope for MVP1. |
| Load/perf harness (large history, 100+ restaurants) | Manually validated via the compact-list design; automated perf profiling is post-launch. |
| Store/service integration tests | Would require mocking the Firebase SDK; deferred until a mock layer is added. |

## How to extend

Add `*.test.ts` files under any `__tests__/` folder. Keep tests to pure logic
(no `react-native` imports) so they run under the lean node config in
`package.json` › `jest`.
