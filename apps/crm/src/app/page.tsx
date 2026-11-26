import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

// Увійшли → дашборд, інакше → сторінка входу.
export default async function Home() {
  redirect((await getCurrentUser()) ? "/dashboard" : "/login");
}
