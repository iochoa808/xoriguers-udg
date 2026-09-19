import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages serves this project at /xoriguers-udg/ (it isn't the
// special <user>.github.io repo), so the base path only applies to the
// actual deploy — local dev keeps running at the root.
export default defineConfig({
  site: 'https://iochoa808.github.io',
  base: process.env.GITHUB_ACTIONS ? '/xoriguers-udg/' : '/',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
});
