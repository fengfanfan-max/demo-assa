import type { SerpResult } from "@/lib/types";
import { SectionTitle } from "@/components/ui/primitives";

/** Observed SERP facts — rendered directly from the search source, never rewritten by the model. */
export function SerpTable({
  results,
  highlight,
}: {
  results: SerpResult[];
  highlight: number[] | null;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <SectionTitle
        tag="Observed data"
        tagClass="bg-sky-100 text-sky-700"
        title={
          results.length === 10
            ? "Top 10 organic results"
            : `${results.length} organic results in the top 10`
        }
        subtitle={
          results.length < 10
            ? `Directly from the search source — Google served ${results.length} organic results for this query (ads & SERP features take the rest of page one). The LLM never rewrites these.`
            : "Directly from the search source — the LLM never rewrites these."
        }
        className="sticky top-0 z-10 rounded-t-xl bg-white"
      />
      <ul className="divide-y divide-slate-100">
        {results.map((r) => {
          const active = highlight?.includes(r.position) ?? false;
          return (
            <li
              key={r.position}
              className={`flex gap-3 px-5 py-4 transition-colors ${
                active ? "bg-indigo-50" : ""
              }`}
            >
              <span className="mt-0.5 shrink-0 self-start rounded bg-indigo-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                #{r.position}
              </span>
              <div className="min-w-0">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-700 hover:underline"
                >
                  {r.title}
                </a>
                <p className="text-xs text-emerald-700">{r.domain}</p>
                {r.snippet && (
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {r.snippet}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function SourceBadge({ type }: { type: "live" | "fixture" }) {
  return type === "live" ? (
    <span className="mr-1 rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">
      live
    </span>
  ) : (
    <span className="mr-1 rounded bg-sky-100 px-1.5 py-0.5 font-semibold text-sky-700">
      fixture
    </span>
  );
}
