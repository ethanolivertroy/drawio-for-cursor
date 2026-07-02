---
name: drawio-update
description: Always use when the user asks to update, edit, modify, patch, revise, extend, or change an existing draw.io / .drawio diagram — add or remove services, boxes, arrows, labels, or layers without recreating the whole diagram from scratch.
---

# Draw.io Update (edit in place)

Patch an **existing** `.drawio` file. Do **not** regenerate the whole diagram unless the user explicitly wants a rewrite. Open the result in **draw.io Desktop** (local-only — never browser URLs or `app.diagrams.net`).

Depends on the sibling **`drawio`** skill for Desktop open commands, XML well-formedness, shape search, and co-located references. Both skills should be installed under `~/.cursor/skills/`.

## Resolve helpers

```bash
DRAWIO_SKILL="${HOME}/.cursor/skills/drawio"
# monorepo / sibling fallback:
# DRAWIO_SKILL="<this-skill-dir>/../drawio"

node "$DRAWIO_SKILL/scripts/list-cells.js" path/to/diagram.drawio --edges --json
node "$DRAWIO_SKILL/scripts/search-shapes.js" "aws sqs"
```

## Workflow

1. **Locate the file** — path from the user, or the most recent / mentioned `.drawio` in the workspace. If ambiguous, ask once.
2. **Inventory** — run `list-cells.js --edges --json` (or read the file) and note cell `id`s, labels, parents, and edge source/target pairs.
3. **Plan a minimal patch** — prefer add/remove/relabel over a full rewrite. Keep existing ids stable when cells stay.
4. **Edit the XML on disk**:
   - Add vertices with **new unique ids** (never reuse `0` / `1`).
   - Nest into containers with `parent="<container_id>"` and **coordinates relative to the parent**.
   - Edges between different containers: `parent="1"`, always include a child `<mxGeometry relative="1" as="geometry"/>`.
   - For industry icons, run `search-shapes.js` and paste the `style` string — do not invent `mxgraph.aws4.*` styles.
5. **Validate** — no `<!-- -->` comments; escape `&`, `<`, `>`, `"` in attributes; every edge has geometry.
6. **Open** with Desktop (same commands as the `drawio` skill: `open -a "draw.io" <file>` on macOS).
7. Print the absolute path and a short summary of what changed (ids added/removed/updated).

## Patch patterns

### Add a service / box

Pick a free id (e.g. `sqs1`). Place it near related nodes, preferably inside the correct group (`parent` = VPC / subnet / region cell id from the inventory).

### Add an edge

```xml
<mxCell id="e20" value="Publish" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;" edge="1" parent="1" source="ecs" target="sqs1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

### Remove a cell

Delete the `mxCell` and **every edge** that referenced it as `source` or `target`.

### Relabel

Change only the `value="..."` attribute (use `&#xa;` for line breaks). Leave `id` and connections alone.

### Grow a container

If new children do not fit, increase the container’s `mxGeometry` `width` / `height` and nudge siblings — do not flatten hierarchy into `parent="1"`.

## When to refuse in-place and recreate

Only if the file is corrupt, not actually draw.io XML, or the user asks for a full redesign. Say so explicitly before rewriting.

## Local-only rules

- Never open remote `#create=` URLs or MCP hosted endpoints.
- Never forbid edit-in-place “because regenerating is easier.”
- After a successful patch, open **Desktop**, not a browser.
