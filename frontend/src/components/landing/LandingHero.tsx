import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { buttonClassName } from "../ui/Button";
import { DemoButton } from "./DemoButton";
import { EYEBROW_ACCENT_CLASSES } from "../ui/eyebrow";
import { Icon } from "../ui/Icon";
import {
  LANDING_CTA,
  LANDING_DESCRIPTION,
  LANDING_EYEBROW,
  LANDING_HEADLINE,
  LANDING_TRUST_POINTS,
} from "./landing-content";

export function LandingHero() {
  return (
    <div>
      <p className={`${EYEBROW_ACCENT_CLASSES} mb-2`}>{LANDING_EYEBROW}</p>
      <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
        {LANDING_HEADLINE}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-ink-muted">
        {LANDING_DESCRIPTION}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          to={ROUTES.signup}
          className={buttonClassName("primary", "normal", "px-6 text-base")}
        >
          {LANDING_CTA.signupFree}
        </Link>
        <Link
          to={ROUTES.login}
          className={buttonClassName("secondary", "normal", "px-6 text-base")}
        >
          {LANDING_CTA.login}
        </Link>
        <DemoButton />
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
        {LANDING_TRUST_POINTS.map((point) => (
          <li key={point} className="flex items-center gap-1.5">
            <Icon name="check" className="h-4 w-4 text-accent" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
