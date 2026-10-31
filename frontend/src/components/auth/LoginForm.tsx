import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useFormErrors } from "../../hooks/useFormErrors";
import { isValidEmail } from "../../lib/auth-validation";
import { ROUTES } from "../../lib/routes";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { LINK_CLASSES } from "../ui/links";
import { PasswordInput } from "../ui/PasswordInput";

export interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
}

type FieldName = "email" | "password";
const FIELD_ORDER: readonly FieldName[] = ["email", "password"];

function validate(email: string, password: string) {
  return {
    email: isValidEmail(email) ? [] : ["Enter a valid email address"],
    password: password.length === 0 ? ["Password is required"] : [],
  };
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useFormErrors(validate(email, password), FIELD_ORDER);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.check(event.currentTarget)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ email, password });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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

      <Field label="Password" errors={form.errorsFor("password")}>
        {(control) => (
          <PasswordInput
            {...control}
            name="password"
            autoComplete="current-password"
            required
            disabled={isSubmitting}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => form.onBlur("password", password)}
          />
        )}
      </Field>

      <p className="text-right text-sm">
        <Link to={ROUTES.forgotPassword} className={LINK_CLASSES}>
          Forgot password?
        </Link>
      </p>

      <Button type="submit" loading={isSubmitting} className="w-full">
        {isSubmitting ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
