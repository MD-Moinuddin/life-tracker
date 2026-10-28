import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FormStatus } from "../components/auth/FormStatus";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { LINK_CLASSES } from "../components/ui/links";
import { PasswordInput } from "../components/ui/PasswordInput";
import { ApiError } from "../lib/api-client";
import { resetPassword } from "../lib/auth-api";
import { passwordErrors } from "../lib/auth-validation";
import { ROUTES } from "../lib/routes";

const TITLE = "Choose a new password";
const INVALID_LINK_MESSAGE = "This reset link is invalid or has expired.";
const PASSWORD_UPDATED_NOTICE =
  "Password updated. Log in with your new password.";
const GENERIC_ERROR = "Something went wrong";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordMessages, setPasswordMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinkRejected, setIsLinkRejected] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    const messages = passwordErrors(password);
    setPasswordMessages(messages);
    if (messages.length > 0) {
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword({ token, password });
      navigate(ROUTES.login, {
        replace: true,
        state: { notice: PASSWORD_UPDATED_NOTICE },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setIsLinkRejected(true);
      } else {
        setError(err instanceof ApiError ? err.message : GENERIC_ERROR);
      }
      setIsSubmitting(false);
    }
  }

  const footer = (
    <Link to={ROUTES.login} className={LINK_CLASSES}>
      Back to log in
    </Link>
  );

  if (!token || isLinkRejected) {
    return (
      <AuthLayout title={TITLE} footer={footer}>
        <div className="space-y-4">
          <Alert tone="danger" role="alert">
            {INVALID_LINK_MESSAGE}
          </Alert>
          <p className="text-sm text-ink-muted">
            <Link to={ROUTES.forgotPassword} className={LINK_CLASSES}>
              Request a new link
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={TITLE} footer={footer}>
      <FormStatus message={error} />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="New password" errors={passwordMessages}>
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="new-password"
              required
              disabled={isSubmitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>
        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
