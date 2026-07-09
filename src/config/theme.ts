import { Easing } from 'react-native';

// ── Terracotta & Sage ──────────────────────────────────────────────
// Warm, appetite-positive, globally-safe (avoids appetite-suppressing blue,
// pure-red mourning connotations, and stark-white funeral connotations).
// Locked 2026-07-01 after cross-cultural + all-ages + food-color research.
// Light + Dark sets (dark decided IN for v1). Screens consume via useTheme();
// static `Colors` (= light) stays for screens not yet converted.
export const LightColors = {
  primary: '#C0532E',        // terracotta — brand signature
  primaryLight: '#D9764E',
  primaryDark: '#963C1E',

  home: '#5E8B6A',           // sage — home cooked
  homeLight: '#E7F0E9',
  takeout: '#E0A63C',        // amber — takeout
  takeoutLight: '#FBF2DF',
  dineout: '#C0532E',        // terracotta — dine out
  dineoutLight: '#F8E9E2',
  kids: '#4E7CB0',           // friendly blue — kids tiffin track
  kidsLight: '#E8F0F8',

  background: '#FBF7F2',     // warm paper
  surface: '#FFFFFF',
  surfaceVariant: '#F3EEE7',
  text: '#241E1B',           // warm near-black
  textSecondary: '#6E645C',
  textMuted: '#A79C93',
  border: '#EAE2D8',
  error: '#B23A2E',
  success: '#3E7C5A',
  warning: '#D89A2E',

  white: '#FFFFFF',
  black: '#000000',
};

// Dark variant — warm near-black surfaces, brighter accents for contrast.
export const DarkColors: typeof LightColors = {
  primary: '#E27A4E',
  primaryLight: '#EC9670',
  primaryDark: '#C0532E',

  home: '#7FB08D',
  homeLight: '#22302A',
  takeout: '#E9B65A',
  takeoutLight: '#332B1A',
  dineout: '#E27A4E',
  dineoutLight: '#331F17',
  kids: '#6E9BD0',           // friendly blue — kids tiffin track
  kidsLight: '#1E2A38',

  background: '#17130F',     // warm near-black
  surface: '#221C16',
  surfaceVariant: '#2E271F',
  text: '#F2EBE2',           // warm off-white
  textSecondary: '#B8ADA0',
  textMuted: '#877E73',
  border: '#3A332A',
  error: '#E4685C',
  success: '#7FB08D',
  warning: '#E9B65A',

  white: '#FFFFFF',
  black: '#000000',
};

export type ThemeColors = typeof LightColors;

// Backward-compat default (light). Converted screens use useTheme() instead.
export const Colors = LightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 11, // never below 11 for legibility
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ── Typography ─────────────────────────────────────────────────────
// Fraunces (warm serif) for display/headers + dish names only.
// Inter (sans) for body/UI — legibility for all ages. Family strings
// match the keys registered by useFonts() in App.tsx.
export const Fonts = {
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
};

export const Typography = {
  display: { fontFamily: Fonts.display },
  displayMedium: { fontFamily: Fonts.displayMedium },
  body: { fontFamily: Fonts.body },
  bodyMedium: { fontFamily: Fonts.bodyMedium },
  bodySemiBold: { fontFamily: Fonts.bodySemiBold },
} as const;

// ── Motion ─────────────────────────────────────────────────────────
// Central tokens so animations stay consistent (no magic numbers).
export const Motion = {
  duration: { fast: 120, base: 220, slow: 320 },
  easing: {
    out: Easing.out(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
  spring: { friction: 6, tension: 180 },
  stagger: 40, // ms between staggered list items
  pressScale: 0.97,
};

// ── Accessibility guardrails (all-generations, global) ─────────────
export const A11y = {
  minTouchTarget: 44, // px — Apple HIG / WCAG target size
  minTouchSpacing: 8,
  bodyContrast: '4.5:1',
  largeTextContrast: '3:1',
};

export const sourceTypeColor = (type: string) => {
  switch (type) {
    case 'home':
      return Colors.home;
    case 'takeout':
      return Colors.takeout;
    case 'dineout':
      return Colors.dineout;
    default:
      return Colors.textSecondary;
  }
};

export const sourceTypeLabel = (type: string) => {
  switch (type) {
    case 'home':
      return 'Home';
    case 'takeout':
      return 'Takeout';
    case 'dineout':
      return 'Dine Out';
    default:
      return type;
  }
};
