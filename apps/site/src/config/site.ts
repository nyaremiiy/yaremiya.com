// Усі контакти й посилання сайту — в одному місці.
// Коли з'являться справжні посилання (месенджери, соцмережі, карта) — міняйте тут.

export const SITE_URL = 'https://yaremiya.com';

export const business = {
  name: 'ЯРЕМІЯ — простір рослин',
  shortName: 'ЯРЕМІЯ',
  village: 'с. Мужиловичі',
  address: 'с. Мужиловичі, Яворівський р-н, Львівська обл.',
  addressShort: 'с. Мужиловичі, Львівська обл.',
  hours: 'з 8:00 до 24:00',
  hoursShort: '8:00–24:00',
  email: 'yaremiya.prostir.roslyn@gmail.com',
  phones: {
    manager: { display: '+380 93 830 83 14', tel: '+380938308314', note: 'менеджер, замовлення' },
    owner: { display: '+380 98 992 77 65', tel: '+380989927765', note: 'власник' },
  },
  delivery: {
    radius: '[радіус]',
    carrier: '[перевізник]',
  },
};

// Посилання, яких ще немає, — поки '#'.
export const links = {
  viber: '#',
  telegram: '#',
  whatsapp: '#',
  instagram: '#',
  facebook: '#',
  route: '#', // «Прокласти маршрут» — посилання на Google Карти
};

// Адреси сторінок. Поки інших сторінок немає — ведуть на секції головної або '#'.
// Коли з'явиться сторінка, достатньо змінити адресу тут (наприклад catalog: '/catalog').
export const routes = {
  home: '/',
  catalog: '#catalog',
  catalogCategory: (_category: string) => '#catalog',
  plant: (_slug: string) => '#',
  favorites: '#',
  cart: '#',
  care: '#',
  delivery: '#order',
  privacy: '#',
  terms: '#',
};

// Куди надсилати форми. Задається у файлі .env (див. .env.example).
// Якщо порожньо — форма просто показує подяку.
export const endpoints = {
  lead: import.meta.env.PUBLIC_FORM_ENDPOINT ?? '',
  subscribe: import.meta.env.PUBLIC_SUBSCRIBE_ENDPOINT ?? '',
};
