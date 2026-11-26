"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, Check, CircleAlert, Sprout } from "lucide-react";
import Button from "@/components/loading/Button";
import { PLANT_STATUS_LABELS } from "@yaremiya/shared/plant-format";
import type { PlantStatus } from "@yaremiya/shared/db/schema";
import styles from "./plants.module.css";

export function StatusPill({ status }: { status: PlantStatus }) {
  return <span className={`${styles.pill} ${styles[`pill_${status}`]}`}>{PLANT_STATUS_LABELS[status]}</span>;
}

export function PlantThumb({ src, size = 48 }: { src: string | null; size?: number }) {
  return src ? (
    <img src={src} alt="" width={size} height={size} className={styles.photo} loading="lazy" decoding="async" />
  ) : (
    <span className={styles.photoEmpty} aria-hidden="true">
      <Sprout strokeWidth={1.75} />
    </span>
  );
}

/** Перемикач (role="switch"): «Показувати на сайті». */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles.switch}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  );
}

export type ToastState = { text: string; error?: boolean } | null;

/** Коротке повідомлення після дії; зникає саме (помилка — довше). */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((text: string, error = false) => {
    clearTimeout(timer.current);
    setToast({ text, error });
    timer.current = setTimeout(() => setToast(null), error ? 6000 : 3500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { toast, show };
}

export function Toast({ toast }: { toast: ToastState }) {
  return (
    <div className={styles.toastWrap} role="status" aria-live="polite">
      {toast && (
        <span className={`${styles.toast} ${toast.error ? styles.toastError : ""}`}>
          {toast.error ? <CircleAlert strokeWidth={1.75} aria-hidden="true" /> : <Check strokeWidth={1.75} aria-hidden="true" />}
          {toast.text}
        </span>
      )}
    </div>
  );
}

/** «Перенести в архів?» — вікно підтвердження (нативний <dialog>: Escape, фокус усередині). */
export function ArchiveDialog({
  plantName,
  onConfirm,
  onClose,
}: {
  plantName: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (plantName && !dialog.open) dialog.showModal();
    if (!plantName && dialog.open) dialog.close();
  }, [plantName]);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="archive-title"
      aria-describedby="archive-text"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current && !busy) ref.current?.close();
      }}
    >
      <span className={styles.dialogIcon} aria-hidden="true">
        <Archive strokeWidth={1.75} />
      </span>
      <h2 id="archive-title" className={styles.dialogTitle}>
        Перенести в архів «{plantName}»?
      </h2>
      <p id="archive-text" className={styles.dialogText}>
        Рослина зникне з сайту й зі списку. Старі замовлення збережуть її назву й ціну. Повернути можна будь-коли з
        вкладки «Архів».
      </p>
      <div className={styles.dialogButtons}>
        <button type="button" className={styles.buttonLight} onClick={() => ref.current?.close()} disabled={busy} autoFocus>
          Скасувати
        </button>
        <Button
          className={styles.buttonDark}
          loading={busy}
          loadingText="Переносимо…"
          icon={<Archive strokeWidth={1.75} aria-hidden="true" />}
          onClick={confirm}
        >
          В архів
        </Button>
      </div>
    </dialog>
  );
}
