# MS11 · Studio Step 10 (Done) · sign-off · variants · the installation work order

Status: draft · Origin mix: SRC-CODE-dominant + BRIEF (Sitting 10 rulings, 2026-08-05) · Depends on: MS6 (design), MS7 (review), MS8 (electrical gate), MS10 (BOM), MS9 (customer surfaces), F8-25 (sign-off law), F2 (Design Engineer approval capability), M08 (R16 installation attribution), Q28
Sources: POC code inventory — done (**132 keys**) + installation (**64 keys**) = 196 · sitting rulings (S10-1…S10-3) · census A.10-11. The ledger index is retired; the POC repository named in `docs/build-order.md` is the source, and the sitting rulings are carried by the rows below.
Forward: MS9 (issuance gating), F5 (customer link), M08 (project-side installation checklist).

## 1. Purpose & scope

Three things finish a design: the **Done step** (what a designer does at the end), the **fingerprint system** that decides what must recalculate and what has gone stale, and the **installation work order** the crew builds from. This document also lands the studio's biggest structural gap: the POC has **no engineer sign-off flow at all** — only a free-to-flip chip — while the main suite treats sign-off as a safety law (F8-25, UXG-06/07). S10-1 builds it.

## 2. Personas & surfaces

Design Engineer (finish, duplicate) · Design Engineer with approval capability (queue, review, approve/return — F2) · Project Manager / Installation team (work order, R16) · Sales Executive (share actions).

## 3. Feature areas

### MS11.1 — The Done step

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS11-01 | Step 10 is the terminal wizard screen, reachable only when every earlier gate passes; it stamps completion and shows the project's identity (`.1/.2/.12–.16/.125–.128`). | `SRC-CODE` | P0 |
| MS11-02 | Marking a design ready has a READINESS PRECONDITION — the same review Step 7 shows — and every writer of that state applies it consistently (S10-1/S8-2a fix `.3/.6/.7`) (`.4/.5`). | `SRC-CODE` + `BRIEF` S10-1 | P0 |
| MS11-03 | The readiness review is SURFACED on Step 10, not only Step 7 (S10-1 fixes `.59`). | `BRIEF` S10-1 | P0 |
| MS11-04 | Five actions: view proposal · BOM · installation plan · copy share link · done — with copy CONFIRMING success and surfacing failure (S10-3.1 fixes `.21/.22`) (`.17–.20/.23`). | `SRC-CODE` + `BRIEF` S10-3.1 | P0 |
| MS11-05 | Share actions offer the customer-facing proposal link per Q27 — not only the 3D-only link (`.25/.26` recorded divergence resolved by MS9-14). | `SRC-CODE` + `BRIEF` S8-2c | P0 |
| MS11-06 | One clear finish control (no duplicate "Done"), with help copy stating what this step does (`.24/.129`). | `SRC-CODE` | P1 |

### MS11.2 — Pre-proposal review (the shared readiness contract)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS11-07 | Review returns four ordered items — electrical · design review · quantity confidence · shadow imagery — each with the step that can fix it, three statuses, and a worst-of verdict; it DERIVES from the real gates and never re-implements them (`.28–.33/.53/.55`). | `SRC-CODE` | P0 |
| MS11-08 | Electrical item is the one blocker and states pass/fail plainly; the vacuous-ready edge (no components yet) is handled honestly (`.34–.36`). | `SRC-CODE` | P0 |
| MS11-09 | Design-review item counts insights that are neither accepted NOR dismissed (S10-3.4 fixes `.37`), with severity-driven status and plain wording (`.38–.42`). | `SRC-CODE` + `BRIEF` S10-3.4 | P0 |
| MS11-10 | Quantity-confidence item inherits the BOM's confidence rules (`.43–.46`). | `SRC-CODE` | P0 |
| MS11-11 | Imagery item reports shortfall before staleness, never blocks — and INCLUDES the cover image's staleness (S10-3.5 fixes `.52`) (`.47–.51`). | `SRC-CODE` + `BRIEF` S10-3.5 | P0 |
| MS11-12 | The review gates issuance (MS9-06) rather than being advisory-only (`.54/.56/.57/.58` + S8-2a). | `BRIEF` S10-1/S8-2a | P0 |

### MS11.3 — Engineer sign-off (built by S10-1)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS11-13 | A sign-off QUEUE exists as the approving engineer's home: designs awaiting approval, oldest first, showing customer, capacity, designer and waiting time (UXG-06). | `BRIEF` S10-1 | P0 |
| MS11-14 | A review surface lets the engineer inspect the design read-only (studio + drawings) and either APPROVE — recording who, when and against which design version — or RETURN WITH COMMENTS pinned to the object or step at issue, notifying the designer (UXG-07, F8-25). | `BRIEF` S10-1 | P0 |
| MS11-15 | Approval is bound to the design version it was given for: a material change re-opens sign-off rather than silently carrying the old approval forward (fingerprint law, MS11-16). | `BRIEF` S10-1 | P0 |
| MS11-16 | Duplicating a design NEVER carries the engineer's approval (S10-1 fixes `.117`); crew tick-offs likewise start clean (`.118`). | `BRIEF` S10-1 | P0 |
| MS11-17 | Unapproved designs cannot reach customer surfaces (S10-1 fixes `.131`, pairs with MS9-06); the installation sheet states the engineering status and is gated on it (S10-1 fixes `installation.10`). | `BRIEF` S10-1 | P0 |

