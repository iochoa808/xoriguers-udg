import { describe, expect, it } from 'vitest';
import { classificaEsdeveniment, detallsEsdeveniment, llocComplet, temporadaDe } from './esdeveniment';

describe('classificaEsdeveniment', () => {
  it('reads the calendar\'s own naming', () => {
    expect(classificaEsdeveniment('ASSAIG')).toBe('Assaig');
    expect(classificaEsdeveniment('ACTUACIÓ RESA')).toBe('Actuacio');
  });

  it('reads the registre històric\'s naming', () => {
    expect(classificaEsdeveniment('Diada hivern Xoriguers')).toBe('Diada');
    expect(classificaEsdeveniment('Actuació viatge Logroño')).toBe('Actuacio');
    expect(classificaEsdeveniment('Trobada Interiuta')).toBe('Trobada');
  });

  it('never files a practice as a performance', () => {
    expect(classificaEsdeveniment('Assaig obert de primavera')).toBe('Assaig');
    expect(classificaEsdeveniment("Assajos d'estiu")).toBe('Assaig');
  });

  it('falls back to an actuació for names that say nothing', () => {
    expect(classificaEsdeveniment('Aniverfest')).toBe('Actuacio');
    expect(classificaEsdeveniment("Colles de l'eix")).toBe('Actuacio');
  });
});

describe('temporadaDe', () => {
  const at = (iso: string) => temporadaDe(new Date(iso));

  it('starts a season in September', () => {
    expect(at('2025-09-25')).toBe('2025-2026');
    expect(at('2025-08-31')).toBe('2024-2025');
  });

  it('keeps the spring on the season that began the autumn before', () => {
    expect(at('2026-05-28')).toBe('2025-2026');
    expect(at('2023-06-17')).toBe('2022-2023');
  });
});

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
