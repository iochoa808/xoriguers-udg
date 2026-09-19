import { describe, it, expect } from 'vitest';
import { isRealUrl } from './config';

describe('isRealUrl', () => {
  it('accepts a normal url', () => {
    expect(isRealUrl('https://instagram.com/xoriguersudg')).toBe(true);
  });

  it('rejects undefined', () => {
    expect(isRealUrl(undefined)).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isRealUrl('')).toBe(false);
  });

  it('rejects a bracketed CMS placeholder', () => {
    expect(isRealUrl('[URL del patrocinador]')).toBe(false);
    expect(isRealUrl('[URL DE LA BOTIGA DE MERCHANDISING]')).toBe(false);
  });
});
