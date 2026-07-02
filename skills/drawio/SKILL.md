---
name: drawio
description: Always use when user asks to create, generate, draw, or design a diagram, flowchart, architecture diagram, ER diagram, sequence diagram, class diagram, network diagram, mockup, wireframe, or UI sketch, or mentions draw.io, drawio, drawoi, .drawio files, or diagram export to PNG/SVG/PDF.
---

# Draw.io Diagram Skill (Cursor, local-only)

Generate draw.io diagrams as **native `.drawio` files** on disk and open them in the **draw.io Desktop** app. This skill is fully local: never open `app.diagrams.net`, never build browser `#create=` URLs, and never call the hosted MCP endpoint (`mcp.draw.io`).

Companion skills (install via `./install.sh`): **`drawio-update`** (edit in place), **`drawio-from-code`** (repo → architecture), **`drawio-erd`** (schema → ERD), **`drawio-iac`** (Terraform/K8s/… → infra), **`drawio-docs`** (export into `docs/`). Hand off when the request matches those jobs instead of creating a brand-new diagram here.

## Local-only rules

- Write artifacts under the current workspace (or a path the user specifies).
- Deliverable is always a local file: `.drawio`, or `.drawio.png` / `.drawio.svg` / `.drawio.pdf` after export.
- Open results with the **Desktop app** (file association or explicit app launch) — never the default browser and never a remote URL.
- Prefer Mermaid + the Desktop CLI when the CLI is available; fall back to authoring XML directly when it is not.
- Mermaid conversion, ELK `--layout`, and image export require draw.io Desktop. Plain XML `.drawio` output does not.

## Authoring: Mermaid or XML?

| Author as | Best for | Needs desktop CLI? |
|-----------|----------|--------------------|
| **Mermaid** | Flowcharts, sequence, class, state, ER, gantt, mindmap, timeline, user journey, quadrant, C4, git graph, pie, and other standard types | Yes — to convert to `.drawio` |
| **XML** | Custom styling, precise/hand positioning, specific shape libraries (AWS, Azure, network, UML detail…), or when the desktop CLI is not installed | No (optional ELK `--layout` needs the CLI) |

