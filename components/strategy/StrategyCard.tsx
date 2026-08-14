import type { PageStrategy } from "@/lib/types";
import { SectionTitle, InfoChip } from "@/components/ui/primitives";

/** The page we would build: type, audience, angle, title, structure, and evidence. */
export function StrategyCard({
  strategy,
  onHighlight,
}: {
  strategy: PageStrategy;
  onHighlight: (positions: number[] | null) => void;
}) {
  return (
    <section className="rounded-xl border border-indigo-200 bg-white shadow-sm">
      <SectionTitle
        tag="Model recommendation"
        tagClass="bg-indigo-100 text-indigo-700"
        title="The page we would build"
        subtitle="Every point is tied to specific SERP positions — hover a badge to highlight it."
      />

      <div className="space-y-4 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <InfoChip label="Page type" value={strategy.pageType} />
          <InfoChip label="Target user" value={strategy.targetUser} />
          <InfoChip label="Core need" value={strategy.coreNeed} />
        </div>

        <div className="rounded-lg bg-indigo-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
            Suggested title
          </p>
          <p className="mt-1 text-lg font-bold text-indigo-950">
            {strategy.suggestedTitle}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Angle & value proposition
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            <strong>{strategy.angle}</strong> — {strategy.valueProposition}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recommended page structure
          </p>
          <ol className="mt-2 space-y-1.5">
            {strategy.pageStructure.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="font-bold text-indigo-500">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Why this can win (evidence)
          </p>
          <ul className="mt-2 space-y-2">
            {strategy.rationale.map((r, i) => (
              <li
                key={i}
                onMouseEnter={() => onHighlight(r.positions)}
                onMouseLeave={() => onHighlight(null)}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/60"
              >
                <div className="flex shrink-0 flex-wrap gap-1 pt-0.5">
                  {r.positions.map((p) => (
                    <span
                      key={p}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        onHighlight([p]);
                      }}
                      className="cursor-default rounded bg-indigo-600 px-1.5 py-0.5 text-[11px] font-bold text-white transition-transform hover:scale-110"
                    >
                      #{p}
                    </span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-700">{r.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
