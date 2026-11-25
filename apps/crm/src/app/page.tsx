import { redirect } from "next/navigation";

// Поки головна CRM — це сторінка входу.
export default function Home() {
  redirect("/login");
}
