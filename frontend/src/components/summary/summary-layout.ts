export const SUMMARY_LAYOUTS = [
  { value: "cards", label: "Cards" },
  { value: "table", label: "Table" },
] as const;

export type SummaryLayout = (typeof SUMMARY_LAYOUTS)[number]["value"];
