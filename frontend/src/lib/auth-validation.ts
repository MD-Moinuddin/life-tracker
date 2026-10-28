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
