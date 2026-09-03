# F8 · Data honesty — provenance, staleness and honest labelling

Status: draft · Origin mix: SRC only — all 36 requirements are source-derived and P0; this
document carries no `BRIEF` and no `REC` items · Depends on: `00-README.md`,
`01-product-overview.md`, `02-personas.md`, `foundations/F1-global-market-framework.md` (pack
versioning and format values), `foundations/F2-roles-and-permissions.md` (the sign-off capability
and its preset) · Forward: `foundations/F5-customer-link.md`, `modules/M04-survey.md`,
`modules/M05-design-studio.md`, `modules/M06-proposals.md`, `modules/M07-sales-execution.md`,
`modules/M11-payments-and-collections.md`, `modules/M12-platform-billing.md`,
`modules/M13-dashboards-and-reporting.md`

## 1. Purpose & scope

This document is the honesty law book. It states, once, what the product is allowed to claim
about a number: which provenance tier that number carries, where the number's data came from,
whether it is still current, and what the product must say when it does not know. Every other
document in this suite renders these laws on its own surfaces; none of them re-rules them.

The source's second conviction is the mandate: *"Honesty is a feature."* Every user-visible
number carries a provenance tier (`measured` / `derived` / `estimated` / `assumed`); money never
renders while stale; structural adequacy is never computed — an engineer signs off. The
competitive reading of the same law is recorded in `01-product-overview.md` `OV-38`: competitors
print confident numbers, this product prints defensible ones. The moat is not the labels
themselves; it is that the labels are never switched off — not by a role, not by a plan, not by
a tenant setting, not by a screen that ran out of room.

**In scope.** The provenance vocabulary and its closure rule; the energy source-label law; the
money-never-stale law and what "stale" means; the indicative/document-level disclosure laws for
proposals and remote surveys; the never-computed law for structural adequacy and its human
sign-off record; the correlation-not-attribution law for influence claims; and honest state,
usage and degradation messaging.

**Explicitly not in scope.**

- **How any number is computed.** The energy model, the shading model, the electrical ladders,
  the BOM emitters and the money path live in `modules/M05-design-studio.md`,
  `modules/M06-proposals.md` and `modules/M11-payments-and-collections.md`. F8 governs what may
  be claimed about their outputs, never how the outputs are produced.
- **How a label renders.** The visual grammar of a provenance chip, a provisional state or a
  disclaimer block is `foundations/F7-design-language.md`'s (N7 is one of its ten interaction
  laws); the number and currency formatting implementation is
  `foundations/F3-localization.md`'s, reading its values from `pack.formats` (`F1-21`).
- **Any implementation mechanism.** Fingerprints, version columns, enums and API enforcement
  points appear in the source and are deliberately absent here (design spec §14 / DD4). F8
  states the product law those mechanisms exist to satisfy.
- **Market facts.** No currency symbol, tax term or market label appears in this document.
  Where money or format matters, F8 names the pack key (`pack.formats`, `F1-21`) or the
  currency-stamp law (`F1-07`).

## 2. Personas & surfaces

F8 binds **every** persona of `02-personas.md` and the anonymous customer-link reader of
`foundations/F5-customer-link.md`, because it binds every surface rather than any one role. A
number a Sales Executive reads on a lead, a number a Design Engineer reads in the studio, a
number the EPC Owner reads on a dashboard and a number the customer reads on a tokenised link
are the same number under the same law.

**Surfaces the laws apply to, without exception** — web, mobile (both platforms from launch),
generated PDFs and drawing sheets, the no-login customer link, exports and downloads, and the
voice agent's spoken text. A rendering surface that cannot carry a label does not thereby
acquire permission to omit it: it either carries the label or it does not carry the number.
This is the source's own reasoning about voice — money strings obey provenance and never-stale
rendering "on web, mobile, PDFs and voice-agent text alike".

**Mobile/web emphasis.** No emphasis split exists here. Full parity at 375 px is the product's
hardest commitment (D2), and the per-screen Definition of Done already lists "every user-visible
number carries its provenance tier" as a completion condition — a screen that drops the label at
a narrow breakpoint is not done.

## 3. Feature areas

### F8.1 — The provenance vocabulary

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F8-01 | **Every user-visible number carries exactly one provenance tier.** Not most numbers, not the headline numbers — every number a user can read, on every surface named in §2, including numbers inside generated documents and numbers spoken aloud. A number whose tier cannot be established is not rendered as a number; the surface shows what is missing instead. **What counts as a number here is a quantity — something a reader could add up, compare or act on. An identifier is not one, and carries no tier (owner ruling 2026-08-28, `Q76`):** a tax registration, a bank account number, an invoice number, a phone number, a one-time code. Applying the four tiers to one produces nonsense — `estimated` on a GSTIN claims a guess nobody made, `measured` claims a verification nobody performed — and this row's own remedy proves the scope, because refusing to render a correct registration number and showing *what is missing* instead would be false. **Where an identifier has been checked, the surface states what was checked and what was not**, in prose beside the value, which is the mechanism `F8-03` already requires — never as a fifth tier and never as a parallel standing. `M01-25`'s live tax-registration check is the worked case: the format was checked, the issuing authority was not, and the screen says so. | `SRC` — `R18` consequence (*retired: rulings ledger*; docs/15 §1): "every user-visible number's type includes a provenance tier"; `DOC00.honesty-conviction` (docs/00 conviction 2 — dispositioned by Task 3 at `OV-22`/`OV-38`); N7 of `DOC10.n-rules` (docs/10 §11 — cited, F7 owns the N-set) | P0 |
| F8-02 | **The four tiers, verbatim and canonical:** `measured` (on site) · `derived` (computed from model/imagery/BOM geometry) · `estimated` (heuristic from capacity+location, incl. Path B AI fill) · `assumed` (catalog defaults without design). These definitions are the product's, not a screen's: the BOM's per-line confidence, the proposal's honesty labels and the customer link's disclaimers all read the same four values with the same meanings. | `SRC` — `R18` (*retired: rulings ledger*; docs/15 §1 R18, the phase-10 definition adopted as canonical), quoted verbatim | P0 |
| F8-03 | **The set is closed: "No screen invents a fifth tier."** No surface, module, market pack, tenant configuration or future release adds a tier, renames one, or introduces a parallel vocabulary (a "provisional" or "unverified" tier alongside these four). Where a surface needs to say more than the tier says, it says it as prose beside the tier — never as a new tier value. A genuine need for a fifth tier is an owner ruling recorded in `registers/open-questions.md`, not a local decision. | `SRC` — `R18` consequence, verbatim: "No screen invents a fifth tier"; restated at `SC.10-10.23` (*retired: studio-census checklist*) | P0 |
| F8-04 | **An aggregate inherits the weakest tier of its members.** Any number computed from other numbers — a block total, a system total, a project roll-up, a comparison row, a dashboard tile — carries the weakest tier present in its inputs, in the order `measured` → `derived` → `estimated` → `assumed` (weakest last). Aggregation never launders a weak input into a stronger claim, and resolution changes never change the honesty: at any scale, tiers go block-level, not away. | `SRC` — `DOC11.provenance-at-scale` (docs/11): "a block aggregate inherits the WEAKEST tier of its members"; "Scale changes resolution, never honesty" (shared — M05 owns the scale surfaces) | P0 |
| F8-05 | **A tier change is shown, never silent.** When a number's provenance improves or degrades — a proposal built without a design later gets one, a source of record becomes unavailable and a fallback takes over, a survey moves from remote to on-site — the product states what changed before committing it, and the new tier is visible where the number is read. Energy figures in particular "never silently switch source". | `SRC` — `S6B.wrong.9` (*retired: journey-stages ledger*): "offer to upgrade the numbers from estimated to derived, showing what changed before committing" (cited — M06 owns the upgrade flow); `R5` consequence: "energy figures never silently switch source" | P0 |
| F8-06 | **Number-honesty is platform behaviour and is never a tenant configuration surface.** The source draws the line explicitly against the fully tenant-configurable voice agent: the product's own number-honesty — provenance labels, and estimates never printed as calculations — governs the proposal and design *output*, not anyone's speech, and is therefore not the tenant's to shape. No preset role, no permission, no plan entitlement, no white-label setting and no template edit can remove, weaken, rename or hide a provenance tier, a source label, a staleness state or a disclosure required by this document. | `SRC` — `TC.principle.4` (*retired: tenant-config ledger*; journey L1188–1190), quoted in the behavior detail (shared — M01 owns the configuration surfaces that must *not* offer these switches); reinforced by `DOC08.no-per-user-exceptions` via `F2-15` | P0 |
| F8-07 | **Labels are readable, not decorative, and never hover-only.** A tier, a source label, a staleness state or an honesty caveat renders as persistent, legible content beside the number it qualifies — not as a tooltip, not as a hover state, not as a colour difference alone, not as a footnote the reader must seek out. The source states the failure mode it is guarding against directly: the caveat is on the screen, not in a tooltip. | `SRC` — `SC.10-10.23` ("readable, not decorative"); `AP.wrong.3` (journey L1348–1349): "the caveat is on the screen, not in a tooltip"; N1/N6 of `DOC10.n-rules` (no hover-only meaning; UI vs data colour — cited, F7 owns) | P0 |

