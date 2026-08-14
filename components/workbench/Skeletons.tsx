import { Spinner } from "@/components/ui/primitives";

export const DEMO_KEYWORDS: [string, string][] = [
  ["best tool for SEO", "commercial · roundup"],
  ["what is seo", "informational · guide"],
  ["ahrefs vs semrush", "commercial · comparison"],
];

/** Full two-column skeleton, shown while the SERP stage is in flight. */
export function LoadingWorkbench() {
  return (
    <div className="mt-8 lg:flex lg:flex-1 lg:flex-col">
      <div className="grid flex-1 items-stretch gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Spinner />
            Fetching SERP data…
          </div>
          <div className="mt-4 space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Spinner />
              Awaiting SERP data…
            </div>
            <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="flex-1 rounded-xl border border-indigo-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-medium text-slate-400">
              Analysis will run once results are in
            </div>
            <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Right-column-only skeleton, shown while the LLM stage is in flight. */
export function RightColumnSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <Spinner />
        </div>
        <p className="mt-3 text-xs font-medium text-slate-400">
          LLM reading the SERP and drafting the analysis…
        </p>
        <div className="mt-4 space-y-3">
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="rounded-xl border border-indigo-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

/** Empty state: the workbench skeleton, with demo shortcuts in the SERP slot. */
export function EmptyWorkbench({ onDemo }: { onDemo: (kw: string) => void }) {
  return (
    <div className="mt-8 lg:flex lg:flex-1 lg:flex-col">
      <div className="grid flex-1 items-stretch gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Left slot: where SERP results will render */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6">
          <span className="rounded bg-sky-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
            Observed data
          </span>
          <h3 className="mt-2 text-lg font-bold">Top organic results</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Your keyword's SERP will render here — position, title, domain, snippet —
            untouched by the model.
          </p>
          <div className="mt-5 border-t border-dashed border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Try a bundled demo
            </p>
            <div className="mt-2 space-y-2">
              {DEMO_KEYWORDS.map(([kw, tag]) => (
                <button
                  key={kw}
                  onClick={() => onDemo(kw)}
                  className="group flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-indigo-300 hover:shadow"
                >
                  <span className="text-sm font-semibold text-indigo-700 group-hover:underline">
                    {kw}
                  </span>
                  <span className="text-[11px] text-slate-400">{tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right slot: where analysis + recommendation will render */}
        <div className="flex flex-col gap-6">
          <div className="flex-1 rounded-xl border border-dashed border-slate-300 bg-white/70 p-6">
            <span className="rounded bg-violet-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-violet-700">
              Model inference
            </span>
            <h3 className="mt-2 text-lg font-bold">What this SERP is telling us</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Search intent, content types, common patterns, and gaps — inferred from the
              results, never invented.
            </p>
          </div>
          <div className="flex-1 rounded-xl border border-dashed border-slate-300 bg-white/70 p-6">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
              Model recommendation
            </span>
            <h3 className="mt-2 text-lg font-bold">The page we would build</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Page type, target user, angle, title, structure — every claim linked to
              specific results. Hover a badge to highlight its row.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
