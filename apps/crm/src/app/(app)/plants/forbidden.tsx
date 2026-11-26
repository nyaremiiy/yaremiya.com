import type { Metadata } from "next";
import TopBar from "@/components/shell/TopBar";
import { NoAccess } from "@/components/shell/NoAccess";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Немає доступу",
};

/** Працівник відкрив редагування рослини — «Немає доступу» (403). */
export default async function PlantsForbidden() {
  const user = await requireUser();
  return (
    <>
      <TopBar user={user} title="Рослини" actions={null} />
      <NoAccess message="Додавати й редагувати рослини можуть менеджер і адміністратор. Залишки можна оновити у списку «Рослини»." />
    </>
  );
}
