/**
 * Reads the colla's old registre històric, `historial_castells.csv`: one row
 * per diada, with the castells written as free text in whatever notation was in
 * use at the time.
 *
 * This is migration code, not site code. It ran once, in commit 8b4f2cd, to
 * turn 282 rows into the agenda entries the archive now reads; nothing in
 * `src/pages` imports it. It stays because the CSV is the only record of how
 * those entries were derived, and because four rows with unusable dates were
 * never migrated — see `docs/architecture.md`. The CSV itself is in git history:
 *
 *   git show 2c57ebc:src/data/historial_castells.csv > historial_castells.csv
 *
 * The live counterpart is `historial.ts`, which reads the castells an editor
 * types into the CMS. Everything to do with the shape of the CSV lives here.
 */
import { parseCastell, type CastellFet, type Estat } from './historial';

export interface DiadaHistorica {
  data: Date | null;
  dataText: string;
  temporada: string;
  nom: string;
  castells: CastellFet[];
  castellsText: string;
  observacio: string;
  cccc: boolean;
}

/** A word on its own that qualifies the castell before it, not a castell. */
const MODIFIER = /^(net|aco|ag|a|c|i|id|f|fc|fem|ps|n|cam|conjunt|germanor|de|amb)$/i;
/** vano de 5, van5, vanod3 — one token standing for three pilars at once. */
const VANO = /^van(?:o)?d?(\d+)(id|i|c)?$/i;

export function parseCsv(src: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/**
 * A token can stand for more than one castell: a vano is three pilars raised
 * together, one de N flanked by two de N-1, so "vano de 5" is pd5 and 2pd4.
 */
export function parseCastells(token: string): CastellFet[] {
  const vano = token.match(VANO);
  if (vano) {
    const pisos = Number(vano[1]);
    const marca = (vano[2] || '').toLowerCase();
    const estat: Estat = marca === 'c' ? 'carregat' : marca ? 'intent' : 'descarregat';
    return [
      { canonic: `pd${pisos}`, notacio: token, pisos, pilar: true, estat },
      { canonic: `2pd${pisos - 1}`, notacio: token, pisos: pisos - 1, pilar: true, estat },
    ];
  }
  const un = parseCastell(token);
  return un ? [un] : [];
}

/**
 * The registre mixes DD/MM/YYYY (recent rows) with MM/DD/YYYY (up to 2013-14).
 * Seasons appear as contiguous blocks, so each season's unambiguous rows decide
 * how to read its ambiguous ones.
 */
function dateRegimes(rows: string[][]): Map<string, 'DMY' | 'MDY'> {
  const votes = new Map<string, { DMY: number; MDY: number }>();
  for (const r of rows) {
    const m = (r[0] ?? '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) continue;
    const season = (r[1] ?? '').trim();
    const v = votes.get(season) ?? { DMY: 0, MDY: 0 };
    if (+m[1] > 12) v.DMY++;
    else if (+m[2] > 12) v.MDY++;
    votes.set(season, v);
  }

  const order = [...new Set(rows.map((r) => (r[1] ?? '').trim()))];
  const decided = new Map<string, 'DMY' | 'MDY' | null>();
  for (const season of order) {
    const v = votes.get(season) ?? { DMY: 0, MDY: 0 };
    decided.set(season, v.DMY === 0 && v.MDY === 0 ? null : v.DMY >= v.MDY ? 'DMY' : 'MDY');
  }
  // a season with no evidence of its own follows its nearest decided neighbour
  const result = new Map<string, 'DMY' | 'MDY'>();
  for (let i = 0; i < order.length; i++) {
    const own = decided.get(order[i]);
    if (own) {
      result.set(order[i], own);
      continue;
    }
    let neighbour: 'DMY' | 'MDY' | null = null;
    for (let j = i - 1; j >= 0 && !neighbour; j--) neighbour = decided.get(order[j]) ?? null;
    for (let j = i + 1; j < order.length && !neighbour; j++) neighbour = decided.get(order[j]) ?? null;
    result.set(order[i], neighbour ?? 'DMY');
  }
  return result;
}

function parseDate(text: string, regime: 'DMY' | 'MDY'): Date | null {
  const m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const a = +m[1];
  const b = +m[2];
  const year = +m[3];
  let day: number;
  let month: number;
  if (a > 12) {
    day = a;
    month = b;
  } else if (b > 12) {
    day = b;
    month = a;
  } else if (regime === 'MDY') {
    day = b;
    month = a;
  } else {
    day = a;
    month = b;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

export function parseHistorial(csv: string): DiadaHistorica[] {
  const rows = parseCsv(csv);
  rows.shift(); // header
  const regimes = dateRegimes(rows);

  return rows.map((r) => {
    const temporada = (r[1] ?? '').trim();
    const castellsText = (r[3] ?? '').trim();
    const castells: CastellFet[] = [];

    if (castellsText && castellsText !== '-') {
      // the registre writes a vano out in words as often as not
      const text = castellsText.replace(/\bvano\s+de\s+(\d+)/gi, 'vano$1');
      for (const token of text.split(/[,\s]+/).filter(Boolean)) {
        const llegits = parseCastells(token);
        if (llegits.length) {
          castells.push(...llegits);
          continue;
        }
        // a bare modifier belongs to the castell before it ("3/5 aco net", "4d7 c")
        const previous = castells[castells.length - 1];
        if (previous && MODIFIER.test(token)) {
          const t = token.toLowerCase();
          if (t === 'c' && previous.estat === 'descarregat') previous.estat = 'carregat';
          // a lone "i" is the Catalan "and" joining the last two castells
          // ("2d6 i p5"), never an intent — those are written id, i3d7 or 3d6i
          if (t === 'id') previous.estat = 'intent';
          if ((t === 'f' || t === 'a' || t === 'ag') && !previous.canonic.endsWith(t[0])) {
            previous.canonic += t[0];
          }
        }
      }
    }

    return {
      data: parseDate((r[0] ?? '').trim(), regimes.get(temporada) ?? 'DMY'),
      dataText: (r[0] ?? '').trim(),
      temporada,
      nom: (r[2] ?? '').trim(),
      castells,
      castellsText,
      observacio: (r[5] ?? '').trim(),
      cccc: !!(r[4] ?? '').trim(),
    };
  });
}
