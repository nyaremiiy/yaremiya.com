#!/usr/bin/env bash
# Оновлення сайту yaremiya.com на сервері.
# Запуск (на сервері):  bash /opt/yaremiya/apps/site/deploy/update-site.sh
#
# Що робить:
#   1. забирає свіжий код із git;
#   2. встановлює залежності й збирає сайт;
#   3. кладе нову версію в окрему папку й миттєво перемикає на неї посилання `current`
#      (відвідувачі не бачать «напівоновленого» сайту);
#   4. залишає 5 останніх версій, щоб можна було швидко відкотитись.
#
# Відкотитись на попередню версію:  bash update-site.sh --rollback
# Лише перезібрати (без git і встановлення; так робить сервіс після змін у CRM):
#                                    bash update-site.sh --rebuild

set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/yaremiya}"          # де лежить клон репозиторію
WEB_ROOT="${WEB_ROOT:-/var/www/yaremiya}"       # звідси Caddy/nginx віддає сайт
BRANCH="${BRANCH:-main}"
KEEP="${KEEP:-5}"

RELEASES="$WEB_ROOT/releases"
CURRENT="$WEB_ROOT/current"

if [[ "${1:-}" == "--rollback" ]]; then
  prev=$(ls -1d "$RELEASES"/*/ | sort | tail -n 2 | head -n 1)
  [[ -z "$prev" ]] && { echo "Немає попередньої версії."; exit 1; }
  ln -sfn "$prev" "$CURRENT.tmp" && mv -Tf "$CURRENT.tmp" "$CURRENT"
  echo "Повернуто версію: $prev"
  exit 0
fi

cd "$REPO_DIR"
if [[ "${1:-}" != "--rebuild" ]]; then
  echo "→ Оновлюю код ($BRANCH)…"
  git fetch --quiet origin "$BRANCH"
  git reset --hard --quiet "origin/$BRANCH"

  echo "→ Встановлюю залежності…"
  pnpm install --frozen-lockfile

  echo "→ Застосовую міграції бази…"
  pnpm db:migrate
fi

echo "→ Збираю сайт…"
pnpm --filter site build

stamp=$(date +%Y%m%d-%H%M%S)
target="$RELEASES/$stamp"
mkdir -p "$target"
cp -a "$REPO_DIR/apps/site/dist/." "$target/"

echo "→ Перемикаю на нову версію…"
ln -sfn "$target" "$CURRENT.tmp" && mv -Tf "$CURRENT.tmp" "$CURRENT"

# прибираємо старі версії
ls -1d "$RELEASES"/*/ | sort | head -n -"$KEEP" | xargs -r rm -rf

echo "✓ Готово: сайт оновлено ($stamp)."
