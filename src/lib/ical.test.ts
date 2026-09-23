import { describe, expect, it } from 'vitest';
import { parseIcal } from './ical';

const envolta = (...events: string[]) =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events, 'END:VCALENDAR'].join('\r\n');

const event = (...lines: string[]) => ['BEGIN:VEVENT', ...lines, 'END:VEVENT'].join('\r\n');

describe('parseIcal', () => {
  it('reads a zoned start as the wall-clock time it already is', () => {
    const [e] = parseIcal(
      envolta(
        event(
          'DTSTART;TZID=Europe/Madrid:20260922T123000',
          'UID:abc@google.com',
          'SUMMARY:ASSAIG'
        )
      )
    );
    expect(e).toMatchObject({ uid: 'abc@google.com', resum: 'ASSAIG', data: '2026-09-22', hora: '12:30' });
  });

  it('converts a UTC start into Madrid time', () => {
    // 16:30Z in September is 18:30 in Madrid
    const [e] = parseIcal(
      envolta(event('DTSTART:20260924T163000Z', 'UID:b@google.com', 'SUMMARY:ACTUACIÓ RESA'))
    );
    expect(e.data).toBe('2026-09-24');
    expect(e.hora).toBe('18:30');
  });

  it('rolls a late UTC start onto the next Madrid day', () => {
    const [e] = parseIcal(
      envolta(event('DTSTART:20260924T230000Z', 'UID:c@google.com', 'SUMMARY:Sopar'))
    );
    expect(e.data).toBe('2026-09-25');
    expect(e.hora).toBe('01:00');
  });

  it('reads an all-day event as a date with no time', () => {
    const [e] = parseIcal(
      envolta(event('DTSTART;VALUE=DATE:20260924', 'UID:d@google.com', 'SUMMARY:Diada'))
    );
    expect(e.data).toBe('2026-09-24');
    expect(e.hora).toBeUndefined();
  });

  it('flags repeating events instead of expanding them', () => {
    const [e] = parseIcal(
      envolta(
        event(
          'DTSTART;TZID=Europe/Madrid:20260922T123000',
          'RRULE:FREQ=WEEKLY;WKST=SU;BYDAY=TU,TH',
          'UID:e@google.com',
          'SUMMARY:ASSAIG'
        )
      )
    );
    expect(e.recurrent).toBe(true);
  });

  it('flags cancelled events', () => {
    const [e] = parseIcal(
      envolta(
        event('DTSTART;VALUE=DATE:20260924', 'STATUS:CANCELLED', 'UID:f@google.com', 'SUMMARY:x')
      )
    );
    expect(e.cancellat).toBe(true);
  });

  it('rejoins folded lines and unescapes the text', () => {
    const [e] = parseIcal(
      envolta(
        event(
          'DTSTART;VALUE=DATE:20260924',
          'UID:g@google.com',
          'SUMMARY:Diada de tardor\r\n  amb els Ganàpies\\, a Girona',
          'LOCATION:Plaça del Vi\\, Girona'
        )
      )
    );
    expect(e.resum).toBe('Diada de tardor amb els Ganàpies, a Girona');
    expect(e.lloc).toBe('Plaça del Vi, Girona');
  });

  it('keeps colons that belong to the value', () => {
    const [e] = parseIcal(
      envolta(event('DTSTART;VALUE=DATE:20260924', 'UID:h@google.com', 'SUMMARY:Assaig: obert a tothom'))
    );
    expect(e.resum).toBe('Assaig: obert a tothom');
  });

  it('skips events with no date and reads several at once', () => {
    const events = parseIcal(
      envolta(
        event('UID:i@google.com', 'SUMMARY:sense data'),
        event('DTSTART;VALUE=DATE:20260101', 'UID:j@google.com', 'SUMMARY:bona')
      )
    );
    expect(events).toHaveLength(1);
    expect(events[0].uid).toBe('j@google.com');
  });

  it('leaves the location out when the calendar has none', () => {
    const [e] = parseIcal(
      envolta(event('DTSTART;VALUE=DATE:20260924', 'UID:k@google.com', 'SUMMARY:x'))
    );
    expect(e.lloc).toBeUndefined();
  });
});
