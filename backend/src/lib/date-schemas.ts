import { z } from "zod";

export const calendarDate = z.iso.date(
  "Date must be a real date in YYYY-MM-DD format",
);
