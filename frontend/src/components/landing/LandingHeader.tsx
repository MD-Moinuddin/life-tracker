import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { BrandLink } from "../layout/BrandLink";
import { buttonClassName } from "../ui/Button";
import {
  LANDING_CTA,
  LANDING_NAV_LABEL,
  LANDING_SECTIONS_LABEL,
  LANDING_SECTION_LINKS,
} from "./landing-content";

// Pinned to the top, with links to the sections of the page on wider screens.
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-20 bg-page/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLink className="text-lg" />
        <div className="flex items-center gap-2">
          <nav
            aria-label={LANDING_SECTIONS_LABEL}
            className="mr-3 flex gap-5 text-sm font-medium text-ink-muted max-md:hidden"
          >
            {LANDING_SECTION_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="rounded transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <nav
            aria-label={LANDING_NAV_LABEL}
            className="flex items-center gap-2"
          >
            <Link
              to={ROUTES.login}
              className={buttonClassName("secondary", "compact")}
            >
              {LANDING_CTA.login}
            </Link>
            <Link
              to={ROUTES.signup}
              className={buttonClassName("primary", "compact")}
            >
              {LANDING_CTA.signup}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
