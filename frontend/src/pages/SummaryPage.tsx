import { AppShell } from "../components/layout/AppShell";
import { SummaryControls } from "../components/summary/SummaryControls";
import { SummaryTable } from "../components/summary/SummaryTable";
import { useSummary } from "../hooks/useSummary";

export function SummaryPage() {
  const summary = useSummary();
  const { state } = summary;

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Summary</h1>

      <SummaryControls
        range={summary.range}
        label={summary.label}
        onRangeChange={summary.setRange}
        onPrevious={summary.previous}
        onNext={summary.next}
      />

      {state.status === "loading" && (
        <p className="text-slate-600">Loading summary…</p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-red-600">
          Could not load your summary. Refresh the page to try again.
        </p>
      )}
      {state.status === "ready" &&
        (state.data.jobs.length === 0 ? (
          <p className="text-slate-600">No shifts in this period.</p>
        ) : (
          <SummaryTable summary={state.data} periodLabel={summary.label} />
        ))}
    </AppShell>
  );
}
