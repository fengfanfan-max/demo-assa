import { NextRequest } from "next/server";
import { getSerpCached, type SerpMode } from "@/lib/serp/sources";
import { analyzeSerp } from "@/lib/llm/analyze";
import type { AnalyzeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let keyword: string;
  let mode: SerpMode | undefined;
  try {
    const body = await req.json();
    keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
    // Optional per-request override; unset = SERP_MODE env / auto.
    if (body.mode === "live" || body.mode === "fixture") mode = body.mode;
  } catch {
    return Response.json({ error: "Invalid JSON body. Send {\"keyword\": \"...\"}." }, { status: 400 });
  }

  if (!keyword) {
    return Response.json({ error: "Keyword is required." }, { status: 400 });
  }
  if (keyword.length > 120) {
    return Response.json({ error: "Keyword is too long (max 120 chars)." }, { status: 400 });
  }

  try {
    // Step 2 of the two-step pipeline: reuse the cached SERP (set by /api/serp),
    // then run the LLM analysis. SERP rows pass through untouched.
    const { serp, warning } = await getSerpCached(keyword, mode);

    // LLM analysis + strategy (OpenAI-compatible provider or cached sample)
    const { output, usedSample, model } = await analyzeSerp(serp);

    // Clamp evidence positions to the actual result count — the LLM can reference
    // positions beyond the SERP we have (e.g. #12), which would break the evidence chain.
    const maxPos = serp.results.length;
    output.strategy.rationale = output.strategy.rationale
      .map((r) => ({
        ...r,
        positions: r.positions.filter((p) => p >= 1 && p <= maxPos),
      }))
      .filter((r) => r.positions.length > 0);

    const response: AnalyzeResponse & { warnings?: string[] } = {
      keyword,
      serp,
      analysis: output.analysis,
      strategy: output.strategy,
      llm: { provider: usedSample ? "cached" : "openai-compatible", model, usedSample },
      warnings: [...(warning ? [warning] : [])],
    };
    if (usedSample) {
      response.warnings = [
        ...(response.warnings ?? []),
        "No OPENAI_API_KEY configured (or live call failed) — showing cached sample analysis.",
      ];
    }

    return Response.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("[api/analyze]", message);
    return Response.json(
      { error: message, keyword },
      { status: 502 },
    );
  }
}
