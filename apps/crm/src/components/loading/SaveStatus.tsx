"use client";

import { Check, CircleAlert } from "lucide-react";
import styles from "./loading.module.css";

/**
 * Короткі стани після дії:
 * «Збережено» (`role="status"`, зникає через 3 с — див. useAsyncAction)
 * і «Не вдалося зберегти. Спробувати ще» (`role="alert"`, не зникає сама).
 * Обгортка з role завжди в розмітці, щоб читачі екрана помітили зміну.
 */
export default function SaveStatus({
  status,
  onRetry,
  savedText = "Збережено",
  errorText = "Не вдалося зберегти.",
  className,
}: {
  status: "idle" | "pending" | "saved" | "error";
  onRetry?: () => void;
  savedText?: string;
  errorText?: string;
  className?: string;
}) {
  return (
    <>
      <div role="status" className={className}>
        {status === "saved" && (
          <span className={`${styles.status} ${styles.saved}`}>
            <Check strokeWidth={1.75} aria-hidden="true" />
            {savedText}
          </span>
        )}
      </div>
      <div role="alert" className={className}>
        {status === "error" && (
          <span className={`${styles.status} ${styles.failed}`}>
            <CircleAlert strokeWidth={1.75} aria-hidden="true" />
            {errorText}
            {onRetry && (
              <button type="button" className={styles.retry} onClick={onRetry}>
                Спробувати ще
              </button>
            )}
          </span>
        )}
      </div>
    </>
  );
}
