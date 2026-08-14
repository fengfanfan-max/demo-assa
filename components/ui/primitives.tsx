// Small shared UI primitives (hand-written, Tailwind-only — no component library).

export function SectionTitle({
  tag,
  tagClass,
  title,
  subtitle,
  className,
}: {
  tag: string;
  tagClass: string;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={`border-b border-slate-100 px-5 py-4 ${className ?? ""}`}>
      <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tagClass}`}>
        {tag}
      </span>
      <h2 className="mt-2 text-lg font-bold">{title}</h2>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

export function BulletList({
  title,
  items,
  chip,
  highlight,
}: {
  title: string;
  items: string[];
  chip?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
            {chip ? (
              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-700">
                {item}
              </span>
            ) : (
              <>
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${highlight ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span>{item}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm">
      <span className="font-semibold text-slate-500">{label}: </span>
      <span className="text-slate-800">{value}</span>
    </span>
  );
}
