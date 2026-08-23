# SCR-M06-17 · Proposal Document

The rendered commercial document (PDF and link content) with all honesty obligations.

**Module:** M06 (Proposals — owns the document lifecycle; the studio's contribution is specced in MS9; F5 owns the customer-link framework it renders inside) · **Personas:** Customer (the EPC's customer — no login, meets the proposal as a document and a no-login link; what the module owes them is honesty), Sales Executive (issuing, previewing), Design Engineer (issuing, previewing; does not send) · **Context of use:** read by the customer wherever the link or PDF lands — phone-first, often an evening single sitting; print/PDF is a first-class output, not an afterthought (MS9 §2).

## Entry & exit

Reached from: the tenant-side Preview (SCR-M06-15) which renders exactly this; the customer link (the F5 proposal page, SCR-F5-01, whose document pack this is an artifact of); Download PDF from the share sheet (`M06-53`, SCR-M06-18); print. Leads to: back navigation returns to where the reader came from, and the SLD page is offered only when a real SLD exists (`MS9-25`); the 3D moment lives inside the proposal link behind the 3D-model card with link + QR (`MS9-14`, `MS9-03`).

## Requirements (verbatim)

### From `prd/modules/M06-proposals.md`

- **M06-04** (P0) — **The honesty rule.** Every number the proposal shows carries its provenance label from the closed four-tier vocabulary (`F8-01`/`F8-02`, consumed); Path B numbers are never presented as calculations — they are *"estimates from capacity and location heuristics."* *"A proposal built without a design must say so. Not in fine print — visibly, on the document"*: every Path B document renders the fixed line, verbatim — **"Indicative proposal. Generation and savings are estimated from system size and location. A site survey and shadow analysis will confirm the final figures."** (`F8-20`, consumed — F8 owns the law; this module owns the builder and the document template that render it.) The source frames this as *"a genuine competitive advantage, not a disclaimer"* — every competitor prints estimates as though they were calculations; being the one product that distinguishes them is the "shows its working" positioning, and it protects the EPC when final numbers are compared to the promise. _(non-UI half, build-side: F8 honesty law: every figure labelled; verbatim indicative line mandatory on Path B — for awareness, not for drawing)_
- **M06-51** (P0) — **The generated document carries every honesty obligation on its face:** provenance labels per figure (`F8-01`/`F8-02`), the **indicative line verbatim on every Path B document** (`M06-04`/`F8-20`), the remote-survey basis line where the design was built on remote data (`F8-22` consumed), projection labels with assumptions on financial figures (`F8-23`), and energy source labels (`F8-08`/`F8-09`). One computed value set feeds the document, the link and every export (`F8-24`). PDF is an artifact of the version — the link renders the same content as web (`DOC07.pdf-artifact` cited — `foundations/F5`'s key); render is online-only. _(non-UI half, build-side: one computed value set feeds document, link, exports; render online-only; PDF is version artifact — for awareness, not for drawing)_
- **M06-56** (P0) — **The customer sees one recommended system by default.** Where the design has variants, exactly one is recommended (`M05-79`/`M05-80`, consumed — authored in the studio); the proposal and its customer-facing rendering present the recommended design by default, with variants shown only when the designer added them for a price-sensitive or undecided customer. The customer-side compare surface is `foundations/F5`'s. _(non-UI half, build-side: exactly one recommended variant by default; variants only when designer added them; compare surface is F5's — for awareness, not for drawing)_

### From `prd/modules/M05-studio/08-customer-surfaces.md`

- **MS9-01** (P0) — Every issued proposal carries a full identity block: proposal number, issue date, version/revision, validity period, prepared-by with company identity (M01 branding), and the CUSTOMER-facing project name — never the internal design or variant name (S8-1 fixes `.109/.92/.16`).
- **MS9-02** (P0) — Pagination is counted, not hardcoded: sequential unique page numbers, no duplicates, and no trailing blank page in the PDF (S8-1 fixes `.94/.44`).
- **MS9-03** (P0) — Document structure as shipped: headline with capacity, prepared-for line, tenant logo, cover image, 3D-model card with link + QR, narrative, shadow study, system/financial summary, BOM, drawings (`.45–.49/.52/.56/.57/.60`).
- **MS9-04** (P0) — Audience toggle (customer vs internal) changes only what it claims to change, and the internal view is never the default for a customer artefact (`.38/.39`). _(non-UI half, build-side: internal view is never the default for a customer artefact — for awareness, not for drawing)_
- **MS9-05** (P0) — Print/PDF is a designed output: page breaks, print-only and screen-only elements are deliberate, and the printed artefact is the one the customer receives (`.31/.36/.43`, with MS9-11's staleness rule).
- **MS9-06** (P0) — A proposal can only be ISSUED when the readiness review passes (electrical gate + review verdict + BOM confidence): the document surface enforces the same gate Step 7 displays (S8-2a fixes `.107/.14`). _(non-UI half, build-side: issuance blocked unless readiness review passes (electrical gate, verdict, BOM confidence) — for awareness, not for drawing)_
- **MS9-14** (P0) — The 3D moment lives INSIDE the proposal link per Q27 — one link, with the 3D model card, working copy-link feedback and a scannable QR that fails visibly rather than silently (S8-4.8/.12 fix `.41/.53`) (`.49/.51/.52/.55`).
- **MS9-16** (P0) — Staleness travels to paper: the staleness warning PRINTS (never print-suppressed), per-capture staleness badges appear on the document, and each capture's caption states the sun position it was actually taken at (S8-3a fixes `.35/.62/.63`) (`.33/.34`).
- **MS9-17** (P0) — The structure disclaimer appears wherever structure or mounting is quoted — not only when a member model happens to exist — and the share viewer carries it too (S8-3b fixes `.80/.24`, F8-25).
- **MS9-18** (P0) — "Nothing is estimated" prints only when it is true; otherwise the estimate provenance line prints in its place (S8-3c fixes `.59`, F8-09). Narrative beats carry their supporting facts (`.58`).
- **MS9-19** (P0) — Scheme/subsidy sentences print only where the design is actually eligible, with the pack's rule text (S8-3d fixes `.75`), and zero-value lines never render as a negative amount (S8-4.4 fixes `.73`).
- **MS9-20** (P0) — BOM quantities on the customer document carry their confidence/provenance marker (S8-3e fixes `.83`, F8).
- **MS9-22** (P1) — Shadow captures print in the four-preset order, not insertion order (S8-4.5 fixes `.61`).
- **MS9-23** (P0) — Image loading has THREE distinct states — loading, present, permanently missing — with a stable footprint so print pagination never shifts (S8-4.3 fixes `.27/.29`) (`.25/.26/.30`).
- **MS9-24** (P0) — Accessible names attach to elements with real roles (images, QR, status) (S8-4.7 fixes `.28/.54`).
- **MS9-25** (P1) — Back navigation returns to where the reader came from (S8-4.9 fixes `.37`); the SLD page is offered only when a real SLD exists (`.40`).
- **MS9-29** (P0) — The customer surface presents the money summary, system summary, energy story, shadow study and equipment list; the stage/progress, document pack and permanence surfaces belong to F5's framework and are consumed, not reinvented here (`.103`). _(non-UI half, build-side: stage/progress, document pack and permanence surfaces are consumed from F5's framework, not reinvented — for awareness, not for drawing)_

