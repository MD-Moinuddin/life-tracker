import { useState, type FormEvent } from "react";
import { useFormErrors } from "../../hooks/useFormErrors";
import type { FieldErrors } from "../../lib/api-client";
import { classNames } from "../../lib/class-names";
import { toFormErrors } from "../../lib/form-errors";
import type { JobInput, JobType } from "../../lib/jobs-api";
import { localNow } from "../../lib/dates";
import { parseEuroInput } from "../../lib/money";
import { tracksVacation } from "../../lib/vacation";
import { parseHoursInput } from "../../lib/vacation-input";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { DialogBody, DialogFooter } from "../ui/DialogParts";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { VacationFields, type VacationValue } from "./VacationFields";
import { JOB_TYPE_DESCRIPTIONS, JOB_TYPE_LABELS } from "./job-types";

interface JobFormProps {
  initialValues?: JobInput;
  submitLabel: string;
  onSubmit: (values: JobInput) => Promise<void>;
  onCancel?: () => void;
}

type FieldName =
  "name" | "hourlyRate" | "vacationHoursPerYear" | "vacationCarryOverHours";
const FIELD_ORDER: readonly FieldName[] = [
  "name",
  "hourlyRate",
  "vacationHoursPerYear",
  "vacationCarryOverHours",
];

const RATE_MESSAGE = "Enter the hourly rate as an amount, for example 12.50";
const HOURS_MESSAGE = "Enter the hours per year, for example 80";
const CARRY_OVER_MESSAGE = "Enter the carried-over hours, for example 8";
const JOB_TYPES = Object.keys(JOB_TYPE_LABELS) as JobType[];

// Empty carried-over hours mean 0.
function parseCarryOver(input: string): string | null {
  return input.trim() === ""
    ? "0"
    : parseHoursInput(input, { allowZero: true });
}

function initialVacation(initialValues?: JobInput): VacationValue {
  const carriedOver = Number(initialValues?.vacationCarryOverHours ?? 0);
  return {
    enabled: initialValues !== undefined && tracksVacation(initialValues),
    hoursPerYear: initialValues?.vacationHoursPerYear ?? "",
    carriedOverHours:
      carriedOver > 0 ? (initialValues?.vacationCarryOverHours ?? "") : "",
  };
}

function validate(name: string, hourlyRate: string, vacation: VacationValue) {
  return {
    name: name.trim().length === 0 ? ["Name is required"] : [],
    hourlyRate: parseEuroInput(hourlyRate) === null ? [RATE_MESSAGE] : [],
    vacationHoursPerYear:
      vacation.enabled && parseHoursInput(vacation.hoursPerYear) === null
        ? [HOURS_MESSAGE]
        : [],
    vacationCarryOverHours:
      vacation.enabled && parseCarryOver(vacation.carriedOverHours) === null
        ? [CARRY_OVER_MESSAGE]
        : [],
  };
}

// The vacation part of the request. A job without vacation sends the "off"
// values so turning the switch off clears what was stored.
function vacationInput(vacation: VacationValue, initialValues?: JobInput) {
  const hours = vacation.enabled
    ? parseHoursInput(vacation.hoursPerYear)
    : null;
  const carriedOver = vacation.enabled
    ? parseCarryOver(vacation.carriedOverHours)
    : null;
  if (hours === null || carriedOver === null) {
    return {
      vacationHoursPerYear: null,
      vacationCarryOverHours: "0",
      vacationCarryOverYear: null,
    };
  }
  // Carry-over that was already stored keeps its year; only new or changed
  // hours belong to the current year.
  const storedYear = initialValues?.vacationCarryOverYear ?? null;
  const unchanged =
    initialValues !== undefined &&
    tracksVacation(initialValues) &&
    storedYear !== null &&
    Number(carriedOver) === Number(initialValues.vacationCarryOverHours ?? 0);
  return {
    vacationHoursPerYear: hours,
    vacationCarryOverHours: carriedOver,
    vacationCarryOverYear:
      Number(carriedOver) <= 0
        ? null
        : unchanged
          ? storedYear
          : Number(localNow().slice(0, 4)),
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
  const [vacation, setVacation] = useState(() =>
    initialVacation(initialValues),
  );
  const form = useFormErrors(validate(name, hourlyRate, vacation), FIELD_ORDER);

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
        ...vacationInput(vacation, initialValues),
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

          <VacationFields
            value={vacation}
            onChange={setVacation}
            disabled={isSubmitting}
            errors={{
              hoursPerYear: [
                ...form.errorsFor("vacationHoursPerYear"),
                ...(serverErrors.vacationHoursPerYear ?? []),
              ],
              carriedOverHours: [
                ...form.errorsFor("vacationCarryOverHours"),
                ...(serverErrors.vacationCarryOverHours ?? []),
              ],
            }}
            onBlur={(field, value) =>
              form.onBlur(
                field === "hoursPerYear"
                  ? "vacationHoursPerYear"
                  : "vacationCarryOverHours",
                value,
              )
            }
          />
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
