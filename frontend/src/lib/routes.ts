// Every in-app URL lives here, so renaming a page is a one-line change.
export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  jobs: "/jobs",
  jobDetail: "/jobs/:id",
  shifts: "/shifts",
  summary: "/summary",
} as const;

export function jobPath(id: string): string {
  return `${ROUTES.jobs}/${encodeURIComponent(id)}`;
}
