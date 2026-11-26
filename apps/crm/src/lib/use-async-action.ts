"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACTION_TIMEOUT_MS, startProgress } from "./loading-store";

export type ActionStatus = "idle" | "pending" | "saved" | "error";

const SAVED_VISIBLE_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Серверна дія зі станами для кнопки й повідомлень (docs/loading.md):
 * pending — кнопка чекає й іде смужка прогресу; saved — «Збережено» на 3 с;
 * error — «Не вдалося зберегти» з «Спробувати ще» (у т. ч. якщо сервер мовчить 15 с).
 */
export function useAsyncAction<A extends unknown[], R>(action: (...args: A) => Promise<R>) {
  const [status, setStatus] = useState<ActionStatus>("idle");
  const actionRef = useRef(action);
  const lastArgs = useRef<A | null>(null);

  useEffect(() => {
    actionRef.current = action;
  });

  const run = useCallback(async (...args: A): Promise<boolean> => {
    lastArgs.current = args;
    setStatus("pending");
    const done = startProgress();
    try {
      await withTimeout(actionRef.current(...args), ACTION_TIMEOUT_MS);
      setStatus("saved");
      return true;
    } catch {
      setStatus("error");
      return false;
    } finally {
      done();
    }
  }, []);

  const retry = useCallback(() => {
    if (lastArgs.current) void run(...lastArgs.current);
  }, [run]);

  const reset = useCallback(() => setStatus("idle"), []);

  useEffect(() => {
    if (status !== "saved") return;
    const timer = setTimeout(() => setStatus("idle"), SAVED_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [status]);

  return { status, pending: status === "pending", run, retry, reset };
}
