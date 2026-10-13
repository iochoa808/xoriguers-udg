/**
 * The castells domain: how a castell is written, what it is worth, and how a
 * list of them is summarised. Everything here works on the castells an editor
 * records against an agenda entry, which is where the archive gets its data.
 *
 * Reading the old CSV registre is a separate, migration-only concern and lives
 * in `registre-csv.ts`.
 */

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

// the separator is normally "d" ("4d7"); "ors" marks a non-traditional build
// the colla writes differently on purpose, as in 6ors5 for a sis de cinc
const CASTELL = /^(id|i)?(\d+)?(p|\d+)(d|\/|ors)(\d+)([a-zç]*)$/i;

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
 * Turns the castells recorded on an agenda entry into full records. The stored
 * estat wins over anything the notation implies: it is its own field, chosen by
 * whoever wrote the diada up.
 */
export function llegeixCastellsRegistrats(
  registrats: readonly { castell: string; estat: Estat }[]
): CastellFet[] {
  return registrats.map((c) => {
    const llegit = parseCastell(c.castell);
    return llegit
      ? { ...llegit, estat: c.estat }
      : { canonic: c.castell, notacio: c.castell, pisos: 0, pilar: false, estat: c.estat };
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
