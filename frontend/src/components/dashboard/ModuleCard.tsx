import { Link } from "react-router-dom";

interface ModuleCardProps {
  icon: string;
  title: string;
  to?: string;
}

const CARD_CLASSES =
  "flex flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-4";

export function ModuleCard({ icon, title, to }: ModuleCardProps) {
  const content = (
    <>
      <span aria-hidden="true" className="text-3xl">
        {icon}
      </span>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`${CARD_CLASSES} hover:border-indigo-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={CARD_CLASSES}>
      {content}
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        Coming later
      </span>
    </div>
  );
}
