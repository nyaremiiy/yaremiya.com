import { ROLE_LABELS, type Role } from "@/lib/permissions";
import styles from "./shell.module.css";

export default function RolePill({ role }: { role: Role }) {
  return <span className={`${styles.rolePill} ${styles[`role_${role}`]}`}>{ROLE_LABELS[role]}</span>;
}
