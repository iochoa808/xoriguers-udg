import { describe, expect, it } from 'vitest';
import { idCalendari, urlEmbedMensual, urlFeedIcal } from './calendari';

const EMBED =
  'https://calendar.google.com/calendar/embed?src=abc123%40group.calendar.google.com&ctz=Europe%2FMadrid';

describe('idCalendari', () => {
  it('reads the calendar address out of the embed URL', () => {
    expect(idCalendari(EMBED)).toBe('abc123@group.calendar.google.com');
  });

  it('is undefined for anything that is not a calendar URL', () => {
    expect(idCalendari('[URL DEL CALENDARI]')).toBeUndefined();
    expect(idCalendari('https://example.com/')).toBeUndefined();
    expect(idCalendari(undefined)).toBeUndefined();
    expect(idCalendari('')).toBeUndefined();
  });
});

describe('urlFeedIcal', () => {
  it('builds the public ICS feed', () => {
    expect(urlFeedIcal(EMBED)).toBe(
      'https://calendar.google.com/calendar/ical/abc123%40group.calendar.google.com/public/basic.ics'
    );
  });

  it('is undefined when there is no calendar to read', () => {
    expect(urlFeedIcal('[URL DEL CALENDARI]')).toBeUndefined();
  });
});

describe('urlEmbedMensual', () => {
  const params = (url: string) => new URL(url).searchParams;

  it('asks for a month grid with Google\'s furniture removed', () => {
    const p = params(urlEmbedMensual(EMBED)!);
    expect(p.get('mode')).toBe('MONTH');
    expect(p.get('showTitle')).toBe('0');
    expect(p.get('showTabs')).toBe('0');
    expect(p.get('showCalendars')).toBe('0');
    expect(p.get('showTz')).toBe('0');
    // but you still need to be able to move between months
    expect(p.get('showNav')).toBe('1');
    expect(p.get('showDate')).toBe('1');
  });

  it('starts the week on Monday and speaks Catalan', () => {
    const p = params(urlEmbedMensual(EMBED)!);
    expect(p.get('wkst')).toBe('2');
    expect(p.get('hl')).toBe('ca');
  });

  it('keeps the calendar and its timezone', () => {
    const p = params(urlEmbedMensual(EMBED)!);
    expect(p.get('src')).toBe('abc123@group.calendar.google.com');
    expect(p.get('ctz')).toBe('Europe/Madrid');
  });

  it('assumes Madrid when the URL names no timezone', () => {
    const p = params(urlEmbedMensual('https://calendar.google.com/calendar/embed?src=x%40y.com')!);
    expect(p.get('ctz')).toBe('Europe/Madrid');
  });

  it('overrides display options already in the pasted URL', () => {
    const p = params(urlEmbedMensual(EMBED + '&mode=AGENDA&showTitle=1')!);
    expect(p.get('mode')).toBe('MONTH');
    expect(p.get('showTitle')).toBe('0');
  });

  it('is undefined when the field holds a placeholder', () => {
    expect(urlEmbedMensual('[URL DEL CALENDARI]')).toBeUndefined();
    expect(urlEmbedMensual(undefined)).toBeUndefined();
  });
});
