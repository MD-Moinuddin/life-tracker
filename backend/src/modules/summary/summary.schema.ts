import { z } from "zod";
import { calendarDate } from "../../lib/date-schemas";
import { SUMMARY_RANGES } from "../../lib/period";

const nowMessage =
  "Now must be a real date and time in YYYY-MM-DDTHH:mm format";

export const summaryQuerySchema = z.object({
  range: z.enum(SUMMARY_RANGES, "Range must be week or month"),
  date: calendarDate,
  now: z.iso
    .datetime({ local: true, precision: -1, error: nowMessage })
    .refine((value) => !value.endsWith("Z"), nowMessage),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
