import { useState, type FormEvent } from "react";
import type { FieldErrors } from "../../lib/api-client";
import { localNow } from "../../lib/dates";
import { toFormErrors } from "../../lib/form-errors";
import type { Job } from "../../lib/jobs-api";
import type { ShiftInput } from "../../lib/shifts-api";
import { FormField } from "../form/FormField";
import {
  INPUT_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from "../form/form-styles";
import { Spinner } from "../Spinner";

interface ShiftFormProps {
  jobs: Pick<Job, "id" | "name">[];
  initialValues?: ShiftInput;
  submitLabel: string;
  onSubmit: (values: ShiftInput) => Promise<void>;
  onCancel?: () => void;
}

interface RawValues {
  jobId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: string;
  notes: string;
}

function parseForm(
  raw: RawValues,
): { values: ShiftInput } | { errors: FieldErrors } {
  const errors: FieldErrors = {};

  if (raw.jobId === "") {
    errors.jobId = ["Choose a job"];
  }
  if (raw.date === "") {
    errors.date = ["Choose a date"];
  }
  if (raw.startTime === "") {
    errors.startTime = ["Enter a start time"];
  }
  if (raw.endTime === "") {
    errors.endTime = ["Enter an end time"];
  }
  if (!/^\d+$/.test(raw.breakMinutes)) {
    errors.breakMinutes = ["Enter the break in whole minutes, or 0 for none"];
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }
  return {
    values: {
      jobId: raw.jobId,
      date: raw.date,
      startTime: raw.startTime,
      endTime: raw.endTime,
      breakMinutes: Number(raw.breakMinutes),
      notes: raw.notes.trim(),
    },
  };
}

export function ShiftForm({
  jobs,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ShiftFormProps) {
  const [values, setValues] = useState<RawValues>(() => ({
    jobId:
      initialValues?.jobId ?? (jobs.length === 1 ? (jobs[0]?.id ?? "") : ""),
    date: initialValues?.date ?? localNow().slice(0, 10),
    startTime: initialValues?.startTime ?? "",
    endTime: initialValues?.endTime ?? "",
    breakMinutes: String(initialValues?.breakMinutes ?? 0),
    notes: initialValues?.notes ?? "",
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const endsNextDay =
    values.startTime !== "" &&
    values.endTime !== "" &&
    values.endTime < values.startTime;

  function setField(field: keyof RawValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseForm(values);
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

      <FormField label="Job" errors={errors.jobId}>
        {(control) => (
          <select
            {...control}
            disabled={isSubmitting}
            value={values.jobId}
            onChange={(event) => setField("jobId", event.target.value)}
            className={INPUT_CLASSES}
          >
            <option value="">Choose a job</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.name}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField label="Date" errors={errors.date}>
        {(control) => (
          <input
            {...control}
            type="date"
            required
            disabled={isSubmitting}
            value={values.date}
            onChange={(event) => setField("date", event.target.value)}
            className={INPUT_CLASSES}
          />
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start time" errors={errors.startTime}>
          {(control) => (
            <input
              {...control}
              type="time"
              required
              disabled={isSubmitting}
              value={values.startTime}
              onChange={(event) => setField("startTime", event.target.value)}
              className={INPUT_CLASSES}
            />
          )}
        </FormField>

        <FormField
          label="End time"
          hint={endsNextDay ? "This shift ends the next day." : undefined}
          errors={errors.endTime}
        >
          {(control) => (
            <input
              {...control}
              type="time"
              required
              disabled={isSubmitting}
              value={values.endTime}
              onChange={(event) => setField("endTime", event.target.value)}
              className={INPUT_CLASSES}
            />
          )}
        </FormField>
      </div>

      <FormField label="Break (minutes)" errors={errors.breakMinutes}>
        {(control) => (
          <input
            {...control}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            disabled={isSubmitting}
            value={values.breakMinutes}
            onChange={(event) => setField("breakMinutes", event.target.value)}
            className={INPUT_CLASSES}
          />
        )}
      </FormField>

      <FormField label="Notes (optional)" errors={errors.notes}>
        {(control) => (
          <textarea
            {...control}
            rows={3}
            maxLength={500}
            disabled={isSubmitting}
            value={values.notes}
            onChange={(event) => setField("notes", event.target.value)}
            className={INPUT_CLASSES}
          />
        )}
      </FormField>

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
