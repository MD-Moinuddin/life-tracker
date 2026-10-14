import { AddButton } from "../AddButton";
import { EmptyState } from "../ui/EmptyState";

interface JobsEmptyStateProps {
  onAdd: () => void;
}

export function JobsEmptyState({ onAdd }: JobsEmptyStateProps) {
  return (
    <EmptyState
      title="No jobs yet"
      action={<AddButton label="Add job" onClick={onAdd} />}
    >
      Jobs are the places you work, such as a part-time job or a mini-job. Add
      each one with its hourly rate, then log your shifts and see your hours and
      earnings.
    </EmptyState>
  );
}
