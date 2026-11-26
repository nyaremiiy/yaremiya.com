/**
 * Скелетони дашборду — повторюють розкладку справжніх блоків
 * (ті самі класи карток і сіток), щоб після завантаження нічого не стрибало.
 * Специфікація: docs/loading.md, еталони: docs/reference/skeleton*.png.
 */

import { Skeleton, SkeletonLine } from "@/components/loading/Skeleton";
import { can, type Role } from "@/lib/permissions";
import styles from "./dashboard.module.css";

const W = ["62%", "48%", "74%", "55%", "68%", "42%"];

/** Підпис групи («СЬОГОДНІ»): квадратик 16 px + смужка 12 px. */
export function GroupTitleSkeleton({ w = 90 }: { w?: number }) {
  return (
    <div className={styles.groupTitle} aria-hidden="true">
      <Skeleton w={16} h={16} r={4} />
      <Skeleton w={w} h={12} r={6} />
    </div>
  );
}

/* ───── Комп'ютер ───── */

export function MetricsSkeleton({ count }: { count: number }) {
  return (
    <ul className={styles.metrics} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className={`${styles.card} ${styles.metric}`}>
          <div className={styles.metricHead}>
            <SkeletonLine w="55%" h={13} lh={20} />
            <Skeleton w={40} h={40} r={12} />
          </div>
          <SkeletonLine w="50%" h={30} lh={34} mt={14} r={8} />
          <SkeletonLine w="70%" h={12} lh={18} mt={13} />
        </li>
      ))}
    </ul>
  );
}

