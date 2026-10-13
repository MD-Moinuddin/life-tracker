import { formatEuro } from "../../lib/money";
import { formatDateRange, formatDuration } from "../../lib/shift-format";
import type { Summary } from "../../lib/summary-api";
import { JobTypeBadge } from "../jobs/JobTypeBadge";
import { Cell, HeaderCell, RowHeader, Table } from "../ui/Table";

interface SummaryTableProps {
  summary: Summary;
}

export function SummaryTable({ summary }: SummaryTableProps) {
  const { jobs, totals } = summary;

  return (
    <Table
      caption={`Hours and earnings per job, ${formatDateRange(summary.from, summary.to)}. Earned counts finished shifts, planned counts every shift in the period.`}
    >
      <thead>
        <tr>
          <HeaderCell>Job</HeaderCell>
          <HeaderCell align="right">Earned hours</HeaderCell>
          <HeaderCell align="right">Earned</HeaderCell>
          <HeaderCell align="right">Planned hours</HeaderCell>
          <HeaderCell align="right">Planned</HeaderCell>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.jobId}>
            <RowHeader>
              <span className="flex flex-wrap items-center gap-2">
                {job.name}
                <JobTypeBadge type={job.type} />
              </span>
            </RowHeader>
            <Cell align="right">{formatDuration(job.earnedMinutes)}</Cell>
            <Cell align="right">{formatEuro(job.earnedAmount)}</Cell>
            <Cell align="right">{formatDuration(job.plannedMinutes)}</Cell>
            <Cell align="right">{formatEuro(job.plannedAmount)}</Cell>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <RowHeader>Total</RowHeader>
          <Cell align="right">{formatDuration(totals.earnedMinutes)}</Cell>
          <Cell align="right">{formatEuro(totals.earnedAmount)}</Cell>
          <Cell align="right">{formatDuration(totals.plannedMinutes)}</Cell>
          <Cell align="right">{formatEuro(totals.plannedAmount)}</Cell>
        </tr>
      </tfoot>
    </Table>
  );
}
