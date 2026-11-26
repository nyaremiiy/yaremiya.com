/** «Команда» на дашборді адміністратора — з бази. */

import { and, gt, sql } from "drizzle-orm";
import { getDb, sessions, users } from "@yaremiya/shared/db";
import { initialOf } from "./current-user";
import { formatWhen } from "./format";
import { ROLES, type Role } from "./permissions";

export type TeamMember = {
  id: number;
  name: string;
  initial: string;
  role: Role;
  /** "online" — зелена крапка; "disabled" — доступ вимкнено; інакше — час останнього входу. */
  status: "online" | "disabled" | { lastSeen: string };
};

/** «Онлайн» — якщо сесія була активна за останні 10 хвилин. */
const ONLINE_MS = 10 * 60 * 1000;

export async function getTeam(): Promise<TeamMember[]> {
  const db = getDb();
  const onlineSince = new Date(Date.now() - ONLINE_MS);

  const [rows, online] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users),
    db
      .selectDistinct({ userId: sessions.userId })
      .from(sessions)
      .where(and(gt(sessions.lastSeenAt, onlineSince), gt(sessions.expiresAt, sql`now()`))),
  ]);

  const onlineIds = new Set(online.map((r) => r.userId));
  return rows
    .sort(
      (a, b) =>
        Number(b.isActive) - Number(a.isActive) ||
        ROLES.indexOf(a.role) - ROLES.indexOf(b.role) ||
        a.name.localeCompare(b.name, "uk"),
    )
    .map((u) => ({
      id: u.id,
      name: u.name,
      initial: initialOf(u.name),
      role: u.role,
      status: !u.isActive
        ? "disabled"
        : onlineIds.has(u.id)
          ? "online"
          : { lastSeen: u.lastLoginAt ? formatWhen(u.lastLoginAt) : "ще не входив" },
    }));
}
