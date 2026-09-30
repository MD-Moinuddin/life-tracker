import { AddJobButton } from "./AddJobButton";

interface JobsEmptyStateProps {
  onAdd: () => void;
}

export function JobsEmptyState({ onAdd }: JobsEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h2 className="text-lg font-medium text-slate-900">No jobs yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Jobs are the places you work, such as a part-time job or a mini-job. Add
        each one with its hourly rate. Then you can log your shifts and see your
        hours and earnings.
      </p>
      <div className="mt-6 flex justify-center">
        <AddJobButton onClick={onAdd} />
      </div>
    </div>
  );
}
