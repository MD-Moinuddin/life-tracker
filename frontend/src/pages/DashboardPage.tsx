import { ModuleCard } from "../components/dashboard/ModuleCard";
import { WeekGlanceCard } from "../components/dashboard/WeekGlanceCard";
import { AppShell } from "../components/layout/AppShell";
import type { IconName } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { useSummary } from "../hooks/useSummary";
import { greeting } from "../lib/greeting";
import { ROUTES } from "../lib/routes";
import { useAuthStore } from "../store/auth-store";

const MODULES: { icon: IconName; title: string; to?: string }[] = [
  { icon: "calendar", title: "Work Schedule", to: ROUTES.shifts },
  { icon: "activity", title: "Fitness" },
  { icon: "leaf", title: "Nutrition" },
  { icon: "wallet", title: "Finance" },
];

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { state, now } = useSummary();

  return (
    <AppShell>
      <PageHeader title={greeting(now, user?.name)} />
      <WeekGlanceCard state={state} />
      <h2 className="mt-8 mb-4 text-section font-semibold text-ink">Modules</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((module) => (
          <ModuleCard
            key={module.title}
            icon={module.icon}
            title={module.title}
            to={module.to}
          />
        ))}
      </div>
    </AppShell>
  );
}
