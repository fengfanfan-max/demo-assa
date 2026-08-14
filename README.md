# AI SERP Strategy Analyst

A local, interactive web MVP that analyzes a keyword's SERP (US English) with an LLM and produces evidence-backed content strategy recommendations. Evaluation keyword: **`best tool for SEO`** (Market: United States, Language: English).

> 🇨🇳 中文版：​[README.zh-CN.md](README.zh-CN.md)

Built with **Next.js** (App Router, TypeScript, Tailwind). One process serves both the UI and the server-side API routes — LLM calls never run in the browser.

---

## Design Decisions

### 1. How we understand the user and their problem

**Users**: SEO and content teams who must decide *whether* — and *how* — to create a page for a keyword.

**The problem**: Today this decision relies on manually opening Google, eyeballing the top 10 results, and subjectively judging intent, content formats, and differentiation. It is slow, hard to defend, and the reasoning (which result led to which conclusion) rarely survives the handoff from analyst to writer.

**What they actually need** is not just a list of results, but a **traceable argument**: *here is what the SERP shows (facts), here is what that implies (inference), and here is the page we should build (recommendation), backed by specific results*. The product's core value is making this reasoning explicit and auditable.

### 2. Product & technical assumptions

- **Single-keyword focus is correct**: the user flow is "one keyword → one decision". Batch analysis and rank tracking were explicitly out of scope, and the highest-value experience is a deep, trustworthy single-keyword briefing.
- **Facts vs. inference is the central UX concept**: SERP rows are *observed data* (never altered by the model); analysis and recommendations are *model judgment*. The UI separates these visually and links every recommendation to the specific SERP positions that support it.
- **Structured output everywhere**: the LLM returns JSON validated against a Zod schema on the server, with one retry, then a cached-sample fallback. Free-form text is a fallback, never the contract.
- **Graceful degradation**: without API keys, the app runs on a bundled real SERP fixture + cached analysis; with keys, it fetches live data. The core experience is never blocked by credentials.
- **Stack**: Next.js (App Router, TypeScript, Tailwind) — one process serves both the UI and the server-side API routes (LLM calls never run in the browser). For this scope (normalize ~10 results + one LLM call) it is the right fit: end-to-end types, no CORS or cross-service wiring for local runs, and a production-grade path if this ever ships.

### 3. How SERP data is obtained & processed

- **Live source**: **Serper.dev** API (real Google SERP, `gl=us`, `hl=en`) when `SERPER_API_KEY` is set. Google serves however many organic results page one has room for — ads and SERP features frequently leave fewer than 10 (we measured 8–9 for our demo keywords; requesting `num: 20` does not change this). We display the real count as "Top N organic results" rather than padding the list with page-two results, which would fake ranking positions.
- **No-key mode**: bundled snapshots in `data/fixtures/*.json` (3 keywords, captured from the live source, US/English, timestamped in each file). Regenerate with `node scripts/capture-serper.mjs "<keyword>"`.
- **Normalization**: raw API responses map to a canonical `SerpResult` model — `position`, `title`, `url`, `domain`, `snippet` — so any source plugs into the same pipeline via the `SERPSource` seam in `lib/serp/sources.ts`.
- **Two-step pipeline**: `POST /api/serp` returns the SERP facts alone (fast, ~tens of ms for fixtures), then `POST /api/analyze` runs the LLM (seconds). The UI renders the facts first, then fills in the analysis — the "observed data before model judgment" order is visible in the UX, and a 5-minute in-process cache avoids fetching the same SERP twice per run.
- **Processing**: keyword → SERP source (live or fixture) → top-N organic results → LLM analysis. SERP rows pass through untouched; the LLM never rewrites them.

### 4. LLM's role in the system

The LLM is a **reader and strategist, not a data fetcher**:

- **SERP analysis** (structured output): inferred search intent (+ confidence and reasoning), dominant page/content types, common patterns across ranking pages, content opportunities/differentiation gaps.
- **Page strategy** (structured output): recommended page type, target user & core needs, content angle/value proposition, suggested title, page structure, and *why this can win* — every rationale point cites specific SERP positions.
- **Hard boundaries**: it cannot fetch data, cannot invent results, and every judgment is emitted alongside the evidence it is based on. The server validates all output via Zod; on LLM failure it falls back to `data/samples/` cached analysis so the UI experience remains demonstrable.

### 5. Features deliberately excluded

Per spec: login/permissions, database & analysis history, online deployment, batch keywords, rank tracking, search volume/keyword difficulty, backlink/PageSpeed/technical audits, full crawling of ranking pages, automatic article generation, production crawler. Also excluded: multi-region/local SERP and SERP feature parsing (PAA, featured snippets, AI Overview) — noted as next steps instead.

### 6. If we continued, what's next

1. **SERP feature awareness**: People Also Ask, featured snippets, AI Overview — these change the content play for many keywords.
2. **Freshness workflow**: a script that re-captures a fixture and regenerates its cached sample in one step (today the capture script exists; sample regeneration is a manual API call).
3. **Multi-keyword & intent clustering**, then batch brief export (title + outline → content team).
4. **Keyword difficulty / search volume** as optional enrichment.
5. **Live-region switching** (already parameterized for US/EN) and freshness re-checks.

### 7. How we'd measure whether this product works

- **Evidence coverage**: % of recommendations that cite specific SERP results (target: 100%) — auditability, the core promise.
- **Intent & format accuracy**: agreement between model analysis and a human SEO's judgment on the same SERP (spot-check rubric).
- **Decision quality**: does a page built from the recommendation rank in the top 10 for the keyword? (long-term, the only metric that matters.)
- **Time-to-brief**: minutes from keyword to content brief vs. hours today; % of briefs adopted without rework by the content team.

