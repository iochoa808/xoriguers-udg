import { describe, it, expect } from 'vitest';
import { formatDate, formatDateNumeric, formatDateShort, formatDayMonth } from './format';

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

describe('formatDateNumeric', () => {
  it('writes a date the compact way the registre does', () => {
    expect(formatDateNumeric(new Date('2026-05-28'))).toBe('28/05/2026');
    expect(formatDateNumeric(new Date('1999-12-02'))).toBe('02/12/1999');
  });

  it('reads the date in UTC, so it cannot slip a day on another machine', () => {
    expect(formatDateNumeric(new Date('2026-01-01T00:00:00Z'))).toBe('01/01/2026');
  });
});
