/**
 * Just enough of RFC 5545 to read the colla's Google Calendar feed: the events
 * it publishes, in Europe/Madrid wall-clock terms. Not a general iCalendar
 * implementation — it assumes the feed's own timezone and ignores VTIMEZONE.
 */

const ZONA = 'Europe/Madrid';

export interface EsdevenimentIcal {
  uid: string;
  resum: string;
  lloc?: string;
  /** Calendar date in Europe/Madrid, as YYYY-MM-DD. */
  data: string;
  /** Start time in Europe/Madrid as HH:MM; absent for all-day events. */
  hora?: string;
  cancellat: boolean;
  /** Carries an RRULE, so it stands for many occurrences rather than one. */
  recurrent: boolean;
}

/** Long values are folded onto continuation lines beginning with a space or tab. */
function unfold(raw: string): string {
  return raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

interface Propietat {
  nom: string;
  params: Record<string, string>;
  valor: string;
}

function parseLine(line: string): Propietat | null {
  // the value starts at the first colon that is not inside a quoted parameter
  let colon = -1;
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') quoted = !quoted;
    else if (ch === ':' && !quoted) {
      colon = i;
      break;
    }
  }
  if (colon === -1) return null;

  const head = line.slice(0, colon);
  const valor = line.slice(colon + 1);
  const [nom, ...paramParts] = head.split(';');
  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { nom: nom.toUpperCase(), params, valor };
}

/** Formats an instant as Europe/Madrid wall-clock parts. */
function aMadrid(instant: Date): { data: string; hora: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value])
  );
  // some ICU builds render midnight as hour 24
  const hora = parts.hour === '24' ? '00' : parts.hour;
  return { data: `${parts.year}-${parts.month}-${parts.day}`, hora: `${hora}:${parts.minute}` };
}

/**
 * DTSTART arrives in three shapes:
 *   DTSTART;VALUE=DATE:20260924                  — all day
 *   DTSTART;TZID=Europe/Madrid:20260922T123000   — already local wall time
 *   DTSTART:20260924T163000Z                     — UTC, needs converting
 */
function parseStart(prop: Propietat): { data: string; hora?: string } | null {
  const v = prop.valor.trim();

  const dia = v.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dia) return { data: `${dia[1]}-${dia[2]}-${dia[3]}` };

  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return null;
  const [, year, month, day, hour, minute, second, utc] = m;

  if (utc === 'Z') {
    return aMadrid(new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second)));
  }
  return { data: `${year}-${month}-${day}`, hora: `${hour}:${minute}` };
}

export function parseIcal(raw: string): EsdevenimentIcal[] {
  const lines = unfold(raw).split(/\r?\n/);
  const esdeveniments: EsdevenimentIcal[] = [];

  let current: Partial<EsdevenimentIcal> | null = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = { cancellat: false, recurrent: false };
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current?.uid && current.resum && current.data) {
        esdeveniments.push(current as EsdevenimentIcal);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const prop = parseLine(line);
    if (!prop) continue;

    switch (prop.nom) {
      case 'UID':
        current.uid = prop.valor.trim();
        break;
      case 'SUMMARY':
        current.resum = unescapeText(prop.valor).trim();
        break;
      case 'LOCATION': {
        const lloc = unescapeText(prop.valor).trim();
        if (lloc) current.lloc = lloc;
        break;
      }
      case 'STATUS':
        current.cancellat = prop.valor.trim().toUpperCase() === 'CANCELLED';
        break;
      case 'RRULE':
        current.recurrent = true;
        break;
      case 'DTSTART': {
        const start = parseStart(prop);
        if (start) {
          current.data = start.data;
          if (start.hora) current.hora = start.hora;
        }
        break;
      }
    }
  }

  return esdeveniments;
}
