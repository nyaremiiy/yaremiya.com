import type { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";
import PlantEditor from "@/components/plants/PlantEditor";
import { can } from "@/lib/permissions";
import { getCategories, getPlantForEdit } from "@/lib/plants-data";
import { requireSection } from "@/lib/session";
import { sitePublicUrl } from "@/lib/site-rebuild";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export const metadata: Metadata = {
  title: "Редагування рослини",
};

export default async function EditPlantPage({ params, searchParams }: Props) {
  const user = await requireSection("plants");
  // Працівник бачить «Немає доступу» (403) — права перевіряються тут, на сервері.
  if (!can(user.role, "managePlants")) forbidden();

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [plant, categories] = await Promise.all([getPlantForEdit(id), getCategories()]);
  if (!plant) notFound();

  return (
    <PlantEditor
      key={plant.id}
      plant={plant}
      categories={categories}
      siteUrl={sitePublicUrl()}
      justCreated={(await searchParams).created === "1"}
    />
  );
}
