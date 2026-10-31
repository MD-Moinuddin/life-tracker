import { useCountdown } from "../../hooks/useCountdown";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

// How long to wait before asking for another link. Must match
// PASSWORD_RESET_COOLDOWN_MS in the backend: a request sooner than that is
// ignored there.
export const RESEND_COOLDOWN_SECONDS = 60;
// Must match PASSWORD_RESET_TTL_MS in the backend.
const LINK_LIFETIME_MINUTES = 30;

interface ResetLinkSentProps {
  email: string;
  isResending: boolean;
  onResend: () => Promise<boolean>;
}

// What the visitor sees once the reset email is on its way: where to look, how
// long the link lasts, and a way to send it again.
export function ResetLinkSent({
  email,
  isResending,
  onResend,
}: ResetLinkSentProps) {
  const { remaining, restart } = useCountdown(RESEND_COOLDOWN_SECONDS);

  async function handleResend() {
    if (await onResend()) {
      restart();
    }
  }

  return (
    <div role="status" className="text-center">
      <span
        aria-hidden="true"
        className="mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent-ink"
      >
        <Icon name="mail" className="h-8 w-8" />
      </span>
      <p className="text-ink-muted">
        {"If an account exists for "}
        <span className="font-semibold break-all text-ink">{email}</span>
        {", we've sent a link to choose a new password."}
      </p>
      <ul className="my-4 grid list-disc gap-1.5 rounded-card bg-page py-3 pr-4 pl-8 text-left text-sm text-ink-muted marker:text-accent">
        <li>{`The link works for ${LINK_LIFETIME_MINUTES} minutes and only once.`}</li>
        <li>Nothing there? Look in your spam folder.</li>
      </ul>
      <Button
        variant="secondary"
        className="w-full"
        loading={isResending}
        disabled={remaining > 0}
        onClick={handleResend}
      >
        {remaining > 0 ? `Send again in ${remaining}s` : "Send again"}
      </Button>
    </div>
  );
}
