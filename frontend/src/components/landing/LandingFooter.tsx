import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { BrandLink } from "../layout/BrandLink";
import { LANDING_CTA } from "./landing-content";

export function LandingFooter() {
  return (
    <footer className="mt-12 border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-muted sm:px-6">
        <BrandLink className="text-base" />
        <nav aria-label="Footer" className="flex gap-5 font-medium">
          <Link to={ROUTES.login} className="hover:text-ink">
            {LANDING_CTA.login}
          </Link>
          <Link to={ROUTES.signup} className="hover:text-ink">
            {LANDING_CTA.signup}
          </Link>
        </nav>
        <p>{`© ${new Date().getFullYear()} Life Tracker`}</p>
      </div>
    </footer>
  );
}
