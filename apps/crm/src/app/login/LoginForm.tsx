"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Eye, EyeOff, Info, Lock, LogIn } from "lucide-react";
import { signIn } from "@/lib/auth";
import styles from "./login.module.css";

type FieldErrors = { login?: string; password?: string };
type Status = "idle" | "submitting" | "invalid" | "unavailable";

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  const loginRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const submitting = status === "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const next: FieldErrors = {};
    if (!login.trim()) next.login = "Введіть логін";
    if (!password) next.password = "Введіть пароль";
    setErrors(next);

    if (next.login || next.password) {
      setStatus("idle");
      (next.login ? loginRef : passwordRef).current?.focus();
      return;
    }

    setStatus("submitting");
    const result = await signIn(login.trim(), password, remember);

    if (result.ok) {
      // Кнопка лишається в стані «Входимо…», доки відкривається потрібна сторінка.
      router.push(nextPath);
      return;
    }
    setStatus(result.error === "invalid-credentials" ? "invalid" : "unavailable");
  }

  // method="post": навіть якщо скрипти ще не завантажились, пароль не потрапить в адресу.
  return (
    <form className={styles.form} method="post" onSubmit={handleSubmit} noValidate>
      <div className={styles.heading}>
        <h1 className={styles.title}>Вхід у CRM</h1>
        <p className={styles.subtitle}>
          Увійдіть з логіном і паролем, які вам видав адміністратор.
        </p>
      </div>

      {status === "invalid" && (
        <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
          <CircleAlert strokeWidth={1.75} aria-hidden="true" />
          <p>Невірний логін або пароль. Перевірте дані або зверніться до адміністратора.</p>
        </div>
      )}

      {status === "unavailable" && (
        <div className={`${styles.notice} ${styles.noticeInfo}`} role="status">
          <Info strokeWidth={1.75} aria-hidden="true" />
          <p>Не вдалося з’єднатися з сервером. Спробуйте ще раз за хвилину.</p>
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="login">
          Логін
        </label>
        <input
          ref={loginRef}
          id="login"
          name="login"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Ваш логін"
          className={styles.input}
          value={login}
          onChange={(e) => {
            setLogin(e.target.value);
            if (errors.login) setErrors((prev) => ({ ...prev, login: undefined }));
          }}
          aria-invalid={errors.login ? true : undefined}
          aria-describedby={errors.login ? "login-error" : undefined}
        />
        {errors.login && (
          <p id="login-error" className={styles.fieldError}>
            {errors.login}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="password">
            Пароль
          </label>
          <button
            type="button"
            className={styles.linkButton}
            aria-expanded={showForgot}
            aria-controls="forgot-help"
            onClick={() => setShowForgot((v) => !v)}
          >
            Забули пароль?
          </button>
        </div>
        <div className={styles.passwordWrap}>
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Ваш пароль"
            className={`${styles.input} ${styles.passwordInput}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          <button
            type="button"
            className={styles.eye}
            aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? (
              <EyeOff strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Eye strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className={styles.fieldError}>
            {errors.password}
          </p>
        )}
      </div>

      <div id="forgot-help" hidden={!showForgot} className={`${styles.notice} ${styles.noticeHelp}`}>
        <Info strokeWidth={1.75} aria-hidden="true" />
        <p>
          Паролі створює й змінює лише адміністратор. Зверніться до нього — він
          видасть вам новий пароль.
        </p>
      </div>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          name="remember"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        Запам’ятати мене на цьому пристрої
      </label>

      <button
        type="submit"
        className={styles.submit}
        aria-busy={submitting || undefined}
        disabled={submitting}
      >
        <LogIn strokeWidth={1.75} aria-hidden="true" />
        {submitting ? "Входимо…" : "Увійти"}
      </button>

      <div className={styles.noRegistration}>
        <span className={styles.lockCircle} aria-hidden="true">
          <Lock strokeWidth={1.75} />
        </span>
        <p>
          <strong>Реєстрації немає.</strong> Обліковий запис створює адміністратор
          господарства — попросіть його додати вас.
        </p>
      </div>
    </form>
  );
}
