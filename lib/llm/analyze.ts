import OpenAI from "openai";
import { llmOutputSchema, type LlmOutput } from "@/lib/llm/schemas";
import { loadSample, serpToPrompt } from "@/lib/llm/sample";
import type { SerpSnapshot } from "@/lib/types";

const SYSTEM_PROMPT = `You are a senior SEO strategist. You are given the top 10 organic Google results (US English) for one keyword: positions, titles, domains, URLs, snippets.

Produce a JSON object with exactly two keys:
1. "analysis": {
     "intent": one of "informational" | "commercial" | "transactional" | "navigational" | "local",
     "intentConfidence": number 0..1,
     "intentReason": short explanation of the intent, grounded in the results,
     "contentTypes": array of dominant page/content types you observe in the results,
     "patterns": array of common patterns across ranking pages (title formats, structure, freshness, authority, coverage, monetization),
     "opportunities": array of content opportunities or differentiation gaps not well served by the current SERP
   }
2. "strategy": {
     "pageType": recommended page type to create,
     "targetUser": who the page should target,
     "coreNeed": their core need,
     "angle": the content angle that differentiates from existing results,
     "valueProposition": the one-sentence value proposition,
     "suggestedTitle": a concrete recommended page title,
     "pageStructure": array of main sections the page should cover, in order,
     "rationale": array of { "positions": [1-based SERP positions], "note": why this approach can win, tied to those specific results }
   }

Rules:
- Every claim must be grounded in the provided results. Never invent results or tools not present in the data.
- rationale.positions must reference actual positions from the input.
- Be concrete and specific. Prefer actionable over generic.
- Respond with valid JSON only, no markdown, no commentary.`;

const LLM_TIMEOUT_MS = 90_000;

export interface LlmResult {
  output: LlmOutput;
  usedSample: boolean;
  model: string;
}

/** Analyze a SERP with an OpenAI-compatible LLM (structured JSON output), falling back to a cached sample. */
export async function analyzeSerp(
  serp: SerpSnapshot,
): Promise<LlmResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "deepseek-chat";

  if (apiKey) {
    try {
      const client = new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL ?? "https://api.deepseek.com",
      });

      const messages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        {
          role: "user" as const,
          content: `Keyword: ${serp.keyword}\n\nTop 10 organic results:\n${serpToPrompt(serp)}\n\nRespond with the JSON analysis.`,
        },
      ];

      // One retry: JSON-mode output occasionally fails schema validation.
      for (let attempt = 0; attempt < 2; attempt++) {
        const completion = await client.chat.completions.create(
          {
            model,
            messages,
            response_format: { type: "json_object" },
            temperature: 0.3,
          },
          { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) },
        );

        const text = completion.choices[0]?.message?.content ?? "";
        const parsed = parseLlmJson(text);
        if (parsed) {
          return { output: parsed, usedSample: false, model };
        }
      }
    } catch (err) {
      console.error("[analyzeSerp] live LLM failed:", err);
    }
  }

  const sample = await loadSample(serp.keyword);
  if (!sample) {
    throw new Error(
      "LLM analysis failed and no cached sample is available for this keyword. " +
        "Check OPENAI_API_KEY, or run the bundled keyword \"best tool for SEO\" which ships with a sample.",
    );
  }
  return { output: sample, usedSample: true, model: "cached-sample" };
}

function parseLlmJson(text: string): LlmOutput | null {
  if (!text) return null;
  try {
    const cleaned = text
      .replace(/```(?:json)?/g, "")
      .replace(/^[\s\S]*?({[\s\S]*})[\s\S]*$/, "$1")
      .trim();
    const obj = JSON.parse(cleaned);
    const result = llmOutputSchema.safeParse(obj);
    if (!result.success) {
      console.error("[analyzeSerp] schema validation failed:", result.error.issues);
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}
