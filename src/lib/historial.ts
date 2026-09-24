export type Estat = 'descarregat' | 'carregat' | 'intent';

export interface CastellFet {
  /** Normalised identity, keeping folre/agulla: 3d8f, 4d7a, pd4, 2pd4. */
  canonic: string;
  /** The token exactly as the registre wrote it. */
  notacio: string;
  pisos: number;
  pilar: boolean;
  estat: Estat;
}

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

// the separator is normally "d" ("4d7"); "ors" marks a non-traditional build
// the colla writes differently on purpose, as in 6ors5 for a sis de cinc
const CASTELL = /^(id|i)?(\d+)?(p|\d+)(d|\/|ors)(\d+)([a-zç]*)$/i;
const MODIFIER = /^(net|aco|ag|a|c|i|id|f|fc|fem|ps|n|cam|conjunt|germanor|de|amb)$/i;
/** vano de 5, van5, vanod3 — one token standing for three pilars at once. */
const VANO = /^van(?:o)?d?(\d+)(id|i|c)?$/i;

function normalise(token: string): string {
  return token
    .replace(/·/g, '')
    .replace(/\.$/, '')
    .replace(/^(\d+)\*/, '$1')
    .replace('/', 'd') // old notation wrote 4/7 where we now write 4d7
    .replace(/^2dp(\d)$/i, '2pd$1')
    .replace(/^2p(\d)$/i, '2pd$1')
    .replace(/^(\d?)p(\d)$/i, '$1pd$2');
}

