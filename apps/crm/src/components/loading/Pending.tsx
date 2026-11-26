"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import {
  isHydrated,
  markSkeletonVisibleAt,
  remainingShowDelay,
  SHOW_DELAY_MS,
  takeHoldTime,
} from "@/lib/loading-store";
import styles from "./loading.module.css";

/**
 * Область, що вантажиться: `aria-busy`, прихований текст для читачів екрана
 * (`role="status"`), а сам скелетон з'являється лише через 300 мс.
 */
export function Pending({
  id,
  label,
  immediate,
  children,
}: {
  /** Щоб після завантаження потримати скелетон мінімум 400 мс (див. Reveal). */
  id?: string;
  label: string;
  immediate?: boolean;
  children: ReactNode;
}) {
  // На сервері й під час першого запуску затримку дає CSS (300 мс);
  // при переходах — рахуємо від кліку.
  const [delay] = useState<number | null>(() =>
    immediate ? 0 : isHydrated() ? remainingShowDelay() : null,
  );

  useEffect(() => {
    if (id) markSkeletonVisibleAt(id, performance.now() + (delay ?? SHOW_DELAY_MS));
  }, [id, delay]);

  return (
    <div
      className={styles.pending}
      aria-busy="true"
      style={delay === null ? undefined : { animationDelay: `${delay}ms` }}
    >
      <span role="status" className="visually-hidden">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * Обгортка справжнього вмісту: якщо скелетон щойно з'явився,
 * тримаємо його до 400 мс, щоб не «блимав». Вміст при цьому вже
 * змонтовано (прихований), тож після показу нічого не перемальовується.
 */
export function Reveal({
  id,
  label,
  skeleton,
  children,
}: {
  id: string;
  label: string;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  const [hold, setHold] = useState(false);

  useLayoutEffect(() => {
    const ms = takeHoldTime(id);
    if (ms <= 0) return;
    setHold(true);
    const timer = setTimeout(() => setHold(false), ms);
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <>
      {hold && (
        <Pending label={label} immediate>
          {skeleton}
        </Pending>
      )}
      <div className={styles.reveal} hidden={hold}>
        {children}
      </div>
    </>
  );
}
