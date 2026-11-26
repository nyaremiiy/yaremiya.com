/**
 * Демонстраційні дані CRM — ЄДИНЕ місце. Потім їх замінить база PostgreSQL (користувачі й «Команда» — уже з бази).
 * Числа з пробілами пишемо з нерозривним пробілом ( ), щоб не переносились.
 */

export const seasonNote = "зараз сезон хризантем і самшиту";

/* ───── Лічильники в меню ───── */

export const navBadges = {
  orders: 3,
  leads: 2,
  /** У Працівника пункт «Видача». */
  issue: 2,
};

/* ───── Сьогодні: показники (менеджер / адмін) ───── */

export type MetricTone = "blue" | "green" | "amber" | "leaf";
export type MetricKey = "orders" | "revenue" | "leads" | "stock";

export type Metric = {
  key: MetricKey;
  tone: MetricTone;
  title: string;
  value: string;
  caption: string;
  /** Коротший варіант для телефона. */
  mobile: { value: string; label: string; caption: string };
};

export const todayMetrics: Metric[] = [
  {
    key: "orders",
    tone: "blue",
    title: "Нові замовлення",
    value: "3",
    caption: "+2 сьогодні",
    mobile: { value: "3", label: "Нові замовлення", caption: "+2 сьогодні" },
  },
  {
    key: "revenue",
    tone: "green",
    title: "Виручка за листопад",
    value: "18 450 грн",
    caption: "+12% до жовтня",
    mobile: { value: "18 450", label: "Виручка", caption: "грн за листопад" },
  },
  {
    key: "leads",
    tone: "amber",
    title: "Заявки без відповіді",
    value: "2",
    caption: "найстаріша — 3 год тому",
    mobile: { value: "2", label: "Заявки", caption: "без відповіді" },
  },
  {
    key: "stock",
    tone: "leaf",
    title: "Рослин у наявності",
    value: "14 з 20",
    caption: "6 — передзамовлення",
    mobile: { value: "14/20", label: "У наявності", caption: "рослин" },
  },
];

/* ───── Замовлення ───── */

export type OrderStatus = "new" | "confirmed" | "ready" | "issued" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Нове",
  confirmed: "Підтверджено",
  ready: "Готове",
  issued: "Видано",
  cancelled: "Скасовано",
};

export type RecentOrder = {
  id: string;
  number: string;
  client: string;
  date: string;
  plants: string;
  total: string;
  status: OrderStatus;
};

export const recentOrders: RecentOrder[] = [
  { id: "o-1048", number: "#1048", client: "Олена К.", date: "сьогодні, 11:20", plants: "Лаванда Хідкот ×5, Самшит Р9 ×20", total: "1 550 грн", status: "new" },
  { id: "o-1047", number: "#1047", client: "Андрій М.", date: "сьогодні, 09:05", plants: "Хризантема мультифлора ×4", total: "600 грн", status: "new" },
  { id: "o-1046", number: "#1046", client: "Ірина С.", date: "вчора, 18:40", plants: "Самшит-куля ×2", total: "1 800 грн", status: "confirmed" },
  { id: "o-1045", number: "#1045", client: "Тарас П.", date: "вчора, 14:12", plants: "Хризантема кущова ×6", total: "600 грн", status: "ready" },
  { id: "o-1044", number: "#1044", client: "Марія Л.", date: "14 листопада", plants: "Лаванда 2 л ×3, Самшит 3 л ×1", total: "790 грн", status: "issued" },
];

/** Скільки останніх замовлень показувати на телефоні. */
export const recentOrdersMobileCount = 4;

/* ───── Заявки ───── */

export type Lead = {
  id: string;
  name: string;
  /** Телефон частково прихований. */
  phoneMasked: string;
  ago: string;
  text: string;
  channel: string;
};

export const newLeads: Lead[] = [
  { id: "l-1", name: "Наталія", phoneMasked: "+380 67 *** ** 12", ago: "3 год тому", text: "Хоче 40 кущів самшиту на живопліт, питає про знижку", channel: "Viber" },
  { id: "l-2", name: "Віктор", phoneMasked: "+380 50 *** ** 48", ago: "5 год тому", text: "Коли буде розсада томатів черрі?", channel: "Дзвінок" },
];

/* ───── Закінчуються ───── */

export type LowStockItem = {
  id: string;
  name: string;
  pot: string;
  qty: number;
  image: string;
};


/* ───── Продажі ───── */

export const salesMonth = "листопад";

export const salesByCategory = [
  { name: "Хризантеми", sum: "9 590 грн", percent: 52 },
  { name: "Самшит", sum: "5 170 грн", percent: 28 },
  { name: "Лаванда", sum: "2 580 грн", percent: 14 },
  { name: "Саджанці", sum: "1 110 грн", percent: 6 },
];

/* ───── Активність у CRM (адмін) ───── */

export type ActivityKind = "order" | "stock" | "login" | "price" | "failedLogin" | "userAdded";

/** Текст події: звичайні рядки й жирні фрагменти { b: "…" }. */
export type RichText = (string | { b: string })[];

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  text: RichText;
  time: string;
};

export const activity: ActivityEvent[] = [
  { id: "a-1", kind: "order", text: [{ b: "Менеджер" }, " змінив статус замовлення ", { b: "#1046" }, " на «Підтверджено»"], time: "10:42" },
  { id: "a-2", kind: "stock", text: [{ b: "Оксана" }, " оновила залишок: ", { b: "Лаванда 2 л" }, " → 4 шт."], time: "09:15" },
  { id: "a-3", kind: "login", text: [{ b: "Менеджер" }, " увійшов у CRM"], time: "09:12" },
  { id: "a-4", kind: "price", text: [{ b: "Менеджер" }, " змінив ціну: ", { b: "Самшит-куля 10 л" }, " 850 → 900 грн"], time: "вчора, 18:05" },
  { id: "a-5", kind: "failedLogin", text: [{ b: "ivan@example.com" }, " невдала спроба входу (доступ вимкнено)"], time: "вчора, 21:03" },
  { id: "a-6", kind: "userAdded", text: [{ b: "Власник" }, " додав користувача ", { b: "Оксана" }, " (Працівник)"], time: "23 листопада" },
];

/** Скільки подій показувати на телефоні. */
export const activityMobileCount = 4;

/* ───── Працівник: справи на сьогодні ───── */

export type OrderToPrepare = {
  id: string;
  number: string;
  client: string;
  items: string;
  delivery: string;
};

export const ordersToPrepare: OrderToPrepare[] = [
  { id: "o-1046", number: "#1046", client: "Ірина С.", items: "Самшит — сформована куля 10 л × 2", delivery: "Доставка поблизу · субота після 12:00" },
  { id: "o-1045", number: "#1045", client: "Тарас П.", items: "Хризантема кущова біла 2 л × 6", delivery: "Самовивіз · сьогодні" },
  { id: "o-1048", number: "#1048", client: "Олена К.", items: "Лаванда Хідкот 0,5 л × 5, Самшит для живоплоту × 20", delivery: "Поштою · після підтвердження" },
];

export const pickupsToday = 1;
