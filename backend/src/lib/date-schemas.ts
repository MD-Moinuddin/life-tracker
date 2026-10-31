import { z } from "zod";

export const MIN_CALENDAR_DATE = "1900-01-01";
export const MAX_CALENDAR_DATE = "2100-12-31";

// A real date in YYYY-MM-DD form, within years the database and the app can
// hold (Postgres rejects year 0000, which a plain ISO check accepts).
export const calendarDate = z.iso
  .date("Date must be a real date in YYYY-MM-DD format")
  .refine(
    // A string that is not even date-shaped already has the format message.
    (date) =>
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      (date >= MIN_CALENDAR_DATE && date <= MAX_CALENDAR_DATE),
    "Date must be between 1900 and 2100",
  );
