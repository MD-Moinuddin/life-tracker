import { useState, type FormEvent } from "react";
import { isValidEmail } from "../../lib/auth-validation";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";

export interface SignupFormValues {
  name: string;
  email: string;
  password: string;
}

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => Promise<void>;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string[];
}

function validate(name: string, email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (name.trim().length === 0) {
    errors.name = "Name is required";
  }

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address";
  }

  const passwordErrors: string[] = [];
  if (password.length < 8) {
    passwordErrors.push("Password must be at least 8 characters");
  }
  if (password.length > 72) {
    passwordErrors.push("Password must be at most 72 characters");
  }
  if (!/[a-z]/.test(password)) {
    passwordErrors.push("Password must contain a lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    passwordErrors.push("Password must contain an uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    passwordErrors.push("Password must contain a number");
  }
  if (passwordErrors.length > 0) {
    errors.password = passwordErrors;
  }

  return errors;
}

export function SignupForm({ onSubmit }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(name, email, password);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit({ name: name.trim(), email, password });
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Name" errors={errors.name ? [errors.name] : []}>
        {(control) => (
          <Input
            {...control}
            type="text"
            autoComplete="name"
            required
            disabled={isSubmitting}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>

      <Field label="Email" errors={errors.email ? [errors.email] : []}>
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

      <Field label="Password" errors={errors.password ?? []}>
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
        {isSubmitting ? "Signing up…" : "Sign up"}
      </Button>
    </form>
  );
}
