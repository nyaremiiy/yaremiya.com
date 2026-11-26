import { readFile } from "node:fs/promises";
import { resolveMediaPath } from "@yaremiya/shared/media";

/**
 * Фото рослин з UPLOADS_DIR: `/media/plants/12/ab12cd-800.webp`.
 * Публічні (вони є на сайті). Назви файлів випадкові й не змінюються,
 * тож кешуємо надовго. На сервері ці файли може віддавати й Caddy напряму.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const file = resolveMediaPath((await params).path.join("/"));
  if (!file) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(file);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
