# HelioGrid

Production multi-tenant SaaS for solar EPC companies — CRM → survey (remote + physical)
→ 3D Design Studio → proposal → tokenised customer link → AI voice-agent follow-up →
project tracking → payments. India-first (GST, DISCOM, PM Surya Ghar, TRAI/DND, ₹
lakh/crore, EN/HI/MR), architected for global expansion. **The 3D Design Studio is the
flagship feature.**

## Status: PLANNING → BUILD

This repository currently contains the complete production architecture and planning
documentation. Application code lands next, following `docs/14-build-roadmap.md`.
The validated engineering core (geometry, electrical, BOM, energy, structure engines)
is ported from the proof-of-concept at `Solar-App-POC` per `docs/05-domain-migration.md`.

## Local development

Verified cold-start order. Steps 2 and 3 are not optional: workspace packages resolve through
their `dist/`, so a migrate on an unbuilt tree dies on `MODULE_NOT_FOUND` with nothing pointing
at the cause.

```bash
nvm use                                  # Node 22 (engines: >=22 <23)
pnpm install --frozen-lockfile
pnpm turbo build                         # REQUIRED before anything below

docker run --rm -d --name heliogrid-db \
  -e POSTGRES_USER=heliogrid -e POSTGRES_PASSWORD=heliogrid \
  -e POSTGRES_DB=heliogrid -p 5432:5432 postgres:16

cp .env.example .env.local               # then fill in:
#   DATABASE_URL / DATABASE_ADMIN_URL  -> the container above
#   BETTER_AUTH_SECRET                 -> openssl rand -hex 16   (>=32 chars, no default)

pnpm --filter @heliogrid/db migrate      # schema + roles (0001-0006)
pnpm --filter @heliogrid/api auth:migrate # Better Auth's own 7 tables
pnpm verify                              # lint - boundaries - typecheck - test - build
```

Then, per app: `pnpm --filter @heliogrid/api dev` · `pnpm --filter @heliogrid/web dev`
· `pnpm --filter @heliogrid/mobile start` (see each app's `CLAUDE.md` §Commands).

`.env.local` is git-ignored and is the ONLY place local secrets live. Which commands read it,
and which take their URL from the shell instead, is documented at the top of `.env.example`.

## Read this first

| | |
|---|---|
| `docs/BLUEPRINT.md` | The approved architecture blueprint (binding) |
| `CLAUDE.md` | Agent constitution — rules for all AI-assisted development |
| `docs/00-vision-and-scope.md` | Product, v1 scope, non-goals |
| `docs/02-system-architecture.md` | Full system design |
| `docs/03-tech-stack.md` | Every technology choice, justified and pinned |
| `docs/04-data-model.md` | Multi-tenant schema |
| `docs/14-build-roadmap.md` | The 20-day build plan: tracks, day ranges, launch gate |
| `docs/adr/` | Architecture decision records |
| `docs/research/` | Verified market + technology research backing the decisions |

## Stack (summary)

NestJS · Next.js · bare React Native (iOS+Android) · ts-rest + Zod contracts · Drizzle +
Postgres · PowerSync (offline-first field app) · Better Auth + MSG91 OTP · BullMQ +
Upstash · Fly.io (Mumbai) + Tigris · three.js/WebGPU studio · Exotel + Sarvam voice agent
· Razorpay billing · Lingui i18n. Rationale: `docs/03-tech-stack.md`.

## Repo setup

```bash
# remote not yet configured — after creating the GitHub repo:
git remote add origin git@github.com:<org>/heliogrid.git
git push -u origin main
```
