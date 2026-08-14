import { NextRequest } from "next/server";
import { getSerpCached, type SerpMode } from "@/lib/serp/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Step 1 of the two-step pipeline: fetch (or load) the SERP data only.
 * Fast — the frontend renders these observed facts before asking the LLM.
 */
export async function POST(req: NextRequest) {
  let keyword: string;
  let mode: SerpMode | undefined;
  try {
    const body = await req.json();
    keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
    // Optional per-request override; unset = SERP_MODE env / auto.
    if (body.mode === "live" || body.mode === "fixture") mode = body.mode;
  } catch {
    return Response.json(
      { error: 'Invalid JSON body. Send {"keyword": "..."}.' },
      { status: 400 },
    );
  }

  if (!keyword) {
    return Response.json({ error: "Keyword is required." }, { status: 400 });
  }
  if (keyword.length > 120) {
    return Response.json({ error: "Keyword is too long (max 120 chars)." }, { status: 400 });
  }

  try {
    const { serp, warning } = await getSerpCached(keyword, mode);
    return Response.json({
      keyword,
      serp,
      warnings: warning ? [warning] : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("[api/serp]", message);
    return Response.json({ error: message, keyword }, { status: 502 });
  }
}
