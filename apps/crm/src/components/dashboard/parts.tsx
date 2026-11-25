/* Дрібні спільні частини дашборду (серверні компоненти). */

import {
  Banknote,
  ClipboardList,
  Inbox,
  LockKeyhole,
  LogIn,
  Package,
  Sprout,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import {
  ORDER_STATUS_LABELS,
  type ActivityKind,
  type MetricKey,
  type MetricTone,
  type OrderStatus,
  type RichText as RichTextValue,
} from "@/lib/demo-data";
import styles from "./dashboard.module.css";

export const METRIC_ICONS: Record<MetricKey, LucideIcon> = {
  orders: ClipboardList,
  revenue: Banknote,
  leads: Inbox,
  stock: Sprout,
};

export function toneClass(tone: MetricTone): string {
  return styles[`tone_${tone}`];
}

const STATUS_TONE: Record<OrderStatus, string> = {
  new: "blue",
  confirmed: "green",
  ready: "amber",
  issued: "grey",
  cancelled: "red",
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`${styles.statusPill} ${styles[`tone_${STATUS_TONE[status]}`]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export const ACTIVITY_ICONS: Record<ActivityKind, LucideIcon> = {
  order: ClipboardList,
  stock: Package,
  login: LogIn,
  price: Sprout,
  failedLogin: LockKeyhole,
  userAdded: UserPlus,
};

export function RichText({ value }: { value: RichTextValue }) {
  return (
    <>
      {value.map((part, i) =>
        typeof part === "string" ? <span key={i}>{part}</span> : <strong key={i}>{part.b}</strong>,
      )}
    </>
  );
}

/** Смуга продажів: доля від 0 до 100. */
export function Bar({ percent, thin }: { percent: number; thin?: boolean }) {
  return (
    <span className={`${styles.bar} ${thin ? styles.barThin : ""}`} aria-hidden="true">
      <span className={styles.barFill} style={{ width: `${percent}%` }} />
    </span>
  );
}
