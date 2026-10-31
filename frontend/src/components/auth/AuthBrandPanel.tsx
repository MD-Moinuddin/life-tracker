import { AppPreview } from "../landing/AppPreview";
import { BrandLink } from "../layout/BrandLink";
import { AUTH_PANEL } from "./auth-content";

// The left half of the sign-in pages on a wide screen: what the app is for,
// with the same example week as the homepage. It is not shown on a phone, where
// the form is all there is.
export function AuthBrandPanel() {
  return (
    <aside
      aria-label={AUTH_PANEL.label}
      className="relative flex flex-col justify-between gap-10 overflow-hidden bg-linear-to-br from-page to-accent-soft px-12 py-10 max-lg:hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -bottom-28 h-96 w-96 rounded-full bg-accent/15 blur-3xl"
      />
      <BrandLink className="relative text-lg" />
      <div className="relative">
        <p className="max-w-sm text-3xl leading-tight font-bold tracking-tight text-ink">
          {AUTH_PANEL.headline}
        </p>
        <div className="mt-6 max-w-sm">
          <AppPreview />
        </div>
        <ul className="mt-6 grid max-w-sm gap-3 text-accent-ink">
          {AUTH_PANEL.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
              >
                ✓
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-sm text-ink-muted">{`© ${new Date().getFullYear()} Life Tracker`}</p>
    </aside>
  );
}
