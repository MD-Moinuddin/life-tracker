import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { buttonClassName } from "../ui/Button";
import { FINAL_CTA, LANDING_CTA } from "./landing-content";

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="rounded-3xl border border-border bg-surface px-6 py-12 text-center sm:py-14"
    >
      <h2
        id="final-cta-heading"
        className="text-3xl font-bold tracking-tight text-ink"
      >
        {FINAL_CTA.title}
      </h2>
      <p className="mt-2 text-lg text-ink-muted">{FINAL_CTA.lead}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
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
      </div>
    </section>
  );
}
