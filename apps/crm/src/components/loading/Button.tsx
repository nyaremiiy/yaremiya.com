"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./loading.module.css";

/**
 * Кнопка зі станом очікування: під час дії неактивна (`disabled`, `aria-busy`),
 * через 300 мс — крутилка й «…ємо» («Зберігаємо…»). Ширина не змінюється:
 * обидва написи лежать один на одному, видно лише один.
 */
export default function Button({
  loading = false,
  loadingText,
  icon,
  className,
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  /** «Зберігаємо…», «Входимо…», «Додаємо…» */
  loadingText: string;
  /** Іконка зліва у звичайному стані. */
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      {...rest}
      type={type}
      className={`${className ?? ""} ${loading ? styles.loading : ""}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      <span className={styles.labels}>
        <span className={styles.idle}>
          {icon}
          {children}
        </span>
        <span className={styles.busy} aria-hidden={!loading}>
          <span className={styles.spinner} aria-hidden="true" />
          {loadingText}
        </span>
      </span>
    </button>
  );
}
