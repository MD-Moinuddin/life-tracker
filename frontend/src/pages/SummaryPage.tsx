import { AppShell } from "../components/layout/AppShell";
import { LoadBoundary } from "../components/LoadBoundary";
import { MiniJobWarning } from "../components/summary/MiniJobWarning";
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
        periodLabel={summary.periodLabel}
        onRangeChange={summary.setRange}
        onPrevious={summary.previous}
        onNext={summary.next}
      />

      <MiniJobWarning
        miniJob={state.status === "ready" ? state.data.miniJob : undefined}
      />

      <LoadBoundary state={state} noun="your summary">
        {(data) =>
          data.jobs.length === 0 ? (
            <p className="text-slate-600">No shifts in this period.</p>
          ) : (
            <div
              aria-busy={summary.isStale}
              className={summary.isStale ? "opacity-60" : undefined}
            >
              <SummaryTable summary={data} />
            </div>
          )
        }
      </LoadBoundary>
    </AppShell>
  );
}
