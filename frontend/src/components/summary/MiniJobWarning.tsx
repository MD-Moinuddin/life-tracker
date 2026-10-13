import { formatEuro } from "../../lib/money";
import type { MiniJobSummary } from "../../lib/summary-api";
import { Alert } from "../ui/Alert";

interface MiniJobWarningProps {
  miniJob?: MiniJobSummary;
}

// The status region stays in the page even when there is no warning, so screen
// readers announce the message when it appears. It only takes up space while
// a warning is shown.
export function MiniJobWarning({ miniJob }: MiniJobWarningProps) {
  const warning = miniJob?.warning === true;

  return (
    <div role="status" className={warning ? "mb-4" : undefined}>
      {miniJob && warning && (
        <Alert tone="warning" title="Mini-job warning.">
          {`Planned mini-job earnings this month are ${formatEuro(miniJob.plannedAmount)}, over the ${formatEuro(miniJob.threshold)} threshold. You can keep logging shifts.`}
        </Alert>
      )}
    </div>
  );
}
