"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import styles from "./shell.module.css";

/**
 * Проста спливаюча панель: кнопка + список.
 * Закривається повторним натисканням, Escape, кліком поза нею й при переході.
 */
export default function Dropdown({
  buttonClassName,
  buttonLabel,
  button,
  placement,
  children,
}: {
  buttonClassName: string;
  buttonLabel: string;
  button: ReactNode;
  placement: "below-end" | "above-end";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();

  // Закрити при переході на іншу сторінку.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.dropdown} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={buttonClassName}
        aria-label={buttonLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {button}
      </button>
      <div
        id={panelId}
        hidden={!open}
        className={`${styles.dropdownPanel} ${placement === "above-end" ? styles.dropdownAbove : styles.dropdownBelow}`}
      >
        {children}
      </div>
    </div>
  );
}
