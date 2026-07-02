# drawio-for-cursor

Cursor Agent skills that create and maintain [draw.io](https://www.draw.io) diagrams as **local `.drawio` files** and open them in the **draw.io Desktop** app.

No MCP server. No browser tabs. No `app.diagrams.net` — diagrams stay on disk and edit in Desktop.

## Skills

| Skill | When it triggers | Job |
|-------|------------------|-----|
| [`drawio`](skills/drawio/) | create / draw a diagram | Author Mermaid or XML, look up official icons, open Desktop |
| [`drawio-update`](skills/drawio-update/) | update / edit an existing `.drawio` | Patch cells in place (no full rewrite) |
| [`drawio-from-code`](skills/drawio-from-code/) | diagram this codebase / architecture | Infer C4-style containers from the repo |
| [`drawio-erd`](skills/drawio-erd/) | ERD / data model / Prisma schema | Schema → entity-relationship diagram |
| [`drawio-iac`](skills/drawio-iac/) | Terraform / K8s / CDK / Compose | IaC resources → iconed infra diagram |
| [`drawio-docs`](skills/drawio-docs/) | export to docs / README / PR | PNG/SVG/PDF with embedded XML under `docs/` |

Shared CLIs live under [`skills/drawio/scripts/`](skills/drawio/scripts/):

| Script | Purpose |
|--------|---------|
| `search-shapes.js` | Official AWS / Azure / GCP / K8s / … icon `style` strings |
| `list-cells.js` | Inventory ids / labels / edges in an existing `.drawio` |
| `export-docs.js` | Desktop CLI export into `docs/architecture` |

## Prerequisites

- [Cursor](https://cursor.com) with Agent mode
- [Node.js](https://nodejs.org/) ≥ 18
- [draw.io Desktop](https://github.com/jgraph/drawio-desktop/releases)

## Install

```bash
git clone https://github.com/ethanolivertroy/drawio-for-cursor.git
cd drawio-for-cursor
./install.sh
```

Symlinks every skill into `~/.cursor/skills/`. Start a **new Agent chat** in Cursor so skills load.

The install uses this checkout’s `shape-search/search-index.json` for offline icon search. A copy-only install (no clone) still works: the first `search-shapes.js` run downloads the index from the CDN and caches it.

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

Stdout is JSON `{title, style, w, h}`. Paste `style` into an `mxCell`. Icons come from draw.io’s own libraries (AWS4, Azure, GCP, Cisco, Kubernetes, …), indexed under [`shape-search/`](shape-search/).

## Local-only

| Step | Where it runs |
|------|----------------|
| Author diagram | Cursor agent writes `.drawio` / `.mmd` in your workspace |
| Mermaid convert, ELK layout, PNG/SVG/PDF | draw.io Desktop CLI on your machine |
| Open / edit | draw.io Desktop |
| Icon lookup | Local index (or one-time CDN cache) |

Nothing is sent to a hosted MCP or cloud render endpoint.

## License

Apache-2.0 (see [LICENSE](LICENSE)). Icon styles and Mermaid/XML guidance derive from the upstream [draw.io](https://github.com/jgraph/drawio) / [drawio-mcp](https://github.com/jgraph/drawio-mcp) ecosystem; this repo packages a Cursor-native Desktop workflow only.
