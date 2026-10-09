import type { ReactNode } from "react";
import { classNames } from "../../lib/class-names";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export type AlertTone = "warning" | "danger" | "info";

const BASE = "flex gap-3 rounded-control border p-3 text-sm";

const TONES: Record<AlertTone, { box: string; icon: IconName }> = {
  warning: {
    box: "border-warning-border bg-warning-soft text-warning-ink",
    icon: "warning",
  },
  danger: {
    box: "border-danger-border bg-danger-soft text-danger-ink",
    icon: "error",
  },
  info: {
    box: "border-accent-soft bg-accent-soft text-accent-ink",
    icon: "info",
  },
};

interface AlertProps {
  tone: AlertTone;
  title?: string;
  role?: "status" | "alert";
  children: ReactNode;
}

export function Alert({ tone, title, role, children }: AlertProps) {
  const { box, icon } = TONES[tone];

  return (
    <div role={role} className={classNames(BASE, box)}>
      <Icon name={icon} className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        {title && <strong className="font-semibold">{title}</strong>}
        {title && " "}
        {children}
      </div>
    </div>
  );
}
