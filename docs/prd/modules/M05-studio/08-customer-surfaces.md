# MS9 · Studio customer surfaces — the proposal document & the share link

Status: draft · Origin mix: SRC-CODE + BRIEF (Sitting 8 rulings, 2026-08-05) · Depends on: F5 (customer-link laws), Q27 (3D inside the proposal link), Q42 (OTP default off), Q34 (permanent link), F8 (provenance/staleness), M01 (branding), M06 (proposal document + pinning), MS6/MS7/MS8 (the numbers, imagery and drawings)
Sources: POC code inventory — share (**109 keys**, 35 POC-DEFECTs — the pass's largest crop; zero automated coverage found on these files) · sitting rulings (S8-1…S8-4) · census A.10-8 share rows + A.10-11 link rows. The ledger index is retired; the POC repository named in `docs/build-order.md` is the source, and the sitting rulings are carried by the rows below.
Forward: F5 (the main-suite customer-link framework this must satisfy) · M06 (the builder that issues the document) · MS11 (installation sheet).

## 1. Purpose & scope

Two surfaces reach the EPC's customer: the **proposal document** (screen + print/PDF) and the **3D share link**. Everything the studio computes lands here — which makes this the one place where an honesty gap becomes a customer-facing claim. The POC predates the F5 framework and the 2026-08-04 rulings; this document specs both surfaces to the laws the suite has since adopted.

**Boundary:** M06 owns the proposal *builder* and document lifecycle; F5 owns the customer-link framework. MS9 specs what the STUDIO contributes to those surfaces and how its numbers, imagery and drawings must behave there.

## 2. Personas & surfaces

The EPC's customer (no login — F5's law) · Sales Executive/Design Engineer (issuing, previewing). Print/PDF is a first-class output, not an afterthought (MS9-05).

## 3. Feature areas

