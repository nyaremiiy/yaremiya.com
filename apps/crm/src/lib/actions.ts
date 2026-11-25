/**
 * Дії Працівника — поки заглушки: змінюють лише стан у браузері.
 * Коли з'явиться база, тут будуть справжні запити до сервера.
 */

export async function markOrderReady(id: string, ready: boolean): Promise<{ ok: true }> {
  void id;
  void ready;
  return { ok: true };
}

export async function updateStock(
  items: { id: string; qty: number }[],
): Promise<{ ok: true }> {
  void items;
  // Невелика пауза, щоб було видно стан «Зберігаємо…».
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { ok: true };
}
