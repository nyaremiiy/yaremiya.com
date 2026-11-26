import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import Loadable from "@/components/loading/Loadable";
import PlantsList from "@/components/plants/PlantsList";
import { PlantsListSkeleton, WorkerStockSkeleton } from "@/components/plants/PlantsSkeleton";
import WorkerStock from "@/components/plants/WorkerStock";
import shell from "@/components/shell/shell.module.css";
import TopBar from "@/components/shell/TopBar";
import { can } from "@/lib/permissions";
import { getCategories, getPlantsForManager, getPlantsForWorker } from "@/lib/plants-data";
import { requireSection } from "@/lib/session";

export const metadata: Metadata = {
  title: "Рослини",
};

export default async function PlantsPage() {
  const user = await requireSection("plants");
  const manage = can(user.role, "managePlants");

  if (!manage) {
    return (
      <>
        <TopBar user={user} title="Рослини" subtitle="Оновлюйте залишки. Ціни, фото й описи змінює менеджер." actions={null} />
        <Loadable id="plants-worker" label="Завантажуємо рослини…" skeleton={<WorkerStockSkeleton />}>
          <WorkerBlock />
        </Loadable>
      </>
    );
  }

  return (
    <>
      <TopBar
        user={user}
        title="Рослини"
        subtitle="Каталог, ціни, наявність і що показується на сайті"
        actions={
          <Link href="/plants/new" className={shell.primaryButton}>
            <Plus strokeWidth={1.75} aria-hidden="true" />
            Додати рослину
          </Link>
        }
        mobileAction={
          <Link href="/plants/new" className={shell.primaryButton}>
            <Plus strokeWidth={1.75} aria-hidden="true" />
            Додати
          </Link>
        }
      />
      <Loadable id="plants-list" label="Завантажуємо рослини…" skeleton={<PlantsListSkeleton />}>
        <ManagerBlock />
      </Loadable>
    </>
  );
}

async function ManagerBlock() {
  const [plants, categories] = await Promise.all([getPlantsForManager(), getCategories()]);
  return <PlantsList plants={plants} categories={categories} />;
}

async function WorkerBlock() {
  return <WorkerStock plants={await getPlantsForWorker()} />;
}
