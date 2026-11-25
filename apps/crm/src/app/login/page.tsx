import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { safeNextPath } from "@/lib/redirects";
import LoginForm from "./LoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Вхід",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next);

  return (
    <div className={styles.page}>
      <aside className={styles.brand}>
        <img
          className={styles.sprout}
          src="/logo/yaremiia-sprout.svg"
          alt=""
          aria-hidden="true"
        />

        <img
          className={styles.logo}
          src="/logo/yaremiia-logo-web-on-dark.svg"
          alt="ЯРЕМІЯ — простір рослин"
          width={203}
          height={44}
        />

        <div className={styles.intro}>
          <span className={styles.pill}>
            <ShieldCheck strokeWidth={1.75} aria-hidden="true" />
            Панель керування
          </span>
          <p className={styles.headline}>Усе господарство — в одному місці</p>
          <p className={styles.lead}>
            Замовлення, заявки, рослини й наявність. Доступ мають лише люди,
            яких додав адміністратор.
          </p>
        </div>

        <p className={styles.domainDark}>crm.yaremiya.com</p>
      </aside>

      <main className={styles.main}>
        <LoginForm nextPath={nextPath} />
      </main>

      <p className={styles.domainLight}>crm.yaremiya.com</p>
    </div>
  );
}
