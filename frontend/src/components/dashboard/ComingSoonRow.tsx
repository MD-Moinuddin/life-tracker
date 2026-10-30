import { EYEBROW_CLASSES } from "../ui/eyebrow";
import { Icon } from "../ui/Icon";
import type { IconName } from "../ui/Icon";

export interface ComingSoonItem {
  icon: IconName;
  title: string;
}

interface ComingSoonRowProps {
  items: ComingSoonItem[];
}

// Modules that are planned but not built, as quiet chips so they do not take
// the room of real content.
export function ComingSoonRow({ items }: ComingSoonRowProps) {
  return (
    <section
      aria-labelledby="coming-soon-heading"
      className="mt-6 flex flex-wrap items-center gap-2"
    >
      <h2 id="coming-soon-heading" className={`${EYEBROW_CLASSES} mr-1`}>
        Coming soon
      </h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-border-strong bg-surface py-1 pr-3 pl-2 text-sm font-medium text-ink-muted"
          >
            <Icon name={item.icon} className="h-4 w-4" />
            {item.title}
          </li>
        ))}
      </ul>
    </section>
  );
}
