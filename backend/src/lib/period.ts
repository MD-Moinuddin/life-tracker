import { addDays } from "./shift-time";

export const SUMMARY_RANGES = ["week", "month"] as const;
export type SummaryRange = (typeof SUMMARY_RANGES)[number];

export function periodBounds(range: SummaryRange, date: string) {
  if (range === "week") {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const from = addDays(date, -((weekday + 6) % 7));
    return { from, to: addDays(from, 6) };
  }

  const yearMonth = date.slice(0, 7);
  const [year = 0, month = 0] = yearMonth.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${yearMonth}-01`, to: `${yearMonth}-${lastDay}` };
}
