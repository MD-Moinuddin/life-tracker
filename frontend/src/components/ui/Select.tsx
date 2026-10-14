import type { ComponentProps } from "react";
import { classNames } from "../../lib/class-names";
import { CONTROL_CLASSES } from "./controls";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select className={classNames(CONTROL_CLASSES, className)} {...props} />
  );
}
