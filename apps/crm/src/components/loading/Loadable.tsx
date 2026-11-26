import { Suspense, type ReactNode } from "react";
import { Pending, Reveal } from "./Pending";

/**
 * Блок, що вантажиться незалежно від решти сторінки (`<Suspense>`):
 * поки дані йдуть — свій скелетон, потім — вміст.
 */
export default function Loadable({
  id,
  label,
  skeleton,
  children,
}: {
  /** Унікальний на сторінці. */
  id: string;
  /** Для читачів екрана: «Завантажуємо замовлення…». */
  label: string;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <Pending id={id} label={label}>
          {skeleton}
        </Pending>
      }
    >
      <Reveal id={id} label={label} skeleton={skeleton}>
        {children}
      </Reveal>
    </Suspense>
  );
}
