"use client";

import { Pending } from "@/components/loading/Pending";
import { Skeleton, SkeletonLine } from "@/components/loading/Skeleton";
import TopBar from "@/components/shell/TopBar";
import { useCurrentUser } from "@/components/shell/UserProvider";
import styles from "@/components/plants/editor.module.css";

/** Поки відкривається редагування: дві колонки карток (форма як у справжньої сторінки). */
export default function EditPlantLoading() {
  const user = useCurrentUser();
  return (
    <>
      <div className={styles.desktopOnly}>
        <TopBar user={user} title="Рослина" actions={null} />
      </div>
      <Pending id="page-plant-edit" label="Завантажуємо рослину…">
        <div className={styles.content} aria-hidden="true">
          <div className={styles.layout}>
            <div className={styles.col}>
              {[5, 2, 3].map((rows, i) => (
                <div key={i} className={`${styles.card} ${styles[`order${i + 1}` as "order1"]}`}>
                  <SkeletonLine w={140} h={18} lh={24} />
                  {Array.from({ length: rows }, (_, r) => (
                    <div key={r} style={{ marginTop: 16 }}>
                      <SkeletonLine w={110} h={12} lh={18} />
                      <Skeleton h={46} r={12} style={{ marginTop: 8 }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className={styles.col}>
              {[3, 2, 1].map((rows, i) => (
                <div key={i} className={`${styles.card} ${styles[`order${i + 4}` as "order4"]}`}>
                  <SkeletonLine w={160} h={18} lh={24} />
                  {Array.from({ length: rows }, (_, r) => (
                    <Skeleton key={r} h={46} r={12} style={{ marginTop: 12 }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Pending>
    </>
  );
}
