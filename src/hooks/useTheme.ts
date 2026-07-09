import { LightColors, DarkColors, ThemeColors } from '../config/theme';
import { useThemeStore } from '../stores/useThemeStore';

export interface Theme {
  colors: ThemeColors;
  scheme: 'light' | 'dark';
  isDark: boolean;
}

// Resolves the active palette from the chosen mode + the OS color scheme.
// Screens read `const { colors } = useTheme()` instead of importing static Colors,
// which makes them dark-aware.
export function useTheme(): Theme {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useThemeStore((s) => s.systemScheme);
  const scheme = mode === 'auto' ? systemScheme : mode;
  return {
    colors: scheme === 'dark' ? DarkColors : LightColors,
    scheme,
    isDark: scheme === 'dark',
  };
}

export default useTheme;
