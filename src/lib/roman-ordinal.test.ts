import { describe, it, expect } from 'vitest';
import { toRoman, toRomanOrdinal } from './roman-ordinal';

describe('toRoman', () => {
  it('converts small values', () => {
    expect(toRoman(1)).toBe('I');
    expect(toRoman(4)).toBe('IV');
    expect(toRoman(9)).toBe('IX');
  });

  it('converts values used for colla seasons', () => {
    expect(toRoman(27)).toBe('XXVII');
    expect(toRoman(28)).toBe('XXVIII');
    expect(toRoman(29)).toBe('XXIX');
    expect(toRoman(40)).toBe('XL');
  });
});

describe('toRomanOrdinal', () => {
  it('appends the Catalan ordinal suffix used across the site', () => {
    expect(toRomanOrdinal(29)).toBe('XXIXè');
    expect(toRomanOrdinal(28)).toBe('XXVIIIè');
    expect(toRomanOrdinal(1)).toBe('Iè');
  });
});
