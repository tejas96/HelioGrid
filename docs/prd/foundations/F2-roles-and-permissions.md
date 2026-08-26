# F2 · Roles & permissions

Status: draft · Origin mix: SRC/BRIEF (this document carries no `REC` items) · Depends on:
`00-README.md`, `01-product-overview.md`, `02-personas.md`

## 1. Purpose & scope

This document is the permission truth of the suite. It fixes, once and finally:

1. **The preset role set** — twelve fixed presets, named 1:1 for the twelve personas of
   `02-personas.md`. Every later document uses these exact names (design spec §2 DD3; suite
   Global Constraint: "all later tasks use those exact role names").
2. **Role semantics** — stacking, OR-across-roles, the visibility-scope law and the
   widest-scope-wins rule, carried verbatim from v1 (D20/D27/D28/D29) and widened to the
   twelve-preset set (DD3).
3. **The three rulings `02-personas.md` handed to this document** — design sign-off (A), the
   v1 `Manager` fan-out (B), and the installer login (C) — each decided here with rationale,
   plus this document's half of the multi-role composition question (D).
4. **Role-administration guard rails and the audit obligations** that ride the role system
   (`DOC08.min-owner`, `DOC08.deactivate-never-delete`, `DOC08.midtask-permission`,
   `DOC08.audit-*`).
5. **The per-module permission matrices** (§F2.5) — one table per module `M01`–`M13` plus the
   `F5` customer-link surfaces. Rows whose content the source or an owner ruling already fixes
   are filled here; every other row is a literal placeholder row, and the owning module task
   replaces it by appending its capability rows **to this document**, never to its own file.
   The closure pass (Task 26) verifies that every placeholder was filled.

**What this document is not.**

- It is **not** `02-personas.md`. A persona is a job to be done; a preset role is the grant of
  access that lets someone do it. Persona goals, pains, days-in-the-life and home screens live
  there; nothing here re-describes a persona.
- It does **not** specify screens. The v1 role-administration screens — Team, Assign roles, the
  read-only Roles reference, Invite person (journey L1486–1491) — belong to
  `modules/M01-onboarding-and-tenant-config.md`, which renders them against the semantics and
  matrices defined here.
- It does **not** govern the customer. The customer reaches the product through a tokenised
  link and never holds a role; link scopes (`DOC08.link-*`) are `foundations/F5-customer-link.md`'s,
  and they are token scopes, not roles.
- It carries no session or authentication mechanics (M01), no seat or licence modeling
  (`04-business-model.md`), and — per the suite rules — no implementation content: no
  permission-check APIs, no schema, no enforcement architecture.

## 2. Personas & surfaces

All twelve personas. The preset set is 1:1 with the persona vocabulary, so the mapping below is
also the role list. Lineage names the v1 preset (or gap) each preset descends from, per
`02-personas.md` §2 and design spec §12 (which seeded thirteen candidates; §F2.1 records how
thirteen became twelve).

| # | Preset role (= persona name) | Lineage (v1 → V2) | Default visibility (see §F2.2) |
|---|---|---|---|
| 1 | **EPC Owner** | v1 `Owner` | All — everything, always |
| 2 | **Sales Manager** | v1 `Manager`, direct successor (decision B) | Team (leads); team-scoped reports |
| 3 | **Sales Executive** | v1 `Sales rep` | Own leads |
| 4 | **Survey Engineer** | v1 `Surveyor` | Assigned only |
| 5 | **Design Engineer** | v1 `Designer` **+** v1 `Engineer` (sign-off folded in — decision A) | Assigned only |
| 6 | **Project Manager** | new preset; inherits the v1 coordinator half of `Manager` (decision B) | Own projects |
| 7 | **Field Technician** | new preset (V2 field-workforce scope) | Own assigned work |
| 8 | **Installation Team Member** | new preset; the v1 no-login crew (R16 — decision C) | Assigned installation job only |
| 9 | **HR/Admin** | new preset (V2 HR-lite scope) | People records (M10 scope) |
| 10 | **Finance** | new preset; money surfaces are v1 | Money side of all projects |
| 11 | **Operations** | new preset; inherits the v1 coordinator half of `Manager` at portfolio scope (decision B) | Portfolio (all projects, read) |
| 12 | **Marketing** | new preset (V2 marketing scope) | Campaigns and their captures |

**Surfaces.** Permission enforcement is every surface, mobile and web equally — a grant absent
on one surface is absent on both. Role *administration* (assigning presets, inviting,
deactivating) is the EPC Owner's work, web-emphasis for the dense list and mobile for the
one-tap acts (invite, deactivate), per M01's screens.

**Audiences.** Roles exist only inside the tenant's two user audiences — Owner and Employees
(`01` §2; `DOC00.three-audiences`, D7, dispositioned by Task 3 with role semantics pointed
here). The EPC's customer is an audience, never a role: no preset, no matrix column, no cell in
this document may ever describe a customer (D5; `foundations/F5-customer-link.md`).

## 3. Feature areas

### F2.1 — The preset role set

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F2-01 | The preset role set is **exactly twelve fixed presets**, named verbatim for the twelve personas: EPC Owner · Sales Manager · Sales Executive · Survey Engineer · Design Engineer · Project Manager · Field Technician · Installation Team Member · HR/Admin · Finance · Operations · Marketing. Every module and foundation PRD uses these exact names; a document that needs a thirteenth preset records the need in `registers/open-questions.md` rather than coining one. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Users; *retired: PRD design note* §2 DD3 ("~12 roles matching the persona set") · grounded in source at `D27` (fixed presets, journey L1417–1418) | P0 |
| F2-02 | **Presets are fixed and cannot be edited, renamed, or deleted by a tenant.** The source's own guard carries: "Presets are fixed and cannot be edited — a company cannot break 'Sales rep' for everyone who came after" (journey L1482–1483). There is no role editor, no duplicate-from-preset, and no tenant-created role in this release (D29 carried into V2 by DD3 — see §5 Non-goals). | `SRC` — *retired: product journey* §ROLES & PERMISSIONS L1482–1483, L1493–1496; `D29` (*retired: D-census ledger*) | P0 |
| F2-03 | **Decision A — design sign-off is an approval capability of the Design Engineer preset, not a thirteenth preset.** The v1 `Engineer` preset ("Reviews and signs off designs", journey L1436) folds into Design Engineer; the capability row `F2.M05.approve-designs` grants sign-off to EPC Owner and Design Engineer. The v1 capability itself is carried whole — nothing an Engineer could do in v1 is lost. | `SRC` — `DOC08.matrix.approve-designs` (docs/engineering/08; journey L1451) · placement ruled per *retired: PRD design note* §2 DD3 + §12; rationale in the behavior detail below | P0 |
| F2-04 | **The approver of record is not the design's author.** Sign-off approval or return is recorded with who and when — "the engineer-led structural safety record" — and a returned design goes back to its author with comments pinned to what is wrong. Where the only person holding sign-off is the author (the one-person firm — the matrix has always granted the Owner both capabilities), the approval record still names the approver, so the record shows the same person did both; see edge cases. | `SRC` — `DOC08.audit-coverage` (design sign-off approve/return with who + when); `S5.wrong.6` (return with pinned comments); `02-personas.md` `PS-19` | P0 |
| F2-05 | **Decision C — the Installation Team Member preset exists in V2.** R16 is honored verbatim for the v1-derived scope: in v1 the crew has no login, the coordinator runs the checklist, and "crew sees no money because crew sees no screen". R16's own consequence names the path this document takes: "v2 adds an Installer preset without schema change (roles are already M:N)" — and the owner's V2 brief lists Installation Teams as primary users. The preset's V2 name is **Installation Team Member**, per the fixed persona vocabulary. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Users ("Installation Teams") · preset-addition path per source `R16` (*retired: rulings ledger*) | P0 |
| F2-06 | **No commercial figures, ever, on any surface the Installation Team Member preset grants.** No price, discount, tranche, margin or customer value appears on any screen this preset reaches. v1 achieved the property by giving crew no screen at all; where V2 gives them a screen, the surface itself must preserve it (`02-personas.md` `PS-27` carries the same law persona-side). | `SRC` — `R16` ("Crew sees no money because crew sees no screen"); `S8.rule.roles` (installer/crew: "the installation checklist only. Ticks steps. Nothing financial.") | P0 |
| F2-07 | **The coordinator fallback survives the preset.** Where the checklist is run by a coordinator rather than the crew, ticks are attributed to the coordinator and an optional free-text "done by" per step records the crew member's name. This fallback is not removed when crew accounts exist, because mixed crews are the normal case (`02-personas.md` `PS-28`). | `SRC` — `R16` (ticks attributed to the coordinator; optional free-text "done by" per step) | P1 |
| F2-08 | **Decision B — the v1 `Manager` preset fans out as: Sales Manager = direct successor; Project Manager and Operations = delivery re-grants.** (a) **Sales Manager** inherits every grant the v1 `Manager` preset held in the v1 capability matrix, unchanged — Team lead visibility; add/edit leads; assign leads; capture surveys; create/edit and send proposals; update project stages; record payments and upload documents; see agent performance; see company reports (team-scoped). (b) **Project Manager** re-grants the coordinator subset at single-project scope — update stages, upload/verify documents, record payments — and takes over the v1 coordinator's checklist duty (R16's "coordinator (Manager role) runs the checklist" becomes the Project Manager in V2). (c) **Operations** re-grants the coordinator subset at portfolio scope — stages, documents, blockers — plus the DD11 catalog grant and field-workforce team visibility. No v1 `Manager` grant is dropped; each is either carried by Sales Manager or additionally re-granted. | `SRC` — *retired: product journey* §ROLES & PERMISSIONS L1432 (v1 Manager grants) + `S8.rule.roles` ("= the Manager preset — there is no separate coordinator role", D27) · fan-out ruled per *retired: PRD design note* §2 DD3 + §12; `02-personas.md` §2 | P0 |
| F2-09 | **Field Technician and Installation Team Member are distinct presets.** Different jobs, different grants: the technician's grants are visits, routes, check-in/out and tasks (M09 rows); the installer's are the installation checklist and its photo evidence (M08 rows) under the F2-06 no-commercial-figures law. Merging them would put route and visit rights on a crew surface bound by R16's constraint, and checklist rights on every general field employee — both leaks. One person may of course hold both presets (F2-10). | `BRIEF` — *retired: PRD design note* §12 (the merge question F2 must record with rationale); `docs/prd/owner-brief-2026-08-03.md` §Users, §Field-workforce | P0 |

**Behavior detail — how thirteen candidates became twelve.** Design spec §12 seeded thirteen
candidates: Owner · Manager · Sales Executive · Surveyor · Designer · **Engineer (sign-off)** ·
Project Manager · Field Technician · Installer · HR/Admin · Finance · Operations · Marketing.
This document fixes the final set at twelve by folding the `Engineer (sign-off)` candidate into
the Design Engineer preset (decision A) and renaming the rest onto the fixed persona vocabulary
(Owner → EPC Owner, Manager → Sales Manager, Surveyor → Survey Engineer, Designer → Design
Engineer, Installer → Installation Team Member).

**Decision A rationale (recorded, not open).** v1 kept `Designer` and `Engineer` as separate
presets for one reason: in a firm large enough to have both, the reviewer must not be the
author. That guard is a property of *the act* — who may approve a given design — not of the
preset list, and F2-04 preserves it directly on the capability. Keeping a thirteenth preset
would buy nothing the capability rule does not already give: DD3 sizes the set to the persona
set ("~12 roles matching the persona set"), the persona set has no thirteenth name (`PS-02`),
and stacking already lets a tenant compose any assignment of duties. The one staffing shape a
folded preset cannot express — a reviewer-only person who signs off but may not create designs —
is not a shape the source ever required (the v1 `Engineer` also existed in tenants that simply
never used both presets), and R16's consequence establishes the escape path: presets are
many-to-many with people, so if a tenant genuinely needs a reviewer-only preset, "a later
release adds it without restructuring anything." Recorded as a decision row (not an open
question) in `registers/open-questions.md`, with that revisit trigger stated.

