import { Prisma } from "../../generated/prisma/client";
import { countedDays, daysInRange } from "../../lib/leave-days";
import { periodBounds } from "../../lib/period";
import { listLeaveInRange } from "../leave/leave.service";
import type { LeaveResponse } from "../leave/leave.service";
import { listShiftsInRange } from "../shifts/shift.service";
import type { SummaryQuery } from "./summary.schema";

const MINI_JOB_WARNING_THRESHOLD = new Prisma.Decimal(540);

type ShiftResponse = Awaited<ReturnType<typeof listShiftsInRange>>[number];
type JobResponse = ShiftResponse["job"];

interface JobTotals {
  jobId: string;
  name: string;
  type: string;
  hourlyRate: Prisma.Decimal;
  earnedMinutes: number;
  plannedMinutes: number;
  leaveEarnedMinutes: number;
  leavePlannedMinutes: number;
}

interface Period {
  from: string;
  to: string;
  now: string;
}

// Worked minutes come from shifts and leave minutes from paid leave; the two
// are kept apart so the existing fields keep meaning "worked".
function groupByJob(
  shifts: ShiftResponse[],
  leave: LeaveResponse[],
  { from, to, now }: Period,
): JobTotals[] {
  const byJob = new Map<string, JobTotals>();

  function rowFor(job: JobResponse) {
    let totals = byJob.get(job.id);
    if (!totals) {
      totals = {
        jobId: job.id,
        name: job.name,
        type: job.type,
        hourlyRate: new Prisma.Decimal(job.hourlyRate),
        earnedMinutes: 0,
        plannedMinutes: 0,
        leaveEarnedMinutes: 0,
        leavePlannedMinutes: 0,
      };
      byJob.set(job.id, totals);
    }
    return totals;
  }

  for (const shift of shifts) {
    const totals = rowFor(shift.job);
    totals.plannedMinutes += shift.workedMinutes;
    if (`${shift.endDate}T${shift.endTime}` <= now) {
      totals.earnedMinutes += shift.workedMinutes;
    }
  }

  // A leave day is taken before today and planned from today on.
  const today = now.slice(0, 10);
  for (const entry of leave) {
    const days = daysInRange(
      countedDays(entry.startDate, entry.endDate, entry.weekdays),
      from,
      to,
    );
    if (days.length === 0) {
      continue;
    }
    const totals = rowFor(entry.job);
    totals.leavePlannedMinutes += days.length * entry.minutesPerDay;
    totals.leaveEarnedMinutes +=
      days.filter((day) => day < today).length * entry.minutesPerDay;
  }

  return [...byJob.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function toAmount(hourlyRate: Prisma.Decimal, minutes: number) {
  return hourlyRate.mul(minutes).div(60).toDecimalPlaces(2);
}

function sum(amounts: Prisma.Decimal[]) {
  return amounts.reduce(
    (total, amount) => total.plus(amount),
    new Prisma.Decimal(0),
  );
}

function sumMinutes(minutes: number[]) {
  return minutes.reduce((total, value) => total + value, 0);
}

export async function getSummary(
  userId: string,
  { range, date, now }: SummaryQuery,
) {
  const { from, to } = periodBounds(range, date);
  const [shifts, leave] = await Promise.all([
    listShiftsInRange(userId, { from, to }),
    listLeaveInRange(userId, { from, to }),
  ]);

  const rows = groupByJob(shifts, leave, { from, to, now }).map((job) => ({
    ...job,
    earnedAmount: toAmount(job.hourlyRate, job.earnedMinutes),
    plannedAmount: toAmount(job.hourlyRate, job.plannedMinutes),
    leaveEarnedAmount: toAmount(job.hourlyRate, job.leaveEarnedMinutes),
    leavePlannedAmount: toAmount(job.hourlyRate, job.leavePlannedMinutes),
  }));

  // Planned paid leave of mini-jobs counts towards the monthly limit.
  const miniJobPlanned = sum(
    rows
      .filter((row) => row.type === "mini_job")
      .map((row) => row.plannedAmount.plus(row.leavePlannedAmount)),
  );

  return {
    from,
    to,
    jobs: rows.map((row) => ({
      jobId: row.jobId,
      name: row.name,
      type: row.type,
      hourlyRate: row.hourlyRate.toFixed(2),
      earnedMinutes: row.earnedMinutes,
      plannedMinutes: row.plannedMinutes,
      earnedAmount: row.earnedAmount.toFixed(2),
      plannedAmount: row.plannedAmount.toFixed(2),
      leave: {
        earnedMinutes: row.leaveEarnedMinutes,
        plannedMinutes: row.leavePlannedMinutes,
        earnedAmount: row.leaveEarnedAmount.toFixed(2),
        plannedAmount: row.leavePlannedAmount.toFixed(2),
      },
    })),
    totals: {
      earnedMinutes: sumMinutes(rows.map((row) => row.earnedMinutes)),
      plannedMinutes: sumMinutes(rows.map((row) => row.plannedMinutes)),
      earnedAmount: sum(rows.map((row) => row.earnedAmount)).toFixed(2),
      plannedAmount: sum(rows.map((row) => row.plannedAmount)).toFixed(2),
      leave: {
        earnedMinutes: sumMinutes(rows.map((row) => row.leaveEarnedMinutes)),
        plannedMinutes: sumMinutes(rows.map((row) => row.leavePlannedMinutes)),
        earnedAmount: sum(rows.map((row) => row.leaveEarnedAmount)).toFixed(2),
        plannedAmount: sum(rows.map((row) => row.leavePlannedAmount)).toFixed(
          2,
        ),
      },
    },
    miniJob:
      range === "month"
        ? {
            plannedAmount: miniJobPlanned.toFixed(2),
            threshold: MINI_JOB_WARNING_THRESHOLD.toFixed(2),
            warning: miniJobPlanned.greaterThan(MINI_JOB_WARNING_THRESHOLD),
          }
        : undefined,
  };
}
