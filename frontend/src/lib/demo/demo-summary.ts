import { weekBounds } from "../dates";
import type { Leave } from "../leave-api";
import { isLeaveDayTaken, leaveDaysIn } from "../leave-days";
import { shiftEarningsCents } from "../shift-earnings";
import type { Shift } from "../shifts-api";
import type { Summary } from "../summary-api";
import type { SummaryRange } from "../summary-period";

// Keep in step with the backend's summary service
// (backend/src/modules/summary/summary.service.ts).
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

const toAmount = (cents: number) => (cents / 100).toFixed(2);

interface JobRow {
  jobId: string;
  name: string;
  type: Shift["job"]["type"];
  hourlyRate: string;
  earnedMinutes: number;
  plannedMinutes: number;
  leaveEarnedMinutes: number;
  leavePlannedMinutes: number;
}

// Hours and earnings per job for a week or a month, from the shifts that start
// in it and the paid leave days in it. "Earned" counts shifts that have ended
// by `now` and leave days before its date; "planned" counts all. Worked and
// leave figures are kept apart, and a job with only leave still gets a row.
// `leave` is the leave of jobs that track paid vacation.
export function buildDemoSummary(params: {
  shifts: Shift[];
  leave?: Leave[];
  range: SummaryRange;
  date: string;
  now: string;
}): Summary {
  const { range, date, now, leave = [] } = params;
  const { from, to } = periodBounds(range, date);
  const inPeriod = params.shifts.filter(
    (shift) => shift.date >= from && shift.date <= to,
  );

  const byJob = new Map<string, JobRow>();
  function rowFor(job: Shift["job"]): JobRow {
    let row = byJob.get(job.id);
    if (!row) {
      row = {
        jobId: job.id,
        name: job.name,
        type: job.type,
        hourlyRate: job.hourlyRate,
        earnedMinutes: 0,
        plannedMinutes: 0,
        leaveEarnedMinutes: 0,
        leavePlannedMinutes: 0,
      };
      byJob.set(job.id, row);
    }
    return row;
  }

  for (const shift of inPeriod) {
    const row = rowFor(shift.job);
    row.plannedMinutes += shift.workedMinutes;
    if (`${shift.endDate}T${shift.endTime}` <= now) {
      row.earnedMinutes += shift.workedMinutes;
    }
  }

  const today = now.slice(0, 10);
  for (const entry of leave) {
    const days = leaveDaysIn(entry, from, to);
    if (days.length === 0) {
      continue;
    }
    const row = rowFor(entry.job);
    row.leavePlannedMinutes += days.length * entry.minutesPerDay;
    row.leaveEarnedMinutes +=
      days.filter((day) => isLeaveDayTaken(day, today)).length *
      entry.minutesPerDay;
  }

  const rows = [...byJob.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => {
      // The app's one money rule: rate x minutes / 60, half up to the cent.
      const cents = (workedMinutes: number) =>
        shiftEarningsCents({ job: row, workedMinutes });
      return {
        ...row,
        earnedCents: cents(row.earnedMinutes),
        plannedCents: cents(row.plannedMinutes),
        leaveEarnedCents: cents(row.leaveEarnedMinutes),
        leavePlannedCents: cents(row.leavePlannedMinutes),
      };
    });
  type Row = (typeof rows)[number];
  const sum = (pick: (row: Row) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);
  // Planned paid leave of mini-jobs counts towards the monthly limit.
  const miniJobPlannedCents = sum((row) =>
    row.type === "mini_job" ? row.plannedCents + row.leavePlannedCents : 0,
  );
  const leaveOf = (figures: {
    earnedMinutes: number;
    plannedMinutes: number;
    earnedCents: number;
    plannedCents: number;
  }) => ({
    earnedMinutes: figures.earnedMinutes,
    plannedMinutes: figures.plannedMinutes,
    earnedAmount: toAmount(figures.earnedCents),
    plannedAmount: toAmount(figures.plannedCents),
  });
  const rowLeave = (row: Row) =>
    leaveOf({
      earnedMinutes: row.leaveEarnedMinutes,
      plannedMinutes: row.leavePlannedMinutes,
      earnedCents: row.leaveEarnedCents,
      plannedCents: row.leavePlannedCents,
    });

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
      leave: rowLeave(row),
    })),
    totals: {
      earnedMinutes: sum((row) => row.earnedMinutes),
      plannedMinutes: sum((row) => row.plannedMinutes),
      earnedAmount: toAmount(sum((row) => row.earnedCents)),
      plannedAmount: toAmount(sum((row) => row.plannedCents)),
      leave: leaveOf({
        earnedMinutes: sum((row) => row.leaveEarnedMinutes),
        plannedMinutes: sum((row) => row.leavePlannedMinutes),
        earnedCents: sum((row) => row.leaveEarnedCents),
        plannedCents: sum((row) => row.leavePlannedCents),
      }),
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
