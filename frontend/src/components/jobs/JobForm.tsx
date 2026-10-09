import { useState, type FormEvent } from "react";
import type { FieldErrors } from "../../lib/api-client";
import { toFormErrors } from "../../lib/form-errors";
import type { JobInput, JobType } from "../../lib/jobs-api";
import { parseEuroInput } from "../../lib/money";
import { Field } from "../ui/Field";
import {
  INPUT_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from "../form/form-styles";
import { Spinner } from "../Spinner";
import { JOB_TYPE_LABELS } from "./job-types";

interface JobFormProps {
  initialValues?: JobInput;
  submitLabel: string;
  onSubmit: (values: JobInput) => Promise<void>;
  onCancel?: () => void;
}

function parseForm(
  name: string,
  hourlyRate: string,
  type: JobType,
): { values: JobInput } | { errors: FieldErrors } {
  const errors: FieldErrors = {};
  const rate = parseEuroInput(hourlyRate);

  if (name.trim().length === 0) {
    errors.name = ["Name is required"];
  }
  if (rate === null) {
    errors.hourlyRate = [
      "Enter the hourly rate as an amount, for example 12.50",
    ];
  }

  if (rate === null || errors.name) {
    return { errors };
  }
  return { values: { name: name.trim(), hourlyRate: rate, type } };
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseForm(name, hourlyRate, type);
    if ("errors" in parsed) {
      setErrors(parsed.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(parsed.values);
    } catch (error) {
      setErrors(toFormErrors(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {errors.form && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errors.form.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <Field label="Name" errors={errors.name}>
        {(control) => (
          <input
            {...control}
            type="text"
            autoComplete="off"
            required
            maxLength={100}
            disabled={isSubmitting}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={INPUT_CLASSES}
          />
        )}
      </Field>

      <Field label="Hourly rate (€)" errors={errors.hourlyRate}>
        {(control) => (
          <input
            {...control}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="12.50"
            required
            disabled={isSubmitting}
            value={hourlyRate}
            onChange={(event) => setHourlyRate(event.target.value)}
            className={INPUT_CLASSES}
          />
        )}
      </Field>

      <Field label="Type" errors={errors.type}>
        {(control) => (
          <select
            {...control}
            disabled={isSubmitting}
            value={type}
            onChange={(event) => setType(event.target.value as JobType)}
            className={INPUT_CLASSES}
          >
            {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={PRIMARY_BUTTON_CLASSES}
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={SECONDARY_BUTTON_CLASSES}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
