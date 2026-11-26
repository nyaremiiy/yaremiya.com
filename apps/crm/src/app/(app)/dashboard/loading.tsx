"use client";

import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { Pending } from "@/components/loading/Pending";
import TopBar from "@/components/shell/TopBar";
import { useCurrentUser } from "@/components/shell/UserProvider";

/** Поки відкривається дашборд: верхня панель одразу, вміст — скелетон за роллю. */
export default function DashboardLoading() {
  const user = useCurrentUser();
  return (
    <>
      <TopBar user={user} />
      <Pending id="page-dashboard" label="Завантажуємо дашборд…">
        <DashboardSkeleton role={user.role} />
      </Pending>
    </>
  );
}
