/**
 * Права ролей — ЄДИНЕ місце, де вирішується, хто що бачить.
 * Меню, дашборд і екран «Немає доступу» беруть права звідси.
 */

export type Role = "admin" | "manager" | "worker";

export type Section =
  | "dashboard"
  | "orders"
  | "leads"
  | "plants"
  | "clients"
  | "subscribers"
  | "content"
  | "users";

/** Окремі можливості всередині розділів (що показувати на дашборді). */
export type Capability =
  | "finance" // виручка, продажі, суми
  | "clientContacts" // заявки й контакти клієнтів
  | "createOrders" // кнопка «Нове замовлення»
  | "teamActivity"; // «Активність у CRM», «Команда»

export const ROLES: Role[] = ["admin", "manager", "worker"];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Адміністратор",
  manager: "Менеджер",
  worker: "Працівник",
};

/** Для речень «доступний менеджеру й адміністратору». */
const ROLE_DATIVE: Record<Role, string> = {
  admin: "адміністратору",
  manager: "менеджеру",
  worker: "працівнику",
};

/** Порядок пунктів меню. */
export const SECTION_ORDER: Section[] = [
  "dashboard",
  "orders",
  "leads",
  "plants",
  "clients",
  "subscribers",
  "content",
  "users",
];

export const SECTION_PATHS: Record<Section, string> = {
  dashboard: "/dashboard",
  orders: "/orders",
  leads: "/leads",
  plants: "/plants",
  clients: "/clients",
  subscribers: "/subscribers",
  content: "/content",
  users: "/users",
};

const SECTION_TITLES: Record<Section, string> = {
  dashboard: "Дашборд",
  orders: "Замовлення",
  leads: "Заявки",
  plants: "Рослини",
  clients: "Клієнти",
  subscribers: "Підписники",
  content: "Контент сайту",
  users: "Користувачі й ролі",
};

const ACCESS: Record<Role, Section[]> = {
  admin: [...SECTION_ORDER],
  manager: ["dashboard", "orders", "leads", "plants", "clients", "subscribers", "content"],
  // Працівник бачить лише замовлення до видачі — пункт меню зветься «Видача».
  worker: ["dashboard", "orders", "plants"],
};

const CAPABILITIES: Record<Role, Capability[]> = {
  admin: ["finance", "clientContacts", "createOrders", "teamActivity"],
  manager: ["finance", "clientContacts", "createOrders"],
  worker: [],
};

export function canAccess(role: Role, section: Section): boolean {
  return ACCESS[role].includes(section);
}

export function can(role: Role, capability: Capability): boolean {
  return CAPABILITIES[role].includes(capability);
}

export function allowedSections(role: Role): Section[] {
  return SECTION_ORDER.filter((s) => canAccess(role, s));
}

export function sectionTitle(section: Section, role: Role): string {
  if (section === "orders" && role === "worker") return "Видача";
  return SECTION_TITLES[section];
}

export function isSection(value: string): value is Section {
  return (SECTION_ORDER as string[]).includes(value);
}

/** Розділ за адресою (`/clients` → `clients`). */
export function sectionFromPath(pathname: string): Section | null {
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  return isSection(first) ? first : null;
}

/** «менеджеру й адміністратору» — кому доступний розділ. */
export function whoHasAccess(section: Section): string {
  const roles = (["manager", "admin", "worker"] as Role[]).filter((r) => canAccess(r, section));
  const names = roles.map((r) => ROLE_DATIVE[r]);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} й ${names[names.length - 1]}`;
}
