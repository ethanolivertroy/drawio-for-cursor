#!/usr/bin/env bash
# Install all draw.io Cursor skills for the current user.
# Run from a drawio-mcp checkout:
#   ./plugins/cursor/install.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SKILLS_SRC="$ROOT/plugins/cursor/skills"
SKILLS_DST="${HOME}/.cursor/skills"

SKILLS=(
  drawio
  drawio-update
  drawio-from-code
  drawio-erd
  drawio-iac
  drawio-docs
)

mkdir -p "$SKILLS_DST"

for name in "${SKILLS[@]}"; do
  src="$SKILLS_SRC/$name"
  dst="$SKILLS_DST/$name"

  if [[ ! -f "$src/SKILL.md" ]]; then
    echo "error: skill not found at $src" >&2
    exit 1
  fi

  ln -sfn "$src" "$dst"
  echo "Installed $dst -> $src"
done

echo
echo "Requires:"
echo "  - Node.js >= 18 (shape search, list-cells, export-docs)"
echo "  - draw.io Desktop (Mermaid convert, ELK, export, open)"
echo
echo "Skills:"
echo "  drawio            create diagrams (Mermaid/XML) + shape search"
echo "  drawio-update     edit an existing .drawio in place"
echo "  drawio-from-code  architecture from the repository"
echo "  drawio-erd        ERD from Prisma/Drizzle/SQL/…"
echo "  drawio-iac        diagram Terraform/K8s/CDK/Compose/…"
echo "  drawio-docs       export PNG/SVG/PDF into docs/ for README/PRs"
echo
echo "Start a new Agent chat in Cursor so skills are picked up."
echo "Shape search: node \"$SKILLS_DST/drawio/scripts/search-shapes.js\" \"aws lambda\""
