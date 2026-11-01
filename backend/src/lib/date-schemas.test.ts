import { describe, expect, it } from "vitest";
import { calendarDate } from "./date-schemas";

describe("calendarDate", () => {
  it.each(["2026-03-09", "1900-01-01", "2100-12-31", "2028-02-29"])(
    "accepts %s",
    (date) => {
      expect(calendarDate.safeParse(date).success).toBe(true);
    },
  );

  it.each(["2026-02-30", "2026-13-01", "26-03-09", "2026-3-9", "abc", ""])(
    "rejects %s as not a real date",
    (date) => {
      const result = calendarDate.safeParse(date);
      expect(result.success).toBe(false);
    },
  );

  it.each(["0000-01-01", "1899-12-31", "2101-01-01"])(
    "rejects %s as outside the supported years, with its own message",
    (date) => {
      const result = calendarDate.safeParse(date);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Date must be between 1900 and 2100",
      );
    },
  );
});
