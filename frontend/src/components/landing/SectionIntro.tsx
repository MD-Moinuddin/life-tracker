import { EYEBROW_ACCENT_CLASSES } from "../ui/eyebrow";

interface SectionIntroProps {
  eyebrow: string;
  title: string;
  lead?: string;
  id?: string;
}

// The centred label, heading and line of text that open a landing section.
export function SectionIntro({ eyebrow, title, lead, id }: SectionIntroProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className={`${EYEBROW_ACCENT_CLASSES} mb-2`}>{eyebrow}</p>
      <h2 id={id} className="text-3xl font-bold tracking-tight text-ink">
        {title}
      </h2>
      {lead && <p className="mt-2 text-lg text-ink-muted">{lead}</p>}
    </div>
  );
}
