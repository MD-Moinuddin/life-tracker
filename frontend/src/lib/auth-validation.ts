// The one place that decides what counts as a valid email address on the
// login, signup and reset forms.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

// The password rules, mirrored from the backend's passwordSchema. Signup and
// the reset page both use this, so a rule changes in one place here.
export function passwordErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (password.length > 72) {
    errors.push("Password must be at most 72 characters");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain a lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain an uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain a number");
  }

  return errors;
}

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

// The rules a visitor can tick off while typing. They are the same checks as
// passwordErrors above, worded as short labels; the upper limit is not listed
// because nobody reaches it by accident.
export const PASSWORD_RULES: readonly PasswordRule[] = [
  { label: "8 or more characters", test: (value) => value.length >= 8 },
  { label: "A lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "An uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "A number", test: (value) => /[0-9]/.test(value) },
];

export const PASSWORD_RULES_MESSAGE =
  "Choose a password that meets all the rules";
export const PASSWORD_TOO_LONG_MESSAGE =
  "Password must be at most 72 characters";

// The single line shown under a new-password field when it is not acceptable.
// The checklist underneath says which rules are missing.
export function newPasswordError(password: string): string | null {
  if (password.length > 72) {
    return PASSWORD_TOO_LONG_MESSAGE;
  }
  return passwordErrors(password).length > 0 ? PASSWORD_RULES_MESSAGE : null;
}
