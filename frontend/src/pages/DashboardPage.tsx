import { ModuleCard } from "../components/dashboard/ModuleCard";
import { AppShell } from "../components/layout/AppShell";

const MODULES = [
  { icon: "🗓️", title: "Work Schedule" },
  { icon: "💪", title: "Fitness" },
  { icon: "🥗", title: "Nutrition" },
  { icon: "💰", title: "Finance" },
];

export function DashboardPage() {
  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((module) => (
          <ModuleCard
            key={module.title}
            icon={module.icon}
            title={module.title}
          />
        ))}
      </div>
    </AppShell>
  );
}
