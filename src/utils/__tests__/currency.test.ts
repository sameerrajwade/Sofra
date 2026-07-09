import { getCurrencySymbol } from '../currency';

describe('getCurrencySymbol', () => {
  it('maps known currencies to symbols', () => {
    expect(getCurrencySymbol('INR')).toBe('₹');
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('EUR')).toBe('€');
  });
  it('falls back to the code for unknown currencies', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ');
  });
});
