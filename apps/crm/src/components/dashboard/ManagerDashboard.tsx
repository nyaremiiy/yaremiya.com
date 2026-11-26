import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  History,
  Inbox,
  PhoneCall,
  ShieldCheck,
  Sun,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  activity,
  activityMobileCount,
  lowStock,
  newLeads,
  recentOrders,
  recentOrdersMobileCount,
  salesByCategory,
  salesMonth,
  todayMetrics,
} from "@/lib/demo-data";
import type { CurrentUser } from "@/lib/current-user";
import type { TeamMember } from "@/lib/team";
import { can, ROLE_LABELS } from "@/lib/permissions";
import Group from "./Group";
import { ACTIVITY_ICONS, Bar, METRIC_ICONS, RichText, StatusPill, toneClass } from "./parts";
import styles from "./dashboard.module.css";

/**
 * Дашборд Менеджера й Адміністратора.
 * Для комп'ютера й телефона групи різні (див. docs/dashboard.md), тому
 * дві розмітки; CSS показує одну з них (прихована не читається читалками).
 */
export default function ManagerDashboard({
  user,
  team = [],
}: {
  user: CurrentUser;
  /** Лише для адміністратора — з бази. */
  team?: TeamMember[];
}) {
  const role = user.role;
  const metrics = todayMetrics.filter((m) => m.key !== "revenue" || can(role, "finance"));
  const showLeads = can(role, "clientContacts");
  const showSales = can(role, "finance");
  const showTeam = can(role, "teamActivity");

  return (
    <div className={styles.content}>
      {/* ───── Комп'ютер ───── */}
      <div className={`${styles.groups} ${styles.desktopOnly}`}>
        <Group id="d-today" icon={Sun} title="Сьогодні">
          <ul className={styles.metrics}>
            {metrics.map((m) => {
              const Icon = METRIC_ICONS[m.key];
              return (
                <li key={m.key} className={`${styles.card} ${styles.metric}`}>
                  <div className={styles.metricHead}>
                    <span className={styles.metricTitle}>{m.title}</span>
                    <span className={`${styles.metricIcon} ${toneClass(m.tone)}`} aria-hidden="true">
                      <Icon strokeWidth={1.75} />
                    </span>
                  </div>
                  <p className={styles.metricValue}>{m.value}</p>
                  <p className={styles.metricCaption}>{m.caption}</p>
                </li>
              );
            })}
          </ul>
        </Group>

        <Group id="d-orders" icon={ClipboardList} title="Замовлення й заявки">
          <div className={styles.ordersLayout}>
            <article className={`${styles.card} ${styles.ordersCard}`} aria-labelledby="d-orders-card">
              <div className={styles.cardHead}>
                <h3 id="d-orders-card" className={styles.cardTitle}>
                  Останні замовлення
                </h3>
                <Link href="/orders" className={styles.cardLink}>
                  Усі замовлення
                  <ArrowRight strokeWidth={1.75} aria-hidden="true" />
                </Link>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">№</th>
                      <th scope="col">Клієнт</th>
                      <th scope="col">Рослини</th>
                      {showSales && <th scope="col">Сума</th>}
                      <th scope="col">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <th scope="row" className={styles.orderNumber}>
                          {o.number}
                        </th>
                        <td>
                          <span className={styles.clientName}>{o.client}</span>
                          <span className={styles.clientDate}>{o.date}</span>
                        </td>
                        <td className={styles.orderPlants}>{o.plants}</td>
                        {showSales && <td className={styles.orderTotal}>{o.total}</td>}
                        <td>
                          <StatusPill status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <div className={styles.sideColumn}>
              {showLeads && (
                <article className={`${styles.card} ${styles.sideCard}`} aria-labelledby="d-leads-card">
                  <h3 id="d-leads-card" className={`${styles.cardTitle} ${styles.sideCardTitle}`}>
                    <Inbox strokeWidth={1.75} aria-hidden="true" />
                    Нові заявки
                  </h3>
                  <ul className={styles.dividedList}>
                    {newLeads.map((lead) => (
                      <li key={lead.id} className={styles.lead}>
                        <div className={styles.leadHead}>
                          <span>
                            <strong>{lead.name}</strong>
                            <span className={styles.leadPhone}> · {lead.phoneMasked}</span>
                          </span>
                          <span className={styles.leadAgo}>{lead.ago}</span>
                        </div>
                        <p className={styles.leadText}>{lead.text}</p>
                        <div className={styles.leadFoot}>
                          <span className={styles.channelPill}>{lead.channel}</span>
                          <Link href="/leads" className={styles.contactButton}>
                            <PhoneCall strokeWidth={1.75} aria-hidden="true" />
                            Зв’язатися
                            <span className="visually-hidden"> з {lead.name}</span>
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              )}

              <article className={`${styles.card} ${styles.sideCard}`} aria-labelledby="d-low-card">
                <h3 id="d-low-card" className={`${styles.cardTitle} ${styles.sideCardTitle}`}>
                  <TriangleAlert strokeWidth={1.75} aria-hidden="true" className={styles.amberIcon} />
                  Закінчуються
                </h3>
                <LowStockList />
              </article>
            </div>
          </div>
        </Group>

        {showSales && (
          <Group id="d-sales" icon={TrendingUp} title="Продажі">
            <article className={`${styles.card} ${styles.salesCard}`} aria-labelledby="d-sales-card">
              <div className={styles.cardHead}>
                <h3 id="d-sales-card" className={styles.cardTitle}>
                  <TrendingUp strokeWidth={1.75} aria-hidden="true" />
                  Продажі за категоріями
                </h3>
                <span className={styles.cardMeta}>{salesMonth}</span>
              </div>
              <ul className={styles.salesList}>
                {salesByCategory.map((c) => (
                  <li key={c.name} className={styles.salesRow}>
                    <span className={styles.salesName}>{c.name}</span>
                    <Bar percent={c.percent} />
                    <span className={styles.salesValue}>
                      <strong>{c.sum}</strong> · {c.percent}%
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </Group>
        )}

        {showTeam && (
          <Group id="d-team" icon={ShieldCheck} title="Команда й безпека">
            <div className={styles.teamLayout}>
              <article className={`${styles.card} ${styles.sideCard}`} aria-labelledby="d-activity-card">
                <div className={styles.cardHeadDivided}>
                  <h3 id="d-activity-card" className={styles.cardTitle}>
                    <History strokeWidth={1.75} aria-hidden="true" />
                    Активність у CRM
                  </h3>
                  <Link href="/users" className={styles.cardLink}>
                    Уся історія
                  </Link>
                </div>
                <ActivityList limit={activity.length} />
              </article>

              <article className={`${styles.card} ${styles.sideCard}`} aria-labelledby="d-teamlist-card">
                <div className={styles.cardHeadDivided}>
                  <h3 id="d-teamlist-card" className={styles.cardTitle}>
                    <Users strokeWidth={1.75} aria-hidden="true" />
                    Команда
                  </h3>
                  <Link href="/users" className={styles.cardLink}>
                    Керувати
                  </Link>
                </div>
                <ul className={styles.dividedList}>
                  {team.map((m) => (
                    <TeamRow key={m.id} member={m} />
                  ))}
                </ul>
              </article>
            </div>
          </Group>
        )}
      </div>

      {/* ───── Телефон ───── */}
      <div className={`${styles.groups} ${styles.mobileOnly}`}>
        <Group id="m-today" icon={Sun} title="Сьогодні">
          <ul className={styles.metricsMobile}>
            {metrics.map((m) => {
              const Icon = METRIC_ICONS[m.key];
              return (
                <li key={m.key} className={`${styles.card} ${styles.metricMobile}`}>
                  <span className={`${styles.metricIcon} ${toneClass(m.tone)}`} aria-hidden="true">
                    <Icon strokeWidth={1.75} />
                  </span>
                  <p className={styles.metricMobileValue}>{m.mobile.value}</p>
                  <p className={styles.metricMobileLabel}>
                    {m.mobile.label}
                    <span className={styles.metricMobileCaption}>{m.mobile.caption}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </Group>

        <Group id="m-attention" icon={Inbox} title="Потребує уваги">
          <div className={styles.stack}>
            {showLeads && (
              <div className={`${styles.card} ${styles.mobileCard}`}>
                <h3 className="visually-hidden">Нові заявки</h3>
                <ul className={styles.dividedList}>
                  {newLeads.map((lead) => (
                    <li key={lead.id} className={styles.lead}>
                      <div className={styles.leadHead}>
                        <strong>{lead.name}</strong>
                        <span className={styles.leadAgo}>{lead.ago}</span>
                      </div>
                      <p className={styles.leadText}>{lead.text}</p>
                      <Link href="/leads" className={`${styles.contactButton} ${styles.contactButtonMobile}`}>
                        <PhoneCall strokeWidth={1.75} aria-hidden="true" />
                        Зв’язатися · {lead.channel}
                        <span className="visually-hidden"> з {lead.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className={`${styles.card} ${styles.mobileCard}`}>
              <h3 className="visually-hidden">Закінчуються</h3>
              <LowStockList />
            </div>
          </div>
        </Group>

        <Group id="m-orders" icon={ClipboardList} title="Останні замовлення">
          <div className={`${styles.card} ${styles.mobileListCard}`}>
            <ul className={styles.dividedList}>
              {recentOrders.slice(0, recentOrdersMobileCount).map((o) => (
                <li key={o.id} className={styles.orderMobile}>
                  <div className={styles.orderMobileText}>
                    <span className={styles.orderMobileTitle}>
                      <strong>{o.number}</strong> · {o.client}
                    </span>
                    <span className={styles.orderMobileMeta}>
                      {o.date}
                      {showSales && (
                        <>
                          {" · "}
                          <strong>{o.total}</strong>
                        </>
                      )}
                    </span>
                  </div>
                  <StatusPill status={o.status} />
                </li>
              ))}
            </ul>
            <Link href="/orders" className={styles.mobileCardLink}>
              Усі замовлення
              <ArrowRight strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        </Group>

        {showSales && (
          <Group id="m-sales" icon={TrendingUp} title={`Продажі за ${salesMonth}`}>
            <div className={`${styles.card} ${styles.mobileCard}`}>
              <ul className={styles.salesListMobile}>
                {salesByCategory.map((c) => (
                  <li key={c.name} className={styles.salesRowMobile}>
                    <span className={styles.salesRowMobileHead}>
                      <span className={styles.salesName}>{c.name}</span>
                      <span className={styles.salesValue}>
                        <strong>{c.sum}</strong> · {c.percent}%
                      </span>
                    </span>
                    <Bar percent={c.percent} thin />
                  </li>
                ))}
              </ul>
            </div>
          </Group>
        )}

        {showTeam && (
          <Group id="m-activity" icon={History} title="Активність у CRM">
            <div className={`${styles.card} ${styles.mobileListCard}`}>
              <ActivityList limit={activityMobileCount} stacked />
              <Link href="/users" className={styles.mobileCardLink}>
                <Users strokeWidth={1.75} aria-hidden="true" />
                Користувачі й ролі
              </Link>
            </div>
          </Group>
        )}
      </div>
    </div>
  );
}

function LowStockList() {
  return (
    <ul className={styles.dividedList}>
      {lowStock.map((item) => (
        <li key={item.id} className={styles.lowItem}>
          <img src={item.image} alt="" width={44} height={44} className={styles.lowPhoto} loading="lazy" />
          <span className={styles.lowText}>
            <span className={styles.lowName}>{item.name}</span>
            <span className={styles.lowPot}>{item.pot}</span>
          </span>
          <span className={`${styles.qtyPill} ${toneClass("amber")}`}>{item.qty}&nbsp;шт.</span>
        </li>
      ))}
    </ul>
  );
}

function ActivityList({ limit, stacked }: { limit: number; stacked?: boolean }) {
  return (
    <ul className={styles.dividedList}>
      {activity.slice(0, limit).map((event) => {
        const Icon = ACTIVITY_ICONS[event.kind];
        const danger = event.kind === "failedLogin";
        return (
          <li key={event.id} className={`${styles.event} ${stacked ? styles.eventStacked : ""}`}>
            <span className={`${styles.eventIcon} ${danger ? styles.eventIconDanger : ""}`} aria-hidden="true">
              <Icon strokeWidth={1.75} />
            </span>
            <p className={styles.eventText}>
              <RichText value={event.text} />
            </p>
            <span className={styles.eventTime}>{event.time}</span>
          </li>
        );
      })}
    </ul>
  );
}

function TeamRow({ member }: { member: TeamMember }) {
  const { status } = member;
  const disabled = status === "disabled";
  return (
    <li className={`${styles.teamRow} ${disabled ? styles.teamRowDisabled : ""}`}>
      <span className={`${styles.teamInitial} ${styles[`teamInitial_${member.role}`]}`} aria-hidden="true">
        {member.initial}
      </span>
      <span className={styles.teamText}>
        <span className={styles.teamName}>{member.name}</span>
        <span className={styles.teamRole}>{ROLE_LABELS[member.role]}</span>
      </span>
      {status === "online" ? (
        <span className={styles.teamOnline}>
          <span className={styles.onlineDot} aria-hidden="true" />
          онлайн
        </span>
      ) : status === "disabled" ? (
        <span className={styles.teamDisabled}>вимкнено</span>
      ) : (
        <span className={styles.teamLastSeen}>
          <span className="visually-hidden">Останній вхід: </span>
          {status.lastSeen}
        </span>
      )}
    </li>
  );
}
