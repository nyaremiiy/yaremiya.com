// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Сайт статичний: `pnpm build` створює папку dist/, яку віддає Caddy або nginx.
export default defineConfig({
  site: 'https://yaremiya.com',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  build: {
    inlineStylesheets: 'auto',
  },
});
