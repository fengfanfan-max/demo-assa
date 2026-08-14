import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SerpResult, SerpSnapshot } from "@/lib/types";

export const SERP_MARKET = "United States";
export const SERP_LANGUAGE = "English";
const SERPER_ENDPOINT = "https://google.serper.dev/search";
const SERPER_TIMEOUT_MS = 30_000;

/** Slugify a keyword into a fixture filename, e.g. "best tool for SEO" -> "best-tool-for-seo". */
export function keywordSlug(keyword: string): string {
  return keyword
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface SerperOrganicItem {
  position?: number;
  title?: string;
  link?: string;
  domain?: string;
  snippet?: string;
}

interface SerperResponse {
  organic?: SerperOrganicItem[];
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Fetch the live Google SERP (US, English) via Serper.dev. Throws on failure. */
export async function fetchSerperSerp(keyword: string): Promise<SerpSnapshot> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY is not set");

  const res = await fetch(SERPER_ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: keyword, gl: "us", hl: "en", num: 10 }),
    signal: AbortSignal.timeout(SERPER_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Serper.dev responded with ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SerperResponse;
  const organic = data.organic ?? [];
  if (organic.length === 0) {
    throw new Error("Serper.dev returned no organic results");
  }

  const results: SerpResult[] = organic.slice(0, 10).map((item, i) => {
    const url = item.link ?? "";
    return {
      position: item.position ?? i + 1,
      title: item.title ?? "(untitled)",
      url,
      domain: item.domain ?? hostnameOf(url),
      snippet: item.snippet ?? "",
    };
  });

  return {
    keyword,
    source: {
      type: "live",
      provider: "serper.dev",
      market: SERP_MARKET,
      language: SERP_LANGUAGE,
      capturedAt: new Date().toISOString(),
    },
    results,
  };
}

/** Read a bundled SERP snapshot for the keyword. Returns null when no fixture exists. */
export async function loadFixture(keyword: string): Promise<SerpSnapshot | null> {
  const file = path.join(
    process.cwd(),
    "data",
    "fixtures",
    `${keywordSlug(keyword)}.json`,
  );
  try {
    const raw = await readFile(file, "utf-8");
    const parsed = JSON.parse(raw) as SerpSnapshot;
    return { ...parsed, source: { ...parsed.source, type: "fixture" } };
  } catch {
    return null;
  }
}

export interface SerpFetchResult {
  serp: SerpSnapshot;
  /** Human-readable note when the live source failed and we degraded to the fixture. */
  warning?: string;
}

/** Data-source mode. "auto" = live when a key exists, fixture otherwise. */
export type SerpMode = "auto" | "live" | "fixture";

/**
 * Resolve the default mode from the SERP_MODE env var (set by npm run dev:fixture / dev:live).
 * Unset → auto (live when SERPER_API_KEY exists, fixture otherwise).
 */
export function resolveDefaultMode(): SerpMode {
  const m = process.env.SERP_MODE;
  if (m === "live" || m === "fixture") return m;
  return "auto";
}

/**
 * Get SERP data for a keyword.
 * - "live": always hit Serper.dev; on failure degrade to fixture with a warning.
 * - "fixture": always use the bundled snapshot (no network).
 * - "auto" (default): live when SERPER_API_KEY is set, fixture otherwise.
 */
export async function getSerp(
  keyword: string,
  mode: SerpMode = resolveDefaultMode(),
): Promise<SerpFetchResult> {
  const trimmed = keyword.trim();
  if (!trimmed) throw new Error("Keyword is empty");

  const wantLive =
    mode === "live" || (mode === "auto" && Boolean(process.env.SERPER_API_KEY));

  if (wantLive) {
    try {
      return { serp: await fetchSerperSerp(trimmed) };
    } catch (err) {
      // Graceful degradation: fall back to the bundled fixture when one exists.
      const fixture = await loadFixture(trimmed);
      if (fixture) {
        return {
          serp: { ...fixture, source: { ...fixture.source, fallback: true } },
          warning: `Live SERP fetch failed (${(err as Error).message}). Showing bundled snapshot from ${fixture.source.capturedAt}.`,
        };
      }
      throw err;
    }
  }

  const fixture = await loadFixture(trimmed);
  if (!fixture) {
    throw new Error(
      `No fixture for "${trimmed}" and no SERPER_API_KEY (or live fetch failed). ` +
        `Add SERPER_API_KEY to .env.local, or use a bundled keyword: best tool for SEO, what is seo, ahrefs vs semrush.`,
    );
  }
  return { serp: fixture };
}

// --- Lightweight in-process SERP cache ---
// The two-step flow (GET serp first, then analyze) would otherwise fetch the same
// SERP twice per run. Fixtures are static; live results are cached briefly.
const serpCache = new Map<string, { serp: SerpSnapshot; at: number }>();
const SERP_CACHE_TTL_MS = 5 * 60_000;
const SERP_CACHE_MAX = 100;

/** getSerp with a 5-minute in-process cache, keyed by mode + keyword. */
export async function getSerpCached(
  keyword: string,
  mode: SerpMode = resolveDefaultMode(),
): Promise<SerpFetchResult> {
  const key = `${mode}:${keyword.trim().toLowerCase()}`;
  const hit = serpCache.get(key);
  if (hit && Date.now() - hit.at < SERP_CACHE_TTL_MS) {
    return { serp: hit.serp };
  }
  const result = await getSerp(keyword, mode);
  serpCache.set(key, { serp: result.serp, at: Date.now() });
  // Bound the cache (Map iterates in insertion order → evict the oldest entry).
  if (serpCache.size > SERP_CACHE_MAX) {
    const oldest = serpCache.keys().next().value;
    if (oldest !== undefined) serpCache.delete(oldest);
  }
  return result;
}
