# F5 · Customer link — engineering tasks

This file carries every engineering task for the customer-link bucket: the no-login tokenised
customer journey of `docs/prd/foundations/F5-customer-link.md` (the link's lifecycle, named links and
attribution, acceptance, questions and callbacks, payment surface, progress, handover, security
and branding laws). Task-id prefix: **T-F5-**. Screen tasks own SCR-F5-01 through SCR-F5-04; the
Proposal Document screen (SCR-M06-17) and Deal Link Manager screen (SCR-M06-20) are drawn under the
M06 tasks file. Policy rows with no standalone build live in the Laws section; context rows in
Realized elsewhere. The disposition index at the end covers every row in this bucket exactly once.

---

### T-F5-001 · Customer Link — Proposal page (SCR-F5-01)

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** F5-07 (P0), F5-32 (P0), F5-33 (P0), F5-35 (P0), F5-36 (P0), F5-37 (P0), F5-39 (P0), F5-42 (P1), F5-43 (P0), F5-44 (P0), F5-47 (P0), F5-48 (P0), F5-52 (P0), F5-53 (P0), F5-54 (P0), F5-55 (P0)
**DESIGN:** SCR-F5-01

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification. The cross-phase rows F5-07, F5-52, F5-53, F5-54 and F5-55 bind SCR-F5-02 and SCR-F5-03 as well; they are dispositioned here. `F5-48`'s build-side half — the instant confirmation message auto-sending from the tenant's connected transactional channel the moment Accept records, with copy-paste composition as the no-channel fallback (`M03-03`, owner ruling 2026-08-04) — is part of this task's build; the page's own confirmation state, which this task draws, is the acknowledgement of record regardless.

