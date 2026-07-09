import { sourceIcon, mealTypeIcon, cuisineIcon } from '../icons';

describe('icon helpers', () => {
  it('returns distinct icons per meal source', () => {
    expect(sourceIcon('home')).toBe('pot-steam');
    expect(sourceIcon('takeout')).toBe('shopping');
    expect(sourceIcon('dineout')).toBe('silverware-fork-knife');
    expect(sourceIcon('unknown')).toBeTruthy();
  });
  it('returns an icon for each meal type', () => {
    for (const t of ['breakfast', 'lunch', 'dinner', 'snack']) {
      expect(typeof mealTypeIcon(t)).toBe('string');
      expect(mealTypeIcon(t).length).toBeGreaterThan(0);
    }
  });
  it('maps cuisines case-insensitively with a default', () => {
    expect(cuisineIcon('Indian')).toBe('bowl-mix');
    expect(cuisineIcon('ITALIAN')).toBe('pizza');
    expect(cuisineIcon('Klingon')).toBe('food-variant');
  });
});
