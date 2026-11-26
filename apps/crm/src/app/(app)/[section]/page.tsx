import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sprout } from "lucide-react";
import TopBar from "@/components/shell/TopBar";
import styles from "@/components/shell/placeholder.module.css";
import { demoDelay } from "@/lib/demo-delay";
import { getCurrentUser, requireSection } from "@/lib/session";
import { canAccess, isSection, sectionTitle, type Section } from "@/lib/permissions";

type Params = { params: Promise<{ section: string }> };

/** Розділи меню, яких ще немає (дашборд — окрема сторінка). */
function resolveSection(value: string): Exclude<Section, "dashboard"> | null {
  return isSection(value) && value !== "dashboard" ? value : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const section = resolveSection((await params).section);
  if (!section) return {};
  const user = await getCurrentUser();
  if (!user) return {};
  return { title: canAccess(user.role, section) ? sectionTitle(section, user.role) : "Немає доступу" };
}

export default async function SectionPage({ params }: Params) {
  const section = resolveSection((await params).section);
  if (!section) notFound();

  // Не увійшли → /login; недозволений розділ → «Немає доступу» (forbidden.tsx), 403.
  const user = await requireSection(section);
  // Лише для перевірки скелетона в режимі розробки (DEMO_DELAY_MS).
  await demoDelay(1);

  return (
    <>
      <TopBar user={user} title={sectionTitle(section, user.role)} />
      <div className={styles.placeholder}>
        <span className={styles.placeholderIcon} aria-hidden="true">
          <Sprout strokeWidth={1.75} />
        </span>
        <h2 className={styles.placeholderTitle}>Розділ у розробці</h2>
        <p className={styles.placeholderText}>Скоро тут з’явиться робота з цим розділом.</p>
      </div>
    </>
  );
}
