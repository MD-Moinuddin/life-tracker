import { useState, type FormEvent } from "react";
import { useFormErrors } from "../../hooks/useFormErrors";
import type { FieldErrors } from "../../lib/api-client";
import { classNames } from "../../lib/class-names";
import { toFormErrors } from "../../lib/form-errors";
import type { JobInput, JobType } from "../../lib/jobs-api";
import { parseEuroInput } from "../../lib/money";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { DialogBody, DialogFooter } from "../ui/DialogParts";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { JOB_TYPE_DESCRIPTIONS, JOB_TYPE_LABELS } from "./job-types";

interface JobFormProps {
  initialValues?: JobInput;
  submitLabel: string;
  onSubmit: (values: JobInput) => Promise<void>;
  onCancel?: () => void;
}

type FieldName = "name" | "hourlyRate";
const FIELD_ORDER: readonly FieldName[] = ["name", "hourlyRate"];

const RATE_MESSAGE = "Enter the hourly rate as an amount, for example 12.50";
const JOB_TYPES = Object.keys(JOB_TYPE_LABELS) as JobType[];

function validate(name: string, hourlyRate: string) {
  return {
    name: name.trim().length === 0 ? ["Name is required"] : [],
    hourlyRate: parseEuroInput(hourlyRate) === null ? [RATE_MESSAGE] : [],
  };
}

export function JobForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: JobFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [hourlyRate, setHourlyRate] = useState(initialValues?.hourlyRate ?? "");
  const [type, setType] = useState<JobType>(initialValues?.type ?? "part_time");
  // What the server said about the last attempt; cleared on the next one.
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useFormErrors(validate(name, hourlyRate), FIELD_ORDER);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.check(event.currentTarget)) {
      return;
    }

    setServerErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        hourlyRate: parseEuroInput(hourlyRate) ?? hourlyRate,
        type,
      });
    } catch (error) {
      setServerErrors(toFormErrors(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex min-h-0 flex-auto flex-col"
    >
      <DialogBody>
        <div className="space-y-4">
          {serverErrors.form && (
            <Alert tone="danger" role="alert">
              {serverErrors.form.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </Alert>
          )}

          <Field
            label="Name"
            errors={[...form.errorsFor("name"), ...(serverErrors.name ?? [])]}
          >
            {(control) => (
              <Input
                {...control}
                name="name"
                type="text"
                autoComplete="off"
                required
                maxLength={100}
                disabled={isSubmitting}
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => form.onBlur("name", name)}
              />
            )}
          </Field>

          <Field
            label="Hourly rate"
            errors={[
              ...form.errorsFor("hourlyRate"),
              ...(serverErrors.hourlyRate ?? []),
            ]}
          >
            {(control) => (
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted"
                >
                  €
                </span>
                <Input
                  {...control}
                  name="hourlyRate"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="12.50"
                  required
                  className="pl-7"
                  disabled={isSubmitting}
                  value={hourlyRate}
                  onChange={(event) => setHourlyRate(event.target.value)}
                  onBlur={() => form.onBlur("hourlyRate", hourlyRate)}
                />
              </div>
            )}
          </Field>

          <fieldset disabled={isSubmitting} className="min-w-0">
            <legend className="mb-1 text-sm font-medium text-ink">Type</legend>
            <div className="grid gap-2.5">
              {JOB_TYPES.map((value) => (
                <label
                  key={value}
                  className={classNames(
                    "grid cursor-pointer grid-cols-[auto_1fr] gap-x-3 rounded-card border px-3.5 py-3",
                    type === value
                      ? "border-accent bg-accent-soft/35 ring-1 ring-accent"
                      : "border-border-strong bg-surface",
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    checked={type === value}
                    onChange={() => setType(value)}
                    className="mt-1 row-span-2 h-4.5 w-4.5 accent-accent"
                  />
                  <span className="font-semibold text-ink">
                    {JOB_TYPE_LABELS[value]}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {JOB_TYPE_DESCRIPTIONS[value]}
                  </span>
                </label>
              ))}
            </div>
            {serverErrors.type && (
              <p role="alert" className="mt-1 text-sm text-danger">
                {serverErrors.type.join(" ")}
              </p>
            )}
          </fieldset>
        </div>
      </DialogBody>

      <DialogFooter>
        {onCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
