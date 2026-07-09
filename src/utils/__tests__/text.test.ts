import { toTitleCase } from '../text';

describe('toTitleCase', () => {
  it('capitalizes each word', () => {
    expect(toTitleCase('dal rice')).toBe('Dal Rice');
  });
  it('normalizes mixed case', () => {
    expect(toTitleCase('pANEER TIKKA')).toBe('Paneer Tikka');
  });
  it('handles empty/whitespace input', () => {
    expect(toTitleCase('')).toBe('');
  });
  it('leaves single words correct', () => {
    expect(toTitleCase('poha')).toBe('Poha');
  });
});