### MS11.4 — The fingerprint system (what recalculates, what goes stale)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS11-18 | Five layered fingerprints over the design — site ⊂ geometry ⊂ layout ⊂ electrical ⊂ design — each answering "what must recalculate after this edit", deterministic and byte-stable (`.60–.63`). | `SRC-CODE` | P0 |
| MS11-19 | Layer membership as specified: site physics; geometry (shadow casters + mounting surfaces, with capability overrides); layout (placement, leg plans, structure-model version); electrical (components + string topology); design (everything reaching a customer output, including normalised BOM overrides and the catalog version) (`.64–.76`). | `SRC-CODE` | P0 |
| MS11-20 | The conditional-suffix law: any field added to a fingerprint must not change the string when absent, so existing designs never appear stale after an upgrade (`.77`). | `SRC-CODE` | P0 |
| MS11-21 | Shading fingerprint = geometry + panel poses + engine version; bumping the ENGINE invalidates every stored access value (`.78–.81`). | `SRC-CODE` | P0 |
| MS11-22 | Freshness predicates: shading fresh, capture fresh (per-capture), and captures-fresh INCLUDING the cover (`.82–.84`, with MS7-09's stamping law). | `SRC-CODE` | P0 |
| MS11-23 | The behavioural table is normative — pin move, weather arrival, vertex move, parapet, obstruction, panel move/disable/tilt, restring, inverter count, margin, BOM override, rename, recomputed access — each invalidating exactly its documented layers (`.85–.98`). | `SRC-CODE` | P0 |
| MS11-24 | Consumers: captures stamped by layout; access recompute keyed by shading; 3D structure keyed by layout; health, insights and comparison keyed by design; freshness surfaces reach the customer documents; migrations preserve fingerprint bytes (`.99–.105`). | `SRC-CODE` | P0 |

### MS11.5 — Duplicate & variants

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS11-25 | Duplicate produces an independent design: new identity and share id, fresh timestamps, status reset, image references dropped with the stated rule applied consistently (S10-3.3 fixes `.8`), and a unique copy name (`.106–.116`). | `SRC-CODE` + `BRIEF` S10-3.3 | P0 |
| MS11-26 | Duplication does not hijack the session: the active project switches only with the user's intent, and undo history is not silently destroyed (S10-3.2 fixes `.122`) (`.120/.121`). | `BRIEF` S10-3.2 | P0 |
| MS11-27 | Variant lineage and side-by-side comparison are the main suite's requirement (M05 baseline, D16/UXG-08) — the POC records neither (`.123/.124`); the studio must carry the lineage pointer so MS6's compare surface can group variants. | `SRC-CODE` + `BRIEF` | P1 |

### MS11.6 — The installation work order

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS11-28 | A field document derived from the design — never authored — with deterministic step ids, seven ordered trade phases, and structures walked per roof and table (`.38–.42/.58`). | `SRC-CODE` | P0 |
| MS11-29 | Steps as shipped: foundations, legs, rafters, purlins/braces, structured modules, loose modules, per-string wiring, balance-of-system — with counts from the structural model (`.43–.50/.52/.54/.57`), plural-correct titles (S10-2 fixes `.56`) and disabled panels excluded from wiring counts (S10-2 fixes `.51`). | `SRC-CODE` + `BRIEF` S10-2 | P0 |
| MS11-30 | Steps are genuinely distinct per table and roof, with phase headings that do not repeat misleadingly (S10-2 fixes `.9/.24/.60`). | `BRIEF` S10-2 | P0 |
| MS11-31 | Materials per step resolve from the BOM correctly — including lines with no source id, excluding lines not supplied, and respecting confidence markers (S10-2 fixes `.61/.62/.64`) (`.59/.63`). | `SRC-CODE` + `BRIEF` S10-2 | P0 |
| MS11-32 | No commercial figure ever reaches this surface (R16's law, `.12/.13`). | `SRC-CODE` | P0 |
| MS11-33 | Identity block: date, design version, site address, issued-by, and the engineering status per MS11-17 (S10-2 fixes `.11`). | `BRIEF` S10-2 | P0 |
| MS11-34 | Print is a designed output: page setup, printable header, and margins that survive real printing (S10-2 fixes `.35/.36/.7/.34/.37`). | `BRIEF` S10-2 | P0 |
| MS11-35 | Progress and ticking: step-count progress with its meaning stated (`.19–.22`); ticks PERSIST per project (not device-local) and carry R16 attribution — who ticked, optional "done by" (S10-2 fixes `.14/.16/.30`) (`.25–.33`). | `SRC-CODE` + `BRIEF` S10-2 | P0 |
| MS11-36 | Empty and partial states are honest: a design with modules but no strings, or with nothing derivable, says what is missing rather than showing an empty plan (S10-2 fixes `.18/.53`) (`.17`). | `SRC-CODE` + `BRIEF` S10-2 | P0 |
| MS11-37 | Dialog semantics are accessible (modal role, focus management, labelled controls) (S10-2 fixes `.4`) (`.2/.3/.5/.6`). | `SRC-CODE` + `BRIEF` S10-2 | P0 |
| MS11-38 | Crew access follows R16: the crew has no studio login; the coordinator runs the checklist and attributes work (`.15`, M08 contract). | `SRC-CODE` | P0 |

## 4. Cross-module contracts

Consumes: MS6–MS10 (design, review, gate, BOM), F2 (approval capability), F8-25 (sign-off law), M08 (installation checklist + R16 attribution), Q28. Provides: the readiness contract to MS9's issuance gate; sign-off state to the customer surfaces and the installation sheet; the fingerprint system to every staleness surface in the studio; variant lineage to MS6's compare.

## 5. Non-goals

Commercial figures on the crew document (MS11-32) · crew logins in v1 (MS11-38, R16) · advisory-only review (MS11-12) · approvals surviving duplication or material change (MS11-15/16).

## 6. Open items

None — Sitting 10 closed with zero open items (3 rulings covering all 34 defects, 2026-08-05).

## Acceptance criteria (P0 coverage)

- Given all gates pass, Then Step 10 is reachable and shows the project's identity (MS11-01); marking ready requires the readiness review to pass, from every writer (MS11-02); the review is visible on Step 10 (MS11-03); actions work and copy confirms (MS11-04); the customer-facing link is offered (MS11-05).
- Given a design, Then the review returns its four items derived from the real gates with a worst-of verdict (MS11-07); the electrical item blocks and explains, including the no-components edge (MS11-08); the design-review item counts only insights that are neither accepted nor dismissed (MS11-09); quantity confidence follows the BOM (MS11-10); imagery reports shortfall then staleness including the cover, and never blocks (MS11-11); the verdict gates issuance (MS11-12).
- Given designs awaiting approval, Then the engineer's queue lists them oldest-first with the stated columns (MS11-13); Given a review, Then approve records who/when/version, and return-with-comments pins each comment and notifies the designer (MS11-14); Given a material change after approval, Then sign-off re-opens (MS11-15); Given a duplicate, Then it carries no approval and no crew ticks (MS11-16); Given an unapproved design, Then no customer surface serves it and the installation sheet states its status (MS11-17).
- Given each fingerprint layer, Then its membership is exactly as specified — site physics, geometry with capability overrides, layout with leg plans and structure-model version, electrical topology, and design including normalised BOM overrides and catalog version (MS11-19). Given the behavioural table (pin move, weather arrival, vertex move, parapet, obstruction, panel move/disable/tilt, restring, inverter count, margin, BOM override, rename, recomputed access), Then each edit invalidates exactly its listed layers and no others (MS11-23).
- Given a design with structures and strings, Then the work order emits foundations, legs, rafters, purlins/braces, structured and loose modules, per-string wiring and balance-of-system with model-derived counts, plural-correct titles, and disabled panels excluded (MS11-29). Given a two-table roof, Then each table's steps are distinct and phase headings are not misleadingly repeated (MS11-30).
- Given any edit, Then exactly the documented fingerprint layers change (MS11-18); Given a new optional field, Then existing designs do not become stale (MS11-20); Given an engine version bump, Then stored access values invalidate (MS11-21); Given a layout change, Then captures and the cover report staleness correctly (MS11-22); Given each consumer, Then it recomputes on its own key (MS11-24).
- Given duplicate, Then the copy is independent with a unique name and the stated reset rules (MS11-25) and the session/undo history are not silently changed (MS11-26).
- Given a design, Then the work order derives distinct steps per roof and table across the seven phases with correct, plural-correct counts excluding disabled panels (MS11-28/29/30); materials resolve from the BOM with no missing or not-supplied lines (MS11-31); no price appears anywhere (MS11-32); the sheet carries date, version, site, issued-by and engineering status (MS11-33); printing produces a usable field document (MS11-34); ticks persist per project with attribution (MS11-35); missing prerequisites are stated honestly (MS11-36); the dialog is accessible (MS11-37); crew access follows R16 (MS11-38).

Localization: all copy via catalog (F3); dates/units per pack. Analytics: design_finalized, signoff_requested/approved/returned, duplicate_created, install_sheet_opened, install_step_ticked.
