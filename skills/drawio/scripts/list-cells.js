#!/usr/bin/env node

/**
 * List mxCell vertices/edges in a .drawio (or .drawio.xml) file.
 * Helps agents inventory an existing diagram before editing in place.
 *
 * Usage:
 *   node list-cells.js <file.drawio> [--edges] [--json]
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function printHelp()
{
  console.log(`list-cells — inventory cells in a .drawio file

Usage:
  node list-cells.js <file.drawio> [--edges] [--json]

Prints id, kind (vertex|edge), parent, value, source, target, and a short style peek.`);
}

function attr(tag, name)
{
  var re = new RegExp("\\b" + name + "=\"([^\"]*)\"");
  var m = tag.match(re);
  return m ? m[1] : "";
}

function decodeEntities(s)
{
  return String(s || "")
    .replace(/&#xa;/gi, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function listCells(xml, includeEdges)
{
  var cells = [];
  var re = /<mxCell\b[\s\S]*?(?:\/>|<\/mxCell>)/g;
  var m;

  while ((m = re.exec(xml)) !== null)
  {
    var tag = m[0];
    var id = attr(tag, "id");

    if (!id || id === "0" || id === "1")
    {
      continue;
    }

    var isEdge = /\bedge="1"/.test(tag);
    var isVertex = /\bvertex="1"/.test(tag);

    if (!isEdge && !isVertex)
    {
      continue;
    }

    if (isEdge && !includeEdges)
    {
      continue;
    }

    var value = decodeEntities(attr(tag, "value")).replace(/\s+/g, " ").trim();
    var style = attr(tag, "style");
    var stylePeek = style.length > 80 ? style.slice(0, 77) + "..." : style;

    cells.push({
      id: id,
      kind: isEdge ? "edge" : "vertex",
      parent: attr(tag, "parent") || "1",
      value: value,
      source: attr(tag, "source") || undefined,
      target: attr(tag, "target") || undefined,
      stylePeek: stylePeek,
    });
  }

  return cells;
}

function main()
{
  var args = process.argv.slice(2);
  var file = null;
  var includeEdges = false;
  var asJson = false;

  for (var i = 0; i < args.length; i++)
  {
    if (args[i] === "--help" || args[i] === "-h")
    {
      printHelp();
      process.exit(0);
    }
    else if (args[i] === "--edges")
    {
      includeEdges = true;
    }
    else if (args[i] === "--json")
    {
      asJson = true;
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

  var path = resolve(file);

  if (!existsSync(path))
  {
    console.error("Error: file not found: " + path);
    process.exit(1);
  }

  var xml = readFileSync(path, "utf-8");
  var cells = listCells(xml, includeEdges);

  if (asJson)
  {
    console.log(JSON.stringify(cells, null, 2));
    return;
  }

  console.error(path + " — " + cells.length + " cells");

  for (var j = 0; j < cells.length; j++)
  {
    var c = cells[j];
    var label = c.value ? JSON.stringify(c.value) : "(no label)";
    var link = c.kind === "edge"
      ? "  " + (c.source || "?") + " → " + (c.target || "?")
      : "";
    console.log(
      c.id.padEnd(16) +
      c.kind.padEnd(8) +
      ("parent=" + c.parent).padEnd(18) +
      label +
      link
    );
  }
}

main();
