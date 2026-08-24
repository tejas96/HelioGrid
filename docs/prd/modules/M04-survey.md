# M04 · Survey

Status: draft · Origin mix: SRC throughout — every requirement in this document is source-derived
(no `BRIEF` scope and no `REC` items; the V2 brief's mobile-first mandate shapes §2's surface
emphasis but adds no requirement here) · Depends on:
`00-README.md`, `01-product-overview.md`, `02-personas.md`, `04-business-model.md`,
`foundations/F1-global-market-framework.md`, `foundations/F2-roles-and-permissions.md`,
`foundations/F3-localization.md`, `foundations/F4-data-integrity.md`,
`foundations/F7-design-language.md`, `foundations/F8-data-honesty.md`,
`modules/M02-crm-and-leads.md`, `_process/2026-08-03-v2-prd-design.md` §2 (DD2, DD3, DD4)

## 1. Purpose & scope

This module is where a roof stops being an address and becomes something a person can design on.
It owns **two survey modes** and everything each one produces: the **remote survey** — an address,
satellite imagery, an automatically detected roof with confidence on every detection, reviewed and
corrected by a person — and the **physical survey** — a guided on-site capture that hands the
designer what only a visit can establish.

The module's governing decision is carried whole from the source: *"Survey has two modes"* — remote
is *"a designable roof, from a desk, in minutes"* and physical *"confirms reality before
installing"* (`D30`, `S4.rule.two-modes`). Its consequence is a sequence change the product is
built around: for residential work the order becomes **remote survey → design → proposal → then a
physical visit once the customer is interested**, so the site visit is **verification before
installation, not a prerequisite for quoting**. The source calls the remote mode *"a competitive
weapon, not a shortcut"*, and the reason is the first-callback race — the EPC who answers with a
real roof and a real number first is usually the one who wins the job.

One law holds the module together and it is not negotiable.

It is **honesty about where a number came from**. Remote data is **derived from satellite
imagery**; physical data is **measured on site**. Every figure this module produces carries that
distinction into the design, the proposal and the customer link through `foundations/F8`'s
provenance system, and a proposal built on a remote survey *"is legitimate and sellable — it just
must not claim to be a site survey"* (`S4.rule.honesty`). Two behaviours follow from it directly:
what remote **cannot** tell you is stated on screen rather than left to be discovered, and a
detected roof is **never applied silently** — accept, adjust or reject, with the detector's
confidence visible.

*Section removed 2026-08-07 by owner decision: the offline/sync capability was deleted.*

The module owns, as feature areas: the two modes and the mode decision · Mode A's address entry,
imagery and pinned tile · AI roof detection with confidence, the editable overlay and the doorway
into a design · coverage failure and its honest fallback · the "what remote cannot tell you" gaps
list · the derived-vs-measured honesty consequence · Mode B's visits home · guided
capture and the five capture groups · review and submit · photographs as reference and never
measurement · visits, survey versions and the survey record · and the survey → design hand-off.

**What this module is explicitly not.**

- It does **not** measure anything from a photograph. No LiDAR, no automatic roof measurement from
  photographs, no augmented-reality height estimation — **every dimension and every height is
  entered or estimated by a person** (`D35`, `S4.notv1.1`, §5).
- It does **not** own the design. A detected roof, a captured dimension and a photograph are
  *inputs*; the canvas, the geometry kernel, the layout and the electrical model are
  `modules/M05-design-studio.md`'s. This module hands over a validated artifact and stops.
- It does **not** own the energy figure. The irradiance source of record, its database ladder and
  its fallback are `foundations/F8`'s labelling law (`F8-08`–`F8-10`) and `modules/M05`'s
  computation. No coverage failure in this module ever degrades an energy figure, because energy
  never depended on the imagery provider (`R5`).
- It does **not** own the booking act. Booking a site visit from a lead is `modules/M02`'s
  (`M02-46`, `M02-47`); the visit object, its states, the capture flow and everything that happens
  on the roof are this module's from that moment.
- It does **not** define roles or permission cells — `foundations/F2-roles-and-permissions.md` is
  the permission truth. This module names its capability rows (`F2.M04.*`) and never restates a
  matrix (`F2-25`).
- It does **not** state, imply or score whether a roof or a structure is adequate. Structural
  capture is *"observations only, never a verdict"* (`S4.rule.capture`, `F8-25`).
- It carries no market facts as constants: units, formats, the utility directory a site record
  selects from and every statutory term are market-pack data referenced through F1's pack keys
  (`F1-02`, `F1-22`, `F1-53`).
- No implementation content: no schemas, APIs, storage design, model names as dependencies, or
  build sequencing (design spec §14/DD4). Where source rows name a mechanism, this document
  carries the product law and drops the mechanism.

