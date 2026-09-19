import { describe, it, expect } from 'vitest';
import { buildMailto } from './mailto';

describe('buildMailto', () => {
  it('includes the size in subject and body when given one', () => {
    const href = buildMailto('botiga@xoriguers.udg.cat', 'Samarreta negra', 'M');
    expect(href).toBe(
      'mailto:botiga@xoriguers.udg.cat?subject=Reserva%3A%20Samarreta%20negra%20(Talla%20M)&body=Hola%2C%0A%0AVoldria%20reservar%20aquest%20article%3A%0A%0A-%20Article%3A%20Samarreta%20negra%0A-%20Talla%3A%20M%0A%0AGr%C3%A0cies!'
    );
  });

  it('omits the size when none is given', () => {
    const href = buildMailto('botiga@xoriguers.udg.cat', 'Escut');
    expect(href).toContain('subject=Reserva%3A%20Escut&');
    expect(href).not.toContain('Talla');
  });

  it('always targets the given email address', () => {
    const href = buildMailto('altra@xoriguers.udg.cat', 'Escut');
    expect(href.startsWith('mailto:altra@xoriguers.udg.cat?')).toBe(true);
  });
});
