import { formatEuro } from "../../lib/money";
import type { MiniJobSummary } from "../../lib/summary-api";

interface MiniJobWarningProps {
  miniJob?: MiniJobSummary;
}

// The status region stays in the page even when there is no warning, so screen
// readers announce the message when it appears.
export function MiniJobWarning({ miniJob }: MiniJobWarningProps) {
  return (
    <div role="status">
      {miniJob?.warning && (
        <div className="mb-4 flex gap-3 rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="mt-0.5 h-5 w-5 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <p>
            <strong className="font-semibold">Mini-job warning.</strong>{" "}
            {`Planned mini-job earnings this month are ${formatEuro(miniJob.plannedAmount)}, over the ${formatEuro(miniJob.threshold)} threshold. You can keep logging shifts.`}
          </p>
        </div>
      )}
    </div>
  );
}
