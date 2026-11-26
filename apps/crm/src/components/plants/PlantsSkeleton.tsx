import { Skeleton, SkeletonLine } from "@/components/loading/Skeleton";
import styles from "./plants.module.css";

const W = ["70%", "52%", "86%", "60%", "66%", "48%", "80%", "56%"];

/** Скелетон списку рослин (еталон plants-skeleton.png). */
export function PlantsListSkeleton() {
  return (
    <div className={styles.content} aria-hidden="true">
      <div className={styles.tabs} style={{ height: 45, alignItems: "center" }}>
        <Skeleton w={96} h={16} />
        <Skeleton w={70} h={16} />
      </div>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Skeleton h={44} r={12} />
        </div>
        <div className={styles.chips}>
          {[60, 150, 80, 110, 100].map((w, i) => (
            <Skeleton key={i} w={w} h={40} r={999} />
          ))}
        </div>
      </div>

      <div className={`${styles.card} ${styles.tableCard}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              {[146, 80, 66, 60, 48, 66, 40, 0].map((w, i) => (
                <th key={i}>{w ? <SkeletonLine w={w} h={10} lh={16} /> : null}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {W.map((w, r) => (
              <tr key={r}>
                <th>
                  <span className={styles.nameCell}>
                    <Skeleton w={48} h={48} r={10} />
                    <Skeleton w={w} h={13} />
                  </span>
                </th>
                <td>
                  <Skeleton w={100} h={12} />
                </td>
                <td>
                  <Skeleton w={66} h={12} />
                </td>
                <td>
                  <Skeleton w={70} h={12} />
                </td>
                <td>
                  <Skeleton w={40} h={12} />
                </td>
                <td>
                  <Skeleton w={96} h={28} r={999} />
                </td>
                <td>
                  <Skeleton w={48} h={28} r={999} />
                </td>
                <td>
                  <span className={styles.actions}>
                    <Skeleton w={40} h={40} r={10} />
                    <Skeleton w={40} h={40} r={10} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className={styles.cards}>
        {W.slice(0, 5).map((w, i) => (
          <li key={i} className={`${styles.card} ${styles.mCard}`}>
            <span className={styles.mHead}>
              <Skeleton w={56} h={56} r={10} />
              <span className={styles.mText}>
                <SkeletonLine w={w} h={14} lh={20} />
                <SkeletonLine w="55%" h={11} lh={18} />
              </span>
            </span>
            <span className={styles.mFoot}>
              <Skeleton w={96} h={28} r={999} />
              <Skeleton w={44} h={14} />
              <span className={styles.mSwitch}>
                <Skeleton w={48} h={28} r={999} />
                <Skeleton w={40} h={40} r={10} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Скелетон залишків для Працівника. */
export function WorkerStockSkeleton() {
  return (
    <div className={styles.content} aria-hidden="true">
      <div className={styles.workerToolbar}>
        <div className={styles.searchBox}>
          <Skeleton h={44} r={12} />
        </div>
        <Skeleton w={220} h={12} />
      </div>
      <ul className={`${styles.card} ${styles.stockList}`}>
        {W.slice(0, 6).map((w, i) => (
          <li key={i} className={styles.stockItem}>
            <span className={styles.stockHead}>
              <Skeleton w={48} h={48} r={10} />
              <span className={styles.mText}>
                <SkeletonLine w={w} h={14} lh={20} />
                <SkeletonLine w="40%" h={10} lh={18} />
              </span>
            </span>
            <span className={styles.stockSizes}>
              <span className={styles.stockSize}>
                <Skeleton w={40} h={12} />
                <Skeleton w={160} h={44} r={12} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
