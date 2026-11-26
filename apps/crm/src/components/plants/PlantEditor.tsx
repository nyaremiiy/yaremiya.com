"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Eye,
  FileText,
  ImagePlus,
  Info,
  Package,
  Plus,
  RotateCcw,
  Search,
  Star,
  Sun,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import Button from "@/components/loading/Button";
import TopBar from "@/components/shell/TopBar";
import { useCurrentUser } from "@/components/shell/UserProvider";
import shell from "@/components/shell/shell.module.css";
import { CONDITION_LABELS, MONTHS_SHORT, PLANT_STATUS_LABELS } from "@yaremiya/shared/plant-format";
import type { PlantConditions, PlantStatus } from "@yaremiya/shared/db/schema";
import { endNavigation, startProgress } from "@/lib/loading-store";
import { archivePlant, deletePlantPhoto, restorePlant, savePlant, type PlantFormInput } from "@/lib/plant-actions";
import type { CategoryOption, EditPhoto, PlantEditData } from "@/lib/plants-data";
import { ArchiveDialog, Switch, Toast, useToast } from "./parts";
import list from "./plants.module.css";
import styles from "./editor.module.css";

type Form = Omit<PlantEditData, "photos" | "archived" | "slug">;
type Errors = Record<string, string>;

const STATUSES: PlantStatus[] = ["in_stock", "low", "preorder"];
const CONDITIONS = Object.keys(CONDITION_LABELS) as (keyof PlantConditions)[];
const MONTHS_FULL = ["січень", "лютий", "березень", "квітень", "травень", "червень", "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"];
const LEAVE_QUESTION = "Вийти без збереження? Незбережені зміни пропадуть.";

function toForm(p: PlantEditData): Form {
  const { photos: _photos, archived: _archived, slug: _slug, ...rest } = p;
  return rest;
}

const snapshot = (form: Form, photos: EditPhoto[]) =>
  JSON.stringify({ form, photos: photos.map((p) => [p.id, p.alt]) });