**Decision B rationale.** The v1 `Manager` carried two unrelated jobs — running a selling team
(journey L1432) and being the projects coordinator ("there is no separate coordinator role",
`S8.rule.roles`). V2 splits the *personas* three ways (`02` §2); the *presets* split as F2-08
encodes. Sales Manager keeps the full v1 grant set — including update-stages and
record-payments — because in the small firm the sales manager still is the coordinator, and
dropping a v1 grant from the successor preset would silently narrow existing v1 behavior. The
new presets re-grant the delivery subset at the scope their persona actually works: one project
(Project Manager), the portfolio (Operations). What is deliberately **not** inherited: neither
Project Manager nor Operations receives the selling grants (assign leads, proposals, agent
performance), and none of the three heirs receives what v1 `Manager` never had — company
settings, catalog (except Operations via DD11), agent configuration, billing, or delete.

**Decision C rationale.** R16 rules the v1-derived scope and is not contradicted: nothing
v1-derived assumes a crew login, the coordinator attribution fallback stays (F2-07), and the
checklist behavior itself belongs to M08. What V2 adds is `BRIEF`-origin: the owner names
Installation Teams as primary users, so the preset ships — exactly the addition R16's own
consequence pre-authorized as structurally free. R16's constraint travels with it as a surface
law (F2-06): the reason v1 crew saw no money was that they saw no screen; a V2 crew screen must
uphold the invariant the old design got for free.

**Per-preset definitions.** The sections below are the anchors the persona document points at
("see F2 §\<persona\>"). Each states the preset's grant summary; the matrices in §F2.5 are the
binding cell-level truth, and where a summary and a matrix cell could ever be read differently,
the matrix cell wins.

#### EPC Owner

The v1 `Owner`, verbatim: "The business owner. Everything, always. Cannot be deleted or
restricted" (journey L1431). Every capability in every matrix, All visibility in every domain,
and the tenant-level administration nobody else holds: team and roles, agent configuration and
knowledge, platform billing. A tenant always retains at least one EPC Owner (F2-19).

#### Sales Manager

The v1 `Manager` preset's direct successor (F2-08a): Team lead visibility; add/edit and assign
leads; capture surveys; create/edit and send proposals; update project stages; record payments
and upload documents; see agent performance including the per-rep view; see company reports,
team-scoped. Not theirs: company settings, catalog and price book, agent configuration,
billing, deleting anything.

#### Sales Executive

The v1 `Sales rep`: Own-lead visibility; add/edit leads; capture surveys; create/edit
proposals including discounts; send proposals; mark won and lost. Not theirs: assigning to
others, deleting, project stages, recording payments, reports beyond their own step-back view.

#### Survey Engineer

The v1 `Surveyor`: assigned-only visibility; capture and submit surveys (a capability, not a
gatekeeper — anyone holding it uses the same flow, D15). Not theirs: leads, pricing, proposals,
stages, anything financial.

#### Design Engineer

The v1 `Designer` plus the folded v1 `Engineer` (decision A): assigned-only visibility; create
and edit designs; create/edit proposals including pricing and discounts; **approve or return
designs (sign-off)** under the F2-04 author rule. Not theirs: assigning leads, sending
proposals to customers, stages, payments, tenant administration.

#### Project Manager

New preset (decision B): own-projects visibility; update project stages; upload and verify
project documents; record payments against tranches; run the installation checklist as the
coordinator (F2-07). Not theirs: catalog, price book, agent configuration, billing, team
administration, the selling grants.

#### Field Technician

New preset: own-assigned-work visibility — their stops, check-ins, timeline and attendance.
Capability rows are M09's to append. Not theirs: other people's locations, leads, pricing,
proposals, any financial surface.

#### Installation Team Member

New preset (decision C): the narrowest scope in the product — the assigned installation job,
its checklist, photo capture against it. Every surface it grants obeys F2-06 (no commercial
figures, ever). Not theirs: anything else.

#### HR/Admin

New preset: people-scoped — employee records, documents, attendance and leave (M10 rows to
append). **Team and role administration is not delegated to this preset**: `F2.M01.manage-team`
stays EPC Owner-only, and because presets are fixed and per-person exceptions do not exist
(F2-15), there is no per-tenant arrangement that could widen it. Not theirs: leads, proposals,
designs, project money.

#### Finance

New preset: money-scoped — view and record payments against tranches, attach receipts, read
the money side of any project; views catalog prices and margins (DD11). Not theirs: building
or discounting proposals, stages, catalog administration, team administration, the tenant's own
platform billing.

#### Operations

New preset (decision B): portfolio-scoped — stages, documents and blockers across all projects;
field-workforce team visibility; and, with the EPC Owner, **manages the catalog and publishes
price-book versions** (DD11 — see `F2.M01.manage-catalog`). Not theirs: agent configuration,
team and role administration, billing, payments recording.

#### Marketing

New preset: campaign-scoped — create and run campaigns, see what they captured, hand captured
enquiries into the lead queue (M03 rows to append). Not theirs: lead visibility beyond their
captures, assignment, pricing, proposals.

**Edge cases & what-goes-wrong.**

- **Sign-off by the author.** In a one-person or owner-does-everything tenant the same person
  may hold create-designs and sign-off (the v1 matrix already granted the Owner both). The
  approval record names the approver regardless, so the record itself shows author = approver;
  the product does not silently pretend a second person reviewed. Recorded as a carried v1
  property, not resolved into a new blocking rule (F2-04).
- **A preset the tenant does not use** simply sits unassigned — the Roles reference (M01)
  shows how many people hold each, including zero. No preset can be hidden or removed (F2-02).
- **A person holding both Field Technician and Installation Team Member** gets both grant sets
  by OR (F2-11); the installation surfaces they reach still obey F2-06 — stacking never
  weakens a surface law.

**Acceptance criteria.**

- Given any tenant, when the role list is read, then exactly the twelve presets of F2-01 exist,
  by exactly those names, and no tenant-created role exists (F2-01, F2-02).
- Given a design awaiting sign-off, when a holder of `F2.M05.approve-designs` approves or
  returns it, then the act is recorded with who and when, and a return reaches the author with
  comments pinned to the specific problem (F2-03, F2-04).
- Given any screen reachable through Installation Team Member grants, when it renders, then no
  price, discount, tranche, margin or customer value appears on it (F2-06).
- Given a checklist step completed by a coordinator, when it is ticked, then the tick is
  attributed to the coordinator and an optional "done by" free-text names the crew member
  (F2-07).
- Given a person holding only Sales Manager, when they act, then every v1 `Manager` matrix
  grant is available to them and no more (F2-08).

**Localization notes.** The twelve preset names are product vocabulary, translated EN/HI/MR per
`foundations/F3-localization.md`; the name shown on team chips, assignment pickers and audit
entries is the localized name; the canonical identity is the fixed English name in this
document. **Analytics events:** role assigned / role removed (with old → new set), sign-off
approved / returned.

### F2.2 — Role semantics: stacking, OR-across-roles, visibility

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F2-10 | **One person can hold several presets — stacking is the design.** The census states it: "Six fixed preset roles; one person may hold SEVERAL. Permission granted if any held role grants it; lead visibility takes the widest" (D27 — the count widens to twelve per DD3, the law is unchanged). The small-firm problem — one person is rep *and* surveyor *and* designer — is solved by stacking, never by building a custom role. The team list shows all roles a person holds as chips. | `SRC` — `D27` (*retired: D-census ledger*; docs/15: HONORED); *retired: product journey* §ROLES & PERMISSIONS L1417–1422, L1471–1483 | P0 |
| F2-11 | **OR across roles.** The permission check is exactly: *does any of my held roles grant this?* Permission granted if any held role grants it — there is no AND, no precedence, no negative grant; a preset can only add. | `SRC` — `DOC08.roles-or` (docs/engineering/08); journey L1479 | P0 |
| F2-12 | **The visibility-scope law (D20), verbatim:** "Reps see only their own leads. Managers see the team's, owner sees everything." Restated by the source's dashboard rules as "Visibility follows role (D20): a rep sees only their own, a manager their team, the owner everything. The same screen, scoped" (journey L1538–1539). Every list, board, report and dashboard in the product is the same surface, scoped by role — never a different surface per role. | `SRC` — `D20` (*retired: D-census ledger*; docs/15: HONORED — role scoping); journey L1538–1539 | P0 |
| F2-13 | **Widest scope wins within a domain.** When held roles carry different visibility scopes in the same domain, the widest applies — a Sales Executive + Sales Manager sees Team; anyone + EPC Owner sees All. The team list shows which role is doing the work (journey L1507–1508). | `SRC` — `D27` ("lead visibility takes the widest"); `DOC08.matrix.lead-visibility`; journey L1479–1481, L1507–1508 | P0 |
| F2-14 | **Visibility resolves per domain, and never leaks across domains.** V2 has more scope domains than v1's single lead axis: leads (Own ⊂ Team ⊂ All; Assigned beside Own for the assigned-only presets), projects (Own projects ⊂ Portfolio ⊂ All), field work (Own ⊂ Team ⊂ All), people records, money, campaigns. The widest-wins rule of F2-13 applies **inside each domain independently**; holding a wide scope in one domain never widens another (a Sales Manager + Field Technician sees the team's leads and only their own route). The EPC Owner's "everything, always" is All in every domain. | `BRIEF` — *retired: PRD design note* §2 DD3 ("widest visibility wins", widened to the persona set) · grounded in source at `D20`/`D27`; resolves this document's half of `02-personas.md` §6 question D | P0 |
| F2-15 | **No per-person permission exceptions, ever (D28), verbatim:** "To know what someone can do, you look at their roles — one source of truth. Exceptions are how permission systems become unauditable." There is deliberately no per-user override anywhere in the product; every grant is explicable as "holds preset X". | `SRC` — `D28` (*retired: D-census ledger*; docs/15: HONORED — permissions derive purely from roles); `DOC08.no-per-user-exceptions` | P0 |
| F2-16 | **No custom roles (D29), verbatim:** "Custom roles deferred to v2. Ship the six, watch which combinations companies actually ask for, then add the presets they wanted — rather than guessing at a checkbox editor nobody fills in." V2 is that watched step and its answer is DD3: the presets the personas wanted, **still fixed, still no editor**. The v1 phrase "deferred to v2" does not make a role editor V2 scope — DD3 rules the V2 box ships expanded fixed presets only, and adding a future preset is a product release, not a tenant action. | `SRC` — `D29` (*retired: D-census ledger*; docs/15: HONORED); *retired: product journey* L1493–1496 · V2 position per design spec §2 DD3 | P0 |
| F2-17 | **Mid-task permission loss is graceful.** If a role is removed while someone is mid-task, the current in-flight action completes; the restriction applies from the next action — no mid-flight error storms. | `SRC` — `DOC08.midtask-permission` (docs/engineering/08); journey L1504–1505 | P1 |
| F2-18 | **Roles bind only within the tenant's user audiences.** Every preset is held by an Owner-or-Employee user; the customer is never a role, never appears in a matrix, and reaches the product only through F5's tokenised link. | `SRC` — `DOC00.three-audiences` (D7; dispositioned by Task 3, role semantics pointed here); `D5` via `02-personas.md` `PS-04` | P0 |

**Behavior detail.** The three laws compose in a fixed order a reader can verify by hand:
first collect the person's presets (F2-10); a capability is granted if any preset's matrix cell
grants it (F2-11); a visibility scope is, per domain, the widest any preset grants (F2-13,
F2-14). Nothing else participates: no per-person flag (F2-15), no tenant-shaped role (F2-16),
no object- or field-level rule (§5). This is what keeps the answer to "what can this person
do?" a one-line sentence — the v1 design's stated reason for existing (journey L1420–1425).

**Edge cases & what-goes-wrong** (carried from journey §ROLES & PERMISSIONS L1498–1510, each
item present; the administration items are requirements in §F2.3):

