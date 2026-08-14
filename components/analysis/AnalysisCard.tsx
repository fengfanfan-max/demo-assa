import type { SerpAnalysis } from "@/lib/types";
import { SectionTitle, BulletList } from "@/components/ui/primitives";

const INTENT_LABELS: Record<string, string> = {
  informational: "Informational",
  commercial: "Commercial",
  transactional: "Transactional",
  navigational: "Navigational",
  local: "Local",
};

/** LLM's inference about the SERP: intent, content types, patterns, opportunities. */
export function AnalysisCard({ analysis }: { analysis: SerpAnalysis }) {
  const pct = Math.round(analysis.intentConfidence * 100);
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <SectionTitle
        tag="Model inference"
        tagClass="bg-violet-100 text-violet-700"
        title="What this SERP is telling us"
        subtitle="Judgments made by the LLM from the observed results above."
      />

      {/* Intent */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">Search intent</span>
          <span className="rounded-md bg-violet-600 px-2 py-0.5 text-xs font-bold text-white">
            {INTENT_LABELS[analysis.intent] ?? analysis.intent}
          </span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">confidence {pct}%</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {analysis.intentReason}
        </p>
      </div>

      <div className="grid gap-6 px-5 py-4 sm:grid-cols-3">
        <BulletList
          title="Content types in the SERP"
          items={analysis.contentTypes}
          chip
        />
        <BulletList title="Common patterns" items={analysis.patterns} />
        <BulletList
          title="Opportunities / gaps"
          items={analysis.opportunities}
          highlight
        />
      </div>
    </section>
  );
}
