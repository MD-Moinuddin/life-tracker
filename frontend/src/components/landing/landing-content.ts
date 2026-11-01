import type { IconName } from "../ui/Icon";

// All landing page copy and the example figures live here, so changing the
// wording never means editing a component. Money stays a string, as in the API.

export const LANDING_EYEBROW = "For part-time jobs and mini-jobs";
export const LANDING_HEADLINE = "Your work, shifts and earnings in one place";
export const LANDING_DESCRIPTION =
  "Track every job, log every shift, and see what you have earned and what is still to come, before you pass your mini-job limit.";

// Call-to-action labels. The header, the hero and the closing section all read
// these, so renaming one is a one-place change.
export const LANDING_CTA = {
  signup: "Sign up",
  signupFree: "Sign up free",
  login: "Log in",
  demo: "Try the demo",
} as const;

export const LANDING_NAV_LABEL = "Sign in or create an account";
export const LANDING_SECTIONS_LABEL = "On this page";

export const LANDING_TRUST_POINTS = [
  "Free to use",
  "No card needed",
  "Works on your phone",
] as const;

export const LANDING_SECTION_IDS = {
  howItWorks: "how-it-works",
  features: "features",
} as const;

export const LANDING_SECTION_LINKS = [
  { id: LANDING_SECTION_IDS.howItWorks, label: "How it works" },
  { id: LANDING_SECTION_IDS.features, label: "Features" },
] as const;

// The example shown beside the hero. Hidden from assistive tech: the numbers
// are an example, not data.
export const PREVIEW = {
  caption: "Example",
  period: "This week",
  earned: "174.00",
  earnedDetail: "earned · 12h finished",
  percent: "32%",
  plannedAmount: "549.00",
  plannedDetail: "37h 45m",
  jobs: [
    { name: "Cafe", share: 48 },
    { name: "Restaurant", share: 52 },
  ],
  shift: {
    weekday: "Fri",
    day: "30",
    job: "Cafe",
    label: "Today",
    time: "10:45–16:00 · 5h 15m",
    earnings: "73.50",
  },
  vacation: { label: "Paid vacation", left: "12h", of: "80h" },
} as const;

export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  title: "Set up in a minute",
  lead: "Three steps, and your week fills in by itself.",
  steps: [
    {
      title: "Add your jobs",
      description:
        "A name, an hourly rate and whether it is a part-time job or a mini-job.",
    },
    {
      title: "Log your shifts",
      description:
        "Past or upcoming, with start and end times, even across midnight.",
    },
    {
      title: "See what you earn",
      description: "Hours and earnings per job, for the week or the month.",
    },
  ],
} as const;

export interface LandingFeature {
  title: string;
  description: string;
  icon: IconName;
  // Index into JOB_COLORS, so each icon tile has its own tint.
  colorIndex: number;
}

export const FEATURES = {
  eyebrow: "Features",
  title: "Everything for your work life",
} as const;

export const LANDING_FEATURES: readonly LandingFeature[] = [
  {
    title: "Several jobs, one view",
    description:
      "Every job gets its own colour, so shifts and totals are easy to tell apart.",
    icon: "briefcase",
    colorIndex: 0,
  },
  {
    title: "Overnight shifts",
    description:
      "A shift that ends the next day is counted correctly, without any workaround.",
    icon: "moon",
    colorIndex: 4,
  },
  {
    title: "Earned vs planned",
    description:
      "See what is finished and what is still to come, by week or by month.",
    icon: "bar-chart",
    colorIndex: 1,
  },
  {
    title: "Mini-job limit warning",
    description:
      "Get a warning before your planned earnings pass the monthly limit.",
    icon: "shield-check",
    colorIndex: 2,
  },
  {
    title: "Paid vacation balance",
    description:
      "Track your paid leave, see the hours you have left, and book a week or two with the pay shown.",
    icon: "sun",
    colorIndex: 2,
  },
  {
    title: "Made for your phone",
    description:
      "A list or a week view, a bottom tab bar and a floating button, so you can log a shift in seconds.",
    icon: "smartphone",
    colorIndex: 0,
  },
];

// The slider example. The limit here is only an example: the real one comes
// from the app.
export const MINI_JOB_SPOTLIGHT = {
  eyebrow: "Mini-job limit",
  title: "See it before you pass your limit",
  lead: "Plan your shifts for the month and watch your planned earnings against the limit. The warning shows up while you can still change your plans.",
  caption: "Planned this month (example)",
  sliderLabel: "Try different planned earnings",
  limit: 540,
  min: 100,
  max: 620,
  step: 10,
  initial: 420,
} as const;

export const miniJobMessage = (
  planned: number,
  limit: number,
  formatEuro: (amount: string) => string,
): string =>
  planned > limit
    ? `Over the limit by ${formatEuro((planned - limit).toFixed(2))}. You can still change your plans.`
    : `${formatEuro((limit - planned).toFixed(2))} left before the limit of ${formatEuro(limit.toFixed(2))}`;

export const PHONE_SHOWCASE = {
  eyebrow: "On your phone",
  title: "Log a shift between two buses",
  lead: "The app is built for the small screen first: one tap to the page you want and one tap to add a shift.",
  points: [
    "Bottom tab bar within thumb reach",
    "Compact rows that fit more shifts on screen",
    "A day-by-day week view that never squeezes",
  ],
  // A static example of the Shifts screen, hidden from assistive tech.
  weekTitle: "This week · 4 shifts · €375.00",
  shifts: [
    {
      weekday: "Fri",
      day: "30",
      job: "Cafe",
      colorIndex: 0,
      label: "Today",
      time: "10:45–16:00 · 5h 15m",
      earnings: "€73.50",
    },
    {
      weekday: "Fri",
      day: "30",
      job: "Restaurant",
      colorIndex: 1,
      time: "17:00–22:00 · 5h",
      earnings: "€75.00",
    },
    {
      weekday: "Sat",
      day: "31",
      job: "Restaurant",
      colorIndex: 1,
      time: "10:00–20:00 · 9h 30m",
      earnings: "€142.50",
    },
    {
      weekday: "Sun",
      day: "1",
      job: "Cafe",
      colorIndex: 0,
      time: "00:45–06:45 · 6h",
      earnings: "€84.00",
    },
  ],
  tabs: ["Dashboard", "Jobs", "Shifts", "Summary"],
  activeTab: "Shifts",
  fab: "+ Add shift",
} as const;

export const FINAL_CTA = {
  title: "Start tracking your shifts today",
  lead: "Free to use. Set up your first job in a minute.",
} as const;

export const FOOTER_LABEL = "Life Tracker";
