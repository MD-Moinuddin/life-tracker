import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FormStatus } from "../components/auth/FormStatus";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { LINK_CLASSES } from "../components/ui/links";
import { PasswordInput } from "../components/ui/PasswordInput";
import { PasswordRules } from "../components/auth/PasswordRules";
import { useFormErrors } from "../hooks/useFormErrors";
import { ApiError } from "../lib/api-client";
import { resetPassword } from "../lib/auth-api";
import { newPasswordError } from "../lib/auth-validation";
import { ROUTES } from "../lib/routes";

const TITLE = "Choose a new password";
const LEAD = "Pick something you do not use anywhere else.";
const INVALID_LINK_MESSAGE = "This reset link is invalid or has expired.";
const PASSWORD_UPDATED_NOTICE =
  "Password updated. Log in with your new password.";
const GENERIC_ERROR = "Something went wrong";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinkRejected, setIsLinkRejected] = useState(false);
  const passwordError = newPasswordError(password);
  const form = useFormErrors(
    { password: passwordError ? [passwordError] : [] },
    ["password"],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    if (!form.check(event.currentTarget)) {
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
    <AuthLayout title={TITLE} lead={LEAD} footer={footer}>
      <FormStatus message={error} />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Field label="New password" errors={form.errorsFor("password")}>
            {(control) => (
              <PasswordInput
                {...control}
                name="password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => form.onBlur("password", password)}
              />
            )}
          </Field>
          <PasswordRules
            password={password}
            showFailures={form.isShown("password")}
          />
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
