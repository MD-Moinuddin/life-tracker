import type { ComponentProps } from "react";
import { classNames } from "../../lib/class-names";
import { CONTROL_CLASSES } from "./controls";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input className={classNames(CONTROL_CLASSES, className)} {...props} />
  );
}
