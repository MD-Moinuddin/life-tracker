import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FormStatus } from "../components/auth/FormStatus";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { LINK_CLASSES } from "../components/ui/links";
import { ApiError } from "../lib/api-client";
import { forgotPassword } from "../lib/auth-api";
import { isValidEmail } from "../lib/auth-validation";
import { ROUTES } from "../lib/routes";

const TITLE = "Reset your password";
const INTRO =
  "Enter your email and we'll send you a link to choose a new password.";
// The "30 minutes" must match PASSWORD_RESET_TTL_MS in the backend.
const SENT_MESSAGE =
  "If an account exists for that email, we've sent a link. It expires in 30 minutes.";
const INVALID_EMAIL_MESSAGE = "Enter a valid email address";
const GENERIC_ERROR = "Something went wrong";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setEmailError(INVALID_EMAIL_MESSAGE);
      return;
    }

    setEmailError(null);
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setIsSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title={TITLE}
      footer={
        <Link to={ROUTES.login} className={LINK_CLASSES}>
          Back to log in
        </Link>
      }
    >
      {isSent ? (
        <Alert tone="info" role="status">
          {SENT_MESSAGE}
        </Alert>
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-muted">{INTRO}</p>
          <FormStatus message={error} />
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field label="Email" errors={emailError ? [emailError] : []}>
              {(control) => (
                <Input
                  {...control}
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>
            <Button type="submit" loading={isSubmitting} className="w-full">
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
