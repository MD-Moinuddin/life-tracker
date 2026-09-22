import { useId, useState, type FormEvent } from "react";
import { Spinner } from "../Spinner";

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

const INPUT_CLASSES =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 aria-invalid:border-red-500 disabled:bg-slate-100 disabled:text-slate-500";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(name: string, email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (name.trim().length === 0) {
    errors.name = "Name is required";
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address";
  }

  const passwordErrors: string[] = [];
  if (password.length < 8) {
    passwordErrors.push("Password must be at least 8 characters");
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
  const nameId = useId();
  const nameErrorId = useId();
  const emailId = useId();
  const emailErrorId = useId();
  const passwordId = useId();
  const passwordErrorId = useId();

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
      <div>
        <label
          htmlFor={nameId}
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="name"
          required
          disabled={isSubmitting}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? nameErrorId : undefined}
          className={INPUT_CLASSES}
        />
        {errors.name && (
          <p
            id={nameErrorId}
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor={emailId}
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          required
          disabled={isSubmitting}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? emailErrorId : undefined}
          className={INPUT_CLASSES}
        />
        {errors.email && (
          <p
            id={emailErrorId}
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor={passwordId}
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? passwordErrorId : undefined}
          className={INPUT_CLASSES}
        />
        {errors.password && (
          <ul
            id={passwordErrorId}
            role="alert"
            className="mt-1 list-inside list-disc text-sm text-red-600"
          >
            {errors.password.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Spinner />
            Signing up…
          </>
        ) : (
          "Sign up"
        )}
      </button>
    </form>
  );
}
