import type { CSSProperties } from "react";
import styles from "./loading.module.css";

type Size = number | string;
const px = (v: Size | undefined) => (typeof v === "number" ? `${v}px` : v);

/**
 * Сірий блок скелетона (завжди `aria-hidden`).
 * Радіус як у справжнього елемента: текст — 6–8, пігулка — 999, фото/іконка — 10–12.
 */
export function Skeleton({
  w = "100%",
  h = 14,
  r = 7,
  className,
  style,
}: {
  w?: Size;
  h?: Size;
  r?: Size;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${className ?? ""}`}
      style={{ width: px(w), height: px(h), borderRadius: px(r), ...style }}
    />
  );
}

/**
 * Рядок тексту: висота як у справжнього рядка (`lh`), смужка `h` по центру.
 * Так після завантаження нічого не зсувається.
 */
export function SkeletonLine({
  w = "70%",
  h = 12,
  lh = 20,
  mt,
  r,
}: {
  w?: Size;
  h?: Size;
  lh?: number;
  mt?: number;
  r?: Size;
}) {
  return (
    <span aria-hidden="true" className={styles.line} style={{ height: lh, marginTop: mt }}>
      <Skeleton w={w} h={h} r={r} />
    </span>
  );
}

const DEFAULT_WIDTHS = ["85%", "70%", "55%", "78%", "62%", "45%"];

/** Кілька рядків тексту різної ширини (40–85%), щоб не було «решітки». */
export function SkeletonText({
  lines = 2,
  widths = DEFAULT_WIDTHS,
  h = 12,
  lh = 20,
  gap = 0,
}: {
  lines?: number;
  widths?: Size[];
  h?: number;
  lh?: number;
  gap?: number;
}) {
  return (
    <span aria-hidden="true" className={styles.lines} style={{ gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} w={widths[i % widths.length]} h={h} lh={lh} />
      ))}
    </span>
  );
}
