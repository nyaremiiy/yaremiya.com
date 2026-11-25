import {
  ClipboardList,
  Inbox,
  LayoutDashboard,
  Mail,
  PackageCheck,
  PanelTop,
  Settings,
  Sprout,
  Users,
  type LucideIcon,
} from "lucide-react";
import { navBadges } from "@/lib/demo-data";
import { allowedSections, sectionTitle, SECTION_PATHS, type Role, type Section } from "@/lib/permissions";

const ICONS: Record<Section, LucideIcon> = {
  dashboard: LayoutDashboard,
  orders: ClipboardList,
  leads: Inbox,
  plants: Sprout,
  clients: Users,
  subscribers: Mail,
  content: PanelTop,
  users: Settings,
};

export type NavItem = {
  section: Section;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Іконка в нижніх вкладках на телефоні (у «Видачі» — коробка з галочкою). */
  tabIcon: LucideIcon;
  badge?: number;
};

function badgeFor(section: Section, role: Role): number | undefined {
  if (section === "orders") return role === "worker" ? navBadges.issue : navBadges.orders;
  if (section === "leads") return navBadges.leads;
  return undefined;
}

/** Пункти меню — лише дозволені ролі, у сталому порядку. */
export function navItems(role: Role): NavItem[] {
  return allowedSections(role).map((section) => ({
    section,
    href: SECTION_PATHS[section],
    label: sectionTitle(section, role),
    icon: ICONS[section],
    tabIcon: section === "orders" && role === "worker" ? PackageCheck : ICONS[section],
    badge: badgeFor(section, role),
  }));
}

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
