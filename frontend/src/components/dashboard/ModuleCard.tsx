import { Link } from "react-router-dom";
import { classNames } from "../../lib/class-names";
import { Badge } from "../ui/Badge";
import { Card, CARD_PADDING, cardClassName } from "../ui/Card";
import { Icon } from "../ui/Icon";
import type { IconName } from "../ui/Icon";

interface ModuleCardProps {
  icon: IconName;
  title: string;
  to?: string;
}

const LAYOUT = "flex flex-col items-start gap-3";

export function ModuleCard({ icon, title, to }: ModuleCardProps) {
  if (to) {
    return (
      <Link
        to={to}
        className={cardClassName(
          "interactive",
          classNames(CARD_PADDING, LAYOUT),
        )}
      >
        <span className="rounded-control bg-accent-soft p-2 text-accent-ink">
          <Icon name={icon} />
        </span>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
      </Link>
    );
  }

  return (
    <Card padded className={LAYOUT}>
      <span className="rounded-control bg-neutral-soft p-2 text-ink-muted">
        <Icon name={icon} />
      </span>
      <h3 className="text-base font-semibold text-ink-muted">{title}</h3>
      <Badge>Coming later</Badge>
    </Card>
  );
}
