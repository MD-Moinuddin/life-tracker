import { z } from "zod";
import { JobType } from "../../generated/prisma/enums";

const hourlyRate = z
  .string()
  .regex(
    /^\d{1,6}(\.\d{1,2})?$/,
    "Hourly rate must be a number with at most 2 decimals",
  )
  .refine((value) => Number(value) > 0, "Hourly rate must be greater than 0");

export const createJobSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  hourlyRate,
  type: z.enum(JobType),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = createJobSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );

export type UpdateJobInput = z.infer<typeof updateJobSchema>;
