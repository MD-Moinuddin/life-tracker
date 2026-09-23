interface ModuleCardProps {
  icon: string;
  title: string;
}

export function ModuleCard({ icon, title }: ModuleCardProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-4">
      <span aria-hidden="true" className="text-3xl">
        {icon}
      </span>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        Coming in v1.1
      </span>
    </div>
  );
}