- *Someone holds two roles with different lead visibility* → the widest applies, and the team
  list shows which one is doing the work (F2-13).
- *A permission is removed while someone is mid-task* → they finish what they started; the
  restriction applies to the next action (F2-17).
- *A role is deleted while people hold it* → cannot happen in this release: presets cannot be
  deleted (F2-02). Carried so the guard is stated rather than assumed; if a future release ever
  retires a preset, people holding it must be moved first (journey L1502–1503).
- *Owner removes their own admin rights* / *last person with Manage team is removed* → blocked
  with an explanation (F2-19).
- *Person invited with no role at all* → blocked (F2-21).
- *Person leaves the company* → deactivate, never delete (F2-20).

**Acceptance criteria.**

- Given a person holding Sales Executive + Survey Engineer, when they open any lead list, then
  they see their own leads (widest of Own and Assigned), and both grant sets are available by
  OR (F2-10, F2-11, F2-13).
- Given a person holding Sales Manager + Field Technician, when they open the field surfaces,
  then they see the field team's day only if a field-domain scope grants it — their Team *lead*
  scope changes nothing outside the lead domain (F2-14).
- Given any user, when an administrator asks what they can do, then the answer is fully
  determined by their preset list — no per-person exception exists to consult (F2-15).
- Given any tenant, when roles are administered, then no create-role, edit-role or
  delete-role action exists on any surface (F2-16, F2-02).
- Given a user whose role is removed mid-action, when the in-flight action completes, then it
  succeeds and the next action is what the restriction applies to (F2-17).

**Localization notes.** Scope words shown to users (own, team, all, assigned) are translated
per F3; the plain-English grant line M01 renders ("Rajesh can sell, survey and design") is
composed from localized capability phrases. **Analytics events:** none beyond §F2.1's
role-change events; visibility resolution is not an event.

### F2.3 — Role administration guard rails

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F2-19 | **A tenant always retains at least one EPC Owner, and at least one person holding Manage team.** An owner removing their own admin rights, or the removal of the last Manage-team holder, is blocked with an explanation. Enforced as guarded transitions, not UI-only. | `SRC` — `DOC08.min-owner` (docs/engineering/08); journey L1499–1501 | P0 |
| F2-20 | **People are deactivated, never deleted.** Deactivation revokes sessions and hides the person from assignment pickers; every lead, activity, tick and money event they touched stays attributed to them, and their open work gets reassigned. Deleting a user — which would orphan their history — does not exist. | `SRC` — `DOC08.deactivate-never-delete` (docs/engineering/08); journey L1509–1510, L1518–1519 | P0 |
| F2-21 | **An invitation carries at least one preset.** Inviting a person with no role at all is blocked — they would sign in and see nothing. (The invite flow itself — name, phone, roles — is M01's.) | `SRC` — *retired: product journey* §ROLES & PERMISSIONS L1506 | P1 |

**Behavior detail.** These are the transitions that keep the role system self-consistent: the
tenant can never lock itself out (F2-19), never orphan history (F2-20), never mint a user who
lands on nothing (F2-21). All three surface in M01's Team and Invite screens; all three are
guarded at the transition itself so no other surface can bypass them; all three write audit
entries, including the *blocked attempts* of F2-19 (F2-22's covered-events list names them).

**Edge cases & what-goes-wrong.** Covered by the same journey list carried in §F2.2 — the three
rows above are the requirement form of items 1, 2, 5 and 7 of L1498–1510.

**Acceptance criteria.**

- Given a tenant with one EPC Owner, when anyone attempts to remove that person's Owner preset
  or deactivate them, then the attempt is blocked with an explanation and the blocked attempt
  is audit-logged (F2-19, F2-22).
- Given a person who leaves, when they are deactivated, then their sessions end, they leave
  assignment pickers, and their history stays attributed to them (F2-20).
- Given an invite composed with zero roles, when it is submitted, then it is blocked before
  sending (F2-21).

**Localization notes.** Guard-rail explanations are user-facing copy, translated per F3.
**Analytics events:** deactivation, blocked guard-rail attempts (also audit events per F2-22).

### F2.4 — Audit & accountability

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F2-22 | **An append-only audit log exists, and its covered-events list is the acceptance checklist:** auth events; team invite / role changes (old → new) including blocked last-Owner and last-Manage-team attempts; tenant settings, branding, catalog and price-book changes; money events (proposal generate/send/version, discount applied with amount and who, tranche edits, payment recorded, Won/Lost/Cancelled-after-Won); customer-link mint/re-mint/revoke/open/Accept-Negotiate-Decline with attribution; **the send of the plain payment-request message from the tenant's connected official channel, recorded under the name of the person who sent it — whatever preset that person holds, the project-visibility-only reader of `F2.M11.send-request-message` included (owner ruling 2026-08-06, `Q52`) — the covered event being that send and nothing else: where no channel is connected the product only composes the message and places it on the clipboard, a person sends it outside the product, and nothing at all is written to this log for that path (owner ruling 2026-08-06, `Q57`)**; design sign-off approve/return with who and when (the engineer-led structural safety record); agent config changes (version id), knowledge-base edits, queue changes, DND/consent changes, escalations; billing plan changes, subscription transitions, entitlement overrides; credential lifecycle and every decrypt; data-rights requests and completions; admin/back-office access to tenant data. Entries are written with the change that caused them, never reconstructed after the fact. *(**Amended by owner ruling 2026-08-06, `Q52`**, which adds one clause to the checklist and changes nothing else in it. The clause between "…Accept-Negotiate-Decline with attribution;" and "design sign-off approve/return…" did not exist: this cell named no message send anywhere, and that absence is what stood open at §6 `F2-Q2` and at `modules/M11-payments-and-collections.md` §6 `M11-Q5`. The ruling's reason, recorded: the message leaves the company's official channel and reaches a customer about money, which is what this log exists for, and the entry answers "who messaged my customer?" instantly. Every other covered event, and the written-with-the-change discipline, is unchanged.)* *(**Further amended by owner ruling 2026-08-06, `Q57`**, which draws the boundary of the `Q52` clause and adds no covered event to the checklist. That clause previously ended at "…the project-visibility-only reader of `F2.M11.send-request-message` included (owner ruling 2026-08-06, `Q52`)" and said nothing about the copy-paste fallback; the silence is what stood open at §6 `F2-Q3` and at `modules/M11-payments-and-collections.md` §6 `M11-Q6`. The owner ruled the simpler of the two options in their own words — *"keep as much as simple. and dont do overengineering"* — so **no compose record, no copy record, no counter and no timeline entry is written for the fallback path**. The accepted trade, recorded honestly rather than compensated for: the same chase, to the same customer, about the same tranche, is attributable when the product sends it from the connected channel and unrecorded when a person sends it outside the product. That is a deliberate simplification, not an oversight — this log records what the product performed, and the standing law is that the product never claims what it did not do. Every other covered event, the `Q52` clause's own terms and the written-with-the-change discipline are unchanged.)* | `SRC` — `DOC08.audit-coverage` (docs/engineering/08) — **unsuperseded and carried whole**; the payment-request-message-send clause is `BRIEF` — **owner ruling 2026-08-06 (`Q52`)**, widening the checklist where `DOC08` is silent, with its connected-channel boundary `BRIEF` — **owner ruling 2026-08-06 (`Q57`)**, which adds no event and narrows nothing already covered | P0 |
| F2-23 | **The audit log is tenant-scoped and the tenant's own:** retained 24 months hot, then archived; tenants can export their own log. | `SRC` — `DOC08.audit-tenant-export` (docs/engineering/08) | P1 |
| F2-24 | **Admin/back-office impersonation is read-only and always audited.** Platform staff viewing a tenant's data never mutate as the tenant, and every such access appears in the F2-22 log. | `SRC` — `DOC08.admin-impersonation` (docs/engineering/08) | P0 |

**Behavior detail.** The audit log is where F2-15's promise is kept honest: because permissions
derive purely from roles, the log's role-change events (old → new) are a complete history of
who could do what, when. The covered-events list is deliberately product-wide — the modules
whose events it names (M01, M05, M06, M11, M12, F5, M07) inherit their audit obligations from
this row and do not restate divergent lists.

**Edge cases & what-goes-wrong.** A blocked guard-rail attempt (F2-19) is itself an audit
event — silence about a blocked act is how lockout disputes become unanswerable. An exported
log is the tenant's data; export always works regardless of billing state (the suite's
read-and-export law, `04-business-model.md`).

**Acceptance criteria.**

- Given any event named in F2-22's list, when it occurs, then an append-only entry exists
  recording who, what and when — including for blocked attempts (F2-22).
- Given the plain payment-request message sent from the tenant's connected official channel,
  when the send occurs — including where the sender holds project visibility alone — then an
  append-only entry records it under the name of the person who sent it (F2-22,
  `F2.M11.send-request-message`). *(Added by owner ruling 2026-08-06, `Q52`, which closed §6
  `F2-Q2`; no other line in this block changes.)*
- Given a tenant with **no** connected official channel, when the same payment-request message is
  composed, copied and sent by a person outside the product, then the audit log contains no entry
  for that act — no compose record, no copy record, no send record — and no surface claims one
  (F2-22, `F2.M11.send-request-message`). *(Added by owner ruling 2026-08-06, `Q57`, which closed
  §6 `F2-Q3`: the log records what the product performed, and on that path it performed no send.
  No other line in this block changes.)*
- Given a tenant administrator, when they export the audit log, then they receive their own
  tenant's entries and no other tenant's (F2-23).
- Given a platform-staff access to tenant data, when it occurs, then it is read-only and an
  audit entry records it (F2-24).

**Localization notes.** Audit entries render in the viewer's language; the underlying record is
language-independent. **Analytics events:** none — the audit log is not an analytics stream.

### F2.5 — The per-module permission matrices

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F2-25 | **The matrices below are the only permission truth in the suite.** One table per module `M01`–`M13` plus the F5 customer-link surfaces; columns are the twelve presets of F2-01, in fixed order; rows are capabilities phrased in plain language, never as CRUD on entities (journey L1440–1441). Rows already fixed by source or owner ruling are filled here; every placeholder row is replaced by the owning module task's rows, appended **in this document**. Module PRDs reference their rows by row key (`F2.M<nn>.<slug>`); no module document restates a matrix. The closure pass verifies no placeholder remains. | `BRIEF` — *retired: PRD design note* §2 DD3, §12; authoring-plan matrix-skeleton mandate · row phrasing law from source, journey L1440–1441 | P0 |
| F2-26 | **Every v1 capability row survives.** The v1 matrix's 16 capabilities (journey L1443–1461; `DOC08.matrix.*`) all appear below with their v1 grants either carried verbatim onto the successor presets or superseded by a recorded owner ruling (DD11 is the only supersession; billing is restored per the overlay). The set widened from six presets to twelve, but no v1 grant was silently dropped or narrowed (`DOC08.six-roles` disposition: superseded in count, carried in content). | `SRC` — `DOC08.six-roles` + the 17 `DOC08.matrix.*` rows (docs/engineering/08; journey L1443–1461) | P0 |

**How to read the matrices.** ✓ = the preset grants the capability; — = it does not; a phrase
in a cell is a scoped grant (the scope word is the grant). Grants compose by OR across a
person's presets (F2-11). Cells for the six v1-lineage presets on filled rows are `SRC` (the
v1 matrix carried per F2-08); cells for the six new presets on filled rows are this document's
ruling (`BRIEF`, grounded in the persona scopes of `02-personas.md` and decisions A–C). The
**Source** column names the key(s) behind the row. Column order is fixed: EPC Owner · Sales
Manager · Sales Executive · Survey Engineer · Design Engineer · Project Manager · Field
Technician · Installation Team Member · HR/Admin · Finance · Operations · Marketing.

