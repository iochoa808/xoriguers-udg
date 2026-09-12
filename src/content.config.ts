import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const castellFet = z.object({
  castell: z.string(),
  estat: z.enum(['descarregat', 'carregat', 'intent']),
  ronda: z.preprocess((v) => (v === '' ? undefined : v), z.number().optional()),
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
  }),
});

const galeria = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/galeria' }),
  schema: z.object({
    nom: z.string(),
    data: z.coerce.date(),
    portada: z.string().optional(),
    fotos: z.array(z.string()).default([]),
  }),
});

export const collections = { agenda, noticies, galeria };
