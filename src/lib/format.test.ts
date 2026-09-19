import { describe, it, expect } from 'vitest';
import { formatDate, formatDateShort, formatDayMonth } from './format';

describe('formatDate', () => {
  it('formats a date in long Catalan form', () => {
    expect(formatDate(new Date(2026, 2, 5))).toBe('5 de març del 2026');
  });
});

describe('formatDateShort', () => {
  it('formats a date with an abbreviated month', () => {
    expect(formatDateShort(new Date(2026, 8, 5))).toBe('5 de set. del 2026');
  });
});

describe('formatDayMonth', () => {
  it('formats a short upper-cased day/month for the hero card', () => {
    expect(formatDayMonth(new Date(2026, 2, 5))).toBe('5 DE MARÇ');
  });
});
