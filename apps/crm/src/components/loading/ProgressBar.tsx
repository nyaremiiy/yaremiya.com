"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  beginNavigation,
  endNavigation,
  isProgressVisible,
  markHydrated,
  subscribeProgress,
} from "@/lib/loading-store";
import styles from "./loading.module.css";

/**
 * Смужка прогресу 3 px: з'являється, якщо чекати довше 300 мс,
 * і тримається щонайменше 400 мс (відлік — спільний, у loading-store). Позицію задає місце, куди її вставили:
 * `placement="topBar"` — під верхньою панеллю (комп'ютер),
 * `placement="header"` — під темною шапкою (телефон), закріплена зверху.
 */
export default function ProgressBar({ placement }: { placement: "topBar" | "header" }) {
  const visible = useSyncExternalStore(subscribeProgress, isProgressVisible, () => false);

  const bar = (
    <div className={styles.progress} data-visible={visible} aria-hidden="true">
      <div className={styles.progressRunner} />
    </div>
  );

  return placement === "header" ? (
    <div className={styles.progressSlot}>{bar}</div>
  ) : (
    <div className={styles.progressInTopBar}>{bar}</div>
  );
}

/**
 * Стежить за переходами між сторінками (один на весь каркас):
 * клік по внутрішньому посиланню, пошук, «назад/вперед» — смужка;
 * адреса змінилась — готово.
 */
export function NavigationWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    endNavigation();
  }, [pathname, search]);

  useEffect(() => {
    markHydrated();

    const isNewPage = (url: URL) =>
      url.origin === location.origin &&
      (url.pathname !== location.pathname || url.search !== location.search);

    // Фаза перехоплення: спрацьовує до того, як Link скасує звичайний перехід.
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      if (isNewPage(new URL(link.href))) beginNavigation();
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.method.toLowerCase() !== "get") return;
      if (isNewPage(new URL(form.action))) beginNavigation();
    };

    const onPopState = () => beginNavigation();

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return null;
}
