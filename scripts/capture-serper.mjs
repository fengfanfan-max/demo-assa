#!/usr/bin/env node
/**
 * Capture a real Google SERP (US, English) via Serper.dev and save it as a bundled fixture.
 *
 * Usage:
 *   node scripts/capture-serper.mjs "best tool for SEO"
 *
 * Reads SERPER_API_KEY from .env.local (or the environment). Saves to data/fixtures/<slug>.json.
 */
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const keyword = process.argv[2];
if (!keyword) {
  console.error('Usage: node scripts/capture-serper.mjs "<keyword>"');
  process.exit(1);
}

// Load .env.local manually (Next.js would normally do this).
try {
  const raw = readFileSync(path.join(root, ".env.local"), "utf-8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local yet */
}

const apiKey = process.env.SERPER_API_KEY;
if (!apiKey) {
  console.error("SERPER_API_KEY not found in .env.local or environment.");
  process.exit(1);
}

const slug = keyword
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

console.log(`Capturing SERP for "${keyword}" (US, English) via serper.dev ...`);
const res = await fetch("https://google.serper.dev/search", {
  method: "POST",
  headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
  body: JSON.stringify({ q: keyword, gl: "us", hl: "en", num: 10 }),
});
if (!res.ok) {
  console.error(`Serper.dev responded ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const data = await res.json();
const organic = data.organic ?? [];
if (!organic.length) {
  console.error("No organic results returned.");
  process.exit(1);
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const snapshot = {
  keyword,
  source: {
    type: "live",
    provider: "serper.dev",
    market: "United States",
    language: "English",
    capturedAt: new Date().toISOString(),
  },
  results: organic.slice(0, 10).map((item, i) => ({
    position: item.position ?? i + 1,
    title: item.title ?? "(untitled)",
    url: item.link ?? "",
    domain: item.domain ?? hostnameOf(item.link ?? ""),
    snippet: item.snippet ?? "",
  })),
};

const dir = path.join(root, "data", "fixtures");
await mkdir(dir, { recursive: true });
const out = path.join(dir, `${slug}.json`);
await writeFile(out, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`Saved ${organic.length} results -> ${out}`);
