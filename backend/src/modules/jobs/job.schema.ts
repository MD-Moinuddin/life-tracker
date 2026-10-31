import { z } from "zod";
import { JobType } from "../../generated/prisma/enums";

const hourlyRate = z
  .string()
  .regex(
    /^\d{1,6}(\.\d{1,2})?$/,
    "Hourly rate must be a number with at most 2 decimals",
  )
  .refine((value) => Number(value) > 0, "Hourly rate must be greater than 0");

const hoursString = (min: number) =>
  z
    .string()
    .regex(
      /^\d{1,4}(\.\d{1,2})?$/,
      "Hours must be a number with at most 2 decimals",
    )
    .refine(
      (value) => Number(value) >= min && Number(value) <= 1000,
      min > 0
        ? "Hours must be greater than 0 and at most 1000"
        : "Hours must be between 0 and 1000",
    );

const jobFields = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  hourlyRate,
  type: z.enum(JobType),
  vacationHoursPerYear: hoursString(0.01).nullable().optional(),
  vacationCarryOverHours: hoursString(0).optional(),
  vacationCarryOverYear: z
    .number()
    .int()
    .min(2000)
    .max(2100)
    .nullable()
    .optional(),
});

function requireCarryOverYear(
  job: {
    vacationCarryOverHours?: string;
    vacationCarryOverYear?: number | null;
  },
  ctx: z.RefinementCtx,
) {
  if (
    Number(job.vacationCarryOverHours ?? 0) > 0 &&
    job.vacationCarryOverYear == null
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["vacationCarryOverYear"],
      message: "Say which year the carried-over hours belong to",
    });
  }
}

export const createJobSchema = jobFields.superRefine(requireCarryOverYear);

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = jobFields
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  )
  .superRefine(requireCarryOverYear);

export type UpdateJobInput = z.infer<typeof updateJobSchema>;