---

## Install & run

Requirements: Node.js 20+.

```bash
npm install
npm run dev          # auto: live SERP when SERPER_API_KEY is set, fixture otherwise
```

Open http://localhost:3000, enter a keyword, hit **Analyze SERP**.

### Data-source mode (startup command, not a UI toggle)

| Command | SERP data source |
|---|---|
| `npm run dev` | **auto** — live (Serper.dev) when `SERPER_API_KEY` is set, bundled fixture otherwise |
| `npm run dev:fixture` | **fixture** — always bundled snapshots (`SERP_MODE=fixture`), zero network, fully reproducible |
| `npm run dev:live` | **live** — always real Google SERP (`SERP_MODE=live`); degrades to the fixture with a warning if the fetch fails |

Production builds: `npm run build && npm start` (or `npm start:fixture`).
The response always reports which source was actually used (`serp.source.type`), so there is no ambiguity at demo time.

## Environment variables

Copy `.env.example` to `.env.local` (already done in this repo; `.env*` is gitignored):

| Variable | Required | Purpose |
|---|---|---|
| `SERPER_API_KEY` | for live SERP | Serper.dev key (free tier: https://serper.dev) — real Google SERP fetch. Absent → bundled fixture. |
| `OPENAI_API_KEY` | for live LLM | Key for **any OpenAI-compatible provider** — server-side analysis. Absent → cached sample analysis. |
| `OPENAI_BASE_URL` | optional | Defaults to `https://api.deepseek.com`; point it at any OpenAI-compatible endpoint (DeepSeek, Moonshot, OpenRouter, SiliconFlow, OpenAI, …). |
| `OPENAI_MODEL` | optional | Defaults to `deepseek-chat`; e.g. `moonshot-v1-8k`, `gpt-4o-mini`, … |
| `SERP_MODE` | optional | `live` \| `fixture` \| unset = auto. Usually set via `npm run dev:fixture` / `dev:live` instead of by hand. |

**Both keys are optional.** With no keys at all, the app still demonstrates the full experience using the bundled fixtures + cached samples for `best tool for SEO`, `what is seo`, and `ahrefs vs semrush`.

## Demo fixtures & samples

Bundled keywords (work without any key; each fixture + sample pair is captured/generated live from real sources):

| Keyword | Intent in sample | Fixture | Sample |
|---|---|---|---|
| `best tool for SEO` | commercial | `data/fixtures/best-tool-for-seo.json` | `data/samples/best-tool-for-seo.json` |
| `what is seo` | informational | `data/fixtures/what-is-seo.json` | `data/samples/what-is-seo.json` |
| `ahrefs vs semrush` | commercial (comparison) | `data/fixtures/ahrefs-vs-semrush.json` | `data/samples/ahrefs-vs-semrush.json` |

- Fixtures are real Google SERP snapshots (Serper.dev, US, English; provider & capture time inside each file). Regenerate: `node scripts/capture-serper.mjs "<keyword>"`.
- Samples are the LLM's cached analysis of the matching fixture, served when no `OPENAI_API_KEY` is present (or on live failure).
- Other keywords work whenever `SERPER_API_KEY` is set (live fetch; no fixture needed).

## API

Two-step pipeline — the frontend calls these in order and renders each stage as it lands:

| Endpoint | Step | Latency | Response |
|---|---|---|---|
| `POST /api/serp` | 1. SERP data only | ~tens of ms (fixture) to ~2s (live) | `{ keyword, serp, warnings? }` |
| `POST /api/analyze` | 2. LLM analysis + strategy | seconds (LLM call) | `{ keyword, serp, analysis, strategy, llm, warnings? }` |

Body: `{"keyword": "best tool for SEO"}`. Optional per-request `"mode": "live" | "fixture"` overrides the startup `SERP_MODE` for that call.

## Project layout

```
app/page.tsx                  UI shell: state machine (SERP stage → LLM stage) + composition
app/api/serp/route.ts         Step 1: SERP data only (fast)
app/api/analyze/route.ts      Step 2: LLM analysis + strategy (slow), reuses cached SERP
components/ui/primitives.tsx  shared primitives (SectionTitle, BulletList, Spinner, InfoChip)
components/serp/SerpTable.tsx observed SERP results + source badge
components/analysis/AnalysisCard.tsx  model inference card
components/strategy/StrategyCard.tsx  recommendation card (hover-to-highlight evidence)
components/workbench/Skeletons.tsx    empty / loading / right-column skeletons + demo keywords
lib/types.ts                  shared types (SerpResult, SerpAnalysis, PageStrategy, …)
lib/serp/sources.ts           SERPSource seam: Serper.dev live fetch + fixture loader + cache
lib/llm/schemas.ts            Zod schemas — the structured-output contract
lib/llm/analyze.ts            OpenAI-compatible LLM call (JSON mode, 1 retry) → cached-sample fallback
lib/llm/sample.ts             sample loader + prompt serialization
data/fixtures/                real SERP snapshots (no-key mode)
data/samples/                 cached analyses (no-key mode)
scripts/capture-serper.mjs    capture a live SERP into data/fixtures/
```

## Scope notes

Built within a time-boxed budget. Deliberately deferred (next iteration): SERP feature parsing (PAA, featured snippets, AI Overview), multi-keyword analysis beyond the pipeline seam, and a one-command fixture re-capture + sample regeneration workflow.
