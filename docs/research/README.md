# docs/research — exploration corpus, four tiers

**Every file carries a status banner on its first line. Read the banner before the file.**
This directory is not uniformly historical: a handful of files are still delegated binding
authority by live documents, and two actively recommend the wrong stack.

Nothing here is deleted. Over a hundred inbound links and several ADR `Sources:` citations
depend on these paths resolving. When a NORMATIVE file's content is promoted into `docs/`,
change its banner to PROMOTED and point at the new home — do not remove the file.

## NORMATIVE — still binding (8)

A live document delegates authority to these. Do not archive one without promoting its
content first.

| File | Who delegates to it |
|---|---|
| `journey.md` | docs/00, docs/13, docs/15 §1 (the 18 rulings, which reuse journey.md's own §6 numbering) |
| `ds-reconciliation.md` | docs/15 §3: its 22 resolutions are binding, "agents do not re-litigate them" |
| `uxAL.md` · `uxMZ.md` | docs/13 — the only interpretation layer over 80 raw mockups |
| `ds-usage.md` | docs/10, docs/15 R19 — empirical ground truth for which component specs are real |
| `calc.md` | docs/05 (calculation audit), docs/04 (spec shapes verbatim) |
| `geo3d.md` | docs/05, docs/02, docs/03, ADR-0014, ADR-0017 |
| `market.md` | docs/01 (the price ladder rests on its INR correction), docs/12, ADR-0013 |

`calc.md` and `geo3d.md` stay until the Track D studio port completes — the POC code they
audit lives in another repository.

## PROMOTED — content moved to a live document (2)

| File | New home |
|---|---|
| `phases710.md` | §2 tool census → `docs/product/studio-census.md` (canonical) |
| `design.md` | N1–N10 + touch contract → `docs/10` §11 |

## ⚠ OVERTURNED — do not follow (2)

These recommend stacks that were subsequently reversed. **Read standalone, they hand you the
wrong architecture.** Retained only as considered-alternatives evidence for the ADRs.

| File | Recommends | Actually shipped |
|---|---|---|
| `backend.md` | Hono + oRPC + Graphile; rejects NestJS | NestJS + ts-rest + BullMQ (ADR-0002/0003/0008) |
| `fly.md` | Crunchy Bridge + AWS S3; rejects Tigris | Fly postgres-flex + Tigris `sin` + Upstash (ADR-0006/0007/0008) |

## HISTORICAL EVIDENCE — cite the ADR, not the file (14)

`appShape.md` · `auth.md` · `buildplan.md` · `ds-brand-law.md` · `ds-tokens.md` ·
`integrations.md` · `scale3d.md` · `sync.md` · `tooling.md` · `voice.md` ·
`verify-bareRn.md` · `verify-billing.md` · `verify-flyNative.md` · `verify-nestContracts.md`

Each banner names the ADR or document that carries its conclusion. Two carry live caveats:
`voice.md` predates spike S5 (which corrected BYO/DTMF/1600-series — ADR-0019 is operative),
and `tooling.md`'s agent-rules section is doubly dead (that layer was redesigned; see
`CLAUDE.md` and `.claude/`).

## Provenance note

Several files cite `/Users/devtejas/Downloads/HelioGrid UX/…` or
`/Volumes/works-space/Solar-App-POC/…` — paths outside this repository. The content they
describe is vendored here as `design/mockups/`, `design/ds-source/` and
`docs/product/product-journey.md`. Prefer the vendored paths.
