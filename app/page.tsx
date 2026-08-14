"use client";

import { useState } from "react";
import type {
  SerpSnapshot,
  SerpAnalysis,
  PageStrategy,
  LlmSourceInfo,
} from "@/lib/types";
import { Spinner } from "@/components/ui/primitives";
import { SerpTable, SourceBadge } from "@/components/serp/SerpTable";
import { AnalysisCard } from "@/components/analysis/AnalysisCard";
import { StrategyCard } from "@/components/strategy/StrategyCard";
import {
  EmptyWorkbench,
  LoadingWorkbench,
  RightColumnSkeleton,
} from "@/components/workbench/Skeletons";

const DEFAULT_KEYWORD = "best tool for SEO";

type LoadState = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [keyword, setKeyword] = useState(DEFAULT_KEYWORD);

  // Two independent pipeline stages: SERP facts first, then LLM judgment.
  const [serp, setSerp] = useState<SerpSnapshot | null>(null);
  const [serpState, setSerpState] = useState<LoadState>("idle");
  const [analysis, setAnalysis] = useState<SerpAnalysis | null>(null);
  const [strategy, setStrategy] = useState<PageStrategy | null>(null);
  const [llm, setLlm] = useState<LlmSourceInfo | null>(null);
  const [analysisState, setAnalysisState] = useState<LoadState>("idle");

  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<number[] | null>(null);

  /** Step 1: fetch/load SERP data. Fast — renders observed facts immediately. */
  async function fetchSerp(kw: string): Promise<boolean> {
    setSerpState("loading");
    setError(null);
    setWarnings([]);
    try {
      const res = await fetch("/api/serp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSerpState("error");
        setError(body.error ?? `SERP request failed (${res.status})`);
        return false;
      }
      setSerp(body.serp);
      setWarnings(body.warnings ?? []);
      setSerpState("done");
      return true;
    } catch {
      setSerpState("error");
      setError("Network error — is the server running?");
      return false;
    }
  }

  /** Step 2: LLM analysis + strategy. Slow — the right column fills in when ready. */
  async function fetchAnalysis(kw: string) {
    setAnalysisState("loading");
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw }),
      });
      const body = await res.json();
      if (!res.ok) {
        setAnalysisState("error");
        setError(body.error ?? `Analysis failed (${res.status})`);
        return;
      }
      setAnalysis(body.analysis);
      setStrategy(body.strategy);
      setLlm(body.llm);
      if (body.warnings?.length) {
        setWarnings((w) => [...w, ...body.warnings]);
      }
      setAnalysisState("done");
    } catch {
      setAnalysisState("error");
      setError("Network error — analysis failed.");
    }
  }

  /** Full pipeline: SERP first, then analysis. */
  async function run(kw: string) {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setAnalysis(null);
    setStrategy(null);
    setLlm(null);
    setAnalysisState("idle");
    setHighlight(null);
    const ok = await fetchSerp(trimmed);
    if (ok) await fetchAnalysis(trimmed);
  }

  const busy = serpState === "loading" || analysisState === "loading";

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-[100rem] flex-1 flex-col px-4 py-10 sm:px-6 lg:px-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            AI SERP Strategy Analyst
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            Should you build a page for this keyword?
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            We read the top 10 organic results (US, English), infer what Google
            rewards, and recommend a page with the evidence spelled out.
          </p>
        </header>

        {/* Keyword input */}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(keyword);
          }}
        >
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter a keyword…"
            maxLength={120}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Spinner />}
            {busy ? "Analyzing…" : "Analyze SERP"}
          </button>
        </form>

        {/* Hard error: SERP stage failed */}
        {serpState === "error" && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>SERP fetch failed.</strong> {error}
            <button
              onClick={() => run(keyword)}
              className="ml-2 font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stage 1 loading: whole workbench skeleton pulses */}
        {serpState === "loading" && <LoadingWorkbench />}

        {/* Stage 1 done: SERP facts visible; right column waits for the LLM */}
        {serpState === "done" && serp && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                SERP data: <SourceBadge type={serp.source.type} />
                {serp.source.provider} · {serp.source.market} ·{" "}
                {serp.source.language} · captured{" "}
                {new Date(serp.source.capturedAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-3">
                {llm && (
                  <span>
                    LLM: <strong>{llm.model}</strong>
                    {llm.usedSample && " (cached sample)"}
                  </span>
                )}
                <button
                  onClick={() => run(keyword)}
                  disabled={busy}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↻ Re-run
                </button>
              </span>
            </div>

            {warnings.map((w, i) => (
              <div
                key={i}
                className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
              >
                ⚠ {w}
              </div>
            ))}

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div className="lg:sticky lg:top-6">
                <SerpTable results={serp.results} highlight={highlight} />
              </div>
              <div className="min-w-0 space-y-6">
                {analysisState === "done" && analysis && strategy && llm ? (
                  <>
                    <AnalysisCard analysis={analysis} />
                    <StrategyCard strategy={strategy} onHighlight={setHighlight} />
                  </>
                ) : analysisState === "error" ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <strong>Analysis failed.</strong> {error}
                    <button
                      onClick={() => fetchAnalysis(keyword)}
                      className="ml-2 font-semibold underline underline-offset-2"
                    >
                      Retry analysis
                    </button>
                  </div>
                ) : (
                  <RightColumnSkeleton />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state: workbench skeleton fills the viewport, demo shortcuts in the SERP slot */}
        {serpState === "idle" && <EmptyWorkbench onDemo={run} />}
      </div>
    </main>
  );
}
