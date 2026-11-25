"use client";

import { useState } from "react";
import {
  Check,
  CheckCheck,
  Clock,
  House,
  Info,
  Minus,
  PackageCheck,
  Plus,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { markOrderReady, updateStock } from "@/lib/actions";
import type { LowStockItem, OrderToPrepare } from "@/lib/demo-data";
import Group from "./Group";
import styles from "./dashboard.module.css";

type SaveState = "idle" | "saving" | "saved";

/** Дашборд Працівника — «справи на сьогодні». Без цін, виручки й контактів клієнтів. */
export default function WorkerDashboard({
  orders,
  stock,
  pickupsToday,
}: {
  orders: OrderToPrepare[];
  stock: LowStockItem[];
  pickupsToday: number;
}) {
  const [ready, setReady] = useState<Set<string>>(() => new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(stock.map((item) => [item.id, item.qty])),
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const toPrepare = orders.filter((o) => !ready.has(o.id)).length;

  async function toggleReady(id: string) {
    const next = !ready.has(id);
    setReady((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
    await markOrderReady(id, next);
  }

  function changeQty(id: string, delta: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
    setSaveState("idle");
  }

  async function saveStock() {
    setSaveState("saving");
    await updateStock(stock.map((item) => ({ id: item.id, qty: quantities[item.id] ?? item.qty })));
    setSaveState("saved");
  }

  const counters = [
    { key: "prepare", icon: PackageCheck, tone: styles.tone_blue, value: toPrepare, label: "підготувати до видачі", short: "до видачі" },
    { key: "pickup", icon: House, tone: styles.tone_green, value: pickupsToday, label: "самовивіз сьогодні", short: "самовивіз сьогодні" },
    { key: "low", icon: TriangleAlert, tone: styles.tone_amber, value: stock.length, label: "закінчується", short: "закінчується" },
  ];

  return (
    <div className={styles.content}>
      <div className={styles.groups}>
        <Group id="w-today" icon={Sun} title="Сьогодні">
          <ul className={styles.counters}>
            {counters.map(({ key, icon: Icon, tone, value, label, short }) => (
              <li key={key} className={`${styles.card} ${styles.counter}`}>
                <span className={`${styles.counterIcon} ${tone}`} aria-hidden="true">
                  <Icon strokeWidth={1.75} />
                </span>
                <span className={styles.counterText}>
                  <span className={styles.counterValue} aria-live={key === "prepare" ? "polite" : undefined}>
                    {value}
                  </span>
                  <span className={styles.counterLabel}>
                    <span className={styles.desktopInline}>{label}</span>
                    <span className={styles.mobileInline}>{short}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Group>

        <div className={styles.workerLayout}>
          <Group id="w-prepare" icon={PackageCheck} title="Підготувати до видачі">
            <div className={`${styles.card} ${styles.workerCard}`}>
              <ul className={styles.dividedList}>
                {orders.map((order) => {
                  const isReady = ready.has(order.id);
                  return (
                    <li key={order.id} className={`${styles.prepareRow} ${isReady ? styles.prepareRowDone : ""}`}>
                      <div className={styles.prepareText}>
                        <p className={styles.prepareTitle}>
                          <strong>{order.number}</strong>
                          <span className={styles.prepareClient}>{order.client}</span>
                        </p>
                        <p className={styles.prepareItems}>{order.items}</p>
                        <p className={styles.prepareDelivery}>
                          <Clock strokeWidth={1.75} aria-hidden="true" />
                          {order.delivery}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`${styles.readyButton} ${isReady ? styles.readyButtonDone : ""}`}
                        aria-pressed={isReady}
                        onClick={() => toggleReady(order.id)}
                      >
                        {isReady ? (
                          <CheckCheck strokeWidth={1.75} aria-hidden="true" />
                        ) : (
                          <Check strokeWidth={1.75} aria-hidden="true" />
                        )}
                        {isReady ? "Готово" : "Позначити готовим"}
                        <span className="visually-hidden">: замовлення {order.number}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Group>

          <Group
            id="w-stock"
            icon={TriangleAlert}
            title={
              <>
                Закінчується<span className={styles.desktopInline}> — оновіть залишок</span>
              </>
            }
          >
            <div className={`${styles.card} ${styles.workerCard}`}>
              <ul className={styles.dividedList}>
                {stock.map((item) => {
                  const qty = quantities[item.id] ?? item.qty;
                  const outputId = `qty-${item.id}`;
                  return (
                    <li key={item.id} className={styles.stockRow}>
                      <img src={item.image} alt="" width={48} height={48} className={styles.stockPhoto} loading="lazy" />
                      <span className={styles.lowText}>
                        <span className={styles.lowName}>{item.name}</span>
                        <span className={styles.lowPot}>{item.pot}</span>
                      </span>
                      <div className={styles.stepper} role="group" aria-label={`Залишок: ${item.name}`}>
                        <button
                          type="button"
                          className={styles.stepButton}
                          aria-label="Менше на 1"
                          aria-controls={outputId}
                          disabled={qty === 0}
                          onClick={() => changeQty(item.id, -1)}
                        >
                          <Minus strokeWidth={1.75} aria-hidden="true" />
                        </button>
                        <output id={outputId} className={styles.stepValue} aria-live="polite">
                          {qty}
                        </output>
                        <button
                          type="button"
                          className={styles.stepButton}
                          aria-label="Більше на 1"
                          aria-controls={outputId}
                          onClick={() => changeQty(item.id, 1)}
                        >
                          <Plus strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className={styles.saveButton}
                onClick={saveStock}
                disabled={saveState === "saving"}
                aria-busy={saveState === "saving" || undefined}
              >
                {saveState === "saving" ? "Зберігаємо…" : "Зберегти залишки"}
              </button>
              <p role="status" className={styles.saveStatus}>
                {saveState === "saved" && (
                  <>
                    <CheckCheck strokeWidth={1.75} aria-hidden="true" />
                    Залишки збережено
                  </>
                )}
              </p>
            </div>
          </Group>
        </div>

        <p className={styles.workerHint}>
          <Info strokeWidth={1.75} aria-hidden="true" />
          Ціни, виручку й контакти клієнтів бачать менеджер і адміністратор. Якщо чогось не вистачає
          для роботи — скажіть адміністратору.
        </p>
      </div>
    </div>
  );
}
