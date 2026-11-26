import type { Metadata } from "next";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import WorkerDashboard from "@/components/dashboard/WorkerDashboard";
import { WorkerSkeleton } from "@/components/dashboard/skeletons";
import styles from "@/components/dashboard/dashboard.module.css";
import Loadable from "@/components/loading/Loadable";
import TopBar from "@/components/shell/TopBar";
import { getWorkerToday } from "@/lib/dashboard-data";
import { requireSection } from "@/lib/session";

export const metadata: Metadata = {
  title: "Дашборд",
};

export default async function DashboardPage() {
  const user = await requireSection("dashboard");

  return (
    <>
      <TopBar user={user} />
      {user.role === "worker" ? (
        <Loadable
          id="w-dashboard"
          label="Завантажуємо справи на сьогодні…"
          skeleton={
            <div className={styles.content}>
              <WorkerSkeleton />
            </div>
          }
        >
          <WorkerBlock />
        </Loadable>
      ) : (
        <ManagerDashboard user={user} />
      )}
    </>
  );
}

async function WorkerBlock() {
  const { orders, stock, pickupsToday } = await getWorkerToday();
  return <WorkerDashboard orders={orders} stock={stock} pickupsToday={pickupsToday} />;
}
