/**
 * Спільний стан очікування в браузері (див. docs/loading.md):
 * - лічильник активних очікувань для смужки прогресу;
 * - коли почався перехід між сторінками — щоб затримка 300 мс рахувалась
 *   від кліку, а не окремо для кожного скелетона;
 * - коли скелетон став видимим — щоб показати його щонайменше 400 мс.
 */

export const SHOW_DELAY_MS = 300;
export const MIN_VISIBLE_MS = 400;
/** Довше — вважаємо, що сервер не відповів (див. useAsyncAction). */
export const ACTION_TIMEOUT_MS = 15_000;

/* ───── Смужка прогресу ───── */

let active = 0;
/** Чи видно смужку: спільне для всіх її копій (верхня панель змінюється при переході). */
let visible = false;
let shownAt = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function setVisible(value: boolean) {
  if (visible === value) return;
  visible = value;
  if (value) shownAt = performance.now();
  for (const listener of listeners) listener();
}

/** Показати через 300 мс очікування; сховати не раніше ніж через 400 мс показу. */
function emit() {
  clearTimeout(timer);
  if (active > 0) {
    if (!visible) timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
  } else if (visible) {
    const left = MIN_VISIBLE_MS - (performance.now() - shownAt);
    timer = setTimeout(() => setVisible(false), Math.max(0, left));
  }
}

export function subscribeProgress(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isProgressVisible(): boolean {
  return visible;
}

/** Почати очікування; повертає функцію «готово» (викликати можна й двічі). */
export function startProgress(): () => void {
  active += 1;
  emit();
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(safety);
    active -= 1;
    emit();
  };
  // Запобіжник: смужка не крутиться вічно.
  const safety = setTimeout(finish, ACTION_TIMEOUT_MS);
  return finish;
}

/* ───── Переходи між сторінками ───── */

let navigationStartedAt = 0;
let finishNavigation: (() => void) | null = null;
let hydrated = false;

export function beginNavigation(): void {
  navigationStartedAt = performance.now();
  finishNavigation ??= startProgress();
}

export function endNavigation(): void {
  finishNavigation?.();
  finishNavigation = null;
}

/** Після першого запуску в браузері (до цього — розмітка з сервера, затримку дає CSS). */
export function markHydrated(): void {
  hydrated = true;
}

export function isHydrated(): boolean {
  return hydrated;
}

/**
 * Скільки ще чекати, перш ніж показати скелетон.
 * Одразу після кліку — решту з 300 мс; якщо перехід уже триває довше —
 * без затримки (сторінка вже чекає, скелетон замінює інший скелетон);
 * якщо давно ніхто нікуди не переходив — повні 300 мс.
 */
export function remainingShowDelay(): number {
  const since = performance.now() - navigationStartedAt;
  if (since < SHOW_DELAY_MS) return SHOW_DELAY_MS - since;
  return since < 3000 ? 0 : SHOW_DELAY_MS;
}

/* ───── Мінімальний час показу скелетона ───── */

const visibleSince = new Map<string, number>();

export function markSkeletonVisibleAt(id: string, at: number): void {
  visibleSince.set(id, at);
}

/** Скільки ще тримати скелетон, щоб він не «блимнув» (0 — не треба). */
export function takeHoldTime(id: string): number {
  const since = visibleSince.get(id);
  visibleSince.delete(id);
  if (since === undefined) return 0;
  const now = performance.now();
  if (now < since) return 0; // ще не встиг з'явитися — просто показуємо вміст
  return Math.max(0, MIN_VISIBLE_MS - (now - since));
}
