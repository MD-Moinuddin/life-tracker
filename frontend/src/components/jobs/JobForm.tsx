import { useState, type FormEvent } from "react";
import type { FieldErrors } from "../../lib/api-client";
import { toFormErrors } from "../../lib/form-errors";
import type { JobInput, JobType } from "../../lib/jobs-api";
import { parseEuroInput } from "../../lib/money";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
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
        <Alert tone="danger" role="alert">
          {errors.form.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </Alert>
      )}

      <Field label="Name" errors={errors.name}>
        {(control) => (
          <Input
            {...control}
            type="text"
            autoComplete="off"
            required
            maxLength={100}
            disabled={isSubmitting}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>

      <Field label="Hourly rate (€)" errors={errors.hourlyRate}>
        {(control) => (
          <Input
            {...control}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="12.50"
            required
            disabled={isSubmitting}
            value={hourlyRate}
            onChange={(event) => setHourlyRate(event.target.value)}
          />
        )}
      </Field>

      <Field label="Type" errors={errors.type}>
        {(control) => (
          <Select
            {...control}
            disabled={isSubmitting}
            value={type}
            onChange={(event) => setType(event.target.value as JobType)}
          >
            {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
