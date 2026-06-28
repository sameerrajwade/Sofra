# TEST RESULTS: Auth, Onboarding, Household, Profile

**Agent:** Test Agent 1 of 3
**Date:** 2026-06-27
**Scope:** AuthScreen, ProfileScreen, auth service, firestore service, stores, navigation

---

## Auth Flows

### 1. Email registration with valid data
**Result: PASS**
Flow: `AuthScreen.handleSubmit` -> `useAuthStore.signUp` -> `authService.signUpWithEmail` -> `createUserProfile` -> sets user in store -> `AppNavigator` reads `isAuthenticated=true` -> navigates to Main tabs.

### 2. Email registration with empty name
**Result: PASS**
`AuthScreen.validate()` line 55: checks `mode === 'signUp' && !name.trim()` and sets localError "Name is required."

### 3. Email registration with invalid email
**Result: ISSUE**
No client-side email format validation exists. `validate()` only checks for empty email/password. Invalid emails (e.g. "abc") are sent to Firebase, which will return a `auth/invalid-email` error. This works but shows a raw Firebase error message like "Firebase: Error (auth/invalid-email)." instead of a user-friendly message.
- **File:** `src/screens/AuthScreen.tsx`, `validate()` line 50-64
- **Fix:** Add email regex validation in `validate()`:
  ```
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    setLocalError('Please enter a valid email address.');
    return false;
  }
  ```

### 4. Email registration with short password
**Result: PASS**
`validate()` line 59: checks `password.length < 6` and sets localError.

### 5. Email registration with existing email
**Result: ISSUE**
Firebase returns `auth/email-already-in-use` error. The raw Firebase error message is displayed via `useAuthStore` error state. Not user-friendly.
- **File:** `src/stores/useAuthStore.ts`, `signUp` line 68-85
- **Fix:** Add error message mapping in the catch block:
  ```
  const msg = e.code === 'auth/email-already-in-use'
    ? 'An account with this email already exists.'
    : e.message;
  set({ error: msg, isLoading: false });
  ```

### 6. Email sign-in with correct credentials
**Result: ISSUE**
Flow works: `signIn` -> `signInWithEmail` -> `getUserProfile` -> sets user. However, if the user profile doc doesn't exist in Firestore (e.g. created before profile creation was added), `getUserProfile` returns `null`, and the store sets `user: null, isAuthenticated: true`. This breaks the app -- `isAuthenticated` is true but `user` is null.
- **File:** `src/stores/useAuthStore.ts`, `signIn` line 53-65
- **Fix:** After `getUserProfile`, if profile is null, create one from the firebaseUser:
  ```
  if (!profile) {
    profile = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      avatarUrl: firebaseUser.photoURL || null,
      householdId: null,
      createdAt: new Date(),
    };
    await createUserProfile(profile);
  }
  set({ user: profile, isAuthenticated: !!profile, isLoading: false });
  ```

### 7. Email sign-in with wrong password
**Result: ISSUE**
Works functionally -- Firebase returns error, caught in store. Same raw error message problem as test 5.
- **File:** `src/stores/useAuthStore.ts`, `signIn` catch block
- **Fix:** Map `auth/wrong-password` and `auth/invalid-credential` to friendly messages.

### 8. Email sign-in with non-existent email
**Result: ISSUE**
Same as test 7. Firebase `auth/user-not-found` error shown raw.

### 9. Google sign-in
**Result: PASS**
`webClientId` is set in `src/services/auth.ts` line 16. Flow: `GoogleSignin.signIn()` -> get idToken -> `signInWithCredential` -> store checks for existing profile, creates if missing. Properly handles first-time and returning Google users.

### 10. Password reset
**Result: PASS**
`handleForgotPassword` checks for empty email first (line 95-98), then calls `resetPassword` which calls `sendPasswordResetEmail`. Success message shown via `resetSent` state.

### 11. Sign out
**Result: FAIL**
`useAuthStore.signOut` clears auth state (user, preferences, isAuthenticated). But `useHouseholdStore` is **never cleared** on sign out. If another user signs in on the same device, they see the previous user's household data until it's overwritten.
- **File:** `src/stores/useAuthStore.ts`, `signOut` line 87-95
- **Fix:** Import and call `useHouseholdStore.getState().clear()` in the signOut function:
  ```
  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      useHouseholdStore.getState().clear();
      set({ user: null, preferences: null, isAuthenticated: false, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },
  ```

