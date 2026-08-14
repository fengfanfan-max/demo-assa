import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SerpSnapshot } from "@/lib/types";
import { keywordSlug } from "@/lib/serp/sources";
import type { LlmOutput } from "@/lib/llm/schemas";

/** Cached analysis for no-key / degraded runs. Stored as data/samples/<slug>.json. */
export async function loadSample(keyword: string): Promise<LlmOutput | null> {
  const file = path.join(
    process.cwd(),
    "data",
    "samples",
    `${keywordSlug(keyword)}.json`,
  );
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as LlmOutput;
  } catch {
    return null;
  }
}

/**
 * Serialize a SERP snapshot for the LLM prompt. The model only ever *reads* this;
 * observed data is never rewritten by the model.
 */
export function serpToPrompt(serp: SerpSnapshot): string {
  return JSON.stringify(
    serp.results.map((r) => ({
      position: r.position,
      title: r.title,
      domain: r.domain,
      url: r.url,
      snippet: r.snippet,
    })),
    null,
    2,
  );
}