export default function PlantEditor({
  plant,
  categories,
  siteUrl,
  justCreated,
}: {
  plant: PlantEditData;
  categories: CategoryOption[];
  siteUrl: string;
  justCreated?: boolean;
}) {
  const user = useCurrentUser();
  const router = useRouter();
  const isNew = plant.id === null;

  const [form, setForm] = useState<Form>(() => toForm(plant));
  const [photos, setPhotos] = useState<EditPhoto[]>(plant.photos);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [saved, setSaved] = useState(() => snapshot(toForm(plant), plant.photos));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "saved" | "error"; text: string } | null>(
    justCreated ? { kind: "saved", text: "Рослину додано. Тепер можна додати фото." } : null,
  );
  const [uploading, setUploading] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const { toast, show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = useMemo(() => snapshot(form, photos) !== saved, [form, photos, saved]);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Після збереження сервер присилає свіжі дані — беремо їх, якщо немає нових правок.
  useEffect(() => {
    if (dirtyRef.current) return;
    setForm(toForm(plant));
    setPhotos(plant.photos);
    setSaved(snapshot(toForm(plant), plant.photos));
  }, [plant]);

  // Спроба піти зі сторінки з незбереженими змінами.
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank") return;
      if (new URL(link.href).pathname === location.pathname) return;
      if (!window.confirm(LEAVE_QUESTION)) {
        e.preventDefault();
        e.stopPropagation();
        endNavigation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setMessage(null);
    if (errors[key as string]) setErrors(({ [key as string]: _, ...rest }) => rest);
  }

  function setSize(i: number, key: keyof Form["sizes"][number], value: string) {
    setForm((f) => ({ ...f, sizes: f.sizes.map((s, j) => (j === i ? { ...s, [key]: value } : s)) }));
    setMessage(null);
    const errKey = `sizes.${i}.${key}`;
    if (errors[errKey]) setErrors(({ [errKey]: _, ...rest }) => rest);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setMessage(null);
    const done = startProgress();
    const input: PlantFormInput = { ...form, photos: photos.map((p) => ({ id: p.id, alt: p.alt })) };
    try {
      const result = await savePlant(input);
      if (!result.ok) {
        setErrors(result.errors);
        setMessage({ kind: "error", text: "Перевірте позначені поля." });
        const first = Object.keys(result.errors)[0];
        const el = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
        el?.focus();
        return;
      }
      setErrors({});
      setSaved(snapshot(form, photos));
      dirtyRef.current = false;
      if (result.created) {
        router.replace(`/plants/${result.id}/edit?created=1`);
        return;
      }
      setMessage({
        kind: "saved",
        text: form.isVisible ? "Зміни збережено — рослина оновилася на сайті." : "Зміни збережено.",
      });
    } catch {
      setMessage({ kind: "error", text: "Не вдалося зберегти. Перевірте з'єднання й спробуйте ще раз." });
    } finally {
      done();
      setSaving(false);
    }
  }

  async function upload(file: File) {
    if (!plant.id) return;
    setUploading(true);
    const done = startProgress();
    try {
      const body = new FormData();
      body.append("photo", file);
      const res = await fetch(`/api/plants/${plant.id}/photos`, { method: "POST", body, signal: AbortSignal.timeout(120_000) });
      const data = (await res.json().catch(() => ({}))) as { photo?: EditPhoto; error?: string };
      if (!res.ok || !data.photo) {
        show(data.error ?? "Не вдалося завантажити фото.", true);
        return;
      }
      const photo = data.photo;
      setPhotos((prev) => [...prev, photo]);
      setSaved((s) => {
        // Нове фото вже збережене на сервері — не вважаємо його «незбереженою зміною».
        const parsed = JSON.parse(s) as { form: Form; photos: [number, string][] };
        return JSON.stringify({ ...parsed, photos: [...parsed.photos, [photo.id, photo.alt]] });
      });
      show(photo.small ? "Фото додано. Воно замале — на сайті може бути розмитим." : "Фото додано.", photo.small);
    } catch {
      show("Не вдалося завантажити фото. Перевірте з'єднання.", true);
    } finally {
      done();
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto(index: number) {
    const photo = photos[index];
    if (!photo || !window.confirm("Видалити це фото? Його не можна буде повернути.")) return;
    const done = startProgress();
    try {
      await deletePlantPhoto(photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setSaved((s) => {
        const parsed = JSON.parse(s) as { form: Form; photos: [number, string][] };
        return JSON.stringify({ ...parsed, photos: parsed.photos.filter(([id]) => id !== photo.id) });
      });
      setSelectedPhoto(0);
      show("Фото видалено.");
    } catch {
      show("Не вдалося видалити фото.", true);
    } finally {
      done();
    }
  }

  function movePhoto(index: number, delta: -1 | 1) {
    const to = index + delta;
    if (to < 0 || to >= photos.length) return;
    setPhotos((prev) => {
      const copy = [...prev];
      [copy[index], copy[to]] = [copy[to], copy[index]];
      return copy;
    });
    setSelectedPhoto(to);
  }

  async function confirmArchive() {
    if (!plant.id) return;
    const done = startProgress();
    try {
      await archivePlant(plant.id);
      dirtyRef.current = false;
      router.push("/plants");
    } catch {
      show("Не вдалося перенести в архів.", true);
    } finally {
      done();
      setArchiveOpen(false);
    }
  }

  async function restore() {
    if (!plant.id) return;
    const done = startProgress();
    try {
      await restorePlant(plant.id);
      show("Рослину повернуто з архіву — на сайті поки приховано.");
      router.refresh();
    } catch {
      show("Не вдалося повернути з архіву.", true);
    } finally {
      done();
    }
  }

  function cancel() {
    if (dirty) {
      if (!window.confirm("Скасувати зміни? Повернуться останні збережені дані.")) return;
      const parsed = JSON.parse(saved) as { form: Form; photos: [number, string][] };
      setForm(parsed.form);
      // Порядок і описи фото — як було збережено.
      setPhotos((prev) =>
        parsed.photos
          .map(([id, alt]) => {
            const photo = prev.find((p) => p.id === id);
            return photo ? { ...photo, alt } : null;
          })
          .filter((p): p is EditPhoto => p !== null),
      );
      setSelectedPhoto(0);
      setErrors({});
      setMessage(null);
      return;
    }
    router.push("/plants");
  }

  const title = isNew ? "Нова рослина" : form.name || plant.name || "Рослина";
  const viewUrl = `${siteUrl}/#catalog`;
  const canView = !isNew && !plant.archived;

  const saveButton = (className: string) => (
    <Button
      className={className}
      loading={saving}
      loadingText="Зберігаємо…"
      icon={<Check strokeWidth={1.75} aria-hidden="true" />}
      onClick={save}
    >
      Зберегти
    </Button>
  );

  const err = (key: string) =>
    errors[key] ? (
      <p id={`err-${key}`} className={styles.error}>
        {errors[key]}
      </p>
    ) : null;
  const errProps = (key: string) => ({
    "data-field": key,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `err-${key}` : undefined,
  });

  const current = photos[selectedPhoto];

  return (
    <div data-focus-screen>
      {/* Телефон: своя шапка */}
      <div className={styles.mobileTop}>
        <Link href="/plants" className={styles.mobileTopIcon} aria-label="До списку рослин">
          <ArrowLeft strokeWidth={1.75} aria-hidden="true" />
        </Link>
        <span className={styles.mobileTopText}>
          <small>{isNew ? "Додавання" : "Редагування"}</small>
          <strong>{title}</strong>
        </span>
        {canView && (
          <a href={viewUrl} target="_blank" rel="noopener" className={`${styles.mobileTopIcon} ${styles.mobileTopView}`} aria-label="Переглянути на сайті (нова вкладка)">
            <Eye strokeWidth={1.75} aria-hidden="true" />
          </a>
        )}
      </div>

      <div className={styles.desktopOnly}>
        <TopBar
          user={user}
          title={title}
          subtitle={isNew ? "Нова рослина з'явиться на сайті після збереження, якщо ввімкнути «Показувати на сайті»" : "Редагування рослини · зміни з'являться на сайті після збереження"}
          actions={
            <>
              {canView && (
                <a href={viewUrl} target="_blank" rel="noopener" className={shell.secondaryButton}>
                  <Eye strokeWidth={1.75} aria-hidden="true" />
                  Переглянути на сайті
                </a>
              )}
              {saveButton(shell.primaryButton)}
            </>
          }
        />
      </div>

      <div className={styles.content}>
        <Link href="/plants" className={styles.back}>
          <ArrowLeft strokeWidth={1.75} aria-hidden="true" />
          До списку рослин
        </Link>

        <div role="status" aria-live="polite">
          {message?.kind === "saved" && (
            <p className={`${styles.notice} ${styles.noticeSaved}`}>
              <CircleCheck strokeWidth={1.75} aria-hidden="true" />
              {message.text}
            </p>
          )}
          {dirty && !message && (
            <p className={`${styles.notice} ${styles.noticeInfo}`}>
              <Info strokeWidth={1.75} aria-hidden="true" />
              Є незбережені зміни — натисніть «Зберегти», щоб вони з'явилися на сайті.
            </p>
          )}
        </div>
        <div role="alert">
          {message?.kind === "error" && (
            <p className={`${styles.notice} ${styles.noticeError}`}>
              <CircleAlert strokeWidth={1.75} aria-hidden="true" />
              {message.text}
            </p>
          )}
        </div>
        {plant.archived && (
          <p className={`${styles.notice} ${styles.noticeArchived}`}>
            <Archive strokeWidth={1.75} aria-hidden="true" />
            Рослина в архіві — на сайті її немає.
            <button type="button" className={list.textButton} onClick={restore}>
              <RotateCcw strokeWidth={1.75} aria-hidden="true" />
              Повернути
            </button>
          </p>
        )}

        <div className={styles.layout}>
          <div className={styles.col}>
            <Section icon={FileText} title="Основне" className={styles.order2}>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-name">
                    Назва
                  </label>
                  <input id="p-name" className={list.input} value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} required {...errProps("name")} />
                  {err("name")}
                </div>
                <div className={styles.row2}>
                  <div className={`${styles.field} ${styles.desktopOnly}`}>
                    <label className={styles.label} htmlFor="p-latin">
                      Латинська назва
                    </label>
                    <input id="p-latin" className={list.input} value={form.latinName} onChange={(e) => set("latinName", e.target.value)} lang="la" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="p-category">
                      Категорія
                    </label>
                    <select
                      id="p-category"
                      className={list.select}
                      value={form.categoryId ?? ""}
                      onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
                      {...errProps("categoryId")}
                    >
                      <option value="">Оберіть…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {err("categoryId")}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-short">
                    Короткий опис (у картці каталогу)
                  </label>
                  <input id="p-short" className={list.input} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} maxLength={160} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-desc">
                    Опис
                  </label>
                  <textarea id="p-desc" className={list.textarea} rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
                </div>
                <div className={`${styles.field} ${styles.desktopOnly}`}>
                  <label className={styles.label} htmlFor="p-care">
                    Догляд
                  </label>
                  <textarea id="p-care" className={list.textarea} rows={3} value={form.care} onChange={(e) => set("care", e.target.value)} />
                </div>
              </div>
            </Section>

            <Section icon={ImagePlus} title="Фото" className={styles.order1}>
              <div className={styles.photos}>
                {photos.map((p, i) => (
                  <div key={p.id} className={styles.photoTile} aria-current={i === selectedPhoto ? "true" : undefined}>
                    <img src={p.url} alt={p.alt || `Фото ${i + 1}`} width={135} height={135} loading="lazy" />
                    <button type="button" className={styles.photoSelect} aria-label={`Обрати фото ${i + 1}${i === 0 ? " (головне)" : ""}`} aria-pressed={i === selectedPhoto} onClick={() => setSelectedPhoto(i)} />
                    {i === 0 && (
                      <span className={styles.mainBadge}>
                        <Star strokeWidth={1.75} aria-hidden="true" />
                        Головне
                      </span>
                    )}
                    {p.small && (
                      <span className={styles.smallBadge} title="Фото замале, на сайті може бути розмитим">
                        <TriangleAlert strokeWidth={1.75} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                ))}
                {uploading ? (
                  <span className={styles.spinnerTile} role="status">
                    Завантажуємо…
                  </span>
                ) : (
                  <label className={styles.addTile} aria-disabled={isNew || undefined}>
                    <Upload strokeWidth={1.75} aria-hidden="true" />
                    Додати фото
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                      className="visually-hidden"
                      disabled={isNew}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void upload(file);
                      }}
                    />
                  </label>
                )}
              </div>
              {isNew && <p className={styles.help}>Фото можна додати після першого збереження рослини.</p>}

              {current && (
                <>
                  <div className={styles.photoTools}>
                    <button type="button" className={styles.toolButton} onClick={() => movePhoto(selectedPhoto, -1)} disabled={selectedPhoto === 0}>
                      <ChevronLeft strokeWidth={1.75} aria-hidden="true" />
                      Вліво
                    </button>
                    <button type="button" className={styles.toolButton} onClick={() => movePhoto(selectedPhoto, 1)} disabled={selectedPhoto === photos.length - 1}>
                      Вправо
                      <ChevronRight strokeWidth={1.75} aria-hidden="true" />
                    </button>
                    {selectedPhoto !== 0 && (
                      <button
                        type="button"
                        className={styles.toolButton}
                        onClick={() => {
                          setPhotos((prev) => [prev[selectedPhoto], ...prev.filter((_, j) => j !== selectedPhoto)]);
                          setSelectedPhoto(0);
                        }}
                      >
                        <Star strokeWidth={1.75} aria-hidden="true" />
                        Зробити головним
                      </button>
                    )}
                    <button type="button" className={`${styles.toolButton} ${styles.toolDanger}`} onClick={() => removePhoto(selectedPhoto)}>
                      <Trash2 strokeWidth={1.75} aria-hidden="true" />
                      Видалити
                    </button>
                  </div>
                  <div className={`${styles.field} ${styles.desktopOnly}`} style={{ marginTop: 16 }}>
                    <label className={styles.label} htmlFor="p-alt">
                      Опис фото {selectedPhoto + 1} (для Google і незрячих)
                    </label>
                    <input
                      id="p-alt"
                      className={list.input}
                      value={current.alt}
                      maxLength={300}
                      onChange={(e) => {
                        const alt = e.target.value;
                        setPhotos((prev) => prev.map((p, j) => (j === selectedPhoto ? { ...p, alt } : p)));
                        setMessage(null);
                      }}
                    />
                  </div>
                </>
              )}
              <p className={`${styles.help} ${styles.desktopOnly}`} style={{ marginTop: 12 }}>
                Квадратні фото від 800×800 px. Перше фото — головне в каталозі. Порядок і описи зберігаються кнопкою «Зберегти».
              </p>
            </Section>

            <Section icon={Package} title="Розміри, ціни й залишок" className={styles.order3}>
              <div className={styles.sizeHead} aria-hidden="true">
                <span>Горщик</span>
                <span>Висота</span>
                <span>Ціна, грн</span>
                <span>Залишок, шт</span>
                <span />
              </div>
              <ul className={styles.sizeRows}>
                {form.sizes.map((s, i) => (
                  <li key={s.id ?? `new-${i}`} className={styles.sizeRow} aria-label={`Розмір ${i + 1}`}>
                    <SizeField id={`s-${i}-pot`} label="Горщик" error={errors[`sizes.${i}.pot`]}>
                      <input id={`s-${i}-pot`} className={`${list.input} ${styles.sizeInput}`} value={s.pot} placeholder="0,5 л" onChange={(e) => setSize(i, "pot", e.target.value)} {...errProps(`sizes.${i}.pot`)} />
                    </SizeField>
                    <SizeField id={`s-${i}-height`} label="Висота" className={styles.sizeHeight}>
                      <input id={`s-${i}-height`} className={`${list.input} ${styles.sizeInput}`} value={s.height} placeholder="10–15 см" onChange={(e) => setSize(i, "height", e.target.value)} />
                    </SizeField>
                    <SizeField id={`s-${i}-price`} label="Ціна, грн" error={errors[`sizes.${i}.price`]}>
                      <input id={`s-${i}-price`} className={`${list.input} ${styles.sizeInput}`} value={s.price} inputMode="numeric" placeholder="навесні" onChange={(e) => setSize(i, "price", e.target.value)} {...errProps(`sizes.${i}.price`)} />
                    </SizeField>
                    <SizeField id={`s-${i}-stock`} label="Залишок" error={errors[`sizes.${i}.stock`]}>
                      <input id={`s-${i}-stock`} className={`${list.input} ${styles.sizeInput}`} value={s.stock} inputMode="numeric" onChange={(e) => setSize(i, "stock", e.target.value)} {...errProps(`sizes.${i}.stock`)} />
                    </SizeField>
                    <button
                      type="button"
                      className={styles.deleteSize}
                      aria-label={`Видалити розмір ${s.pot || i + 1}`}
                      disabled={form.sizes.length === 1}
                      onClick={() => set("sizes", form.sizes.filter((_, j) => j !== i))}
                    >
                      <Trash2 strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              {errors.sizes && <p className={styles.error}>{errors.sizes}</p>}
              <button
                type="button"
                className={styles.addSize}
                onClick={() => set("sizes", [...form.sizes, { id: null, pot: "", height: "", price: "", stock: "0" }])}
              >
                <Plus strokeWidth={1.75} aria-hidden="true" />
                Додати розмір
              </button>
              <p className={styles.help} style={{ marginTop: 10 }}>
                Порожня ціна — на сайті «Ціна навесні».
              </p>
            </Section>

            <Section icon={Search} title="Для пошуку (SEO)" className={`${styles.order8} ${styles.desktopOnly}`}>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-seo-title">
                    Заголовок сторінки
                  </label>
                  <input id="p-seo-title" className={list.input} value={form.seoTitle} placeholder={`${form.name || "Назва"} — купити | ЯРЕМІЯ`} onChange={(e) => set("seoTitle", e.target.value)} maxLength={70} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-seo-desc">
                    Опис у Google
                  </label>
                  <textarea id="p-seo-desc" className={list.textarea} rows={3} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={180} />
                  <p className={styles.help}>Якщо залишити порожнім — підставиться з назви й короткого опису.</p>
                </div>
              </div>
            </Section>
          </div>

          <div className={styles.col}>
            <Section icon={CircleCheck} title="Статус і видимість" className={styles.order4}>
              <fieldset className={styles.radios}>
                <legend className="visually-hidden">Статус</legend>
                {STATUSES.map((s) => (
                  <label key={s} className={styles.radio}>
                    <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => set("status", s)} />
                    <span className={`${styles.dot} ${styles[`dot_${s}`]}`} aria-hidden="true" />
                    {PLANT_STATUS_LABELS[s]}
                  </label>
                ))}
              </fieldset>
              <div className={styles.visibility}>
                <span className={styles.visibilityText} id="visible-label">
                  Показувати на сайті
                  <small className={styles.desktopOnly}>{plant.archived ? "Рослина в архіві" : "Вимкніть, щоб сховати з каталогу"}</small>
                </span>
                <Switch checked={form.isVisible} disabled={plant.archived} label="Показувати на сайті" onChange={(v) => set("isVisible", v)} />
              </div>
            </Section>

            <Section icon={CalendarDays} title="Сезон продажу" className={styles.order5}>
              <div className={styles.months} role="group" aria-label="Місяці продажу">
                {MONTHS_SHORT.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    className={styles.month}
                    aria-pressed={form.seasonMonths.includes(i)}
                    aria-label={MONTHS_FULL[i]}
                    onClick={() =>
                      set(
                        "seasonMonths",
                        form.seasonMonths.includes(i) ? form.seasonMonths.filter((x) => x !== i) : [...form.seasonMonths, i].sort((a, b) => a - b),
                      )
                    }
                  >
                    {m}
                  </button>
                ))}
              </div>
              <p className={`${styles.help} ${styles.desktopOnly}`} style={{ marginTop: 12 }}>
                Позначені місяці потрапляють у сезонний календар на сайті.
              </p>
            </Section>

            <Section icon={Sun} title="Умови вирощування" className={`${styles.order7} ${styles.desktopOnly}`}>
              <div className={styles.checks}>
                {CONDITIONS.map((c) => (
                  <label key={c} className={styles.check}>
                    <input
                      type="checkbox"
                      checked={Boolean(form.conditions[c])}
                      onChange={(e) => set("conditions", { ...form.conditions, [c]: e.target.checked })}
                    />
                    {CONDITION_LABELS[c]}
                  </label>
                ))}
              </div>
            </Section>

            {!isNew && !plant.archived && (
              <Section icon={Archive} title="Архів" className={styles.order6}>
                <p className={`${styles.archiveText} ${styles.desktopOnly}`}>
                  Рослина зникне з сайту й зі списку, але залишиться в старих замовленнях. Повернути можна з вкладки «Архів».
                </p>
                <button type="button" className={styles.archiveButton} onClick={() => setArchiveOpen(true)}>
                  <Archive strokeWidth={1.75} aria-hidden="true" />
                  Перенести в архів
                </button>
              </Section>
            )}
          </div>

          <p className={styles.mobileHint}>Догляд, умови вирощування й тексти для Google — у версії для комп’ютера.</p>
        </div>
      </div>

      {/* Телефон: закріплена панель */}
      <div className={styles.mobileBar}>
        <button type="button" className={list.buttonLight} onClick={cancel}>
          Скасувати
        </button>
        {saveButton(list.buttonGreen)}
      </div>

      <ArchiveDialog plantName={archiveOpen ? form.name || plant.name : null} onConfirm={confirmArchive} onClose={() => setArchiveOpen(false)} />
      <Toast toast={toast} />
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  className,
  children,
}: {
  icon: typeof FileText;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className={`${styles.card} ${className ?? ""}`} aria-labelledby={id}>
      <h2 id={id} className={styles.cardTitle}>
        <Icon strokeWidth={1.75} aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function SizeField({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.sizeField} ${className ?? ""}`}>
      <label htmlFor={id} className={styles.sizeLabel}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`err-${id.replace(/^s-(\d+)-/, "sizes.$1.")}`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