**Vendors appear here only as capability requirements.** Satellite imagery, building-insights roof
data and vision-model roof detection are **vendor-neutral capability ports**; the v1 services
behind them are **reference implementations**, named once for grounding and never as dependencies
(`F1-04`, `F1-43`'s pattern). The binding requirement in every case is the *capability plus its
honesty and fallback obligations*, and every one of them has a manual path that costs nothing and
always works.

## 2. Personas & surfaces

- **Survey Engineer** — the module's primary persona and the only one whose home screen this module
  defines. Their home is **today's site visits** (`PS-13`) and their working surface is the guided
  capture flow.
- **Sales Executive** — runs the **remote** survey. The source's whole argument for Mode A is the
  rep's: an address goes in during or just after the first call and a designable roof comes back in
  minutes, without booking anyone's time. Reps also capture physically — *"a Sales Executive
  standing on the roof"* — because surveying is a capability, not a persona gate (`D15`, `PS-14`).
- **EPC Owner · Sales Manager** — schedule and reassign survey visits, run remote surveys, and see
  every survey in their visibility scope. In the one-person firm the Owner is every persona in this
  module at once.
- **Design Engineer** — both the receiving end and, per source, a Mode A operator. A submitted
  survey is the designer's brief: the captured groups, the photographs, the open gaps, the access
  constraints and the provenance of every figure (§M04.12). Designers also **run remote surveys** —
  the source names them beside the rep for Mode A, *"rep or designer, at a desk, minutes after the
  lead arrives"* (journey L339) — so `F2.M04.run-remote-survey` is theirs. What is not theirs is
  **field capture**: the physical visit belongs to the holders of `F2.M04.capture-surveys`, and the
  two are deliberately different capabilities (F2 §F2.5-M04 notes).
- **Project Manager** — reads the survey of a project they own for access and site constraints; no
  capture, no scheduling.
- **Field Technician · Installation Team Member · HR/Admin · Finance · Operations · Marketing** —
  no survey surfaces. Field-workforce location, attendance and route surfaces are
  `modules/M09-field-workforce.md`'s and are not survey capture.

**Surfaces.** Web and mobile carry every capability equally (`F7-30`); the emphasis differs sharply
and deliberately.

- **Mode A is web-emphasis, mobile-complete.** The map, the detection overlay and the vertex-level
  adjustment want a large viewport and a pointer; the flow works whole at the mobile breakpoint
  because the rep who needs it most is often standing outside a customer's house.
- **Mode B is mobile-only in practice and mobile-first by design.** The visits home, the guided
  capture, the camera, the shading sketch and the review screen are designed at 375 px first
  (`F7-30`) and are what the product looks like to a person holding a phone on a roof in sunlight.
  Every one of them renders on web for review and correction; none of them assumes a desk.
- The surveyor's shell centre action is **Start survey** — the arc bar's elevated centre with its
  role-adaptive verb (`F7-22`).

*Section removed 2026-08-07 by owner decision: the offline/sync capability was deleted. The one
device-held queue that survives is the survey photograph queue of `M04-55`, whose status is shown
on the capture screen (`SCR-M04-07`) and nowhere else.*

## 3. Feature areas

### M04.1 — The two modes and the mode decision

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-01 | **The survey has exactly two modes — remote and physical — and both produce the same kind of record.** A survey is one object with one identity per site whichever mode produced it: same groups, same photograph attachments, same hand-off to the designer, same versioning. The modes differ in **how the facts were obtained**, and that difference is carried as provenance (M04-34), never as two incompatible records or two parallel screens. | `SRC` — `D30` ("Survey has two modes: REMOTE … and PHYSICAL (on site)"); `S4.rule.two-modes` | P0 |
| M04-02 | **Mode A — remote: an address becomes a designable roof, from a desk, in minutes, with no travel and nobody's time booked.** The operator supplies an address; the product fetches satellite imagery and available building-insights roof data, detects the roof outline, its obstructions and its pitch and azimuth, and returns an editable result. The source's claim is the requirement: *"The app can survey a roof without anyone going there"* — enough to **design and quote**. Every figure it produces is **derived from imagery** (M04-34). | `SRC` — `S4.rule.two-modes` (quoted: "a designable roof, from a desk, in minutes"; "Remote: minutes, no travel, enough to DESIGN and QUOTE, data DERIVED from imagery"); `D30` · imagery/roof-data are vendor-neutral capabilities (M04-09) | P0 |
| M04-03 | **Mode B — physical: hours, travel, the customer at home, and reality confirmed before anything is installed.** An on-site visit captures what a person can see and reach: the roof from each corner, the meter and the main panel, what casts shade, how material gets up, and what the structure looks like. Its data is **measured on site** (M04-34) and it is what the product means by a confirmed site. | `SRC` — `S4.rule.two-modes` (quoted: "Physical: hours, travel, needs customer home, confirms reality before installing, data MEASURED on site") | P0 |
| M04-04 | **The site visit is verification before installation, not a prerequisite for quoting.** For residential work the sequence is **remote survey → design → proposal → physical visit once the customer is interested**. No design, proposal or price in this product may be gated on a physical visit having happened; the visit is required before installation (M04-05) and is a normal, expected step *after* interest, not a queue in front of the first quote. | `SRC` — `D30` ("the physical visit becomes verification before installation rather than a prerequisite for quoting"; docs/15: HONORED — remote-first residential); `S4.rule.two-modes` | P0 |
| M04-05 | **Which mode, when — five rules, carried whole, surfaced as guidance rather than enforced as a lock.** (1) **Residential, simple roof** → remote is the default first pass; physical after interest. (2) **Commercial & industrial, large or complex** → start remote, and physical **always before quoting**. (3) **No roof-data coverage for the address** → remote is not possible; physical is required (§M04.4). (4) **Roof recently modified** → remote is unreliable; physical is required. (5) **Before installation** → remote is *"never enough"*; physical always. The product states the applicable rule where the mode is chosen and where a proposal is built on a remote-only survey; it does not silently pick for the operator. | `SRC` — `S4.rule.mode-choice` (all five, verbatim); segment from the lead (`M02-05`); post-`R5` reading of rule 3 recorded at M04-25 | P0 |
| M04-06 | **Surveying is a capability, not a gatekeeper, and there is one capture flow for everyone who holds it.** A survey is a task assignable to anyone holding the capability — a dedicated Survey Engineer or a Sales Executive standing on the roof — and both use the identical flow, with no reduced or "lite" variant for the non-specialist. The persona describes whose job it usually is, never who is permitted to do it. | `SRC` — `D15` ("Survey is a task assignable to anyone with the capability — rep or dedicated surveyor. One capture flow for both"; docs/15: HONORED); `PS-14`; grant at `F2.M04.capture-surveys` | P0 |
| M04-07 | **The remote path is measured against a speed budget: a remote survey reaches a sendable proposal in under ten minutes.** The budget is a product requirement carried from the source, not an aspiration, and this module owns its first and largest segment — address in to reviewed roof out. Every Mode A screen is designed against it: no blocking spinner walls, no step that waits on a human decision the product could have pre-filled, no re-entry of anything the lead already holds. | `SRC` — `F7-37` (Principle 8, the second binding speed budget, consumed as a published requirement); `S4.rule.two-modes` ("a competitive weapon, not a shortcut"); `C1` (cited — speed of first callback decides who wins, `foundations/F5`) | P0 |

**Behavior detail.** The mode is chosen at the moment a survey starts, from the lead or from the
surveys surface, and the choice is presented as two clearly different offers rather than a
radio-button setting: *survey this roof now, from here* and *book someone to go*. The lead's
segment (`M02-05`) selects which of `M04-05`'s rules the product states first — residential leads
open on remote, commercial & industrial leads open on remote **with rule 2 stated on the same
screen** ("a physical survey is required before this is quoted"). Rules 3 and 4 are reactive: rule
3 fires when coverage fails (§M04.4), and rule 4 is a question asked once at address confirmation —
*"has this roof been changed recently?"* — whose "yes" marks the remote result unreliable and
offers to book a visit. Rule 5 has no screen of its own in this module; it is a condition
`modules/M08-projects.md` reads before installation and is stated here as the survey-side law.

A survey started in one mode may be **completed in the other**, and a site may hold both: the
common case in the source's own sequence is a remote survey followed later by a physical one, which
is a new version of the same site's survey (M04-57), not a correction of the first.

Permissions: `F2.M04.capture-surveys` for capture in either mode (EPC Owner · Sales Manager · Sales
Executive · Survey Engineer); `F2.M04.run-remote-survey` for the remote run specifically, because
it consumes a metered capability (M04-23); `F2.M04.schedule-survey-visits` for booking, reassigning
and cancelling. Survey visibility follows the lead or site the survey belongs to
(`F2.M02.lead-visibility`, `F2-12`–`F2-14`); this module creates no separate visibility domain.

**Edge cases & what-goes-wrong.**

- *A commercial & industrial lead where the rep tries to quote from a remote survey alone* → rule 2
  is stated at the point of building the proposal, not discovered afterwards (M04-05); the proposal
  itself carries `F8-22`'s line either way.
- *A one-person firm* → the same person runs the remote survey, drives to the site and captures
  physically; no hand-off exists to break (M04-06).
- *A site whose remote survey is months old and whose visit has just happened* → both versions exist
  and the newer one is the current survey (M04-57); the provenance change is shown, never silent
  (M04-37).
- *Mode chosen wrongly* → the mode is a property of a survey version, not of a site; starting the
  other mode is always available and never destroys the first.

**Acceptance criteria.**

- Given a lead with a confirmed address, when a survey is started, then both modes are offered and
  the mode applicable to that lead's segment is stated with its rule (M04-01, M04-05).
- Given a residential lead with a remote survey only, when a design and then a proposal are built,
  then nothing in the flow requires a physical visit to have happened and the proposal is
  generated, carrying its imagery-basis line (M04-04, `F8-22`).
- Given a commercial & industrial lead, when a proposal is about to be built on a remote-only
  survey, then the "physical always before quoting" rule is stated on that screen (M04-05).
- Given a user holding `F2.M04.capture-surveys` and no survey-specialist role, when they open a
  survey, then they get the identical capture flow a Survey Engineer gets (M04-06).
- Given an address with roof data available, when the remote survey completes, then a designable
  roof — outline, obstructions, pitch and area — exists with nobody having visited the site, and
  every figure it produced carries `derived` (M04-02).
- Given a completed physical survey, when it is read, then it carries the on-site facts a remote
  survey cannot establish — the meter and its panel, roof condition, access, and shading not
  visible from above — each tiered `measured` except where the surveyor estimated it (M04-03).
- Given a lead with a confirmed address, when a remote survey is run and a proposal generated from
  it with no physical visit, then the elapsed path is measured against the ten-minute budget and no
  step in this module blocks on a spinner wall or on a decision the product could have pre-filled
  (M04-07).

**Localization notes.** Both mode names, all five mode rules and every guidance line are translated
per `F3-01`/`F3-06`; distances, areas and dimensions render through the shared format
implementation on the reader's unit preference with procurement figures staying metric regardless
(`F3-23`). **Analytics events:** survey started (mode, segment, origin surface) · mode rule shown
(rule number) · mode switched · elapsed address-to-reviewed-roof (the M04-07 budget) · elapsed
remote-survey-to-proposal-sent (`F7-37`, cross-module).

### M04.2 — Mode A: address, imagery and the pinned tile

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-08 | **Mode A starts at an address: search it, or drop a pin — and the building is shown highlighted on a satellite preview before anything is detected.** The operator confirms *that building*, visually, as the first act of the survey. Nothing is fetched, detected or metered until the building is confirmed. | `SRC` — `S4.screen.1` ("Address entry: search or drop a pin. Satellite preview with the building highlighted") | P0 |
| M04-09 | **Satellite imagery and building-insights roof data are vendor-neutral capability requirements, and they are an enhancement — never a dependency.** The product requires *a* capability that returns imagery for a location and *a* capability that returns roof data where it exists; the v1 services behind them are reference implementations (Google Solar Building Insights and elevation/DSM data). The binding law is the source's: *"No feature depends on [the roof-data provider] existing"*, and any failure *"simply means the studio starts from manual tracing"*. | `SRC` — `DOC07.google-enhancement-only` (docs/engineering/07, quoted verbatim: "enhancement, never dependency"; "coverage is patchy and that is fine"); `R5` *(shared — the imagery/detection half; the energy source-of-record ladder is `modules/M05`'s and the labelling law `foundations/F8`'s)* · vendor-neutrality per `F1-04`, reference-implementation pattern per `F1-43` | P0 |
| M04-10 | **The imagery tile is fetched once per site capture and pinned: the tile a roof was traced on never changes under it.** The stored tile is what detection runs against and what the operator and, later, the designer see — one image, one coordinate mapping, for the life of that survey version. A newer tile becoming available does not silently replace it; it is offered as a new capture. | `SRC` — `DOC07.map-tile-pinned` (docs/engineering/07, quoted: "the tile a design was traced on never changes under it"; stable 1:1 mapping, reproducible provenance) *(shared — the studio canvas that renders the same pinned tile is `modules/M05`'s)* | P0 |
| M04-11 | **Imagery failure never blocks a survey: the flow continues on a blank canvas with manual outlining and known-distance calibration.** Where no tile can be fetched at all, the operator can still outline the roof by hand and establish scale from a known distance, and the survey proceeds. *"Never blocks."* | `SRC` — `DOC07.map-tile-pinned` ("Tile fetch failure → studio still opens with blank canvas + manual calibration (known-distance rescale); 'Never blocks'"); refusal wording per `F8-36` | P0 |
| M04-12 | **When the address resolves to the wrong building, the operator re-points it before anything is detected — and correcting the address corrects the site record.** The confirmation step of M04-08 exists for exactly this failure. A pin moved to the correct building updates the survey's location and the site record it belongs to, so the mistake is not re-made on the next visit or the next design. | `SRC` — `S4.wrong.1` ("Address resolves to the wrong building"); `S4.wrong.11` (correction updates the site record — the on-site half is M04-59) | P0 |
| M04-13 | **Imagery age is a stated fact on the review screen, not a discovery made later.** The capture date of the tile is shown beside the detected roof, and the operator is asked the one question the imagery cannot answer — *has this roof changed since?* A "yes" marks the remote result **unreliable** (mode rule 4, M04-05), records that mark on the survey so the designer sees it, and offers to book a physical visit. | `SRC` — `S4.wrong.3` ("Imagery is years out of date and the roof has changed"); `S4.rule.mode-choice` (rule 4: "Roof recently modified → remote unreliable, physical required"); staleness is stated per `F8-13`, `F8-19` (consumed) | P0 |

**Behavior detail.** Address entry accepts a typed search and a dropped pin, and it pre-fills from
the lead's address where one exists so the rep is confirming rather than retyping (`M04-07`'s
budget). The preview highlights the building the address resolved to, at a zoom where a person can
recognise their own roof; if several buildings sit at one address — a common case in dense
neighbourhoods and on commercial plots — the operator picks one, and that pick is part of the
survey record.

Where the external intelligence after confirmation cannot be reached, the manual path is offered in
the same breath, because the manual path costs nothing and always works (M04-22).

The pinned tile of `M04-10` is what makes every later claim reproducible: the detection's
confidence, the operator's adjustments, the designer's layout and any subsequent dispute all refer
to one image. Where the operator wants newer imagery, they start a new survey version (M04-57)
rather than mutating the current one — the earlier version keeps its tile and its result, because
the earlier version is evidence of what was decided from.

Permissions: `F2.M04.run-remote-survey`. Correcting a site address additionally rides the record's
own edit grant in `modules/M02` (`F2.M02.add-edit-leads`) where the address lives on the lead.

**Edge cases & what-goes-wrong.**

- *Wrong building* (`S4.wrong.1`) → re-point before detection; the site record updates (M04-12).
- *Imagery years out of date and the roof has changed* (`S4.wrong.3`) → age shown, changed-roof
  question asked, result marked unreliable, physical visit offered (M04-13).
- *No tile at all* → blank canvas, manual outline, known-distance calibration; never a dead end
  (M04-11).
- *Several buildings at one address* → the operator picks the building; the pick is recorded.

**Acceptance criteria.**

- Given an address search or a dropped pin, when the preview renders, then the resolved building is
  highlighted and no imagery is consumed or metered until the operator confirms it (M04-08).
- Given a confirmed building, when the survey is later reopened or opened by the designer, then the
  same stored tile is shown and the same coordinate mapping applies (M04-10).
- Given a tile that cannot be fetched, when the operator continues, then a blank canvas with manual
  outlining and known-distance calibration is available and the survey can be completed (M04-11).
- Given a resolved address the operator identifies as the wrong building, when the pin is moved,
  then the survey and the site record both carry the corrected location (M04-12).
- Given a fetched tile, when the review screen renders, then the tile's capture date is shown and
  the changed-roof question is asked; and given a "yes", then the survey is marked remote-unreliable
  and a physical visit is offered (M04-13).
- Given the imagery or roof-data capability is unavailable, unconfigured or silent for this address,
  when the survey continues, then every remaining step still completes through the manual path and
  no capability of this module has been removed from the flow (M04-09).

**Localization notes.** Address search, the building-confirmation prompt, the changed-roof question
and every refusal string are translated per `F3-01`; dates render through the shared format
implementation on the tenant's timezone (`F3-19`, `F3-22`); address components and place names are
never translated (`F3-08`). **Analytics events:** address resolved (method: search / pin) ·
building confirmed · multiple buildings disambiguated · tile fetched / tile fetch failed · manual
calibration used · imagery age shown (age band) · roof-changed answered.

### M04.3 — AI roof detection: confidence, the editable overlay and the doorway

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-14 | **Detection reports honest progress and fails gracefully.** The waiting state names what is actually happening, in the source's own words — *"fetching imagery · detecting roof · estimating shading"* — rather than an unqualified spinner, and each step can fail on its own without taking the survey down with it. A failed step says which step failed and what remains available. | `SRC` — `S4.screen.2` ("Detecting: honest progress — 'fetching imagery · detecting roof · estimating shading'. Fails gracefully"), quoted verbatim; honest-failure law `F8-36`, `F7-43` (loading and error states) | P0 |
| M04-15 | **A detected roof is never applied silently. The result is an editable overlay and the operator must accept, adjust or reject it.** The outline, the obstructions, the pitch and the area arrive as a proposal from a detector, drawn over the pinned tile, and nothing enters the survey until a person acts on it. **A detected roof that is obviously wrong must always be correctable** — every vertex, every obstruction, every value the detector produced is editable, and rejecting the whole result is a first-class choice that leaves the manual outline available. **The corrector set is final (owner ruling 2026-08-04, Q25): anyone who can run the remote survey — rep, surveyor or designer — accepts, adjusts or rejects**, with studio re-verification and provenance labels as the safety net; the homeowner's route is the link's question affordance (`F5-56`), never an edit. | `SRC` — `S4.screen.3` ("the detected roof as an editable overlay — outline, obstructions, pitch, area. **Accept / adjust / reject — never applied silently**"); `S4.wrong.5` ("the customer must always be able to correct it" — confirmed as the operator per owner ruling 2026-08-04, Q25) | P0 |
| M04-16 | **Confidence is shown per detection, beside the thing it qualifies.** Not one score for the survey: the outline, each obstruction and each derived value carry the detector's confidence where they are read, as persistent visible content — never a hover, never colour alone (`F8-07`). A detection whose confidence cannot be established is not presented as a detection. | `SRC` — `S4.screen.3` ("Confidence shown per detection"); `DOC04.survey-provenance` ("remote detection artefacts carry per-detection confidence + source … and prompt version"); rendering law `F8-01`, `F8-07` (consumed) | P0 |
| M04-17 | **An empty result beats an invented roof.** The detector is instructed not to guess, and returning nothing is a correct and expected outcome that leads straight to manual outlining. No surface in this module fills a missing detection with a plausible shape, a default rectangle or an average pitch. | `SRC` — `DOC07.roof-detect-honesty` (docs/engineering/07, quoted verbatim: "no-guessing instructions (empty result beats invented roof)"); `F8-01` (a number whose tier cannot be established is not rendered as a number) | P0 |
| M04-18 | **There are two detection paths and both are held to the same honesty rules: elevation-model plane fitting where elevation data exists, and a vision-model fallback that returns shapes only.** The fallback exists because elevation coverage is thinner than imagery coverage; it produces geometry and nothing else — it never returns a figure the product would present as a measurement. **Every detection records its own provenance: which path produced it, against which pinned tile, and at which detector version.** Both paths are required to be **deterministic and schema-constrained** — a detector returning free-form output, or a different answer each time for the same tile, does not satisfy this requirement — and **both exit through the same artifact validation** (M04-24). | `SRC` — `DOC07.roof-detect-honesty` (docs/engineering/07: "DSM plane-fit primary, vision-model fallback"; deterministic, schema-enforced output, "versioned prompt recorded as provenance"; "both paths exit through artifact validation"); `R5` (the roof-detect photo fallback returns "shapes only") *(shared — the imagery/detection half)*; `DOC04.survey-provenance` ("per-detection confidence + source … + prompt version") · the model, its parameters and the prompt store are implementation (design spec §14/DD4) | P0 |
| M04-19 | **Detection runs against the exact tile the operator is looking at, pixel for pixel.** The overlay a person accepts or adjusts is registered 1:1 with the stored tile of `M04-10` — there is no second image, no re-projection between detecting and reviewing, and no coordinate drift between what was detected and what is drawn. | `SRC` — `DOC07.roof-detect-honesty` ("detection runs against the exact stored tile the canvas shows (1:1 pixel mapping)") | P0 |
| M04-20 | **Where a detected roof barely overlaps the building the operator confirmed, its confidence is floored.** A geometry cross-check compares the detected outline against the confirmed building footprint; a poor overlap lowers the confidence shown rather than being silently accepted, so the review screen tells the operator that this one needs looking at. | `SRC` — `DOC07.roof-detect-honesty` ("geometry cross-check floors confidence where a detected roof barely overlaps the building mask") | P1 |
| M04-21 | **Detection failure is never a hard error, and an unavailable detection capability is hidden gracefully rather than shown broken.** If detection fails, the operator traces the roof manually and the survey continues. If the capability is not configured or not available at all, its entry points are simply not offered — no dead button, no error the operator cannot act on. *"Never a hard error."* | `SRC` — `DOC07.roof-detect-honesty` ("Detection failure → user traces manually; missing key → feature hidden gracefully; 'Never a hard error in the studio'"); `F8-36` | P0 |
| M04-22 | **Manual outlining is always available, always sufficient, and never metered.** Every remote survey can be completed entirely by hand — outline, obstructions, pitch, area — with no detection at all. This is the guarantee that makes every other rule in this section safe: a tenant with no coverage, no allowance or no trust in the detector can still produce a designable roof. | `SRC` — `BM-19` (consumed: "Manual outlining is always available and never metered — a tenant out of bundle can always keep working by hand"); `DOC16.gate.ai-detection` (cited — `modules/M12`: "on deny, detection is blocked but MANUAL outline is always available (it costs nothing)"); `DOC07.google-enhancement-only` | P0 |
| M04-23 | **AI roof detection is a metered capability: allowance is checked before the call, a denial blocks only the detection, and a detection that returns no result never bills.** The meter, its bundles, its overage and the tier entitlements are `04-business-model.md`'s (`BM-16`, `BM-19`) and `modules/M12-platform-billing.md`'s enforcement — this module states no rate, bundle size or price. What it owns is the behaviour at the boundary: the check happens **before** the detector is called, a denial is an honest message naming the allowance and pointing at the manual path, and a run that returns nothing is not counted. | `SRC` — `BM-16` (the five-meter closed list, consumed), `BM-19` (per detection that returns a result; failures never bill); `DOC16.gate.ai-detection` (cited — the server-side check is `modules/M12`'s) *(shared — the M04 half: the survey-side behaviour at the gate)*; honest state copy per `F8-34` | P0 |
| M04-24 | **A detection enters a design only through a validated artifact, and applying it stamps what came from a detector.** The reviewed result is handed to `modules/M05-design-studio.md` as a validated artifact — version, tile pin, geometry, bounds and confidence — with any entity that fails validation **dropped with a stated reason** rather than passed through degraded. Applying it stamps entity provenance so the design can say, in the source's words, *"N AI-detected entities — dimensions are detector estimates."* | `SRC` — `DOC05.ai-doorway` (docs/05, quoted; the same doorway rule is restated in docs/engineering/07 §3) *(shared — this module produces and validates the artifact; the stamping inside the design and the studio's own detection entry point are `modules/M05`'s)`; `F8-01`/`F8-02` (consumed) | P0 |

**Behavior detail.** The review screen is Mode A's decision point and it is built to be argued
with. The overlay sits on the pinned tile at full opacity for the outline and reduced for fill, so
the imagery underneath stays readable; obstructions are individually selectable; pitch, azimuth and
area render as values with their confidence beside them. **Adjust** is direct manipulation —
vertices drag, obstructions move and resize, a value can be typed over — and every operator edit
**re-tiers that value from `derived` to the tier a typed figure carries**, shown at the moment of
the change (`F8-05`); the open question of which tier a typed figure takes is `F8-Q1`'s and this
module follows F8's answer rather than inventing one. **Reject** discards the detection whole and
leaves the operator on the manual outline with nothing lost.

The confidence display of `M04-16` is not decoration: it is what tells a rep which of tomorrow's
five remote surveys deserves a phone call to the customer. Low confidence never blocks acceptance —
the operator is the judge — but a low-confidence detection accepted unchanged is recorded as such,
and the designer sees it (§M04.12).

The detector's own honesty rules (`M04-17`–`M04-20`) exist because a roof detector's failure mode
is confident invention. Determinism and a constrained output shape are what make a result
reviewable; the no-guessing instruction is what makes "no roof found" an acceptable answer; the
geometry cross-check is what stops a detection of the *neighbour's* roof from arriving at full
confidence. None of the three is a model choice — they are product requirements the capability port
must satisfy, whichever service is behind it (`M04-09`).

Shading estimated from above is **partial by construction** and is treated as such: a tall
neighbouring building, a wall or a tree that the imagery does not resolve is not a detector defect,
it is one of the things remote surveys cannot see, and it is stated on screen as a gap (`M04-30`)
rather than left to surprise the designer.

Permissions: `F2.M04.run-remote-survey` (EPC Owner · Sales Manager · Sales Executive · Survey
Engineer). The studio's own in-canvas detection entry point rides `modules/M05`'s rows, not this
one.

**Edge cases & what-goes-wrong.**

- *Roof detected but obviously wrong* (`S4.wrong.5`) → accept / adjust / reject, every element
  editable, rejection always available (M04-15). The corrector is anyone who can run the remote
  survey — rep, surveyor or designer (owner ruling 2026-08-04, Q25; §6 M04-Q2 resolved).
- *A tall neighbouring building is missed* (`S4.wrong.4`) → shading from above is partial by
  construction; the unseen obstruction is a named gap on the gaps list (M04-30) and the designer is
  told the shading input is `derived` and incomplete, not that it is complete.
- *Detection returns nothing* → the correct outcome; manual outlining continues (M04-17, M04-22).
- *Detection returns a roof overlapping the confirmed building barely* → confidence floored and the
  item flagged for review (M04-20).
- *Allowance exhausted* → detection is refused with the allowance named and the manual path offered
  in the same message; nothing about the survey is blocked (M04-22, M04-23).
- *Detection capability unavailable or unconfigured* → its entry points are not offered at all
  (M04-21).

**Acceptance criteria.**

- Given a confirmed building, when detection runs, then the progress state names the step in
  progress and a failure of any step leaves the survey usable (M04-14).
- Given a returned detection, when the review screen renders, then nothing has been written to the
  survey, every element is editable, and accept / adjust / reject are all available (M04-15).
- Given a returned detection, when it renders, then each detected element shows its own confidence
  as persistent visible content, not on hover and not by colour alone (M04-16).
- Given imagery from which no roof can be determined, when detection completes, then no roof is
  produced and the manual outline is offered (M04-17).
- Given an accepted detection, when the survey is read later, then the capability, the pinned tile
  and the detector version that produced it are recorded against it (M04-18).
- Given a detection whose outline barely overlaps the confirmed building, when it renders, then its
  confidence is floored and it is flagged for review (M04-20).
- Given a detection result, when the overlay is drawn on the pinned tile, then it registers pixel
  for pixel against that tile, and an adjustment made on the overlay lands at the same place when
  the survey is reopened or opened by the designer (M04-19).
- Given detection fails, when the operator continues, then no error blocks the survey and manual
  tracing is available; and given the detection capability is not available at all, then its entry
  points are not offered rather than shown broken (M04-21).
- Given an exhausted detection allowance, when detection is attempted, then it is refused with the
  reason named, the manual outline is offered, and no detection is billed (M04-22, M04-23).
- Given a detection that returned no result, when the usage record is read, then no detection was
  counted (M04-23).
- Given a reviewed detection handed to a design, when it is applied, then only validated entities
  arrive, every dropped entity carries a stated reason, and the applied entities are stamped as
  detector-derived (M04-24).

**Localization notes.** The three progress phrases, the confidence label, every refusal and the
accept/adjust/reject verbs are translated per `F3-01`/`F3-06`; the provenance tier tokens are the
fixed English tokens of `F8-02` with translated display (`F3` vocabulary rule); areas and dimensions
render on the reader's unit preference (`F3-23`). Buttons are verbs (`F7-42`). **Analytics events:**
detection requested · detection returned (element count, confidence band) · detection empty ·
detection failed (step) · overlay accepted / adjusted (elements changed) / rejected · manual outline
started · confidence floored by cross-check · detection denied by allowance.

### M04.4 — Coverage failure and the honest fallback

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-25 | **Roof-data coverage is a fact about a location, never a promise the product makes.** Detailed roof data exists for some addresses and not others, and the gaps are real and unevenly distributed within any one market. The product never states or implies coverage it has not established for the address in front of it, never presents a national or market-level coverage claim, and never treats a coverage gap as an error the operator caused. Where coverage is absent, mode rule 3 applies: remote is not possible for that address and physical is required (M04-05). | `SRC` — `R5` (the ruling's stated reason, restated market-neutrally: real roof-data coverage gaps in the launch market make any dependency on that data "a product-breaking bet"; the market fact itself lives in `foundations/F1`) *(shared — the imagery/coverage half; the energy source-of-record half is `modules/M05`'s)*; `DOC07.google-enhancement-only` ("coverage is patchy and that is fine"); `S4.rule.mode-choice` (rule 3) · honest-state law `F8-34` | P0 |
| M04-26 | **Coverage failure has its own screen, and it is not a dead end.** The message is plain and blames nothing: *"No detailed roof data available for this address."* Two ways forward are offered on that screen — **outline the roof manually** (which costs nothing and always works, M04-22) or **book a physical survey** (M04-57's visit). The survey continues from either. | `SRC` — `S4.screen.4` (quoted verbatim, including *"Not a dead end."*); `S4.wrong.2` (no roof-data coverage for the address — the source records that these gaps are real across parts of the launch market) | P0 |
| M04-27 | **A coverage failure never degrades an energy figure.** Energy output has never depended on the roof-data capability: its source of record, its database ladder and its labelled fallback are `foundations/F8`'s (`F8-08`–`F8-10`) and are computed independently of whether roof data existed for this address. A survey that fell back to a manual outline still yields a fully labelled energy figure, and no screen in this module implies otherwise. | `SRC` — `R5` (post-overlay reading: "energy figures never depended on [the roof-data provider] — [source-of-record] ladder + built-in latitude-fit fallback"); `S4.rule.mode-choice` note; `F8-08`–`F8-10` consumed as published requirements | P0 |
| M04-28 | **Every remote-survey fallback is recorded on the survey and travels to the designer.** Which path produced this roof — detected and accepted, detected and adjusted, or outlined by hand after a coverage or detection failure — is part of the survey record, visible on the survey and in the hand-off, because it is the single most useful thing the designer can know about how much to trust the outline. | `SRC` — `DOC04.survey-provenance` (per-field provenance; detection artefacts carry source); `F8-01`/`F8-05` (consumed — provenance travels and a tier change is shown) | P0 |

**Behavior detail.** The coverage-failure screen is written as information, not as an apology or an
error. It states what is not available for this address, offers the two ways forward with equal
weight, and — where the lead is residential and simple — recommends the manual outline first,
because it keeps the ten-minute path (`M04-07`) alive. Where the lead is commercial & industrial,
it recommends booking the visit first, because rule 2 requires the visit before quoting anyway
(`M04-05`).

The reason this failure is designed rather than handled is `R5`'s: the roof-data capability's
coverage is genuinely patchy in the launch market, and a product that treats a coverage gap as an
exception would break for a large share of real addresses. The suite's position is stated once and
holds everywhere: the capability is an **enhancement, never a dependency** (`M04-09`), and every
path it serves has a manual equivalent that costs nothing.

Permissions: `F2.M04.run-remote-survey` for the retry; `F2.M04.schedule-survey-visits` for the
book-a-visit route offered on the same screen.

**Edge cases & what-goes-wrong.**

- *No coverage for the address* (`S4.wrong.2`) → the coverage-failure screen with both routes; not
  a dead end (M04-26).
- *Coverage exists but is thin — imagery only, no roof data* → detection proceeds from imagery under
  §M04.3's honesty rules and its confidence carries the difference (M04-16).
- *Coverage failure on a commercial & industrial lead* → the visit is recommended, and rule 2 is
  stated (M04-05).
- *Operator retries the same address hoping for a different answer* → the retry is allowed and, if
  it calls the detector, is metered like any other run (M04-23); nothing about the address is
  recorded as permanently uncovered.

**Acceptance criteria.**

- Given an address with no detailed roof data, when the survey reaches detection, then the
  coverage-failure message renders verbatim and both the manual-outline and book-a-visit routes are
  offered (M04-26).
- Given a survey completed by manual outline after a coverage failure, when its energy figure is
  produced, then the figure carries its own source label per `F8-08` and is not marked down,
  blocked or qualified by the coverage failure (M04-27).
- Given any completed remote survey, when the designer opens it, then the path that produced the
  roof — detected, adjusted or hand-outlined — is stated (M04-28).
- Given any surface in this module, when it mentions coverage, then it states only what is true for
  the address at hand and makes no market-level coverage claim (M04-25).

**Localization notes.** The coverage-failure line and both route labels are translated per `F3-01`;
the message names no country, provider or market (`F1-04`, the §4 market-neutrality rule).
**Analytics events:** coverage failure shown · route chosen (manual outline / book visit) · retry
after coverage failure · survey completed by fallback path (which path).

### M04.5 — What remote cannot tell you: the gaps list

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-29 | **What a remote survey cannot determine is stated on screen, as a required part of the flow.** Not a help article, not a footnote at proposal time: the remote survey ends on a **"Gaps to fill"** screen listing what it could not establish. The list exists because the honest limits of a remote survey are exactly the facts a rep needs before they promise anything to a customer. | `SRC` — `S4.rule.remote-cannot` ("worth stating on screen"); `S4.screen.5` ("Gaps to fill: what remote could not determine … each with 'ask the customer' or 'capture on site'") | P0 |
| M04-30 | **The list is the source's five, carried whole:** (1) **the meter, the sanctioned load, the main panel and whether it has room**; (2) **roof condition, age, waterproofing, structural doubts**; (3) **access — stairs, lift, crane, lane width for a truck**; (4) **shading from anything not visible from above** — *"a neighbour's wall, a tree at ground level"*; (5) **whether the customer actually owns that roof**. No remote survey is complete without this list being presented, and no item may be dropped from it because a detector produced *something* nearby. | `SRC` — `S4.rule.remote-cannot` (all five, verbatim); `S4.wrong.4` (item 4 is the failure "a tall neighbouring building is missed" stated as a standing limit rather than a bug) | P0 |
| M04-31 | **Every gap is a first-class record with exactly four resolutions: ask the customer · capture on site · resolved · waived.** A gap is not a checkbox and not a note — it has a state, an owner and a history. Resolving one records what was established and by whom; waiving one records who waived it and why. Open gaps are visible on the survey, on the lead and in the hand-off to the designer until they are closed. | `SRC` — `DOC04.survey-gaps` (docs/04, verbatim: "each gap resolves as ask_customer / capture_on_site / resolved / waived") · audit obligation per `F2-22` | P0 |
| M04-32 | **Booking a physical visit pulls the open capture-on-site gaps into that visit's guided flow.** The gaps a remote survey could not close become the visit's agenda: the guided capture opens with those steps present and marked as the reason the visit exists, so the surveyor cannot arrive without knowing what the desk could not answer. | `SRC` — `DOC04.survey-gaps` (verbatim: "Physical-visit booking pulls the open capture_on_site set into the guided flow"); `DOC04.visits` (booking a visit for open on-site gaps schedules here) | P0 |
| M04-33 | **A proposal built while gaps are open says so where the gaps matter, and never presents a remote survey as a complete site picture.** The open-gap count travels with the survey into the design and the proposal; the document's own honesty line is `F8-22`'s and is not duplicated or softened here. Nothing in this module blocks a proposal because gaps are open — the source's whole point is that remote data is sellable — but nothing in it lets the gaps disappear either. | `SRC` — `S4.rule.honesty` ("legitimate and sellable — it just must not claim to be a site survey") *(shared — the document line and its rendering are `foundations/F8`'s `F8-22`; the proposal surface is `modules/M06`'s)*; `S4.screen.5` | P0 |

**Behavior detail.** Each of the five gaps renders as a plain sentence a rep can read aloud to a
customer, paired with the two actions the source names: **ask the customer** (which composes the
question and puts it on the transactional lane like every other message this module produces —
where the tenant has a connected channel it sends from that channel under the transactional
template class with honest delivery states, and where none is connected it is composed ready to
paste for the rep to send themselves on their next call, that fallback alone claiming no delivery;
owner ruling 2026-08-04, Q33, via `M02-47`) and **capture on site** (which adds it to a visit).
Two further resolutions close a gap without a visit: **resolved**, where the answer was obtained
and recorded — the customer confirmed the sanctioned load from their bill, the customer sent a
photograph of the meter — and **waived**, where the operator judges the gap not to apply, with a
reason recorded and the waiver visible to the designer. A waived gap is never silently equivalent
to an answered one.
*(The ask-the-customer clause above is reconciled to owner ruling 2026-08-04 Q33; it previously
read "the product composes, a person sends, `D32` via `M02-47`" — `D32`'s retired manual-only
rule, cited to a row that now states the opposite (`M02-47`), and contradicting this document's
own §5 non-goal on survey-side send machinery. See `docs/prd/registers/conflicts.md` row 4.)*

Gap 5 — *whether the customer actually owns that roof* — deserves its own note because it is the
one that voids a whole deal rather than degrading a design: it maps directly onto the lead's own
roof-ownership qualification answer (`M02-39`), and where that answer already exists the gap is
pre-resolved from it rather than asked twice.

Permissions: `F2.M04.resolve-survey-gaps` for resolving and waiving; `F2.M04.schedule-survey-visits`
for the capture-on-site route.

**Edge cases & what-goes-wrong.**

- *A tall neighbouring building is missed by the detector* (`S4.wrong.4`) → gap 4 is on the list by
  construction, in every remote survey, whether or not the detector saw anything (M04-30).
- *The rep wants to skip the gaps screen* → it is part of the flow, not a modal to dismiss; gaps may
  all be waived with reasons, but they are shown (M04-29, M04-31).
- *A gap is waived and later proves to matter* → the waiver, its author and its reason are on the
  record, and the physical visit that follows creates a new survey version rather than editing the
  waived one (M04-57).
- *The customer answers a gap over the phone* → resolved with what was established recorded; no
  photograph is invented to support it.
- *A proposal is generated with open gaps* → allowed; the gaps travel and the document carries
  `F8-22`'s line (M04-33).

**Acceptance criteria.**

- Given a completed remote detection, when the flow continues, then the gaps screen renders with all
  five items present (M04-29, M04-30).
- Given any gap, when it is acted on, then it takes exactly one of the four resolutions and its
  resolution, actor and reason (where waived) are recorded (M04-31).
- Given open capture-on-site gaps, when a physical visit is booked, then that visit's guided capture
  opens with those steps present and identified as the reason for the visit (M04-32).
- Given a survey with open gaps, when the designer opens it, then the open gaps are listed with
  their states (M04-33, M04-63).

**Localization notes.** All five gap sentences, the four resolution labels and every composed
customer question are translated per `F3-01`/`F3-06`; the composed question renders in the
customer's language where the lead records one (`F3-06` — language follows the reader). No gap sentence names a market's utility,
tariff or statutory term — the meter and sanctioned-load wording is market-neutral and the utility
directory a site selects from is pack data (`F1-53`). **Analytics events:** gaps screen shown · gap
resolution chosen (gap, resolution) · gap waived (reason present) · visit booked from a gap ·
proposal generated with open gaps (count).

### M04.6 — The honesty consequence: derived vs measured

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-34 | **Every survey stamps the provenance of what it captured, by mode: remote = `derived`, physical = `measured`.** The tiers are `foundations/F8`'s four and this module invents none of them (`F8-02`, `F8-03`). The stamp is not decorative: it is what the design, the bill of materials, the proposal and the customer link all read when they state how firm a figure is. | `SRC` — `S4.rule.honesty` ("remote data is **derived from satellite imagery**; physical is **measured on site**"); `D30` (the labels); `R18` via `F8-02` (the tier definitions, consumed) | P0 |
| M04-35 | **Provenance is per field, not per survey.** A physical survey containing an estimated obstruction height carries `estimated` on that height even though the survey is a measured one; a remote survey whose pitch the operator typed over carries that field's own tier. Each capture group's fields carry their own tier and their own **skipped-but-flagged** marker where the surveyor moved past them. | `SRC` — `DOC04.survey-provenance` (docs/04, verbatim: captured sections "carry per-field skipped-but-flagged markers and per-field provenance") | P0 |
| M04-36 | **A proposal built on a remote survey is legitimate and sellable — it just must not claim to be a site survey.** This module produces the fact the claim rests on (the survey's mode and its per-field tiers) and hands it on; the fixed customer-facing line — *"Roof measured from satellite imagery. A site visit will confirm dimensions, shading and electrical access."* — is `foundations/F8`'s (`F8-22`), stated once there and rendered by the document and the customer link. No surface in this module restates, rewords or suppresses it. | `SRC` — `S4.rule.honesty` (quoted) *(shared — the document-disclosure half is `F8-22`, already published; the survey modes, the gaps list and the capture behaviour are this module's)* | P0 |
| M04-37 | **When a physical visit upgrades a remotely surveyed site, the change of provenance is shown before it commits, and both versions survive.** Moving a site from `derived` to `measured` is exactly the tier change `F8-05` requires the product to state rather than perform silently: what changed, which figures move, and what is affected downstream. The earlier version is never overwritten (M04-57). | `SRC` — `F8-05` (consumed, verbatim example: "a survey moves from remote to on-site"); `S4.rule.honesty`; `F4-14` (versioned-append, consumed) | P0 |

**Behavior detail.** The honesty consequence is what makes Mode A defensible rather than merely
fast, and the source states its logic plainly: the same rule that governs a proposal built without
a design applies **one layer earlier**, at the survey. Remote is not a lesser survey pretending to
be a real one; it is a different, clearly labelled kind of knowledge that is enough to design and
quote with and not enough to install from.

Two consequences fall out of that. First, this module never softens the label to make a proposal
look stronger — the labels are structural and are read by the modules downstream, not authored by
them. Second, the module never *over*-labels either: a physical survey's dimensions are `measured`
and are not qualified into vagueness because someone was cautious. Both directions of dishonesty
cost the same trust.

`F8-25`'s law applies to everything the structural group captures: the product never computes,
states, implies or scores structural adequacy, at any scale. What a surveyor records about cracks,
roof age and waterproofing is an **observation** with photographs attached, and the product's own
words for it are the source's: *"observations only, never a verdict."*

Permissions: no additional grant — provenance stamping is a property of capture, not an action.

**Edge cases & what-goes-wrong.**

- *A remote figure typed over by the operator* → that field leaves `derived` and takes the tier
  `foundations/F8` assigns a typed figure, with the change shown (`F8-05`, `F8-Q1`).
- *A physical survey where a height was estimated by eye* → that field is `estimated`, and the
  survey is still a measured one (M04-35).
- *A surveyor skips a step* → the field is marked skipped-but-flagged, not defaulted, not blank
  (M04-35, M04-50).
- *A site with both a remote and a physical survey* → both versions exist; the current survey is the
  later one and the provenance change was shown when it landed (M04-37).
- *A proposal already sent on remote data when the visit later contradicts it* → the sent document's
  figures never move (`F8-15`, consumed); the new version drives the next document, and the
  difference is visible rather than retro-fitted.

**Acceptance criteria.**

- Given a completed remote survey, when its figures are read anywhere in the product, then they
  carry `derived`; and given a completed physical survey, then they carry `measured` (M04-34).
- Given a physical survey containing an estimated height, when that field is read, then it carries
  `estimated` while the survey's other captured dimensions carry `measured` (M04-35).
- Given a proposal built on a remote survey, when it renders, then `F8-22`'s line is present and
  unaltered, and nothing in the proposal describes the remote survey as a site survey (M04-36).
- Given a site with a remote survey, when a physical survey is submitted for it, then the provenance
  change is stated before it commits and the earlier version remains readable (M04-37).
- Given any structural observation, when it is read on any surface, then it is presented as an
  observation with its photographs and no adequacy verdict, score or implication appears (`F8-25`).

**Localization notes.** Tier tokens keep the fixed identity of `F8-02` and take a translated display
(`F3-12`); `F8-22`'s line is translated once, in F8, and rendered from there — never re-authored,
re-worded or re-translated here (`F3-07`, `F3-11`). **Analytics events:** survey provenance stamped (mode) · field tier changed (field, from, to)
· provenance-change notice shown / confirmed · structural observation recorded.

### M04.7 — Mode B: the surveyor's day

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-38 | **The Survey Engineer's home screen is today's visits.** Each row carries address, customer, time and distance, with **one-tap navigation** and **one-tap call**. It is the front door of the surveyor's day. | `SRC` — `S4.screen.6` ("My visits today: the surveyor's home screen. Address, customer, time, distance, one-tap navigation and one-tap call"); `PS-13` (consumed — the role home) *(shared — the role-home composition itself is `modules/M13-dashboards-and-reporting.md`'s)* | P0 |

*Rows removed 2026-08-07 by owner decision: the offline/sync capability was deleted (`M04-39`,
`M04-40`, `M04-41`).*

**Behavior detail.** The visits home is deliberately the smallest screen in the module: a person is
looking at it in a vehicle or a stairwell, so it carries what gets them to the right roof and
nothing else. Distance is shown from the device's current position where it is available and omitted
rather than guessed where it is not. Navigation and call hand off to the device's own applications
— the product does not embed a map or a dialler for this.

Permissions: `F2.M04.capture-surveys`.

**Edge cases & what-goes-wrong.**

- *The tenant's billing has lapsed* → capture is never held hostage to billing state, and
  photographs already held on the device still upload (M04-55).

**Acceptance criteria.**

- Given a Survey Engineer signing in, when the app opens, then today's visits are the landing
  surface with address, customer, time, distance, one-tap navigation and one-tap call (M04-38).

**Localization notes.** Visit rows are translated per `F3-01`;
distances render on the reader's unit preference (`F3-23`) and times on the tenant's timezone
(`F3-22`). **Analytics events:** visits home opened ·
navigation tapped · call tapped.

### M04.8 — Guided capture: the five groups

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-42 | **Physical capture is a guided, step-by-step flow through the capture groups, with a progress bar, and every step is skippable but flagged.** The flow tells the surveyor where they are and what remains; nothing is mandatory in a way that traps a person on a roof; and nothing skipped is ever silently absent — a skipped step is **flagged** on the record and surfaced at review (M04-49) and to the designer (M04-63). | `SRC` — `S4.screen.7` ("Guided capture: step-by-step through the capture groups. Progress bar. Each step skippable but flagged") | P0 |
| M04-43 | **The capture groups are the source's five, carried whole.** **Roof** — photographs from each corner, an overall shot, roof type, approximate dimensions. **Electrical** — meter photograph with the reading and sanctioned load visible, main panel / distribution board photograph, existing load. **Shading** — photographs of anything tall nearby, with rough heights (the source's examples, rendered market-neutrally: water tanks, roof stair-head structures, trees, adjacent buildings). **Access** — how material gets to the roof: stairs, lift, crane needed, narrow lane. **Structural notes** — visible cracks, roof age, existing waterproofing, *"observations only, never a verdict."* No group may be dropped and no group's meaning may be narrowed by a surface. | `SRC` — `S4.rule.capture` (all five groups and their contents, verbatim — with one rendering change stated rather than silent: the shading group's roof stair-head example is the source's market-specific term *mumty*, carried here as the market-neutral "roof stair-head structure" per the design spec §6 market-neutrality rule, meaning unchanged); structural half bound by `F8-25` (never a computed verdict) | P0 |
| M04-44 | **Access constraints are captured as constraints and reach the designer before design begins.** Where the roof cannot be reached at all — no stairs, a locked terrace, a lane too narrow for a truck, a crane needed — that is recorded as an access constraint on the survey rather than as a failed visit, and it is one of the first things the hand-off shows, because it changes what can be designed and how it will be installed. | `SRC` — `S4.wrong.10` ("Roof not accessible (no stairs, locked terrace) → captured as an access constraint; designer sees it before designing"); `S4.rule.capture` (the Access group) | P0 |
| M04-45 | **The sanctioned load is captured per site from the meter, and it is the input the design's overrun warning reads.** Design overrun against sanctioned load is a real approval blocker, so the figure is captured deliberately — from the meter photograph, with the value entered by a person (never read off the photograph by the product, M04-53) — and carried to the design as a **soft cap**: it warns, it does not silently clamp. | `SRC` — `DOC04.sanctioned-load` (docs/04: captured per site; "design overrun = real approval blocker"; the sanctioned-load warning is fed from survey capture); soft-cap behaviour is `modules/M05`'s (`DOC05.auto-design-soft-cap`, cited) | P0 |
| M04-46 | **Shading capture is a photograph plus a person's estimate, placed on a simple roof sketch.** Add an obstruction, photograph it, estimate its height, and tap to place it on a simple sketch of the roof. The height is **entered or estimated by a person** in every case (`D35`); nothing derives it from the photograph. | `SRC` — `S4.screen.8` ("Shading capture: add an obstruction, photograph it, estimate height. Tap-to-add on a simple roof sketch"); `S4.notv1.1` / `D35` (no derivation from photographs) | P0 |
| M04-47 | **Storage pressure is warned about before capture starts, not discovered mid-roof.** Where device storage is low, the surveyor is told **before** the capture begins and offered compression; the warning names what is happening and what will help. Nothing already captured is evicted to make room. | `SRC` — `S4.wrong.7` ("Phone storage full → warn before capture starts, offer to compress") | P0 |
| M04-48 | **A survey interrupted by a dead battery or a killed application is restored exactly as it was, with nothing lost.** Capture is a running draft on the device, not a form submitted at the end: reopening returns the surveyor to the step they were on with every field, note and photograph intact. *"Nothing lost."* | `SRC` — `S4.wrong.8` ("Battery dies mid-survey → draft is restored on reopen, nothing lost"); `F4-21` ("nothing a field user captured is ever unrecoverable") | P0 |

**Behavior detail.** The flow is one step per screen with the progress bar always visible, and the
step order follows the way a person actually moves through a site: roof first (they are standing on
it), then shading (they are looking around from it), then electrical (they come back down to the
meter), then access (they are leaving), then structural notes (what they noticed throughout). The
order is a default and steps are reachable directly, because real visits do not run in a straight
line.

**The camera opens inline and never bounces to the operating system's camera application.** This is
a stated source requirement and it is a workflow one, not a polish one: a surveyor who is thrown out
to another application loses their place, loses the capture context, and comes back to a screen that
has to be rebuilt. Inline capture keeps the step, the tag and the obstruction the photograph belongs
to attached from the moment the shutter fires.

Each field carries its own provenance and its own skipped-but-flagged marker (`M04-35`). Dimensions
are entered by a person and render on the reader's unit preference while procurement figures stay
metric (`F3-23`). The structural group's inputs are deliberately shaped as observations —
photographs plus what the surveyor saw — with no scoring control, no adequacy toggle and no
"structurally sound / unsound" choice anywhere in it (`F8-25`).

Permissions: `F2.M04.capture-surveys` (EPC Owner · Sales Manager · Sales Executive · Survey
Engineer) — one flow for every holder (`M04-06`).

**Edge cases & what-goes-wrong.**

- *Roof not accessible* (`S4.wrong.10`) → recorded as an access constraint, visible to the designer
  before designing (M04-44); the visit is not a failure.
- *Phone storage full* (`S4.wrong.7`) → warned before capture starts, compression offered, nothing
  captured is evicted (M04-47).
- *Battery dies mid-survey* (`S4.wrong.8`) → the draft is restored on reopen with nothing lost
  (M04-48).
- *A step genuinely does not apply* → skip it; it is flagged, not silently blank, and the review
  screen states it (M04-42, M04-49).
- *The meter is inside a locked room* → the electrical step is skipped-and-flagged and the
  sanctioned load becomes an open gap on the survey (M04-31), not a zero.
- *A surveyor mis-taps and adds an obstruction twice* → obstructions are individually removable
  before submit; the sketch is an editor, not a log.

**Acceptance criteria.**

- Given a physical survey, when the guided flow runs, then all five groups are present, progress is
  shown, every step can be skipped, and every skipped step is flagged on the record (M04-42,
  M04-43).
- Given any capture step requiring a photograph, when the camera is opened, then it opens inline and
  the application is not left (M04-43 behavior detail).
- Given an inaccessible roof, when it is recorded, then an access constraint exists on the survey
  and appears in the designer's hand-off (M04-44).
- Given a meter photograph, when the sanctioned load is recorded, then the value was entered by a
  person and is carried to the design as a warning input rather than a clamp (M04-45).
- Given an obstruction, when it is added, then it carries a photograph, a person-entered height and
  a position on the roof sketch, and no height is derived from the photograph (M04-46).
- Given low device storage, when a capture is about to start, then the surveyor is warned first and
  offered compression, and no unacknowledged original is evicted (M04-47).
- Given a survey in progress, when the application is killed or the device dies, then reopening
  restores the same step with every field, note and photograph intact (M04-48).

**Localization notes.** Every group name, field label, skip flag, storage warning and observation
prompt is translated per `F3-01`/`F3-06`; dimensions and heights render on the reader's unit
preference with procurement metric (`F3-23`); the sanctioned-load field is market-neutral, and the
utility whose meter it is comes from the site record's pack-supplied directory (`F1-53`).
**Analytics events:** capture step entered / completed / skipped (step, flagged) · inline camera
opened · photographs per group · obstruction added (with height) · sanctioned load captured ·
storage warning shown / compression accepted · draft restored after interruption.

### M04.9 — Review & submit: the review screen is the star

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-49 | **The review screen states three things before submit: what is captured, what is missing, and what is flagged.** It is the last screen of every physical survey and it is not a summary — it is the product's one chance to stop a second trip. Missing items are listed by name, skipped-and-flagged steps are listed as such, and both are reachable in one tap from the review screen itself. | `SRC` — `S4.screen.9` ("Review & submit: what is captured, what is missing, what is flagged. Submit hands off to the designer") | P0 |
| M04-50 | **A missing item is explained by its consequence, in plain language — not by a validation message.** The source's own example is the requirement's shape: *"meter photo missing — the designer cannot size the system without it."* Every missing-item line says what the absence will cost, because *"the surveyor's mistake is not laziness, it is forgetting one item that costs a second trip"* and *"a review screen that says [this] in plain language prevents more rework than any amount of validation."* | `SRC` — `S4.rec.1` (quoted verbatim — the source's own recommendation, carried as a requirement); `S4.wrong.12` ("Surveyor forgets the meter photo → review screen flags it before submit"); voice rules `F7-42` | P0 |
| M04-51 | **Nothing is blocked at submit. A survey submitted with gaps is submitted — and the designer sees the gap explicitly.** The review screen warns; it does not gate. Where a survey is submitted with items missing or flagged, those items travel to the designer as named absences rather than as blanks, and they appear in the hand-off (M04-63). | `SRC` — `S4.wrong.12` ("if submitted anyway, the designer sees the gap explicitly"); `S4.screen.7` (skippable but flagged); `F4-27` (consumed — no primary action disabled; a warning informs, it does not gate) | P0 |
| M04-52 | **Submitting hands the survey to the designer and tells them.** Submit moves the survey to its submitted state and notifies the design side that a survey is ready, with the survey, its photographs, its flagged items and its open gaps attached. The notification type registers with `foundations/F6-notifications-and-search.md`; the hand-off content is §M04.12's. | `SRC` — `DOC04.survey-versioned` (docs/04: "submit notifies the designer"); `S4.screen.9` ("Submit hands off to the designer"); `S4.happy` | P0 |

**Behavior detail.** The review screen is the module's most important screen and it is designed
against a specific human failure: not carelessness, but the single forgotten item discovered a day
later by someone else. So it reads like a colleague rather than a form validator — items grouped as
*captured*, *missing* and *flagged*, each missing item written as a consequence, each one tappable
straight back to the step that fills it. The submit action stays enabled throughout (`F4-27`,
`F7-42`): a surveyor who genuinely cannot get the meter photograph today must be able to submit what
they have, with the absence stated, rather than be trapped between a locked button and a locked
door.

**The happy path**, carried whole from the source: *open My Visits → navigate → capture through the
guided steps → review → submit → the designer is notified.* Mode A defines no separate happy path in
the source and none is invented here.

Permissions: `F2.M04.capture-surveys`.

**Edge cases & what-goes-wrong.**

- *The surveyor forgot the meter photograph* (`S4.wrong.12`) → the review screen names it with its
  consequence before submit; if submitted anyway, the designer sees it explicitly (M04-50, M04-51).
- *Everything is captured* → the review screen still renders, briefly and positively; it is not
  skipped when there is nothing wrong.
- *A second submit of the same survey* → idempotent; a retried submission never produces a second
  record (`F4-07`).
- *An item filled from the review screen* → returns to review at the same place with the item now
  captured.

**Acceptance criteria.**

- Given a completed capture, when review renders, then captured, missing and flagged items are each
  listed and every missing or flagged item is one tap from the step that fills it (M04-49).
- Given a missing meter photograph, when review renders, then the line states the consequence in
  plain language rather than a validation error (M04-50).
- Given missing items, when submit is used, then the submission succeeds and the missing items
  travel to the designer as named absences (M04-51).
- Given a submitted survey, when the submission is applied, then the survey is in its submitted
  state and the design side is notified with the survey, its photographs, its flagged items and its
  open gaps (M04-52).
- Given a submission retried after a failed request, when it is applied, then the designer is
  notified exactly once (M04-52, `F4-07`).

**Localization notes.** Every consequence line, group heading and state label is translated per
`F3-01`; each consequence line is a whole sentence in the catalog rather than assembled from
fragments, and mixed-script lines are expected rather than exceptional (`F3-09`). **Analytics events:** review screen shown (missing count, flagged count)
· missing item tapped from review · submitted with gaps (which) · submit-to-notify latency (applied)
· second-trip rate (missing item later captured on a revisit).

### M04.10 — Photographs: reference, never measurement

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-53 | **Photographs are reference for the designer, never measurement — from any source, including a drone.** The survey captures and attaches photographs of the roof, its obstructions and everything around the building, however they were taken: **by phone on site, sent by the customer, or uploaded from a drone or another camera**. Every one of them travels with the survey to the designer, who uses them while building the design. **The product does not derive numbers from them** — *"the app just does not measure from them."* Every dimension and every height is entered or estimated by a person. | `SRC` — `D35` (docs/15: HONORED — "no LiDAR/AR/auto-measure; drone-as-imagery ok"); `S4.notv1.1` (quoted verbatim); `DOC00.nongoal-measurement` (Task 3's disposition — this module is its named home, §5) | P0 |
| M04-54 | **Every photograph is tagged, carries its source, and can be pinned to what it shows.** Tags are the source's set — **roof corner · obstruction · meter · distribution board · structure · access · other** — and each photograph records whether it was taken **on site**, **sent by the customer**, or **uploaded from a drone or other camera**. A photograph may be pinned to a specific obstruction so the designer knows which shadow it belongs to. | `SRC` — `DOC04.photos-reference` (docs/04, verbatim: the tag set, the source set `on_site / customer_sent / drone`, pinning to an obstruction, "travel to the designer attached to the survey") | P0 |
| M04-55 | **Capture is unconditional; upload is deliberate — and this is the product's one and only device-held queue.** A photograph is written to the device the moment it is taken, with no delay, and uploads when the connection returns — resumably, defaulting to Wi-Fi-or-charging, with a per-batch "upload now" available. A photograph is never blocked, never degraded to fit a network, and never lost because an upload failed. The queue is **one queue, one direction, no conflicts and no merge**, it holds photographs and nothing else, and its status is shown **on the capture screen (`SCR-M04-07`) and nowhere else** — no global indicator, no separate centre, no per-record marker anywhere else in the product. The device storage cap and its eviction order are this row's: acknowledged originals are evicted first and an unacknowledged original is never evicted. | `SRC` — `S4.rule.offline` (the capture half); owner decision 2026-08-07 (the photograph carve-out and its single status surface) | P0 |
| M04-56 | **Photographs travel with the survey version they were captured in.** A revisit's photographs belong to the new version; the earlier version keeps its own (M04-57). A photograph is never moved between versions to make a later survey look complete. | `SRC` — `DOC04.survey-versioned` (versioned-append); `F4-14` (consumed) | P0 |

**Behavior detail.** The distinction this section exists to hold is narrow and important:
photographs are **in scope, richly** — capture them, tag them, pin them, hand them over, let the
customer send them, let a drone take them — and **measurement from them is out of scope entirely**.
The refinement is the source's own: drone-as-imagery is fine, drone-as-automatic-measurement is not.
Nothing in the product infers a dimension, a height, an area or a pitch from a photograph, and no
surface presents a photograph as evidence of a number.

Customer-sent photographs arrive through the paths the product already has — the rep attaches what
the customer sent them — and carry the `customer sent` source so the designer weighs them
accordingly. A drone or other-camera upload is a file attached to the survey with the `drone` source
and the same tag set.

Permissions: `F2.M04.capture-surveys` for attaching photographs to a survey in either mode.

**Edge cases & what-goes-wrong.**

- *A customer sends a photograph of the meter instead of the surveyor taking one* → attached, tagged
  `meter`, sourced `customer sent`; it can close the electrical gap (M04-31) and the source is
  visible to the designer.
- *A drone survey exists from another vendor* → its images attach as reference; no number is taken
  from them (M04-53, §5).
- *An untagged photograph* → tagging is part of capture; a photograph attached from a file picker
  prompts for its tag and source before it is saved.
- *Upload fails repeatedly* → it surfaces on the capture screen (`SCR-M04-07`) with
  retry-or-discard; the local original is never pruned before the server confirms it (M04-55).
- *Device storage cap reached* → acknowledged originals are evicted first, nothing unacknowledged,
  ever (M04-55).

**Acceptance criteria.**

- Given a photograph from any source, when it is read anywhere in the product, then it is presented
  as reference and no dimension, height, area or pitch anywhere is attributed to it (M04-53).
- Given any photograph, when it is attached, then it carries a tag and a source, and where it
  concerns an obstruction it can be pinned to that obstruction (M04-54).
- Given photographs taken while the connection is down, then each is stored on the device
  immediately and uploads resumably when the connection returns, without user action, with the
  queue's status shown on the capture screen and on no other surface (M04-55).
- Given a revisit, when its photographs are captured, then they belong to the new survey version and
  the earlier version's photographs are unchanged (M04-56).

**Localization notes.** Tag and source labels are translated per `F3-01`; the tag vocabulary itself
is a closed value set with a fixed identity and a translated display (`F3-12`). **Analytics events:** photograph captured (tag,
source, group) · photograph attached from file (source) · photograph pinned to obstruction · upload
queued / completed / failed · customer-sent photograph attached.

### M04.11 — Visits, versions and the survey record

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-57 | **Surveys are versioned-append: a revisit inserts a new version and nothing is overwritten.** A return visit to a site creates a **new survey version**; earlier versions are immutable and remain readable forever, and the person on the roof is told what just happened in one line — *"v2 — v1 kept"* (`F4-25`). The first survey is evidence of what the site looked like on that day and no later visit may erase it. The survey's own states are **draft → in progress → submitted → superseded**. | `SRC` — `DOC04.survey-versioned` (docs/04, verbatim: "a revisit inserts a new version row; nothing mutates"; the four statuses); `S4.wrong.13` ("Two surveys of the same site (revisit) → versioned, not overwritten"); `F4-14`, `F4-25` (consumed) | P0 |
| M04-58 | **A visit that cannot be completed ends with a reason, a reschedule and exactly one message — sent through the tenant's connected transactional channel where one exists (owner ruling 2026-08-04, Q33).** Where the customer is not home or the gate is locked, the surveyor records **"Could not complete"** with a reason, which opens the reschedule flow. The customer gets **one** message about it: with a connected channel it sends automatically under the transactional template class — the source's *"customer gets one"* wording is now delivered literally — and with no channel connected the product composes it ready to paste, a person sends it, and no delivery is claimed (`M02-47`/`M02-48`'s rule). `registers/conflicts.md` row 4 carries the resolution note. | `SRC` — `S4.wrong.9` (verbatim: "'Could not complete' with a reason → auto-reschedule flow → 'customer gets one WhatsApp'"); send rail per owner ruling 2026-08-04 (Q33), superseding the D32 composed-not-sent reading; `M02-47`, `M02-48` (consumed — one reminder not five) | P0 |
| M04-59 | **A wrong address is corrected on the spot, and the correction updates the site record.** A surveyor who arrives at the wrong address fixes it there and then, from the visit; the corrected address propagates to the site record so the next visit, the next design and the next document all use it. | `SRC` — `S4.wrong.11` ("Wrong address → correct it on the spot; it updates the site record"); the remote-side half is M04-12 | P0 |
| M04-60 | **A visit is a scheduled assignment with its own states — scheduled · in progress · done · cancelled — linked to the survey version it produces.** Booking a visit for open capture-on-site gaps schedules one (M04-32); booking one from a lead is `modules/M02`'s act (`M02-46`) and produces this object. A visit's status only moves forward (`F4-17`). | `SRC` — `DOC04.visits` (docs/04, verbatim: the four states; "linked to the survey version they produce"); `F4-17` (consumed); `M02-46` (the booking act) | P0 |
| M04-61 | **The survey and its visits are readable by everyone whose scope contains the lead or site, and by nobody else.** Survey visibility follows the lead or site the survey belongs to (`F2.M02.lead-visibility`, `F2-12`–`F2-14`); this module creates no separate visibility domain and no per-person exception (`F2-15`). | `SRC` — `D20` via `F2-12` (consumed); `F2-14` (per-domain resolution); `F2-15` (no exceptions) | P0 |
| M04-62 | **Every consequential act on a survey is attributable: who captured it, who submitted it, who waived a gap, who cancelled or rescheduled a visit, and when.** Capture time is preserved and shown because it is what a field user means by "when" — and it orders nothing: conflicts resolve by server apply order, never by device clocks (`F4-19`). | `SRC` — `F4-19` (consumed, verbatim: capture time "is preserved for display and audit only"); `F2-22` (the audit log's covered-events law, consumed) | P0 |

**Behavior detail.** Versioning is the module's answer to the question a surveyor actually worries
about — *have I just overwritten what I did last month?* — and the answer is visible at the moment
of the revisit rather than documented somewhere. Opening a site that already has a survey offers
**revisit** rather than **edit**; choosing it creates the new version, shows the version-kept notice
(`F4-25`), and pre-fills nothing that would launder an old observation into a new record. Prior
versions are reachable from the current one, in full, with their photographs.

A survey in `draft` belongs to its author on their device. `In progress` is a capture underway.
`Submitted` is the state that notifies the designer. `Superseded` is what a version becomes when a
newer one is submitted for the same site — it is never deleted and its documents keep referring to
it.

The could-not-complete flow is written for the doorstep: three taps, a reason from a short list, and
the reschedule offered immediately, with the one customer message riding the transactional lane —
sent from the tenant's connected channel where one exists, composed ready to paste where none is
connected (M04-58, owner ruling 2026-08-04 Q33). The visit becomes `cancelled` or is rescheduled,
and the lead's timeline records it (`M02-35`) so the rep sees why nothing happened without having
to ask. *(The send half of this paragraph previously read "with the composed message ready",
`D32`'s retired manual-only rule; reconciled to M04-58's own row — see
`docs/prd/registers/conflicts.md` row 4.)*

Permissions: `F2.M04.schedule-survey-visits` for scheduling, reassignment and cancellation — held by
EPC Owner, Sales Manager and Sales Executive, and by the Survey Engineer **for their own assigned
visits**, which is what the could-not-complete reschedule requires. `F2.M04.capture-surveys` for the
survey itself.

**Edge cases & what-goes-wrong.**

- *Two surveys of the same site* (`S4.wrong.13`) → versioned, not overwritten, with the version-kept
  notice shown (M04-57).
- *Customer not home / gate locked* (`S4.wrong.9`) → "Could not complete" with a reason, reschedule,
  exactly one message — sent via the connected transactional channel, or composed for a person to
  send where none is connected (M04-58, Q33 ruling).
- *Wrong address* (`S4.wrong.11`) → corrected on the spot; the site record updates (M04-59).
- *Two surveyors capture the same site the same day* → two versions, both kept; neither overwrites
  the other (`F4-14`).
- *A visit is cancelled after the surveyor already captured a partial draft* → the draft survives as
  a draft version; nothing captured is discarded (`F4-21`).
- *A device with a wrong clock* → capture time is shown as captured and orders nothing (M04-62).

**Acceptance criteria.**

- Given a site with a submitted survey, when a revisit is captured and submitted, then a new version
  exists, the earlier version is readable and unchanged, and the version-kept notice was shown
  (M04-57).
- Given a visit that cannot be completed on a tenant with a connected transactional channel, when
  the surveyor records it, then a reason is required, the reschedule flow opens, and exactly one
  message sends from that channel with honest delivery states; and given no connected channel, then
  that one message is composed for a person to send and the product claims no delivery (M04-58,
  owner ruling 2026-08-04 Q33). *(This line previously read "exactly one message is composed for a
  person to send, and no delivery claim is made" on every path — `D32`'s retired manual-only rule;
  it contradicted M04-58's own reconciled row above and this document's §5 non-goal, and is aligned
  here — see `docs/prd/registers/conflicts.md` row 4.)*
- Given a wrong address discovered on site, when it is corrected, then the site record carries the
  corrected address (M04-59).
- Given a visit, when its status changes, then it moves only forward through scheduled → in progress
  → done, or to cancelled, and it names the survey version it produced (M04-60).
- Given a user whose scope does not contain the lead, when they search for its survey, then it is
  not returned (M04-61).
- Given any waiver, submission, cancellation or reschedule, when the record is read, then the actor
  and the time are attributable (M04-62).

**Localization notes.** State names are market-neutral canonical values with a translated display
(`F1-03`, `F3-12`); the version-kept notice is F4's copy (`F4-25`); the composed
could-not-complete message is translated and renders in the customer's language where the lead
records one (`F3-06`). **Analytics events:** survey version created (revisit yes/no) · survey state
change · visit state change · could-not-complete recorded (reason) · reschedule taken · address
corrected on site.

### M04.12 — The survey → design hand-off

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M04-63 | **A submitted survey hands the designer a complete, named brief — not a folder.** The hand-off carries, as one readable thing: the **five capture groups** with every value and its provenance (`M04-35`); every **photograph** with its tag, source and pin (`M04-54`); the **flagged and skipped** items stated as named absences (`M04-51`); the **open gaps** with their states (`M04-31`); the **access constraints** (`M04-44`); the **sanctioned load** (`M04-45`); the **structural observations** as observations (`F8-25`); and, for a remote survey, the **pinned tile**, the **reviewed roof** and the **per-detection confidence and provenance** (`M04-10`, `M04-16`, `M04-18`). | `SRC` — `S4.screen.9` ("Submit hands off to the designer"); `S4.rule.capture` (the groups); `DOC04.photos-reference` ("travel to the designer attached to the survey"); `DOC04.survey-gaps`; `DOC04.survey-provenance` | P0 |
| M04-64 | **The designer receives what the survey knows and what it does not — with equal prominence.** A missing meter photograph, a waived gap, a skipped step, a low-confidence detection accepted unchanged and an inaccessible roof are all first-class content of the hand-off, not omissions the designer must notice. The absence of a fact is a fact. | `SRC` — `S4.wrong.12` ("if submitted anyway, the designer sees the gap explicitly"); `S4.wrong.10` ("designer sees it before designing"); `S4.rec.1` (the second-trip logic, applied to the receiving end); `F8-01` (a number whose tier cannot be established is not rendered as a number) | P0 |
| M04-65 | **Detected geometry crosses into a design only as a validated artifact, and never as raw detector output.** The doorway of `M04-24` is the only route: version → pinned tile → geometry → bounds → confidence, per-entity, with anything failing validation dropped and its reason stated. `modules/M05-design-studio.md` receives that artifact; it does not read a detector. | `SRC` — `DOC05.ai-doorway` (docs/05; restated in docs/engineering/07 §3) *(shared — the artifact's production and validation are this module's; its application and entity stamping inside a design are `modules/M05`'s)* | P0 |
| M04-66 | **A new survey version does not silently rewrite an existing design or a sent document.** When a revisit supersedes the version a design was built from, the design's own freshness comparison surfaces the difference (`F8-13`, `F8-14`) and the provenance change is shown before anything commits (`M04-37`); figures inside an already-sent document never move (`F8-15`). What this module guarantees is that the newer facts are available and visibly newer — not that they are applied behind someone's back. The design-side reconciliation is **ruled (owner ruling 2026-08-04, Q24)**: the design is marked "survey updated — review needed" with the designer notified, draft proposals on it are blocked from sending until review, and sent proposals stay pinned (`M05-13`). | `SRC` — `DOC04.survey-versioned` (superseded state); `F8-13`, `F8-14`, `F8-15`, `F8-05` (consumed as published requirements) · reconciliation per owner ruling 2026-08-04 (Q24) | P0 |

**Behavior detail.** The hand-off is a screen, not a payload: the designer opens the survey and
reads it the way a colleague would brief them — here is the roof, here is what it is made of, here
is what shades it, here is where the meter is and what it says, here is how material gets up there,
here is what I could not check, here is what I was unsure about. Everything in `M04-63` is on that
screen in that order, with the photographs inline against the group they belong to.

The remote survey's hand-off adds the pinned tile and the reviewed roof, and it is explicit about
how the roof came to be: detected and accepted, detected and adjusted, or drawn by hand
(`M04-28`). A designer treating a hand-drawn outline the same as a high-confidence detection is
making a mistake the product could have prevented by saying which one it was.

Permissions: reading a submitted survey follows the lead or site's visibility (`M04-61`); the
Design Engineer's assigned scope is what puts a submitted survey in front of them.

**Edge cases & what-goes-wrong.**

- *The designer opens a survey submitted with gaps* → the gaps are named on the brief with their
  states, not discovered mid-design (M04-64).
- *The designer wants a fact the survey does not hold* → they can raise it as a gap on the survey,
  which routes to ask-the-customer or capture-on-site like any other (M04-31).
- *A revisit lands while a design is in progress* → the newer version is available and visibly
  newer; nothing is rewritten under the designer (M04-66) and the ruled reconciliation applies —
  review-needed marker, designer notified, drafts blocked from sending, sent pinned (owner
  ruling 2026-08-04, Q24).
- *A detection artifact fails validation entirely* → nothing crosses; the designer starts from the
  pinned tile and traces manually (M04-65, M04-11).

**Acceptance criteria.**

- Given a submitted survey, when the designer opens it, then every item of `M04-63`'s list is
  present and attributable (M04-63).
- Given a survey with missing, waived or low-confidence content, when the designer opens it, then
  each is stated as prominently as the captured content (M04-64).
- Given a reviewed detection, when a design is started from it, then only validated entities cross
  and every dropped entity carries a stated reason (M04-65).
- Given a design built from survey version 1, when version 2 is submitted, then nothing in the
  existing design or in any sent document changes automatically and the difference is surfaced
  (M04-66).

**Localization notes.** Every hand-off heading, absence line and provenance label is translated per
`F3-01`; the brief renders in the reader's language regardless of the language it was captured in
(`F3-06`). **Analytics events:** hand-off opened (by role) · time from submit to hand-off opened ·
gaps outstanding at design start · design started from artifact / from manual trace · revisit landed
against an in-progress design.

## 4. Cross-module contracts

**This module provides:**

- **The survey object and its versions** — the two modes, the five capture groups, the four survey
  states and the versioned-append guarantee (§M04.8, §M04.11) — consumed by
  `modules/M05-design-studio.md`, `modules/M06-proposals.md` and `modules/M08-projects.md`.
- **The visit object and its states** — scheduled · in progress · done · cancelled, linked to the
  survey version it produces (`M04-60`) — produced from `modules/M02`'s booking act (`M02-46`) and
  read by `modules/M09-field-workforce.md` for the field-side view of the same day.
- **The survey → design hand-off** (§M04.12) — the captured groups, photographs, flagged absences,
  open gaps, access constraints, sanctioned load, structural observations and, for remote surveys,
  the pinned tile and reviewed roof with per-detection confidence.
- **The validated detection artifact** (`M04-24`, `M04-65`) — the only route by which detected
  geometry enters a design.
- **The pinned imagery tile** (`M04-10`) — the single image a survey, a detection and a design all
  refer to.
- **The sanctioned load** (`M04-45`) — the site figure `modules/M05`'s overrun warning reads.
- **Survey provenance** (`M04-34`, `M04-35`) — remote = `derived`, physical = `measured`, per field,
  which every downstream document's honesty labelling reads through `foundations/F8`.
- **The remote-survey gaps** (`M04-31`) — first-class records with four resolutions, consumed by
  `modules/M02` (ask-the-customer routes onto the lead) and by `modules/M05`/`modules/M06` as
  outstanding-unknowns at design and proposal time.

**This module expects:**

| From | This module expects |
|---|---|
| `foundations/F1-global-market-framework.md` | Units and formats from `pack.formats` (`F1-21`); the tenant timezone for every visit time (`F1-10`); the utility directory a site record selects from (`F1-53`); the market-neutrality rule this document is written under (`F1-04`, F1 §4) |
| `foundations/F2-roles-and-permissions.md` | The twelve presets, this module's rows `F2.M04.*`, the visibility law (`F2-12`–`F2-15`) and the audit obligations (`F2-22`) |
| `foundations/F3-localization.md` | Per-reader language, the unit preference with procurement metric (`F3-23`), and the single date/number implementations (`F3-06`, `F3-19`–`F3-22`) |
| `foundations/F4-data-integrity.md` | The survey versioning policy and its version-kept notice (`F4-14`, `F4-25`), forward-only visit status (`F4-17`), capture-time semantics (`F4-19`), submission idempotency (`F4-07`), the never-unrecoverable guarantee (`F4-21`) and the never-blocking rule (`F4-27`) — referenced, never restated |
| `foundations/F6-notifications-and-search.md` | The notification types this module raises (survey submitted / ready for design; visit rescheduled) |
| `foundations/F7-design-language.md` | The mobile shell and its role-adaptive centre action (`F7-22`), the sheet grammar (`F7-21`), the speed budget (`F7-37`), the voice rules (`F7-42`) and the per-screen Definition of Done (`F7-43`) |
| `foundations/F8-data-honesty.md` | The four provenance tiers (`F8-02`, `F8-03`), per-detection confidence rendering (`F8-01`, `F8-07`), the shown tier change (`F8-05`), the imagery-basis document line (`F8-22`), the never-computed structural law (`F8-25`), honest failure (`F8-36`) and honest state copy (`F8-34`) |
| `04-business-model.md` | The AI-detection meter's definition and the manual-path guarantee (`BM-16`, `BM-19`); no rate, bundle size or price appears in this module |
| `modules/M01-onboarding-and-tenant-config.md` | The site record's fields and the tenant's declared segment; the demo project whose survey is pre-populated per market pack (`M01-27`) |
| `modules/M02-crm-and-leads.md` | The lead and its address, the booking act that creates a visit (`M02-46`), the transactional send rule — connected-channel automatic with copy-paste fallback per the Q33 ruling (`M02-47`, `M02-48`), the qualification answer that pre-resolves the roof-ownership gap (`M02-39`) and the single activity timeline this module writes into (`M02-35`) |
| `modules/M05-design-studio.md` | Application and entity stamping of the detection artifact; the canvas that renders the same pinned tile; the sanctioned-load soft cap; the design-freshness comparison when a survey version supersedes another |
| `modules/M12-platform-billing.md` | The server-side detection allowance check and the usage ledger behind `M04-23` |
| `modules/M13-dashboards-and-reporting.md` | The Survey Engineer's role home into which `M04-38`'s visits list composes |

## 5. Non-goals

- **No measurement from photographs, in any form** (`D35`, `S4.notv1.1`, `DOC00.nongoal-measurement`
  — Task 3's disposition names this document as its home). No LiDAR, no automatic roof measurement
  from photographs, no augmented-reality height estimation. **Every dimension and every height is
  entered or estimated by a person.** The refinement is the source's own and is deliberate:
  **capturing and attaching reference photographs — from a phone, from the customer, or from a
  drone or other camera — is fully in scope** (§M04.10); *deriving numbers* from them is not.
  Drone-as-imagery is fine; drone-as-automatic-measurement is not.
- **No LiDAR or imagery-derived measurement as a competitive answer** (`CG-7`, `CG-matrix.5` —
  skip-deliberately). The reasoning is recorded rather than assumed: high-resolution elevation
  coverage is too thin in the launch market to be honest about, the remote survey already uses
  available elevation data with confidence shown, and a physical-survey fallback exists. The
  capability is not "not built yet" — it is a decision, and the honest alternative is what §M04.3
  and §M04.4 specify.
- **No computed structural verdict, at any scale** (`F8-25`). Structural capture is observations
  plus photographs — *"observations only, never a verdict"* (`S4.rule.capture`). No score, no
  adequacy flag, no "safe / unsafe" control exists anywhere in this module.
- **No silent application of a detection** (`S4.screen.3`). Accept, adjust or reject; there is no
  configuration, tier, role or tenant setting that turns auto-apply on.
- **No dependency on any one imagery or roof-data provider** (`R5`, `DOC07.google-enhancement-only`).
  Every path a provider serves has a manual equivalent that costs nothing and always works
  (`M04-22`). No feature is designed such that a provider's absence removes it.
- **No metered manual work** (`BM-19`). Outlining by hand is never counted, never gated and never
  degraded, at any tier or entitlement state.
- **No device-held queue but the photograph queue** (`M04-55`). The app requires a live connection;
  photographs captured in the field are the one exception, held on the device and uploaded when the
  connection returns, with their status shown on the capture screen (`SCR-M04-07`) and nowhere else.
- **No survey-side send machinery of its own.** Every message this module produces — the
  could-not-complete notice, an ask-the-customer question's follow-up — rides the transactional
  lane: automatic from the tenant's connected channel, composed for a person to send where none
  is connected, with no delivery claimed on that fallback (owner ruling 2026-08-04, Q33;
  `M04-58`, `M02-47`).
- **No second provenance vocabulary.** Provenance is described in F8's four tiers (`F8-02`); no
  fifth tier is coined here (`F8-03`).
- **No separate survey visibility domain** (`F2-14`). Survey visibility follows the lead or site;
  no per-person exception exists (`F2-15`).

## 6. Open questions

Mirrored into `registers/open-questions.md` (rollup ids noted):

- **M04-Q1 (register Q24) — RESOLVED (owner ruling 2026-08-04, Q24).** When a newer survey
  supersedes the inputs a design was built on, the design is marked **"survey updated — review
  needed"** and the designer is **notified**; **draft proposals on that design are blocked from
  sending until the review**; **sent proposals stay pinned** and never mutate (`F8-15`). The
  same self-stale pattern as catalog releases. The reconciliation surface is `modules/M05`'s
  (`M05-13`, now final); `M04-66`'s guarantees — newer facts available and visibly newer,
  nothing rewritten automatically — stand as the survey side of the ruled behaviour.
- **M04-Q2 (register Q25) — RESOLVED (owner ruling 2026-08-04, Q25).** The corrector is
  **anyone who can run the remote survey — rep, surveyor or designer** — on the operator
  surface (`M04-15`), with studio re-verification and provenance labels as the safety net. The
  homeowner's route stays the customer link's question affordance, a question and never a
  mutation (`F5-56`); no customer-side write capability is created. The source's "customer"
  wording is confirmed as meaning the operator.
