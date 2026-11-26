#!/usr/bin/env node
/**
 * Сервіс перезбирання сайту після змін рослин у CRM (працює на сервері).
 *
 * CRM після збереження надсилає POST на http://127.0.0.1:<порт>/rebuild
 * із заголовком «Authorization: Bearer <SITE_REBUILD_SECRET>». Сервіс чекає
 * 60 с після останнього сигналу (кілька змін підряд — одне перезбирання),
 * запускає `update-site.sh --rebuild` і миттєво підміняє сайт.
 * Якщо під час збирання прийшов новий сигнал — після нього буде ще одне.
 *
 * Слухає лише 127.0.0.1 — ззовні сервера недоступний.
 * Налаштування — у /opt/yaremiya/.env (див. .env.example): SITE_REBUILD_SECRET,
 * SITE_REBUILD_PORT (8790), SITE_REBUILD_DELAY_MS (60000).
 */

import { spawn } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoDir = path.resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const envFile = path.join(repoDir, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const secret = process.env.SITE_REBUILD_SECRET?.trim() ?? '';
const port = Number(process.env.SITE_REBUILD_PORT) || 8790;
const delayMs = Number(process.env.SITE_REBUILD_DELAY_MS) || 60_000;

if (secret.length < 24) {
  console.error('✗ SITE_REBUILD_SECRET у .env порожній або закороткий (потрібно щонайменше 24 символи).');
  process.exit(1);
}

const log = (msg) => console.log(`${new Date().toISOString()} ${msg}`);

let timer = null;
let building = false;
let pendingAfterBuild = false;

function schedule(reason) {
  log(`сигнал: ${reason}`);
  if (building) {
    pendingAfterBuild = true;
    return;
  }
  clearTimeout(timer);
  timer = setTimeout(build, delayMs);
}

function build() {
  timer = null;
  building = true;
  log('перезбираю сайт…');
  const child = spawn('bash', [path.join(repoDir, 'apps/site/deploy/update-site.sh'), '--rebuild'], {
    cwd: repoDir,
    stdio: 'inherit',
  });
  child.on('exit', (code) => {
    building = false;
    log(code === 0 ? '✓ сайт оновлено' : `✗ збирання завершилось з помилкою (код ${code}) — працює попередня версія сайту`);
    if (pendingAfterBuild) {
      pendingAfterBuild = false;
      schedule('зміни під час збирання');
    }
  });
}

function authorized(header) {
  const given = Buffer.from(header ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/rebuild') {
    res.writeHead(404).end();
    return;
  }
  if (!authorized(req.headers.authorization)) {
    res.writeHead(401).end();
    return;
  }
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 2000) req.destroy();
  });
  req.on('end', () => {
    let reason = 'зміни в CRM';
    try {
      reason = String(JSON.parse(body).reason ?? reason).slice(0, 200);
    } catch {}
    schedule(reason);
    res.writeHead(202, { 'Content-Type': 'application/json' }).end('{"ok":true}');
  });
}).listen(port, '127.0.0.1', () => log(`чекаю сигналів на 127.0.0.1:${port} (затримка ${delayMs / 1000} с)`));
