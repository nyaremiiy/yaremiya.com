"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { sectionFromPath, sectionTitle, whoHasAccess, type Role } from "@/lib/permissions";
import styles from "./placeholder.module.css";

/** Назва розділу за адресою — для верхньої панелі на екрані «Немає доступу». */
export function CurrentSectionTitle({ role }: { role: Role }) {
  const section = sectionFromPath(usePathname());
  return <>{section ? sectionTitle(section, role) : "Немає доступу"}</>;
}

export function NoAccess() {
  const section = sectionFromPath(usePathname());
  const who = section ? whoHasAccess(section) : "";

  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderIcon} aria-hidden="true">
        <LockKeyhole strokeWidth={1.75} />
      </span>
      <h2 className={styles.placeholderTitle}>Немає доступу</h2>
      <p className={styles.placeholderText}>
        {who ? `Цей розділ доступний ${who}. ` : ""}
        Якщо він потрібен вам для роботи — зверніться до адміністратора.
      </p>
      <Link href="/dashboard" className={styles.backButton}>
        <ArrowLeft strokeWidth={1.75} aria-hidden="true" />
        На дашборд
      </Link>
    </div>
  );
}
