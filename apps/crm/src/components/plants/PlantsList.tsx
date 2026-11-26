"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, ChevronRight, Pencil, RotateCcw, Search } from "lucide-react";
import { LOW_STOCK_THRESHOLD, priceRangeLabel, sizesLabel } from "@yaremiya/shared/plant-format";
import { startProgress } from "@/lib/loading-store";
import { archivePlant, restorePlant, setPlantVisible } from "@/lib/plant-actions";
import type { CategoryOption, CrmPlantRow } from "@/lib/plants-data";
import { ArchiveDialog, PlantThumb, StatusPill, Switch, Toast, useToast } from "./parts";
import styles from "./plants.module.css";

type Tab = "active" | "archive";

/** Список рослин для Менеджера й Адміністратора (docs/plants.md → «Список»). */
export default function PlantsList({ plants, categories }: { plants: CrmPlantRow[]; categories: CategoryOption[] }) {
  const [rows, setRows] = useState(plants);
  const [tab, setTab] = useState<Tab>("active");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CrmPlantRow | null>(null);
  const { toast, show } = useToast();

  // Свіжі дані з сервера після кожної дії.
  useEffect(() => setRows(plants), [plants]);

  const active = rows.filter((p) => !p.archived);
  const archived = rows.filter((p) => p.archived);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tab === "active" ? active : archived).filter(
      (p) => (!q || p.name.toLowerCase().includes(q)) && (category === null || p.categoryId === category),
    );
  }, [tab, active, archived, query, category]);

  async function run<T>(id: number, action: () => Promise<T>, success: string, revert?: () => void): Promise<boolean> {
    setBusyId(id);
    const done = startProgress();
    try {
      await action();
      show(success);
      return true;
    } catch {
      revert?.();
      show("Не вдалося зберегти. Спробуйте ще раз.", true);
      return false;
    } finally {
      done();
      setBusyId(null);
    }
  }

  function toggleVisible(p: CrmPlantRow, value: boolean) {
    const patch = (v: boolean) => setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, isVisible: v } : r)));
    patch(value);
    void run(
      p.id,
      () => setPlantVisible(p.id, value),
      value ? `«${p.name}» показано на сайті` : `«${p.name}» сховано з сайту`,
      () => patch(!value),
    );
  }

  async function confirmArchive() {
    const p = archiveTarget;
    if (!p) return;
    const ok = await run(p.id, () => archivePlant(p.id), `«${p.name}» перенесено в архів`);
    if (ok) setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, archived: true, isVisible: false } : r)));
    setArchiveTarget(null);
  }

  function restore(p: CrmPlantRow) {
    void run(p.id, () => restorePlant(p.id), `«${p.name}» повернуто — на сайті поки приховано`).then((ok) => {
      if (ok) setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, archived: false, isVisible: false } : r)));
    });
  }

  // Залишок ≤ 5 — бурштиновим (крім передзамовлень).
  const isLow = (p: CrmPlantRow) => p.status !== "preorder" && p.totalStock <= LOW_STOCK_THRESHOLD;
  const stockText = (p: CrmPlantRow) => (p.status === "preorder" && p.totalStock === 0 ? "—" : `${p.totalStock} шт.`);

  return (
    <div className={styles.content}>
      <div className={styles.tabs} role="tablist" aria-label="Рослини">
        {(
          [
            ["active", "Активні", active.length],
            ["archive", "Архів", archived.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls="plants-panel"
            className={styles.tab}
            onClick={() => setTab(key)}
          >
            {label}
            <span className={styles.tabCount}>{count}</span>
          </button>
        ))}
      </div>

      <div id="plants-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <div className={styles.toolbar}>
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
          <div className={styles.chips} role="group" aria-label="Категорія">
            <button type="button" className={styles.chip} aria-pressed={category === null} onClick={() => setCategory(null)}>
              Усі
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={styles.chip}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <p className="visually-hidden" aria-live="polite">
          Знайдено: {visible.length}
        </p>

        {visible.length === 0 ? (
          <div className={`${styles.card} ${styles.empty}`}>
            {tab === "archive" && !query && category === null ? (
              <p>В архіві поки порожньо.</p>
            ) : (
              <>
                <strong>Нічого не знайдено.</strong>
                <p>Спробуйте іншу назву або категорію.</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Комп'ютер — таблиця */}
            <div className={`${styles.card} ${styles.tableCard}`}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Рослина</th>
                    <th scope="col">Категорія</th>
                    <th scope="col">Розміри</th>
                    <th scope="col">Ціна</th>
                    <th scope="col">Залишок</th>
                    <th scope="col">Статус</th>
                    <th scope="col">На сайті</th>
                    <th scope="col">
                      <span className="visually-hidden">Дії</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr key={p.id}>
                      <th scope="row">
                        <span className={styles.nameCell}>
                          <PlantThumb src={p.photo} />
                          <Link href={`/plants/${p.id}/edit`} className={styles.nameLink}>
                            {p.name}
                          </Link>
                        </span>
                      </th>
                      <td className={styles.muted}>{p.categoryName}</td>
                      <td className={styles.muted}>{sizesLabel(p.sizes)}</td>
                      <td className={styles.strong}>{priceRangeLabel(p.sizes)}</td>
                      <td className={`${styles.strong} ${isLow(p) ? styles.lowStock : ""}`}>
                        {stockText(p)}
                      </td>
                      <td>
                        <StatusPill status={p.status} />
                      </td>
                      <td>
                        {p.archived ? (
                          <span className={`${styles.pill} ${styles.pill_archived}`}>в архіві</span>
                        ) : (
                          <Switch
                            checked={p.isVisible}
                            disabled={busyId === p.id}
                            label={`Показувати на сайті: ${p.name}`}
                            onChange={(v) => toggleVisible(p, v)}
                          />
                        )}
                      </td>
                      <td>
                        <span className={styles.actions}>
                          {p.archived ? (
                            <button type="button" className={styles.textButton} onClick={() => restore(p)} disabled={busyId === p.id}>
                              <RotateCcw strokeWidth={1.75} aria-hidden="true" />
                              Повернути<span className="visually-hidden"> «{p.name}»</span>
                            </button>
                          ) : (
                            <>
                              <Link href={`/plants/${p.id}/edit`} className={styles.iconButton} title="Редагувати">
                                <Pencil strokeWidth={1.75} aria-hidden="true" />
                                <span className="visually-hidden">Редагувати «{p.name}»</span>
                              </Link>
                              <button
                                type="button"
                                className={styles.iconButton}
                                title="В архів"
                                onClick={() => setArchiveTarget(p)}
                              >
                                <Archive strokeWidth={1.75} aria-hidden="true" />
                                <span className="visually-hidden">В архів «{p.name}»</span>
                              </button>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Телефон — картки */}
            <ul className={styles.cards}>
              {visible.map((p) => (
                <li key={p.id} className={`${styles.card} ${styles.mCard}`}>
                  <Link href={`/plants/${p.id}/edit`} className={styles.mHead}>
                    <PlantThumb src={p.photo} size={56} />
                    <span className={styles.mText}>
                      <span className={styles.mName}>{p.name}</span>
                      <span className={styles.mMeta}>
                        {sizesLabel(p.sizes)} · <strong>{priceRangeLabel(p.sizes)}</strong>
                      </span>
                    </span>
                    <ChevronRight className={styles.mChevron} strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                  <div className={styles.mFoot}>
                    <StatusPill status={p.status} />
                    <span className={`${styles.mStock} ${isLow(p) ? styles.lowStock : ""}`}>
                      {stockText(p)}
                    </span>
                    {p.archived ? (
                      <span className={styles.mSwitch}>
                        <button type="button" className={styles.textButton} onClick={() => restore(p)} disabled={busyId === p.id}>
                          <RotateCcw strokeWidth={1.75} aria-hidden="true" />
                          Повернути
                        </button>
                      </span>
                    ) : (
                      <span className={styles.mSwitch}>
                        <span aria-hidden="true">{p.isVisible ? "На сайті" : "Приховано"}</span>
                        <Switch
                          checked={p.isVisible}
                          disabled={busyId === p.id}
                          label={`Показувати на сайті: ${p.name}`}
                          onChange={(v) => toggleVisible(p, v)}
                        />
                        <button type="button" className={styles.iconButton} onClick={() => setArchiveTarget(p)}>
                          <Archive strokeWidth={1.75} aria-hidden="true" />
                          <span className="visually-hidden">В архів «{p.name}»</span>
                        </button>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ArchiveDialog plantName={archiveTarget?.name ?? null} onConfirm={confirmArchive} onClose={() => setArchiveTarget(null)} />
      <Toast toast={toast} />
    </div>
  );
}
