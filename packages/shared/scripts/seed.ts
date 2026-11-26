/**
 * `pnpm db:seed` — демо-користувачі для локальної й тестової бази.
 * На основному сервері (`APP_ENV=production`) відмовляється працювати.
 *
 * Паролі демо-користувачів не зберігаються в репозиторії: команда
 * генерує випадкові й показує їх один раз у терміналі.
 */

import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { auditLog, users, type Role } from "../src/db/schema";
import { closeDb, getDb } from "../src/db/client";
import { hashPassword } from "../src/users";
import path from "node:path";
import { isProduction, repoRoot, requireEnv, errorText } from "./env";
import { createPlantIfMissing, type PlantInput } from "./plant-data";

if (isProduction) {
  console.error("✗ db:seed заборонено на основному сервері (APP_ENV=production).");
  process.exit(1);
}
requireEnv("DATABASE_URL");

const DEMO: { login: string; name: string; role: Role; isActive: boolean }[] = [
  { login: "demo.manager", name: "Менеджер", role: "manager", isActive: true },
  { login: "demo.oksana", name: "Оксана", role: "worker", isActive: true },
  { login: "demo.ivan", name: "Іван", role: "worker", isActive: false },
];

const photo = (file: string) => path.join(repoRoot, "apps/site/src/assets/images/plants", file);
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const DEMO_PLANTS: PlantInput[] = [
  {
    slug: "lavanda-vuzkolysta-khidkot", name: "Лаванда вузьколиста Хідкот", latinName: "Lavandula angustifolia ‘Hidcote’",
    categorySlug: "dekoratyvni-kushchi", shortDescription: "Темно-фіолетові суцвіття, висота 10–15 см",
    description: "Хідкот — один із найулюбленіших сортів англійської лаванди. Кущик компактний і охайний, а суцвіття насиченого фіолетового кольору тримаються все літо.",
    care: "Повне сонце, помірний полив без застою води, легкий дренований ґрунт. Після цвітіння зрізати суцвіття.",
    status: "in_stock", isVisible: true, seasonMonths: range(3, 9), conditions: { sun: true, hardy: true },
    sizes: [
      { pot: "0,5 л", height: "10–15 см", price: 90, stock: 30 },
      { pot: "2 л", height: "25–30 см", price: 180, stock: 12 },
      { pot: "3 л", height: "30–40 см", price: 250, stock: 4 },
    ],
    photoFile: photo("lavender-bush.jpg"), sort: 1,
  },
  {
    slug: "lavanda-vuzkolysta-manstead", name: "Лаванда вузьколиста Манстед", categorySlug: "dekoratyvni-kushchi",
    shortDescription: "Світло-лавандові суцвіття, дуже зимостійка", status: "in_stock", isVisible: true,
    seasonMonths: range(3, 9), conditions: { sun: true, hardy: true },
    sizes: [{ pot: "0,5 л", height: "10–15 см", price: 85, stock: 30 }], photoFile: photo("lavender-sapling.jpg"), sort: 2,
  },
  {
    slug: "lavanda-doroslyi-kushch", name: "Лаванда — дорослий кущ", categorySlug: "dekoratyvni-kushchi",
    shortDescription: "Готовий кущ, цвіте вже цього сезону", status: "low", isVisible: true, seasonMonths: range(3, 9),
    sizes: [{ pot: "2 л", height: "30–40 см", price: 180, stock: 4 }], photoFile: photo("lavender-bush.jpg"), sort: 3,
  },
  {
    slug: "samshyt-vichnozelenyi-demo", name: "Самшит вічнозелений", categorySlug: "dekoratyvni-kushchi",
    shortDescription: "Для бордюрів і фігурної стрижки", status: "in_stock", isVisible: true, seasonMonths: range(2, 10),
    sizes: [
      { pot: "0,5 л", height: "15–20 см", price: 60, stock: 40 },
      { pot: "3 л", height: "30–35 см", price: 250, stock: 22 },
    ],
    photoFile: photo("boxwood-ball.jpg"), sort: 4,
  },
  {
    slug: "samshyt-sformovana-kulia", name: "Самшит — сформована куля", categorySlug: "dekoratyvni-kushchi",
    shortDescription: "Готова куля для входу чи тераси", status: "low", isVisible: true, seasonMonths: range(2, 10),
    sizes: [{ pot: "10 л", height: "40 см", price: 900, stock: 2 }], photoFile: photo("boxwood-ball.jpg"), sort: 5,
  },
  {
    slug: "khryzantema-kushchova-bila", name: "Хризантема кущова біла", categorySlug: "kvity",
    shortDescription: "Низькоросла, цвіте до перших морозів", status: "in_stock", isVisible: true, seasonMonths: range(7, 10),
    sizes: [{ pot: "2 л", price: 100, stock: 38 }], photoFile: photo("chrysanthemum-bush.jpg"), sort: 6,
  },
  {
    slug: "khryzantema-multyflora-zhovta", name: "Хризантема мультифлора жовта", categorySlug: "kvity",
    shortDescription: "Сама формує кулю, вкриту дрібними квітами", status: "in_stock", isVisible: true, seasonMonths: range(7, 10),
    sizes: [{ pot: "3 л", price: 150, stock: 24 }], photoFile: photo("chrysanthemum-multiflora.jpg"), sort: 7,
  },
  {
    slug: "khryzantema-multyflora-rozheva", name: "Хризантема мультифлора рожева", categorySlug: "kvity",
    shortDescription: "Сама формує кулю, вкриту дрібними квітами", status: "low", isVisible: true, seasonMonths: range(7, 10),
    sizes: [{ pot: "3 л", price: 150, stock: 3 }], photoFile: photo("chrysanthemum-multiflora.jpg"), sort: 8,
  },
  {
    slug: "samshyt-dlia-zhyvoplotu-demo", name: "Самшит для живоплоту", categorySlug: "sadzhantsi",
    shortDescription: "Молоді саджанці 15–20 см — гуртом дешевше", status: "in_stock", isVisible: true, seasonMonths: range(2, 10),
    sizes: [{ pot: "0,5 л", price: 55, unit: "шт", stock: 210 }], photoFile: photo("boxwood-hedge.jpg"), sort: 9,
  },
  {
    slug: "petuniia-ampelna-demo", name: "Петунія ампельна", categorySlug: "rozsada-kvitiv",
    shortDescription: "Для підвісних кашпо й балконів", status: "preorder", isVisible: true, seasonMonths: range(3, 5),
    sizes: [{ pot: "касета", price: null, stock: 0 }], photoFile: photo("petunia-cascade.jpg"), sort: 10,
  },
  {
    slug: "petuniia-krupnokvitkova-makhrova", name: "Петунія крупноквіткова махрова", categorySlug: "rozsada-kvitiv",
    shortDescription: "Великі махрові квіти для клумб і вазонів", status: "preorder", isVisible: false, seasonMonths: range(3, 5),
    sizes: [{ pot: "касета", price: null, stock: 0 }], photoFile: photo("petunia-grandiflora.jpg"), sort: 11,
  },
  {
    slug: "tomat-cherri-demo", name: "Томат черрі", categorySlug: "rozsada-ovochiv",
    shortDescription: "Розсада у касетах", status: "preorder", isVisible: false, archived: true, seasonMonths: range(2, 4),
    sizes: [{ pot: "касета", price: 25, unit: "шт", stock: 0 }], sort: 12,
  },
];

const db = getDb();
try {
  for (const u of DEMO) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.login}) = ${u.login}`)
      .limit(1);
    if (existing) {
      console.log(`· ${u.login} — уже є, пропускаю`);
      continue;
    }
    const password = randomBytes(9).toString("base64url");
    await db.insert(users).values({ ...u, passwordHash: await hashPassword(password) });
    await db.insert(auditLog).values({
      action: "user_created",
      target: u.login,
      details: { role: u.role, via: "seed" },
    });
    console.log(`✓ ${u.login} (${u.name}, ${u.role}${u.isActive ? "" : ", вимкнено"}) — пароль: ${password}`);
  }
  console.log("Паролі показано лише зараз — збережіть, якщо потрібні.");

  // Демо-рослини (як на еталонах CRM). Фото — тестові з сайту.
  for (const plant of DEMO_PLANTS) {
    const ok = await createPlantIfMissing(plant, "seed");
    console.log(`${ok ? "✓" : "·"} рослина «${plant.name}»${ok ? "" : " — уже є"}`);
  }
  console.log("Демо-дані готові.");
} catch (err) {
  console.error(`✗ ${errorText(err)}`);
  process.exitCode = 1;
} finally {
  await closeDb();
}
