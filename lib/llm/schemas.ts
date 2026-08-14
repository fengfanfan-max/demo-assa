import { z } from "zod";

export const serpResultSchema = z.object({
  position: z.number().int().min(1),
  title: z.string(),
  url: z.string(),
  domain: z.string(),
  snippet: z.string(),
});

export const serpAnalysisSchema = z.object({
  intent: z.enum([
    "informational",
    "commercial",
    "transactional",
    "navigational",
    "local",
  ]),
  intentConfidence: z.number().min(0).max(1),
  intentReason: z.string(),
  contentTypes: z.array(z.string()).min(1),
  patterns: z.array(z.string()).min(1),
  opportunities: z.array(z.string()).min(1),
});

export const strategyEvidenceSchema = z.object({
  positions: z.array(z.number().int().min(1)).min(1),
  note: z.string(),
});

export const pageStrategySchema = z.object({
  pageType: z.string(),
  targetUser: z.string(),
  coreNeed: z.string(),
  angle: z.string(),
  valueProposition: z.string(),
  suggestedTitle: z.string(),
  pageStructure: z.array(z.string()).min(1),
  rationale: z.array(strategyEvidenceSchema).min(1),
});

/** The full structured contract the LLM must emit. */
export const llmOutputSchema = z.object({
  analysis: serpAnalysisSchema,
  strategy: pageStrategySchema,
});

export type LlmOutput = z.infer<typeof llmOutputSchema>;
