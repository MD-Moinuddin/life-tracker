import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { buttonClassName } from "../ui/Button";
import {
  LANDING_CTA,
  LANDING_DESCRIPTION,
  LANDING_HEADLINE,
} from "./landing-content";

export function LandingHero() {
  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight text-ink lg:text-5xl">
        {LANDING_HEADLINE}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-ink-muted">
        {LANDING_DESCRIPTION}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={ROUTES.signup} className={buttonClassName("primary")}>
          {LANDING_CTA.signup}
        </Link>
        <Link to={ROUTES.login} className={buttonClassName("secondary")}>
          {LANDING_CTA.login}
        </Link>
      </div>
    </div>
  );
}