export function OrdersTableSkeleton({ rows = 5, withSum = true }: { rows?: number; withSum?: boolean }) {
  const cols = withSum ? 5 : 4;
  return (
    <div className={`${styles.card} ${styles.ordersCard}`} aria-hidden="true">
      <div className={styles.cardHead}>
        <SkeletonLine w={200} h={20} lh={24} />
        <Skeleton w={130} h={13} />
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {Array.from({ length: cols }, (_, i) => (
                <th key={i}>
                  <SkeletonLine w={i === 2 ? 70 : 40} h={10} lh={20} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                <th>
                  <Skeleton w={44} h={13} />
                </th>
                <td>
                  <SkeletonLine w={110} h={13} lh={20} />
                  <SkeletonLine w={68} h={10} lh={16} />
                </td>
                <td className={styles.orderPlants}>
                  <Skeleton w={W[r % W.length]} h={13} />
                </td>
                {withSum && (
                  <td>
                    <Skeleton w={70} h={13} />
                  </td>
                )}
                <td>
                  <Skeleton w={84} h={28} r={999} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Бічна картка: заголовок + рядки (квадратик 44 px, два рядки тексту, пігулка). */
export function SideListSkeleton({ rows }: { rows: number }) {
  return (
    <div className={`${styles.card} ${styles.sideCard}`} aria-hidden="true">
      <div className={styles.sideCardTitle}>
        <SkeletonLine w="58%" h={18} lh={24} />
      </div>
      <ul className={styles.dividedList}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className={styles.lowItem}>
            <Skeleton w={44} h={44} r={10} />
            <span className={styles.lowText}>
              <SkeletonLine w="80%" h={13} lh={20} />
              <SkeletonLine w="45%" h={10} lh={18} />
            </span>
            <Skeleton w={52} h={26} r={999} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SalesSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className={`${styles.card} ${styles.salesCard}`} aria-hidden="true">
      <div className={styles.cardHead}>
        <SkeletonLine w={230} h={20} lh={24} />
        <Skeleton w={70} h={12} />
      </div>
      <ul className={styles.salesList}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className={styles.salesRow}>
            <SkeletonLine w={90} h={13} lh={20} />
            <Skeleton w={["70%", "52%", "30%", "15%"][i % 4]} h={13} />
            <Skeleton w={100} h={13} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** «Активність у CRM» / «Команда»: заголовок з посиланням і рядки. */
export function PeopleListSkeleton({ rows, round }: { rows: number; round?: boolean }) {
  return (
    <div className={`${styles.card} ${styles.sideCard}`} aria-hidden="true">
      <div className={styles.cardHeadDivided}>
        <SkeletonLine w={170} h={18} lh={24} />
        <Skeleton w={80} h={12} />
      </div>
      <ul className={styles.dividedList}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className={styles.teamRow}>
            <Skeleton w={round ? 36 : 34} h={round ? 36 : 34} r={round ? 999 : 10} />
            <span className={styles.lowText}>
              <SkeletonLine w={W[i % W.length]} h={13} lh={20} />
              {round && <SkeletonLine w="35%" h={10} lh={18} />}
            </span>
            <Skeleton w={round ? 64 : 48} h={12} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───── Телефон ───── */

export function MetricsMobileSkeleton({ count }: { count: number }) {
  return (
    <ul className={styles.metricsMobile} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className={`${styles.card} ${styles.metricMobile}`}>
          <Skeleton w={40} h={40} r={12} />
          <SkeletonLine w="55%" h={22} lh={26} mt={14} r={8} />
          <SkeletonLine w="75%" h={12} lh={18} mt={10} />
          <SkeletonLine w="50%" h={11} lh={18} />
        </li>
      ))}
    </ul>
  );
}

/** Картка-список на телефоні: два рядки тексту + пігулка 28 × 84. */
export function MobileListSkeleton({ rows, withLink }: { rows: number; withLink?: boolean }) {
  return (
    <div className={`${styles.card} ${withLink ? styles.mobileListCard : styles.mobileCard}`} aria-hidden="true">
      <ul className={styles.dividedList}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className={styles.orderMobile}>
            <span className={styles.lowText}>
              <SkeletonLine w="78%" h={13} lh={20} />
              <SkeletonLine w="50%" h={10} lh={18} />
            </span>
            <Skeleton w={84} h={28} r={999} />
          </li>
        ))}
      </ul>
      {withLink && (
        <div className={styles.mobileCardLink}>
          <Skeleton w={120} h={12} />
        </div>
      )}
    </div>
  );
}

export function SalesMobileSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className={`${styles.card} ${styles.mobileCard}`} aria-hidden="true">
      <ul className={styles.salesListMobile}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className={styles.salesRowMobile}>
            <span className={styles.salesRowMobileHead}>
              <SkeletonLine w={90} h={13} lh={20} />
              <SkeletonLine w={110} h={13} lh={20} />
            </span>
            <Skeleton w={["70%", "52%", "30%", "15%"][i % 4]} h={6} r={999} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───── Працівник (один блок: стан кнопок спільний) ───── */

export function WorkerSkeleton() {
  return (
    <div className={styles.groups} aria-hidden="true">
      <section>
        <GroupTitleSkeleton />
        <ul className={styles.counters}>
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i} className={`${styles.card} ${styles.counter}`}>
              <Skeleton w={44} h={44} r={12} />
              <span className={styles.counterText}>
                <SkeletonLine w={36} h={22} lh={28} r={8} />
                <SkeletonLine w={["120px", "100px", "80px"][i]} h={11} lh={17} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.workerLayout}>
        <section>
          <GroupTitleSkeleton w={180} />
          <div className={`${styles.card} ${styles.workerCard}`}>
            <ul className={styles.dividedList}>
              {Array.from({ length: 3 }, (_, i) => (
                <li key={i} className={styles.prepareRow}>
                  <span className={styles.prepareText}>
                    <SkeletonLine w="40%" h={14} lh={22} />
                    <SkeletonLine w={W[i]} h={12} lh={20} />
                    <SkeletonLine w="50%" h={11} lh={18} />
                  </span>
                  <Skeleton w={190} h={44} r={10} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <GroupTitleSkeleton w={150} />
          <div className={`${styles.card} ${styles.workerCard}`}>
            <ul className={styles.dividedList}>
              {Array.from({ length: 3 }, (_, i) => (
                <li key={i} className={styles.stockRow}>
                  <Skeleton w={48} h={48} r={10} />
                  <span className={styles.lowText}>
                    <SkeletonLine w="85%" h={13} lh={20} />
                    <SkeletonLine w="45%" h={10} lh={18} />
                  </span>
                  <Skeleton w={118} h={40} r={10} />
                </li>
              ))}
            </ul>
            <Skeleton h={48} r={10} style={{ marginTop: 14 }} />
          </div>
        </section>
      </div>

      <Skeleton h={54} r={14} />
    </div>
  );
}

/* ───── Уся сторінка (loading.tsx) за роллю ───── */

export function DashboardSkeleton({ role }: { role: Role }) {
  if (role === "worker") {
    return (
      <div className={styles.content}>
        <WorkerSkeleton />
      </div>
    );
  }

  const finance = can(role, "finance");
  const leads = can(role, "clientContacts");
  const team = can(role, "teamActivity");
  const metrics = finance ? 4 : 3;

  return (
    <div className={styles.content}>
      <div className={`${styles.groups} ${styles.desktopOnly}`}>
        <section>
          <GroupTitleSkeleton />
          <MetricsSkeleton count={metrics} />
        </section>
        <section>
          <GroupTitleSkeleton w={210} />
          <div className={styles.ordersLayout}>
            <OrdersTableSkeleton withSum={finance} />
            <div className={styles.sideColumn}>
              {leads && <SideListSkeleton rows={2} />}
              <SideListSkeleton rows={3} />
            </div>
          </div>
        </section>
        {finance && (
          <section>
            <GroupTitleSkeleton />
            <SalesSkeleton />
          </section>
        )}
        {team && (
          <section>
            <GroupTitleSkeleton w={180} />
            <div className={styles.teamLayout}>
              <PeopleListSkeleton rows={6} />
              <PeopleListSkeleton rows={4} round />
            </div>
          </section>
        )}
      </div>

      <div className={`${styles.groups} ${styles.mobileOnly}`}>
        <section>
          <GroupTitleSkeleton />
          <MetricsMobileSkeleton count={metrics} />
        </section>
        <section>
          <GroupTitleSkeleton w={150} />
          <div className={styles.stack}>
            {leads && <MobileListSkeleton rows={2} />}
            <MobileListSkeleton rows={3} />
          </div>
        </section>
        <section>
          <GroupTitleSkeleton w={170} />
          <MobileListSkeleton rows={4} withLink />
        </section>
        {finance && (
          <section>
            <GroupTitleSkeleton w={170} />
            <SalesMobileSkeleton />
          </section>
        )}
        {team && (
          <section>
            <GroupTitleSkeleton w={160} />
            <MobileListSkeleton rows={4} withLink />
          </section>
        )}
      </div>
    </div>
  );
}
