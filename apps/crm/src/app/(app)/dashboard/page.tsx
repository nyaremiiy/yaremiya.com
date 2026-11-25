import type { Metadata } from "next";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import WorkerDashboard from "@/components/dashboard/WorkerDashboard";
import TopBar from "@/components/shell/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { lowStock, ordersToPrepare, pickupsToday } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Дашборд",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <>
      <TopBar user={user} />
      {user.role === "worker" ? (
        <WorkerDashboard orders={ordersToPrepare} stock={lowStock} pickupsToday={pickupsToday} />
      ) : (
        <ManagerDashboard user={user} />
      )}
    </>
  );
}