- Prefer Mermaid when the desktop CLI is available and the request is a standard type — write terse Mermaid and let draw.io lay it out.
- Use XML for precise control, or as the universal fallback when the desktop app is not installed.
- For XML-authored diagrams, optional ELK auto-layout (`--layout`) avoids hand-placing cells. See [ELK layout for XML](#elk-layout-for-xml).
- **Industry icons (AWS, Azure, GCP, Cisco, Kubernetes, P&ID, electrical, …):** always look up exact `style` strings with the local [Shape search](#shape-search-official-icons) CLI *before* writing XML. Never invent `shape=mxgraph.aws4.*` (or similar) styles by hand.

If you're unsure whether the desktop CLI is present, detect it first (see [Locating the CLI](#locating-the-cli)). No CLI → author as XML and deliver a `.drawio` file only.

## The pipeline

Every diagram becomes a native `.drawio` file first, then is delivered in the requested output format.

1. **Author → `.drawio`**
   - **Mermaid**: write the Mermaid to a `.mmd` file, then convert it with the CLI:
     ```bash
     drawio -x -f xml -o diagram.drawio diagram.mmd
     ```
     Delete the `.mmd` afterward — the `.drawio` is the artifact. draw.io's Mermaid parser has already laid the diagram out, so no `--layout` is needed.
   - **XML**: write the mxGraphModel XML to `diagram.drawio` (see [XML format](#xml-format)). Optionally apply an ELK layout (see [ELK layout for XML](#elk-layout-for-xml)).
2. **Deliver** (identical for both sources):
   - *(no format)* → keep `diagram.drawio` and open it in Desktop.
   - **png / svg / pdf** → export from the `.drawio` with embedded XML, then delete the source `.drawio`:
     ```bash
     drawio -x -f png -e -b 10 -o diagram.drawio.png diagram.drawio
     ```
3. **Open the result** in draw.io Desktop (see [Opening the result](#opening-the-result)). If the open command fails, print the absolute path so the user can open it manually.

**Always convert Mermaid to `.drawio` first, then export** — do not export a `.mmd` straight to an image. Direct Mermaid → PNG export with `-e` is broken in current draw.io Desktop (the embedded-XML step crashes); the two-step path (convert, then export the `.drawio`) is reliable and produces an editable embed.

If Mermaid was requested but no desktop CLI is available, fall back to authoring the same diagram directly as XML.

## ELK layout for XML

XML-authored diagrams can be auto-positioned by the CLI's `--layout` pass — the same ELK layouts as the editor's *Arrange ▸ Layout* menu. Generate the cells with approximate (or even `0,0`) positions and let ELK place them; you only have to get the graph *structure* — nodes and edges — right.

```bash
drawio -x -f xml --layout verticalFlow -o diagram.drawio diagram.drawio
```

Or combine layout with export:

```bash
drawio -x -f png -e -b 10 --layout verticalFlow -o diagram.drawio.png diagram.drawio
```

### Layout presets

| Name | Layout |
|------|--------|
| `verticalFlow` | Layered, top-to-bottom — flowcharts, pipelines |
| `horizontalFlow` | Layered, left-to-right |
| `verticalTree` | Tree, top-down — hierarchies, org charts |
| `horizontalTree` | Tree, left-to-right |
| `radialTree` | Radial tree |
| `organic` | Force-directed — networks, mind-map-like graphs |

### Custom layout JSON

For finer control, pass a JSON **array** (starting with `[`) instead of a preset name:

```bash
drawio -x -f xml --layout '[{"layout":"elkLayered","config":{"elk.direction":"RIGHT"}}]' -o diagram.drawio diagram.drawio
```

Each entry is `{"layout": <algorithm>, "config": { … }}`:

- **Algorithms**: `elkLayered`, `elkTree`, `elkRadial`, `elkOrganic`, `elkStress`, `elkBox`.
- **`config`**: keys starting with `elk.` are ELK options — e.g. `elk.direction` (`UP` / `DOWN` / `LEFT` / `RIGHT`), `elk.spacing.nodeNode`, `elk.layered.spacing.nodeNodeBetweenLayers`. The keys `edgeStyle` (e.g. `orthogonal`) and `corners` (e.g. `rounded`) control connector rendering.

Mermaid-authored diagrams are already laid out — don't add `--layout`.

## Mermaid and XML references (local)

Before authoring, read the co-located reference files next to this `SKILL.md` (no network):

- `mermaid-reference.md` — Mermaid syntax for all supported diagram types plus flowchart styling (`style`, `classDef`, `linkStyle`)
- `xml-reference.md` — draw.io XML styles, edge routing, containers, layers, tags, metadata, dark mode, well-formedness

Match the language of the diagram labels to the user's language.

## Shape search (official icons)

draw.io ships ~10,000 branded / industry icons (AWS4, Azure, GCP, Cisco, Kubernetes, P&ID, electrical, BPMN, …). This skill's local CLI is the Cursor equivalent of the MCP `search_shapes` tool — same algorithm (`scripts/shape-search.js`), same index (`shape-search/search-index.json` in the monorepo, or CDN on first use).

**When to use it:** cloud architecture (AWS / Azure / GCP), network gear, K8s, P&ID, electrical, or any diagram that needs realistic library icons rather than plain boxes.

**When to skip it:** flowcharts, UML, ERD, org charts, mind maps — use basic shapes and Mermaid.

### Running the CLI

Resolve the script path relative to this skill directory (works for both monorepo symlink installs and a copied `~/.cursor/skills/drawio`):

```bash
node "<skill-dir>/scripts/search-shapes.js" "aws lambda"
node "<skill-dir>/scripts/search-shapes.js" "aws group vpc" --limit 5
node "<skill-dir>/scripts/search-shapes.js" "kubernetes pod"
```

Stdout is a JSON array of `{title, style, w, h}`. Prefer **AWS4** `resourceIcon` / `group` entries when both aws3 and aws4 appear. Paste each `style` string into an `mxCell` and size it with `w`×`h`:

```xml
<mxCell id="lambda1" value="order-handler" style="<paste style here>" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="78" height="78" as="geometry"/>
</mxCell>
```

Containers (VPC, public/private subnet, Region, AZ, …) use the aws4 `group` styles from search too — set `parent` on children and coordinates relative to the group.

### Index resolution

1. Co-located `search-index.json` next to this `SKILL.md` (including a prior cached download)
2. Monorepo `shape-search/search-index.json` (symlink / checkout installs — fully offline)
3. CDN `https://cdn.jsdelivr.net/gh/jgraph/drawio-mcp@main/shape-search/search-index.json`, then cached to the skill directory

Override the CDN with `DRAWIO_SHAPE_INDEX_URL`. After the first successful search, further runs are local.

## Choosing the output format

| Request mentions | Output |
|------------------|--------|
| (default) | `.drawio` file, opened in Desktop |
| `png` / `svg` / `pdf` | `.drawio.png` / `.drawio.svg` / `.drawio.pdf` (embedded XML), opened in Desktop |

Examples:

- "flowchart for user login" → Mermaid → `login-flow.drawio` → open in Desktop
- "png ER diagram for orders" → Mermaid → `orders-er.drawio.png` → open in Desktop
- "AWS architecture" → XML (shape styles) → `aws-architecture.drawio` → open in Desktop

There is **no `url` mode** in this skill.

### Supported export formats

| Format | Embed XML | Notes |
|--------|-----------|-------|
| `png` | Yes (`-e`) | Viewable everywhere, editable in draw.io |
| `svg` | Yes (`-e`) | Scalable, editable in draw.io |
| `pdf` | Yes (`-e`) | Printable, editable in draw.io |
| `jpg` | No | Lossy, no embedded XML support |

PNG, SVG, and PDF support `--embed-diagram` — the exported file contains the full diagram XML, so opening it in draw.io recovers the editable diagram. After a successful image/PDF export, delete the intermediate `.drawio` (the export embeds it).

## draw.io CLI

The draw.io desktop app includes a command-line interface used for **converting Mermaid** to `.drawio`, applying **ELK layouts** (`--layout`), and **exporting** to PNG/SVG/PDF. All three require the desktop app to be installed.

### Locating the CLI

#### WSL2 (Windows Subsystem for Linux)

WSL2 is detected when `/proc/version` contains `microsoft` or `WSL`:

```bash
grep -qi microsoft /proc/version 2>/dev/null && echo "WSL2"
```

On WSL2, use the Windows draw.io Desktop executable via `/mnt/c/...`:

```bash
DRAWIO_CMD="/mnt/c/Program Files/draw.io/draw.io.exe"
```

Double-quote the path so the space in `Program Files` is treated as part of the path. Do **not** wrap it in backticks.

#### macOS

```bash
/Applications/draw.io.app/Contents/MacOS/draw.io
```

Prefer the explicit app path over `drawio` on PATH when both exist.

#### Linux (native)

```bash
drawio   # typically on PATH via snap/apt/flatpak
```

#### Windows (native, non-WSL2)

```
"C:\Program Files\draw.io\draw.io.exe"
```

Use `which drawio` (or `where draw.io` on Windows) to check if it's on PATH before falling back to the platform-specific path.

### Convert / layout / export commands

**Convert Mermaid to `.drawio`:**

```bash
drawio -x -f xml -o diagram.drawio diagram.mmd
```

**Apply an ELK layout to XML:**

```bash
drawio -x -f xml --layout verticalFlow -o diagram.drawio diagram.drawio
```

**Export to an image format:**

```bash
drawio -x -f <format> -e -b 10 -o "<output>" "<input.drawio>"
```

Key flags:

- `-x` / `--export`: export mode (also used for Mermaid conversion and layout passes)
- `-f` / `--format`: output format (`xml`, png, svg, pdf, jpg) — use `xml` to produce a `.drawio` from Mermaid or a layout pass
- `--layout`: run an ELK layout preset name or custom-layout JSON array before writing the output
- `-e` / `--embed-diagram`: embed diagram XML in the output (PNG, SVG, PDF only)
- `-o` / `--output`: output file path
- `-b` / `--border`: border width around diagram (default: 0)

## Opening the result

Open the file in **draw.io Desktop**, not a browser.

| Environment | Preferred command |
|-------------|-------------------|
| macOS | `open -a "draw.io" <file>` |
| Linux (native) | `xdg-open <file>` (relies on `.drawio` → Desktop association) |
| WSL2 | `cmd.exe /c start "" "$(wslpath -w <file>)"` |
| Windows | `start "" "<file>"` |

On macOS, if `open -a "draw.io"` fails (app name differs), try:

```bash
open -a "/Applications/draw.io.app" <file>
```

or the file association fallback:

```bash
open <file>
```

**WSL2 notes:**

- `wslpath -w <file>` converts a WSL path to a Windows path. Required because `cmd.exe` cannot resolve `/mnt/c/...` paths.
- The empty string `""` after `start` prevents `start` from treating the filename as a window title.

After opening, print the absolute file path so the user can find it:

```
Opened in draw.io Desktop: /absolute/path/to/diagram.drawio
```

## File naming

- Use a descriptive filename based on the diagram content (e.g. `login-flow`, `database-schema`)
- Use lowercase with hyphens for multi-word names
- When authoring Mermaid, write it to a matching `.mmd` file, convert to `.drawio`, then delete the `.mmd` — the `.drawio` is the artifact
- For export, use double extensions: `name.drawio.png`, `name.drawio.svg`, `name.drawio.pdf`
- After a successful export, delete the intermediate `.drawio` file — the exported file contains the full diagram

## XML format

A `.drawio` file is native mxGraphModel XML. When authoring as XML, generate it directly; Mermaid is converted to this same format by the CLI (`-f xml`).

### Basic structure

```xml
<mxGraphModel adaptiveColors="auto">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
  </root>
</mxGraphModel>
```

- Cell `id="0"` is the root layer
- Cell `id="1"` is the default parent layer
- All diagram elements use `parent="1"` unless using multiple layers

Never emit XML comments in real output.

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| draw.io CLI not found | Desktop app not installed or not on PATH | Author as XML and deliver a `.drawio` file. Tell the user to install draw.io Desktop for Mermaid conversion, ELK layout, and image export |
| Mermaid → PNG export crashes | Direct `.mmd` → PNG with `-e` is broken in current draw.io Desktop | Two-step path: Mermaid → `.drawio` (`-f xml`), then export that file |
| Blank diagram from Mermaid | Misspelled type keyword or syntax error | Check `mermaid-reference.md` |
| Layout does nothing / errors | Unknown preset name, or custom JSON not an array | Use a preset from [Layout presets](#layout-presets), or a JSON array starting with `[` |
| Export produces empty/corrupt file | Invalid XML | Validate well-formedness before writing |
| Diagram opens but looks blank | Missing root cells `id="0"` and `id="1"` | Ensure the basic mxGraphModel structure is complete |
| Edges not rendering | Edge mxCell is self-closing (no child mxGeometry) | Every edge must have `<mxGeometry relative="1" as="geometry" />` as a child |
| File won't open in Desktop | App not installed, or wrong open command | Print the absolute path; on macOS prefer `open -a "draw.io"` |
| Browser opens instead of Desktop | Used `open <url>` or a `#create=` URL | Never generate remote URLs — only open local file paths |

## CRITICAL: XML well-formedness

- **NEVER include ANY XML comments (`<!-- -->`) in the output.**
- Escape special characters in attribute values: `&amp;`, `&lt;`, `&gt;`, `&quot;`
- Always use unique `id` values for each `mxCell`
