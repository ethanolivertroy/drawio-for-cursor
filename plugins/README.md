# AI Assistant Plugins

This directory groups assistant-side integrations by **host** — one subdirectory per AI assistant. Each subdirectory is the plugin root for its host, packaging the draw.io skill(s) in whatever format that host expects (manifest schema, file layout, invocation convention).

| Directory | Host | Status |
|-----------|------|--------|
| [`claude-code/`](claude-code/README.md) | [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | ✅ Available |
| [`cursor/`](cursor/README.md) | [Cursor](https://cursor.com) | ✅ Available (local Desktop suite) |

The Claude Code plugin is published through a marketplace manifest at the repo root ([`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json)), so users can install it with:

```
/plugin marketplace add jgraph/drawio-mcp
/plugin install drawio@drawio
```

## Cursor skill suite

Install all Cursor skills with:

```bash
./plugins/cursor/install.sh
```

| Skill | Job |
|-------|-----|
| `drawio` | Create diagrams (Mermaid/XML) + official icon search |
| `drawio-update` | Edit an existing `.drawio` in place |
| `drawio-from-code` | Architecture from the repository |
| `drawio-erd` | ERD from Prisma / Drizzle / SQL / … |
| `drawio-iac` | Terraform / K8s / CDK / Compose → infra diagram |
| `drawio-docs` | Export PNG/SVG/PDF into `docs/` for READMEs and PRs |

All are **local-only**: write/open `.drawio` via draw.io Desktop (no browser / `app.diagrams.net`). Shared CLIs (`search-shapes.js`, `list-cells.js`, `export-docs.js`) live under `cursor/skills/drawio/scripts/` — the Cursor equivalent of MCP `search_shapes`, plus inventory and docs export. See [cursor/README.md](cursor/README.md).

## Adding a plugin for another host

If support for another assistant (Codex, etc.) is added later, it lands as a sibling directory at this level:

```
plugins/
├── claude-code/              ← Claude Code plugin
└── cursor/                   ← Cursor skill suite (local Desktop)
```

The draw.io guidance itself — *how* to generate `.drawio` files and embed XML in PNG/SVG/PDF — is shared. Only the wrapping (manifest format, file layout, invocation prefix, and whether browser `url` mode is offered) differs per host.

The single source of truth for draw.io XML generation guidance lives at [`../shared/xml-reference.md`](../shared/xml-reference.md). The Claude Code skill fetches it from GitHub at runtime; the Cursor `drawio` skill keeps co-located copies (refreshed from `shared/`) so agents never need the network for authoring guidance.

## Other delivery mechanisms in this repo

Plugins are one of four ways to integrate draw.io with AI assistants. See the [root README](../README.md) for the full comparison with the MCP App Server, MCP Tool Server, and Claude Project Instructions approaches.
