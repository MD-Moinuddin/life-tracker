import { Prisma } from "../../generated/prisma/client";
import { periodBounds } from "../../lib/period";
import { listShiftsInRange } from "../shifts/shift.service";
import type { SummaryQuery } from "./summary.schema";

const MINI_JOB_WARNING_THRESHOLD = new Prisma.Decimal(540);

type ShiftResponse = Awaited<ReturnType<typeof listShiftsInRange>>[number];

interface JobTotals {
  jobId: string;
  name: string;
  type: string;
  hourlyRate: Prisma.Decimal;
  earnedMinutes: number;
  plannedMinutes: number;
}

function groupByJob(shifts: ShiftResponse[], now: string): JobTotals[] {
  const byJob = new Map<string, JobTotals>();

  for (const shift of shifts) {
    const totals = byJob.get(shift.jobId) ?? {
      jobId: shift.jobId,
      name: shift.job.name,
      type: shift.job.type,
      hourlyRate: new Prisma.Decimal(shift.job.hourlyRate),
      earnedMinutes: 0,
      plannedMinutes: 0,
    };

    totals.plannedMinutes += shift.workedMinutes;
    if (`${shift.endDate}T${shift.endTime}` <= now) {
      totals.earnedMinutes += shift.workedMinutes;
    }
    byJob.set(shift.jobId, totals);
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

export async function getSummary(
  userId: string,
  { range, date, now }: SummaryQuery,
) {
  const { from, to } = periodBounds(range, date);
  const shifts = await listShiftsInRange(userId, { from, to });

  const rows = groupByJob(shifts, now).map((job) => ({
    ...job,
    earnedAmount: toAmount(job.hourlyRate, job.earnedMinutes),
    plannedAmount: toAmount(job.hourlyRate, job.plannedMinutes),
  }));

  const miniJobPlanned = sum(
    rows
      .filter((row) => row.type === "mini_job")
      .map((row) => row.plannedAmount),
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
    })),
    totals: {
      earnedMinutes: rows.reduce((total, row) => total + row.earnedMinutes, 0),
      plannedMinutes: rows.reduce(
        (total, row) => total + row.plannedMinutes,
        0,
      ),
      earnedAmount: sum(rows.map((row) => row.earnedAmount)).toFixed(2),
      plannedAmount: sum(rows.map((row) => row.plannedAmount)).toFixed(2),
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
