"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Save, Search } from "lucide-react";
import Button from "@/components/loading/Button";
import SaveStatus from "@/components/loading/SaveStatus";
import { LOW_STOCK_THRESHOLD } from "@yaremiya/shared/plant-format";
import { updateStocks } from "@/lib/plant-actions";
import type { WorkerPlantRow } from "@/lib/plants-data";
import { useAsyncAction } from "@/lib/use-async-action";
import { PlantThumb } from "./parts";
import styles from "./plants.module.css";

type Stocks = Record<number, number>;

function stocksOf(rows: WorkerPlantRow[]): Stocks {
  return Object.fromEntries(rows.flatMap((p) => p.sizes.map((s) => [s.id, s.stock])));
}

/** Працівник: лише залишки (docs/plants.md → «Працівник — залишки»). */
export default function WorkerStock({ plants }: { plants: WorkerPlantRow[] }) {
  const [saved, setSaved] = useState<Stocks>(() => stocksOf(plants));
  const [values, setValues] = useState<Stocks>(() => stocksOf(plants));
  const [query, setQuery] = useState("");
  const save = useAsyncAction(updateStocks);

  // Свіжі дані з сервера (після збереження чи змін інших людей) — лише якщо немає незбережених змін.
  useEffect(() => {
    const fresh = stocksOf(plants);
    setSaved(fresh);
    setValues((prev) => (Object.keys(prev).some((k) => prev[+k] !== saved[+k]) ? prev : fresh));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plants]);

  const changed = useMemo(
    () => Object.keys(values).map(Number).filter((id) => values[id] !== saved[id]),
    [values, saved],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? plants.filter((p) => p.name.toLowerCase().includes(q)) : plants;
  }, [plants, query]);

  function setValue(id: number, value: number) {
    setValues((prev) => ({ ...prev, [id]: Math.max(0, Math.min(1_000_000, Math.round(value) || 0)) }));
    if (save.status !== "pending") save.reset();
  }

  async function submit() {
    const payload = changed.map((sizeId) => ({ sizeId, stock: values[sizeId] }));
    if (await save.run(payload)) setSaved((prev) => ({ ...prev, ...Object.fromEntries(payload.map((c) => [c.sizeId, c.stock])) }));
  }

  return (
    <div className={styles.content}>
      <div className={styles.workerToolbar}>
        <div className={styles.searchBox}>
          <Search strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Пошук за назвою"
            aria-label="Пошук рослини за назвою"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <p className={styles.hint}>Змінені числа — сині, до збереження</p>
      </div>

      {shown.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>
          <strong>Нічого не знайдено.</strong>
          <p>Спробуйте іншу назву.</p>
        </div>
      ) : (
        <ul className={`${styles.card} ${styles.stockList}`}>
          {shown.map((p) => (
            <li key={p.id} className={styles.stockItem}>
              <div className={styles.stockHead}>
                <PlantThumb src={p.photo} />
                <span className={styles.mText}>
                  <span className={styles.mName}>{p.name}</span>
                  <span className={styles.mMeta}>{p.categoryName}</span>
                </span>
              </div>
              <div className={styles.stockSizes}>
                {p.sizes.map((s) => {
                  const value = values[s.id] ?? s.stock;
                  const isChanged = value !== saved[s.id];
                  const id = `stock-${s.id}`;
                  return (
                    <div key={s.id} className={styles.stockSize} role="group" aria-label={`${p.name}, ${s.pot}`}>
                      <label htmlFor={id} className={styles.stockPot}>
                        {s.pot}
                      </label>
                      <span className={styles.stepper}>
                        <button
                          type="button"
                          className={styles.stepButton}
                          aria-label="Менше на 1"
                          aria-controls={id}
                          disabled={value <= 0}
                          onClick={() => setValue(s.id, value - 1)}
                        >
                          <Minus strokeWidth={1.75} aria-hidden="true" />
                        </button>
                        <input
                          id={id}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          className={`${styles.stepValue} ${isChanged ? styles.stepValueChanged : value <= LOW_STOCK_THRESHOLD ? styles.stepValueLow : ""}`}
                          value={value}
                          onChange={(e) => setValue(s.id, Number(e.target.value))}
                          aria-describedby={isChanged ? "stock-changed-hint" : undefined}
                        />
                        <button
                          type="button"
                          className={styles.stepButton}
                          aria-label="Більше на 1"
                          aria-controls={id}
                          onClick={() => setValue(s.id, value + 1)}
                        >
                          <Plus strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
      <span id="stock-changed-hint" hidden>
        змінено, ще не збережено
      </span>

      <div className={styles.saveBar}>
        {changed.length === 0 && save.status !== "pending" ? (
          <span className={styles.buttonMuted} aria-disabled="true">
            <Save strokeWidth={1.75} aria-hidden="true" />
            Змін немає
          </span>
        ) : (
          <>
            <button type="button" className={styles.buttonLight} onClick={() => setValues(saved)} disabled={save.pending}>
              Скасувати
            </button>
            <Button
              className={styles.buttonGreen}
              loading={save.pending}
              loadingText="Зберігаємо…"
              icon={<Save strokeWidth={1.75} aria-hidden="true" />}
              onClick={submit}
            >
              Зберегти залишки ({changed.length})
            </Button>
          </>
        )}
        <div className={styles.saveBarStatus}>
          <SaveStatus status={save.status} onRetry={save.retry} savedText="Залишки збережено" />
        </div>
      </div>
    </div>
  );
}
