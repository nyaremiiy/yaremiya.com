import { redirect } from "next/navigation";

// Поки авторизації немає — одразу на дашборд.
// Потім: залогінений → /dashboard, інакше → /login.
export default function Home() {
  redirect("/dashboard");
}
