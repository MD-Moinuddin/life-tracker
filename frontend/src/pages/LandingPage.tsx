import { Link, Navigate } from "react-router-dom";
import { FeatureList } from "../components/landing/FeatureList";
import {
  LANDING_CTA,
  LANDING_NAV_LABEL,
} from "../components/landing/landing-content";
import { LandingHero } from "../components/landing/LandingHero";
import { SummaryPreview } from "../components/landing/SummaryPreview";
import { BrandLink } from "../components/layout/BrandLink";
import { buttonClassName } from "../components/ui/Button";
import { Spinner } from "../components/Spinner";
import { ROUTES } from "../lib/routes";
import { useAuthStore } from "../store/auth-store";

// The home page for visitors who are not signed in. On desktop it is one
// screen tall (min-h-dvh), so it fits without scrolling at normal sizes but
// scrolls rather than clips on a very short window. Below lg it stacks.
export function LandingPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Wait for the silent session refresh, so a signed-in user is never shown the
  // landing page first.
  if (!isInitialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page text-ink-muted">
        <p role="status" className="flex items-center gap-2 text-sm">
          <Spinner />
          Loading…
        </p>
      </div>
    );
  }

  if (accessToken) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <BrandLink className="text-lg" />
        <nav aria-label={LANDING_NAV_LABEL} className="flex items-center gap-2">
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
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-4 py-8 sm:px-6 lg:gap-12 lg:py-4">
        <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <LandingHero />
          <SummaryPreview />
        </section>
        <FeatureList />
      </main>
    </div>
  );
}
