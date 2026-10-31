import {
  calculatorHours,
  CALCULATOR_WEEKS,
  parseHoursInput,
} from "../../lib/vacation-input";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

export interface VacationValue {
  enabled: boolean;
  hoursPerYear: string;
  // Only feeds the calculator; never sent to the server.
  weeklyHours?: string;
  carriedOverHours: string;
}

export interface VacationErrors {
  hoursPerYear?: string[];
  carriedOverHours?: string[];
}

interface VacationFieldsProps {
  value: VacationValue;
  onChange: (value: VacationValue) => void;
  disabled: boolean;
  errors: VacationErrors;
  onBlur?: (name: "hoursPerYear" | "carriedOverHours", value: string) => void;
}

export function VacationFields({
  value,
  onChange,
  disabled,
  errors,
  onBlur,
}: VacationFieldsProps) {
  const weeklyHours = value.weeklyHours ?? "";
  const calculated = calculatorHours(weeklyHours);

  return (
    <div className="rounded-card border border-border-strong bg-surface px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">Paid vacation</p>
          <p className="text-sm text-ink-muted">
            Track the leave you can take with pay
          </p>
        </div>
        <label className="relative block h-11 w-14 shrink-0">
          <input
            type="checkbox"
            role="switch"
            aria-label="Track paid vacation"
            checked={value.enabled}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, enabled: event.target.checked })
            }
            className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className="absolute top-2 left-1 h-7 w-12 rounded-full bg-control-border transition-colors after:absolute after:top-[3px] after:left-[3px] after:h-[22px] after:w-[22px] after:rounded-full after:bg-surface after:shadow-card after:transition-all after:content-[''] peer-checked:bg-accent peer-checked:after:left-[23px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:opacity-60"
          />
        </label>
      </div>

      {value.enabled && (
        <div className="mt-3 space-y-3">
          <Field
            label="Hours per year"
            hint="Your contract may give more than four weeks. Enter what it says."
            errors={errors.hoursPerYear}
          >
            {(control) => (
              <>
                <Input
                  {...control}
                  name="vacationHoursPerYear"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="80"
                  disabled={disabled}
                  value={value.hoursPerYear}
                  onChange={(event) =>
                    onChange({ ...value, hoursPerYear: event.target.value })
                  }
                  onBlur={() => onBlur?.("hoursPerYear", value.hoursPerYear)}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-control bg-page px-3 py-2.5 text-sm text-ink-muted">
                  <span>Not sure? I work</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label="Hours per week"
                    className="w-20 min-h-10"
                    disabled={disabled}
                    value={weeklyHours}
                    onChange={(event) =>
                      onChange({ ...value, weeklyHours: event.target.value })
                    }
                  />
                  <span>
                    h a week × {CALCULATOR_WEEKS} weeks ={" "}
                    <b className="text-ink">{calculated}h</b>
                  </span>
                  <Button
                    variant="ghost"
                    size="compact"
                    disabled={disabled || parseHoursInput(calculated) === null}
                    onClick={() =>
                      onChange({ ...value, hoursPerYear: calculated })
                    }
                  >
                    Use this
                  </Button>
                </div>
              </>
            )}
          </Field>

          <Field
            label="Carried over from last year (optional)"
            hint="These hours often expire on 31 March."
            errors={errors.carriedOverHours}
          >
            {(control) => (
              <Input
                {...control}
                name="vacationCarryOverHours"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                disabled={disabled}
                value={value.carriedOverHours}
                onChange={(event) =>
                  onChange({ ...value, carriedOverHours: event.target.value })
                }
                onBlur={() =>
                  onBlur?.("carriedOverHours", value.carriedOverHours)
                }
              />
            )}
          </Field>
        </div>
      )}
    </div>
  );
}
