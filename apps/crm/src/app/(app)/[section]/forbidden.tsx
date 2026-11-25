import type { Metadata } from "next";
import TopBar from "@/components/shell/TopBar";
import { NoAccess, CurrentSectionTitle } from "@/components/shell/NoAccess";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Немає доступу",
};

/** «Немає доступу» (403) — у звичайному каркасі, з назвою розділу вгорі. */
export default async function Forbidden() {
  const user = await getCurrentUser();
  return (
    <>
      <TopBar user={user} title={<CurrentSectionTitle role={user.role} />} />
      <NoAccess />
    </>
  );
}
