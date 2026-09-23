import { describe, expect, it } from 'vitest';
import { detallsEsdeveniment, llocComplet } from './esdeveniment';

describe('llocComplet', () => {
  it('joins the venue and the town', () => {
    expect(llocComplet('Plaça del Vi', 'Girona')).toBe('Plaça del Vi, Girona');
  });

  it('keeps whichever half it has', () => {
    expect(llocComplet('Plaça del Vi', undefined)).toBe('Plaça del Vi');
    expect(llocComplet(undefined, 'Girona')).toBe('Girona');
  });

  it('is undefined when neither is known', () => {
    expect(llocComplet(undefined, undefined)).toBeUndefined();
  });
});

describe('detallsEsdeveniment', () => {
  it('reads time then place', () => {
    expect(detallsEsdeveniment('12:00', 'Plaça del Vi', 'Girona')).toBe('12:00 · Plaça del Vi, Girona');
  });

  it('leaves no stray separators when parts are missing', () => {
    expect(detallsEsdeveniment('12:00', undefined, undefined)).toBe('12:00');
    expect(detallsEsdeveniment(undefined, undefined, 'Girona')).toBe('Girona');
    expect(detallsEsdeveniment(undefined, undefined, undefined)).toBe('');
  });
});