**DONE WHEN:**
- Given the proposal phase, when it is designed and reviewed, then it is designed at the small viewport first, reads in one sitting, and reaches its decisive content before any heavy asset (`F5-06`, `F5-07`).
- Given a shared proposal, when the customer opens the link, then the page carries system size, generation, savings, price, incentive, payable, payback, the roof view, financing, Accept and Ask a question (`F5-32`).
- Given a proposal whose design has been signed off, when the page renders, then the read-only 3D view of that design is present with no editing control; and given a design that has not been signed off, when the page renders, then the model is absent (`F5-33`, `F5-34`).
- Given a lead with several design variants, when the customer opens the link, then exactly one recommended system is presented by default (`F5-35`).
- Given any figure on the page, when it renders, then it carries a provenance tier, and any energy figure additionally carries its source label naming the database (`F5-36`).
- Given a proposal built without a design, a design built on remote imagery, or a multi-year financial figure, when the page renders, then the corresponding disclosure line appears verbatim (`F5-37`).
- Given a customer who downloads nothing, when they read the page, then every figure, label and disclosure is available to them; and given a failed document render, when it fails, then it retries once and then notifies the operator (`F5-39`).
- Given the financing block on the customer's page, when it renders, then each option is labelled a projection carrying its assumptions, and the block makes no statement about eligibility, approval or availability — there is no financing marketplace in this release (`F5-42`).
- Given any path in the product other than the customer tapping Accept on their link, when it is exercised, then no acceptance is recorded (`F5-43`).
- Given a deal whose payable exceeds the tenant's configured threshold, when the customer taps Accept, then a one-time verification of the accepting person is required before anything is recorded; and given a deal below it, when they tap Accept, then no challenge fires (`F5-44`).
- Given an Accept on a superseded version, a stale money figure, or an already-won or already-lost deal, when it is submitted, then the server refuses, states what happened, and records no partial acceptance (`F5-47`).
- Given a successful Accept, when the tap completes, then the page's confirmation state changes within seconds and states what was accepted and what happens next (`F5-48`).
- Given a successful Accept in a tenant with a connected transactional channel, when the acceptance records, then the instant confirmation message sends from that channel under the transactional template class; and given no connected channel, then it is composed for a person to send and no delivery is claimed — the page's own confirmation state is the acknowledgement of record either way (`F5-48`, `M03-03`, owner ruling 2026-08-04).
- Given any phase of the link, when the customer opens it, then the question affordance is present in the same place with the same behaviour (`F5-52`).
- Given a submitted question, when it is received, then a notification and a timeline entry exist on the tenant's side, the customer's page acknowledges receipt without promising a delivery or a time the tenant has not committed to, and no reply surface exists (`F5-53`).
- Given a customer requesting a call, when the request is submitted, then a customer-requested callback entry exists in the queue, scheduled no earlier than the market's lawful window (`F5-54`).
- Given any phase of the link, when it renders, then a named person and a phone number are present (`F5-55`).
- (F5-42 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text quoted in `SCR-F5-01` is the binding criterion, and the financing line above states it.)
- (`F5-48`'s PRD acceptance line — quoted above — is the **pre-ruling** wording, retained here for traceability: it covers the page-state half only. **That PRD line now carries the automatic-send half itself at `docs/prd/foundations/F5-customer-link.md` §F5.6's acceptance block, annotated to the owner ruling of 2026-08-04 — the gap this note was opened for is closed, and the send line above is now the PRD's own criterion rather than a supplement to it.** The reconciled `F5-48` requirement text quoted in `SCR-F5-01` and `M03-03` remain the binding criteria.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.
- Given a tenant with a saved brand colour and logo, when its customer-link page renders, then the page carries the tenant's mark and the compliant shade `compliantShades` derived — never a raw colour that fails contrast — and the operator application renders nothing tenant-styled (`F7-07`, `F5-81`; moved here from `T-FPLAT-022`, whose engine and save path are built). → proof: QA (web) the link page shows the mark and the derived shade for a colour that fails contrast; the operator home for the same tenant shows neither

**Settle before the build:**
- Question acknowledgement persistence — ruled: every question the link has received is listed on the page in every phase with its acknowledgement state, for the life of the link, and the states are exactly submitted → received with no answered state (§F5.7's edge case has the page show the earlier question as received; the reply is a call the page never claims, `F5-53`; the rows are lead timeline entries and the link is permanent, `F5-22`, so nothing ages out).
- The named person with a phone number in every phase, surviving project close (`F5-55`, `F5-73`) — pick: the proposal phase names the lead's owner and the progress and handover phases name the project's current coordinator assignment, falling back to the lead's owner where none exists, each rendered as that user's name and login phone (`M01-18`); the source survives close because users are deactivated, never deleted (`F2-20`) and assignments are append-only (the lead owner and the coordinator are the only per-phase person fields any row names; cost if wrong: one resolver swaps its source field and no row changes shape).

---

### T-F5-002 · Customer Link — Progress page (SCR-F5-02)

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** F5-57 (P0), F5-58 (P0), F5-59 (P0), F5-61 (P0), F5-62 (P0), F5-63 (P0), F5-68 (P0)
**DESIGN:** SCR-F5-02

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification. The cross-phase rows F5-07, F5-52, F5-53, F5-54 and F5-55 also bind this screen — they are dispositioned at T-F5-001. The laws F5-60, F5-64, F5-65, F5-66, F5-67 and F5-69 (Laws section below) are enforced through this screen's build and review. `F5-68`'s build-side half — the evening-before crew message auto-sending from the tenant's connected transactional channel, with copy-paste composition as the no-channel fallback (`M03-03`, owner ruling 2026-08-06) — is part of this task's build; the four facts this task draws on the progress page are the customer's record of them regardless of which path carried the message. That half has two named suppliers, both settled by owner rulings of 2026-08-06: the message composes from the registry's seeded **`crew_arrival`** template (`F6-26` → T-FPLAT-021, F-platform tasks file — the authoring act applying the lane ruling), and the hour it goes out is **market-pack data** — a pack default the tenant may narrow, inside a statutory messaging-window **floor**, a slot outside lawful hours resolving to the last lawful moment before it and never after (`F1-15`, `F1-17`), read on the **tenant's timezone** (`F1-10`) and never the customer's (superseding the earlier "customer's market timezone" wording — the owner's premise is that a solar EPC's customers are local to it, and the accepted consequence is that an out-of-timezone customer receives the message at the EPC's evening hour), **with the statutory messaging window evaluated on that same tenant clock — one clock for the hour and the window, never two** (`F1-10`; the same premise and the same accepted consequence extended to the lawful-hours check, so an out-of-timezone customer's own statutory hours are never evaluated and a tenant whose timezone differs from its market's default is judged on its own clock). This task builds no hour of its own, exposes no setting for one, reads no customer timezone for send timing, and evaluates the window in one frame rather than reconciling two. *(The IN values both resolve against are declared at `F1-62` — an empty messaging window and a 19:00 tenant-local send hour; this task takes both from the pack and defaults neither.)*

**DONE WHEN:**
- Given a confirmed or recorded payment, when the customer opens their link, then a receipt, a named contact with a number, and a statement of what happens next and when are all present (`F5-57`).
- Given a tenant with a connected collections account and a due tranche, when the customer opens their link, then the instrument presented is the tenant's own for that tranche; and given no connected account, when they open it, then no instrument is shown and none is fabricated (`F5-58`).
- Given a payment confirmed by the tenant's account and a payment recorded by hand, when both render, then each carries its own confirmation state and neither is presented as the other (`F5-59`).
- Given a won deal, when the customer opens the URL they were sent with the proposal, then the progress phase renders with done, current and waiting items and their dates (`F5-61`).
- Given any stage rendered on the customer's page, when it is read, then it is a value of the canonical chain displayed with the market pack's label, and a stage the market skips is absent rather than permanently empty (`F5-62`).
- Given a project with an active blocker, when the customer's page renders, then the line names the party, the reason, the date the wait started, and the typical duration where the pack declares one (`F5-63`).
- Given a scheduled installation, when the customer is informed, then who is coming, when, how long and what disturbance to expect are all stated, and the same four facts are on the progress page (`F5-68`).
- Given a scheduled installation in a tenant with a connected transactional channel, when the evening before it arrives, then the crew message — who is coming, when, how long and what disturbance to expect — sends automatically from that channel under the transactional template class; and given no connected channel, then it is composed for a person to send and no delivery is claimed on that path; the four facts stand on the progress page whichever path carried the message (`F5-68`, `M03-03`, owner ruling 2026-08-06).
- Given that crew message on either branch, when its text is composed, then it is composed from the `crew_arrival` template in the reader's language — carrying the four facts plus the crew lead's name and number — whose starter words this task authors as per-language template content under the registry's key, never as an ad-hoc string in its code (`F5-68`, `F6-26`, `docs/tasks/F-platform.md` T-FPLAT-021, owner ruling 2026-08-06).
- Given the market pack's declared send hour, when the evening-before moment is resolved, then the message goes at that hour **on the tenant's timezone** (`F1-10`) — and given a customer whose own timezone differs from the tenant's, then the message still goes at the tenant's evening hour, this task reading no customer timezone and storing none for send timing; and given a configured slot outside that market's statutory messaging window — the window evaluated on the same tenant timezone as the hour (`F1-10`), including where the tenant's timezone differs from its market's default (`F1-21`), this task computing no second frame and reconciling none — then it goes at the last lawful moment before the slot and never after it — past the close that day's close, before the open the previous day's close with the day it lands on carried, a case only a pack revision reaches (owner ruling 2026-09-07); and given a tenant configuring the window, then only narrowing succeeds — a narrowing that would leave the send hour outside the window in force refused at save (`M01-56`) — and this task exposes no setting, and honours no support action, that widens it or moves a send past the floor (`F5-68`, `F1-10`, `F1-15`, `F1-17`, owner rulings 2026-08-06). *(This criterion previously read "then the message goes at that hour in the customer's market timezone", which pointed at a different clock from `F1-10` wherever the two differ; the tenant-clock clause for the hour, and then for the window, replaced it. **Both values exist for IN at `F1-62`**: an EMPTY messaging window and a 19:00 tenant-local send hour. The criterion still tests resolution rules; they resolve against real pack data.)*
- (The first of the two `F5-68` lines above is the PRD's four-facts criterion, which both readings of the pre-ruling divergence required; the second is the send criterion the owner ruling added. **The send half was previously specified nowhere: the PRD's own §F5.9 acceptance line tested the four facts only, this task's single `F5-68` criterion was the same four facts with no send clause on either branch, and `SCR-F5-02` carried the two-branch shape as an argument held for the PRD owner. The owner ruling of 2026-08-06 closed that contradiction in favour of the transactional lane**, treating the evening-before crew message exactly as its reconciled siblings `F5-13`, `F5-16` and `F5-48`. The PRD's §F5.9 acceptance line now carries the two-branch send itself, so the criterion above matches the PRD's own rather than supplementing it; the reconciled `F5-68` requirement text quoted in `SCR-F5-02`, with `M03-03`, remains the binding criterion. **The two criteria after it carry the same day's rulings that seeded the `crew_arrival` template row — an authoring act applying the lane ruling, on the `survey_complete` precedent — and made the send hour floor-bound pack data; before them no template row and no hour were specified anywhere, here or in the PRD. The clock those criteria read the hour on is the **tenant's** timezone (`F1-10`), superseding the earlier "customer's market timezone" wording, and the statutory messaging **window** is evaluated on that same clock — one clock and not two; `F6-26`'s key list is exhaustive, so `crew_arrival` and `survey_complete` are both named there rather than only under `docs/tasks/`. `docs/prd/registers/screens.md`'s `F5-68` non-UI note is that file's owner's to close; the IN messaging window and send hour are declared at `F1-62`, and nothing here defaults either.**)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-F5-003 · Customer Link — Handover Pack page (SCR-F5-03)

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** F5-70 (P0), F5-71 (P0), F5-72 (P0), F5-73 (P0)
**DESIGN:** SCR-F5-03

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification. The cross-phase rows F5-07, F5-52, F5-53, F5-54 and F5-55 also bind this screen — they are dispositioned at T-F5-001.

**DONE WHEN:**
- Given a project reaching its terminal handed-over stage, when the customer opens the same URL they have always used, then the document pack renders (`F5-70`).
- Given a completed checklist, when the pack renders, then it carries the warranty documents, the commissioning certificate, the interconnection or metering approval and the how-to-read-generation material, with no row invented and no absent document shown as present (`F5-71`).
- Given the handover page, when it renders, then the referral ask is present and offers no monetary credit, redemption or balance (`F5-72`).
- Given a closed project, when the customer opens the link, then a named person and a phone number are present (`F5-73`).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-F5-004 · Link Failure Page (SCR-F5-04)

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** F5-25 (P0), F5-78 (P0)
**DESIGN:** SCR-F5-04

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification. F5-78's build-side half (per-link view and respond ceilings, global public-route ceiling with backoff, tuned above ordinary reading) is part of this task's build; the page this task draws is what a customer who meets a ceiling sees.

**DONE WHEN:**
- Given an expired, revoked or rate-limited link, when it is opened, then the page states what happened, names a contact person and their number, and discloses no customer data (`F5-25`).
- Given a link exceeding a viewing or responding ceiling, when it is used, then the customer is shown the honest page with a named contact rather than a blank or an error (`F5-78`).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- Rate-limit counter persistence — pick: ephemeral, no counter table — the per-link view and respond ceilings are a trailing-hour count over the link's own append-only rows the audit law already requires, and the global public-route ceiling is an in-process counter that persists nothing (the network address is transient and never persisted, `F5-29`; every access is already a row, `F5-79`; no surface reads a counter back; cost if wrong: a process restart forgets the global count for at most one hour).

---

### T-F5-006 · Link token service & lifecycle (mint, scopes, phases, permanence, revocation, billing independence)

**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** F5-19, F5-20, F5-21, F5-22, F5-23, F5-24, F5-74, F5-75, F5-76, F5-80

**Requirements (verbatim):**
- **F5-19** (P0) — **One link, its whole life: the tokenised URL shared with the proposal becomes the progress tracker after the deal is won, and the document pack after handover.** Three phases, one object, one URL — *"the customer bookmarks it once. Designing it as three separate things would be the mistake."* The link advances **in place**: no phase change re-issues a URL, invalidates a bookmark, or requires the customer to be sent anything new.
- **F5-20** (P0) — **A link comes into existence when a proposal is shared, and never before.** Sharing is the rep's explicit act on the share surface (`M06-53`); minting the link *is* that act, which is why the capability rows of `foundations/F2` §F2.5-F5 carry exactly the send-proposals holder set. Nothing else in the product creates a customer-facing URL.
- **F5-21** (P0) — **The link carries its own authority: a scoped, expiring grant, never a session and never an account.** The scope set is fixed at product level — view the proposal · respond to the proposal (accept, negotiate, decline) · view progress · view the handover pack — and **effective rights are the token's scopes intersected with the link's current phase**, so a token that carries a respond scope grants nothing once the deal has moved past the phase in which responding is meaningful. The link sits outside the role system entirely (`F2-18`).
- **F5-22** (P0) — **The link is permanent (owner ruling 2026-08-04): view scopes never expire, and after handover the same URL is the customer's permanent read-only "solar file" for life.** The former twelve-month view-scope expiry is superseded — a customer returning to a bookmark years later still reaches their page; respond scopes still end with their phase (`F5-21`), and **revocation remains the operator's kill switch** (`F5-76`): re-minting issues a fresh token for the same link, and regenerate-with-revoke kills the old one immediately. The `expired` state survives in the lifecycle vocabulary only for tokens minted under the pre-ruling horizon. Neither expiry nor revocation is ever a consequence of the tenant's billing state (`F5-23`) or of money the customer owes (`F5-24`).
- **F5-23** (P0) — **Customer links keep working in every tenant billing state, without exception.** View **and** respond, proposal and progress pages alike, in every one of the six billing states — `trialing` · `active` · `past_due` · `halted` · `expired` · `cancelled` (the closed vocabulary; no other state name exists) *(Final review: the earlier illustrative list named states outside the six)* — the tenant's customer is never punished for the tenant's billing state. The soft-block matrix is product law and no enforcement surface may move this from working to blocked.
- **F5-24** (P0) — **A customer link is never revoked, degraded or gated over money the customer owes.** The law is stated where the temptation lives: ***"never block the customer's progress link over money — chase the person, do not punish the view."*** An unpaid tranche is visible to the tenant and chased through a person (`M08-39`, `M11-32`); nothing on the customer's page changes because of it, including the parts of the page that have nothing to do with money.
- **F5-74** (P1) — **The link keeps serving the pack after the project closes — permanently.** Closing is not deleting: a handed-over project stays readable with its documents intact, and the customer's link continues to serve them **for life** (`F5-22` as ruled — view scopes never expire; owner ruling 2026-08-04). Nothing about closure removes the customer's access, and nothing about the tenant's billing state does either (`F5-23`).
- **F5-75** (P0) — **The link's product-level security properties are fixed and non-negotiable: unguessable, scoped, expiring, revocable — and attributable.** These are the properties the token scheme must satisfy; how it satisfies them is engineering and is deliberately absent from this suite. No surface may weaken one of them for convenience, and no market pack, plan tier or tenant setting may switch one off. *("Expiring" is the capability of a defined per-scope lifetime: respond scopes end with their phase, and the deal link's view scope carries a **permanent-until-revoked** lifetime by owner ruling 2026-08-04 — revocability is the kill switch that keeps permanence safe.)*
- **F5-76** (P0) — **A revoked or regenerate-with-revoke link dies instantly, regardless of its own expiry.** Revocation is immediate and absolute; there is no propagation window a customer could slip through, and an expiry date does not survive a revocation.
- **F5-80** (P0) — **There is one customer-link framework, and no private or local share path survives beside it.** Every customer-facing share surface in the product is a tokenised link under these laws — server-rendered, scoped, expiring, revocable; the prototype-era local share viewer is replaced and no local-only share path exists anywhere. The framework ships with its full lifecycle, labelling, contact attribution and acceptance challenge from launch rather than in stages. **Resolved (owner ruling 2026-08-04):** the studio's customer-facing 3D view ships **inside the proposal link** ("View in 3D", `F5-33`) — no separate customer-facing 3D share link exists, so the one-framework law holds with nothing beside it.

**DONE WHEN:**
- Given a deal that moves from shared proposal to won project to handed over, when the customer opens their bookmark at each point, then the same URL serves them and the page's phase matches the deal's state (`F5-19`).
- Given a proposal that has never been shared, when the product is inspected, then no customer-facing URL exists for it (`F5-20`).
- Given a token carrying a respond scope, when the deal has moved past the proposal phase, then the respond actions are absent and the token grants only what the current phase allows (`F5-21`).
- Given a link minted years ago on a view scope, when it is opened, then it serves — view scopes never expire (owner ruling 2026-08-04); and given a re-mint without revoke, when the earlier token is used, then it continues to work unless explicitly revoked (`F5-22`).
- Given a tenant in any of the six billing states, including `halted`, `expired` and `cancelled`, when their customer opens a link, then the page loads and responds exactly as it does for a tenant in good standing (`F5-23`).
- Given an overdue tranche of any age, when the customer opens their link, then nothing on the page is withheld, degraded or gated (`F5-24`).
- Given any customer-facing link in the product, when its properties are inspected, then it is unguessable, scoped, expiring, revocable and attributable, and no setting can disable one (`F5-75`).
- Given a revoked link, when it is opened at any time before its expiry, then it does not serve (`F5-76`).
- Given every customer-facing share surface in the product, when they are enumerated, then each is a tokenised link under this framework and no local-only share path exists (`F5-80`).
- (`F5-74` carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion — the link keeps serving the pack after the project closes, permanently, so closing is not de-provisioning.)

**Settle before the build:**
- Link vs token — ruled: two entities, a customer_link (label, contact, lead, scope set) served by many link_token rows, each individually revocable, with no expiry column on either — a respond scope's lifetime is derived at read from the deal's phase, never stored (`F5-22` re-mints a fresh token for the same link and lets both serve until one is revoked; `F5-21` makes effective rights scopes ∩ phase; no token was ever minted under the pre-ruling horizon — the POC's local share ids are replaced, not migrated, `F5-80` — so `expired` stays in the contracts vocabulary `F5-22` keeps and no row can reach it).
- The link's deal reference — ruled: the link holds a lead reference only; the progress and handover phases resolve the project through lead → project, which the won transition creates 1:1 (`M07-62`, `M08-02`), and the phase is read from the deal's state on every open (§F5.3: the link is the deal's identity and holds no state machine; a second reference would be a copy that can diverge).
- White-label custom domain — ruled: no custom-domain field on the tenant record or the link at launch; link resolution is domain-independent, so the first Enterprise slice adds a tenant → domain routing mapping that touches no link row (`F5-82` builds on the first Enterprise ask; Law 9 authors no schema before its slice).

---

### T-F5-007 · Named links, open attribution, PII-free tracking and link audit

**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** F5-26, F5-27, F5-28, F5-29, F5-30, F5-31, F5-77, F5-79

**Requirements (verbatim):**
- **F5-26** (P0) — **Links are named: a deal may carry several labelled links, each addressed to one contact.** Each link carries a human label and, where the contact is known, the contact it was minted for. This is what closes the sharpest liability in the product — a commitment of any size accepted by *"whoever holds the URL"*, with no way to say which stakeholder acted. The earlier decision to defer per-contact links is **superseded**: they ship at launch, not later. Revoking one named link never affects another link on the same deal.
- **F5-27** (P0) — **Opens are attributed per link, so an open can be tied to a named contact.** The open history of a deal reads as *who* opened, not merely *someone* opened; this is the property that makes named links worth having, and it is the same property that makes the acceptance record of `F5-46` meaningful.
- **F5-28** (P0) — **Opens are the product's own evidence and are always tracked; delivery states exist only where the product actually sent (owner ruling 2026-08-04).** The link's shared → opened → viewed-for-how-long progression remains the evidence the product owns outright. Where a transactional message carrying the link was **sent from the tenant's connected channel**, the channel's own delivery states are shown honestly, as that channel reports them and no further. Where the copy-paste fallback was used — a person sent from their own device — **no delivered state exists anywhere**, exactly as `D32` originally ruled: a delivery claim there would be a fabrication, and no surface, notification or analytic may imply one.
- **F5-29** (P0) — **Open events carry no personal data.** An open is recorded as the link, the moment and a device class; the viewer's network address is not persisted on the open event; no customer personal data appears in any URL; and the public pages carry **no third-party scripts, fonts or analytics** of any kind. The richer attribution the acceptance record captures (`F5-46`) exists only at the moment of commitment, deliberately, and is not collected while the customer is merely reading.
- **F5-30** (P0) — **Link management is a tenant-side surface on the deal, and the customer-facing challenge surface is on the customer's page.** The operator sees the deal's links with their labels, their contacts, their open history and their state, and can mint, label, re-mint and revoke from there; the customer meets only the challenge sheet, and only at acceptance. The screens are `modules/M06`'s share and deal surfaces; this document fixes what they must show and what the customer must never be shown (the other contacts' links, labels or open history). *(The Deal Link Manager screen, SCR-M06-20, is drawn under the M06 tasks file; this task builds the link data and events that surface shows, and enforces that no customer page renders another contact's links, labels or open history.)*
- **F5-31** (P0) — **Every act on a link is audit-covered, with attribution.** Mint, re-mint, revoke, open, and each of accept, negotiate and decline are named in the suite's audit checklist and are written with who and when; the customer-side acts are attributed to the link and its contact rather than to a user.
- **F5-77** (P0) — **The public page carries no customer personal data in its address and no third-party code of any kind.** No customer name, phone number, address or identifier appears in a URL or in a log line; the pages load no third-party script, font or analytics; and the open events they emit carry link, moment and device class only (`F5-29`).
- **F5-79** (P0) — **Every access to a customer link is audit-logged, and every act on one is on the suite's audit checklist.** Mint, re-mint, revoke, open, accept, negotiate and decline are named events written with their attribution; the log is tenant-scoped and exportable by the tenant (`F2-23`).

**DONE WHEN:**
- Given a deal with several stakeholders, when links are minted, then each carries a label and, where known, its contact, and revoking one leaves the others working (`F5-26`).
- Given an open on a named link, when the operator reads the deal's link history, then the open is attributed to that link and its contact (`F5-27`).
- Given any customer-facing surface, notification or analytic in the suite, when share states are enumerated, then the set contains shared, opened and viewed-duration; a delivered state appears only where the product's own connected transactional channel sent and reported it, as that channel reports it and no further, and the copy-paste fallback path carries no delivered state anywhere (`F5-28`, `M03-03`, owner ruling 2026-08-04).
- Given an open event, when it is inspected, then it holds the link, the moment and a device class only, no network address, and the page that produced it loaded no third-party script, font or analytic (`F5-29`).
- Given the deal's link manager, when it is opened by an operator, then it shows labels, contacts, open history and link states; and given the customer's page, when it is opened, then it shows none of them (`F5-30`).
- Given any mint, re-mint, revoke, open, accept, negotiate or decline, when it occurs, then an append-only audit entry records it with its attribution (`F5-31`).
- Given any customer-facing page, when it is loaded, then its address contains no customer personal data and it requests no third-party script, font or analytic (`F5-77`).
- Given any mint, re-mint, revoke, open, accept, negotiate or decline, when it occurs, then an audit entry records it with attribution, and the tenant can export their own log (`F5-79`).
- (`F5-28`'s acceptance line above previously departed from the PRD's own acceptance block, which carried the unscoped ban on any delivered state that preceded the transactional-lane ruling and repeated it as the M13 cross-module contract line — *"the standing prohibition on a delivered state (`F5-28`)"*. **Both PRD lines are now reconciled to the two-branch shape at `docs/prd/foundations/F5-customer-link.md` (§F5.4 acceptance block and §4's M13 contract row), annotated to the owner ruling of 2026-08-04 — the divergence is closed and the build line above matches the PRD's.** The reconciled `F5-28` requirement text quoted in full above, with `M03-03`, remains the binding criterion.)

**Settle before the build:**
- Stored link events vs analytics — ruled: link_event holds exactly the five append-only events its source names — opened, section viewed (with section and duration), accepted, negotiate requested, declined — and every name under the PRD's "Analytics events" lists rides the suite's separate analytics stream and is never a link_event row (`F5-27`'s source names the five; `F5-28` makes viewed-for-how-long the product's own evidence; the analytics stream is a separate store by the suite's rule, `F2` §F2.4).

---

### T-F5-008 · Acceptance record, challenge shape and tenant notification

**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** F5-45, F5-46, F5-49

**Requirements (verbatim):**
- **F5-45** (P0) — **The challenge is a challenge, not a credential.** It verifies a person at a moment; it creates no account, sets no password, establishes no session that outlives the act, and is never reused as a login anywhere in the product. This is what lets named links and a verified acceptance coexist with `F5-01` rather than contradict it.
- **F5-46** (P0) — **The acceptance record captures full attribution from day one:** which link, which contact, whether and how the challenge was satisfied (or that it was off — the tenant's OTP-at-accept setting state is recorded), the network address and the user agent of the accepting session. **Named-link attribution is the acceptance evidence of record (owner ruling 2026-08-04)** — with OTP-at-accept default OFF, this record plus the named link's open-attribution is what answers, months later, *who* committed the company to this — the question the single-link design could not answer. It is written once, at the moment of acceptance, and is not a running collection while the customer reads (`F5-29`).
- **F5-49** (P0) — **Acceptance notifies the tenant; a person still confirms the win.** The customer's Accept raises a notification and a timeline entry; the rep marks the deal won, and that act — not the customer's tap — creates the project. *"The rep still marks Won (human confirms, then the project row is born)."*

**DONE WHEN:**
- Given a satisfied challenge, when the product is inspected afterwards, then no account, password or persistent session exists for that customer (`F5-45`).
- Given a completed acceptance, when the record is read, then it names the link, the contact, the challenge outcome, the network address and the user agent (`F5-46`).
- Given a successful Accept, when it is recorded, then the tenant is notified and no project exists until a person marks the deal won (`F5-49`).

**Settle before the build:**
- Accepted proposal-version reference on acceptance_record — ruled: stored, as the version the server validated as current at the moment of accept (`F5-47` re-checks that exact version; `F5-48`'s confirmation states what was accepted; `F5-40` pins sent versions, so the reference names a version that never changes underneath the record; without it the record cannot say what was committed to).
- Contact attribution on a contact-less link — ruled: acceptance_record's contact reference is the link's own at the moment of accept and is absent exactly where the link's is; the record still names the link, the challenge outcome, the network address and the user agent, and accept is never refused for want of a contact (`F5-47`'s re-check is version, deal state and challenge only; `F5-44` makes named-link attribution the evidence of record; §F5.4 calls a contact-less link an operational signal, not a failure).

---

### T-F5-009 · Proposal render gates & version currency (unapproved-design gate, one value set, latest-version/pinning)

**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** F5-34, F5-38, F5-40

**Requirements (verbatim):**
- **F5-34** (P0) — **An unapproved design never reaches this page.** Structural adequacy is a recorded human decision, and a design that has not been signed off is not shown to the customer on the link, in a document or in a shared file. The law is `F8-29`'s; the gate is this document's, and it is absolute: where no approved design exists, the page renders the proposal without the model rather than rendering an unapproved one.
- **F5-38** (P0) — **The link and the document never disagree.** One computed value set feeds the page, the generated document and every export; a figure that differs between the customer's page and the customer's document is a defect, not a rounding difference.
- **F5-40** (P0) — **The page always shows the latest version, and a version already shared never changes underneath the customer.** A newer version supersedes the one the page renders, at the same URL; and the figures of a version that has been shared are pinned forever — a later price change produces a new version rather than editing the one the customer read (`F8-15`). Where the design behind a live proposal has been superseded by newer survey data, the page continues to render what the shared version carries; the reconciliation policy is ruled (owner ruling 2026-08-04: design marked "survey updated — review needed", designer notified, drafts blocked from sending until review, sent versions pinned), and its customer-visible consequence arrives only as a new version at this same URL.

**DONE WHEN:**
- Given a proposal whose design has been signed off, when the page renders, then the read-only 3D view of that design is present with no editing control; and given a design that has not been signed off, when the page renders, then the model is absent (`F5-33`, `F5-34`).
- Given the same figure on the page and in the generated document, when both are read, then the value, the tier and the disclosure are identical (`F5-38`).
- Given a newer version of the proposal, when the customer opens the same URL, then the newer version renders; and given a version already shared, when it is inspected later, then its figures are unchanged (`F5-40`).

---

### T-F5-010 · Day-two design-wait update — automatic transactional send

**Type:** integration · **Tier:** P0
**Status:** planned
**PRD rows:** F5-16

**Requirements (verbatim):**
- **F5-16** (P0) — **The wait between survey and proposal is never silent — and the day-two update is automatic (owner ruling 2026-08-04).** The source is categorical: *"Nothing in the product should let this gap be silent"* — this is where enthusiasm decays and competitors land first. The obligation is met three ways: the promise made at `F5-14` carries a date; the product raises the staff-side task that keeps it; and the *"we are working on your design"* update **sends automatically on day two from the tenant's connected transactional channel** (the same connection `modules/M03` establishes, transactional template class per `M03-03`). Where no channel is connected, the honest fallback is the composed draft a person sends plus the staff-side nudge — and no delivery is claimed on that path.

**DONE WHEN:**
- Given a lead between survey and proposal, when the gap opens, then an owned dated next step exists and a composed customer update is available to be sent (`F5-16`).
- Given a lead between survey and proposal in a tenant with a connected transactional channel, when day two arrives, then the *"we are working on your design"* update sends automatically from that channel under the transactional template class; and given no connected channel, then the composed draft plus the owned dated staff-side next step exist and no delivery is claimed (`F5-16`, `M03-03`, owner ruling 2026-08-04).
- (`F5-16`'s PRD acceptance line — quoted above — is the **pre-ruling** wording, retained here for traceability: it is satisfied by a copy-paste draft alone and covers the fallback half only. **That PRD line now carries the two-branch shape itself at `docs/prd/foundations/F5-customer-link.md` §F5.2's acceptance block, annotated to the owner ruling of 2026-08-04 — the gap this note was opened for is closed, and the send line above is now the PRD's own criterion rather than a supplement to it.** The reconciled `F5-16` requirement text quoted in full above, with `M03-03`, remains the binding criterion.)

---

## Laws (enforced through screens and review, no standalone build)

- **F5-01** (P0) — **The customer never logs in — ever.** There is no customer account, no password, no portal, no application to install and no sign-up of any kind anywhere in the product. The customer reaches everything they are entitled to see through one tokenised link, and holds no role: no preset describes them, no matrix column exists for them, and no surface in this suite may introduce a customer credential. The acceptance challenge of `F5-44` is a one-time verification of a person at a moment of commitment — it is **not** a credential, creates no account, and grants nothing that outlives the act it protects.
  *Enforced by:* review of every customer-facing surface (T-F5-001…004 introduce no credential); the challenge's non-credential shape is T-F5-008's build (`F5-45`); the token grant of T-F5-006 is never a session or account (`F5-21`).
- **F5-02** (P0) — **The customer's entire surface area is messages, calls and one link — and nothing in the product may add a second destination.** The source's whole-project counts are the budget: roughly 12–18 messages, 3–6 calls, **one** web link reused across all three phases, **zero** logins, **zero** app installs. Any proposal to give the customer a second URL, a second page family or an application is a change to this law, not a feature decision inside a module.
  *Enforced by:* review; the one-framework build of T-F5-006 (`F5-80`) is the mechanism that leaves nothing beside the link.
- **F5-03** (P0) — **Two archetypes, one design.** The residential homeowner and the commercial-and-industrial buyer are served by the same page, the same lifecycle and the same laws; the difference between them is expressed through named links and the acceptance challenge (§F5.4, §F5.6), never through a second design, a second URL family or a segment-conditional surface.
  *Enforced by:* review of T-F5-001…004 (one page family); named links and the challenge are T-F5-007 and T-F5-001/T-F5-008.
- **F5-05** (P0) — **Trust is the product, so every number the customer reads carries its honesty labels — with no exception for the customer surface.** Provenance tier (`F8-01`, `F8-02`), energy source label (`F8-08`, `F8-09`), staleness state (`F8-12`) and every required disclosure (`F8-20`, `F8-22`, `F8-23`) render on this page exactly as they render inside the product. No tenant setting, plan, template or white-label arrangement removes, weakens, renames or hides one (`F8-06`). A surface that cannot carry a label does not thereby earn permission to drop it — it carries the label or it does not carry the number (`F8-01`).
  *Enforced by:* the "Numbers carrying provenance" sections of the SCR-F5-01/02/03 briefs built by T-F5-001/002/003; review against F8.
- **F5-08** (P0) — **The page renders in the customer's language, not the rep's — and the product is built for a language set that will grow.** Language follows the reader (`F3-06`); every product-authored string on this page, including every honesty and disclosure line, is translated content (`F3-07`) with English fallback per string (`F3-05`); names, addresses, brand names and technical units are never translated (`F3-08`); money renders through the one money implementation in the tenant market's declared format, identically in every language (`F3-20`). No requirement in this document names a language or assumes the set's size (`F3-25`).
  *Enforced by:* the F3 localization framework consumed by every T-F5 screen task; review of all customer copy through the catalog.
- **F5-09** (P0) — **The customer's first experience is a callback, and its speed is the single biggest predictor of who wins the job.** The source's own signals: called back within an hour reads as a strong signal; called back three days later means *"the job is already lost"*. The mechanism is lead capture and first-response time (`modules/M02`); what this document fixes is that the speed is a **customer-facing product obligation**, not an internal metric, and that no surface in the product may let a new enquiry sit without an owner.
  *Enforced by:* `M02-50`'s unassigned-escalation build (M02 tasks file); review that no surface lets an enquiry rest unowned.
- **F5-10** (P0) — **One company, one voice: the customer is never called by three different people, and never asked the same questions twice.** Being contacted by several people from one company reads as disorganised and costs the job; being re-interviewed says the company does not keep records. Both are prevented by the duplicate check and the single record at capture (`M02-07`, `M02-08`), and both are stated here as customer-facing failures the product exists to prevent.
  *Enforced by:* `M02-07`/`M02-08` dedupe-at-capture build (M02 tasks file).
- **F5-11** (P0) — **The customer is never called outside the lawful hours of their market, and never after they have said stop.** The statutory ruleset — calling window, do-not-disturb, opt-out and disclosure — is market-pack data enforced by a non-swappable mechanism (`F1-15`, `F1-17`; the enforcement surface is `M07-27`/`M07-28`). Stated from the customer's side: a customer who says stop is not called again, and no tenant configuration may reach around the floor. **Ruled (owner ruling 2026-08-04):** the enforced lanes bind automated dials — inbound answering 24/7, unsolicited dials only inside the statutory window, and outside-window dials only on the customer's own recorded, timestamped callback request (which a single "stop" ends); a human rep dialling manually gets warning-then-proceed with the "customer requested" context logged (`M07-30`). The customer-side outcome is unchanged: never called outside lawful hours except at their own recorded request, never after stop.
  *Enforced by:* `M07-27`/`M07-28`/`M07-30` compliance gate and `F1-15`/`F1-17` pack floors (their task files); T-F5-001's callback request supplies the recorded, timestamped consent (`F5-54`).
- **F5-12** (P0) — **The same answers must be right whoever — or whatever — is speaking.** A rep fumbling a basic incentive question loses the deal before price is discussed, and an automated caller giving a different answer than the rep does the same damage twice. The knowledge that makes the answers consistent is the tenant's, authored once and used by both (`modules/M07`; corrections never auto-train — `R10`). This document states the customer-facing consequence: the customer must not be able to tell, from the content of an answer, which channel they reached.
  *Enforced by:* `modules/M07`'s one authored knowledge set (M07 tasks file).
- **F5-13** (P0) — **A booked site visit produces a confirmation carrying four mandatory facts: what is happening, the date and time, the name of the person coming, and that person's phone number.** The message is composed by the product and — per the owner ruling of 2026-08-04 — **sends automatically from the tenant's connected transactional channel**, with a person sending the composed copy-paste text where no channel is connected (`M02-47`); this document fixes the four fields as a customer-facing minimum, so that no surface may compose a confirmation that omits one.
  *Enforced by:* `M02-47`'s composing build (M02 tasks file); review that no composing surface omits a field.
- **F5-14** (P0) — **A survey leaves the customer with a promise and a date — and nobody leaves a site without saying what happens next.** The trust rule is the source's: what builds trust is the surveyor explaining what they are photographing and why; what destroys it is silent photographing followed by leaving. The customer receives a confirmation of the form *"Survey done. Your proposal will reach you by <date>."* — **a promise with a date**. Where the survey is remote the customer experiences nothing at this step and receives their proposal sooner, which is itself the competitive answer; where it is physical, the visit is confirmed, attended and closed out.
  *Enforced by:* the promise with a date is composed and sent at survey-submission commit by T-M04-009 (M04 tasks file), from the `survey_complete` template, whose starter words T-M04-009 authors under the registry's key (`F6-26` → T-FPLAT-021, F-platform tasks file — the key is named in `F6-26`'s own list, which owner ruling 2026-08-06 makes exhaustive), on the transactional lane with copy-for-a-person where no channel is connected (`M03-03`, owner ruling 2026-08-04); the visit's confirmation, attendance and close-out are `M02-46`'s booking build (T-M02-014) and `M02-47`/`M02-48`'s send build (T-M02-013) in the M02 tasks file. PRD check, verbatim: "Given a completed survey, when the customer is updated, then the update states that the survey is done and names the date by which the proposal will reach them (`F5-14`)."
- **F5-15** (P0) — **No verbal price is given that the proposal then contradicts.** A figure spoken on a roof becomes the number the customer remembers; a document that disagrees with it reads as a bait. The product's answer is that the priced document is the only price surface and it carries its own honesty labels (`F5-36`, `F5-37`) — no surveyor-side or call-side surface in the product produces a customer-facing price.
  *Enforced by:* review — T-F5-001's page and the proposal document (SCR-M06-17) are the only customer-facing price surfaces; no other task in the suite emits one.
- **F5-18** (P0) — **The follow-up call is configured to protect the customer out of the box.** The shipped defaults are the source's: capped attempts, a calling window, the customer's own language, an always-offered hand-off to a person, and an automated caller that says it is automated. The owner may change what is above the statutory floor and owns that choice; the floor itself is not theirs to move (`F5-11`). Stated as the customer's four protections: not called three times in a week, not called at dinner, not addressed in a language they do not speak, and never trapped without a route to a human.
  *Enforced by:* `M07-22`/`M07-44` shipped defaults (M07 tasks file).
- **F5-41** (P0) — **The customer-facing document and this page say "Proposal" — in the reader's language, in every language.** The naming ruling binds every locale: one term per concept, and the words for a priced offer that this suite bans are banned in every language, not only in English. This is the customer-link half of the ruling; the entity and the document are `modules/M06`'s and the vocabulary law is `foundations/F3`'s.
  *Enforced by:* `F3-11`'s vocabulary law and `M06-01` (their task files); review of every customer-facing string in T-F5-001 and the proposal document (SCR-M06-17).
- **F5-50** (P0) — **Negotiation is answered the same day, because nothing in the product makes the customer wait.** A customer asking for a discount is answered by the rep applying it and re-sharing — there is no approval hop, no request sheet, no queue and no pending-approval state (`D34`); the only guard is arithmetic at generation (`M06-36`). The customer's page reflects the revised version at the same URL. *"They should not wait two days for an answer, and now nothing in the product makes them."*
  *Enforced by:* the deliberate absence of any approval flow (review); `M06-36`'s arithmetic guard (M06 tasks file); T-F5-009's latest-version render delivers the revised version at the same URL.
- **F5-51** (P0) — **A decline is recorded with its reason, and then the customer is left alone.** The reason is mandatory at the close surface (`M02-54`, `M07`'s mark-lost); a customer who has said they are not interested is not called again for the ruled suppression period, and a customer who has postponed resurfaces on the date they named rather than at someone's convenience. *"They should not then be called for six months."* **Ruled (owner ruling 2026-08-04):** the Lost state's own "not interested" — the seventh Lost reason — carries the six-month suppression (`M02-54`, `M07-63`); the customer-facing outcome this row states is delivered exactly as written.
  *Enforced by:* `M02-54`/`M07-63` (their task files); the decline respond action itself is T-F5-001's.
- **F5-56** (P1) — **The customer's channel for "that is not my roof" is the question affordance, never an edit — FINAL (owner ruling 2026-08-04).** The link grants no write access to a survey, a design or any figure; a customer who believes an outlined roof is wrong asks, a person reviews, and the correction is made on the operator's surface by **anyone who can run the remote survey** — rep, surveyor or designer (`F2.M04.run-remote-survey`), with studio re-verification and provenance labels as the safety net. The ruling confirms the conservative reading this row carried: the customer's route exists and it is a question, not a mutation; no customer-side write scope is created.
  *Enforced by:* T-F5-006's fixed scope set (no write scope exists); T-F5-001's question affordance; `M04-22` (M04 tasks file) — the operator outlines, and corrects, every roof.
- **F5-60** (P0) — **Nothing on this page is ever gated by money — the customer's own or the tenant's.** An unpaid tranche does not hide the progress page, dim a section, or attach a demand to a surface the customer came to for something else; the tenant's platform billing state is invisible here in every direction (the customer never sees a platform bill, a plan, a dunning notice or a subscription state). The chase happens through a person (`M08-38`, `M08-39`, `M11-32`, `M11-53`).
  *Enforced by:* T-F5-006's billing-state and money-gate tests (`F5-23`, `F5-24`); T-F5-002's never-gated-over-money invariant across all states; review.
- **F5-64** (P0) — **The internal reason for a wait is never the published one.** A supplier's failure is the company's problem to solve and not the customer's to read: the customer sees the honest stage and the fact that material is on order with an expected date — never the supplier, the internal note, or the commercial detail behind it. The separation is guaranteed on the producing side (`M08-25`); this document guarantees that the customer page renders only the published field.
  *Enforced by:* T-F5-002 renders only the published field; `M08-25`'s producing-side separation (M08 tasks file).
- **F5-65** (P0) — **The product's job during an external wait is to make it visible and attributable — not to claim it can make it shorter.** External approvals and inspections take as long as they take; the page states the wait honestly with its attribution and its expected duration, and makes no promise about influencing it. *"A delay you explained is tolerable; a delay you hid is a complaint."*
  *Enforced by:* T-F5-002's attributed wait line (`F5-63`); review of customer copy.
- **F5-66** (P0) — **The page never renders a completion percentage and never fabricates a date.** A system installed but stuck before commissioning is not "90% done" — it is in its stage, with the time it has been there (`M08-13`). Where an expected-until date is unknown, the page says the date is not yet known; it does not compute a plausible one to fill the sentence, and no figure or date on this page exists that `modules/M08` did not publish.
  *Enforced by:* T-F5-002 (the brief bans completion percentages and unpublished dates; the expected-date-unknown state); review.
- **F5-67** (P0) — **Silence, not delay, is the failure this page exists to kill.** The source is unambiguous that customers become unhappy *"almost always because of silence rather than delay"*, and names the loop it prevents: *"They call the rep. The rep does not know. They call again."* The page is therefore updated by the delivery work itself — completing a stage updates it, with no separate publish step for anybody to forget (`M08-15`).
  *Enforced by:* `M08-15`'s stage-completion trigger (M08 tasks file); T-F5-006's phase/state resolution reads the deal's state with no publish step.
- **F5-69** (P0) — **Commissioning is the system switching on and a pile of documents — and neither the crew's internal detail nor any commercial figure reaches the customer's page.** Installation and commissioning steps are recorded by the coordinator with an optional note of who did the work (`R16`, `M08-42`); the customer sees stages and their dates, never the checklist's internals, and no surface in the installation path shows a price, discount, tranche or margin (`F2-06`, `M08-43`).
  *Enforced by:* T-F5-002 renders published stages and dates only; `F2-06`/`M08-42`/`M08-43` (their task files).
- **F5-81** (P0) — **Tenant branding applies to customer-facing documents and link pages, on every tier — and to nothing else.** The tenant's mark and brand colour dress the customer's page and the generated document; the operator application is never restyled per tenant. Branding is presentation: it never changes a number, a label, a disclosure or a law of this document (`F5-05`, `F8-06`).
  *Enforced by:* M01's branding settings build (M01 tasks file); review that branding on T-F5 screens and the proposal document (SCR-M06-17) stays presentation-only.
- **F5-82** (P1) — **Full white-label — a custom domain for customer links and an unbranded customer surface — is an Enterprise commercial arrangement, designed at this document and built when the first Enterprise deal asks for it.** The source is explicit that the routing is designed here rather than in the design or localization documents. Its product-level shape: a tenant-specified domain serves the same pages under the same laws, the link's properties (`F5-75`) are unchanged, and an unbranded surface removes the platform's own marks only — never a provenance label, a disclosure or the named contact. This is a commercial and service arrangement rather than a withheld product capability.
  *Enforced by:* the row's own terms — designed here, **built when the first Enterprise deal asks**; no launch build exists. T-F5-006's link properties are domain-independent by construction.
- **F5-83** (P0) — **Nothing about branding or white-labelling changes what the page must say.** A custom domain, a tenant mark, an unbranded surface and a bespoke Enterprise arrangement all render the same provenance tiers, the same disclosure lines, the same honest wait attribution, the same named contact and the same refusal to gate anything over money. A white-label arrangement that removed an honesty label would be a breach of `F8-06`, not a configuration.
  *Enforced by:* review of any branding or white-label change against the label, disclosure and contact set of T-F5-001/002/003 and the proposal document (SCR-M06-17); `F8-06` (F8 framework).

---

## Realized elsewhere

- **F5-04** (P0, context) — **The two acceptance themes for every customer-facing requirement are message timing and link truthfulness.** Verbatim: *"the product's job on this side is not screens. It is making sure the right message arrives at the right moment, and that the one link always answers 'what is happening?'"* Every requirement in this document is testable against one of the two, and a customer-facing behaviour that satisfies neither does not belong here.
  *Realized by:* `docs/prd/foundations/F5-customer-link.md` — the two acceptance themes are the frame every F5 requirement is written and reviewed against; no separate build exists.
- **F5-06** (P0, context) — **Three moments decide the outcome, and each is a design constraint on a named surface.** (a) **Speed of first callback** decides whether the company is in the running at all — the mechanism is lead capture and first response (`modules/M02`). (b) **The proposal link, opened once, on a phone, in the evening** decides the sale — the mobile-first single-session constraint of §2. (c) **Visible progress during the long external wait** decides whether the customer refers anyone — the progress phase (§F5.9) and the referral ask (§F5.10). No surface in this document may be designed as though a customer will return to it repeatedly to hunt for something.
  *Realized by:* `docs/prd/modules/M02-crm-and-leads.md` (speed of first callback), `F5-32` → T-F5-001 (the proposal opened once, on a phone, in the evening), `F5-61` → T-F5-002 (visible progress during the long wait), `F5-72` → T-F5-003 (the referral ask).
- **F5-17** (P1, context) — **The thinking window belongs to the customer, and the product's job in it is to answer rather than to chase.** The typical decision window runs from days to weeks, nothing happens in the product, and the customer's real questions are rarely about price — will this reduce my bill, what if it does not work, who fixes it in year four, will it damage my roof, is the incentive real and who does the paperwork. Every one of those is answerable by the tenant's own knowledge on any channel the customer reaches (`F5-12`), and the link's question affordance (§F5.7) exists so a question does not require a phone call the customer must initiate.
  *Realized by:* `F5-12` (Laws section — same answers on every channel), `F5-52`/`F5-53` → T-F5-001 (the question affordance that answers without chasing).

---

## Disposition index

| Row | Disposition |
|---|---|
| F5-01 | LAW |
| F5-02 | LAW |
| F5-03 | LAW |
| F5-04 | realized-by: docs/prd/foundations/F5-customer-link.md |
| F5-05 | LAW |
| F5-06 | realized-by: docs/prd/modules/M02-crm-and-leads.md · F5-32 (T-F5-001) · F5-61 (T-F5-002) · F5-72 (T-F5-003) |
| F5-07 | T-F5-001 |
| F5-08 | LAW |
| F5-09 | LAW |
| F5-10 | LAW |
| F5-11 | LAW |
| F5-12 | LAW |
| F5-13 | LAW |
| F5-14 | realized-by: T-M04-009 (M04 tasks file — the survey-submission send) · T-FPLAT-021 (F-platform tasks file — the `survey_complete` key and the composer; the key is named in `F6-26`'s exhaustive list per owner ruling 2026-08-06, its words authored by T-M04-009) |
| F5-15 | LAW |
| F5-16 | T-F5-010 |
| F5-17 | realized-by: F5-12 (LAW) · F5-52/F5-53 (T-F5-001) |
| F5-18 | LAW |
| F5-19 | T-F5-006 |
| F5-20 | T-F5-006 |
| F5-21 | T-F5-006 |
| F5-22 | T-F5-006 |
| F5-23 | T-F5-006 |
| F5-24 | T-F5-006 |
| F5-25 | T-F5-004 |
| F5-26 | T-F5-007 |
| F5-27 | T-F5-007 |
| F5-28 | T-F5-007 |
| F5-29 | T-F5-007 |
| F5-30 | T-F5-007 |
| F5-31 | T-F5-007 |
| F5-32 | T-F5-001 |
| F5-33 | T-F5-001 |
| F5-34 | T-F5-009 |
| F5-35 | T-F5-001 |
| F5-36 | T-F5-001 |
| F5-37 | T-F5-001 |
| F5-38 | T-F5-009 |
| F5-39 | T-F5-001 |
| F5-40 | T-F5-009 |
| F5-41 | LAW |
| F5-42 | T-F5-001 |
| F5-43 | T-F5-001 |
| F5-44 | T-F5-001 |
| F5-45 | T-F5-008 |
| F5-46 | T-F5-008 |
| F5-47 | T-F5-001 |
| F5-48 | T-F5-001 |
| F5-49 | T-F5-008 |
| F5-50 | LAW |
| F5-51 | LAW |
| F5-52 | T-F5-001 |
| F5-53 | T-F5-001 |
| F5-54 | T-F5-001 |
| F5-55 | T-F5-001 |
| F5-56 | LAW |
| F5-57 | T-F5-002 |
| F5-58 | T-F5-002 |
| F5-59 | T-F5-002 |
| F5-60 | LAW |
| F5-61 | T-F5-002 |
| F5-62 | T-F5-002 |
| F5-63 | T-F5-002 |
| F5-64 | LAW |
| F5-65 | LAW |
| F5-66 | LAW |
| F5-67 | LAW |
| F5-68 | realized-by: T-F5-002 (the progress page and the evening-before send) · T-FPLAT-021 (F-platform tasks file — the `crew_arrival` key and the composer, owner ruling 2026-08-06; its words authored by T-F5-002) |
| F5-69 | LAW |
| F5-70 | T-F5-003 |
| F5-71 | T-F5-003 |
| F5-72 | T-F5-003 |
| F5-73 | T-F5-003 |
| F5-74 | T-F5-006 |
| F5-75 | T-F5-006 |
| F5-76 | T-F5-006 |
| F5-77 | T-F5-007 |
| F5-78 | T-F5-004 |
| F5-79 | T-F5-007 |
| F5-80 | T-F5-006 |
| F5-81 | LAW |
| F5-82 | LAW |
| F5-83 | LAW |
