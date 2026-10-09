# UI redesign: Clean light design system

Date: 2026-10-09
Status: Draft for review

## Goal

Give every screen of the app a modern, consistent look and feel (the "Clean light" direction), and build it so that any later visual change is made in one place. The app's behaviour, API and routes do not change.

## Decisions

| Topic | Decision |
|---|---|
| Look | Clean light: bright, airy, rounded cards, one indigo accent |
| Delivery | Design system first, then one page at a time, each as its own small PR |
| Implementation | Tailwind design tokens plus our own shared components. No shadcn/ui, no new component library |
| Navigation | A single top bar. On phones the links become a horizontally scrollable row |
| Dark mode | Not now. The tokens are named so a dark set can be added later without touching pages |
| Kept from the preview | Date tiles on shift rows, a show/hide password toggle, a "Week at a glance" card on the Dashboard |
| Dropped from the preview | Headline cards on the Summary page |
| Icons | Inline SVG components in one file. No icon library, no emoji |
| Font | Inter, self-hosted with `@fontsource-variable/inter` (the only new dependency) |

## Out of scope

Dark mode (a later task), animations beyond simple transitions, charts, screenshot tests, and any backend or API change.

## 1. Foundation

- All design values live in `frontend/src/styles/tokens.css` under Tailwind's `@theme`, imported by `index.css`, as semantic tokens: `--color-page`, `--color-surface`, `--color-ink` (text, named `ink` so the utility reads `text-ink` and not `text-text`), `--color-ink-muted`, `--color-border`, `--color-accent`, `--color-success`, `--color-warning-*`, `--color-danger`, plus radius, shadow, font-size and font tokens. Pages and components use token-based utilities such as `bg-surface` and never raw colours such as `bg-white` or `text-slate-600`.
- Starting palette: page `#F6F7FB`, surface `#FFFFFF`, text `#1B1F3B`, muted text `#5B6088`, border `#E6E8F0`, accent `#4F46E5`, success `#047857`, warning surface `#FFFBEB`, danger `#B91C1C`. Final values may move slightly to keep every text and background pair at WCAG AA contrast.
- A unit test reads the token values and checks the contrast of each text and background pair the UI uses, so a later colour change cannot silently break contrast.
- Type scale: page title 28, section heading 18, body 14, caption 12. Radius: 10 for controls, 14 to 16 for cards. One soft shadow token.
- One shared focus-ring style is applied to every interactive element.
- Transitions are short and are disabled under `prefers-reduced-motion`.
- Icons are inline SVG components in a single file (warning, eye and eye-off, plus, chevrons, and one per dashboard module). They are decorative and hidden from screen readers unless they carry meaning.

## 2. Shared components

All live in `frontend/src/components/ui/`. Each has one job, its own tests, and is the only place its look is defined.

| Component | Replaces | Notes |
|---|---|---|
| `Button` | Button classes in `form-styles.ts`, `AddButton` | Variants: primary, secondary, danger. Sizes: normal and compact. Supports a loading state. |
| `Card` | The bordered white boxes on Dashboard, Jobs, Shifts, Summary, Login | Variants: plain and interactive (a link card). |
| `Badge` | The job-type pill and the "Coming later" pill | Tones: accent, success, neutral. Job-type labels still come from `JOB_TYPE_LABELS`. |
| `Field`, `Input`, `Select` | `FormField`, `INPUT_CLASSES` | Keeps the existing accessible label, error and hint wiring. A password variant adds the show/hide toggle. |
| `Alert` | The mini-job warning box, form errors, load errors | Tones: warning, danger, info. Always an icon plus text. Keeps `role="status"` or `role="alert"` where used today. |
| `PageHeader` | The repeated title row with an Add button | Title, optional subtitle, optional action. |
| `EmptyState` | The empty messages on Jobs, Shifts, Summary | Icon, text, optional action. |
| `Table` pieces | The Summary table markup | Wrapper, header, row and total-row components. Keep caption and header cells. |

Unchanged in behaviour: `Modal`, `ConfirmDelete`, `LoadBoundary`, `PeriodNavigator` and routing. They pick up the new look through the tokens and by using the shared components inside.

Migration rule: when a page moves to the new components, the class strings it used are deleted. `form-styles.ts` is removed when the last page has moved.

## 3. Pages

**App shell.** One top bar with the logo, the nav links and an account menu showing the user's name. The menu holds "Log out" (and later the dark mode switch) and replaces the separate Log out button. Active link: indigo text with an underline, with `aria-current="page"` as today. The skip-to-content link stays. On phones the links scroll horizontally under the logo.

**Login and Signup.** A centred card on the page background with the logo and a short tagline, a "Welcome back" or "Create your account" heading, the password show/hide toggle, and errors shown in an `Alert` above the submit button.

**Dashboard.** A greeting by name. A "Week at a glance" card showing planned earnings and hours for the current week, with a link to the Summary page; it uses the existing summary request. If that request fails, the card shows a short message and the rest of the page still renders. Below it, the module cards: Work Schedule is a link card, the others are dimmed with a "Coming later" badge.

**Jobs.** `PageHeader` with the Add job button. Job cards show the name, a type badge, the rate and the shift count, with Edit and Delete as secondary actions. A friendlier empty state.

**Job detail.** A back link, the job name with its badge and rate, then the same Upcoming and History sections as Shifts.

**Shifts.** Each row has a date tile (weekday over day number), the job name with its badge, and the time range with "(next day)" for overnight shifts. The headings and period navigator use the shared components.

**Summary.** The Week/Month control is a segmented control beside the shared `PeriodNavigator`. The mini-job warning is the shared `Alert` in the warning tone, keeping text, icon and `role="status"`. The table keeps its caption and header cells and gains job-type badges. There are no headline cards.

**Forms and dialogs.** `Modal`, the job form and the shift form are restyled through the tokens and shared fields only. Their behaviour does not change.

**Responsive rules.** Designed mobile first at 360 px wide. Tables scroll inside their card. Interactive controls keep at least a 44 px tap target.

## 4. Delivery

Each step is its own branch and PR, and the app works after every one.

1. Foundation: tokens, font, icons, focus ring, contrast test. No visible change yet.
2. Core components with tests. Nothing uses them yet.
3. App shell: top bar and account menu. Kept as small as possible because it touches every logged-in page.
4. Login and Signup, including the password toggle.
5. Dashboard, including "Week at a glance".
6. Jobs and Job detail.
7. Shifts, including date tiles.
8. Summary.
9. Cleanup: remove `form-styles.ts` and leftover class strings, and check the codebase for raw colours that bypass the tokens.
10. Dark mode, later and separately: a second token set and the account-menu switch.

The S7 accessibility, docs and release tasks run after this work, so the jest-axe, contrast and keyboard checks cover the finished look.

## 5. Testing

- Every shared component has unit tests. Existing page tests keep passing because behaviour does not change.
- jest-axe runs on each redesigned page in the same PR that redesigns it.
- The token contrast test (section 1) runs in CI.
- Each PR passes `tsc -b`, `npm run build`, ESLint and the full test suite.
- Each page gets a manual browser pass at phone and desktop widths.

## 6. Risks

- **Visual regressions:** there are no screenshot tests. The manual browser pass covers this. Adding screenshot tests would be a separate decision.
- **Large shell PR:** the shell touches every logged-in page, so it ships alone and as small as possible.
- **Scope growth:** new ideas are written down for later instead of being added to a step.
