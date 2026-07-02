---
name: drawio-docs
description: Always use when the user asks to export a draw.io diagram into docs, README, architecture docs, publish a PNG/SVG/PDF of a .drawio file, embed a diagram in documentation, or package diagrams for GitHub/PR review.
---

# Draw.io Docs Packager

Export an existing `.drawio` into `docs/` (or a path the user names) as **PNG/SVG/PDF with embedded XML**, link it from markdown, keep everything local via **draw.io Desktop CLI**. Never upload to a cloud rasterizer or open `app.diagrams.net`.

Depends on the sibling **`drawio`** skill (`scripts/export-docs.js`, Desktop CLI discovery).

## Resolve helpers

```bash
DRAWIO_SKILL="${HOME}/.cursor/skills/drawio"
node "$DRAWIO_SKILL/scripts/export-docs.js" path/to/diagram.drawio --format png --out docs/architecture
```

## Workflow

1. **Find the source** `.drawio` (user path, or recently discussed / only diagram in the workspace).
2. **Export** with embedded XML (file remains editable in Desktop when opened):

```bash
node "$DRAWIO_SKILL/scripts/export-docs.js" aws-order-microservice.drawio --format png --out docs/architecture
```

Equivalent Desktop CLI:

```bash
drawio -x -f png -e -b 10 -o docs/architecture/aws-order-microservice.drawio.png aws-order-microservice.drawio
```

Formats: `png` (default), `svg`, `pdf`. Output naming: `<name>.drawio.<format>` (signals embedded diagram).

3. **Keep the `.drawio` source** in the repo when it is the living artifact (unlike one-shot export in the create skill, docs packaging usually retains both).
4. **Link from markdown** — README or `docs/architecture/README.md`:

```markdown
## Architecture

![Order microservice](docs/architecture/aws-order-microservice.drawio.png)

Editable source: [`aws-order-microservice.drawio`](../aws-order-microservice.drawio)
```

Adjust relative paths to match where you put files. Prefer coherent layout:

```
docs/architecture/
  README.md
  aws-order-microservice.drawio.png
  # optional: copy or symlink the .drawio here too
```

5. If the user wants the diagram **only** under `docs/architecture/`, move/copy the `.drawio` there and update links — don’t leave orphans.
6. Print absolute paths of exported files and any markdown you updated.

## Rules

- Always pass **`-e` / `--embed-diagram`** for png/svg/pdf so GitHub previews stay re-editable in Desktop.
- Do **not** delete the source `.drawio` after docs export unless the user asks for export-only delivery.
- If Desktop CLI is missing, say so and stop — do not fall back to any cloud convert endpoint.
- Local-only: no `convert.diagrams.net`, no browser `#create=` URLs.

## Hand-offs

- Create a new diagram → `drawio`
- Patch then export → `drawio-update` then this skill
- Build diagram from code/IaC/schema first → `drawio-from-code` / `drawio-iac` / `drawio-erd`, then this skill
