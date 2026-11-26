import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { CurrentUser } from "@/lib/current-user";
import { seasonNote } from "@/lib/demo-data";
import { formatToday } from "@/lib/format";
import { can } from "@/lib/permissions";
import ProgressBar from "@/components/loading/ProgressBar";
import BellButton from "./BellButton";
import RolePill from "./RolePill";
import styles from "./shell.module.css";

/**
 * Верхня панель сторінки.
 * Без `title` — привітання з датою (дашборд), з `title` — назва розділу.
 * На телефоні — без пошуку й кнопок (вони в шапці), лише заголовок.
 */
export default function TopBar({ user, title }: { user: CurrentUser; title?: ReactNode }) {
  const isGreeting = title === undefined;
  const today = formatToday();
  const note = user.role === "worker" ? "ось що треба зробити сьогодні" : seasonNote;

  return (
    <header className={`${styles.topBar} ${isGreeting ? styles.topBarGreeting : styles.topBarTitle}`}>
      <div className={styles.topBarText}>
        {isGreeting ? (
          <>
            <div className={styles.greetingRow}>
              <h1 className={styles.greeting}>
                {user.vocative ? `Доброго дня, ${user.vocative}!` : "Доброго дня!"}
              </h1>
              <RolePill role={user.role} />
            </div>
            <p className={styles.dateLine}>
              {today}
              <span className={styles.dateNote}> · {note}</span>
            </p>
          </>
        ) : (
          <h1 className={styles.pageTitle}>{title}</h1>
        )}
      </div>

      <div className={styles.topBarActions}>
        <form role="search" action="/orders" className={styles.search}>
          <Search strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            name="q"
            aria-label="Пошук"
            placeholder="Пошук: замовлення, клієнт, рослина"
            className={styles.searchInput}
          />
        </form>
        <BellButton className={styles.bell} />
        {can(user.role, "createOrders") && (
          <Link href="/orders" className={styles.primaryButton}>
            <Plus strokeWidth={1.75} aria-hidden="true" />
            Нове замовлення
          </Link>
        )}
      </div>
      <ProgressBar placement="topBar" />
    </header>
  );
}
