"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import type { Role } from "@/lib/permissions";
import Dropdown from "./Dropdown";
import { isActive, navItems, type NavItem } from "./nav";
import styles from "./shell.module.css";

/** Скільки вкладок показуємо, решта — у «Ще». */
const MAX_TABS = 5;

/** Нижні вкладки на телефоні. */
export default function TabBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navItems(role);
  const needsMore = items.length > MAX_TABS;
  const tabs = needsMore ? items.slice(0, MAX_TABS - 1) : items;
  const more = needsMore ? items.slice(MAX_TABS - 1) : [];
  const moreActive = more.some((item) => isActive(pathname, item.href));

  return (
    <nav aria-label="Розділи CRM" className={styles.tabBar} data-shell="tab-bar">
      <ul className={styles.tabList}>
        {tabs.map((item) => (
          <li key={item.section}>
            <Tab item={item} active={isActive(pathname, item.href)} />
          </li>
        ))}
        {needsMore && (
          <li>
            <Dropdown
              placement="above-end"
              buttonLabel="Ще розділи"
              buttonClassName={`${styles.tab} ${moreActive ? styles.tabActive : ""}`}
              button={
                <>
                  <span className={styles.tabIcon}>
                    <Ellipsis strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className={styles.tabLabel} aria-hidden="true">
                    Ще
                  </span>
                </>
              }
            >
              <ul className={styles.menuList}>
                {more.map(({ section, href, label, icon: Icon }) => (
                  <li key={section}>
                    <Link
                      href={href}
                      className={styles.menuLink}
                      aria-current={isActive(pathname, href) ? "page" : undefined}
                    >
                      <Icon strokeWidth={1.75} aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Dropdown>
          </li>
        )}
      </ul>
    </nav>
  );
}

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, tabIcon: Icon, badge } = item;
  return (
    <Link
      href={href}
      className={`${styles.tab} ${active ? styles.tabActive : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <span className={styles.tabIcon}>
        <Icon strokeWidth={1.75} aria-hidden="true" />
        {badge ? (
          <span className={styles.tabBadge}>
            {badge}
            <span className="visually-hidden"> нових</span>
          </span>
        ) : null}
      </span>
      <span className={styles.tabLabel}>{label}</span>
    </Link>
  );
}
