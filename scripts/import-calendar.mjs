/**
 * Brings the colla's Google Calendar into the agenda collection.
 *
 *   node scripts/import-calendar.mjs [--dry] [--url <ics>]
 *
 * The calendar owns when and where an event happens; everything an editor
 * records afterwards — the castells, the cartell, the observació, the estat —
 * belongs to the entry and is never touched here. Repeating events (the weekly
 * assaig) are skipped: the agenda page already shows them through the embed.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const { parseIcal } = await import('../src/lib/ical.ts');
const { classificaEsdeveniment } = await import('../src/lib/esdeveniment.ts');
const { urlFeedIcal } = await import('../src/lib/calendari.ts');

const DEST = 'src/content/agenda';
const CONFIG = 'src/content/configuracio/general.md';

/** Fields the calendar is the authority on. Everything else is the editor's. */
const DEL_CALENDARI = ['nom', 'data', 'hora', 'lloc', 'poblacio', 'cancelada', 'calendarUid'];

const dry = process.argv.includes('--dry');
const urlArg = process.argv[process.argv.indexOf('--url') + 1];

/** The embed URL already names the calendar, so derive the feed from it. */
function urlDelFeed() {
  if (process.argv.includes('--url') && urlArg) return urlArg;
  const config = readFileSync(CONFIG, 'utf8');
  const linia = config.match(/^googleCalendarEmbedUrl:\s*(.+)$/m);
  if (!linia) throw new Error(`No hi ha googleCalendarEmbedUrl a ${CONFIG}`);
  const feed = urlFeedIcal(linia[1].trim().replace(/^["']|["']$/g, ''));
  if (!feed) throw new Error("L'URL d'inserció no porta cap calendari");
  return feed;
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const yamlString = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

function valorYaml(camp, valor) {
  if (camp === 'data') return valor;
  if (camp === 'cancelada') return valor ? 'true' : 'false';
  return yamlString(valor);
}

/**
 * Replaces the calendar-owned lines and leaves the rest of the file alone.
 * Only column-0 keys are touched, so nested castells entries are safe.
 */
function aplica(contingut, camps) {
  const parts = contingut.split(/^---$/m);
  if (parts.length < 3) throw new Error('frontmatter inesperat');
  let linies = parts[1].replace(/^\n|\n$/g, '').split('\n');

  for (const [camp, valor] of Object.entries(camps)) {
    if (valor === undefined) continue;
    const linia = `${camp}: ${valorYaml(camp, valor)}`;
    const i = linies.findIndex((l) => l.startsWith(`${camp}:`));
    if (i === -1) linies.push(linia);
    else linies[i] = linia;
  }

  const cos = parts.slice(2).join('---');
  return `---\n${linies.join('\n')}\n---${cos}`;
}

function llegeixUid(contingut) {
  const m = contingut.match(/^calendarUid:\s*["']?([^"'\n]+)["']?\s*$/m);
  return m ? m[1].trim() : null;
}

/* ---------- read what is already there ---------- */
if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });
const fitxers = readdirSync(DEST).filter((f) => f.endsWith('.md'));
const perUid = new Map();
for (const f of fitxers) {
  const uid = llegeixUid(readFileSync(join(DEST, f), 'utf8'));
  if (uid) perUid.set(uid, f);
}

/* ---------- read the calendar ---------- */
const url = urlDelFeed();
console.log(`feed  ${url}`);
const resposta = await fetch(url);
if (!resposta.ok) throw new Error(`El calendari ha respost ${resposta.status}`);
const esdeveniments = parseIcal(await resposta.text());

const recurrents = esdeveniments.filter((e) => e.recurrent);
const puntuals = esdeveniments.filter((e) => !e.recurrent);
console.log(`llegits  ${esdeveniments.length} (${recurrents.length} repetits, s'ometen)`);

let creats = 0;
let actualitzats = 0;
let adoptats = 0;
let igual = 0;

for (const e of puntuals) {
  const camps = {
    nom: e.resum,
    data: e.data,
    hora: e.hora,
    lloc: e.lloc,
    cancelada: e.cancellat,
    calendarUid: e.uid,
  };

  let fitxer = perUid.get(e.uid);
  let adoptat = false;

  // an event already in the registre has no UID yet: adopt it instead of
  // writing a second entry for the same day
  if (!fitxer) {
    const candidat = `${e.data}-${slugify(e.resum) || 'actuacio'}.md`;
    if (fitxers.includes(candidat)) {
      fitxer = candidat;
      adoptat = true;
    }
  }

  if (fitxer) {
    const cami = join(DEST, fitxer);
    const abans = readFileSync(cami, 'utf8');
    const despres = aplica(abans, camps);
    if (abans === despres) {
      igual++;
      continue;
    }
    if (!dry) writeFileSync(cami, despres, 'utf8');
    if (adoptat) {
      adoptats++;
      console.log(`  adopta      ${fitxer}`);
    } else {
      actualitzats++;
      console.log(`  actualitza  ${fitxer}`);
    }
    continue;
  }

  const nom = `${e.data}-${slugify(e.resum) || 'actuacio'}.md`;
  const linies = [
    '---',
    `nom: ${yamlString(e.resum)}`,
    `data: ${e.data}`,
    ...(e.hora ? [`hora: ${yamlString(e.hora)}`] : []),
    ...(e.lloc ? [`lloc: ${yamlString(e.lloc)}`] : []),
    `tipus: ${classificaEsdeveniment(e.resum)}`,
    'estat: publicat',
    `cancelada: ${e.cancellat ? 'true' : 'false'}`,
    `calendarUid: ${yamlString(e.uid)}`,
    '---',
    '',
  ];
  if (!dry) writeFileSync(join(DEST, nom), linies.join('\n'), 'utf8');
  fitxers.push(nom);
  creats++;
  console.log(`  crea        ${nom}`);
}

console.log(
  `\n${dry ? '[dry] ' : ''}creats ${creats} · actualitzats ${actualitzats} · adoptats ${adoptats} · sense canvis ${igual}`
);

/* ---------- what still needs recording ---------- */
const avui = new Date().toISOString().slice(0, 10);
const pendents = [];
for (const f of readdirSync(DEST).filter((x) => x.endsWith('.md'))) {
  const contingut = readFileSync(join(DEST, f), 'utf8');
  const data = contingut.match(/^data:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
  const tipus = contingut.match(/^tipus:\s*(\w+)/m)?.[1];
  if (!data || data > avui) continue;
  if (tipus === 'Assaig') continue;
  if (/^castells:/m.test(contingut)) continue;
  pendents.push(`${data}  ${f}`);
}
if (pendents.length) {
  console.log(`\nactuacions passades sense castells registrats (${pendents.length}):`);
  for (const p of pendents.sort().slice(-10)) console.log(`  ${p}`);
  if (pendents.length > 10) console.log(`  … i ${pendents.length - 10} més`);
}