/** Trailing "(c)" / "(1c)" notes mark a carregat; the note itself is dropped. */
function splitNote(token: string): { core: string; note: string } {
  const m = token.match(/^([^(]+)\((.*)\)$/);
  return m ? { core: m[1], note: m[2].toLowerCase() } : { core: token, note: '' };
}

export function parseCastell(token: string): CastellFet | null {
  const { core, note } = splitNote(token);

  const normalised = normalise(core);
  const m = normalised.match(CASTELL);
  if (!m) return null;

  const [, prefix, multiplier, base, separador, pisosRaw, suffixRaw] = m;
  const pilar = base.toLowerCase() === 'p';
  const pisos = Number(pisosRaw);
  const noTradicional = separador.toLowerCase() === 'ors';

  // Peel the suffix in four passes: the figuereta, old-notation words, the
  // outcome, then whatever structure is left.
  let suffix = (suffixRaw || '').toLowerCase();
  // before folre and agulla, or the f and g of "fig" would be mistaken for them
  const figuereta = /fig(uereta)?/.test(suffix);
  suffix = suffix.replace(/fig(uereta)?/g, '').replace(/aco|net|ps|cam|sim|fem|dol/g, '');

  let estat: Estat = 'descarregat';
  if (prefix === 'id' || prefix === 'i') estat = 'intent';
  if (suffix.endsWith('id')) {
    estat = 'intent';
    suffix = suffix.slice(0, -2);
  } else if (suffix.endsWith('c')) {
    estat = 'carregat';
    suffix = suffix.slice(0, -1);
  } else if (suffix.endsWith('i')) {
    estat = 'intent';
    suffix = suffix.slice(0, -1);
  }
  if (note.includes('c')) estat = 'carregat';

  const count = multiplier && +multiplier > 1 ? multiplier : '';
  const canonic =
    `${count}${pilar ? 'p' : base}${noTradicional ? 'ors' : 'd'}${pisos}` +
    (suffix.includes('f') ? 'f' : '') +
    (suffix.includes('m') ? 'm' : '') +
    (/[ag]/.test(suffix) ? 'a' : '') +
    (figuereta ? 'fig' : '');

  return { canonic, notacio: token, pisos, pilar, estat };
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

/**
 * Descarregat values from the Concurs de Castells de Tarragona table. The concurs
 * does not rank below group 0 (2d6, pd5); PROVISIONAL covers what the colla does
 * below that line and is the colla's own scale, pending review.
 */
const OFICIAL: Record<string, number> = {
  '3d8f': 970,
  '4d8f': 845,
  '2d8f': 1210,
  pd6f: 920,
  '2d7f': 805,
  '5d7': 565,
  '7d7': 555,
  '3d7a': 545,
  '4d7a': 515,
  '3d7': 415,
  '3d7f': 415,
  '4d7': 395,
  pd5: 315,
  '2d6': 300,
};

const PROVISIONAL: Record<string, number> = {
  '7d6': 240,
  '5d6': 230,
  '4d6a': 200,
  '3d6a': 190,
  '3d6': 130,
  '4d6': 120,
  '2d5': 110,
  '5d5': 95,
  '4d5a': 90,
  '3d5a': 85,
  '4d5': 70,
  '3d5': 65,
  '2d4': 55,
  '7d4': 45,
  pd4a: 40,
  pd4: 30,
  pd3: 15,
};

export function valorBase(canonic: string): number {
  if (canonic in OFICIAL) return OFICIAL[canonic];
  if (canonic in PROVISIONAL) return PROVISIONAL[canonic];
  const m = canonic.match(/^(\d+)(pd\d.*)$/);
  if (m) {
    const unit = OFICIAL[m[2]] ?? PROVISIONAL[m[2]];
    if (unit) return unit * +m[1];
  }
  // a figuereta is a flourish on a castell that already has a value. With no
  // official value of its own it scores as the castell underneath, rather than
  // as nothing or as a premium nobody has agreed on.
  if (canonic.endsWith('fig')) return valorBase(canonic.slice(0, -3));
  return 0;
}

/** A carregat is worth 82% of the descarregat, the ratio the concurs table uses. */
export function punts(castell: CastellFet): number {
  if (castell.estat === 'intent') return 0;
  const base = valorBase(castell.canonic);
  return castell.estat === 'carregat' ? Math.round(base * 0.82) : base;
}

export function puntsDiada(diada: { castells: CastellFet[] }): number {
  return diada.castells.reduce((total, c) => total + punts(c), 0);
}

export const GAMMES: { etiqueta: string; test: (c: CastellFet) => boolean }[] = [
  { etiqueta: 'Castells de 8', test: (c) => !c.pilar && c.pisos >= 8 },
  {
    etiqueta: 'Gamma alta de 7',
    test: (c) => !c.pilar && c.pisos === 7 && (/^[2579]/.test(c.canonic) || c.canonic.endsWith('a')),
  },
  { etiqueta: 'Castells de 7', test: (c) => !c.pilar && c.pisos === 7 },
  {
    etiqueta: 'Gamma alta de 6',
    test: (c) => !c.pilar && c.pisos === 6 && (/^[2579]/.test(c.canonic) || c.canonic.endsWith('a')),
  },
  { etiqueta: 'Castells de 6', test: (c) => !c.pilar && c.pisos === 6 },
  { etiqueta: 'Castells de 5 i de 4', test: (c) => !c.pilar && c.pisos <= 5 },
  { etiqueta: 'Pilars', test: (c) => c.pilar },
];

/** Strips edition numbers and years so the same diada groups across seasons. */
export function normalitzaNom(nom: string): string {
  return nom
    .toLowerCase()
    .replace(/\s+del?\s+(xviii|xxv|\d+è?)(?=\s|$)/g, '')
    .replace(/\s*\d{4}(-\d{2,4})?\s*/g, ' ')
    .replace(/[.,:;]/g, '')
    .trim();
}

export const ES_FITA = /primer|millor|històr|histor|vuuu/i;

/**
 * How a castell is written down once you know how it went: 4d7 descarregat,
 * 4d7c carregat, 4d7i intent. Built from the canonic form rather than from what
 * was typed, so an outcome marker can never end up doubled.
 */
export function notacioAmbEstat(castell: { canonic: string; estat: Estat }): string {
  if (castell.estat === 'carregat') return `${castell.canonic}c`;
  if (castell.estat === 'intent') return `${castell.canonic}i`;
  return castell.canonic;
}

/** descarregat beats carregat beats intent, for summarising a run of attempts. */
export function millorEstat(estats: Estat[]): Estat {
  if (estats.includes('descarregat')) return 'descarregat';
  if (estats.includes('carregat')) return 'carregat';
  return 'intent';
}
