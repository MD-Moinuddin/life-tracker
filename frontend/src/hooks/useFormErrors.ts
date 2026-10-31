import { useState } from "react";

export type FormFieldErrors<K extends string> = Partial<Record<K, string[]>>;

// When a form shows its errors: a field's error appears once the visitor has
// typed in it and left it, or after they press submit, and goes away as soon as
// the field is right (the errors passed in are recomputed on every change).
// A failed submit moves focus to the first field with an error.
export function useFormErrors<K extends string>(
  errors: FormFieldErrors<K>,
  order: readonly K[],
) {
  const [touched, setTouched] = useState<ReadonlySet<K>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  return {
    errorsFor: (name: K): string[] =>
      submitted || touched.has(name) ? (errors[name] ?? []) : [],

    // Call when a field loses focus. Tabbing through an empty field says
    // nothing; only a field that has been typed in starts to show errors.
    onBlur: (name: K, value: string) => {
      if (value !== "") {
        setTouched((current) => new Set(current).add(name));
      }
    },

    // Call on submit. True when the form can go ahead; otherwise it shows every
    // error and focuses the first field that has one.
    check: (form: HTMLFormElement): boolean => {
      setSubmitted(true);
      const first = order.find((name) => (errors[name]?.length ?? 0) > 0);
      if (first === undefined) {
        return true;
      }
      const control = form.elements.namedItem(first);
      if (control instanceof HTMLElement) {
        control.focus();
      }
      return false;
    },

    isShown: (name: K): boolean => submitted || touched.has(name),
  };
}
