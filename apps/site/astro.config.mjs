// @ts-check
import { existsSync } from 'node:fs';
import { cp, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Один файл .env у корені монорепо (DATABASE_URL, UPLOADS_DIR) — рослини беруться з бази.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const rootEnv = path.join(repoRoot, '.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const uploadsDir = () => path.resolve(process.env.UPLOADS_DIR?.trim() || path.join(repoRoot, 'uploads'));
const MEDIA_FILE = /^\/media\/(plants\/\d+\/[a-z0-9]+-(?:1600|800|400)\.webp)$/;

/**
 * Фото рослин (завантажені в CRM, лежать у UPLOADS_DIR):
 * - під час `astro dev` — віддаються за адресою /media/...;
 * - під час збирання — копіюються в dist/media/, тож готовий сайт самодостатній.
 */
function plantMedia() {
  return {
    name: 'yaremiya-plant-media',
    hooks: {
      /** @param {{ server: import('vite').ViteDevServer }} options */
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const match = MEDIA_FILE.exec((req.url ?? '').split('?')[0]);
          if (!match) return next();
          try {
            const body = await readFile(path.join(uploadsDir(), match[1]));
            res.setHeader('Content-Type', 'image/webp');
            res.end(body);
          } catch {
            res.statusCode = 404;
            res.end('Not found');
          }
        });
      },
      /** @param {{ dir: URL }} options */
      'astro:build:done': async ({ dir }) => {
        const from = path.join(uploadsDir(), 'plants');
        if (existsSync(from)) await cp(from, fileURLToPath(new URL('media/plants/', dir)), { recursive: true });
      },
    },
  };
}

// Сайт статичний: `pnpm build` створює папку dist/, яку віддає Caddy або nginx.
// Після змін рослин у CRM сайт перезбирається (див. docs/deploy.md → «Оновлення після змін у CRM»).
export default defineConfig({
  site: 'https://yaremiya.com',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') }), plantMedia()],
  build: {
    inlineStylesheets: 'auto',
  },
});
