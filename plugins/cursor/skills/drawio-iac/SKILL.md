---
name: drawio-iac
description: Always use when the user asks to diagram infrastructure-as-code — Terraform, OpenTofu, AWS CDK, Pulumi, CloudFormation, Helm charts, Kubernetes manifests, Docker Compose, or serverless.yml — as an architecture diagram with real cloud resources.
---

# Draw.io from IaC (infra → diagram)

Turn **infrastructure-as-code** into a `.drawio` with official cloud icons, open in **draw.io Desktop**. Local-only.

Depends on the sibling **`drawio`** skill (especially `scripts/search-shapes.js`).

## Resolve helpers

```bash
DRAWIO_SKILL="${HOME}/.cursor/skills/drawio"
node "$DRAWIO_SKILL/scripts/search-shapes.js" "aws group vpc"
node "$DRAWIO_SKILL/scripts/search-shapes.js" "aws lambda"
```

## Discover IaC sources

| Tool | Paths / signals |
|------|-----------------|
| Terraform / OpenTofu | `*.tf`, `modules/`, `.terraform.lock.hcl` |
| AWS CDK | `cdk.json`, `lib/*.ts`, `bin/*.ts` |
| Pulumi | `Pulumi.yaml`, `index.ts` / `__main__.py` |
| CloudFormation / SAM | `template.yaml`, `*.template.json` |
| Kubernetes / Helm | `*.yaml` with `kind:`, `charts/`, `values.yaml` |
| Docker Compose | `compose.yaml`, `docker-compose.yml` |
| Serverless Framework | `serverless.yml` |

Read the manifests. List **resources** with provider, type, and **name/id**. Prefer explicit resource blocks over data sources.

## Authoring rules

1. **Always run `search-shapes.js`** for each cloud icon (AWS4 / Azure / GCP / K8s). Prefer `aws4.resourceIcon` and `aws4.group` results over legacy aws3.
2. **Nest groups** from the IaC topology:
   - AWS: Region → VPC → public/private subnets → resources
   - K8s: Cluster → Namespace → Deployments/Services/Ingress
   - Compose: project → services → networks/volumes
3. Children use `parent="<group_id>"` and coordinates **relative to the parent**.
4. Edges = real network/data paths implied by the IaC (security group rules, ingress, depends_on, VPC links). Label with ports/protocols when present.
5. Label nodes with **resource names** from code (`aws_ecs_service.orders`, `module.vpc`).

### Minimal AWS XML pattern

Containers and icons come from search — do not invent styles. Typical query set:

```bash
node "$DRAWIO_SKILL/scripts/search-shapes.js" "aws group region"
node "$DRAWIO_SKILL/scripts/search-shapes.js" "aws group vpc"
node "$DRAWIO_SKILL/scripts/search-shapes.js" "aws group public subnet"
node "$DRAWIO_SKILL/scripts/search-shapes.js" "aws group private subnet"
# plus each resource type: lambda, rds, s3, ecs, alb, …
```

### Kubernetes

Search `kubernetes deployment`, `kubernetes service`, `kubernetes pod`, `kubernetes ingress`. Group by namespace.

## Output

- File: `infra-<stack>.drawio` or `terraform-<module>.drawio`, often under `docs/architecture/`
- One diagram per stack/module unless the user wants a live map of everything
- Call out resources **omitted** for clarity (IAM policies noise, etc.) in the chat

## Open

Desktop only. Never `app.diagrams.net`.

## Hand-offs

- Application code architecture (not infra) → `drawio-from-code`
- Patch existing infra diagram → `drawio-update`
- Export for docs → `drawio-docs`
