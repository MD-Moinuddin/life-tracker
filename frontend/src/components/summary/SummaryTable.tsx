import { formatEuro } from "../../lib/money";
import { formatDuration } from "../../lib/shift-format";
import type { Summary } from "../../lib/summary-api";

interface SummaryTableProps {
  summary: Summary;
  periodLabel: string;
}

const HEADER_CELL = "px-3 py-2 text-right font-medium";
const NUMBER_CELL = "px-3 py-2 text-right tabular-nums";

export function SummaryTable({ summary, periodLabel }: SummaryTableProps) {
  const { jobs, totals } = summary;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm text-slate-900">
        <caption className="px-3 py-2 text-left text-slate-700">
          {`Hours and earnings per job, ${periodLabel}. Earned counts finished shifts, planned counts every shift in the period.`}
        </caption>
        <thead className="border-y border-slate-200 bg-slate-50 text-slate-700">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Job
            </th>
            <th scope="col" className={HEADER_CELL}>
              Earned hours
            </th>
            <th scope="col" className={HEADER_CELL}>
              Earned
            </th>
            <th scope="col" className={HEADER_CELL}>
              Planned hours
            </th>
            <th scope="col" className={HEADER_CELL}>
              Planned
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {jobs.map((job) => (
            <tr key={job.jobId}>
              <th scope="row" className="px-3 py-2 text-left font-medium">
                {job.name}
              </th>
              <td className={NUMBER_CELL}>
                {formatDuration(job.earnedMinutes)}
              </td>
              <td className={NUMBER_CELL}>{formatEuro(job.earnedAmount)}</td>
              <td className={NUMBER_CELL}>
                {formatDuration(job.plannedMinutes)}
              </td>
              <td className={NUMBER_CELL}>{formatEuro(job.plannedAmount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-slate-300 bg-slate-50 font-semibold">
          <tr>
            <th scope="row" className="px-3 py-2 text-left">
              Total
            </th>
            <td className={NUMBER_CELL}>
              {formatDuration(totals.earnedMinutes)}
            </td>
            <td className={NUMBER_CELL}>{formatEuro(totals.earnedAmount)}</td>
            <td className={NUMBER_CELL}>
              {formatDuration(totals.plannedMinutes)}
            </td>
            <td className={NUMBER_CELL}>{formatEuro(totals.plannedAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