### MS9.1 — Document identity & structure

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS9-01 | Every issued proposal carries a full identity block: proposal number, issue date, version/revision, validity period, prepared-by with company identity (M01 branding), and the CUSTOMER-facing project name — never the internal design or variant name (S8-1 fixes `.109/.92/.16`). | `BRIEF` S8-1 | P0 |
| MS9-02 | Pagination is counted, not hardcoded: sequential unique page numbers, no duplicates, and no trailing blank page in the PDF (S8-1 fixes `.94/.44`). | `BRIEF` S8-1 | P0 |
| MS9-03 | Document structure as shipped: headline with capacity, prepared-for line, tenant logo, cover image, 3D-model card with link + QR, narrative, shadow study, system/financial summary, BOM, drawings (`.45–.49/.52/.56/.57/.60`). | `SRC-CODE` | P0 |
| MS9-04 | Audience toggle (customer vs internal) changes only what it claims to change, and the internal view is never the default for a customer artefact (`.38/.39`). | `SRC-CODE` | P0 |
| MS9-05 | Print/PDF is a designed output: page breaks, print-only and screen-only elements are deliberate, and the printed artefact is the one the customer receives (`.31/.36/.43`, with MS9-11's staleness rule). | `SRC-CODE` | P0 |

### MS9.2 — Issuance gating & versioning

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS9-06 | A proposal can only be ISSUED when the readiness review passes (electrical gate + review verdict + BOM confidence): the document surface enforces the same gate Step 7 displays (S8-2a fixes `.107/.14`). | `BRIEF` S8-2a | P0 |
| MS9-07 | Every entry point that produces a customer document marks the design consistently — no route may leave status untouched (S8-2a fixes `.108`). | `BRIEF` S8-2a | P0 |
| MS9-08 | An issued proposal is PINNED: later design edits create a NEW version and never rewrite what was already sent; the version on the document identifies which one the customer holds (S8-2b fixes `.101`; M06 pinning law, F8-15 family). | `BRIEF` S8-2b | P0 |

### MS9.3 — The share link (F5 alignment)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS9-09 | Links follow F5: per-recipient NAMED links, revocable and re-mintable, with open attribution — not one permanent unnamed id per project (S8-2c fixes `.98/.99/.11`); permanence of the customer's own view follows Q34 (`.10`). | `BRIEF` S8-2c | P0 |
| MS9-10 | The customer's acceptance path exists on the link (accept / ask a question / negotiate per F5), with OTP-at-accept available per tenant and OFF by default (Q42) (S8-2c fixes `.100`). | `BRIEF` S8-2c | P0 |
| MS9-11 | The link opens the customer's own surface — not the operator's editor chrome: no operator-only alerts, tool rails, or internal instructions; branding is the tenant's (S8-4.2 fixes `.8/.18/.20/.64`). | `SRC-CODE` + `BRIEF` S8-4 | P0 |
| MS9-12 | The share page loads ONLY that design's data — never the operator's whole project store (S8-4.1 fixes `.106`, privacy). | `BRIEF` S8-4.1 | P0 |
| MS9-13 | Read-only means read-only: opening a share link never triggers background recompute or persisted writes (S8-4.11 fixes `.7`) (`.19`). | `SRC-CODE` + `BRIEF` S8-4.11 | P0 |
| MS9-14 | The 3D moment lives INSIDE the proposal link per Q27 — one link, with the 3D model card, working copy-link feedback and a scannable QR that fails visibly rather than silently (S8-4.8/.12 fix `.41/.53`) (`.49/.51/.52/.55`). | `SRC-CODE` + `BRIEF` S8-4 | P0 |
| MS9-15 | Link resolution is robust: hydration shows a loading state rather than a blank page (S8-4.10 fixes `.4`); a deep link never crashes (S8-4.6 fixes `.5`); a valid link to an incomplete design gets an honest message, not "invalid link" (S8-4.6 fixes `.13`) (`.6/.9/.12`). | `SRC-CODE` + `BRIEF` S8-4.6/.10 | P0 |

### MS9.4 — Honesty on the customer artefact

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS9-16 | Staleness travels to paper: the staleness warning PRINTS (never print-suppressed), per-capture staleness badges appear on the document, and each capture's caption states the sun position it was actually taken at (S8-3a fixes `.35/.62/.63`) (`.33/.34`). | `BRIEF` S8-3a | P0 |
| MS9-17 | The structure disclaimer appears wherever structure or mounting is quoted — not only when a member model happens to exist — and the share viewer carries it too (S8-3b fixes `.80/.24`, F8-25). | `BRIEF` S8-3b | P0 |
| MS9-18 | "Nothing is estimated" prints only when it is true; otherwise the estimate provenance line prints in its place (S8-3c fixes `.59`, F8-09). Narrative beats carry their supporting facts (`.58`). | `BRIEF` S8-3c | P0 |
| MS9-19 | Scheme/subsidy sentences print only where the design is actually eligible, with the pack's rule text (S8-3d fixes `.75`), and zero-value lines never render as a negative amount (S8-4.4 fixes `.73`). | `BRIEF` S8-3d/S8-4.4 | P0 |
| MS9-20 | BOM quantities on the customer document carry their confidence/provenance marker (S8-3e fixes `.83`, F8). | `BRIEF` S8-3e | P0 |
| MS9-21 | No placeholder text ever reaches the customer: no "undefined", no operator instructions, no internal vocabulary (S8-4.2/.4 fix `.70/.64`). | `BRIEF` S8-4 | P0 |
| MS9-22 | Shadow captures print in the four-preset order, not insertion order (S8-4.5 fixes `.61`). | `BRIEF` S8-4.5 | P1 |

### MS9.5 — Imagery & accessibility

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS9-23 | Image loading has THREE distinct states — loading, present, permanently missing — with a stable footprint so print pagination never shifts (S8-4.3 fixes `.27/.29`) (`.25/.26/.30`). | `SRC-CODE` + `BRIEF` S8-4.3 | P0 |
| MS9-24 | Accessible names attach to elements with real roles (images, QR, status) (S8-4.7 fixes `.28/.54`). | `BRIEF` S8-4.7 | P0 |
| MS9-25 | Back navigation returns to where the reader came from (S8-4.9 fixes `.37`); the SLD page is offered only when a real SLD exists (`.40`). | `SRC-CODE` + `BRIEF` S8-4.9 | P1 |
| MS9-26 | No third-party scripts, fonts or analytics load on the customer surface (`.105`, F5-29). | `SRC-CODE` | P0 |
| MS9-27 | Both customer-facing surfaces carry automated tests including an accessibility pass — today they have none (S8-4.13 fixes `.97`). | `BRIEF` S8-4.13 | P0 |

### MS9.6 — What the studio hands the customer surface

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS9-28 | Numbers, narrative, imagery and drawings all come from the single computed set (MS7-15/MS7-46) — the document never recomputes a different answer (`.32`). | `SRC-CODE` | P0 |
| MS9-29 | The customer surface presents the money summary, system summary, energy story, shadow study and equipment list; the stage/progress, document pack and permanence surfaces belong to F5's framework and are consumed, not reinvented here (`.103`). | `SRC-CODE` | P0 |

## 4. Cross-module contracts

Consumes: MS6 (3D scene, captures), MS7 (energy, finance, narrative, review verdict), MS8 (drawings, sized ratings), M01 (branding), F1 (currency/scheme rules), F8 (provenance/staleness), F5 (link framework), M06 (document lifecycle + pinning), Q27/Q34/Q42. Provides: the studio's contribution to the customer artefact and the 3D experience inside the proposal link.

**Recorded alignment note:** the POC inverts F5's model (its web page is login-gated and the customer's route to numbers is an operator-produced PDF, `.102`). V2 follows F5: the customer's link is the primary surface and the PDF is an artefact of it. Recorded, ruled by S8-2c, not silently reconciled.