### 12. App restart after login - session restore
**Result: PASS**
`firebase.ts` line 19: `initializeAuth` uses `getReactNativePersistence(AsyncStorage)`. On restart, `App.tsx` `onAuthStateChanged` fires with the persisted user, fetches profile from Firestore, and sets user in store.

### 13. Toggle between Sign In and Register
**Result: PASS**
`toggleMode` (line 43-48) switches mode, clears errors, resets `resetSent`. Name and household fields conditionally render based on mode.

---

## Household Flows

### 14. New user with no household
**Result: ISSUE**
There is **no dedicated prompt or screen** to create a household for new users. After registration, user lands on Home tab. The only way to create a household is if they provided a household name during registration (optional field in AuthScreen). ProfileScreen shows "No household set up." text but no action button to create one.
- **File:** `src/screens/ProfileScreen.tsx` line 221
- **Fix:** Add a "Create Household" button next to the "No household set up." text, and/or add a setup flow after first registration.

### 15. Create household with name (during registration)
**Result: ISSUE**
`AuthScreen.handleSubmit` lines 74-83: After `signUp`, it reads `useAuthStore.getState().user` to get the user. However, `signUp` is async and the `await signUp(...)` call at line 73 finishes before the household creation code runs. The issue: `signUp` in the store sets the user, but the `onAuthStateChanged` listener in `App.tsx` may overwrite the user (race condition). More critically, `createHousehold` in firestore.ts updates the user's `householdId` in Firestore (line 219) but the local auth store user still has `householdId: null` because `signUp` set it that way and `createHousehold` does not update the auth store.
- **File:** `src/screens/AuthScreen.tsx` lines 74-83, `src/services/firestore.ts` `createHousehold`
- **Fix:** After `createHousehold` succeeds, update the auth store user:
  ```
  const householdId = await createHousehold(householdName.trim(), user.id);
  useAuthStore.getState().setUser({ ...user, householdId });
  ```

### 16. After creating household - all screens accessible
**Result: ISSUE**
Screens are always accessible (no guard blocking access without household). However, screens that depend on `householdId` (Home, Calendar, Plan, Insights) will show empty data or errors if `householdId` is null in the auth store even though it exists in Firestore. Related to bug in test 15.

### 17. Join household with invite code
**Result: ISSUE**
`useHouseholdStore.joinHousehold` exists and works correctly (fetches household, updates members, syncs auth store). However, there is **no UI anywhere** to enter an invite code and trigger this flow. No join screen, no input field, no deep link handler.
- **File:** Missing UI component
- **Fix:** Add an "Enter Invite Code" button and text input in ProfileScreen under the "No household set up." section, or create a dedicated JoinHouseholdScreen.

### 18. Household shows in profile
**Result: PASS**
`ProfileScreen` lines 178-219: Shows household name, member list with avatars, admin badge ("Admin" vs "Member" based on `member.id === household.adminId`), and "You" badge for current user.

### 19. Invite family member
**Result: PASS**
`ProfileScreen` line 208-215: Shows invite code in a button. Tapping shows an Alert with the code. However, there's no copy-to-clipboard or share functionality for the invite code -- only an Alert.
- **Improvement:** Use `Share.share()` or `Clipboard` API to let users easily share the code.

---

## Profile Flows

### 20. View profile
**Result: PASS**
Shows user name, email, avatar (via AvatarPicker), household info, preferences. All data sourced from auth store and household store.

### 21. Change avatar (upload photo)
**Result: FAIL**
`AvatarPicker` uses `react-native-image-picker` to get a local file URI. `ProfileScreen.handleAvatarChange` (line 123-134) calls `updateUserProfile(user.id, { avatarUrl: uri })` which saves the **local file URI** to Firestore. This URI is only valid on the current device and session. The `storage.ts` service has `uploadProfilePicture` that uploads to Firebase Storage and returns a download URL, but it is **never called**.
- **File:** `src/screens/ProfileScreen.tsx` line 127, `src/services/storage.ts`
- **Fix:** Upload to Firebase Storage first, then save the download URL:
  ```
  import { uploadProfilePicture } from '../services/storage';
  
  const handleAvatarChange = useCallback(async (uri: string | null) => {
    if (!user) return;
    try {
      let finalUrl = uri;
      if (uri) {
        finalUrl = await uploadProfilePicture(user.id, uri);
      }
      await updateUserProfile(user.id, { avatarUrl: finalUrl });
      useAuthStore.getState().setUser({ ...user, avatarUrl: finalUrl });
    } catch {
      Alert.alert('Error', 'Could not update avatar.');
    }
  }, [user]);
  ```

