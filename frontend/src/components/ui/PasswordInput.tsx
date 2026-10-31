import { useState, type ComponentProps } from "react";
import { classNames } from "../../lib/class-names";
import { Icon } from "./Icon";
import { Input } from "./Input";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={classNames("pr-12", className)}
      />
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute top-1 right-1 flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-neutral-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 pointer-coarse:h-10 pointer-coarse:w-10"
      >
        <Icon name={visible ? "eye-off" : "eye"} className="h-5 w-5" />
      </button>
    </div>
  );
}