## 5. Non-goals

Operator tooling on customer surfaces (MS9-11) · unbounded permanent unnamed links (MS9-09) · issuing an unreviewed design (MS9-06) · re-computing figures on the document (MS9-28) · third-party tracking on the customer surface (MS9-26).

## 6. Open items

None — Sitting 8 closed with zero open items (4 rulings covering all 35 defects and the F5/Q42 alignment gaps, 2026-08-05).

## Acceptance criteria (P0 coverage)

- Given an issued proposal, Then it shows number, issue date, version, validity, prepared-by and the customer-facing project name — and never an internal variant name (MS9-01); page numbers are sequential and unique with no blank trailing page (MS9-02); the document sections render as specified (MS9-03); the audience toggle never leaves internal content in a customer artefact (MS9-04); the printed output is the designed one (MS9-05).
- Given a design that fails the readiness review, Then no customer document can be issued and the reason is stated (MS9-06); every issuing route marks status consistently (MS9-07). Given an issued proposal and a later design edit, Then the sent version is unchanged and a new version is created (MS9-08).
- Given a recipient, Then a named revocable link can be issued and its opens are attributed (MS9-09); the customer can accept/ask/negotiate, with OTP available but off by default (MS9-10). Given a customer opening a link, Then no operator chrome, alerts or instructions appear (MS9-11), only that design's data is loaded (MS9-12), and nothing is recomputed or written (MS9-13). Given the proposal link, Then the 3D model is reachable inside it, copy-link confirms, and a failed QR is visible (MS9-14). Given a slow hydration, a deep link, or an incomplete design, Then the surface shows loading, never crashes, and explains honestly (MS9-15).
- Given a stale design, Then the printed PDF carries the staleness warning and per-capture badges, and captions state the true sun state (MS9-16). Given any quoted structure, Then the disclaimer prints (MS9-17). Given estimated figures, Then the document says so instead of claiming nothing is estimated (MS9-18). Given a commercial or ineligible project, Then no subsidy sentence prints, and zero values never render as negatives (MS9-19). Given BOM quantities, Then their confidence marker prints (MS9-20). Given any state, Then no placeholder or operator text reaches the customer (MS9-21).
- Given images, Then loading, present and missing are distinct with a stable footprint (MS9-23); accessible names attach to real roles (MS9-24); no third-party resources load (MS9-26); both surfaces have tests including an accessibility pass (MS9-27).
- Given any figure on the document, Then it equals the studio's single computed value (MS9-28); the surface presents the specified content and consumes F5's framework for the rest (MS9-29).

Localization: all customer copy via catalog (F3) in the reader's language (F3-06); money/date per pack (F1). Analytics: proposal_printed, share_link_copied, share_opened {named-link}, accept_action.
