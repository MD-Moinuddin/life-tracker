import type { JobType } from "../../lib/jobs-api";

// All landing page copy and the example figures live here, so changing the
// wording never means editing a component.
export const LANDING_HEADLINE = "Your work, shifts and earnings in one place";

export const LANDING_DESCRIPTION =
  "Track part-time jobs and mini-jobs, log every shift, and see what you have earned and what is still to come.";

export interface LandingFeature {
  title: string;
  description: string;
}

export const LANDING_FEATURES: readonly LandingFeature[] = [
  {
    title: "Jobs",
    description: "Track part-time jobs and mini-jobs with their hourly rates.",
  },
  {
    title: "Shifts",
    description: "Log past and upcoming shifts, including overnight ones.",
  },
  {
    title: "Summary",
    description:
      "See weekly and monthly earnings, with a warning before you pass the mini-job limit.",
  },
];

// Made-up figures for the preview card. Money stays a string, as in the API.
export const PREVIEW: {
  caption: string;
  period: string;
  job: { name: string; type: JobType };
  earned: string;
  planned: string;
  limit: string;
} = {
  caption: "Example",
  period: "This month",
  job: { name: "Café", type: "mini_job" },
  earned: "226.00",
  planned: "420.00",
  limit: "540.00",
};

// Call-to-action labels. The header and the hero both read these, so renaming
// one is a one-place change.
export const LANDING_CTA = { signup: "Sign up", login: "Log in" } as const;

export const LANDING_NAV_LABEL = "Sign in or create an account";

// Preview card text. Callers pass in already-formatted euro strings.
export const PREVIEW_EARNED_LABEL = "Earned against planned";
export const PREVIEW_LIMIT_LABEL =
  "Planned mini-job earnings against the monthly limit";

export const previewEarnedText = (earned: string, planned: string): string =>
  `${earned} earned of ${planned} planned`;

export const previewLimitText = (planned: string, limit: string): string =>
  `${planned} of ${limit} planned`;
