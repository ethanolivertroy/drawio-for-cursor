#!/usr/bin/env node

/**
 * Local shape-search CLI for the Cursor draw.io skill.
 *
 * Same algorithm as the MCP `search_shapes` tool (shared/shape-search.js).
 * Resolves the ~4.6 MB index in this order:
 *   1. Co-located search-index.json next to SKILL.md (or cached there)
 *   2. Monorepo shape-search/search-index.json (when installed via symlink)
 *   3. CDN fetch, then cache to the skill directory for offline reuse
 *
 * Usage:
 *   node scripts/search-shapes.js "aws lambda"
 *   node scripts/search-shapes.js "aws group vpc" --limit 5
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { buildTagMap, searchShapes } from "./shape-search.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillDir = join(__dirname, "..");

const DEFAULT_INDEX_URL =
  process.env.DRAWIO_SHAPE_INDEX_URL ||
  "https://cdn.jsdelivr.net/gh/jgraph/drawio-mcp@main/shape-search/search-index.json";

const localIndexCandidates =
[
  join(skillDir, "search-index.json"),
  // Repo checkout: skills/drawio → ../../shape-search/search-index.json
  join(skillDir, "..", "..", "shape-search", "search-index.json"),
];

function printHelp()
{
  console.log(`search-shapes — draw.io shape library search (local Cursor skill)

Usage:
  node scripts/search-shapes.js <query> [--limit N]

Examples:
  node scripts/search-shapes.js "aws lambda"
  node scripts/search-shapes.js "aws group public subnet" --limit 5
  node scripts/search-shapes.js "kubernetes pod"

Prints a JSON array of {title, style, w, h}. Paste each style string into an
mxCell style attribute when authoring XML diagrams.

Index resolution (first hit wins):
  1. ${join(skillDir, "search-index.json")}
  2. monorepo shape-search/search-index.json (symlink installs)
  3. ${DEFAULT_INDEX_URL} (cached to the skill directory)

Override the CDN with DRAWIO_SHAPE_INDEX_URL.`);
}

function parseArgs(argv)
{
  var queryParts = [];
  var limit = 10;

  for (var i = 0; i < argv.length; i++)
  {
    var arg = argv[i];

    if (arg === "--help" || arg === "-h")
    {
      return { help: true };
    }

    if (arg === "--limit" || arg === "-n")
    {
      i++;
      limit = Math.min(Math.max(parseInt(argv[i], 10) || 10, 1), 50);
      continue;
    }

    queryParts.push(arg);
  }

  return {
    help: false,
    query: queryParts.join(" ").trim(),
    limit: limit,
  };
}

async function loadShapeIndex()
{
  for (var i = 0; i < localIndexCandidates.length; i++)
  {
    var path = localIndexCandidates[i];

    if (existsSync(path))
    {
      return {
        shapeIndex: JSON.parse(readFileSync(path, "utf-8")),
        source: path,
      };
    }
  }

  var res = await fetch(DEFAULT_INDEX_URL);

  if (!res.ok)
  {
    throw new Error("HTTP " + res.status + " fetching " + DEFAULT_INDEX_URL);
  }

  var raw = await res.text();
  var cachePath = join(skillDir, "search-index.json");

  try
  {
    writeFileSync(cachePath, raw);
  }
  catch (err)
  {
    // Cache is best-effort — still return the in-memory index.
  }

  return {
    shapeIndex: JSON.parse(raw),
    source: DEFAULT_INDEX_URL + " (cached to " + cachePath + ")",
  };
}

async function main()
{
  var args = parseArgs(process.argv.slice(2));

  if (args.help || !args.query)
  {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  var loaded = await loadShapeIndex();
  var tagMap = buildTagMap(loaded.shapeIndex);
  var results = searchShapes(loaded.shapeIndex, tagMap, args.query, args.limit);

  // Human-readable source on stderr so agents can still parse stdout as JSON.
  console.error("index: " + loaded.source);
  console.error("query: " + args.query + " (limit " + args.limit + ")");
  console.log(JSON.stringify(results, null, 2));

  if (results.length === 0)
  {
    process.exit(2);
  }
}

main().catch(function(err)
{
  console.error("Error: " + (err && err.message ? err.message : String(err)));
  process.exit(1);
});
