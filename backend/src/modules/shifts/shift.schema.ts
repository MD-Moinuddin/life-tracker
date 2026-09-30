import { z } from "zod";
import { shiftLengthMinutes } from "../../lib/shift-time";

const calendarDate = z.iso.date(
  "Date must be a real date in YYYY-MM-DD format",
);

const clockTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format");

const breakMinutes = z
  .number()
  .int("Break must be a whole number of minutes")
  .min(0, "Break cannot be negative");

const shiftFields = z.object({
  jobId: z.string().min(1, "Job is required"),
  date: calendarDate,
  startTime: clockTime,
  endTime: clockTime,
  breakMinutes,
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be at most 500 characters")
    .transform((notes) => (notes === "" ? null : notes))
    .nullable()
    .optional(),
});

export function validateShiftTimes(shift: {
  startTime: string;
  endTime: string;
  breakMinutes: number;
}) {
  const length = shiftLengthMinutes(shift.startTime, shift.endTime);
  if (length === 0) {
    return {
      field: "endTime",
      message: "End time must be different from start time",
    };
  }
  if (shift.breakMinutes > length) {
    return {
      field: "breakMinutes",
      message: "Break cannot be longer than the shift",
    };
  }
  return null;
}

export const createShiftSchema = shiftFields
  .extend({ breakMinutes: breakMinutes.default(0) })
  .superRefine((shift, ctx) => {
    const issue = validateShiftTimes(shift);
    if (issue) {
      ctx.addIssue({
        code: "custom",
        path: [issue.field],
        message: issue.message,
      });
    }
  });

export type CreateShiftInput = z.infer<typeof createShiftSchema>;

export const updateShiftSchema = shiftFields
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );

export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;

export const listShiftsQuerySchema = z
  .object({
    from: calendarDate.optional(),
    to: calendarDate.optional(),
    limit: z.coerce
      .number()
      .int("Limit must be a whole number")
      .min(1, "Limit must be at least 1")
      .max(500, "Limit must be at most 500")
      .default(100),
    offset: z.coerce
      .number()
      .int("Offset must be a whole number")
      .min(0, "Offset cannot be negative")
      .default(0),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "From date must not be after the to date",
    path: ["to"],
  });

export type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>;