**Behavior detail.** The vocabulary is deliberately small and deliberately closed, and the two
properties are load-bearing together. Small, because a reader learns four words once and then
reads every screen in the product; closed, because the moment one screen adds a fifth word, the
other four stop meaning anything precise and the system degrades into decoration. The four
definitions in `F8-02` are quoted from the ruling that made them canonical rather than
paraphrased, so that a reader comparing this document to the source finds the same sentence.

Assigning a tier is a mechanical question about where a value came from, answered at its origin
and carried with it, never re-derived by the screen that displays it:

- Someone stood on the site and recorded it → `measured`.
- The product computed it from a model, from imagery, or from BOM geometry → `derived`.
- The product produced it from a heuristic over capacity and location, including Path B AI
  auto-fill → `estimated`.
- It came from a catalog default with no design behind it → `assumed`.

Two consequences follow that surfaces frequently get wrong. First, a number is not promoted by
being displayed next to stronger numbers — `F8-04` forces the aggregate down to its weakest
input, not the reverse. Second, precision is not provenance: a value rendered to two decimals is
no more `measured` than the same value rounded, and a heuristic that returns a confident-looking
figure is still `estimated`. Where a surface additionally carries a numeric confidence — AI roof
detection records per-shape confidence, and manual-vs-AI roof provenance rides the geometry —
that confidence sits *beside* the tier and never replaces it.

**Permissions** (`foundations/F2-roles-and-permissions.md`). F8 grants nothing and gates nothing.
No matrix row exists, or may be added, for editing, suppressing or overriding a provenance tier,
a source label or a staleness state — `F8-06` is the standing instruction to every module author
filling their F2 table. Two existing rows are consumed rather than defined here:
`F2.M05.approve-designs` (EPC Owner + Design Engineer) is the sign-off capability §F8.5 depends
on, and `F2.M07.agent-performance` / `F2.M13.company-reports` reach the screens §F8.6 binds.
Visibility scoping (`F2-12`) changes *which* numbers a person sees; it never changes what those
numbers may claim.

**Edge cases & what-goes-wrong.**

- *A number is typed by a user rather than measured, computed or defaulted.* Ruled by flow
  (owner ruling 2026-08-04, Q8): a value typed **inside physical survey capture on site** —
  a surveyor keying an instrument reading — is `measured`; a typed value anywhere else carries
  the weakest applicable tier, `assumed`, consistent with `F8-04`. Two flows, four tiers, no
  context machinery.
- *A screen runs out of room at 375 px.* The label stays and the layout changes. Dropping the
  label is a Definition-of-Done failure, not a responsive trade-off.
- *A tier is unknown at render time.* The number is not shown as a number; the surface shows the
  gap and who can close it. Silence is preferable to an unqualified figure.
