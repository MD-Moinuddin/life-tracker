import { jobColor } from "../../lib/job-color";
import { formatEuro } from "../../lib/money";
import { formatDateRange, formatDuration } from "../../lib/shift-format";
import type { Summary } from "../../lib/summary-api";
import {
  earnedWithLeave,
  hasLeave,
  plannedWithLeave,
} from "../../lib/summary-totals";
import { JobTypeBadge } from "../jobs/JobTypeBadge";
import { Cell, HeaderCell, RowHeader, Table } from "../ui/Table";
import { SUMMARY_EXPLANATION } from "./summary-copy";

interface SummaryTableProps {
  summary: Summary;
}

export function SummaryTable({ summary }: SummaryTableProps) {
  const { jobs, totals } = summary;
  const withLeave = hasLeave(summary);

  return (
    <Table
      caption={`Hours and earnings per job, ${formatDateRange(summary.from, summary.to)}. ${SUMMARY_EXPLANATION}`}
    >
      <thead>
        <tr>
          <HeaderCell>Job</HeaderCell>
          <HeaderCell align="right">Earned hours</HeaderCell>
          <HeaderCell align="right">Earned</HeaderCell>
          {withLeave && (
            <>
              <HeaderCell align="right">Paid leave taken (hours)</HeaderCell>
              <HeaderCell align="right">Paid leave taken</HeaderCell>
            </>
          )}
          <HeaderCell align="right">Planned hours</HeaderCell>
          <HeaderCell align="right">Planned</HeaderCell>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.jobId}>
            <RowHeader>
              <span className="flex flex-wrap items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 rounded-sm ${jobColor(job.jobId).dot}`}
                />
                {job.name}
                <JobTypeBadge type={job.type} />
              </span>
            </RowHeader>
            <Cell align="right">
              {formatDuration(job.earnedMinutes + job.leave.earnedMinutes)}
            </Cell>
            <Cell align="right">{formatEuro(earnedWithLeave(job))}</Cell>
            {withLeave && (
              <>
                <Cell align="right">
                  {formatDuration(job.leave.earnedMinutes)}
                </Cell>
                <Cell align="right">{formatEuro(job.leave.earnedAmount)}</Cell>
              </>
            )}
            <Cell align="right">
              {formatDuration(job.plannedMinutes + job.leave.plannedMinutes)}
            </Cell>
            <Cell align="right">{formatEuro(plannedWithLeave(job))}</Cell>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <RowHeader>Total</RowHeader>
          <Cell align="right">
            {formatDuration(totals.earnedMinutes + totals.leave.earnedMinutes)}
          </Cell>
          <Cell align="right">{formatEuro(earnedWithLeave(totals))}</Cell>
          {withLeave && (
            <>
              <Cell align="right">
                {formatDuration(totals.leave.earnedMinutes)}
              </Cell>
              <Cell align="right">{formatEuro(totals.leave.earnedAmount)}</Cell>
            </>
          )}
          <Cell align="right">
            {formatDuration(
              totals.plannedMinutes + totals.leave.plannedMinutes,
            )}
          </Cell>
          <Cell align="right">{formatEuro(plannedWithLeave(totals))}</Cell>
        </tr>
      </tfoot>
    </Table>
  );
}
