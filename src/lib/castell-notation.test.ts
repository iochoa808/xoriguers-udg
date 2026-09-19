import { describe, it, expect } from 'vitest';
import { floors } from './castell-notation';

describe('floors', () => {
  it('reads the floor count from a plain notation', () => {
    expect(floors('4d8')).toBe(8);
    expect(floors('3d7s')).toBe(7);
  });

  it('reads the floor count when a pillar/folre letter precedes the d', () => {
    expect(floors('Pd7fm')).toBe(7);
    expect(floors('Td8fm')).toBe(8);
    expect(floors('Vd6f')).toBe(6);
  });

  it('is case-insensitive on the "d" separator', () => {
    expect(floors('4D8')).toBe(8);
  });

  it('takes the first castell in a combined/colla-doble notation', () => {
    expect(floors('3d7+4d7')).toBe(7);
  });

  it('returns 0 when there is no recognizable floor count', () => {
    expect(floors('pinya')).toBe(0);
    expect(floors('')).toBe(0);
  });
});
