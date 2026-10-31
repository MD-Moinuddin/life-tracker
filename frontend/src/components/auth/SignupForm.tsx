import { useState, type FormEvent } from "react";
import { useFormErrors } from "../../hooks/useFormErrors";
import { isValidEmail, newPasswordError } from "../../lib/auth-validation";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";
import { PasswordRules } from "./PasswordRules";

export interface SignupFormValues {
  name: string;
  email: string;
  password: string;
}

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => Promise<void>;
}

type FieldName = "name" | "email" | "password";
const FIELD_ORDER: readonly FieldName[] = ["name", "email", "password"];

function validate(name: string, email: string, password: string) {
  const passwordError = newPasswordError(password);
  return {
    name: name.trim().length === 0 ? ["Name is required"] : [],
    email: isValidEmail(email) ? [] : ["Enter a valid email address"],
    password: passwordError ? [passwordError] : [],
  };
}

export function SignupForm({ onSubmit }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useFormErrors(validate(name, email, password), FIELD_ORDER);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.check(event.currentTarget)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), email, password });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field
        label="Name"
        hint="We'll use this to greet you."
        errors={form.errorsFor("name")}
      >
        {(control) => (
          <Input
            {...control}
            name="name"
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            required
            disabled={isSubmitting}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => form.onBlur("name", name)}
          />
        )}
      </Field>

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

      <div>
        <Field label="Password" errors={form.errorsFor("password")}>
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
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
