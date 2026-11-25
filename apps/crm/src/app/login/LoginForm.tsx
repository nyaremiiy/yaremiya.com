"use client";

import { useRef, useState, type FormEvent } from "react";
import { CircleAlert, Eye, EyeOff, Info, Lock, LogIn } from "lucide-react";
import { signIn } from "@/lib/auth";
import styles from "./login.module.css";

type FieldErrors = { email?: string; password?: string };
type Status = "idle" | "submitting" | "invalid" | "not-connected";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const submitting = status === "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Введіть e-mail";
    if (!password) next.password = "Введіть пароль";
    setErrors(next);

    if (next.email || next.password) {
      setStatus("idle");
      (next.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setStatus("submitting");
    const result = await signIn(email.trim(), password, remember);

    if (result.ok) {
      // Після справжнього входу тут буде перехід до огляду CRM.
      setStatus("idle");
      return;
    }
    setStatus(result.error === "invalid-credentials" ? "invalid" : "not-connected");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.heading}>
        <h1 className={styles.title}>Вхід у CRM</h1>
        <p className={styles.subtitle}>
          Увійдіть з e-mail і паролем, які вам видав адміністратор.
        </p>
      </div>

      {status === "invalid" && (
        <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
          <CircleAlert strokeWidth={1.75} aria-hidden="true" />
          <p>Невірний e-mail або пароль. Перевірте дані або зверніться до адміністратора.</p>
        </div>
      )}

      {status === "not-connected" && (
        <div className={`${styles.notice} ${styles.noticeInfo}`} role="status">
          <Info strokeWidth={1.75} aria-hidden="true" />
          <p>Вхід ще не підключено — це демо-версія сторінки.</p>
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          E-mail
        </label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="name@example.com"
          className={styles.input}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className={styles.fieldError}>
            {errors.email}
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
