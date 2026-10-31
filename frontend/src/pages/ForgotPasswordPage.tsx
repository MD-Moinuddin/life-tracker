import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FormStatus } from "../components/auth/FormStatus";
import { ResetLinkSent } from "../components/auth/ResetLinkSent";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Icon } from "../components/ui/Icon";
import { Input } from "../components/ui/Input";
import { LINK_CLASSES } from "../components/ui/links";
import { useFormErrors } from "../hooks/useFormErrors";
import { ApiError } from "../lib/api-client";
import { forgotPassword } from "../lib/auth-api";
import { isValidEmail } from "../lib/auth-validation";
import { ROUTES } from "../lib/routes";

const TITLE = "Reset your password";
const SENT_TITLE = "Check your email";
const INTRO =
  "Enter your email and we'll send you a link to choose a new password.";
const INVALID_EMAIL_MESSAGE = "Enter a valid email address";
const GENERIC_ERROR = "Something went wrong";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const form = useFormErrors(
    { email: isValidEmail(email) ? [] : [INVALID_EMAIL_MESSAGE] },
    ["email"],
  );

  // True when the link was requested, so the sent screen can restart its wait.
  async function requestLink(): Promise<boolean> {
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : GENERIC_ERROR);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.check(event.currentTarget)) {
      return;
    }
    if (await requestLink()) {
      setIsSent(true);
    }
  }

  return (
    <AuthLayout
      title={isSent ? SENT_TITLE : TITLE}
      lead={isSent ? undefined : INTRO}
      footer={
        <Link
          to={ROUTES.login}
          className={`${LINK_CLASSES} inline-flex min-h-11 items-center gap-1`}
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to log in
        </Link>
      }
    >
      <FormStatus message={error} />
      {isSent ? (
        <ResetLinkSent
          email={email}
          isResending={isSubmitting}
          onResend={requestLink}
        />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Email" errors={form.errorsFor("email")}>
            {(control) => (
              <Input
                {...control}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                disabled={isSubmitting}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => form.onBlur("email", email)}
              />
            )}
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
