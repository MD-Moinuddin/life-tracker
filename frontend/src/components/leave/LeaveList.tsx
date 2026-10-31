import { useId } from "react";
import type { Leave } from "../../lib/leave-api";
import { isLeavePlanned } from "../../lib/leave-days";
import { cardClassName } from "../ui/Card";
import { LeaveRow } from "./LeaveRow";

interface LeaveListProps {
  leave: Leave[];
  today: string;
  onEdit: (leave: Leave) => void;
  onDelete: (leave: Leave) => void;
}

interface GroupProps extends Omit<LeaveListProps, "leave"> {
  title: string;
  entries: Leave[];
}

function Group({ title, entries, today, onEdit, onDelete }: GroupProps) {
  const headingId = useId();
  if (entries.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <h4
        id={headingId}
        className="text-sm font-semibold tracking-wide text-ink-muted uppercase"
      >
        {title}
      </h4>
      <ul
        className={cardClassName(
          "plain",
          "divide-y divide-border overflow-hidden",
        )}
      >
        {entries.map((entry) => (
          <LeaveRow
            key={entry.id}
            leave={entry}
            variant="period"
            today={today}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </section>
  );
}

// Booked leave, Planned (not yet over) before Taken, each by start date.
export function LeaveList({ leave, today, onEdit, onDelete }: LeaveListProps) {
  const sorted = [...leave].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  const planned = sorted.filter((entry) => isLeavePlanned(entry, today));
  const taken = sorted.filter((entry) => !isLeavePlanned(entry, today));
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
        Booked leave
      </h3>
      <Group
        title="Planned"
        entries={planned}
        today={today}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <Group
        title="Taken"
        entries={taken}
        today={today}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
