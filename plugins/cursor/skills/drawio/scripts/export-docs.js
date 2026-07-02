#!/usr/bin/env node

/**
 * Export a .drawio to docs/ with embedded XML (PNG/SVG/PDF) via draw.io Desktop CLI.
 *
 * Usage:
 *   node export-docs.js <file.drawio> [--format png|svg|pdf] [--out docs/architecture]
 */

import { spawnSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { basename, dirname, join, resolve } from "path";
import { platform } from "os";

function printHelp()
{
  console.log(`export-docs — export a .drawio into a docs folder via draw.io Desktop CLI

Usage:
  node export-docs.js <file.drawio> [--format png|svg|pdf] [--out docs/architecture]

Defaults: --format png, --out docs/architecture
Output file: <out>/<basename>.drawio.<format> (embedded XML with -e)`);
}

function findDrawioCli()
{
  var candidates =
  [
    process.env.DRAWIO_CLI,
    "drawio",
    "/Applications/draw.io.app/Contents/MacOS/draw.io",
    "/mnt/c/Program Files/draw.io/draw.io.exe",
    "C:\\\\Program Files\\\\draw.io\\\\draw.io.exe",
  ].filter(Boolean);

  for (var i = 0; i < candidates.length; i++)
  {
    var c = candidates[i];

    if (c === "drawio")
    {
      var which = spawnSync(platform() === "win32" ? "where" : "which", [c], {
        encoding: "utf-8",
      });

      if (which.status === 0 && which.stdout.trim())
      {
        return which.stdout.trim().split(/\r?\n/)[0];
      }

      continue;
    }

    if (existsSync(c))
    {
      return c;
    }
  }

  return null;
}

function main()
{
  var args = process.argv.slice(2);
  var file = null;
  var format = "png";
  var outDir = "docs/architecture";

  for (var i = 0; i < args.length; i++)
  {
    if (args[i] === "--help" || args[i] === "-h")
    {
      printHelp();
      process.exit(0);
    }
    else if (args[i] === "--format" || args[i] === "-f")
    {
      format = String(args[++i] || "png").toLowerCase();
    }
    else if (args[i] === "--out" || args[i] === "-o")
    {
      outDir = args[++i] || outDir;
    }
    else if (!file)
    {
      file = args[i];
    }
  }

  if (!file)
  {
    printHelp();
    process.exit(1);
  }

  if (["png", "svg", "pdf"].indexOf(format) < 0)
  {
    console.error("Error: format must be png, svg, or pdf");
    process.exit(1);
  }

  var input = resolve(file);

  if (!existsSync(input))
  {
    console.error("Error: file not found: " + input);
    process.exit(1);
  }

  var cli = findDrawioCli();

  if (!cli)
  {
    console.error("Error: draw.io Desktop CLI not found. Install draw.io Desktop or set DRAWIO_CLI.");
    process.exit(1);
  }

  var absOut = resolve(outDir);
  mkdirSync(absOut, { recursive: true });

  var base = basename(input).replace(/\.drawio$/i, "");
  var output = join(absOut, base + ".drawio." + format);

  var result = spawnSync(
    cli,
    ["-x", "-f", format, "-e", "-b", "10", "-o", output, input],
    { encoding: "utf-8" }
  );

  if (result.status !== 0)
  {
    console.error(result.stderr || result.stdout || "export failed");
    process.exit(result.status || 1);
  }

  console.log(output);
}

main();
