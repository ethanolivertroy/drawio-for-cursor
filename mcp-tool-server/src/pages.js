import { readFileSync, writeFileSync } from "fs";
import pako from "pako";

const DIAGRAM_RE = /<diagram\b([^>]*?)(?:\/>|>([\s\S]*?)<\/diagram>)/g;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;

function parseAttrs(rawAttrs)
{
  const attrs = {};
  let match;

  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(rawAttrs)) !== null)
  {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

export function parseDiagrams(mxfileText)
{
  const diagrams = [];
  let match;
  let index = 0;

  DIAGRAM_RE.lastIndex = 0;
  while ((match = DIAGRAM_RE.exec(mxfileText)) !== null)
  {
    diagrams.push({
      index: index++,
      attrs: parseAttrs(match[1]),
      body: match[2] || "",
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return diagrams;
}

export function listPageMeta(mxfileText)
{
  return parseDiagrams(mxfileText).map(function (diagram)
  {
    return {
      index: diagram.index,
      id: diagram.attrs.id || null,
      name: diagram.attrs.name || null,
      approxSizeBytes: Buffer.byteLength(diagram.body, "utf8"),
    };
  });
}

export function isLikelyCompressed(body)
{
  const trimmed = body.trim();
  return trimmed.length > 0 && !trimmed.startsWith("<");
}

export function decompressDiagram(body)
{
  const trimmed = body.trim();

  if (!isLikelyCompressed(trimmed))
  {
    return trimmed;
  }

  try
  {
    const inflated = pako.inflateRaw(Buffer.from(trimmed, "base64"), { to: "string" });
    return decodeURIComponent(inflated);
  }
  catch (e)
  {
    throw new Error(`Failed to decompress page content: ${e.message}`);
  }
}

function compressDiagram(xml)
{
  const encoded = encodeURIComponent(xml);
  const compressed = pako.deflateRaw(encoded);
  return Buffer.from(compressed).toString("base64");
}

export function findPage(diagrams, indexOrName)
{
  const asString = String(indexOrName);

  if (/^\d+$/.test(asString))
  {
    const idx = Number.parseInt(asString, 10);

    if (idx < 0 || idx >= diagrams.length)
    {
      throw new Error(`Page index ${idx} out of range (file has ${diagrams.length} page${diagrams.length === 1 ? "" : "s"})`);
    }

    return diagrams[idx];
  }

  const matches = diagrams.filter(function (diagram)
  {
    return diagram.attrs.name === asString;
  });

  if (matches.length === 0)
  {
    const names = diagrams.map(function (diagram) { return diagram.attrs.name; }).join(", ");
    throw new Error(`No page named "${asString}" found. Available page names: ${names}`);
  }

  if (matches.length > 1)
  {
    const indices = matches.map(function (diagram) { return diagram.index; }).join(", ");
    throw new Error(`Multiple pages named "${asString}" found (indices: ${indices}). Use an index instead.`);
  }

  return matches[0];
}

export function readPageXml(filePath, indexOrName)
{
  const text = readFileSync(filePath, "utf8");
  const diagrams = parseDiagrams(text);
  const page = findPage(diagrams, indexOrName);
  const xml = decompressDiagram(page.body);

  return { xml, index: page.index, id: page.attrs.id || null, name: page.attrs.name || null };
}

export function writePageXml(filePath, indexOrName, newXml)
{
  const text = readFileSync(filePath, "utf8");
  const diagrams = parseDiagrams(text);
  const page = findPage(diagrams, indexOrName);

  const trimmedXml = newXml.trim();

  if (!trimmedXml.startsWith("<mxGraphModel"))
  {
    throw new Error("set_page content must be plain <mxGraphModel> XML for a single page, not a full <mxfile> or non-XML content");
  }

  const compressed = isLikelyCompressed(page.body);
  const newBody = compressed ? compressDiagram(trimmedXml) : trimmedXml;

  const fullOriginal = text.slice(page.start, page.end);
  const bodyStartOffset = fullOriginal.indexOf(">") + 1;
  const bodyEndOffset = fullOriginal.lastIndexOf("</diagram>");
  const openingTag = fullOriginal.slice(0, bodyStartOffset);
  const closingTag = fullOriginal.slice(bodyEndOffset);
  const replacement = openingTag + newBody + closingTag;

  const result = text.slice(0, page.start) + replacement + text.slice(page.end);
  writeFileSync(filePath, result, "utf8");

  return { index: page.index, id: page.attrs.id || null, name: page.attrs.name || null, compressed };
}
