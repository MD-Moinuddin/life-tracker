import { weekBounds } from "../dates";
import type { Shift } from "../shifts-api";
import type { Summary } from "../summary-api";
import type { SummaryRange } from "../summary-period";

// Keep in step with the backend's summary service.
const MINI_JOB_WARNING_THRESHOLD_CENTS = 54_000;

function periodBounds(range: SummaryRange, date: string) {
  if (range === "week") {
    return weekBounds(date);
  }
  const yearMonth = date.slice(0, 7);
  const [year = 0, month = 0] = yearMonth.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${yearMonth}-01`, to: `${yearMonth}-${lastDay}` };
}

// rate x minutes / 60, rounded half up to the cent: the backend's rule.
function amountCents(hourlyRate: string, minutes: number): number {
  const rateCents = Math.round(Number(hourlyRate) * 100);
  return Math.round((rateCents * minutes) / 60);
}

const toAmount = (cents: number) => (cents / 100).toFixed(2);

interface JobRow {
  jobId: string;
  name: string;
  type: Shift["job"]["type"];
  hourlyRate: string;
  earnedMinutes: number;
  plannedMinutes: number;
}

// Hours and earnings per job for a week or a month, from the shifts that start
// in it. "Earned" counts shifts that have ended by `now`; "planned" counts all.
export function buildDemoSummary(params: {
  shifts: Shift[];
  range: SummaryRange;
  date: string;
  now: string;
}): Summary {
  const { range, date, now } = params;
  const { from, to } = periodBounds(range, date);
  const inPeriod = params.shifts.filter(
    (shift) => shift.date >= from && shift.date <= to,
  );

  const byJob = new Map<string, JobRow>();
  for (const shift of inPeriod) {
    const row = byJob.get(shift.jobId) ?? {
      jobId: shift.jobId,
      name: shift.job.name,
      type: shift.job.type,
      hourlyRate: shift.job.hourlyRate,
      earnedMinutes: 0,
      plannedMinutes: 0,
    };
    row.plannedMinutes += shift.workedMinutes;
    if (`${shift.endDate}T${shift.endTime}` <= now) {
      row.earnedMinutes += shift.workedMinutes;
    }
    byJob.set(shift.jobId, row);
  }

  const rows = [...byJob.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => ({
      ...row,
      earnedCents: amountCents(row.hourlyRate, row.earnedMinutes),
      plannedCents: amountCents(row.hourlyRate, row.plannedMinutes),
    }));
  const sum = (pick: (row: (typeof rows)[number]) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);
  const miniJobPlannedCents = sum((row) =>
    row.type === "mini_job" ? row.plannedCents : 0,
  );

  return {
    from,
    to,
    jobs: rows.map((row) => ({
      jobId: row.jobId,
      name: row.name,
      type: row.type,
      hourlyRate: Number(row.hourlyRate).toFixed(2),
      earnedMinutes: row.earnedMinutes,
      plannedMinutes: row.plannedMinutes,
      earnedAmount: toAmount(row.earnedCents),
      plannedAmount: toAmount(row.plannedCents),
    })),
    totals: {
      earnedMinutes: sum((row) => row.earnedMinutes),
      plannedMinutes: sum((row) => row.plannedMinutes),
      earnedAmount: toAmount(sum((row) => row.earnedCents)),
      plannedAmount: toAmount(sum((row) => row.plannedCents)),
    },
    miniJob:
      range === "month"
        ? {
            plannedAmount: toAmount(miniJobPlannedCents),
            threshold: toAmount(MINI_JOB_WARNING_THRESHOLD_CENTS),
            warning: miniJobPlannedCents > MINI_JOB_WARNING_THRESHOLD_CENTS,
          }
        : undefined,
  };
}
