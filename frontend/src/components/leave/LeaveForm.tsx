import { useEffect, useId, useState, type FormEvent } from "react";
import { useFormErrors } from "../../hooks/useFormErrors";
import type { FieldErrors } from "../../lib/api-client";
import { classNames } from "../../lib/class-names";
import { toFormErrors } from "../../lib/form-errors";
import type { Job } from "../../lib/jobs-api";
import type { Leave, LeaveInput } from "../../lib/leave-api";
import { countedDays } from "../../lib/leave-days";
import { isBookableRange, leaveDraftErrors } from "../../lib/leave-validation";
import type { LeaveDraftField } from "../../lib/leave-validation";
import { pluralize } from "../../lib/plural";
import { formatCents, shiftEarningsCents } from "../../lib/shift-earnings";
import {
  formatDayList,
  formatDuration,
  formatSignedDuration,
} from "../../lib/shift-format";
import type { Shift } from "../../lib/shifts-api";
import { vacationBalance, vacationSettingOf } from "../../lib/vacation";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { chipClassName } from "../ui/chip";
import { DialogBody, DialogFooter } from "../ui/DialogParts";
import { Field } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

export type LeaveFormJob = Pick<
  Job,
  | "id"
  | "name"
  | "hourlyRate"
  | "vacationHoursPerYear"
  | "vacationCarryOverHours"
  | "vacationCarryOverYear"
>;

// The part of the draft that decides which shifts it overlaps.
export interface LeaveRange {
  jobId: string;
  startDate: string;
  endDate: string;
}

interface LeaveFormProps {
  // Only jobs that track paid vacation.
  jobs: LeaveFormJob[];
  defaultJobId?: string;
  // The entry being edited; without it the form books new leave.
  initialValues?: Leave;
  // The year's leave of every job, for what is left. Undefined while it is not
  // known (loading, or the request failed): the form then shows only the
  // draft's own hours and never warns about the allowance.
  existingLeave?: Leave[];
  // Shifts in the picked range, for the overlap warning.
  shiftsInRange: Shift[];
  today: string;
  // Called with the job and dates on open and whenever one of them changes.
  onRangeChange?: (range: LeaveRange) => void;
  onSubmit: (input: LeaveInput) => Promise<void>;
  onCancel: () => void;
}

interface RawValues {
  jobId: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  minutesPerDay: number;
  notes: string;
}

const FIELD_ORDER: readonly LeaveDraftField[] = [
  "jobId",
  "startDate",
  "endDate",
  "weekdays",
];

// Monday first; the values are the API's (0 is Sunday).
const WEEKDAY_CHOICES = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];
const WORKDAYS = [1, 2, 3, 4, 5];

// The usual lengths of a leave day, as quick choices. An entry being edited
// that has another length keeps it as a choice of its own.
const HALF_DAY_MINUTES = 120;
const MINUTES_CHOICES = [HALF_DAY_MINUTES, 240, 300, 360, 480];
const DEFAULT_MINUTES = 240;

function minutesLabel(minutes: number) {
  return minutes === HALF_DAY_MINUTES
    ? `Half day (${formatDuration(minutes)})`
    : formatDuration(minutes);
}

function initialValuesOf(
  jobs: LeaveFormJob[],
  defaultJobId: string | undefined,
  leave: Leave | undefined,
  today: string,
): RawValues {
  if (leave) {
    return {
      jobId: leave.jobId,
      startDate: leave.startDate,
      endDate: leave.endDate,
      weekdays: leave.weekdays,
      minutesPerDay: leave.minutesPerDay,
      notes: leave.notes ?? "",
    };
  }
  const preselected = jobs.some((job) => job.id === defaultJobId)
    ? defaultJobId
    : jobs.length === 1
      ? jobs[0]?.id
      : undefined;
  return {
    jobId: preselected ?? "",
    startDate: today,
    endDate: today,
    weekdays: WORKDAYS,
    minutesPerDay: DEFAULT_MINUTES,
    notes: "",
  };
}