- *A tenant asks for the labels to be removed from customer-facing documents* (they look
  uncertain next to a competitor's confident PDF). Refused by `F8-06`; the labels are the
  product's positioning, and the source calls this "a genuine competitive advantage, not a
  disclaimer".

**Acceptance criteria.**

- Given any surface in the product, when it renders a number, then exactly one of the four tiers
  of `F8-02` accompanies that number, in persistent visible content (`F8-01`, `F8-07`).
- Given any screen, document, export or spoken output in the product, when its provenance values
  are enumerated, then the set is a subset of `{measured, derived, estimated, assumed}` and no
  other tier value exists anywhere (`F8-02`, `F8-03`).
- Given a total computed from members of mixed provenance, when the total renders, then its tier
  equals the weakest tier among its members (`F8-04`).
- Given a number whose provenance changes, when the change is applied, then the user is shown
  what changed before it commits and the new tier renders with the number afterwards (`F8-05`).
- Given any role, plan, tenant setting or template in the product, when it is exercised, then no
  provenance tier, source label, staleness state or required disclosure is removed, renamed or
  hidden (`F8-06`).

**Localization notes.** The four tier values are canonical product vocabulary: their identities
are the fixed English tokens in `F8-02`, and their *display* is translated EN/HI/MR per
`foundations/F3-localization.md`. Translation may not merge two tiers into one word in any
language — if a target language lacks a distinct everyday term, the translation uses a
distinguishing phrase rather than collapsing the distinction. Layouts carry Devanagari expansion
of roughly 20–30% without truncating the label (a truncated honesty label is a missing one).
**Analytics events:** number rendered with tier (surface, tier) for coverage auditing;
provenance upgrade offered / accepted / declined; fifth-tier violation detected (a defect
signal that should never fire).

### F8.2 — Energy source labelling

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F8-08 | **Energy figures carry a source label in addition to their provenance tier, and the label names the database.** The two labels are fixed copy, verbatim: **"Real · PVGIS ({database})"** where the energy source of record supplied the figure, and **"Built-in estimate ±10%"** where the built-in latitude-fit fallback did. The `{database}` slot is filled with the specific database the figure came from, so a reader can tell two source-of-record figures apart. Per the suite's vendor rule, the capability is "the market's energy source of record"; the v1 reference implementation is PVGIS with its documented database ladder, and the label copy above is the required v1 rendering. | `SRC` — `R18` (energy source labelling clause, verbatim) + `R5` (*retired: rulings ledger*; docs/15 §1): source of record "labelled 'Real · PVGIS'", fallback "always labelled '±10%'" (shared — the source-of-record ruling and the ladder itself are M05's; per-tenant metering is M12's) | P0 |
| F8-09 | **The source is never switched silently, and the label is per figure.** A figure produced from the fallback is labelled as such wherever it appears, including inside documents already generated; a screen may not label itself once and let mixed-source figures share the header. The provenance line naming the database travels with the figure into the proposal, the customer link and every export. | `SRC` — `R5` consequence: "energy figures never silently switch source; the provenance line names the database"; `DOC04.design-freshness-pins` (docs/04): "energy figures surface their irradiance source" | P0 |
| F8-10 | **A source fallback never blocks work, and it never stops at the energy figure.** When the source of record is unavailable, the product falls back to the built-in estimate, labels it, and continues — "design is never blocked". The estimate badge rides on the energy output *and* on every financial output computed from it, and money produced from an estimate carries the provisional provenance chain of §F8.3 rather than rendering as final. | `SRC` — `DOC07.pvgis-energy-of-record` (docs/engineering/07): "upstream unavailable → built-in latitude estimate with provenance 'estimate' and the estimate badge on energy and finance outputs … design is never blocked. Money produced from an estimate carries the provisional provenance chain" | P0 |
| F8-11 | **A model's documented limits travel with the model's outputs.** Where a computed output is produced by a model with known, documented limitations, those limitations are stated where the output is read — at every scale and on every surface, not only in a specification. Decorative scene elements that do not participate in a computation say so plainly rather than implying they were considered. Faster computation never changes what the physics claims. | `SRC` — `DOC11.shading-limits-printed` (docs/11): the shading model's documented limits "stay printed at every scale … GPU acceleration changes speed, not the physics claims" (shared — M05 owns the model and its limit text); `SC.10-7.17` (neighbour buildings decorative, "state plainly they do NOT cast shadows" — cited, M05) | P0 |

**Behavior detail.** Energy is the one quantity in the product that carries two labels, and the
reason is structural: its provenance tier answers *how* the figure was produced (a simulated
figure is `derived` whichever database fed it), while the source label answers *what data* it
was produced from. Losing either one loses information the reader needs — "derived" alone hides
that the irradiance came from a ±10% fallback, and "Real · PVGIS" alone hides that the yield was
modelled rather than metered.

The labels are the customer-facing edge of a ruling that exists for a market reason: coverage
gaps make a dependency on any single imagery provider "a product-breaking bet", so the energy
source of record is fixed, the fallback is always available, and the product tells the reader
which one it used. `F8-10` is the clause that keeps the fallback honest in both directions — it
must not block the work, and it must not be forgotten by the time the number becomes money.

**Permissions.** None. Source availability is a platform condition, not a grant; no role can
select which source labels a figure, and no plan entitlement changes the label.

**Edge cases & what-goes-wrong.**

- *A figure is geometric rather than energetic* — an access percentage or a shading fraction
  computed from geometry alone. It carries its provenance tier under `F8-01` and deliberately
  carries **no** energy source marker, because no irradiance database contributed to it. The
  studio census fixes this asymmetry deliberately; M05 carries the per-layer detail.
- *A design is built with the source of record and re-opened after a fallback period begins.*
  The figures keep the label they were computed with until they are recomputed; recomputation
  re-labels them and `F8-05` shows the change.
- *A document was generated during a fallback window.* It keeps its "Built-in estimate ±10%"
  labelling forever — a sent document never silently re-labels itself upward (`F8-15`).
- *A market has no configured source of record.* Then every energy figure in that market is
  fallback-labelled; the pack gate of `F1-05` governs whether that market may launch at all.

**Acceptance criteria.**

- Given an energy figure produced by the source of record, when it renders on any surface, then
  it carries "Real · PVGIS ({database})" with the database named (`F8-08`).
- Given an energy figure produced by the built-in fallback, when it renders on any surface, then
  it carries "Built-in estimate ±10%" (`F8-08`).
- Given the source of record is unavailable, when a user creates or opens a design, then the work
  proceeds, the fallback label appears on the energy figure, and every financial figure computed
  from it carries the fallback badge and the provisional chain (`F8-10`).
- Given a document containing energy figures, when it is exported or opened through the customer
  link, then each figure's source label travels with it unchanged (`F8-09`).
- Given an output produced by a model with documented limitations, when it is read on any surface
  or in any export, at any scale, then those limitations are stated where the output is read, and
  a scene element that does not participate in the computation states plainly that it does not
  (`F8-11`).

**Localization notes.** "Real · PVGIS ({database})" and "Built-in estimate ±10%" are translated
EN/HI/MR; the database name inside the slot is a proper name and is never translated, exactly as
brand and model names are never translated. The "±10%" numeral and sign follow `pack.formats`
digit rules (`F1-21`) without changing the tolerance itself. **Analytics events:** energy figure
rendered by source (source-of-record vs fallback); fallback window entered / exited; document
generated during a fallback window.

### F8.3 — Money never renders stale

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F8-12 | **The law, verbatim: "money must never render as final while stale — this is a hard product rule."** Before a money figure is displayed it is reconciled against its inputs; if it is current, it renders as final; if it is not — or if it cannot be reconciled at that moment — it renders as provisional, visibly labelled, and it is never presented as a final price. There is no surface, no export and no speed optimisation exempt from this. | `SRC` — `S6.wrong.1` (*retired: journey-stages ledger*; journey Stage 6), quoted verbatim; `DOC00.honesty-conviction` (docs/00 conviction 2 — "money never renders while stale"; dispositioned at `OV-22`); `DOC02.money-never-stale-api` (docs/engineering/02) | P0 |
| F8-13 | **Staleness is derived by comparison, never stored as a flag.** The product decides whether an output is current by comparing what it was computed from against what is current now — "staleness = compare, not flag-flipping". Nothing marks an output stale as a state change, and nothing can mark a stale output fresh; a surface that has not performed the comparison has not established freshness and must render provisional under `F8-12`. | `SRC` — `DOC04.design-freshness-pins` (docs/04), quoted; `DOC04.proposal-versions-immutable` ("Staleness is derived, never stored" — cited, M06 owns proposal versioning) | P0 |
| F8-14 | **Every computed money-bearing or engineering-bearing output pins the versions of every input it used.** Catalog release label, price-book version, market-pack/rules version (`F1-11`), and the versions of the engines that computed it are pinned into the output at the moment of computation, so that any later change to any of them self-stales the output rather than silently rewriting it. Pinning is what makes the comparison in `F8-13` possible; an output that pinned nothing cannot be shown as final. | `SRC` — `DOC04.design-freshness-pins` (docs/04): "Every design pins its inputs (catalog version, price-book version, rules-pack version) … so an external change self-stales it"; `DOC05.fingerprint-self-stale` (docs/05): "so a price-book or engine change self-stales older outputs"; `DOC04.catalog-release-stale` (cited — M01 owns catalog releases); pack-version half at `F1-11` | P0 |
| F8-15 | **A sent document keeps the versions it was built with, forever.** Once a priced document has been shared with a customer, its figures never move: it keeps the rate versions, catalog release and pack version pinned at generation, and a later price change produces a *new* version of the document rather than editing the sent one. The customer's copy and the tenant's copy of the same sent document always agree. | `SRC` — `R13` ("sent proposals keep the rate version they were built with"); `S6.wrong.7` ("the sent proposal keeps its original prices"); `S5.wrong.4` ("existing quotes keep their original pricing" — cited, M05/M06 own the surfaces) | P0 |
| F8-17 | **While a recompute is in flight, the affected outputs are provisional for the whole window, and issue is blocked until they reconcile.** A long recomputation does not license an optimistic display: for the entire duration the priced outputs render provisional, and sending, sharing or issuing the document is blocked until the computation and the money path agree. Duration changes nothing about the rule — there is no express lane for large jobs. | `SRC` — `DOC11.money-stale-at-scale` (docs/11): "for that entire window the quote and BOM render as provisional, and proposal issue is blocked until shading and the money path reconcile. No express lane at scale" (shared — M05 owns the recompute surfaces; M11 owns the money path) | P0 |
| F8-18 | **A stale output says so where it is read, and offers the corrective action.** The staleness state is visible on the object itself — in the list, on the detail screen, in the customer-facing rendering — and is accompanied by the action that resolves it (recompute, regenerate, or open the newer version). "Stale" is never communicated only by absence, only by a colour, or only after the user tries to send. | `SRC` — `S6B.wrong.7` ("the proposal is stale and must say so; regenerate offered"); `S5.wrong.7` ("its pricing goes stale and must visibly say so") (cited — M05/M06 own the surfaces) | P0 |
| F8-19 | **Staleness is not only a money rule: any artifact produced before a change is stale and must say so.** Captured views, rendered sheets, generated drawings and exported files carry what they were produced from; when their inputs have moved on, they are labelled stale rather than presented as a current picture, and the reader is told what changed since. | `SRC` — `SC.10-8.20` (*retired: studio-census checklist*): "a capture taken before a design change is stale and must say so, not silently show an out-of-date picture" (cited — M05 owns capture behaviour) | P0 |

**Behavior detail.** "Recompute before display" and "compare, not flag" are one mechanism seen
from two sides. Every priced output records what it was made from (`F8-14`); every display of
that output compares those pins against what is current (`F8-13`); the comparison's result
chooses between two renderings — final, or provisional-and-labelled (`F8-12`). Nothing is ever
"marked stale" by an event, which is what makes the rule survive changes nobody thought to
notify: a catalog release published by the platform, a tenant price-book revision, a pack
revision (`F1-11`), an engine change. Each of them self-stales older outputs by making the
comparison fail, with no notification path required and no possibility of a missed hook.

Provisional is a display state, not a document state. The same output can render final today,
provisional after a price-book revision, and final again after recomputation, without any of
those transitions being written into it. The one thing that is written, permanently, is the pin
set at generation — which is why `F8-15` holds: a sent document's pins are fixed, so its figures
are fixed, so the customer's copy can never drift from the tenant's.

Currency and format are not F8's: money renders through the single formatting implementation of
`foundations/F3-localization.md` with values from `pack.formats` (`F1-21`), against the tenant's
one stamped currency (`F1-07`). F8 governs only *whether* the figure may be presented as
final and *what* qualifies it.

**Permissions.** No role may mark an output current, dismiss a provisional state, or send a
document blocked by `F8-17`. The capability to create and send priced documents
(`F2.M06.create-edit-proposals`, `F2.M06.send-proposals`) carries no authority over freshness —
freshness is a computed fact, not a decision.

**Edge cases & what-goes-wrong.**

- *A design changes after its proposal was built.* The proposal's pricing is stale; it says so on
  the lead, on the proposal and in any customer-facing rendering, and regeneration is offered
  (`F8-18`). The already-sent version keeps its own figures (`F8-15`).
- *A catalog item is discontinued or re-priced after a proposal was sent.* The sent proposal is
  unaffected; new work uses the new release; the difference is visible as a version comparison,
  never as a silent edit.
- *A very large recompute takes minutes.* Everything downstream of it is provisional for the
  whole window and issue is blocked; the surface shows progress rather than a stale-but-final
  number (`F8-17`).
- *An exported sheet is shared after the design moved on.* The sheet is stale and labelled;
  the reader is told what changed (`F8-19`).
- *A surface cannot reach the server to reconcile.* It renders provisional. Inability to check
  is never treated as evidence of freshness.

**Acceptance criteria.**

- Given a money figure whose pinned inputs no longer match current inputs, when any surface
  renders it, then it renders as provisional with a visible label and never as a final price
  (`F8-12`, `F8-13`).
- Given any computed money-bearing output, when it is created, then it pins the catalog release,
  price-book version, pack/rules version and engine versions it used (`F8-14`).
- Given a document already sent to a customer, when any pinned input changes afterwards, then the
  sent document's figures are unchanged and a new version is required to reflect the change
  (`F8-15`).
- Given a recompute in progress, when a user attempts to issue or share the affected document,
  then the action is blocked and the outputs render provisional until reconciliation completes
  (`F8-17`).
- Given a stale priced object, when it is listed or opened, then the stale state and its
  corrective action are both visible without the user attempting to send (`F8-18`).
- Given a capture, rendered sheet, drawing or export produced before a change to its inputs, when
  it is shown, opened or shared, then it says it is stale rather than silently showing an
  out-of-date picture, and the reader is told what changed since (`F8-19`).

**Localization notes.** "Provisional" and "stale" are product vocabulary translated EN/HI/MR;
neither is ever rendered as a bare icon. The corrective action's verb ("Regenerate",
"Recompute") is translated with the same verb used by the module surfaces that offer it.
**Analytics events:** provisional render (surface, reason); staleness comparison failed (input
class that moved); issue blocked by unreconciled recompute; regenerate offered / taken.

