import { Suspense } from "react";
import ProgressBar, { NavigationWatcher } from "@/components/loading/ProgressBar";
import { UserProvider } from "@/components/shell/UserProvider";
import { requireUser } from "@/lib/session";
import MobileHeader from "@/components/shell/MobileHeader";
import Sidebar from "@/components/shell/Sidebar";
import TabBar from "@/components/shell/TabBar";
import styles from "@/components/shell/shell.module.css";

// Сторінки CRM залежать від того, хто увійшов, і від сьогоднішньої дати —
// не зберігати їх як статичні.
export const dynamic = "force-dynamic";

/** Спільний каркас усіх розділів CRM (крім сторінки входу). */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <UserProvider user={user}>
      <div className={styles.app}>
        <a href="#content" className={styles.skipLink}>
          Перейти до вмісту
        </a>
        <Sidebar user={user} />
        <div className={styles.column}>
          <MobileHeader user={user} />
          <ProgressBar placement="header" />
          <main id="content" className={styles.main} tabIndex={-1}>
            {children}
          </main>
          <TabBar role={user.role} />
        </div>
        <Suspense fallback={null}>
          <NavigationWatcher />
        </Suspense>
      </div>
    </UserProvider>
  );
}
