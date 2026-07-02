---
name: drawio-from-code
description: Always use when the user asks to diagram, map, or visualize the architecture of this codebase, repository, monorepo, services, packages, modules, or system boundaries from the actual source code — C4-style container/component views derived from the repo.
---

# Draw.io from Code (codebase → architecture)

Infer a system architecture diagram **from the repository**, write a native `.drawio`, and open it in **draw.io Desktop**. Local-only — no browser URLs.

Depends on the sibling **`drawio`** skill (shape search, Desktop open, XML rules, Mermaid/XML authoring).

## Resolve helpers

```bash
DRAWIO_SKILL="${HOME}/.cursor/skills/drawio"
node "$DRAWIO_SKILL/scripts/search-shapes.js" "aws lambda"
```

Read `$DRAWIO_SKILL/xml-reference.md` before authoring XML.

## Workflow

1. **Scope** — whole repo, one package, one service, or a path the user named.
2. **Discover structure** (read, don’t guess):
   - Top-level packages / apps / services (`package.json` workspaces, `go.mod`, `Cargo.toml`, `pyproject.toml`, `*.sln`, `services/`, `apps/`, `packages/`)
   - Entry points and scripts (`main`, `bin`, Dockerfiles, `cmd/`, `src/index.*`)
   - Boundaries: HTTP/gRPC clients, message publishers/consumers, DB drivers, cloud SDKs
   - Deploy shape if present: Terraform, Helm, k8s manifests, `serverless.yml`, CDK (or hand off to **`drawio-iac`** when the diagram should mirror infra resources only)
3. **Choose a C4 level**:
   - **Container** (default): deployable apps, DBs, queues, third-party SaaS
   - **Component**: major modules inside one service (only if user asks or scope is a single service)
   - Skip pure “code class” graphs unless asked (use UML via Mermaid in the `drawio` skill instead)
4. **Author**:
   - Prefer **XML** when cloud/branded icons are needed — run `search-shapes.js` for AWS/Azure/GCP/K8s icons
   - Prefer **Mermaid** (`flowchart` / `C4Context` if supported) for simple internal module maps, then Desktop CLI convert: `drawio -x -f xml -o out.drawio out.mmd`
5. Write `architecture-<scope>.drawio` (or a name the user asked for) in the workspace — often `docs/architecture/`.
6. Open in Desktop. Print path + a short legend (what each box maps to in the repo).

## Mapping rules

| Code signal | Diagram element |
|-------------|-----------------|
| Deployable service / app package | Container box (or Fargate/Lambda/Cloud Run icon if cloud-bound) |
| PostgreSQL/MySQL/SQLite client | DB cylinder or RDS/Cloud SQL icon |
| Redis / Dynamo / Mongo | Cache/DB icon from shape search |
| SQS / Kafka / PubSub / Rabbit / NATS | Queue icon |
| S3 / GCS / Azure Blob usage | Object storage icon |
| External HTTP API | External system box |
| Shared library package only | Omit from container view (mention in notes) unless user wants packages |

- Label boxes with **real names** from the repo (`mcp-tool-server`, `order-service`), not generic “Service A”.
- Edges are **runtime** dependencies (calls, publishes, reads), not import graphs. An edge label can be `HTTP`, `gRPC`, `SQL`, `publish`.
- Group by trust boundary when obvious (VPC, cluster, “Browser”, “Third-party”).

## Layout

- Left-to-right or top-to-bottom request flow (clients → edge → services → data).
- Nested AWS groups only when the code/infra clearly runs there; otherwise plain swimlanes / rounded containers.
- Optional ELK: `drawio -x -f xml --layout horizontalFlow -o file.drawio file.drawio`

## Do not

- Invent services that are not evidenced in the repo
- Open `app.diagrams.net`
- Dump every source file as a node

## Hand-offs

- **Data model only** → `drawio-erd`
- **Terraform/K8s resources only** → `drawio-iac`
- **Patch an existing arch diagram** → `drawio-update`
- **Export PNG into docs/** → `drawio-docs`
