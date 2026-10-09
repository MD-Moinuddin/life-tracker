import type { ReactNode } from "react";
import { Card } from "../ui/Card";
import { Brand } from "./Brand";

const TAGLINE = "Track work, shifts and earnings in one place";

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-12">
      <main className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Brand className="justify-center text-lg" />
          <p className="mt-1 text-sm text-ink-muted">{TAGLINE}</p>
        </div>
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold text-ink">{title}</h1>
          {children}
        </Card>
        <p className="mt-4 text-center text-sm text-ink-muted">{footer}</p>
      </main>
    </div>
  );
}