#### F2.5-M01 — Onboarding & tenant configuration

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M01.manage-team` · Manage team and roles | ✓ | — | — | — | — | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.manage-team` (journey L1458) |
| `F2.M01.configure-agent` · Configure the agent and its knowledge | ✓ | — | — | — | — | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.configure-agent` (journey L1456) |
| `F2.M01.manage-catalog` · Manage catalog and price book (author items, publish price-book versions) | ✓ | — | — | — | — | — | — | — | — | view prices & margins | ✓ | — | `SRC` `DOC08.matrix.manage-catalog` (journey L1459) **superseded** by `BRIEF` design spec §2 **DD11**: Owner + Operations manage, Finance views prices/margins |
| `F2.M01.manage-tenant-settings` · Configure tenant settings (business profile, branding, document templates, payment-term templates, message templates, capture settings, locale defaults, integration credentials) | ✓ | — | — | — | — | — | — | — | — | — | — | — | `SRC` `DOC04.tenant-settings` + journey §Tenant configuration (`TC.*` areas — owner-configured throughout); audit per `F2-22` — appended by Task 12 (M01) |
| `F2.M01.add-own-catalog-items` · Add tenant catalog products inline while designing or quoting (single product · datasheet PDF · spreadsheet import at proposal time) | ✓ | ✓ | ✓ | — | ✓ | — | — | — | — | — | ✓ | — | `SRC` `TC.config-ux.2` ("offer to add it to the catalog *there*") + `BRIEF` design spec §2 DD9 (self-serve inline add) — appended by Task 12 (M01) |

Notes: **all twelve presets pick from the catalog** at design/proposal time (DD11 — picking is
not managing). The v1 Owner-only rule on this row is the suite's one grant-set supersession;
`02-personas.md` §Operations records the same supersession persona-side. The
`add-own-catalog-items` grant follows proposal/design authoring (the presets that build pick,
and DD9 makes the missing-item add self-serve at that moment); full catalog administration —
overrides, archiving, release and price-book publishing — remains `manage-catalog` (DD11).

#### F2.5-M02 — CRM & leads

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M02.lead-visibility` · Lead visibility scope (the F2-12 law as cells) | All | Team | Own | Assigned | Assigned | Own projects' deals (read) | — | — | — | — | Portfolio deals (read) | Own captures until triage | `SRC` `DOC08.matrix.lead-visibility` + `D20` (journey L1445); new-preset cells `BRIEF` per F2-14 |
| `F2.M02.add-edit-leads` · Add and edit leads | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.add-edit-leads` (journey L1446) |
| `F2.M02.assign-leads` · Assign leads to others | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.assign-leads` (journey L1447) |
| `F2.M02.delete-leads` · Delete leads | ✓ | — | — | — | — | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.delete-leads` (journey L1448) |
| `F2.M02.dedupe-override` · Create a lead despite a detected duplicate (reason mandatory, audited) | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | `SRC` `UXG-02` ("Create anyway (reason mandatory, audited)"); grant follows `F2.M02.add-edit-leads` — every preset that can capture meets the sheet — appended by Task 13 (M02) |
| `F2.M02.import-leads` · Bulk-import leads from a file (mapping → preview → import) | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | `SRC` `D13` (CSV a v1 source) + `UXG-01` ("Desktop-first (owner at a desk)"); new-row cells `BRIEF` per F2-25 — bulk creation is a triage-side act; a rep's capture path is quick-add under `add-edit-leads`, which is not narrowed — appended by Task 13 (M02) |
| `F2.M02.lead-state-changes` · Move a lead into and out of the parking/terminal states (snooze, disqualify, junk, reopen) | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | `SRC` `R9` (the seven-state machine; `modules/M02` §M02.10). Scope follows `F2.M02.lead-visibility`. Mark-won / mark-lost are the close surfaces and stay with `modules/M07`'s rows (F2 §F2.1 Sales Executive); dormancy is system-set and grantable to nobody — appended by Task 13 (M02) |
| `F2.M02.book-site-visit` · Book a site visit from a lead (date, time, surveyor, address) | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | `SRC` `S3.screen.4`; the visit object, the surveyor's capture flow and its states are `modules/M04`'s rows (`F2.M04.capture-surveys`, `D15`) — appended by Task 13 (M02) |
| `F2.M02.merge-customers` · Merge two customer records onto a survivor (irreversible, audited) | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | `SRC` `R8` + `UXG-05` (in v1 scope per `OD-5`); new-row cells `BRIEF` per F2-25 — merge re-points references across a team's records, so it sits with the presets that hold Team-or-wider lead visibility — appended by Task 13 (M02) |

Notes: Marketing's campaign capture (enquiry → lead handover) is an M03 capability, not this
table's add-edit grant; Finance's read of a project's money side rides the M11 rows, not lead
visibility.

Notes for the M02 rows appended by Task 13: **merge is additionally scope-conditioned** — a
holder of `F2.M02.merge-customers` may merge only where **both** records fall inside their own
lead-visibility scope (F2-13/F2-14), so a Sales Manager never re-points a record they cannot
see; the condition is a property of the act, not a new permission (F2-15 stands). The dedupe
sheet itself needs no grant beyond `add-edit-leads` — only its third choice does — so no capture
path can dead-end for want of a permission.

#### F2.5-M03 — Marketing

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M03.campaign-visibility` · Campaign visibility scope (the `F2-14` **campaigns** domain as cells) | All | Read (results) | — | — | — | — | — | — | — | — | — | All | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §Marketing + §Users, via `PS-35`/`PS-36`; domain named by `F2-14`; Sales Manager's read is the pipeline-input half of `modules/M03` `M03-56` — appended by Task 21 (M03) |
| `F2.M03.manage-campaigns` · Create, schedule, run, pause and cancel campaigns | ✓ | — | — | — | — | — | — | — | — | — | — | ✓ | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §Marketing ("The platform should manage marketing campaigns") + `PS-35` (the Marketing persona runs demand generation); `modules/M03` §M03.2 — appended by Task 21 (M03) |
| `F2.M03.build-campaign-audience` · Build a campaign audience from CRM segments — resolved over the **whole lead base, aggregate-only** (filters, counts, send-selection; **no individual lead-file read**), in counts rather than a browsable list | ✓ | ✓ | — | — | — | — | — | — | — | — | — | ✓ | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §Marketing · audience scope per **owner ruling 2026-08-04 (Q37: segments-yes-files-no)** — the capability is a distinct aggregate-only scope over the whole base; record-level reads stay governed by `F2.M02.lead-visibility` (`F2-12`–`F2-15` unchanged) — appended by Task 21 (M03), widened by the Q37 ruling |
| `F2.M03.author-campaign-content` · Author campaign content and per-language campaign templates, and submit them for channel registration | ✓ | — | — | — | — | — | — | — | — | — | — | ✓ | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §Marketing; content class carried from `SRC` `M01-55`/`F3-10` (the tenant-wide message-template surface stays `F2.M01.manage-tenant-settings`); `modules/M03` §M03.5 — appended by Task 21 (M03) |
| `F2.M03.manage-channel-connections` · Connect, reconnect and disconnect a channel identity (email, business messaging, SMS, social, website form) | ✓ | — | — | — | — | — | — | — | — | — | — | — | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §Marketing (the channels) · Owner-only by the same rule that keeps integration credentials Owner-only (`F2.M01.manage-tenant-settings`): a channel identity is the tenant's own name, registration and reputation (`modules/M03` `M03-18`, which extends `CG-14`'s business-messaging pattern to every channel as `BRIEF` — the verdict itself is `SRC` for business messaging only) — appended by Task 21 (M03) |
| `F2.M03.approve-campaign-spend` · Approve spend-adjacent campaign settings — a send beyond the included allowance, an overage-incurring schedule, a paid-social budget link | ✓ | — | — | — | — | — | — | — | — | — | — | — | `BRIEF` *retired: PRD design note* §2 `DD5`/§8 (metered bundles + overage are a commercial commitment) via `BM-21`/`BM-34`; Owner-only per `02-personas.md` EPC Owner (the tenant's commercial decisions) — appended by Task 21 (M03) |

Notes for the M03 rows appended by Task 21: **Marketing is primary and the EPC Owner controls
what costs money.** The split reads directly off the two origins the module has — the brief makes
Marketing the persona that "manage[s] marketing campaigns" and captures leads (`PS-35`, `PS-36`),
so `manage-campaigns`, `author-campaign-content` and `build-campaign-audience` are theirs; and
everything with a commercial or identity consequence stays with the EPC Owner, matching how this
document already treats integration credentials and tenant-binding settings
(`F2.M01.manage-tenant-settings`). Two rows are Owner-only for that reason:
`manage-channel-connections`, because a connected channel is the tenant's own registered identity
and reputation and not a campaign-level choice, and `approve-campaign-spend`, because a send
beyond the included allowance incurs metered overage (`BM-21`, `BM-34`) — the rationale
`02-personas.md` `PS-35`/`PS-36` implies but does not itself rule. **No new visibility domain is
invented:** `F2-14` already names **campaigns** as a domain, and `F2.M03.campaign-visibility` is
that domain's cells; the leads *behind* a campaign remain scoped by `F2.M02.lead-visibility`, so a
campaign's capture list shows a Sales Manager their team's captures and the Owner everything — the
same surface, scoped (`F2-12`). **`build-campaign-audience` is an aggregate-only capability over the whole base — the owner's
2026-08-04 ruling (Q37: segments-yes-files-no)** replaced the former own-scope-only conservative
reading: any holder resolves segments, counts and send-selection across the tenant's full lead
base, while **record-level reads remain governed by `F2.M02.lead-visibility` unchanged** — no
lead file, value or note opens through the builder, no per-person exception exists (`F2-15`
stands), and the Marketing preset's *Own captures until triage* cell still governs what records
Marketing can *open*. This is exactly the third option the register's `Q37` row named (a
campaign-domain scope permitting aggregate counts without record visibility), consistent with
the dedupe sheet's minimal-disclosure precedent (`M02-08`, confirmed at `Q23`). The Sales
Manager's ✓ remains: resolving a segment over the whole base now discloses only aggregates,
which is no more than the Marketing holder sees, and `manage-campaigns` still decides who can
act on an audience.

