// Shared types for the SERP analysis pipeline.

export interface SerpResult {
  position: number;
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export interface SerpSourceInfo {
  /** "live" when fetched from an API at request time, "fixture" when read from a bundled snapshot */
  type: "live" | "fixture";
  provider: string;
  market: string;
  language: string;
  capturedAt: string;
  /** Set when a live fetch failed and we fell back to the bundled fixture */
  fallback?: boolean;
}

export interface SerpSnapshot {
  keyword: string;
  source: SerpSourceInfo;
  results: SerpResult[];
}

// --- LLM outputs (observed facts stay in SerpResult; everything below is model judgment) ---

export type SearchIntent =
  | "informational"
  | "commercial"
  | "transactional"
  | "navigational"
  | "local";

export interface SerpAnalysis {
  /** Most likely search intent behind this keyword. */
  intent: SearchIntent;
  intentConfidence: number; // 0..1
  intentReason: string;
  /** Dominant page/content types present in the top 10. */
  contentTypes: string[];
  /** Common patterns across the ranking pages (titles, structure, freshness, authority, coverage). */
  patterns: string[];
  /** Content opportunities or differentiation gaps not well served by the current SERP. */
  opportunities: string[];
}

export interface StrategyEvidence {
  /** SERP positions (1-based) that support this point. */
  positions: number[];
  note: string;
}

export interface PageStrategy {
  /** Recommended page type, e.g. "listicle comparison roundup". */
  pageType: string;
  targetUser: string;
  coreNeed: string;
  angle: string;
  valueProposition: string;
  suggestedTitle: string;
  /** Main sections the page should cover, in order. */
  pageStructure: string[];
  /** Why this approach can win against the current SERP. Each point cites evidence. */
  rationale: StrategyEvidence[];
}

export interface LlmSourceInfo {
  provider: string;
  model: string;
  /** True when no key was configured or the live call failed and cached analysis was served. */
  usedSample: boolean;
}

export interface AnalyzeResponse {
  keyword: string;
  serp: SerpSnapshot;
  analysis: SerpAnalysis;
  strategy: PageStrategy;
  llm: LlmSourceInfo;
}
