export const Colors = {
  primary: '#534AB7',
  primaryLight: '#7B74D1',
  primaryDark: '#3D3590',

  home: '#1D9E75',
  homeLight: '#E8F7F1',
  takeout: '#EF9F27',
  takeoutLight: '#FFF4E0',
  dineout: '#D85A30',
  dineoutLight: '#FDECE6',

  background: '#F5F5FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F0EFF5',
  text: '#1A1A2E',
  textSecondary: '#6B6B80',
  textMuted: '#9E9EB0',
  border: '#E0E0EC',
  error: '#D32F2F',
  success: '#2E7D32',
  warning: '#F9A825',

  white: '#FFFFFF',
  black: '#000000',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
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