#### F2.5-M04 — Survey

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M04.capture-surveys` · Capture site surveys | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.capture-surveys` (journey L1449); a capability, not a gatekeeper — one flow for every holder (`D15`, `PS-14`) |
| `F2.M04.run-remote-survey` · Run a remote survey (address → imagery → AI roof detection); manual outlining is inside this grant and is never metered | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | `SRC` `D30` / `S4.rule.two-modes` (the remote mode is the desk-side survey — "a designable roof, from a desk, in minutes") **+ journey L339** (Stage 4 · Mode A, **"Who: rep or designer, at a desk, minutes after the lead arrives"** — the source names the **designer** beside the rep for remote survey; the Task-2 ledger's `S4.*` slice did not capture this line, and the omission is recorded rather than silently resolved per design spec §3.5). **Two capabilities, read deliberately — the Design Engineer cell does not contradict the roles matrix:** `DOC08.matrix.capture-surveys` (journey L1449) withholds `F2.M04.capture-surveys` from the Design Engineer and governs **field capture**; this row governs **desk-based remote survey**, which L339 grants the designer. No cell of `F2.M04.capture-surveys` is widened and no per-person exception is created (F2-15). Named separately from capture because it also consumes a metered capability (`BM-19`, `modules/M04` `M04-23`). The studio's own in-canvas detection entry point is `modules/M05`'s row, not this one — appended by Task 14 (M04) |
| `F2.M04.schedule-survey-visits` · Schedule, reassign and cancel site-survey visits | ✓ | ✓ | ✓ | Own visits | — | — | — | — | — | — | — | — | `SRC` `DOC04.visits` (the visit is a scheduled assignment) + `S3.screen.4` / `F2.M02.book-site-visit` (the booking act from a lead is M02's, and produces this object); Survey Engineer's **Own visits** cell is the could-not-complete reschedule the source requires on the doorstep (`S4.wrong.9`) — appended by Task 14 (M04) |
| `F2.M04.resolve-survey-gaps` · Resolve or waive a remote-survey gap (ask the customer · capture on site · resolved · waived) | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | `SRC` `DOC04.survey-gaps` (docs/04 — the four resolutions); grant follows the two capture grants because closing a gap is survey work; waiving is audited (`F2-22`) — appended by Task 14 (M04) |

Notes for the M04 rows appended by Task 14: **survey visibility is not a new domain.** A survey,
its versions, its photographs and its visits are read by whoever's scope already contains the lead
or site they belong to (`F2.M02.lead-visibility`, F2-12–F2-14) — so the Design Engineer reads the
survey of a lead assigned to them and the Project Manager reads the survey of a project they own,
without a grant of their own here. No preset gains a survey-only visibility scope and no per-person
exception exists (F2-15). **Neither capture row is a gatekeeper:** `D15` makes surveying a task
assignable to anyone holding it, with one identical capture flow for every holder (`PS-14`), so no
cell in these rows may be read as "this persona surveys and that one does not". **The Design
Engineer holds remote survey but not field capture, and that asymmetry is the source's own** —
journey L339 names "rep or designer" for Mode A at a desk, while the roles matrix (L1449) withholds
the capture-surveys grant; the two rows describe two different capabilities and are not in
conflict.

#### F2.5-M05 — Design studio

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M05.create-edit-designs` · Create and edit designs | ✓ | — | — | — | ✓ | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.create-edit-designs` (journey L1450) |
| `F2.M05.approve-designs` · Approve designs (sign-off) — approval capability, F2-04 author rule applies | ✓ | — | — | — | ✓ | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.approve-designs` (journey L1451); v1 grantee `Engineer` folded into Design Engineer per decision A (F2-03) |
| `F2.M05.run-roof-detection` · Run in-canvas AI roof detection on the studio canvas (manual tracing inside `create-edit-designs` is never metered and needs no separate grant) | ✓ | — | — | — | ✓ | — | — | — | — | — | — | — | `SRC` `SC.10-3.03`/`SC.10-3.10` (the studio's Detect tool; the validated-artifact doorway is `modules/M04` `M04-65`, the in-canvas surface `modules/M05` `M05-23`). Named separately from `create-edit-designs` because it consumes the metered detection capability (`BM-19`; allowance mechanics `modules/M12`), following `F2.M04.run-remote-survey`'s precedent — see that row's note pointing the studio's in-canvas entry here. Grantees are exactly the `create-edit-designs` holders; no cell is widened (`F2-15`). Appended by Task 15 (M05) |

Notes on §F2.5-M05 (recorded by Task 15): **design visibility is not a new permission
domain.** Designs are children of leads, and reading them follows `F2.M02.lead-visibility`
exactly as survey visibility does (§F2.5-M04 notes): sales roles (Sales Manager, Sales
Executive) and other lead-visible readers open design cards, the variants compare and the
**read-only** studio and 3D view through their existing lead scope, with no design grant of
their own — `DOC08.matrix.create-edit-designs` (journey L1450) withholds editing from every
sales role, and the read-only studio is a display state of `modules/M05` (its every mutating
control absent), not a permission row. The engineer sign-off queue and approve/return remain
`F2.M05.approve-designs`'s alone (author rule `F2-04`); the customer's read-only 3D share
surface is `foundations/F5`'s no-login link, not a role grant. No placeholder remains for M05.

#### F2.5-M06 — Proposals

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M06.create-edit-proposals` · Create and edit proposals — includes applying discounts; there is no separate discount permission and no approval flow (D34) | ✓ | ✓ | ✓ | — | ✓ | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.create-edit-proposals` (journey L1452, L1463–1466) |
| `F2.M06.send-proposals` · Send proposals to customers | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.send-proposals` (journey L1453) |

Notes on §F2.5-M06 (recorded by Task 16): **the two source rows are the complete M06 grant set —
no row is added, deliberately.** `D34` rules that no discount approval exists, so there is no
approval grant to place (`create-edit-proposals` includes discounting, per its own row text);
duplicating, versioning, previewing, editing the Path A BOM detail and withdrawing a competing
proposal are all forms of creating/editing a proposal and ride `F2.M06.create-edit-proposals`;
Download PDF, Copy link and the explicit mark-shared act are the send surface and ride
`F2.M06.send-proposals`. **Proposal visibility is not a new permission domain**: proposals are
children of leads and are read through `F2.M02.lead-visibility` exactly as designs and surveys
are (§F2.5-M04/§F2.5-M05 notes' precedent) — Project Manager and Operations read the proposals
of projects in their scope without a grant of their own, and no preset gains a proposal-only
scope (F2-15). The build/send asymmetry is the source's: the Design Engineer builds and edits
proposals but does not send — *"designer or rep builds, rep sends"* (`S6.rule.one-object`,
`modules/M06-proposals.md` §2). Proposal generate/send/version, discount applied (amount, who)
and share/link events are audit-log events per `F2-22`. No placeholder remains for M06.

#### F2.5-M07 — Sales execution

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M07.agent-performance` · See agent performance (the per-rep view is Sales Manager's and the EPC Owner's) | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.agent-performance` (journey L1457); `AP.screen.4` |
| `F2.M07.hand-lead-to-agent` · Hand a lead to the voice agent on demand (D17's second trigger path) | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | `SRC` `D17` ("on demand when a rep hands a lead to it"); scope follows `F2.M02.lead-visibility` — appended by Task 17 (M07) |
| `F2.M07.see-agent-queue` · See the agent call queue (who is scheduled, when, and why) | All | Team | Own | — | — | — | — | — | — | — | — | — | `SRC` `S7.screen.2` + `D20` scoping (F2-12) — appended by Task 17 (M07) |
| `F2.M07.control-agent-queue` · Remove or cancel queued agent calls (Owner: anything; queuing rep: own queued entries; every cancellation logged to the lead timeline) | ✓ | Own queued | Own queued | — | — | — | — | — | — | — | — | — | `SRC` `S7.screen.2` ("The owner can remove anyone from it"); `DOC04.call-queue-compliance` ("owner can cancel queued calls"); queuing-rep-cancels-own widening per **owner ruling 2026-08-04 (Q31)** — appended by Task 17 (M07), widened by the Q31 ruling |
| `F2.M07.mark-won-lost` · Mark a lead won or lost (the close surfaces; mandatory reason on lost) | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | `SRC` F2 §F2.1 Sales Executive ("mark won and lost", v1 `Sales rep` scope, journey L1433) + `S7.screen.6`/`S7.screen.7`; routed here by `F2.M02.lead-state-changes`'s note; scope follows `F2.M02.lead-visibility` — appended by Task 17 (M07) |

Notes on §F2.5-M07 (recorded by Task 17): **agent configuration is not re-granted here** —
the agent, its knowledge base, its hand-over/routing rules, its IVR flows and every promotion
of a correction or unanswered question into the knowledge base ride `F2.M01.configure-agent`
(EPC Owner only, per the v1 matrix: "Configure the agent and its knowledge: Owner only"),
and number provisioning rides `F2.M01.manage-tenant-settings` — the agent's controls are the
Owner's, per source. Queue **visibility** is scoped like leads (the brief's "reps see own
queue"); queue **control** (remove/cancel) is the EPC Owner's for anything, and — per the
owner ruling of 2026-08-04 (Q31) — the **queuing rep's for their own queued entries**, with
every cancellation logged to the lead timeline (`M07-35`; the strict Owner-only interim is
retired).
Correcting a call's outcome (`S7.wrong.7` — "rep's assessment always wins") is not a grant of
its own: it rides lead visibility exactly as call results do, and reaches agent behaviour only
through the Owner-only R10 promotion. My Day, call results, transcripts and the escalations
list are lead-scoped read surfaces (`F2.M02.lead-visibility`), not permission rows. Won/Lost,
agent-config versions, knowledge-base edits, queue changes, DND/consent changes and
escalations are audit-covered events per `F2-22`. No placeholder remains for M07.

#### F2.5-M08 — Projects

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M08.update-stages` · Update project stages | ✓ | ✓ | — | — | — | ✓ | — | — | — | — | ✓ | — | `SRC` `DOC08.matrix.update-project-stages` (journey L1454); Project Manager/Operations cells `BRIEF` per decision B (F2-08) |
| `F2.M08.project-documents` · Upload and verify project documents | ✓ | ✓ | — | — | — | ✓ | — | — | — | — | ✓ | — | `SRC` `DOC08.matrix.record-payments` (journey L1455 — the documents half; the payments half is `F2.M11.record-payments`); PM/Operations cells `BRIEF` per decision B |
| `F2.M08.installation-checklist` · Work the installation checklist (tick steps, attach photo evidence) | ✓ | — | — | — | — | ✓ (coordinator, F2-07 attribution) | — | ✓ (surface obeys F2-06) | — | — | — | — | `SRC` `R16` (coordinator runs the checklist; "done by" fallback) + `BRIEF` decision C (crew preset); checklist behavior itself is M08's (`S8.screen.6`). **Note (Task 18):** `R16`'s "coordinator (Manager role)" names v1's preset — in V2 the duty is the **Project Manager**'s per decision B (F2-08b), which is why the Sales Manager, v1 `Manager`'s direct successor, does not hold this row |
| `F2.M08.project-visibility` · Project visibility scope (the F2-14 projects domain as cells) | All | Team | Own (read-only) | — | — | Own projects | — | Assigned job only | — | All (money scope) | Portfolio | — | `SRC` `S8.rule.roles` (Owner "everything, all projects"; coordinator/ops "= the Manager preset"; the sales rep "read-only on their own won deals, so they can answer a customer without asking ops") + `D20` scoping (F2-12); the projects domain and its ladder (Own projects ⊂ Portfolio ⊂ All) are `F2-14`'s, reciprocating `F2.M02.lead-visibility`'s "Own projects' deals (read)" / "Portfolio deals (read)" cells; Project Manager / Operations / Finance / Installation Team Member cells `BRIEF` per decisions B and C with `PS-26`/`PS-31` — appended by Task 18 (M08) |

Notes on §F2.5-M08 (recorded by Task 18): **one row added, and three candidate rows deliberately
not added.** (a) **Setting and clearing blockers rides `F2.M08.update-stages`** — a blocker is a
sub-state of the stage machine, not a separate object (`R2`: "blocker sub-states … ride on any
stage"), and that row's holders are exactly the coordinator set the source names
(`S8.rule.roles`) plus decision B's delivery re-grants, whose Operations clause reads "stages,
documents, **blockers**" (F2-08c). (b) **Cancelling a project rides the same row** — `CANCELLED`
is a state of that machine reached by the same act; `F2-22` already names "Cancelled-after-Won"
as an audited event, and the source names no separate cancellation authority. Narrowing
cancellation below stage-moving would be an owner ruling, not a module decision. (c) **Handover
adds no grant**: assembling the pack from the checklist rides `F2.M08.project-documents`,
sharing it rides F5's link operations (§F2.5-F5), reaching `HANDED_OVER` rides
`F2.M08.update-stages`, and the handover-time referral ask produces `modules/M02`'s referral row
(`M02-16`), not a project capability. **Projects are their own visibility domain** (F2-14) rather
than children of lead visibility, because Project Manager, Operations and Finance reach projects
without holding any lead scope; the Sales Executive's cell is read-only by source, and Finance's
cell is the money scope `PS-31` describes — the read that `F2.M11.record-payments` already
presupposes. Every mutating act on a project — stage change, blocker, document upload and
verification, cancellation, payment — is audit-covered per `F2-22`. No placeholder remains for
M08.

#### F2.5-M09 — Field workforce

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M09.field-visibility` · Field-work visibility scope (the `F2-14` **field work** domain as cells) | All | — | — | Own | — | Own projects' field work | Own | Own | — | — | Team | — | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Team visibility") · domain and ladder (Own ⊂ Team ⊂ All) named by `F2-14`, scoped by `SRC` `D20` through `F2-12`/`F2-13`; Operations' **Team** cell is decision B's field-workforce team visibility (F2-08c, `PS-34`); Project Manager's cell is decision B's single-project coordinator scope (`PS-21`). **The Sales Manager cell is deliberately empty and is not a narrowing:** `F2-14`'s own worked example — a Sales Manager holding Field Technician "sees the team's leads and only their own route" — already fixes it, and `modules/M09` `M09-60` honours it rather than re-ruling it; the visit facts a Sales Manager needs ride the **lead's** scope, not this domain (`M09-28`) — appended by Task 22 (M09) |
| `F2.M09.check-in-out` · Check in and out of a site, and log a visit and its outcome | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | — | ✓ | — | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Site check-in, Site check-out", "Visit tracking"); **included in every tier for every employee** per *retired: PRD design note* §2 `DD7`, published at `BM-23` — this row is never gated by plan, entitlement or tracked-seat state (`modules/M09` `M09-18`). Held by the field-facing presets; the desk-only presets (Design Engineer, HR/Admin, Finance, Marketing) are excluded because they do not visit sites, and adding one is a cell edit rather than a restructure — appended by Task 22 (M09) |
| `F2.M09.mark-attendance` · Mark one's **own** day start and day end | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Attendance"); held by **every** preset because attendance is a property of being an employee rather than of doing field work, and the brief's HR module is company-wide (§HR). The act is own-scope by construction — it writes only the actor's own record — so it widens nothing (`F2-15`). The leave, roster and register half is `modules/M10`'s and is **not** granted here (`modules/M09` `M09-40`) — appended by Task 22 (M09) |
| `F2.M09.attendance-visibility` · Read **others'** attendance records (the attendance slice only) | All | Team | — | — | — | Own projects' field workers | — | — | All | — | Team | — | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Attendance") + §HR; scoped by `SRC` `D20` through `F2-12`/`F2-13`. **Deliberately the narrow attendance slice:** attendance sits in `F2-14`'s **people records** domain, which `modules/M10` (Task 23) defines in full — this row grants attendance and nothing else so that document can add employee records, documents and leave without re-ruling it. HR/Admin's **All** is the brief's "HR sees attendance only": that preset holds this row and **no** `F2.M09.field-visibility` cell, so no location, route, movement or geofence event is reachable by it (`F2-14`'s per-domain independence; `modules/M09` `M09-41`) — appended by Task 22 (M09) |
| `F2.M09.toggle-tracked-seat` · Turn per-employee field tracking on or off (a commercial commitment and a privacy decision) | ✓ | — | — | — | — | — | — | — | — | — | — | — | `BRIEF` *retired: PRD design note* §2 `DD7`, verbatim — *"Owner toggles tracking per employee"* — and the owner-toggled privacy law of *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03; design spec §11 carries M09's scope, not that sentence); Owner-only by the same rule that keeps integration credentials and tenant-binding settings Owner-only (`F2.M01.manage-tenant-settings`), because moving it commits the tenant commercially (`BM-22`) and is the act on which the market's privacy posture turns (`modules/M09` `M09-11`, `M09-65`). Every movement is audit-covered (`F2-22`) — appended by Task 22 (M09) |
| `F2.M09.manage-geofences` · Define a site's geofence and adjust its radius | ✓ | ✓ | — | — | — | ✓ | — | — | — | — | ✓ | — | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Geo-fencing"); **the holder set is `F2.M08.update-stages`' unchanged** — a geofence is a property of the project site, so the people who run the site run its fence, and no narrower authority is invented (the precedent is §F2.5-M08's treatment of cancellation: narrowing below the stage-moving set would be an owner ruling). Anchors are places other modules already own and this row creates none (`modules/M09` `M09-49`) — appended by Task 22 (M09) |
| `F2.M09.view-live-location` · See **another person's** live position, route timeline, movement history and day playback (tracked seats only) | All | — | — | — | — | Own projects' field work | — | — | — | — | Team | — | `BRIEF` *retired: PRD design note* §2 `DD7` (the per-seat bundle) + `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Live location", "Route timeline", "Daily movement"). **A narrowing of `F2.M09.field-visibility`, never a widening:** a viewer needs the field scope covering that person **and** this row, and no cell here is wider than that row's. Reading one's **own** location record needs no grant at all and is not a cell of this row — it is `modules/M09` `M09-66`, the employee-visible law. Every read of another person's location is audit-covered (`F2-22`, `modules/M09` `M09-70`) — appended by Task 22 (M09) |

Notes on §F2.5-M09 (recorded by Task 22): **seven rows added, and the shape follows `DD7`'s split
rather than the presets.** The module's capabilities divide into three commercial classes and the
matrix keeps them apart: the **included** class (`check-in-out`, `mark-attendance`) is granted
broadly and is never gated by plan or seat (`DD7`, `BM-23`); the **tracked** class
(`view-live-location`) is granted narrowly and exists per person only while the Owner's toggle is
on (`DD7`, `BM-22`); and the **administering** class (`toggle-tracked-seat`, `manage-geofences`) is
granted where the corresponding authority already sits. **Field work is `F2-14`'s own domain and
this task widened nothing to reach it:** the Sales Manager holds no field cell because `F2-14`'s
worked example already decided that cell, and `modules/M09` `M09-60` states the consequence and
the compensating route (visit facts ride the lead's scope) instead of asking for a widening.
**The two Owner-only rows are Owner-only for different reasons and both are recorded:**
`toggle-tracked-seat` because it is simultaneously a charge (`BM-22`) and a privacy act (the
owner-approved authoring plan, §Task 22 Step 2), and no other preset in this suite holds an act
with both properties. **No commercial
figure reaches an Installation Team Member surface through any row here** — that preset holds
`field-visibility` at **Own**, `check-in-out` and `mark-attendance`, none of which renders a price,
discount, tranche, margin or customer value; the property is the surface's, not the viewer's
(F2-06, `modules/M08` `M08-43`, `modules/M09` §M09.3). **One deliberate departure from the dispatch's wording is recorded:** the authoring plan's Step 3
describes Field Technician, Installation Team Member and Survey Engineer as "tracked roles". No row
above makes tracking a property of a preset, because `DD7` makes it a property of a **person** —
"Owner toggles tracking per employee" — and `modules/M09` `M09-15` states that a tracked seat
follows the person, never a device, a role or a job. Those three presets are the ones whose work is
*typically* tracked, and the matrix expresses that by giving them `field-visibility` at **Own**; it
does not, and must not, grant tracking itself, which no preset can carry (`F2-15` — every grant is
explicable as "holds preset X", and tracking is not a grant at all). **Audit coverage extends to reads here,
which is new:** `F2-22`'s list covers mutations across the suite, and `modules/M09` `M09-70` adds
each *access* to another person's location as a covered event, because on this domain the
sensitive act is looking. No placeholder remains for M09.

#### F2.5-M10 — HR-lite

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M10.people-records` · Read and edit employee records; upload and manage employee documents (the `F2-14` **people records** domain as cells) | ✓ (all) | — | — | — | — | — | — | — | ✓ (all) | — | — | — | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §HR + §Users via `PS-29`/`PS-30`; domain named by `F2-14`; module surfaces `modules/M10` §M10.2/§M10.7. **Every employee reads their own record and documents without a grant** — own-scope by construction, so no cell exists for it (`F2-15`; `modules/M10` `M10-09`, the `M09-66` precedent) — appended by Task 23 (M10) |
| `F2.M10.request-leave` · Request one's **own** leave | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §HR; held by **every** preset because leave, like attendance, is a property of being an employee (the `F2.M09.mark-attendance` precedent); the act writes only the actor's own request, so it widens nothing (`F2-15`) — appended by Task 23 (M10) |
| `F2.M10.decide-leave` · Approve or decline a leave request | ✓ | — | — | — | — | — | — | — | ✓ | — | — | — | `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §HR + `PS-30` ("leave awaiting a decision"); SME-weight holder set — widening decisions to mapped managers would be a cell edit here, not a restructure (`modules/M10` `M10-27`) — appended by Task 23 (M10) |
| `F2.M10.manage-team-structure` · Set or change an employee's manager mapping (the membership data every **Team** visibility cell resolves over) | ✓ | — | — | — | — | — | — | — | — | — | — | — | `BRIEF` `modules/M10` `M10-32`/`M10-33`, grounded in `SRC` `D20` through `F2-12`/`F2-13`; Owner-only by the same rule that keeps role administration Owner-only (`F2.M01.manage-team`), because moving a person between teams changes what every Team-scoped holder sees; audited old → new (`F2-22`), mid-task grace applies (`F2-17`) — appended by Task 23 (M10) |

Notes on §F2.5-M10 (recorded by Task 23): **four rows added, and the no-delegation boundary
holds.** `F2.M01.manage-team` is not re-granted and no M10 row shortcuts it (F2.1 §HR/Admin):
inviting, role assignment and deactivation stay EPC Owner-only on M01's screens; HR/Admin
*prepares* an offboard (the open-work sweep, read-only) and the Owner executes it
(`modules/M10` §M10.4). **The attendance register adds no row** — HR/Admin's register reads
ride `F2.M09.attendance-visibility` (All — deliberately the narrow attendance slice Task 22
left for this task), and no preset gains any field-work visibility through M10 (`M09-41`).
**People records are `F2-14`'s own domain at its narrowest:** documents are readable only by
the EPC Owner, HR/Admin and the employee themself — never through team scope (`M10-39`).
**Team structure is membership data, not authority:** being mapped as someone's manager
grants nothing unless a held preset carries a Team-scoped cell; the mapping and the grants
compose only through F2's own rules (`F2-11`, `F2-13`; `M10-32`). No placeholder remains for
M10.

#### F2.5-M11 — Payments & collections

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M11.record-payments` · Record payments against tranches (with mode and receipt) | ✓ | ✓ | — | — | — | ✓ | — | — | — | ✓ | — | — | `SRC` `DOC08.matrix.record-payments` (journey L1455 — the payments half); PM cell `BRIEF` per decision B; Finance cell `BRIEF` per `PS-31` |
| `F2.M11.connect-gateway` · Connect, rotate and disconnect the tenant's own collections account (credentials write-only, last-4 only) | ✓ | — | — | — | — | — | — | — | — | — | — | — | `SRC` `DOC16.byo-collections` ("each tenant connects THEIR OWN gateway account") + `DOC04.byo-credentials` + `DOC08.credentials-last4` / `DOC09.credential-probe-nag`. The holder set is `F2.M01.manage-tenant-settings`'s (EPC Owner) and **no cell is widened** (`F2-15`); the row exists because the connect/disconnect flow and its collections-side consequences are `modules/M11`'s surface (`M11-17`–`M11-23`), while the credential screen and its probe stay `M01-60`'s — appended by Task 19 (M11) |
| `F2.M11.send-request-message` · Send the plain payment-request message — the request message alone, carrying **no** payment link — from the tenant's connected official channel, and compose or copy it where no channel is connected; **at the actor's own `F2.M08.project-visibility` scope** | ✓ | ✓ | ✓ | — | — | ✓ | — | — | — | ✓ | ✓ | — | `SRC` `S8.screen.3` (the payments screen's "copy a ready-made request message") + `S8.wrong.3` (the read-only rep answers and chases a customer "without asking ops"; `M08-18`, `M08-38`). The **send** itself is owner ruling 2026-08-04 (`Q33`)'s transactional lane (`modules/M03` `M03-03`) applied to collections by owner ruling 2026-08-06 (`Q45`) (`modules/M11` `M11-26`). **Holder set per owner ruling 2026-08-06 (`Q48`):** the send **stays in project scope** — the plain message carries no money instrument, and keeping it there preserves the case the PRD explicitly wanted, a read-only Sales Executive chasing their own won deal; **minting or sending an actual payment link is unchanged and stays `F2.M11.record-payments`**, a link being a live collection instrument (`modules/M11` §M11.4's permissions block). **Cell origins:** the cells are `F2.M08.project-visibility`'s holders at each holder's own scope (Owner all, Sales Manager team, Sales Executive own won deals, Project Manager own projects, Finance the money scope, Operations portfolio), so they carry that row's origins unchanged — **with one cell struck: Installation Team Member is `—`**, which is not a narrowing of the ruling but a consequence of a law it did not touch, since no surface that preset reaches carries a tranche, an amount owed or any other commercial figure (`F2-06`, `M11-56`, `M08-43`; `modules/M11` §2 records the preset as **never**), so the act has no surface to be taken on there — appended by owner ruling 2026-08-06 (`Q48`), closing `modules/M11` §6 `M11-Q4`. **The act is audited (owner ruling 2026-08-06, `Q52`):** every send under this row is written to the append-only log under the name of the person who sent it, per `F2-22` as that ruling amends it — the message leaves the tenant's own official channel and reaches a customer about money — and the entry names the sender whatever preset they hold, the project-visibility-only reader included. *(The audit sentence is `Q52`'s; this row previously stated no audit position at all, and the note below called the question open at §6 `F2-Q2` / `modules/M11` §6 `M11-Q5`. `Q52` amends no cell of this row: the capability, its scope condition and all twelve grants stand exactly as `Q48` left them.)* **The audit lands on the send and stops there (owner ruling 2026-08-06, `Q57`):** this row also carries the compose-or-copy act where no channel is connected, and **that path writes nothing to the log** — the product composes and places text on the clipboard, a person sends it outside the product, so there is no send for the log to record and none is invented. The same chase is attributable on the connected path and unrecorded on the fallback, and that is the deliberate simplification the owner chose, not a gap to be filled with a compose record. *(The boundary sentence is `Q57`'s; this row previously stated the audit obligation without naming the fallback path's silence, which stood open at §6 `F2-Q3` / `modules/M11` §6 `M11-Q6`. `Q57` amends no cell of this row either — capability, scope condition and all twelve grants stand exactly as `Q48` left them.)* |
| `F2.M11.waive-tranche` · Waive a tranche (terminal, reason mandatory, never counted as collected) | ✓ | ✓ | — | — | — | ✓ | — | — | — | ✓ | — | — | `SRC` `DOC04.tranches-money-path` (`waived` as the terminal tranche state; `modules/M11` `M11-49`). Named separately from `record-payments` because writing money off is a different act from recording money in, but **deliberately not narrowed below it**: the source names the state and is silent on the authority, so narrowing is an owner ruling — and this row is where such a ruling lands as a cell edit rather than a restructure (the precedent is §F2.5-M08's treatment of cancellation). **Cell origins:** the capability itself is `SRC` (`DOC04`'s `waived` terminal state); the cells are `F2.M11.record-payments`'s cells unchanged, so the Project Manager cell is `BRIEF` per decision B and the Finance cell `BRIEF` per `PS-31`, exactly as on that row — appended by Task 19 (M11) |

Notes on §F2.5-M11 (recorded by Task 19; **amended by owner ruling 2026-08-06, `Q48`**): **three
rows now stand, and three candidate rows remain deliberately not added.** *(This sentence
previously read "**two rows added, three candidate rows deliberately not added.**" The third row —
`F2.M11.send-request-message` — is added by that ruling; the three candidates below are unchanged
and are still not rows.)* (a) **Reversing a payment rides `F2.M11.record-payments`** — a correction is an *append*
to the same ledger by the same holders (`DOC04.payments-append-only`: "append-only with reversal
rows … never edited"), not a new authority; inventing a separate reversal grant would imply the
original entry could be reached some other way, which it cannot. (b) **Minting or copying a
payment link rides `F2.M11.record-payments`** — it creates a live collection instrument on the
tenant's own account, so it belongs with the collection set, and **minting or sending a link is
unchanged by `Q48`**; the plain *request message*, which carries no instrument, rides the reader's
project scope — **composed, copied and, per owner ruling 2026-08-06 (`Q48`), sent from the tenant's
connected official channel alike, now carried as the row `F2.M11.send-request-message`** — and that
is precisely what lets the read-only Sales Executive chase their own won deal (`S8.wrong.3`,
`M08-18`, `M08-38`). *(This note previously read "the plain ready-to-paste *request message*, which
carries no instrument, rides the reader's project scope, and that is precisely what lets the
read-only Sales Executive chase their own won deal"; it named no send and no row, and that absence
of a row is what raised `modules/M11` §6 `M11-Q4` / register `Q48`, now closed by the ruling.)*
(c) **Reading collections is not a new visibility domain** — it rides
`F2.M08.project-visibility` (F2-14), whose Finance cell **All (money scope)** is exactly the read
`F2.M11.record-payments` already presupposes (`PS-31`); no preset gains a money-only scope
(`F2-15`). No surface reachable by the Installation Team Member preset shows any collections
figure — a property of the surface, not the viewer (`F2-06`, `M08-43`, `M11-56`). Payments
recorded, tranche edits, reversals, waivers, link mints and every credential lifecycle event and
decrypt are audit-covered per `F2-22`. **The plain request message's *send* is audit-covered too,
and the entry names the person who sent it (owner ruling 2026-08-06, `Q52`)** — `F2-22`'s checklist
now carries the clause, and it binds every holder of `F2.M11.send-request-message` alike, the
project-visibility-only reader included: the message leaves the tenant's own official channel and
reaches a customer about money, so the log answers "who messaged my customer?" without
reconstruction. §6 `F2-Q2` and `modules/M11-payments-and-collections.md` §6 `M11-Q5` are closed by
that ruling. *(These sentences replace, in full: "**Whether the plain request message's *send* is
itself an audit-covered event is open, not decided by the row above** — `F2-22`'s checklist does not
name it and owner ruling 2026-08-06 (`Q48`) did not address it; recorded at §6 `F2-Q2` and at
`modules/M11-payments-and-collections.md` §6 `M11-Q5`." Nothing else in this note changes, and no
matrix cell moves.)* **The fallback path writes nothing (owner ruling 2026-08-06, `Q57`):** where no
channel is connected the product composes the message and places it on the clipboard and a person
sends it outside the product, so no entry is written for that path — not a compose record, not a
copy record, not a send record — and the same chase is therefore attributable on the connected path
and unrecorded on the fallback. The owner chose that simpler rule deliberately: this log holds what
the product performed, and the product claims nothing it did not do. §6 `F2-Q3` and
`modules/M11-payments-and-collections.md` §6 `M11-Q6` are closed by that ruling. *(These sentences
are `Q57`'s; the note previously ended at the `Q52` closure and said nothing about the fallback
path. No matrix cell moves and no grant changes.)* No placeholder remains for M11.

#### F2.5-M12 — Platform billing

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M12.manage-billing` · Manage the tenant's platform billing (subscription, plan, payment method) | ✓ | — | — | — | — | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.manage-billing` (journey L1460; capability restored — the D38-era strike is superseded, billing is v1 per the overlay) |
| `F2.M12.view-usage-and-invoices` · Open the usage screen and the subscription invoice list (read + export) | ✓ | — | — | — | — | — | — | — | — | — | — | — | `SRC` `UXG-15` ("informational, tenant-scoped, **owner-only**") + `DOC16.invoices-exportable` / `DOC16.usage-honesty` (screens `modules/M12` §M12.5/§M12.7). Named separately from `manage-billing` because reading the bill is a different act from changing the plan — but the holder set is identical and **deliberately not widened**: Finance's money scope is the tenant's customers' money (`PS-31`), never the platform bill; widening this row to Finance would be an owner ruling landing as a cell edit — appended by Task 23 (M12) |

Notes on §F2.5-M12 (recorded by Task 23): the tenant's own subscription is the EPC Owner's
alone — Finance's money scope is the *tenant's customers'* money (M11), never the platform
bill (`PS-31` boundary). **Billing state visibility is not a grant:** the state banner renders
for every employee (without amounts) and the dunning banner's named audience is owner +
managers (`DOC16.dunning-channels`, `modules/M12` `M12-56`) — display rules of M12's surfaces,
not matrix cells, because they carry no capability. Blocked-mutation denials (`M12-21`) render
for whoever attempted the act; the *reactivate act* they point at stays `manage-billing`'s.
No placeholder remains for M12.

#### F2.5-M13 — Dashboards & reporting

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.M13.company-reports` · See company reports | ✓ (all) | ✓ (team-scoped) | — | — | — | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.company-reports` (journey L1461); scoping per `D20` (F2-12) |

Notes on §F2.5-M13 (recorded by Task 23): **no row is added, deliberately — dashboards create
no capability.** Every M13 surface is a *read* of data other modules own, and reading follows
the reader's existing visibility scopes per `F2-12`/`F2-14` — "the same screen, scoped"
(journey L1538–1539; `modules/M13` `M13-07`): the owner dashboard and the pipeline
funnel/win-loss are company reports and ride `F2.M13.company-reports` (Owner all, Sales
Manager team-scoped — the one v1 row, already filled); the Sales Executive's "how am I doing"
step-back view is **own-scoped data, not a company report**, and needs no grant beyond their
own lead visibility (`modules/M13` `M13-31`); every role home composes only blocks its holder
could already read (agent-performance tiles ride `F2.M07.agent-performance`; usage and billing
reporting ride `F2.M12.manage-billing`/`F2.M12.view-usage-and-invoices`; field-day rollups
ride `F2.M09.field-visibility`/`view-live-location`; people rollups ride
`F2.M09.attendance-visibility` and `F2.M10.people-records`; collections figures ride
`F2.M08.project-visibility`'s Finance money scope). Exports are scoped identically
(`M13-54`) and grant nothing. The home-composition rule (`F2-Q1`'s open half) is **resolved by
`modules/M13` `M13-10`** — a fixed preset-precedence ladder over `F2-14`'s domain lattice —
recorded at register `Q5`. No placeholder remains for M13.

#### F2.5-F5 — Customer-link surfaces

Tenant-side capabilities over the customer link (mint, re-mint, revoke, share). The link's own
scopes are token scopes, not roles (§1); this table governs which presets operate the link.

| Row key · capability | EPC Owner | Sales Manager | Sales Executive | Survey Engineer | Design Engineer | Project Manager | Field Technician | Installation Team Member | HR/Admin | Finance | Operations | Marketing | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `F2.F5.mint-customer-link` · Mint, label and re-mint a customer link for a named contact | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | `SRC` `DOC08.matrix.send-proposals` (journey L1453) — **minting the link is the act of sharing the proposal** (`modules/M06` `M06-53`), so the holder set is `F2.M06.send-proposals`'s **unchanged and no cell is widened** (`F2-15`); the label + nullable contact that make it a *named* link are `R6` as amended 2026-07-24 / `UXG-11` / `DOC08.link-named-otp`. The row exists separately from `F2.M06.send-proposals` because the link outlives the proposal phase — it is the deal's customer-facing identity through progress and handover (`foundations/F5` `F5-19`) — appended by Task 20 (F5) |
| `F2.F5.revoke-customer-link` · Revoke a customer link, including regenerate-with-revoke | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | `SRC` `DOC08.link-token` (links are "revocable"; "a revoked/regenerated link dies instantly regardless of its own expiry"); `DOC04.link-lifecycle` (status `revoked`); surface at `foundations/F5` `F5-76`. **Cells are `F2.F5.mint-customer-link`'s unchanged:** the source names the capability and is **silent on the authority**, so narrowing revocation below the minting set would be an owner ruling rather than a module decision (the precedent is §F2.5-M08's treatment of cancellation and §F2.5-M11's of waiver) — and this row is where such a ruling lands as a cell edit rather than a restructure — appended by Task 20 (F5) |

Notes on §F2.5-F5 (recorded by Task 20): **two rows added, five candidate rows deliberately not
added.** (a) **Reading a link's status and its open history is not a new visibility domain** — it
rides `F2.M02.lead-visibility` and `F2.M08.project-visibility` exactly as proposals, designs and
surveys do (§F2.5-M04/§F2.5-M05/§F2.5-M06 precedent); no preset gains a link-only scope
(`F2-15`). (b) **Re-sending an existing named link to its own contact carries no grant** — it
exposes access that person already holds, so it rides the reader's lead or project scope, which
is what lets the read-only Sales Executive answer their own won customer (`M08-18`); giving a
*new* person access requires minting a new named link under the first row, and that requirement
is precisely what preserves the per-link attribution `R6` exists for. (c) **Setting the
acceptance-challenge threshold is not re-granted here** — it is tenant configuration and rides
`F2.M01.manage-tenant-settings` (EPC Owner), like every other tenant setting. (d) **Answering a
customer's question or a requested call adds no row** — a question is a timeline event on a
record somebody already owns (`F2.M02.lead-visibility`) and the call surfaces are
`modules/M07`'s. (e) **Handover adds no link grant**: because the customer already holds the URL
and it advances in place, reaching the pack requires no new share act at all (`foundations/F5`
`F5-70`) — the rep's send is a courtesy, which is why §F2.5-M08's note pointing handover sharing
at "F5's link operations" resolves to these two rows and not to a stage-mover's grant. **The
customer holds nothing in this table and appears in no column** (`F2-18`); every capability here
is exercised by a tenant user on the tenant's side of the link. Mint, re-mint, revoke, open and
each of accept / negotiate / decline are audit-covered events per `F2-22`. No placeholder remains
for F5.

**Note on `foundations/F6-notifications-and-search.md` (recorded by Task 23):** F6 has **no
matrix table here by design** — `F2-25` fixes the table set as `M01`–`M13` plus the F5
customer-link surfaces, and F6 needs no table because its surfaces create no capability.
Notifications are person-targeted or scope-resolved reads: a recipient resolves through the
existing visibility domains at emit and at open (`F2-12`–`F2-14`; `foundations/F6` `F6-16`),
the read-state act writes only the actor's own record, and no notification ever discloses
more of a record than its recipient may already read. Global search rides the same domains —
a result appears only where the searcher's existing scopes would open the record
(`F6-21`) — and template management rides `F2.M01.manage-tenant-settings` (with M03's
campaign-content row for campaign templates). No grant is added, widened or delegated by F6
anywhere.

## 4. Cross-module contracts

**Provides.**

- The twelve preset names and their semantics (F2-01, F2-10…F2-18) — used verbatim by every
  later document.
- The per-module matrices and the row-key convention `F2.M<nn>.<slug>` (F2-25): module PRDs
  write "Permissions: `F2.M<nn>.<slug>`" and never restate a grant.
- The audit covered-events checklist (F2-22), inherited by every module whose events it names.
- The rulings on `02-personas.md` §6 A–C, and the permission half of D (F2-14).

**Expects.**

| From | This document expects |
|---|---|
| Each module task (`M01`–`M13`) and the F5 task | Its matrix rows appended **here**, in its table, replacing its placeholder rows, using the row-key convention and the fixed twelve-column order — never a matrix in its own file. |
| `modules/M01-onboarding-and-tenant-config.md` | The role-administration screens against §F2.3's guard rails: Team (chips, status, last active), Assign roles with the live plain-English grant line ("Rajesh can sell, survey and design", journey L1489, L1513–1514), the read-only Roles reference rendering this document's matrices and how many people hold each preset (journey L1490), Invite person with ≥1 role (F2-21). |
| `modules/M05-design-studio.md` | Sign-off flows honoring F2-03/F2-04: approve/return with pinned comments, the customer never seeing an unapproved design, the sign-off queue composed into the Design Engineer's home (`PS-18`). |
| `modules/M08-projects.md` | The installation checklist honoring F2-06 (no commercial figures) and F2-07 (coordinator attribution + "done by"); the checklist's content and derivation are M08's. |
| `modules/M10-hr-lite.md` | People records wired to this role model without widening it — no delegated team administration (F2.1 §HR/Admin). |
| `modules/M13-dashboards-and-reporting.md` | Role-scoped rendering of every dashboard per F2-12 ("the same screen, scoped"), and the composition rule for multi-role homes (`PS-05`) — the half of question D this document does not own (§6). |
| `foundations/F5-customer-link.md` | The token-scope model for customers (`DOC08.link-*`), kept disjoint from roles (F2-18). |
| `foundations/F3-localization.md` | Localized preset names and capability phrases (§F2.1, §F2.2 localization notes). |

## 5. Non-goals

- **No custom roles, no role editor, no duplicate-from-preset.** v1 deferred them with a stated
  rationale — "rather than guessing at a checkbox editor nobody fills in" (D29) — and V2's
  answer to the watched demand is DD3's widened *fixed* preset set, not an editor. The v1
  matrix "becomes the checkbox list when custom roles arrive" (journey L1441–1442) is retained
  as the design's forward shape, not as V2 scope. (`DOC00.nongoal-custom-roles`, dispositioned
  here by Task 3.)
- **No per-person permission exceptions, ever.** D28, quoted in F2-15. Not a v1 economy — a
  standing law of the product.
- **No object-level permissions, no field-level rules, no inheritance tree.** The source's own
  boundary: "If a company needs more than this, they need a different product" (journey
  L1468–1469).
- **No approval workflows beyond design sign-off.** There is no discount approval (D34
  supersedes D19) and no approval queue of any kind in the permission model; the owner brief's
  "Approval flows" vocabulary is satisfied by sign-off (F2-03) and by arithmetic guards that
  are module behavior, not permissions (M06). The v1 config phrase "who approves what"
  (`TC.roles.1`) is carried as written by M01 with this same reading; the tension is recorded
  there, not resolved here.
- **No customer roles.** The customer is an audience with a tokenised link (F2-18, F5); no
  preset will ever model them.
- **No seat, licence or pricing modeling.** Presets are free to assign; what a tenant pays for
  is `04-business-model.md`'s meter set, and the one per-seat exception (field tracking, DD7)
  is a billing meter on a capability, not a role.
- **No delegated team administration in this release.** `F2.M01.manage-team` is EPC Owner-only;
  because presets are fixed (F2-02) and exceptions do not exist (F2-15), there is no mechanism
  by which a tenant could widen it. A future preset carrying a people-administration slice is
  the R16-pattern escape path, on demand evidence.

## 6. Open questions

Raised or carried by this document, mirrored into `registers/open-questions.md`. Decisions A, B
and C from `02-personas.md` §6 are **resolved above** (F2-03/F2-04, F2-08, F2-05…F2-07) and are
mirrored into the register as decision-recorded rows, not open ones.

| # | Question | Decision owner |
|---|---|---|
| F2-Q1 | **The home-composition half of `02-personas.md` §6 D — resolved by `modules/M13` (Task 23).** This document resolved the *permission* half: visibility is per-domain, widest-wins inside each domain (F2-14). The *home screen* half is now fixed at `modules/M13` `M13-10`: a fixed preset-precedence ladder over F2-14's domain lattice chooses the one home; other held presets' work composes in as blocks; a switcher is always available. Recorded at register `Q5` (decision recorded — not open); the only revisit is the ladder's order, a one-table change in M13. | Resolved — `modules/M13` §M13.2; ladder-order revisit — Owner |
| F2-Q2 | **RESOLVED (owner ruling 2026-08-06, `Q52`) — the *send* of the plain payment-request message IS an audit-covered event, and the entry is recorded under the name of the person who sent it.** It binds every holder of `F2.M11.send-request-message`, including a project-visibility-only reader such as a Sales Executive chasing their own won deal (`Q48`). The rationale the owner accepted: the message leaves the company's official channel and reaches a customer about money, which is exactly what the audit log exists for, and the record answers "who messaged my customer?" instantly. Applied at: `F2-22`'s covered-events cell (amended, recording what it previously enumerated), §F2.4's acceptance block (a new criterion), §F2.5-M11's `F2.M11.send-request-message` row and the notes beneath it; and, in `modules/M11-payments-and-collections.md`, `M11-07` (amended), §M11.1's and §M11.4's acceptance blocks, §M11.4's and §M11.8's permissions blocks, §4's `foundations/F2` expectation and §5's no-fabricated-delivery-state scope note, with `docs/tasks/M11-payments-collections.md` (T-M11-002, T-M11-009, T-M11-016 and the `M11-26` law entry) and `docs/ux/briefs/SCR-M11-02-payments-ledger.md` re-synced. **No matrix cell moves and no grant changes** — `Q52` settles the audit obligation on an act `Q48` had already placed. *(This row previously read, in full: "**Is the *send* of the plain payment-request message an audit-covered event, and with whose name? NEW — raised by applying owner ruling 2026-08-06 (`Q48`), not decided here.** That ruling keeps the send inside project scope (`F2.M11.send-request-message`, §F2.5-M11), so a **read-only** preset can now cause an outbound message from the tenant's own registered official channel, addressed to a customer and stating what is owed. `F2-22`'s covered-events checklist does not name such a send — it names money events, link mint/re-mint/revoke and customer-link opens — and `modules/M11` §M11.4's permissions block audits **link mints** only. The ruling did not address it, so no document states whether the act is written to the log with its actor; nothing here decides it, and no audit claim is made for the act anywhere. The answer lands as a cell edit to `F2-22`. Full statement at `modules/M11-payments-and-collections.md` §6 `M11-Q5`." Its decision owner read "Owner (with `modules/M11`)". The answer landed exactly where that row said it would — as a cell edit to `F2-22`.)* | Resolved — owner ruling 2026-08-06 (`Q52`) |
| F2-Q3 | **RESOLVED (owner ruling 2026-08-06, `Q57`) — the copy-paste fallback path leaves no audit record at all, and none is added.** `F2-22` covers the send **from the tenant's connected official channel** and only that send: where no channel is connected the product composes the message and places it on the clipboard, a person sends it outside the product, and **nothing is written** — no compose record, no copy record, no send record, and no compensating counter or timeline entry either. The owner's words: *"hey keep as much as simple. and dont do overengineering."* The trade is accepted and recorded rather than compensated for: the same chase, to the same customer, about the same tranche, is attributable when the product sends it and unrecorded when a person does — a deliberate simplification consistent with the standing law that the product never claims what it did not do, because the log records what the product performed. Applied at: `F2-22`'s covered-events cell (amended, recording what it previously said), §F2.4's acceptance block (a new criterion making the boundary testable), §F2.5-M11's `F2.M11.send-request-message` row and the notes beneath it; and, in `modules/M11-payments-and-collections.md`, `M11-07` (amended), §M11.1's and §M11.4's acceptance blocks, §M11.4's permissions block and its edge cases, §M11.8's permissions paragraph, §4's `foundations/F2` expectation and §5's no-fabricated-delivery-state scope note, with `docs/tasks/M11-payments-collections.md` (T-M11-002, T-M11-009, T-M11-016 and the `M11-26` law entry) and `docs/ux/briefs/SCR-M11-02-payments-ledger.md` re-synced. **No matrix cell moves, no grant changes and no covered event is added** — `Q57` bounds the clause `Q52` added. *(This row previously read, in full: "**Does the copy-paste fallback path leave any audit record at all? NEW — raised by applying owner ruling 2026-08-06 (`Q52`), not decided here.** `F2-22` now covers the send of the plain payment-request message **from the tenant's connected official channel**, under the sender's name, and the ruling's reason is that the log answers "who messaged my customer?" instantly. Where no channel is connected (`modules/M11` `M11-26`'s fallback, kept first-class by `M11-21`), the product composes and copies and the person sends outside it — so, the **send** being the audited act, the checklist covers nothing and the same chase is attributable on one path and invisible on the other. Whether the fallback's compose-or-copy act belongs on this checklist as an act record (never a delivery claim, which `modules/M11` §5 forbids absolutely), or whether the log is deliberately silent where the product performed nothing, the ruling did not address. Nothing here decides it, and no record is claimed for that path anywhere. The answer lands as a cell edit to `F2-22`. Full statement at `modules/M11-payments-and-collections.md` §6 `M11-Q6`." Its decision owner read "Owner (with `modules/M11`)". The answer landed exactly where that row said it would — as a cell edit to `F2-22`, and the second of its two candidate readings is the one the owner took.)* | Resolved — owner ruling 2026-08-06 (`Q57`) |
