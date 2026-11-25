"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import type { DemoUser } from "@/lib/demo-data";
import { ROLE_LABELS } from "@/lib/permissions";
import { isActive, navItems } from "./nav";
import styles from "./shell.module.css";

/** Бічне меню (комп'ютер). */
export default function Sidebar({ user }: { user: DemoUser }) {
  const pathname = usePathname();
  const items = navItems(user.role);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img
          src="/logo/yaremiia-logo-web-on-dark.svg"
          alt="ЯРЕМІЯ — простір рослин"
          width={148}
          height={32}
          className={styles.sidebarLogo}
        />
        <span className={styles.brandLabel}>Панель керування</span>
      </div>

      <nav aria-label="Розділи CRM" className={styles.nav}>
        <ul>
          {items.map(({ section, href, label, icon: Icon, badge }) => {
            const active = isActive(pathname, href);
            return (
              <li key={section}>
                <Link
                  href={href}
                  className={styles.navLink}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon strokeWidth={1.75} aria-hidden="true" />
                  <span className={styles.navLabel}>{label}</span>
                  {badge ? (
                    <span className={styles.navBadge}>
                      {badge}
                      <span className="visually-hidden"> нових</span>
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.userCard}>
        <span className={styles.userInitial} aria-hidden="true">
          {user.initial}
        </span>
        <span className={styles.userText}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userRole}>{ROLE_LABELS[user.role]}</span>
        </span>
        <Link href="/login" className={styles.logout} aria-label="Вийти" title="Вийти">
          <LogOut strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
