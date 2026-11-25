import { Bell } from "lucide-react";
import styles from "./shell.module.css";

/** Дзвіночок сповіщень. Поки лише вигляд — сповіщень ще немає. */
export default function BellButton({ className }: { className: string }) {
  return (
    <button type="button" className={className} aria-label="Сповіщення: є нові">
      <Bell strokeWidth={1.75} aria-hidden="true" />
      <span className={styles.bellDot} aria-hidden="true" />
    </button>
  );
}