### F8.4 — Indicative labelling and document-level disclosure

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F8-20 | **A priced document built without a design must say so visibly, on the document — not in fine print.** The required line is fixed copy, verbatim: *"Indicative proposal. Generation and savings are estimated from system size and location. A site survey and shadow analysis will confirm the final figures."* It renders on the document itself and on the customer-facing rendering of that document, in the reading flow, at the same visual weight as the figures it qualifies. | `SRC` — `S6B.rule.honesty` (*retired: journey-stages ledger*; journey Stage 6B, the honesty rule), quoted verbatim (shared — M06 owns the builder and the document template) | P0 |
| F8-21 | **Numbers in a document built without a design are `estimated` or `assumed` — never `derived`.** Path B figures are heuristics from capacity and location (AI auto-fill included) or catalog defaults; they never borrow the tier of a modelled design. Where a design exists, its figures are `derived` from the model and the BOM. The distinction is the point of the label, and it is not softened for presentation. | `SRC` — `S6B.rule.two-paths` / `S6B.rule.prefill` (journey Stage 6B, the provenance table: capacity/type "derived (without design: typed)", performance and financials "derived (without: AI auto-fill, estimated)", components "derived (without: picked from catalog, assumed)") — cited, M06 owns the eleven-step builder; tiers per `R18`. **Reading FINAL (owner ruling 2026-08-04, Q8 — the two-flow simplicity rule):** a typed Path B figure is `assumed`, never `derived`. Roof geometry enters by exactly two flows — studio/remote drawing (existing `derived`/`estimated` tags) and physical survey capture, which is `measured` **including surveyor-typed instrument readings entered on site**; no phone-typed roof flow exists, no fifth tier, no context machinery beyond the two flows | P0 |
| F8-22 | **A document built on a remote survey states its basis.** Remote data is derived from imagery; on-site data is measured on site; the document carries the fixed line, verbatim: *"Roof measured from satellite imagery. A site visit will confirm dimensions, shading and electrical access."* A proposal built on remote data is legitimate and sellable — "it just must not claim to be a site survey." | `SRC` — `S4.rule.honesty` (journey Stage 4), quoted verbatim (shared — M04 owns survey modes and the gaps list); tiers per `R18`/`D30` (remote = `derived`, physical = `measured`) | P0 |
| F8-23 | **A financial projection is labelled as a projection and travels with its assumptions.** Multi-year savings, payback, lifetime value, per-unit tariff projections and pipeline forecasts render as projections, never as amounts owed, earned or promised; the fixed assumptions they rest on (escalation rate, horizon, margin, incentive assumptions supplied by the market pack) are disclosed alongside the projection rather than held in a specification. This is the honesty label that rides on alternative commercial document types, whose per-unit terms are projections by construction. | `SRC` — `R17` (docs/15 §1: "nothing downstream branches on it except the rendered document and the honesty label on financial projections") — shared, M06 owns the document type and M08 the post-close behaviour; `SC.10-5.38` (fixed-assumptions footnote — cited, M05); `D37` ("forecast is a projection, never revenue" — cited, M13 owns dashboards) | P0 |
| F8-24 | **One figure, one source: every rendering of the same figure shows the same value, tier and disclosure.** The screen, the generated document, the customer link, the export and the voice agent's spoken version of a figure are renderings of one computed value — they do not recompute independently, round differently, or drop a qualifier that the other renderings carry. A disagreement between two renderings of the same number is a defect, not a display difference. | `SRC` — `C5.wrong.3` (*retired: customer-journey ledger*; journey L1042–1043): "the numbers on the PDF and the link disagree" — one source of truth for the figures in both renderings (cited — F5/M06 own the renderings); `DOC10.money-format` ("ONE formatting function everywhere … web, mobile, PDFs and voice-agent text alike" — cited, F3 owns) | P0 |

