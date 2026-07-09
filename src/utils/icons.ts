// MaterialCommunityIcons names for meal sources, meal types, and cuisines.
// Keep to well-known icon names (invalid names render blank).

export const sourceIcon = (type: string): string => {
  switch (type) {
    case 'home':
      return 'pot-steam';
    case 'takeout':
      return 'shopping';
    case 'dineout':
      return 'silverware-fork-knife';
    default:
      return 'food';
  }
};

export const mealTypeIcon = (type: string): string => {
  switch (type) {
    case 'breakfast':
      return 'coffee';
    case 'lunch':
      return 'white-balance-sunny';
    case 'dinner':
      return 'weather-night';
    case 'snack':
      return 'cookie';
    default:
      return 'silverware-fork-knife';
  }
};

export const cuisineIcon = (cuisine: string): string => {
  const c = (cuisine || '').toLowerCase();
  if (c.includes('indian')) return 'bowl-mix';
  if (c.includes('chinese') || c.includes('thai') || c.includes('vietnam')) return 'noodles';
  if (c.includes('ital')) return 'pizza';
  if (c.includes('mexic')) return 'chili-mild';
  if (c.includes('american')) return 'hamburger';
  if (c.includes('japan') || c.includes('korea')) return 'rice';
  if (c.includes('french')) return 'food-croissant';
  return 'food-variant';
};
