import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import PlantEditor from "@/components/plants/PlantEditor";
import { can } from "@/lib/permissions";
import { emptyPlant, getCategories } from "@/lib/plants-data";
import { requireSection } from "@/lib/session";
import { sitePublicUrl } from "@/lib/site-rebuild";

export const metadata: Metadata = {
  title: "Нова рослина",
};

export default async function NewPlantPage() {
  const user = await requireSection("plants");
  if (!can(user.role, "managePlants")) forbidden();
  return <PlantEditor plant={emptyPlant()} categories={await getCategories()} siteUrl={sitePublicUrl()} />;
}
