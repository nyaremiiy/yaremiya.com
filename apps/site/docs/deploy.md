# Як розгорнути сайт на власному сервері

Сайт — це набір звичайних файлів (HTML, CSS, фото). Їх збирає команда `pnpm build` у папку `apps/site/dist/`, а віддає відвідувачам вебсервер **Caddy** (рекомендую — сам налаштовує HTTPS) або **nginx**.

Нижче — кроки для сервера з Ubuntu/Debian. Команди виконуються на сервері через SSH.

## 1. Один раз: підготувати сервер

```bash
# Node.js 22+ і pnpm (потрібну для сайту Node 24 pnpm завантажить сам — див. devEngines у package.json)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs git
sudo corepack enable

# Папки для коду й для сайту
sudo mkdir -p /opt/yaremiya /var/www/yaremiya/releases
sudo chown -R $USER /opt/yaremiya /var/www/yaremiya

# Код сайту (адресу репозиторію підставте свою)
git clone <адреса-репозиторію> /opt/yaremiya
```

Якщо репозиторій приватний — додайте на сервері SSH-ключ «deploy key» у налаштуваннях репозиторію (лише читання).

## 2. Один раз: налаштування форм (необов'язково зараз)

Поки що форми лише показують подяку. Коли з'явиться сервіс, що пересилає заявки в Telegram, створіть на сервері файл `/opt/yaremiya/apps/site/.env` (зразок — `.env.example`):

```
PUBLIC_FORM_ENDPOINT=https://yaremiya.com/api/lead
PUBLIC_SUBSCRIBE_ENDPOINT=https://yaremiya.com/api/subscribe
```

Після зміни `.env` потрібно оновити сайт (крок 4) — адреса вшивається під час збірки.

## 3. Один раз: вебсервер і HTTPS

Спершу в налаштуваннях домену (у реєстратора) створіть записи **A** для `yaremiya.com` і `www.yaremiya.com` з IP-адресою сервера.

### Варіант А — Caddy (рекомендую)

```bash
sudo apt install -y caddy
sudo cp /opt/yaremiya/apps/site/deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy сам отримає сертифікат Let's Encrypt і буде його оновлювати. Стиснення й кешування вже прописані у `Caddyfile`.

### Варіант Б — nginx

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yaremiya.com -d www.yaremiya.com
sudo cp /opt/yaremiya/apps/site/deploy/nginx.conf /etc/nginx/sites-available/yaremiya
sudo ln -s /etc/nginx/sites-available/yaremiya /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Certbot сам оновлює сертифікат за розкладом.

## 3а. Один раз: база, фото й автоматичне оновлення після змін у CRM

Рослини на сайті беруться з бази PostgreSQL (їх змінюють у CRM). Сайт читає базу **під час збирання**, тому:

1. У `/opt/yaremiya/.env` (зразок — `.env.example` у корені) мають бути:
   - `DATABASE_URL` — адреса основної бази;
   - `UPLOADS_DIR` — папка фото поза репозиторієм, наприклад `/var/lib/yaremiya/uploads` (`sudo mkdir -p … && sudo chown yaremiya …`). Ту саму папку використовує CRM;
   - `SITE_REBUILD_URL=http://127.0.0.1:8790/rebuild` і `SITE_REBUILD_SECRET` — випадковий рядок (`openssl rand -hex 32`).
2. Запустити сервіс, який перезбирає сайт після змін у CRM:
   ```bash
   sudo cp /opt/yaremiya/apps/site/deploy/yaremiya-site-rebuilder.service /etc/systemd/system/
   # у файлі сервісу перевірте User= — користувач, якому належать /opt/yaremiya і /var/www/yaremiya
   sudo systemctl daemon-reload && sudo systemctl enable --now yaremiya-site-rebuilder
   journalctl -u yaremiya-site-rebuilder -f   # журнал
   ```
   Як це працює: після збереження рослини CRM надсилає сервісу сигнал; той чекає 60 с (кілька змін підряд — одне збирання), збирає сайт (`update-site.sh --rebuild`) і миттєво підміняє його. Сервіс слухає лише `127.0.0.1` і приймає сигнал тільки із секретом. Якщо збирання не вдалося (наприклад, база недоступна) — лишається попередня версія сайту.
3. Фото рослин копіюються в кожну версію сайту (`/media/...`), Caddy/nginx віддають їх як звичайні файли з довгим кешем.

Вручну перезібрати сайт з бази: `bash /opt/yaremiya/apps/site/deploy/update-site.sh --rebuild`. Локально: `pnpm site:rebuild`.

## 4. Оновити сайт (щоразу після змін)

```bash
bash /opt/yaremiya/apps/site/deploy/update-site.sh
```

Скрипт забирає свіжий код, встановлює залежності, застосовує міграції бази (`pnpm db:migrate`, на основному сервері — з резервною копією), збирає сайт і миттєво перемикає на нову версію. Зберігаються 5 останніх версій.

Якщо щось пішло не так — повернути попередню версію:

```bash
bash /opt/yaremiya/apps/site/deploy/update-site.sh --rollback
```

## Перевірка після запуску

- https://yaremiya.com відкривається із замочком;
- http:// і www перенаправляють на https://yaremiya.com;
- https://yaremiya.com/sitemap-index.xml і /robots.txt відкриваються;
- перевірка розмітки для Google: https://search.google.com/test/rich-results.
