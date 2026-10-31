// The shared look of text-like form controls. Input and Select both use it, so
// changing how controls look is a one-line edit here. Below 16px a phone zooms
// the page in when a control is focused, so controls are 16px on a phone.
export const CONTROL_CLASSES =
  "min-h-11 w-full rounded-control border border-control-border bg-surface px-3 py-2 text-sm max-sm:text-base text-ink placeholder:text-ink-muted aria-invalid:border-danger disabled:bg-page disabled:text-ink-muted";