**Behavior detail.** The indicative law exists because of an asymmetry the source names directly:
every competitor prints estimates as though they were calculations, so the product that
distinguishes them is doing something visible and defensible rather than apologising. The line in
`F8-20` is therefore positioned as a document feature, not a legal footer — same reading flow,
same weight, on the first surface the customer actually reads. The protection runs in the
tenant's favour too: when the final numbers are compared to the promise, the EPC has a document
that said what it was.

`F8-22` applies the same rule one layer earlier, at the survey. A remote survey is a competitive
weapon precisely because it is fast; it stays honest by naming its basis rather than by being
slowed down. `F8-21` keeps the two paths from blurring in the middle: a document whose numbers
came from a heuristic does not acquire a modelled document's tier because it looks the same.

`F8-24` is what makes the other three enforceable. A disclosure that appears on the screen but
not in the PDF, or a figure that renders one way in the app and another way through the customer
link, defeats every law above it — so the figure, its tier and its disclosure are one payload
rendered many times, never several independent computations that happen to usually agree.

**Permissions.** No capability removes a required document line. Template editing (tenant
branding, terms and conditions, cover copy) may not delete, relocate below the fold, or restyle
into invisibility the lines required by `F8-20`, `F8-22` and `F8-23` — the standing consequence
of `F8-06` for M01's template surfaces and M06's document templates.

**Edge cases & what-goes-wrong.**

- *A document built without a design later gets one.* The figures are upgraded from `estimated`
  to `derived` with the change shown before it commits (`F8-05`), and the indicative line is
  removed only from versions generated after the design exists — already-sent versions keep
  their line and their figures (`F8-15`).
- *A remote survey is later confirmed by a site visit.* The document generated afterwards states
  the measured basis; the earlier document keeps its imagery line.
- *A tenant's template has no room for the line.* The line stays and the template changes.
- *The voice agent is asked for a price on a Path B deal.* The spoken figure carries the same
  qualification as the written one — the agent's speech is tenant-configurable, but the numbers
  it reads are not (`F8-06`, `F8-24`).
- *Two renderings of one figure disagree.* Treated as a defect against `F8-24`, not reconciled by
  choosing the friendlier number.

**Acceptance criteria.**

- Given a priced document generated without a design, when it renders on any surface, then the
  verbatim indicative line of `F8-20` appears in the reading flow of the document, and every
  figure it carries is tiered `estimated` or `assumed` (`F8-20`, `F8-21`).
- Given a document built on remote-survey data, when it renders, then the verbatim imagery line
  of `F8-22` appears and the roof figures are tiered `derived` (`F8-22`).
- Given a multi-year financial projection, when it renders on any surface or in any document,
  then it is labelled a projection, its fixed assumptions are disclosed with it, and it is never
  presented as an amount owed, earned or promised (`F8-23`).
- Given one computed figure, when it is read on the screen, in the generated document, through
  the customer link and in an export, then all renderings show the same value, the same tier and
  the same disclosure (`F8-24`).

**Localization notes.** Both fixed lines (`F8-20`, `F8-22`) are translated EN/HI/MR and render in
the reader's language on every surface, including the customer link, whose language follows the
customer's rendering rather than the rep's. The English text in this document is the canonical
identity of each line; translations are meaning-complete — a translation may not shorten the line
by dropping the confirming-step clause. Devanagari expansion must not push either line off the
first reading screen of the customer-facing rendering. **Analytics events:** indicative document
generated; imagery-basis document generated; projection rendered with assumption block;
cross-rendering figure mismatch detected (defect signal).

### F8.5 — Structural adequacy is never computed

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F8-25 | **The product never computes structural adequacy — at any scale, on any surface, for any segment.** No output states, implies or scores whether a structure, foundation, roof or mounting system is safe or sufficient. Structure-related outputs are material estimates and visual models: a bill of material quantities and a geometric representation, never a wind, uplift, load-path or roof-capacity verdict. The largest and the smallest job are treated identically. | `SRC` — `DOC11.structural-never-computed` (docs/11): "Structural adequacy is NEVER computed — at any scale" (shared — M05 owns the structure tooling); `DOC00.honesty-conviction` (docs/00 conviction 2, dispositioned at `OV-22`); `CG-reslink.7` (docs/12): "never a computed safety verdict" (shared — M05 owns the feature) | P0 |
| F8-26 | **Structural verification is a recorded human decision, and the human is named.** Adequacy is established by a sign-off recorded with who signed and when, held by the **Design Engineer** preset (and the EPC Owner) through the capability row `F2.M05.approve-designs`. The product's role is to record the decision faithfully, never to substitute for it, and never to imply a decision that no one made. | `SRC` — `SC.10-11.18`: "the app NEVER computes structural adequacy — it is a human decision, recorded with who + when"; `DOC04.signoff-append` (docs/04): "this table records who signed and when" (shared — M05 owns the review surfaces); preset and capability per `F2-03`, `F2-04`, `F2.M05.approve-designs` | P0 |
| F8-27 | **A sign-off pins exactly what was reviewed, and a change after approval un-approves it.** The recorded decision names the version of the design it applies to; an edit after approval means the approval no longer describes what exists, so the design returns to unapproved and requires a fresh decision. Decisions are append-only — an approval or a return is added, never edited or erased — and a return carries comments pinned to the specific fault. | `SRC` — `DOC04.signoff-append` (docs/04): "append-only decisions pinning exactly what was reviewed … A design edit after approval (fingerprint mismatch) drops signoff_status back to draft"; `S5.wrong.6` (return with comments pinned to what is wrong — cited, M05) | P0 |
| F8-28 | **The structure disclaimer travels with every structure-bearing output.** Every surface, document, drawing, sheet and export that carries structural quantities or a structural model also carries the statement of what it is and is not — a material estimate and a visual model, not a structural check, requiring engineer verification. The disclaimer is not confined to the screen where the structure was authored. | `SRC` — `DOC11.structural-never-computed` ("the disclaimer travels with every structure-bearing output, including block-level DXF sheets"); `SC.10-6.50` (structure disclaimer always) and `SC.10-9.12` (drawing-sheet structural note) — cited, M05 owns the outputs | P0 |
| F8-29 | **An unapproved design is never shown to the customer.** No customer-facing surface — the tokenised link, a generated document, a shared file — renders a design that has not been signed off. The gate belongs to `foundations/F5-customer-link.md`; the law that there is a gate belongs here. | `SRC` — `SC.10-11.18`: "an unapproved design is never shown to the customer"; `S5.wrong.6`: "the customer never sees an unapproved design" (cited — F5/M05 own the gate) | P0 |

