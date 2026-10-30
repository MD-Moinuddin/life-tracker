import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  // Sits beside the title, outside the heading, e.g. an info button.
  titleAddon?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({
  title,
  titleAddon,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="relative flex items-center gap-2">
          <h1 className="text-title font-bold tracking-tight text-ink">
            {title}
          </h1>
          {titleAddon}
        </div>
        {subtitle && (
          <div className="mt-1 text-sm text-ink-muted">{subtitle}</div>
        )}
      </div>
      {action}
    </header>
  );
}
