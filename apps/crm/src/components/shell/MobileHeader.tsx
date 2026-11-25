import Link from "next/link";
import { LogOut } from "lucide-react";
import type { DemoUser } from "@/lib/demo-data";
import { ROLE_LABELS } from "@/lib/permissions";
import BellButton from "./BellButton";
import Dropdown from "./Dropdown";
import styles from "./shell.module.css";

/** Темна шапка на телефоні: логотип, дзвіночок, кружечок-ініціал (меню з «Вийти»). */
export default function MobileHeader({ user }: { user: DemoUser }) {
  return (
    <header className={styles.mobileHeader}>
      <Link href="/dashboard" className={styles.mobileLogoLink}>
        <img
          src="/logo/yaremiia-logo-web-on-dark.svg"
          alt="ЯРЕМІЯ — простір рослин. На дашборд"
          width={120}
          height={26}
          className={styles.mobileLogo}
        />
      </Link>

      <div className={styles.mobileHeaderActions}>
        <BellButton className={styles.mobileBell} />
        <Dropdown
          placement="below-end"
          buttonLabel={`${user.name}, ${ROLE_LABELS[user.role]}. Меню користувача`}
          buttonClassName={`${styles.mobileAvatar} ${styles[`mobileAvatar_${user.role}`]}`}
          button={<span aria-hidden="true">{user.initial}</span>}
        >
          <div className={styles.menuUser}>
            <span className={styles.menuUserName}>{user.name}</span>
            <span className={styles.menuUserRole}>{ROLE_LABELS[user.role]}</span>
          </div>
          <Link href="/login" className={styles.menuLink}>
            <LogOut strokeWidth={1.75} aria-hidden="true" />
            Вийти
          </Link>
        </Dropdown>
      </div>
    </header>
  );
}
