// Фільтр категорій у каталозі + посилання-чипи, що відкривають каталог з потрібним фільтром.

export function initCatalog() {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('.filter[data-filter]')];
  const cards = [...document.querySelectorAll<HTMLElement>('[data-catalog-grid] [data-category]')];
  const empty = document.querySelector<HTMLElement>('[data-catalog-empty]');
  const status = document.querySelector<HTMLElement>('[data-catalog-status]');
  if (!buttons.length) return;

  const apply = (filter: string) => {
    let shown = 0;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    cards.forEach((card) => {
      const visible = filter === 'all' || card.dataset.category === filter;
      card.hidden = !visible;
      if (visible) shown++;
    });
    if (empty) empty.hidden = shown > 0;
    if (status) status.textContent = `Показано рослин: ${shown}`;
  };

  buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter!)));

  // Чипи в головному екрані й посилання у футері: перейти до каталогу й одразу відфільтрувати.
  document.querySelectorAll<HTMLAnchorElement>('a[data-filter-link]').forEach((a) => {
    a.addEventListener('click', () => {
      if (a.getAttribute('href') === '#catalog') apply(a.dataset.filterLink!);
    });
  });

  // Кнопка «Замовити» в картці: переходимо до форми й підставляємо назву рослини.
  document.querySelectorAll<HTMLAnchorElement>('a[data-order]').forEach((a) => {
    a.addEventListener('click', () => {
      const field = document.querySelector<HTMLTextAreaElement>('#lead-msg');
      const name = a.dataset.order!;
      if (field && !field.value.includes(name)) {
        field.value = field.value.trim() ? `${field.value.trim()}\n${name}` : name;
      }
      setTimeout(() => document.querySelector<HTMLInputElement>('#lead-name')?.focus({ preventScroll: true }), 400);
    });
  });
}
