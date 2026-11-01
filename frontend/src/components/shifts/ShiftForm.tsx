import { useState, type FormEvent } from "react";
import { useFormErrors } from "../../hooks/useFormErrors";
import type { FieldErrors } from "../../lib/api-client";
import { classNames } from "../../lib/class-names";
import { localNow } from "../../lib/dates";
import { toFormErrors } from "../../lib/form-errors";
import type { Job } from "../../lib/jobs-api";
import { readLastJobId, saveLastJobId } from "../../lib/last-job";
import { formatCents, shiftEarningsCents } from "../../lib/shift-earnings";
import { formatDuration } from "../../lib/shift-format";
import { shiftLengthMinutes, workedMinutes } from "../../lib/shift-time";
import type { ShiftInput } from "../../lib/shifts-api";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { chipClassName } from "../ui/chip";
import { DialogBody, DialogFooter } from "../ui/DialogParts";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

interface ShiftFormProps {
  jobs: (Pick<Job, "id" | "name"> & { hourlyRate?: string })[];
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
  breakMinutes: number;
  notes: string;
}

type FieldName = "jobId" | "date" | "startTime" | "endTime" | "breakMinutes";
const FIELD_ORDER: readonly FieldName[] = [
  "jobId",
  "date",
  "startTime",
  "endTime",
  "breakMinutes",
];

// The usual breaks, as quick choices. A shift being edited that has another
// break keeps it as a choice of its own.
const BREAK_CHOICES = [0, 15, 30, 45, 60];

function breakLabel(minutes: number) {
  return minutes === 0 ? "None" : `${minutes} min`;
}

// What is wrong with the form as it stands, in the backend's words.
function validate(raw: RawValues) {
  const errors: Record<FieldName, string[]> = {
    jobId: raw.jobId === "" ? ["Choose a job"] : [],
    date: raw.date === "" ? ["Choose a date"] : [],
    startTime: raw.startTime === "" ? ["Enter a start time"] : [],
    endTime: raw.endTime === "" ? ["Enter an end time"] : [],
    breakMinutes: [],
  };
  if (raw.startTime !== "" && raw.endTime !== "") {
    const length = shiftLengthMinutes(raw.startTime, raw.endTime);
    if (length === 0) {
      errors.endTime = ["End time must be different from start time"];
    } else if (raw.breakMinutes > length) {
      errors.breakMinutes = ["Break cannot be longer than the shift"];
    }
  }
  return errors;
}

// The hours and earnings the shift will count for, so a wrong time or job shows
// before the shift is saved.
function Summary({
  raw,
  hourlyRate,
}: {
  raw: RawValues;
  hourlyRate: string | undefined;
}) {
  const isComplete =
    raw.jobId !== "" && raw.startTime !== "" && raw.endTime !== "";
  const length = isComplete
    ? shiftLengthMinutes(raw.startTime, raw.endTime)
    : 0;
  const worked = isComplete
    ? workedMinutes(raw.startTime, raw.endTime, raw.breakMinutes)
    : 0;
  const isValid = isComplete && length > 0 && worked > 0;

  return (
    <div
      aria-live="polite"
      className={classNames(
        "flex items-center justify-between gap-3 rounded-card px-3.5 py-2.5 text-sm",
        isValid
          ? "bg-accent-soft text-accent-ink"
          : "bg-neutral-soft text-ink-muted",
      )}
    >
      {isValid ? (
        <>
          <span>{`${formatDuration(worked)} worked`}</span>
          {hourlyRate !== undefined && (
            <strong className="text-lg tabular-nums">
              {formatCents(
                shiftEarningsCents({
                  job: { hourlyRate },
                  workedMinutes: worked,
                }),
              )}
            </strong>
          )}
        </>
      ) : (
        <span>
          Choose a job and enter the times to see the hours and earnings.
        </span>
      )}
    </div>
  );
}

