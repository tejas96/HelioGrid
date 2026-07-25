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
