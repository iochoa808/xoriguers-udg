import { describe, it, expect } from 'vitest';
import { mediaUrl, isUploadedPath } from './media';

describe('mediaUrl', () => {
  it('returns undefined when there is no path', () => {
    expect(mediaUrl('/xoriguers-udg/', undefined)).toBeUndefined();
    expect(mediaUrl('/xoriguers-udg/', '')).toBeUndefined();
  });

  it('joins the base and an uploaded path without doubling the slash', () => {
    expect(mediaUrl('/xoriguers-udg/', '/images/uploads/foo.jpg')).toBe(
      '/xoriguers-udg/images/uploads/foo.jpg'
    );
  });

  it('respects a root base', () => {
    expect(mediaUrl('/', '/images/uploads/foo.jpg')).toBe('/images/uploads/foo.jpg');
  });
});

describe('isUploadedPath', () => {
  it('treats a leading-slash path as uploaded', () => {
    expect(isUploadedPath('/images/uploads/foo.jpg')).toBe(true);
  });

  it('treats a bracket placeholder as not uploaded', () => {
    expect(isUploadedPath('[Nom del patrocinador]')).toBe(false);
  });
});
