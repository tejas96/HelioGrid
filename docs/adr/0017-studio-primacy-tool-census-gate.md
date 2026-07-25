# ADR-0017: Studio primacy — the phase-10 tool census is the port acceptance gate; WebView studio on mobile

Status: Accepted (amended 2026-07-24 rev 2 — build order)
Date: 2026-07-24

## Context

The 3D Design Studio is THE flagship feature (binding directive: nothing is compromised against it). The POC studio is real working engineering — roof factories, layout engine, IEC 62548 electrical ladders, PVGIS energy, shading, BOM with provenance tiers, SLD, ~110 gate tests — and D39 ruled it is kept and refactored, never redesigned from scratch. The risk in any port is silent capability loss: a tool or computed output that quietly fails to survive the move.

## Decision

1. **The phase-10 tool census (`../research/phases710.md` §2, screens 10.1–10.11) is the binding acceptance checklist for the studio port.** Every tool and every computed output listed there survives, refactored to the design system, touch-first. A studio-port slice is not done until its census rows are checked against the running app — the census review is a merge gate for port PRs, on par with typecheck/lint.
2. **Build order (amended, owner directive 2026-07-24 rev 2): the studio port is the LAST major build phase** (docs/14 §3a; offline follows as §3b) — because a validated implementation already exists in the POC, re-honouring D23. The move is in TIME only: the refactor targets stand unchanged (mode-based canvas not modifier keys, pinch-zoom + two-finger pan on 2D, visible labels not hover, large tap targets replacing ~9px handles, progressive disclosure for the BOM's ~286 controls) with honesty systems intact (provenance labels, PVGIS-vs-estimate, structure = material modelling only, engineer sign-off human). Launch-1 sells on Path B proposals + remote survey; Path A and the BOM money-path join activate when this phase lands.
3. **Mobile presents the full-parity touch studio through an authenticated seamless WebView** — parity per D2 is met by responsive web at 375px; native canvas editing is NOT rebuilt. No studio feature is dropped on any surface.
4. **The scale program (ADR-0014: blocks/zones, GPU shading, trackers, terrain) is investment INTO the studio moat** — it is never cited as a reason to cut studio capability, and it lands as studio phases after the port.

## Consequences

- The studio is calendar-bound to Track D (Days 14–18) inside the single 20-day release; the census remains the QUALITY gate — the release valve is non-census scope elsewhere (dashboard polish, analytics depth), never a studio-less launch and never census rows.
- The census makes capability loss auditable: an agent (or reviewer) can diff the checklist against the running app rather than trusting "looks complete".
- WebView means the studio is **not offline on mobile in v1** and requires an authenticated session bridge — the field survey flow (which IS offline, ADR-0009) is deliberately separate from design work.
- One studio codebase to maintain instead of two; WebView performance on low-end Android is a verification item, not an assumption.
- 375px must genuinely work for every studio screen — a hard UI contract, not an aspiration.

## Alternatives rejected

- **Native RN canvas studio** — duplicates a ~40-module engineering core plus renderer on a second platform; guaranteed permanent parity drift; rejected.
- **Reduced mobile studio ("viewer only")** — violates D2 full-parity and the nothing-compromised directive.
- **Redesign from scratch** — superseded by D39: the studio's geometry/engineering/code carry over; the phase-10 file is retained as the refactor checklist, not a redesign brief.
- **Studio first in Launch-1** — the original sequencing; superseded by the owner's rev-2 priority directive: with a working POC in hand, the greenfield SaaS surfaces (CRM, billing, proposals, customer link) are the scarcer launch value, and the studio arrives whole as a marketable event.
- **Cutting studio scope to fit an earlier slot** — rejected outright; the census gate exists precisely to prevent this.

## Sources

- `../research/phases710.md` (tool census, screens 10.1–10.11; D39 supersession banner) · `../research/scale3d.md` · `../research/geo3d.md`
- BLUEPRINT.md — Final-review directive 9 (studio primacy, binding)
- POC spec: `/Volumes/works-space/Solar-App-POC/docs/product-journey.md` (D2, D23, D39)
