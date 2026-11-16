// Форми заявки й підписки.
// Поки адреси відправки немає (PUBLIC_FORM_ENDPOINT у .env порожній) — просто показуємо подяку.
// Коли з'явиться сервіс, що пересилає заявки в Telegram, достатньо вписати його адресу в .env —
// форма надішле туди JSON методом POST.

type Errors = Record<string, string>;

const phoneDigits = (v: string) => v.replace(/\D/g, '');

const validators: Record<string, (form: HTMLFormElement) => Errors> = {
  lead(form) {
    const errors: Errors = {};
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value.trim();
    if (!name) errors.name = 'Будь ласка, напишіть, як до вас звертатися.';
    if (!phone) errors.phone = 'Будь ласка, вкажіть номер телефону.';
    else if (phoneDigits(phone).length < 10 || phoneDigits(phone).length > 13)
      errors.phone = 'Схоже, в номері помилка. Наприклад: +380 93 123 45 67';
    return errors;
  },
  subscribe(form) {
    const errors: Errors = {};
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    if (!email) errors.email = 'Вкажіть e-mail, щоб ми могли написати.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Схоже, в адресі помилка.';
    return errors;
  },
};

function showErrors(form: HTMLFormElement, scope: ParentNode, errors: Errors) {
  let first: HTMLElement | null = null;
  form.querySelectorAll<HTMLInputElement>('input[name], textarea[name]').forEach((input) => {
    const msg = errors[input.name];
    const errEl = scope.querySelector<HTMLElement>(`[data-err-for="${input.name}"]`);
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      first ??= input;
    } else {
      input.removeAttribute('aria-invalid');
    }
    if (errEl) errEl.textContent = msg ?? '';
  });
  (first as HTMLElement | null)?.focus();
}

async function send(endpoint: string, data: Record<string, unknown>) {
  if (!endpoint) return; // бекенду ще немає
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, page: location.href, sentAt: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export function initForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
    const kind = form.dataset.form!;
    const scope = form.parentElement ?? form;
    const thanks = scope.querySelector<HTMLElement>(`[data-thanks="${kind}"]`);
    const formError = form.querySelector<HTMLElement>('[data-form-error]');
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');

    // Прибираємо помилку, щойно людина почала виправляти поле.
    form.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.getAttribute('aria-invalid') === 'true') {
        input.removeAttribute('aria-invalid');
        const errEl = scope.querySelector<HTMLElement>(`[data-err-for="${input.name}"]`);
        if (errEl) errEl.textContent = '';
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errors = validators[kind]?.(form) ?? {};
      showErrors(form, scope, errors);
      if (Object.keys(errors).length) return;

      const data = Object.fromEntries(new FormData(form).entries());
      if (formError) formError.hidden = true;
      if (submit) submit.disabled = true;
      try {
        await send(form.dataset.endpoint ?? '', { type: kind, ...data });
        form.reset();
        form.hidden = true;
        if (thanks) {
          thanks.hidden = false;
          if (thanks.tabIndex === -1) thanks.focus();
        }
      } catch {
        if (formError) {
          formError.textContent = 'Не вдалося надіслати. Спробуйте ще раз або просто зателефонуйте нам.';
          formError.hidden = false;
        }
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  });
}
