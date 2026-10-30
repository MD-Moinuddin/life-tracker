import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { LoadBoundary } from "../components/LoadBoundary";
import { EarningsShare } from "../components/summary/EarningsShare";
import { MiniJobLimit } from "../components/summary/MiniJobLimit";
import { MiniJobWarning } from "../components/summary/MiniJobWarning";
import { SummaryCards } from "../components/summary/SummaryCards";
import { SummaryControls } from "../components/summary/SummaryControls";
import { SummaryHero } from "../components/summary/SummaryHero";
import { SummaryJobCards } from "../components/summary/SummaryJobCards";
import { SummaryTable } from "../components/summary/SummaryTable";
import { SUMMARY_EXPLANATION } from "../components/summary/summary-copy";
import type { SummaryLayout } from "../components/summary/summary-layout";
import { buttonClassName } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { EYEBROW_CLASSES } from "../components/ui/eyebrow";
import { InfoPopover } from "../components/ui/InfoPopover";
import { PageHeader } from "../components/ui/PageHeader";
import { useSummary } from "../hooks/useSummary";
import { ROUTES } from "../lib/routes";

export function SummaryPage() {
  const summary = useSummary();
  const [layout, setLayout] = useState<SummaryLayout>("cards");
  const { state } = summary;

  return (
    <AppShell>
      <PageHeader
        title="Summary"
        titleAddon={
          <InfoPopover label="How these numbers work" className="max-sm:hidden">
            {SUMMARY_EXPLANATION}
          </InfoPopover>
        }
      />

      <SummaryControls
        range={summary.range}
        periodLabel={summary.periodLabel}
        layout={layout}
        isCurrentPeriod={summary.isCurrentPeriod}
        onRangeChange={summary.setRange}
        onLayoutChange={setLayout}
        onPrevious={summary.previous}
        onNext={summary.next}
        onCurrent={summary.goToCurrent}
      />

      <MiniJobWarning
        miniJob={state.status === "ready" ? state.data.miniJob : undefined}
      />

      <LoadBoundary state={state} noun="your summary">
        {(data) =>
          data.jobs.length === 0 ? (
            <EmptyState
              icon="calendar"
              title={`No shifts this ${summary.range}`}
              action={
                <Link to={ROUTES.shifts} className={buttonClassName("primary")}>
                  Go to shifts
                </Link>
              }
            >
              Add a shift and its hours and earnings will show up here.
            </EmptyState>
          ) : (
            <div
              aria-busy={summary.isStale}
              className={summary.isStale ? "opacity-60" : undefined}
            >
              <div className="max-sm:hidden">
                <SummaryHero totals={data.totals} />
              </div>
              <MiniJobLimit summary={data} />
              <div className="max-sm:hidden">
                <EarningsShare jobs={data.jobs} />
                <h2 className={`mt-6 mb-3 ${EYEBROW_CLASSES}`}>By job</h2>
                {layout === "cards" ? (
                  <SummaryJobCards summary={data} />
                ) : (
                  <SummaryTable summary={data} />
                )}
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
