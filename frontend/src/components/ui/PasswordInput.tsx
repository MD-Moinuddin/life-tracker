import { useState, type ComponentProps } from "react";
import { classNames } from "../../lib/class-names";
import { Input } from "./Input";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={classNames("pr-16", className)}
      />
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center rounded-control px-3 text-sm font-medium text-accent hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
