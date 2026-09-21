import { useId, useState, type FormEvent } from "react";

export interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const INPUT_CLASSES =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 aria-invalid:border-red-500";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address";
  }
  if (password.length === 0) {
    errors.password = "Password is required";
  }

  return errors;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const emailId = useId();
  const emailErrorId = useId();
  const passwordId = useId();
  const passwordErrorId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(email, password);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit({ email, password });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? passwordErrorId : undefined}
          className={INPUT_CLASSES}
        />
        {errors.password && (
          <p
            id={passwordErrorId}
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Log in
      </button>
    </form>
  );
}
