// «Вподобані» й кошик зберігаються в браузері відвідувача (localStorage).
// Ці самі функції знадобляться на майбутніх сторінках «Вподобані» й «Кошик».

const FAV_KEY = 'yaremiya:favorites';
const CART_KEY = 'yaremiya:cart';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* приватний режим або заблоковане сховище — просто не зберігаємо */
  }
}

export const getFavorites = (): string[] => read<string[]>(FAV_KEY, []);
export const getCart = (): { slug: string; qty: number }[] => read(CART_KEY, []);

function setCount(selector: string, count: number) {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    el.textContent = String(count);
  });
}

function renderHeart(btn: HTMLButtonElement, liked: boolean) {
  btn.setAttribute('aria-pressed', String(liked));
  btn.setAttribute('aria-label', liked ? 'Прибрати з вподобаних' : 'Додати у вподобані');
}

export function initFavorites() {
  let favs = new Set(getFavorites());
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-fav]');

  const sync = () => {
    buttons.forEach((b) => renderHeart(b, favs.has(b.dataset.fav!)));
    setCount('[data-fav-count]', favs.size);
  };

  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      const slug = btn.dataset.fav!;
      if (favs.has(slug)) favs.delete(slug);
      else favs.add(slug);
      write(FAV_KEY, [...favs]);
      sync();
    }),
  );

  // Якщо сайт відкрито в кількох вкладках — тримаємо лічильник однаковим.
  window.addEventListener('storage', (e) => {
    if (e.key === FAV_KEY) {
      favs = new Set(getFavorites());
      sync();
    }
  });

  sync();
  setCount('[data-cart-count]', getCart().reduce((n, i) => n + (i.qty || 0), 0));
}
