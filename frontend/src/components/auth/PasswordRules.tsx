import { classNames } from "../../lib/class-names";
import { PASSWORD_RULES } from "../../lib/auth-validation";
import { Icon } from "../ui/Icon";

interface PasswordRulesProps {
  password: string;
  // Draw the rules that are not met as a problem, once the visitor has tried.
  showFailures?: boolean;
}

// The password rules as a checklist that ticks while the visitor types, so the
// rules are known before they are broken.
export function PasswordRules({
  password,
  showFailures = false,
}: PasswordRulesProps) {
  return (
    <ul
      aria-label="Password rules"
      className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm"
    >
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.label}
            className={classNames(
              "flex items-center gap-1.5",
              met && "text-accent-ink",
              !met && showFailures && "text-danger",
              !met && !showFailures && "text-ink-muted",
            )}
          >
            <span
              aria-hidden="true"
              className={classNames(
                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                met
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border-strong",
              )}
            >
              {met && <Icon name="check" className="h-2.5 w-2.5" />}
            </span>
            {rule.label}
            <span className="sr-only">{met ? " (met)" : " (not met yet)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
