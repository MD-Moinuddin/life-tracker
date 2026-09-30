import { z } from "zod";

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
    .nullable()
    .optional(),
});

export const createShiftSchema = shiftFields.extend({
  breakMinutes: breakMinutes.default(0),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;

export const updateShiftSchema = shiftFields
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );

export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
