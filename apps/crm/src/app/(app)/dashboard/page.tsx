import type { Metadata } from "next";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import WorkerDashboard from "@/components/dashboard/WorkerDashboard";
import TopBar from "@/components/shell/TopBar";
import { requireSection } from "@/lib/session";
import { can } from "@/lib/permissions";
import { getTeam } from "@/lib/team";
import { lowStock, ordersToPrepare, pickupsToday } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Дашборд",
};

export default async function DashboardPage() {
  const user = await requireSection("dashboard");
  const team = can(user.role, "teamActivity") ? await getTeam() : undefined;

  return (
    <>
      <TopBar user={user} />
      {user.role === "worker" ? (
        <WorkerDashboard orders={ordersToPrepare} stock={lowStock} pickupsToday={pickupsToday} />
      ) : (
        <ManagerDashboard user={user} team={team} />
      )}
    </>
  );
}
