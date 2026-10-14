import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface EmptyStateProps {
  icon?: IconName;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function EmptyState({ icon, title, action, children }: EmptyStateProps) {
  return (
    <div className="rounded-card border border-dashed border-border-strong bg-surface p-8 text-center">
      {icon && (
        <div className="mb-3 flex justify-center text-ink-muted">
          <Icon name={icon} className="h-8 w-8" />
        </div>
      )}
      {title && (
        <p className="mb-1 text-section font-semibold text-ink">{title}</p>
      )}
      <p className="text-sm text-ink-muted">{children}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
