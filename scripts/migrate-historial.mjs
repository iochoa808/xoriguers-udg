/**
 * One-time migration: the registre històric CSV becomes agenda entries, so the
 * archive and the agenda stop being two separate things.
 *
 *   node scripts/migrate-historial.mjs [--dry] [--force]
 *
 * Refuses to write while any row carrying content has no usable date or an
 * impossible one, because guessing a date would put invented facts into the
 * colla's permanent record. --force skips those rows instead.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const { parseHistorial } = await import('../src/lib/historial.ts');
const { classificaEsdeveniment } = await import('../src/lib/esdeveniment.ts');

const CSV = 'src/data/historial_castells.csv';
const DEST = 'src/content/agenda';
const dry = process.argv.includes('--dry');
const force = process.argv.includes('--force');

const ARA = new Date().getUTCFullYear();

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const iso = (d) => d.toISOString().slice(0, 10);

/** YAML needs quoting for anything with a colon, quote or leading marker. */
function yamlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

const diades = parseHistorial(readFileSync(CSV, 'utf8'));

const buides = [];
const bloquejades = [];
const bones = [];

for (const d of diades) {
  const teContingut = d.nom.trim() || d.castells.length > 0 || d.castellsText.trim() || d.observacio.trim();
  if (!teContingut) {
    buides.push(d);
    continue;
  }
  if (!d.data) {
    bloquejades.push({ d, motiu: 'sense data' });
    continue;
  }
  const any = d.data.getUTCFullYear();
  if (any < 1990 || any > ARA + 1) {
    bloquejades.push({ d, motiu: `any impossible (${any})` });
    continue;
  }
  bones.push(d);
}

console.log(`llegides        ${diades.length} files`);
console.log(`buides          ${buides.length} (files de farciment del full de càlcul, s'ignoren)`);
console.log(`bloquejades     ${bloquejades.length}`);
console.log(`a migrar        ${bones.length}`);

if (bloquejades.length) {
  console.log('\nfiles amb contingut que no es poden datar:');
  for (const { d, motiu } of bloquejades) {
    console.log(
      `  [${d.dataText || 'buit'}] ${d.temporada} | ${d.nom || '(sense nom)'} | ${motiu}` +
        (d.castells.length ? ` | ${d.castells.length} castells` : '')
    );
  }
  if (!force) {
    console.log('\nCorregeix-les al CSV i torna-hi, o executa amb --force per ometre-les.');
    process.exit(1);
  }
  console.log('\n--force: s\'ometen.');
}

// same name can repeat on the same day across the registre; keep slugs unique
const usats = new Set();
function slugUnic(d) {
  const arrel = `${iso(d.data)}-${slugify(d.nom) || 'actuacio'}`;
  let slug = arrel;
  let n = 2;
  while (usats.has(slug)) slug = `${arrel}-${n++}`;
  usats.add(slug);
  return slug;
}

if (!dry && !existsSync(DEST)) mkdirSync(DEST, { recursive: true });

let escrits = 0;
for (const d of bones) {
  const slug = slugUnic(d);
  const linies = [
    '---',
    `nom: ${yamlString(d.nom || 'Actuació')}`,
    `data: ${iso(d.data)}`,
    `tipus: ${classificaEsdeveniment(d.nom)}`,
    'estat: publicat',
    'cancelada: false',
  ];

  if (d.castells.length) {
    linies.push('castells:');
    for (const c of d.castells) {
      linies.push(`  - castell: ${yamlString(c.canonic)}`);
      linies.push(`    estat: ${c.estat}`);
    }
  }
  if (d.castellsText) linies.push(`notacioOriginal: ${yamlString(d.castellsText)}`);
  if (d.observacio) linies.push(`observacio: ${yamlString(d.observacio)}`);
  if (d.cccc) linies.push('cccc: true');

  linies.push('---', '');

  if (!dry) writeFileSync(join(DEST, `${slug}.md`), linies.join('\n'), 'utf8');
  escrits++;
}

console.log(`\n${dry ? 'es crearien' : 'escrits'}  ${escrits} fitxers a ${DEST}`);