### 22. Change avatar (pick preset/initials)
**Result: PASS**
`AvatarPicker` "Initials" button calls `onSelect(null)`. `handleAvatarChange` saves `avatarUrl: null` to Firestore and updates auth store. UI immediately shows initials circle.

### 23. Edit monthly budget
**Result: ISSUE**
`ProfileScreen` line 251-255: `onChangeText` strips non-numeric chars and parses. When value is `0` (after erasing all digits), it saves `0`. The issue: every keystroke triggers `updatePreferences` which does a Firestore write. No debounce. Typing "500" triggers 3 Firestore writes (5, 50, 500).
- **File:** `src/screens/ProfileScreen.tsx` lines 251-255
- **Fix:** Add debouncing. Update local state immediately but debounce the Firestore write:
  ```
  const [budgetText, setBudgetText] = useState('');
  // Use a debounced version of updatePreferences for the budget field
  ```

### 24. Change currency
**Result: PASS**
Currency menu (line 293-315) calls `updatePreferences({ currency: c })`. Local state updated immediately, Firestore write follows. Currency symbol used via `getCurrencySymbol()`. Other screens would need to read from the same preferences source to reflect the change.

### 25. Change dish rotation reminder
**Result: PASS**
Rotation menu (line 266-289) calls `updatePreferences({ dishRotationDays: d })`. Updates local state and Firestore.

### 26. Change auto-plan rules
**Result: PASS**
Max dine-outs (line 327-349) and avoid-repeat (line 351-375) menus both call `updatePreferences` correctly. Include-new-dishes switch (line 379-385) also works.

### 27. Default meals toggle
**Result: PASS**
`toggleMealType` (line 112-120) adds/removes meal types from array and calls `updatePreferences`. Local state updates immediately.

### 28. Sign out from profile
**Result: FAIL**
Same bug as test 11. `handleSignOut` -> `signOut` clears auth store but not household store. Additionally, `App.tsx` `onAuthStateChanged` will fire with `null` user and call `setUser(null)`, which is redundant but harmless. The household store leak is the real bug.

---

## State Consistency

### 29. Profile changes reflect without restart
**Result: PASS (with caveats)**
Profile preferences: local state in `ProfileScreen` is updated immediately via `setPreferences`. Auth store avatar is updated immediately via `setUser`. However, the household store's `updatePreferences` call in `ProfileScreen` line 102 does a **second** Firestore write (preferences are written twice -- once in `updateUserPreferences` and once in `householdUpdatePreferences` which also calls `updateUserPreferences`). This is a double-write bug.
- **File:** `src/screens/ProfileScreen.tsx` line 99-102, `src/stores/useHouseholdStore.ts` `updatePreferences` line 107-118
- **Fix:** `householdUpdatePreferences` should only update the local store state, not write to Firestore again. Change `ProfileScreen.updatePreferences`:
  ```
  // Only sync to household store's local state, don't write to Firestore again
  set((state) => ({
    preferences: state.preferences ? { ...state.preferences, ...prefs } : (prefs as UserPreferences),
  }));
  ```
  Or remove the `householdUpdatePreferences` call from ProfileScreen and just update the local household store state directly.

### 30. Auth store, household store, and Firestore in sync
**Result: FAIL**
Multiple sync issues identified:
1. **Sign-out** does not clear household store (tests 11, 28)
2. **Household creation during registration** does not sync `householdId` to auth store (test 15)
3. **Avatar upload** saves local URI instead of Storage URL to Firestore (test 21)
4. **Sign-in with missing profile** sets `isAuthenticated: true` but `user: null` (test 6)
5. **Preferences double-write** to Firestore (test 29)

---

## Summary

| Status | Count |
|--------|-------|
| PASS   | 16    |
| FAIL   | 4     |
| ISSUE  | 10    |

### Critical Bugs (FAIL)
1. **Sign-out does not clear household store** -- data leak between users
2. **Avatar saves local URI to Firestore** -- breaks on other devices/sessions
3. **Sign-in with orphan Firebase account** -- `isAuthenticated=true` with `null` user crashes app
4. **Preferences double-written to Firestore** -- unnecessary writes, potential race conditions

### Important Issues
1. No email format validation (raw Firebase errors shown)
2. No Firebase error message mapping (all auth errors shown raw)
3. No UI to join household via invite code
4. No UI to create household post-registration
5. Household creation during signup doesn't sync `householdId` to local store
6. Budget input fires Firestore write on every keystroke (no debounce)