**Behavior detail.** This is the sharpest of the honesty laws because it is the one with physical
consequences, and the source states it as a rule that does not bend. The product knows a great
deal about geometry and quantities and nothing whatsoever about whether a roof will hold — so it
prints the quantities, draws the model, and leaves the verdict to a named human whose decision it
records. `F8-25` and `F8-26` are two halves of one sentence: never computed, therefore always
signed.

`F8-27` is what stops a sign-off from decaying into a rubber stamp. Because the decision names
the version it reviewed, an edit afterwards does not inherit the approval — the same
comparison-not-flag discipline as §F8.3, applied to a safety record instead of a price. Because
decisions are append-only, the history of who approved what, and what was returned with which
comment, survives every subsequent edit.

The competitive framing is worth carrying explicitly, since it is what keeps the rule from being
read as a missing feature: rivals sell "detailed structure analysis"; this product sells a
parametric member model plus a material estimate plus an engineer's sign-off, and says so. The
honest version is the differentiator, not the gap.

**Permissions.** `F2.M05.approve-designs` (EPC Owner + Design Engineer) is the only capability
that records a structural sign-off, and `F2-04`'s reviewer-not-author guard applies with the
one-person-tenant edge already recorded there. No capability anywhere grants "confirm structural
adequacy" as a computation, and no role may remove the `F8-28` disclaimer from an output.

**Edge cases & what-goes-wrong.**

- *An engineer returns the design.* It goes back to its author with comments pinned to the
  specific fault; the customer sees nothing in the meantime (`F8-27`, `F8-29`).
- *A design is edited after approval.* The approval no longer applies; the design is unapproved
  until a fresh decision is recorded, and anything customer-facing built from it is withdrawn from
  view by `F8-29`.
- *A structural element is geometrically possible but flagged for confirmation* (a spanning or
  bridging arrangement, a nominal foundation size). It is offered with its confirmation flag
  intact and never presented as validated; the flag rides the output under `F8-28`.
- *A survey recorded structural observations* (cracks, roof age, waterproofing). Observations only,
  never a verdict — they travel to the designer as inputs to a human decision, not as a finding
  (M04 owns the capture).
- *A large job's tracker foundations or pile embedment are requested.* Same law: engineer-led,
  never computed, disclaimer on every sheet (`F8-25`, `F8-28`).

**Acceptance criteria.**

- Given any output of the product, when it is inspected for structural claims, then no output
  states or scores structural adequacy, safety or sufficiency (`F8-25`).
- Given a design requiring structural verification, when it is approved, then the decision is
  recorded with the approver's identity, the time, and the design version reviewed (`F8-26`,
  `F8-27`).
- Given an approved design, when it is edited, then its approval no longer applies and the design
  is unapproved until a fresh decision is recorded (`F8-27`).
- Given any surface or file carrying structural quantities or a structural model, when it renders
  or is exported, then the material-estimate-not-structural-check statement travels with it
  (`F8-28`).
- Given a design without a recorded sign-off, when any customer-facing surface is requested for
  it, then nothing is shown to the customer (`F8-29`).

**Localization notes.** The disclaimer of `F8-28` is translated EN/HI/MR and is required in the
language of the document it rides on, including exported drawing sheets, whose title blocks must
reserve room for Devanagari expansion. The sign-off record displays the approver's name as
entered (never transliterated) with a localized timestamp per `pack.formats` (`F1-21`).
**Analytics events:** sign-off approved / returned (with design version); approval invalidated by
edit; customer-facing render blocked for want of sign-off.

### F8.6 — Correlation, not attribution

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F8-30 | **Influence is reported as correlation, and the screen says so.** The rule, verbatim: **"'Deals it touched' is correlation, not attribution — and the screen must say so."** The automated agent's impact block renders with its caption, verbatim: *"The agent called and the customer responded within 3 days. We cannot prove the call caused it."* The product never claims that an automated touch generated a deal or a value of pipeline. | `SRC` — `AP.honesty.1` (*retired: tenant-config ledger*; journey L1323–1333), quoted verbatim (shared — M07 and M13 own the agent-performance screens); `D37` ("agent contribution is correlation, not attribution" — cited, M13 owns dashboards) | P0 |
| F8-31 | **The caveat renders beside the number, not behind an interaction.** The correlation statement is persistent on-screen content adjacent to the figure it qualifies — never a tooltip, an info icon, a hover state, or a link to an explanation elsewhere. The source names the failure it is preventing: an owner sees a big number and over-trusts it because the caveat was one interaction away. | `SRC` — `AP.wrong.3` (journey L1348–1349): "the caveat is on the screen, not in a tooltip" (shared — M07/M13 own the screens); N1 of `DOC10.n-rules` (no hover-only meaning — cited, F7 owns) | P0 |
| F8-32 | **The law generalises: no surface claims causation where the product observed only sequence.** Any metric that relates an action to an outcome — automated-call impact, campaign influence, a rep's touch, a nudge, a notification — is reported as observed sequence with its window stated, never as credit. Related laws that flow from the same principle and are owned elsewhere: a forecast is a projection and never counted as revenue; won means signed; and an outcome that reverses stops counting immediately rather than quietly persisting in a total. | `SRC` — `D37` (*retired: D-census ledger*; docs/15: HONORED — "forecast is a projection, never revenue … won means signed, and a deal cancelled after Won never silently keeps counting as revenue; agent contribution is correlation, not attribution") — cited, M13 owns the dashboards; reversal mechanics per `R2` (`CANCELLED` stops revenue counting immediately — cited, M08) | P0 |

**Behavior detail.** The source's reasoning is a trust argument rather than a statistical one:
claiming an agent generated a large pipeline figure when it made one follow-up call is exactly
the dishonesty the product exists to avoid, and an owner who catches the product inflating one
number stops trusting every other number it shows. The honesty label therefore protects the whole
dashboard, not just the tile it sits on.

What the product may state is what it observed: an action happened, an outcome followed within a
stated window, here is the set of deals where both are true. What it may not state is that the
first caused the second. The distinction is carried in the copy — "deals it touched", with the
window named — and in the caption, which is required rather than recommended. `F8-32` extends the
same discipline to every influence claim the suite will grow (campaign attribution in the
marketing module is the obvious next case), so no later module has to re-derive the rule.

**Permissions.** The screens this law binds are reached through `F2.M07.agent-performance` and
`F2.M13.company-reports` and are scoped per `F2-12` (own / team / all). Scope changes which deals
appear in the correlation set; it never changes the claim made about them. No role sees an
attribution version of these screens.

**Edge cases & what-goes-wrong.**

- *An owner over-trusts a large "deals touched" figure.* The caveat is beside the number, not in a
  tooltip (`F8-31`) — the source's own resolution of this exact failure.
- *A deal appears in the correlation set and was in fact closed by a rep's own call.* Both are
  true and the product claims neither caused the other; the set is a correlation window, and the
  screen says so.
