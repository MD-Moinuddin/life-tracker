import { AppShell } from "../components/layout/AppShell";
import { LoadBoundary } from "../components/LoadBoundary";
import { MiniJobLimit } from "../components/summary/MiniJobLimit";
import { MiniJobWarning } from "../components/summary/MiniJobWarning";
import { SummaryControls } from "../components/summary/SummaryControls";
import { SummaryCards } from "../components/summary/SummaryCards";
import { SummaryTable } from "../components/summary/SummaryTable";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { useSummary } from "../hooks/useSummary";

export function SummaryPage() {
  const summary = useSummary();
  const { state } = summary;

  return (
    <AppShell>
      <PageHeader title="Summary" />

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
            <EmptyState icon="calendar">No shifts in this period.</EmptyState>
          ) : (
            <div
              aria-busy={summary.isStale}
              className={summary.isStale ? "opacity-60" : undefined}
            >
              <MiniJobLimit summary={data} />
              <div className="hidden sm:block">
                <SummaryTable summary={data} />
              </div>
              <div className="sm:hidden">
                <SummaryCards summary={data} />
              </div>
            </div>
          )
        }
      </LoadBoundary>
    </AppShell>
  );
}
