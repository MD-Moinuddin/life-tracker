import type { ComponentProps } from "react";
import { classNames } from "../../lib/class-names";
import { CONTROL_CLASSES } from "./controls";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={classNames(CONTROL_CLASSES, "resize-y", className)}
      {...props}
    />
  );
}
