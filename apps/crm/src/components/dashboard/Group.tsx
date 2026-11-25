import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./dashboard.module.css";

/** Група дашборду: підпис-заголовок H2 з іконкою і вміст. */
export default function Group({
  id,
  icon: Icon,
  title,
  className,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const headingId = `${id}-title`;
  return (
    <section aria-labelledby={headingId} className={`${styles.group} ${className ?? ""}`}>
      <h2 id={headingId} className={styles.groupTitle}>
        <Icon strokeWidth={1.75} aria-hidden="true" />
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}