export function ShiftForm({
  jobs,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ShiftFormProps) {
  const [values, setValues] = useState<RawValues>(() => {
    const lastJobId = readLastJobId();
    const remembered = jobs.some((job) => job.id === lastJobId)
      ? (lastJobId ?? "")
      : "";
    return {
      jobId:
        initialValues?.jobId ??
        (jobs.length === 1 ? (jobs[0]?.id ?? "") : remembered),
      date: initialValues?.date ?? localNow().slice(0, 10),
      startTime: initialValues?.startTime ?? "",
      endTime: initialValues?.endTime ?? "",
      breakMinutes: initialValues?.breakMinutes ?? 0,
      notes: initialValues?.notes ?? "",
    };
  });
  // What the server said about the last attempt; cleared on the next one.
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useFormErrors(validate(values), FIELD_ORDER);

  const endsNextDay =
    values.startTime !== "" &&
    values.endTime !== "" &&
    values.endTime < values.startTime;
  const breakChoices = [
    ...new Set([...BREAK_CHOICES, values.breakMinutes]),
  ].sort((a, b) => a - b);
  const hourlyRate = jobs.find((job) => job.id === values.jobId)?.hourlyRate;

  function setField<K extends keyof RawValues>(field: K, value: RawValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function errorsOf(field: FieldName) {
    return [...form.errorsFor(field), ...(serverErrors[field] ?? [])];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.check(event.currentTarget)) {
      return;
    }

    setServerErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit({
        jobId: values.jobId,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        breakMinutes: values.breakMinutes,
        notes: values.notes.trim(),
      });
      if (!initialValues) {
        saveLastJobId(values.jobId);
      }
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

          <Field label="Job" errors={errorsOf("jobId")}>
            {(control) => (
              <Select
                {...control}
                name="jobId"
                disabled={isSubmitting}
                value={values.jobId}
                onChange={(event) => setField("jobId", event.target.value)}
                onBlur={() => form.onBlur("jobId", values.jobId)}
              >
                <option value="">Choose a job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Date" errors={errorsOf("date")}>
            {(control) => (
              <Input
                {...control}
                name="date"
                type="date"
                required
                disabled={isSubmitting}
                value={values.date}
                onChange={(event) => setField("date", event.target.value)}
                onBlur={() => form.onBlur("date", values.date)}
              />
            )}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start time" errors={errorsOf("startTime")}>
              {(control) => (
                <Input
                  {...control}
                  name="startTime"
                  type="time"
                  required
                  disabled={isSubmitting}
                  value={values.startTime}
                  onChange={(event) =>
                    setField("startTime", event.target.value)
                  }
                  onBlur={() => form.onBlur("startTime", values.startTime)}
                />
              )}
            </Field>

            <Field
              label="End time"
              hint={endsNextDay ? "This shift ends the next day." : undefined}
              errors={errorsOf("endTime")}
            >
              {(control) => (
                <Input
                  {...control}
                  name="endTime"
                  type="time"
                  required
                  disabled={isSubmitting}
                  value={values.endTime}
                  onChange={(event) => setField("endTime", event.target.value)}
                  onBlur={() => form.onBlur("endTime", values.endTime)}
                />
              )}
            </Field>
          </div>

          <fieldset disabled={isSubmitting} className="min-w-0">
            <legend className="mb-1.5 text-sm font-medium text-ink">
              Break
            </legend>
            <div className="flex flex-wrap gap-2">
              {breakChoices.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  aria-pressed={values.breakMinutes === minutes}
                  onClick={() => setField("breakMinutes", minutes)}
                  className={chipClassName(values.breakMinutes === minutes)}
                >
                  {breakLabel(minutes)}
                </button>
              ))}
            </div>
            {errorsOf("breakMinutes").length > 0 && (
              <div role="alert" className="mt-1 text-sm text-danger">
                {errorsOf("breakMinutes").map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            )}
          </fieldset>

          <Summary raw={values} hourlyRate={hourlyRate} />

          <Field label="Notes (optional)" errors={serverErrors.notes}>
            {(control) => (
              <Textarea
                {...control}
                rows={3}
                maxLength={500}
                disabled={isSubmitting}
                value={values.notes}
                onChange={(event) => setField("notes", event.target.value)}
              />
            )}
          </Field>
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
