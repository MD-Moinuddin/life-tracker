import { Navigate } from "react-router-dom";
import { AppPreview } from "../components/landing/AppPreview";
import { FeatureGrid } from "../components/landing/FeatureGrid";
import { FinalCta } from "../components/landing/FinalCta";
import { HowItWorks } from "../components/landing/HowItWorks";
import { LandingFooter } from "../components/landing/LandingFooter";
import { LandingHeader } from "../components/landing/LandingHeader";
import { LandingHero } from "../components/landing/LandingHero";
import { MiniJobSpotlight } from "../components/landing/MiniJobSpotlight";
import { PhoneShowcase } from "../components/landing/PhoneShowcase";
import { SlowStartNotice } from "../components/SlowStartNotice";
import { Spinner } from "../components/Spinner";
import { ROUTES } from "../lib/routes";
import { useAuthStore } from "../store/auth-store";

// The home page for visitors who are not signed in: what the app does, how it
// works, and a way to sign up. Everything is drawn in code, so it does not wait
// for the server. Below lg the hero stacks.
export function LandingPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Wait for the silent session refresh, so a signed-in user is never shown the
  // landing page first.
  if (!isInitialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page text-ink-muted">
        <div className="flex flex-col items-center">
          <p role="status" className="flex items-center gap-2 text-sm">
            <Spinner />
            Loading…
          </p>
          <SlowStartNotice />
        </div>
      </div>
    );
  }

  if (accessToken) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <LandingHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <section className="relative grid items-center gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-6 -right-20 -z-10 h-96 w-lg rounded-full bg-accent-soft/80 blur-3xl max-lg:hidden"
          />
          <LandingHero />
          <AppPreview />
        </section>
        <HowItWorks />
        <FeatureGrid />
        <MiniJobSpotlight />
        <PhoneShowcase />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