- *A tenant asks for an attribution model* (percentage credit per touch). Out of scope by
  `F8-32`: the product does not sell a causal claim it cannot support. A future model would be an
  owner ruling, recorded, not a screen-level configuration.
- *A won deal is later cancelled.* It stops counting immediately rather than persisting in a
  total; the correlation set reflects the current truth (`F8-32`, mechanics in M08/M13).

**Acceptance criteria.**

- Given an impact block reporting the automated agent's influence, when it renders, then the
  verbatim correlation caption of `F8-30` renders with it, as persistent on-screen content
  adjacent to the figure (`F8-30`, `F8-31`).
- Given any metric relating an action to an outcome, when it renders, then its observation window
  is stated and no causal claim is made (`F8-32`).
- Given a projection and an achieved figure on the same surface, when they render, then the
  projection is never included in the achieved total (`F8-32`).

**Localization notes.** The caption of `F8-30` is translated EN/HI/MR; the window ("within 3
days") renders through the locale's date/duration rules from `pack.formats` (`F1-21`) without
altering the window itself. Compact number grouping in the qualified figure follows the tenant
market's format values — it never abbreviates so far that the caveat's subject becomes unclear.
**Analytics events:** correlation block rendered (with window); caveat impression (to verify it
is never suppressed at narrow breakpoints).

### F8.7 — Honest state, usage and degradation

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F8-33 | **Usage screens show exactly the numbers the product enforces and bills from.** The tenant-visible usage view reads the same rollups, from the same query, that entitlement enforcement and invoicing use — same numbers, no smoothing, no rounding for presentation, no separate display counter. Each figure is labelled with the period it covers and described in **plain "actual usage" language** (owner ruling 2026-08-04, Q9): the provenance word "measured" — and the tier vocabulary generally — is **reserved for engineering and survey data** and does not appear on usage or billing screens. Consumption is disclosed *before* a gate fires: when a bundle is substantially consumed, the screen says so ahead of the block, never afterwards. | `SRC` — `DOC16.usage-honesty` (docs/16), quoted (shared — M12 owns the usage screen, the ledger and the gates); plain-language wording per owner ruling 2026-08-04 (Q9), resolving the "measured"-vocabulary tension | P0 |
| F8-34 | **A message about product state describes the actual state.** Copy about billing, entitlement, gating or account state states what is true and what will happen: it never threatens a consequence that will not occur, it names exactly what has paused and what still works, and where an action would restrict the tenant it shows exactly what will be blocked before they confirm. The product's standing pre-commitment — reads, exports and customer links keep working — is stated plainly rather than left ambiguous as leverage. | `SRC` — `DOC16.dunning-honesty` (docs/16): "no 'your data will be deleted' threats, because it won't be" (shared — M12 owns dunning copy); `DOC16.downgrade` ("shows EXACTLY what will be blocked before confirming (honesty rule)") and `DOC16.dunning-ladder` ("states EXACTLY what paused and what still works") — cited, M12 owns | P0 |
| F8-35 | **A capability that is unavailable degrades on a declared path and says so — it never silently no-ops.** Where a capability the product advertises is not provided by the underlying rail in a given market or deployment, the affected step is skipped or downgraded along a defined path, the outcome is recorded on the record it affects, and a human is told what did not happen. The named v1 instance: automated menu traversal is unavailable because the reference telephony rail does not provide the required capability, so traversal "degrades honestly" and the call is flagged for human follow-up. | `SRC` — `OD-7` (*retired: rulings ledger*; docs/15 §4 directive 7, ADR-0019): "IVR traversal degrades honestly until a capable adapter exists" (shared — M07 owns telephony, F1 owns the market rails); `DOC07.telephony-capabilities` ("degrades on a defined path — never throws, never silently no-ops"; "step skipped, call flagged … for human follow-up") — cited, M07 owns | P0 |
| F8-36 | **An action that cannot be performed fails fast and honestly rather than appearing to succeed.** Where the product cannot complete an action — connectivity, entitlement, a missing capability — it says so at the moment of the attempt, in plain language naming the reason, and does not silently queue, partially apply, or display an optimistic result. | `SRC` — `R14` (docs/15 §1): actions that cannot be performed "fail fast, honest message, never queued"; `DOC06.online-only-set` (docs/06) | P0 |

**Behavior detail.** These four are the honesty laws pointing at the product's own conduct rather
than at engineering numbers, and they share one property: each removes an incentive to shade.
`F8-33` removes the temptation to show a friendlier usage figure than the one the invoice will
use — the screen and the bill are the same query, so a tenant who checks can always reconcile,
and the pre-gate disclosure means a block is never the first news of consumption. The source
fixes the disclosure point concretely rather than leaving it to judgement: **if a bundle is 80%
consumed, the screen says so — before the gate ever fires.** The 80% figure is the honesty
threshold this document requires; the gate itself, its ceilings and its enforcement mechanics are
`modules/M12-platform-billing.md`'s. `F8-34` removes
the temptation to use fear as a collection tool; the source is explicit that the threat would be
false, and false leverage costs more trust than it collects. `F8-35` and `F8-36` remove the
temptation to hide a limitation behind a silent failure, which is the most expensive kind of
dishonesty because the user only discovers it downstream, from a customer.

The usage figure's provenance deserves a word: the source labelled it `measured`, in the sense
that it is read from the enforcing ledger rather than modelled or smoothed. The owner resolved
the definitional tension on 2026-08-04 (Q9): usage and billing screens say **"actual usage"**
in plain language, and the tier vocabulary — `measured` included — stays reserved for
engineering and survey data. `F8-02`'s canonical "(on site)" definition is unwidened.

**Permissions.** Usage and billing surfaces are reached through `F2.M12.manage-billing`; scope
does not change the numbers, only who may read them. Nothing in the entitlement system may gate
an honesty label, a disclosure, a provenance tier or a staleness state — gating applies to
capacity and features, never to the truth about what the tenant already has (the never-gated law
is M12's; `F8-06` is its counterpart here).

**Edge cases & what-goes-wrong.**

- *A rollup is expensive to compute in real time.* The screen shows the enforced rollup with its
  period, not a cheaper approximation; a delay is disclosed as a delay.
- *A bundle reaches 80% consumption mid-period.* The screen says so at that point, before the
  gate fires (`F8-33`); the first notice is never the block.
- *A payment fails.* The message states what happens next, what has paused, and what continues to
  work — with no claim that data will be lost (`F8-34`).
- *A tenant considers moving to a smaller plan while over its ceilings.* The exact list of what
  will be blocked is shown before confirmation (`F8-34`).
- *An automated call needs a capability the rail does not provide.* The step is skipped, the call
  is flagged for human follow-up, and the record shows what did not happen (`F8-35`).
- *A user attempts a money mutation with no connectivity.* Refused at the attempt with an honest
  reason, never queued to look successful (`F8-36`).

**Acceptance criteria.**

- Given the tenant-visible usage view, when it renders a metered figure, then that figure equals
  the rollup used for enforcement and invoicing for the same period, and the period and provenance
  are labelled with it (`F8-33`).
- Given a bundle that is 80% consumed, when the tenant opens the usage view before any gate
  fires, then the screen already says so (`F8-33`).
- Given any billing, entitlement or account-state message, when it renders, then it names what has
  changed, what still works, and no consequence that will not occur (`F8-34`).
- Given a restricting action a tenant can choose, when confirmation is requested, then exactly
  what will be blocked is shown before the confirmation (`F8-34`).
- Given an automated step whose required capability is unavailable, when the step is reached, then
  it degrades on its declared path, the record shows what did not happen, and a human is notified
  (`F8-35`).
- Given an action the product cannot complete, when a user attempts it, then it fails at the
  attempt with a plain-language reason and is never queued, partially applied, or shown as having
  succeeded (`F8-36`).

**Localization notes.** State and dunning copy is translated EN/HI/MR and must survive Devanagari
expansion without truncating the "what still works" clause — truncation would turn an honest
message into a threat. Usage figures render through `pack.formats` (`F1-21`) in the tenant's
stamped currency (`F1-07`) where money is shown. **Analytics events:** usage view opened (with
consumption band); pre-gate disclosure shown; degradation path taken (capability, record);
fail-fast refusal shown (reason class).

## 4. Cross-module contracts

**What F8 provides.** One vocabulary and six laws. Every consumer references the requirement ID;
none restates the rule in different words, and none narrows it.

| Consumer | What it must conform to |
|---|---|
| `modules/M04-survey.md` | Tier assignment at capture — remote = `derived`, physical = `measured` (`F8-02`); the imagery-basis document line (`F8-22`); AI-detected geometry carries its provenance and confidence beside the tier (`F8-01`, `F8-07`); structural observations are observations, never verdicts (`F8-25`) |
| `modules/M05-design-studio.md` | Per-line BOM confidence reads the four tiers and no fifth (`F8-02`, `F8-03`); block aggregates inherit the weakest tier (`F8-04`); energy source labels (`F8-08`–`F8-10`); model limits printed (`F8-11`); provisional-during-recompute and issue blocking (`F8-17`); stale captures and sheets (`F8-19`); the never-computed law, sign-off record and travelling disclaimer (`F8-25`–`F8-28`) |
| `modules/M06-proposals.md` | Path A/B tiering (`F8-21`); the verbatim indicative line on the document and its customer rendering (`F8-20`); pinned versions on generated documents and the never-mutate rule for sent ones (`F8-14`, `F8-15`); stale pricing says so and offers regeneration (`F8-18`); projections labelled with assumptions (`F8-23`); one figure across screen, document and link (`F8-24`) |
| `modules/M07-sales-execution.md` | The correlation caption on agent impact, on-screen not in a tooltip (`F8-30`, `F8-31`); honest degradation of automated steps with the record showing what did not happen (`F8-35`); figures the agent speaks obey the same tiers and disclosures as written ones (`F8-24`, `F8-06`) |
| `modules/M11-payments-and-collections.md` | Money figures recompute before display or render provisional (`F8-12`); tranche and receipt figures reconcile to the same computed values shown elsewhere (`F8-24`); nothing in the money path presents a projection as an amount owed (`F8-23`) |
| `modules/M12-platform-billing.md` | Usage screens equal the enforced/billed rollups with period and provenance (`F8-33`); honest state, dunning and downgrade copy (`F8-34`); entitlements gate capacity, never honesty labels (`F8-06`) |
| `modules/M13-dashboards-and-reporting.md` | Every tile's number carries a tier and inherits the weakest (`F8-01`, `F8-04`); correlation not attribution, projections never counted as achieved, reversals stop counting (`F8-30`, `F8-32`) |
| `foundations/F5-customer-link.md` | Every figure on the link carries its tier, source label and disclosures (`F8-01`, `F8-08`, `F8-20`, `F8-22`); the link's figures equal the document's (`F8-24`); no unapproved design is ever rendered to a customer (`F8-29`); sent-document figures never move (`F8-15`) |
| `modules/M01-onboarding-and-tenant-config.md` | Tenant configuration and templates offer no switch that weakens any law here (`F8-06`); catalog provenance and release labels feed `F8-14`'s pinning |
| `modules/M03-marketing.md`, `modules/M09`, `modules/M10` | Any influence, attendance or activity metric follows `F8-32` (observed sequence, stated window, no causal claim) and `F8-01` |

**What F8 takes from others.** From `foundations/F1-global-market-framework.md`: pack versioning
as a staleness input (`F1-11`), the one-currency-per-tenant stamp (`F1-07`) and the format values
every label renders through (`F1-21`) — F8 names no market fact of its own. From
`foundations/F2-roles-and-permissions.md`: the sign-off capability and its preset
(`F2.M05.approve-designs`, `F2-03`, `F2-04`) and the no-per-person-exceptions law (`F2-15`) that
makes `F8-06` enforceable. From `foundations/F3-localization.md`: the single money/number
rendering implementation these labels attach to. From `foundations/F7-design-language.md`: the rendering grammar for tiers,
provisional states and disclosures, and the Definition of Done that already requires a tier on
every number.

**Standing verification rule for every downstream task.** A module PRD conforms to F8 when: every
requirement that produces a user-visible number states its tier or cites `F8-01`; no document in
the suite contains a provenance value outside the four of `F8-02`; every money-bearing surface
cites the provisional rendering of `F8-12`; and no requirement anywhere offers a role, plan,
setting or template that weakens a law in this document (`F8-06`). The closure pass checks the
fifth-tier condition mechanically across `docs/prd/`.

## 5. Non-goals

- **F8 does not compute anything.** It defines no model, no ladder, no formula and no threshold.
  Rationale: the source's honesty system is a labelling and disclosure law over outputs the
  engineering modules own; merging the two would let a display rule quietly change a number.
- **No fifth tier, and no parallel vocabulary.** Explicitly excluded by `R18` ("No screen invents
  a fifth tier"); a genuine need is an owner ruling, not a local addition.
- **No tenant-configurable honesty.** No white-label mode, plan tier, role or template setting
  suppresses a tier, label, disclaimer or staleness state (`F8-06`; `TC.principle.4`).
- **No computed structural verdict, at any scale** — the hard product law of `F8-25`. What is
  offered instead is a material estimate, a visual model and a recorded human sign-off.
- **No attribution modelling.** The product reports correlation with a stated window and does not
  sell causal credit for touches (`F8-32`). Rationale: the claim is unsupportable and the source
  names it as the specific dishonesty to avoid.
- **No statistical uncertainty layer in v1** — exceedance statistics and uncertainty bands (the
  bankable-report pattern) are a designed-for additive layer on the same energy model, owned by
  `modules/M05-design-studio.md` and triggered by enterprise/utility demand (`CG-10`, cited).
  Their absence changes nothing about the labels required here.
- **No implementation content.** Fingerprints, version columns, enforcement layers and enums are
  deliberately absent (design spec §14 / DD4); the product law they satisfy is stated instead.

## 6. Open questions

Mirrored into `registers/open-questions.md`.

- **`F8-Q1` — RESOLVED (owner ruling 2026-08-04, Q8 — the two-flow simplicity rule).** Roof
  geometry enters by exactly **two flows**: (1) studio/remote drawing, keeping the existing
  `derived`/`estimated` tags; (2) physical survey capture, which is **`measured` — including
  surveyor-typed instrument readings entered on site**. No phone-typed roof flow exists, no
  fifth tier is created, and no context machinery is built. Typed figures outside the
  physical-survey flow keep the weakest applicable tier (`assumed`, `F8-21` now final);
  `F8-02`'s four tiers stand unchanged.
- **`F8-Q2` — RESOLVED (owner ruling 2026-08-04, Q9).** The four-tier vocabulary does **not**
  extend to platform usage metering: usage and billing screens use plain **"actual usage"**
  language (`F8-33`, `M12-34`), and the provenance word "measured" is reserved for
  engineering/survey data. `F8-02`'s "(on site)" definition is unwidened.
