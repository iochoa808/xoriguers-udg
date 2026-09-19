import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const castellFet = z.object({
  castell: z.string(),
  estat: z.enum(['descarregat', 'carregat', 'intent']),
  ronda: z.preprocess(emptyToUndefined, z.number().optional()),
  foto: z.string().optional(),
});

const agenda = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/agenda' }),
  schema: z.object({
    nom: z.string(),
    data: z.coerce.date(),
    hora: z.string(),
    lloc: z.string(),
    poblacio: z.string(),
    tipus: z.enum(['Actuacio', 'Assaig', 'Diada', 'Trobada']),
    cartell: z.string().optional(),
    collesParticipants: z.array(z.string()).default([]),
    mostrarPortada: z.boolean().default(false),
    estat: z.enum(['esborrany', 'revisio', 'publicat']).default('esborrany'),
    cancelada: z.boolean().default(false),
    castells: z.array(castellFet).default([]),
  }),
});

const noticies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/noticies' }),
  schema: z.object({
    titol: z.string(),
    data: z.coerce.date(),
    resum: z.string(),
    imatge: z.string().optional(),
    estat: z.enum(['esborrany', 'revisio', 'publicat']).default('esborrany'),
  }),
});

const galeria = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/galeria' }),
  schema: z.object({
    nom: z.string(),
    data: z.coerce.date(),
    portada: z.string().optional(),
    fotos: z.array(z.string()).default([]),
    estat: z.enum(['esborrany', 'revisio', 'publicat']).default('esborrany'),
  }),
});

const pagines = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pagines' }),
  schema: z.object({
    titol: z.string(),
    imatge: z.string().optional(),
    ctaText: z.string().optional(),
    assajosHorari: z.string().optional(),
    assajosLloc: z.string().optional(),
    contacteEmail: z.string().optional(),
    contacteInstagram: z.string().optional(),
  }),
});

const membreJunta = z.object({
  carrec: z.string(),
  nom: z.string(),
  cognom: z.string(),
  malnom: z.string().optional(),
  foto: z.string().optional(),
});

const juntaTemporadaSchema = z.object({
  numeroTemporada: z.preprocess(emptyToUndefined, z.number()),
  membres: z.array(membreJunta).default([]),
});

const juntaDirectiva = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/junta-directiva' }),
  schema: juntaTemporadaSchema,
});

const juntaTecnica = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/junta-tecnica' }),
  schema: juntaTemporadaSchema,
});

const patrocinadors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/patrocinadors' }),
  schema: z.object({
    nom: z.string(),
    logo: z.string().optional(),
    url: z.string().optional(),
    ordre: z.preprocess(emptyToUndefined, z.number().default(0)),
  }),
});

const documents = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/documents' }),
  schema: z.object({
    titol: z.string(),
    categoria: z.enum(['Estatuts', 'Reglament', 'Protocol', 'Altres']),
    fitxer: z.string(),
    data: z.coerce.date().optional(),
  }),
});

const configuracio = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/configuracio' }),
  schema: z.object({
    instagramUrl: z.string().optional(),
    youtubeUrl: z.string().optional(),
    merchandiseUrl: z.string().optional(),
    googleCalendarEmbedUrl: z.string().optional(),
    contacteComercialEmail: z.string().optional(),
    contacteComercialNom: z.string().optional(),
  }),
});

export const collections = {
  agenda,
  noticies,
  galeria,
  pagines,
  juntaDirectiva,
  juntaTecnica,
  patrocinadors,
  documents,
  configuracio,
};
