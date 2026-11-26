import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { auditLog, getDb, plantPhotos, plants } from "@yaremiya/shared/db";
import { MAX_UPLOAD_BYTES, mediaUrl, PhotoError, savePlantPhoto } from "@yaremiya/shared/media";
import { can } from "@/lib/permissions";
import { clientInfo, getCurrentUser } from "@/lib/session";
import { requestSiteRebuild } from "@/lib/site-rebuild";

/**
 * Завантаження фото рослини (лише Адмін і Менеджер).
 * Спершу — перевірка входу, прав і розміру, і лише потім читаємо файл.
 * Тип перевіряється за вмістом (sharp), а не за назвою файлу.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Сесія завершилась. Увійдіть знову." }, { status: 401 });
  if (!can(user.role, "managePlants")) return NextResponse.json({ error: "Немає доступу." }, { status: 403 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Фото завелике — до 15 МБ." }, { status: 413 });
  }

  const plantId = Number((await params).id);
  const db = getDb();
  const [plant] = Number.isInteger(plantId)
    ? await db.select({ id: plants.id, name: plants.name, visible: plants.isVisible }).from(plants).where(eq(plants.id, plantId)).limit(1)
    : [];
  if (!plant) return NextResponse.json({ error: "Рослину не знайдено." }, { status: 404 });

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("photo");
  } catch {
    return NextResponse.json({ error: "Не вдалося прочитати файл." }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "Оберіть фото." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Фото завелике — до 15 МБ." }, { status: 413 });

  try {
    const saved = await savePlantPhoto(plant.id, Buffer.from(await file.arrayBuffer()));
    const [{ next }] = await db
      .select({ next: sql<number>`coalesce(max(${plantPhotos.sort}) + 1, 0)`.mapWith(Number) })
      .from(plantPhotos)
      .where(eq(plantPhotos.plantId, plant.id));
    const [row] = await db
      .insert(plantPhotos)
      .values({ plantId: plant.id, fileKey: saved.fileKey, alt: plant.name, width: saved.width, height: saved.height, sort: next })
      .returning({ id: plantPhotos.id });
    const { ip } = await clientInfo();
    await db.insert(auditLog).values({ userId: user.id, action: "photo_added", target: plant.name, details: { plantId: plant.id }, ip });
    if (plant.visible) requestSiteRebuild(`фото: ${plant.name}`);
    revalidatePath("/plants");
    return NextResponse.json({
      photo: { id: row.id, url: mediaUrl(saved.fileKey, 800), alt: plant.name, small: saved.tooSmall },
    });
  } catch (err) {
    if (err instanceof PhotoError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("Помилка завантаження фото:", (err as Error).message);
    return NextResponse.json({ error: "Не вдалося зберегти фото. Спробуйте ще раз." }, { status: 500 });
  }
}
