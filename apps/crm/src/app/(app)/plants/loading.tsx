"use client";

import { Pending } from "@/components/loading/Pending";
import { PlantsListSkeleton, WorkerStockSkeleton } from "@/components/plants/PlantsSkeleton";
import TopBar from "@/components/shell/TopBar";
import { useCurrentUser } from "@/components/shell/UserProvider";
import { can } from "@/lib/permissions";

/** Поки відкривається «Рослини»: верхня панель одразу, список — скелетон. */
export default function PlantsLoading() {
  const user = useCurrentUser();
  const manage = can(user.role, "managePlants");
  return (
    <>
      <TopBar user={user} title="Рослини" actions={manage ? undefined : null} />
      <Pending id="page-plants" label="Завантажуємо рослини…">
        {manage ? <PlantsListSkeleton /> : <WorkerStockSkeleton />}
      </Pending>
    </>
  );
}
