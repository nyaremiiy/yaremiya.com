"use client";

import { useParams } from "next/navigation";
import TableSkeleton from "@/components/loading/TableSkeleton";
import { Pending } from "@/components/loading/Pending";
import placeholder from "@/components/shell/placeholder.module.css";
import TopBar from "@/components/shell/TopBar";
import { useCurrentUser } from "@/components/shell/UserProvider";
import { isSection, sectionTitle } from "@/lib/permissions";

/**
 * Поки відкривається розділ: верхня панель з назвою одразу, вміст —
 * таблиця на 6 рядків. Каркас для наступних екранів: коли в розділі
 * з'явиться своя сторінка, вона отримає свій loading.tsx у формі своєї таблиці.
 */
export default function SectionLoading() {
  const user = useCurrentUser();
  const { section } = useParams<{ section: string }>();
  const title = isSection(section) ? sectionTitle(section, user.role) : "";
  const label = title ? `Завантажуємо розділ «${title}»…` : "Завантажуємо…";

  return (
    <>
      <TopBar user={user} title={title} />
      <div className={placeholder.tableArea}>
        <Pending id={`page-${section}`} label={label}>
          <TableSkeleton rows={6} />
        </Pending>
      </div>
    </>
  );
}
