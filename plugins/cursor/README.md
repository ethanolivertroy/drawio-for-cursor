# Draw.io Skills for Cursor (local-only)

Cursor Agent skills that generate and maintain native `.drawio` files and open them in the **draw.io Desktop** app. No MCP server, no browser, no `app.diagrams.net`.

| Skill | When it triggers | Job |
|-------|------------------|-----|
| [`drawio`](skills/drawio/) | create / draw a diagram | Author Mermaid or XML, shape search, open Desktop |
| [`drawio-update`](skills/drawio-update/) | update / edit an existing `.drawio` | Patch cells in place (no full rewrite) |
| [`drawio-from-code`](skills/drawio-from-code/) | diagram this codebase / architecture | Infer C4-style containers from the repo |
| [`drawio-erd`](skills/drawio-erd/) | ERD / data model / Prisma schema | Schema → entity-relationship diagram |
| [`drawio-iac`](skills/drawio-iac/) | Terraform / K8s / CDK / Compose | IaC resources → iconed infra diagram |
| [`drawio-docs`](skills/drawio-docs/) | export to docs / README / PR | PNG/SVG/PDF with embedded XML under `docs/` |

Shared scripts live under `skills/drawio/scripts/`:

| Script | Purpose |
|--------|---------|
| `search-shapes.js` | Official AWS/Azure/GCP/K8s/… icon `style` strings (MCP `search_shapes` equivalent) |
| `list-cells.js` | Inventory ids/labels/edges in an existing `.drawio` |
| `export-docs.js` | Desktop CLI export into `docs/architecture` |

Companion skills expect the **`drawio`** skill to be installed (they resolve `$HOME/.cursor/skills/drawio`).

## Prerequisites

- [Cursor](https://cursor.com) with Agent mode
- [Node.js](https://nodejs.org/) ≥ 18
- [draw.io Desktop](https://github.com/jgraph/drawio-desktop/releases)

## Installation

```bash
./plugins/cursor/install.sh
```

Symlinks every skill into `~/.cursor/skills/`. The monorepo `shape-search/search-index.json` is used automatically (offline shape search).

### Manual

```bash
mkdir -p ~/.cursor/skills
for s in drawio drawio-update drawio-from-code drawio-erd drawio-iac drawio-docs; do
  ln -sfn "$(pwd)/plugins/cursor/skills/$s" ~/.cursor/skills/$s
done
```

### Copy install (no monorepo)

```bash
mkdir -p ~/.cursor/skills
cp -R plugins/cursor/skills/* ~/.cursor/skills/
```

First `search-shapes.js` run downloads the icon index from the CDN (~4.6 MB) and caches it under the `drawio` skill directory.

Restart Cursor or start a **new Agent chat** so skills load.

## Example prompts

| Prompt | Skill |
|--------|-------|
| “Draw an AWS order microservice architecture” | `drawio` |
| “Add an SQS queue to `aws-order-microservice.drawio`” | `drawio-update` |
| “Diagram the architecture of this repo” | `drawio-from-code` |
| “ERD from our Prisma schema” | `drawio-erd` |
| “Diagram the Terraform in `infra/`” | `drawio-iac` |
| “Export that diagram into `docs/architecture` for the README” | `drawio-docs` |

## Shape search

```bash
node ~/.cursor/skills/drawio/scripts/search-shapes.js "aws lambda"
node ~/.cursor/skills/drawio/scripts/search-shapes.js "aws group vpc" --limit 5
```

## Refreshing co-located copies

After editing monorepo sources:

```bash
cp shared/xml-reference.md shared/mermaid-reference.md plugins/cursor/skills/drawio/
cp shared/shape-search.js plugins/cursor/skills/drawio/scripts/
```

## Related

- [Claude Code Plugin](../claude-code/README.md) — Claude Code create skill (includes optional browser `url` mode)
- [MCP Tool Server](../../mcp-tool-server/README.md) — stdio MCP (browser URLs, not Desktop)
- [`shared/shape-search.js`](../../shared/shape-search.js) · [`shape-search/search-index.json`](../../shape-search/search-index.json)