function ErrorList({ id, errors }: { id?: string; errors: string[] }) {
  if (errors.length === 0) {
    return null;
  }
  return (
    <div id={id} role="alert" className="mt-1 text-sm text-danger">
      {errors.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}

export function LeaveForm({
  jobs,
  defaultJobId,
  initialValues,
  existingLeave,
  shiftsInRange,
  today,
  onRangeChange,
  onSubmit,
  onCancel,
}: LeaveFormProps) {
  const isEditing = initialValues !== undefined;
  const [values, setValues] = useState<RawValues>(() =>
    initialValuesOf(jobs, defaultJobId, initialValues, today),
  );
  // The clashing shifts the removal was ticked for: a different set of
  // shifts (another range or job) starts unticked again.
  const [removalTickedFor, setRemovalTickedFor] = useState<string | null>(null);
  // What the server said about the last attempt; cleared on the next one.
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useFormErrors(leaveDraftErrors(values), FIELD_ORDER);
  const weekdaysErrorId = useId();

  const { jobId, startDate, endDate } = values;
  useEffect(() => {
    onRangeChange?.({ jobId, startDate, endDate });
  }, [onRangeChange, jobId, startDate, endDate]);

  const job = jobs.find((candidate) => candidate.id === values.jobId);
  const days = isBookableRange(values)
    ? countedDays(values.startDate, values.endDate, values.weekdays)
    : [];
  const draftMinutes = days.length * values.minutesPerDay;

  const balance =
    job && existingLeave && days.length > 0
      ? vacationBalance({
          setting: vacationSettingOf(job),
          year: Number(values.startDate.slice(0, 4)),
          leave: existingLeave.filter(
            (entry) => entry.jobId === job.id && entry.id !== initialValues?.id,
          ),
          today,
        })
      : null;
  const leftAfter = balance ? balance.leftMinutes - draftMinutes : 0;

  const countedSet = new Set(days);
  const clashes = shiftsInRange.filter(
    (shift) => shift.jobId === values.jobId && countedSet.has(shift.date),
  );
  const clashDates = [...new Set(clashes.map((shift) => shift.date))].sort();
  const clashKey = clashes
    .map((shift) => shift.id)
    .sort()
    .join(",");
  const removeShifts = removalTickedFor === clashKey;

  const minutesChoices = [
    ...new Set([...MINUTES_CHOICES, values.minutesPerDay]),
  ].sort((a, b) => a - b);

  function setField<K extends keyof RawValues>(field: K, value: RawValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  // The end follows the start, so it is never before it.
  function setStartDate(start: string) {
    setValues((current) => ({
      ...current,
      startDate: start,
      endDate:
        start !== "" && (current.endDate === "" || current.endDate < start)
          ? start
          : current.endDate,
    }));
  }

  function toggleWeekday(day: number) {
    setValues((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day)
        ? current.weekdays.filter((picked) => picked !== day)
        : [...current.weekdays, day],
    }));
  }

  function errorsOf(field: LeaveDraftField | "minutesPerDay" | "notes") {
    const own =
      field === "minutesPerDay" || field === "notes"
        ? []
        : form.errorsFor(field);
    return [...own, ...(serverErrors[field] ?? [])];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.check(event.currentTarget)) {
      return;
    }

    const input: LeaveInput = {
      jobId: values.jobId,
      startDate: values.startDate,
      endDate: values.endDate,
      weekdays: [...values.weekdays].sort((a, b) => a - b),
      minutesPerDay: values.minutesPerDay,
      notes: values.notes.trim(),
    };
    // Only when booking: the API ignores it on an edit.
    if (!isEditing && removeShifts && clashes.length > 0) {
      input.removeOverlappingShifts = true;
    }

    setServerErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(input);
    } catch (error) {
      setServerErrors(toFormErrors(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const weekdaysErrors = errorsOf("weekdays");

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
                {jobs.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="From" errors={errorsOf("startDate")}>
              {(control) => (
                <Input
                  {...control}
                  name="startDate"
                  type="date"
                  required
                  disabled={isSubmitting}
                  value={values.startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  onBlur={() => form.onBlur("startDate", values.startDate)}
                />
              )}
            </Field>

            <Field label="To" errors={errorsOf("endDate")}>
              {(control) => (
                <Input
                  {...control}
                  name="endDate"
                  type="date"
                  required
                  min={values.startDate || undefined}
                  disabled={isSubmitting}
                  value={values.endDate}
                  onChange={(event) => setField("endDate", event.target.value)}
                  onBlur={() => form.onBlur("endDate", values.endDate)}
                />
              )}
            </Field>
          </div>

          {/* Named, and focusable from code, so a failed submit can move focus
              here when no day counts. */}
          <fieldset
            name="weekdays"
            tabIndex={-1}
            disabled={isSubmitting}
            aria-describedby={
              weekdaysErrors.length > 0 ? weekdaysErrorId : undefined
            }
            className="min-w-0"
          >
            <legend className="mb-1.5 text-sm font-medium text-ink">
              Days that count
            </legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_CHOICES.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  aria-pressed={values.weekdays.includes(day.value)}
                  onClick={() => toggleWeekday(day.value)}
                  className={chipClassName(
                    values.weekdays.includes(day.value),
                    "compact",
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <ErrorList id={weekdaysErrorId} errors={weekdaysErrors} />
          </fieldset>

          <fieldset disabled={isSubmitting} className="min-w-0">
            <legend className="mb-1.5 text-sm font-medium text-ink">
              Hours per day
            </legend>
            <div className="flex flex-wrap gap-2">
              {minutesChoices.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  aria-pressed={values.minutesPerDay === minutes}
                  onClick={() => setField("minutesPerDay", minutes)}
                  className={chipClassName(values.minutesPerDay === minutes)}
                >
                  {minutesLabel(minutes)}
                </button>
              ))}
            </div>
            <ErrorList errors={errorsOf("minutesPerDay")} />
          </fieldset>

          {/* What the leave counts for, so a wrong range shows before it is
              booked. */}
          <div
            aria-live="polite"
            className={classNames(
              "flex items-center justify-between gap-3 rounded-card px-3.5 py-2.5 text-sm",
              days.length > 0
                ? "bg-leave-soft text-leave-ink"
                : "bg-neutral-soft text-ink-muted",
            )}
          >
            {days.length > 0 ? (
              <>
                <span className="flex items-center gap-2">
                  <Icon name="sun" className="h-4 w-4 shrink-0" />
                  <span>
                    {`${pluralize(days.length, "day")} · ${formatDuration(draftMinutes)}`}
                    {balance &&
                      ` · leaves ${formatSignedDuration(leftAfter)} of ${formatDuration(
                        balance.entitlementMinutes + balance.carriedOverMinutes,
                      )}`}
                  </span>
                </span>
                {job && (
                  <strong className="text-lg tabular-nums">
                    {formatCents(
                      shiftEarningsCents({ job, workedMinutes: draftMinutes }),
                    )}
                  </strong>
                )}
              </>
            ) : (
              <span>
                Pick the dates and the days that count to see the hours and pay.
              </span>
            )}
          </div>

          {balance && leftAfter < 0 && (
            <Alert tone="warning" role="alert">
              {`This is ${formatDuration(-leftAfter)} more than you have left this year. You can still book it.`}
            </Alert>
          )}

          {clashes.length > 0 && (
            <Alert tone="warning" role="alert">
              <p>
                {`You have ${pluralize(clashes.length, "shift")} on these days (${formatDayList(clashDates)}).`}
              </p>
              {!isEditing && (
                <label className="mt-1 flex min-h-11 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={removeShifts}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      setRemovalTickedFor(
                        event.target.checked ? clashKey : null,
                      )
                    }
                    className="h-5 w-5 shrink-0 accent-accent"
                  />
                  {`Remove ${clashes.length === 1 ? "it" : "them"} when I add this leave`}
                </label>
              )}
            </Alert>
          )}

          <Field label="Notes (optional)" errors={errorsOf("notes")}>
            {(control) => (
              <Textarea
                {...control}
                name="notes"
                rows={2}
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
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : isEditing
              ? "Save changes"
              : "Add paid leave"}
        </Button>
      </DialogFooter>
    </form>
  );
}
