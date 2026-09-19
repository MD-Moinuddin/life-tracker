import { useAuthStore } from "../store/auth-store";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return <p>Logged in as {user?.email}</p>;
}
