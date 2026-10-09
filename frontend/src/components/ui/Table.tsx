import type { ReactNode } from "react";
import { classNames } from "../../lib/class-names";
import { cardClassName } from "./Card";

type Align = "left" | "right";

const ALIGN: Record<Align, string> = {
  left: "text-left",
  right: "text-right tabular-nums",
};

interface TableProps {
  caption: string;
  children: ReactNode;
}

export function Table({ caption, children }: TableProps) {
  return (
    <div className={cardClassName("plain", "overflow-x-auto")}>
      <table className="w-full text-sm text-ink [&_tbody]:divide-y [&_tbody_th]:font-medium [&_tbody]:divide-border [&_tfoot]:border-t [&_tfoot]:border-border-strong [&_tfoot]:bg-page [&_tfoot]:font-semibold [&_thead]:bg-page">
        <caption className="px-3 py-2 text-left text-ink-muted">
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

interface CellProps {
  align?: Align;
  children: ReactNode;
}

export function HeaderCell({ align = "left", children }: CellProps) {
  return (
    <th
      scope="col"
      className={classNames(
        "px-3 py-2 font-medium text-ink-muted",
        ALIGN[align],
      )}
    >
      {children}
    </th>
  );
}

export function RowHeader({ children }: { children: ReactNode }) {
  return (
    <th scope="row" className="px-3 py-2 text-left">
      {children}
    </th>
  );
}

export function Cell({ align = "left", children }: CellProps) {
  return <td className={classNames("px-3 py-2", ALIGN[align])}>{children}</td>;
}
