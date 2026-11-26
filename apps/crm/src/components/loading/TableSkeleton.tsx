import { Skeleton, SkeletonLine } from "./Skeleton";
import styles from "./table-skeleton.module.css";

export type SkeletonColumn =
  /** Короткий текст: №, сума. */
  | "short"
  /** Ім'я + підпис у два рядки. */
  | "two-lines"
  /** Довгий текст (рослини, опис). */
  | "wide"
  /** Пігулка статусу 28 × 84. */
  | "pill"
  /** Фото 44 px + два рядки. */
  | "photo";

const WIDE = ["78%", "56%", "68%", "48%", "72%", "60%", "52%", "82%"];

/**
 * Перше завантаження таблиці чи списку (замовлення, рослини, користувачі):
 * 5–8 рядків у формі колонок цієї таблиці. На телефоні — рядки-картки.
 */
export default function TableSkeleton({
  rows = 6,
  columns = ["short", "two-lines", "wide", "short", "pill"],
}: {
  rows?: number;
  columns?: SkeletonColumn[];
}) {
  return (
    <div className={styles.card} aria-hidden="true">
      <div
        className={styles.table}
        style={{ gridTemplateColumns: columns.map((c) => (c === "wide" ? "minmax(0, 3fr)" : c === "two-lines" || c === "photo" ? "minmax(0, 2fr)" : "auto")).join(" ") }}
      >
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className={styles.row}>
            {columns.map((col, c) => (
              <div key={c} className={`${styles.cell} ${styles[`cell_${col.replace("-", "")}`] ?? ""}`}>
                {col === "short" && <Skeleton w={c === 0 ? 44 : 70} h={13} />}
                {col === "two-lines" && (
                  <span className={styles.stack}>
                    <SkeletonLine w="72%" h={13} lh={20} />
                    <SkeletonLine w="44%" h={10} lh={16} />
                  </span>
                )}
                {col === "wide" && <Skeleton w={WIDE[r % WIDE.length]} h={13} />}
                {col === "pill" && <Skeleton w={84} h={28} r={999} />}
                {col === "photo" && (
                  <span className={styles.photoCell}>
                    <Skeleton w={44} h={44} r={10} />
                    <span className={styles.stack}>
                      <SkeletonLine w={WIDE[r % WIDE.length]} h={13} lh={20} />
                      <SkeletonLine w="40%" h={10} lh={16} />
                    </span>
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
