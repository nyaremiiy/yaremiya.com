"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CurrentUser } from "@/lib/current-user";

const UserContext = createContext<CurrentUser | null>(null);

/** Поточний користувач для клієнтських частин каркаса (скелетони за роллю тощо). */
export function UserProvider({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): CurrentUser {
  const user = useContext(UserContext);
  if (!user) throw new Error("useCurrentUser — лише всередині каркаса CRM");
  return user;
}
