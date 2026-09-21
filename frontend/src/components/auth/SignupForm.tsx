import { useId, useState, type FormEvent } from "react";

export interface SignupFormValues {
  name: string;
  email: string;
  password: string;
}

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string[];
}

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(name, email, password);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit({ name: name.trim(), email, password });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor={nameId}>Name</label>
        <input
          id={nameId}
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? nameErrorId : undefined}
        />
        {errors.name && (
          <p id={nameErrorId} role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? emailErrorId : undefined}
        />
        {errors.email && (
          <p id={emailErrorId} role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={passwordId}>Password</label>
        <input
          id={passwordId}
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? passwordErrorId : undefined}
        />
        {errors.password && (
          <ul id={passwordErrorId} role="alert">
            {errors.password.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>

      <button type="submit">Sign up</button>
    </form>
  );
}