## States

- **loading** — the document rendering.
- **empty** — no issued document exists before the readiness gate passes and Generate succeeds; the honest empty is issuance blocked with the reason stated (`MS9-06`), never a blank document.
- **error** — a failed render stated plainly.
- **capex** — the CAPEX document rendering.
- **opex-ppa-terms** — the OPEX/PPA document rendering per-unit terms (the type branches only the rendered document and the projection honesty label, per the module).
- **indicative-disclaimer-path-b** — the verbatim indicative line on every Path B document, in the reading flow at the same visual weight as the figures it qualifies (the module's acceptance line for `M06-04`).
- **remote-survey-basis-line** — the basis line where the design was built on remote data.
- **emi-projection-labelled** — EMI arithmetic rendered as a labelled projection with its assumptions.
- **variants-shown** — variants present only when the designer added them; exactly one recommended system by default.
- **bank-details-hidden** — bank details saved but not printed when the include toggle was off (Step 11's note: "details save but will not print").
- **customer-view** — the customer audience rendering; never operator chrome.
- **internal-view** — the internal audience rendering; never the default for a customer artefact.
- **print-pdf** — the designed print output: deliberate page breaks, print-only and screen-only elements, counted sequential unique page numbers, no trailing blank page.
- **issue-gated** — issuance blocked by the readiness review (electrical gate + review verdict + BOM confidence) with the reason stated.
- **stale-design** — the staleness warning printing (never print-suppressed), per-capture staleness badges, captions stating the true sun position.
- **estimate-provenance** — the estimate provenance line printing in place of "nothing is estimated" whenever anything is estimated.
- **image-loading / image-missing** — two of the three distinct image states (loading, present, permanently missing) with a stable footprint so print pagination never shifts.
- **no-sld** — the SLD page absent because no real SLD exists.
- **qr-failed** — the scannable QR failing visibly rather than silently (`MS9-14`).
- **subsidy-ineligible / zero-value** — no scheme/subsidy sentence where ineligible; zero-value lines never rendering as a negative amount (`MS9-19`).

## Data volume

The full shipped document structure (`MS9-03`): headline with capacity, prepared-for line, tenant logo, cover image, 3D-model card with link + QR, narrative, shadow study, system/financial summary, BOM, drawings — at realistic volume: a **40-line BOM** with per-line confidence markers, shadow captures in the four-preset order, drawings pages, counted multi-page pagination. Design print pagination at the scale of a large design (the DoD's 221-panel design drives the equipment list and capture set).

## Numbers carrying provenance

Every number the proposal shows carries its provenance label from the closed four-tier vocabulary (`M06-04`); one computed value set feeds document, link and every export (`M06-51`):

- **Proposal number, issue date, version/revision, validity period** (`MS9-01`) — identity-block record facts.
- **Page numbers** (`MS9-02`) — counted, sequential, unique.
- **Capacity headline / system summary figures** (`MS9-03`, `MS9-29`) — derived on Path A; estimated/assumed on Path B.
- **Generation / energy story figures** — energy source labels ride every generation figure (`M06-51`; "Real · PVGIS ({database})" vs "Built-in estimate ±10%" per the module's step-4 row).
- **Savings, payback, lifetime and EMI figures** — projection labels with assumptions (`M06-51`, `F8-23`); EMI is a labelled projection.
- **Money summary: system cost, tax, incentive/subsidy amount, discount, payable** (`MS9-29`, `MS9-19`) — subsidy sentences only where eligible, with the pack's rule text; zero never renders negative.
- **BOM quantities** (`MS9-20`) — each carries its confidence/provenance marker on the customer document.
- **Shadow study figures and capture captions** (`MS9-16`, `MS9-22`) — captions state the sun position each capture was actually taken at; staleness badges per capture.
- **Narrative numbers** (`MS9-18`) — narrative beats carry their supporting facts; "nothing is estimated" prints only when true.
