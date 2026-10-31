import { z } from "zod";
import { calendarDate } from "../../lib/date-schemas";
import { countedDays } from "../../lib/leave-days";

const weekdayMessage = "Pick at least one day of the week";

function areWeekdays(days: number[]): boolean {
  return days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}
const weekdays = z
  .array(z.number(), weekdayMessage)
  .min(1, weekdayMessage)
  // Checked on the whole list, not per element, so the message stays on the
  // `weekdays` field instead of `weekdays.0`.
  .refine(
    (days) =>
      days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    weekdayMessage,
  )
  .refine(
    (days) => new Set(days).size === days.length,
    "Each day can only be picked once",
  );

const minutesMessage = "Hours per day must be between 15 minutes and 12 hours";
const minutesPerDay = z
  .number(minutesMessage)
  .int(minutesMessage)
  .min(15, minutesMessage)
  .max(720, minutesMessage);

const leaveFields = z.object({
  jobId: z.string().min(1, "Job is required"),
  startDate: calendarDate,
  endDate: calendarDate,
  weekdays,
  minutesPerDay,
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be at most 500 characters")
    .transform((notes) => (notes === "" ? null : notes))
    .nullable()
    .optional(),
  removeOverlappingShifts: z.boolean().optional(),
});

export function validateLeaveDates(leave: {
  startDate: string;
  endDate: string;
  weekdays: readonly number[];
}) {
  if (leave.endDate < leave.startDate) {
    return {
      field: "endDate",
      message: "End date must not be before the start date",
    };
  }
  if (leave.startDate.slice(0, 4) !== leave.endDate.slice(0, 4)) {
    return {
      field: "endDate",
      message:
        "Paid leave cannot span two calendar years. Add one entry for each year.",
    };
  }
  if (
    countedDays(leave.startDate, leave.endDate, leave.weekdays).length === 0
  ) {
    return {
      field: "weekdays",
      message: "None of the selected days fall between these dates",
    };
  }
  return null;
}

export const createLeaveSchema = leaveFields.superRefine((leave, ctx) => {
  // Zod still runs this check when a field already failed its own. A date
  // that is not a date would throw inside the day maths, and an empty list
  // already has its own message, so the cross-field rules only run on input
  // that is well formed.
  const datesAreReal =
    calendarDate.safeParse(leave.startDate).success &&
    calendarDate.safeParse(leave.endDate).success;
  if (
    !datesAreReal ||
    leave.weekdays.length === 0 ||
    !areWeekdays(leave.weekdays)
  ) {
    return;
  }
  const issue = validateLeaveDates(leave);
  if (issue) {
    ctx.addIssue({
      code: "custom",
      path: [issue.field],
      message: issue.message,
    });
  }
});

export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;

// Removing overlapping shifts is offered only when booking new leave.
export const updateLeaveSchema = leaveFields
  .omit({ removeOverlappingShifts: true })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );

export type UpdateLeaveInput = z.infer<typeof updateLeaveSchema>;

export const listLeaveQuerySchema = z
  .object({
    from: calendarDate.optional(),
    to: calendarDate.optional(),
    jobId: z.string().min(1, "Job is required").optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "From date must not be after the to date",
    path: ["to"],
  });

export type ListLeaveQuery = z.infer<typeof listLeaveQuerySchema>;
