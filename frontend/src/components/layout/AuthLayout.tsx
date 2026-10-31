import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { AUTH_BACK_TO_HOME } from "../auth/auth-content";
import { AuthBrandPanel } from "../auth/AuthBrandPanel";
import { DemoLink } from "../auth/DemoLink";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { BrandLink } from "./BrandLink";

interface AuthLayoutProps {
  title: string;
  // One line under the title, saying what this page is for.
  lead?: string;
  children: ReactNode;
  footer: ReactNode;
  // Offer the demo under the card, for pages a visitor reaches before signing up.
  showDemo?: boolean;
}

// The sign-in pages: from lg a brand panel on the left and the form on the
// right; on a phone just the form, with the logo above it.
export function AuthLayout({
  title,
  lead,
  children,
  footer,
  showDemo = false,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh bg-page lg:grid-cols-2">
      <AuthBrandPanel />
      <div className="flex min-h-dvh flex-col px-4 py-5 sm:px-8">
        <div className="flex min-h-11 items-center justify-between">
          <span className="lg:invisible">
            <BrandLink className="text-lg" />
          </span>
          <Link
            to={ROUTES.home}
            className="inline-flex min-h-11 items-center gap-1 text-sm text-ink-muted hover:text-ink"
          >
            <Icon name="chevron-left" className="h-4 w-4" />
            {AUTH_BACK_TO_HOME}
          </Link>
        </div>
        <main className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">
            <Card className="p-5 sm:p-7">
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                {title}
              </h1>
              {lead && <p className="mt-1 mb-5 text-ink-muted">{lead}</p>}
              {!lead && <div className="mb-5" />}
              {children}
            </Card>
            <p className="mt-4 text-center text-sm text-ink-muted">{footer}</p>
            {showDemo && <DemoLink />}
          </div>
        </main>
      </div>
    </div>
  );
}
