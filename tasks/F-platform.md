# F-platform (F2 · F3 · F4 · F6 · F7 · F8) — engineering tasks

This file dispositions every requirement row of the suite's six platform foundations — `prd/foundations/F2-roles-and-permissions.md` (F2), `prd/foundations/F3-localization.md` (F3), `prd/foundations/F4-data-integrity.md` (F4), `prd/foundations/F6-notifications-and-search.md` (F6), `prd/foundations/F7-design-language.md` (F7) and `prd/foundations/F8-data-honesty.md` (F8) — under the task-id prefix **T-FPLAT-**. This bucket owns no screens: the platform surfaces these documents describe (the app shell, global search, the notification centre, the language picker, the profile preferences and the branding settings) are built in `tasks/SHELL.md` and `tasks/M01-onboarding.md`, and appear here under **## Realized elsewhere**. What this file builds is the machinery those screens and every module screen read from: the permission and audit engines, the message catalog and the four format implementations, the server-owns-truth and concurrency-policy engines with the one device-held photograph queue, the notification registry and delivery engine, global search, and the provenance, staleness and disclosure engines of the data-honesty foundation. Every rule that engineering cannot build as a component — because it is a property of screens and of review — is carried verbatim under **## Laws**. Every row appears exactly once in the **## Disposition index** at the end.

*(Amended 2026-08-07 — the owner removed the offline/sync capability from the product. `prd/foundations/F4-offline-and-sync.md` was deleted and replaced by `prd/foundations/F4-data-integrity.md`, which keeps only the ten rows that were never about connectivity — `F4-04`, `F4-07`, `F4-14`, `F4-15`, `F4-16`, `F4-17`, `F4-19`, `F4-21`, `F4-25`, `F4-27` — with their original ids. This file was swept to match: `T-FPLAT-010` is struck in place, `T-FPLAT-011`…`T-FPLAT-016` and `T-FPLAT-019` are reduced to their surviving rows and retitled, and the F4 quotes were re-pulled from the live document. The one surviving carve-out — field photographs held on the device until the connection returns, with their status on `SCR-M04-07` and nowhere else — is built by `T-FPLAT-015` under `F4-21` and `M04-55`. No task id and no row id is renumbered.)*

---

### T-FPLAT-001 · The twelve fixed presets and the per-module capability matrix
**Type:** engine · **Tier:** P0
**PRD rows:** F2-01, F2-02, F2-03, F2-05, F2-08, F2-09, F2-16, F2-25, F2-26
**Requirements (verbatim):**

- **F2-01** (P0) — The preset role set is **exactly twelve fixed presets**, named verbatim for the twelve personas: EPC Owner · Sales Manager · Sales Executive · Survey Engineer · Design Engineer · Project Manager · Field Technician · Installation Team Member · HR/Admin · Finance · Operations · Marketing. Every module and foundation PRD uses these exact names; a document that needs a thirteenth preset records the need in `registers/open-questions.md` rather than coining one.
- **F2-02** (P0) — **Presets are fixed and cannot be edited, renamed, or deleted by a tenant.** The source's own guard carries: "Presets are fixed and cannot be edited — a company cannot break 'Sales rep' for everyone who came after" (journey L1482–1483). There is no role editor, no duplicate-from-preset, and no tenant-created role in this release (D29 carried into V2 by DD3 — see §5 Non-goals).
- **F2-03** (P0) — **Decision A — design sign-off is an approval capability of the Design Engineer preset, not a thirteenth preset.** The v1 `Engineer` preset ("Reviews and signs off designs", journey L1436) folds into Design Engineer; the capability row `F2.M05.approve-designs` grants sign-off to EPC Owner and Design Engineer. The v1 capability itself is carried whole — nothing an Engineer could do in v1 is lost.
- **F2-05** (P0) — **Decision C — the Installation Team Member preset exists in V2.** R16 is honored verbatim for the v1-derived scope: in v1 the crew has no login, the coordinator runs the checklist, and "crew sees no money because crew sees no screen". R16's own consequence names the path this document takes: "v2 adds an Installer preset without schema change (roles are already M:N)" — and the owner's V2 brief lists Installation Teams as primary users. The preset's V2 name is **Installation Team Member**, per the fixed persona vocabulary.
- **F2-08** (P0) — **Decision B — the v1 `Manager` preset fans out as: Sales Manager = direct successor; Project Manager and Operations = delivery re-grants.** (a) **Sales Manager** inherits every grant the v1 `Manager` preset held in the v1 capability matrix, unchanged — Team lead visibility; add/edit leads; assign leads; capture surveys; create/edit and send proposals; update project stages; record payments and upload documents; see agent performance; see company reports (team-scoped). (b) **Project Manager** re-grants the coordinator subset at single-project scope — update stages, upload/verify documents, record payments — and takes over the v1 coordinator's checklist duty (R16's "coordinator (Manager role) runs the checklist" becomes the Project Manager in V2). (c) **Operations** re-grants the coordinator subset at portfolio scope — stages, documents, blockers — plus the DD11 catalog grant and field-workforce team visibility. No v1 `Manager` grant is dropped; each is either carried by Sales Manager or additionally re-granted.
- **F2-09** (P0) — **Field Technician and Installation Team Member are distinct presets.** Different jobs, different grants: the technician's grants are visits, routes, check-in/out and tasks (M09 rows); the installer's are the installation checklist and its photo evidence (M08 rows) under the F2-06 no-commercial-figures law. Merging them would put route and visit rights on a crew surface bound by R16's constraint, and checklist rights on every general field employee — both leaks. One person may of course hold both presets (F2-10).
- **F2-16** (P0) — **No custom roles (D29), verbatim:** "Custom roles deferred to v2. Ship the six, watch which combinations companies actually ask for, then add the presets they wanted — rather than guessing at a checkbox editor nobody fills in." V2 is that watched step and its answer is DD3: the presets the personas wanted, **still fixed, still no editor**. The v1 phrase "deferred to v2" does not make a role editor V2 scope — DD3 rules the V2 box ships expanded fixed presets only, and adding a future preset is a product release, not a tenant action.
- **F2-25** (P0) — **The matrices below are the only permission truth in the suite.** One table per module `M01`–`M13` plus the F5 customer-link surfaces; columns are the twelve presets of F2-01, in fixed order; rows are capabilities phrased in plain language, never as CRUD on entities (journey L1440–1441). Rows already fixed by source or owner ruling are filled here; every placeholder row is replaced by the owning module task's rows, appended **in this document**. Module PRDs reference their rows by row key (`F2.M<nn>.<slug>`); no module document restates a matrix. The closure pass verifies no placeholder remains.
- **F2-26** (P0) — **Every v1 capability row survives.** The v1 matrix's 16 capabilities (journey L1443–1461; `DOC08.matrix.*`) all appear below with their v1 grants either carried verbatim onto the successor presets or superseded by a recorded owner ruling (DD11 is the only supersession; billing is restored per the overlay). The set widened from six presets to twelve, but no v1 grant was silently dropped or narrowed (`DOC08.six-roles` disposition: superseded in count, carried in content).

**DONE WHEN:**

- Given any tenant, when the role list is read, then exactly the twelve presets of F2-01 exist, by exactly those names, and no tenant-created role exists (F2-01, F2-02).
- Given a design awaiting sign-off, when a holder of `F2.M05.approve-designs` approves or returns it, then the act is recorded with who and when, and a return reaches the author with comments pinned to the specific problem (F2-03, F2-04).
- Given any tenant, when roles are administered, then no create-role, edit-role or delete-role action exists on any surface (F2-16, F2-02).
- Given a person holding only Sales Manager, when they act, then every v1 `Manager` matrix grant is available to them and no more (F2-08).
- (F2-05, F2-09, F2-25 and F2-26 carry no dedicated Given/When/Then lines in the PRD's acceptance block; the requirement texts above are the binding criteria)

---
### T-FPLAT-002 · Permission resolution — OR across held presets, per-domain visibility scope, widest-wins
**Type:** engine · **Tier:** P0
**PRD rows:** F2-10, F2-11, F2-12, F2-13, F2-14, F2-15, F2-17, F2-18
**Requirements (verbatim):**

- **F2-10** (P0) — **One person can hold several presets — stacking is the design.** The census states it: "Six fixed preset roles; one person may hold SEVERAL. Permission granted if any held role grants it; lead visibility takes the widest" (D27 — the count widens to twelve per DD3, the law is unchanged). The small-firm problem — one person is rep *and* surveyor *and* designer — is solved by stacking, never by building a custom role. The team list shows all roles a person holds as chips.
- **F2-11** (P0) — **OR across roles.** The permission check is exactly: *does any of my held roles grant this?* Permission granted if any held role grants it — there is no AND, no precedence, no negative grant; a preset can only add.
- **F2-12** (P0) — **The visibility-scope law (D20), verbatim:** "Reps see only their own leads. Managers see the team's, owner sees everything." Restated by the source's dashboard rules as "Visibility follows role (D20): a rep sees only their own, a manager their team, the owner everything. The same screen, scoped" (journey L1538–1539). Every list, board, report and dashboard in the product is the same surface, scoped by role — never a different surface per role.
- **F2-13** (P0) — **Widest scope wins within a domain.** When held roles carry different visibility scopes in the same domain, the widest applies — a Sales Executive + Sales Manager sees Team; anyone + EPC Owner sees All. The team list shows which role is doing the work (journey L1507–1508).
- **F2-14** (P0) — **Visibility resolves per domain, and never leaks across domains.** V2 has more scope domains than v1's single lead axis: leads (Own ⊂ Team ⊂ All; Assigned beside Own for the assigned-only presets), projects (Own projects ⊂ Portfolio ⊂ All), field work (Own ⊂ Team ⊂ All), people records, money, campaigns. The widest-wins rule of F2-13 applies **inside each domain independently**; holding a wide scope in one domain never widens another (a Sales Manager + Field Technician sees the team's leads and only their own route). The EPC Owner's "everything, always" is All in every domain.
- **F2-15** (P0) — **No per-person permission exceptions, ever (D28), verbatim:** "To know what someone can do, you look at their roles — one source of truth. Exceptions are how permission systems become unauditable." There is deliberately no per-user override anywhere in the product; every grant is explicable as "holds preset X".
- **F2-17** (P1) — **Mid-task permission loss is graceful.** If a role is removed while someone is mid-task, the current in-flight action completes; the restriction applies from the next action — no mid-flight error storms.
- **F2-18** (P0) — **Roles bind only within the tenant's user audiences.** Every preset is held by an Owner-or-Employee user; the customer is never a role, never appears in a matrix, and reaches the product only through F5's tokenised link.

**DONE WHEN:**

- Given a person holding Sales Executive + Survey Engineer, when they open any lead list, then they see their own leads (widest of Own and Assigned), and both grant sets are available by OR (F2-10, F2-11, F2-13).
- Given a person holding Sales Manager + Field Technician, when they open the field surfaces, then they see the field team's day only if a field-domain scope grants it — their Team *lead* scope changes nothing outside the lead domain (F2-14).
- Given any user, when an administrator asks what they can do, then the answer is fully determined by their preset list — no per-person exception exists to consult (F2-15).
- Given a user whose role is removed mid-action, when the in-flight action completes, then it succeeds and the next action is what the restriction applies to (F2-17).
- (F2-12 and F2-18 carry no dedicated Given/When/Then lines in the PRD's acceptance block; the requirement texts above are the binding criteria)

---
### T-FPLAT-003 · Role-administration guarded transitions — last Owner, last Manage-team, deactivation, zero-role invite
**Type:** engine · **Tier:** P0
**PRD rows:** F2-19, F2-20, F2-21
**Requirements (verbatim):**

- **F2-19** (P0) — **A tenant always retains at least one EPC Owner, and at least one person holding Manage team.** An owner removing their own admin rights, or the removal of the last Manage-team holder, is blocked with an explanation. Enforced as guarded transitions, not UI-only.
- **F2-20** (P0) — **People are deactivated, never deleted.** Deactivation revokes sessions and hides the person from assignment pickers; every lead, activity, tick and money event they touched stays attributed to them, and their open work gets reassigned. Deleting a user — which would orphan their history — does not exist.
- **F2-21** (P1) — **An invitation carries at least one preset.** Inviting a person with no role at all is blocked — they would sign in and see nothing. (The invite flow itself — name, phone, roles — is M01's.)

**DONE WHEN:**

- Given a tenant with one EPC Owner, when anyone attempts to remove that person's Owner preset or deactivate them, then the attempt is blocked with an explanation and the blocked attempt is audit-logged (F2-19, F2-22).
- Given a person who leaves, when they are deactivated, then their sessions end, they leave assignment pickers, and their history stays attributed to them (F2-20).
- Given an invite composed with zero roles, when it is submitted, then it is blocked before sending (F2-21).

---
### T-FPLAT-004 · The append-only audit log, its tenant-scoped export and the impersonation record
**Type:** engine · **Tier:** P0
**PRD rows:** F2-22, F2-23, F2-24
**Requirements (verbatim):**

- **F2-22** (P0) — **An append-only audit log exists, and its covered-events list is the acceptance checklist:** auth events; team invite / role changes (old → new) including blocked last-Owner and last-Manage-team attempts; tenant settings, branding, catalog and price-book changes; money events (proposal generate/send/version, discount applied with amount and who, tranche edits, payment recorded, Won/Lost/Cancelled-after-Won); customer-link mint/re-mint/revoke/open/Accept-Negotiate-Decline with attribution; design sign-off approve/return with who and when (the engineer-led structural safety record); agent config changes (version id), knowledge-base edits, queue changes, DND/consent changes, escalations; billing plan changes, subscription transitions, entitlement overrides; credential lifecycle and every decrypt; data-rights requests and completions; admin/back-office access to tenant data. Entries are written with the change that caused them, never reconstructed after the fact. **Amended by owner rulings 2026-08-06 (`Q52`, `Q57`):** the checklist gains one clause — the send of the plain payment-request message from the tenant's connected official channel, recorded under the name of the person who sent it, whatever preset they hold (the project-visibility-only reader of `F2.M11.send-request-message` included) — **the covered event being that send and nothing else: where no channel is connected the product only composes the message and places it on the clipboard, a person sends it outside the product, and nothing at all is written to this log for that path.** Every other covered event and the written-with-the-change discipline are unchanged.
- **F2-23** (P1) — **The audit log is tenant-scoped and the tenant's own:** retained 24 months hot, then archived; tenants can export their own log.
- **F2-24** (P0) — **Admin/back-office impersonation is read-only and always audited.** Platform staff viewing a tenant's data never mutate as the tenant, and every such access appears in the F2-22 log.

**DONE WHEN:**

- Given any event named in F2-22's list, when it occurs, then an append-only entry exists recording who, what and when — including for blocked attempts (F2-22).
- Given a tenant administrator, when they export the audit log, then they receive their own tenant's entries and no other tenant's (F2-23).
- Given a platform-staff access to tenant data, when it occurs, then it is read-only and an audit entry records it (F2-24).

---
### T-FPLAT-005 · The message catalog and runtime language resolution — per-user language, silent English fallback, reader-language rendering
**Type:** engine · **Tier:** P0
**PRD rows:** F3-01, F3-02, F3-04, F3-05, F3-06, F3-07
**Requirements (verbatim):**

- **F3-01** (P0) — **The interface language set at launch is English, Hindi and Marathi, served from one message catalog for every surface and both platforms.** The set is a product-level list, not tenant data and not market-pack data: a tenant does not choose which languages exist, and a market pack does not add or remove one (a market pack declares formats, `F1-21`, never languages). The list is expected to grow (§F3.5); nothing in the product may assume its size.
- **F3-02** (P0) — **Language is a per-user setting, never a per-tenant setting.** Each person's interface language is their own; no tenant configuration, admin action, plan tier or market pack sets, forces or restricts the language of the people inside a tenant. Users of different languages coexist in one tenant, on one record, at the same time.
- **F3-04** (P0) — **Switching language re-renders the whole application immediately — no reload, no sign-out, and no loss of in-progress work.** The change applies to every open surface at once, including surfaces the user is midway through; a partially completed form, an open sheet or an in-progress capture survives the switch with its entered values intact.
- **F3-05** (P0) — **A missing translation falls back to English at runtime — never a bare key, never a blank, never a crash.** The fallback is silent to the user: the sentence appears in English inside an otherwise translated screen rather than as an identifier, an empty space, an error or a broken layout. A missing translation is a content gap to be filled, never a failure state the user is shown.
- **F3-06** (P0) — **Language follows the reader, not the author.** A notification renders in the language of the person receiving it, at the moment it is emitted — not in the language of whoever or whatever triggered it. A customer-facing document or link renders in the customer's language, not the rep's. A record created by a Marathi-speaking surveyor and opened by an English-speaking owner shows each of them their own language around the same unchanged data.
- **F3-07** (P0) — **Everything the product says is translated content.** All interface labels, buttons and navigation; all empty states, error messages and help text; notification copy; product-supplied document copy including every honesty and disclosure line required by `foundations/F8-data-honesty.md`; and the display labels the market pack declares for canonical machine values (`F1-22`). A user-visible string authored by the product exists in every language in the set, or it falls back under `F3-05` — there is no third category of "English-only product copy".

**DONE WHEN:**

- Given two users of different languages in one tenant, when they open the same record, then each sees the interface in their own language and the record's data identical (`F3-01`, `F3-02`).
- Given a user with an in-progress form open, when they change language, then every surface re-renders in the new language immediately, without a reload, and their entered values are unchanged (`F3-04`).
- Given a string with no translation in the active language, when the surface renders, then the English string appears in its place and no identifier, blank or error is shown (`F3-05`).
- Given a notification or a customer-facing rendering, when it is emitted or opened, then it is in the recipient's or customer's language, not the originating user's (`F3-06`).
- Given any product-supplied user-visible string, when the language set is enumerated, then a translation exists for it in every language or `F3-05`'s fallback applies — and no string is designated permanently English-only (`F3-07`).

---
### T-FPLAT-006 · Content classes — the never-translated set, canonical identity, the one-term law, tenant-authored per-language content
**Type:** engine · **Tier:** P0
**PRD rows:** F3-08, F3-10, F3-11, F3-12
**Requirements (verbatim):**

- **F3-08** (P0) — **The never-translated set is fixed and binding:** customer and person names; addresses; brand and model names (panels, inverters, and every catalog manufacturer name); technical units — kW, kWh, kWp and their kin; utility/network-operator names; and the market-neutral machine values behind pack labels (`F1-09`). These render identically in every language. **A value and its unit are unbreakable**: they never separate across a line, and the unit is never localized into a translated word.
- **F3-10** (P0) — **Tenant-authored content is data, not catalog copy, and the product never translates it.** Message templates (voice-agent scripts, messaging templates), knowledge-base entries, catalog descriptions, document cover copy and terms are tenant content authored **per language** — one stored version per language the tenant uses. The product supplies seeds in the launch languages where the source does, offers authoring per language, and **never machine-translates, auto-fills from another language, or silently substitutes a different language's version**. **Where a version is missing, the ruled fallback applies (owner ruling 2026-08-04, Q10): the reader is shown the original language with a small note saying so** — never a silent machine translation, never an unlabelled substitute — and the gap is still surfaced to the author.
- **F3-11** (P0) — **One concept, one term, in every language.** The naming law is language-wide, not English-only: where the product rules that a concept has a single name, that ruling binds every locale's translation, and no language may carry a second word for the same thing. The worked instance is the ruling's own: the customer-facing commercial document is a **Proposal** — as entity, interface copy and customer-facing document — in every launch locale, and the words "quote" and "quotation" are banned from interface strings and identifiers in every language. Translators render the single term, retaining the English word where the transliteration reads more naturally in the field. The one exception is search, which accepts the banned words as **query aliases only, never as labels** (`foundations/F6`).
- **F3-12** (P0) — **Canonical product vocabulary has a fixed identity and a translated display, and translation may not collapse it.** Values that the suite defines as closed sets — the four provenance tiers (`F8-02`), canonical stage and blocker values (`F1-09`), status values — keep their fixed English identities as the thing the product means, and their *display* is translated. A translation may not merge two canonical values into one word, and may not introduce a distinction the canonical set does not make; where a language lacks a distinct everyday term, the translation uses a distinguishing phrase.

**DONE WHEN:**

- Given a customer name, address, brand or model name, unit, or operator name, when it renders in any language on any surface including generated documents, then it is byte-identical to the English rendering (`F3-08`).
- Given a numeric value with a unit, when it renders at any viewport width, then value and unit appear together on one line (`F3-08`).
- Given a tenant-authored template, entry or document copy, when it is rendered in a language the tenant has not authored it in, then the product does not display a machine translation or a different language's version as if it were that language (`F3-10`).
- Given any language in the set, when interface strings for a single named concept are enumerated, then exactly one term is used for it, and the banned synonyms appear nowhere except as search query aliases (`F3-11`).
- Given a closed canonical vocabulary, when its display strings are enumerated in any language, then each member has a distinct display and no two members share one (`F3-12`).

---
### T-FPLAT-007 · Script rendering — bundled matched faces at every sanctioned weight, document shaping, per-script line height
**Type:** engine · **Tier:** P0
**PRD rows:** F3-09, F3-13, F3-14, F3-15, F3-17
**Requirements (verbatim):**

- **F3-09** (P0) — **A line that mixes scripts is normal, deliberate, and a required test case.** Latin values, units and names sit inside sentences in any script — the source's own example is a capacity in Latin digits and units followed by a word in Devanagari — and such lines must render with correct shaping, spacing, baseline alignment and line breaking on every surface, including generated documents. Mixed script is never treated as an error, and never worked around by translating a unit or transliterating a name.
- **F3-13** (P0) — **Every language in the set renders through a bundled face that covers its script, matched to the brand face — never through the operating system's fallback.** The brand face has zero coverage for the launch non-Latin script, and OS fallback rendering (which differs per device and per OS version) is explicitly unacceptable for a product whose documents are commercial artifacts. The bundled face is matched to the brand face for optical size and weight so that a mixed-script line (`F3-09`) reads as one typeface decision rather than two. On a platform without automatic per-codepoint fallback, script runs are resolved explicitly — the obligation is the same on both platforms. **Ruling clause carried from the cell:** **The face is chosen (owner ruling 2026-08-04, Q14): Noto Sans Devanagari (OFL, free) is the bundled Devanagari face for HI/MR UI and documents**, paired with the brand face (Geist per `design/ds-source`);
- **F3-14** (P0) — **The bundled script face covers every weight the design language sanctions, and the product never synthesizes one.** A script face shipped at fewer weights than the interface uses forces synthetic bolding, which distorts the script's stroke and matras; it is not an acceptable degradation. Weight parity between the brand face and each script face is a condition of adding a language (`F3-27`), not a later refinement. The chosen face — **Noto Sans Devanagari (owner ruling 2026-08-04, Q14)** — ships at the full sanctioned weight set, with the design phase confirming the exact weights and pairing (`F7-14`).
- **F3-15** (P0) — **Generated documents shape every script correctly — correct conjuncts, matras and ligatures — because they are commercial documents.** A proposal in a non-Latin script is the same legal and commercial artifact as its English counterpart: broken conjuncts are not acceptable output. The document-rendering capability is chosen and kept on the strength of its script shaping; per the suite's vendor rule, the capability is "a document renderer that shapes the product's scripts correctly", and the v1 reference implementation is the headless-browser renderer with the script face bundled into its runtime. This obligation covers every generated artifact — proposals, drawing sheets, exports — not only the proposal PDF.
- **F3-17** (P0) — **Line height is a per-script property; the type scale keeps its sizes.** A script whose glyphs carry strokes above and below the baseline needs more vertical room than the Latin scale allows, and the correct adjustment is per-script line height inside the existing scale — never a smaller size, never a bespoke scale, never ad-hoc spacing on individual screens.

**DONE WHEN:**

- Given a string mixing Latin values or names with another script, when it renders on any surface including a generated document, then shaping, spacing and line breaking are correct and nothing is transliterated (`F3-09`).
- Given any surface on either platform, when text renders in a non-Latin language, then it renders in the bundled script face at the correct weight, identically across devices, with no system-fallback rendering and no synthesized weight (`F3-13`, `F3-14`).
- Given a generated document in a non-Latin language, when it is produced and opened, then conjuncts, matras and ligatures are shaped correctly throughout (`F3-15`).
- Given text in a script requiring more vertical room, when it renders, then line height is adjusted per script while the type scale's sizes are unchanged (`F3-17`).

---
### T-FPLAT-008 · The four format implementations — money, non-money numbers, dates and times, measurements
**Type:** engine · **Tier:** P0
**PRD rows:** F3-19, F3-20, F3-21, F3-22, F3-23, F3-24
**Requirements (verbatim):**

- **F3-19** (P0) — **Each format capability has exactly one rendering implementation, product-wide.** One way to render money, one to render non-money numbers, one to render dates and times, one to render measurements. No surface, document template, export, notification or spoken-text composer formats a value of its own, and no surface hand-rolls a date string. The values these implementations use are the tenant market's `pack.formats` declarations (`F1-21`); F3 owns the rendering, F1 owns the values, and neither is duplicated in a module.
- **F3-20** (P0) — **Money never renders through a language's default number format.** Amounts render through the single money implementation using the tenant market's declared symbol, grouping rule, compact notation and minor unit — **the same way in every language** — on web, on mobile, in generated documents, in exports and in the voice agent's spoken text. The formatting does not change because the reader's language changed; only the words around it do.
- **F3-21** (P0) — **Digits are always Latin 0–9, in every language, including generated documents.** No language, market or document type renders numerals in another numbering script.
- **F3-22** (P0) — **Dates, times and durations render through the shared implementation, in the pack's declared style, on the tenant's timezone.** The date style is pack data (`F1-21`); user-facing schedules run on the tenant's timezone (`F1-10`). No surface composes its own date string, and no surface renders a user-facing time in a timezone other than the tenant's.
- **F3-23** (P1) — **Measurement units follow a per-user preference where the market offers one, with one fixed exception: procurement quantities stay metric regardless.** The preference sits beside the language setting on the same per-user basis (`F3-02`); the market's default is pack data (`F1-21`). Ordering, BOM and supplier-facing quantities are unaffected by the preference — they are metric in every case, for every user.
- **F3-24** (P0) — **The format layer carries every honesty obligation with the value and never drops one to fit.** A formatted amount keeps its provenance tier, its provisional/stale state and any required disclosure wherever it renders — including compact notation, narrow screens, table cells, exports and spoken text. Compact rendering never abbreviates a figure so far that its qualifier becomes unclear, and one computed figure renders identically wherever it appears rather than being re-formatted independently by each surface.

**DONE WHEN:**

- Given any surface, document, export or spoken output in the product, when it renders an amount, then it renders through the single money implementation using the tenant market's declared format values, identically in every language (`F3-19`, `F3-20`).
- Given a user who switches interface language, when they re-read the same amount, date or measurement, then the rendered value is character-identical apart from surrounding words (`F3-20`, `F3-22`).
- Given any language and any surface including generated documents, when a numeral renders, then it uses Latin digits (`F3-21`).
- Given a user-facing date or time, when it renders, then it uses the pack's declared style and the tenant's timezone, from the shared implementation (`F3-22`).
- Given a user with a non-default measurement preference, when they open a procurement or BOM quantity, then it is metric (`F3-23`).
- Given an amount carrying a provenance tier, provisional state or disclosure, when it renders compactly or on the narrowest supported screen, then the qualifier renders with it (`F3-24`).

---
### T-FPLAT-009 · The language-set boundary — the readiness gate and the add-a-language playbook
**Type:** engine · **Tier:** P0
**PRD rows:** F3-26, F3-27, F3-28
**Requirements (verbatim):**

- **F3-26** (P0) — **Adding a language is configuration, not a product change, and the playbook is defined.** Its steps: add the locale to the language set; translate, with English fallback covering the gaps (`F3-05`); check the script renders in the bundled font chain at every sanctioned weight, adding a face for a new script where needed (`F3-13`, `F3-14`); check the language's plural and grammatical-number rules are available; confirm the money implementation is **unchanged by design** (formats are the market's, not the language's — `F3-20`); and run the expansion check on the five densest screens (`F3-18`). The source's own closing condition holds: no design-token change, no component change, and no change to the product model beyond the language list itself.
- **F3-27** (P0) — **A language ships only when it passes the readiness gate.** Until its script renders in the bundled chain at every sanctioned weight, its quantity-bearing strings have the language's own plural forms, and the densest screens pass the expansion and render check (`F3-18`), the language is **not offered in the picker** — a half-ready language is absent rather than present and broken. Translation completeness is *not* part of this gate: an incompletely translated language is legitimate and falls back to English string by string (`F3-05`); a language whose script renders wrongly is not.
- **F3-28** (P1) — **A new script is a font and rendering question, never a redesign.** Adding a language in a script the product does not yet bundle adds that script's face at the sanctioned weights and extends the script-run handling; it does not fork the design system, the component set or the type scale. The per-script line-height mechanism (`F3-17`) is the extension point that makes this true.

**DONE WHEN:**

- Given a new language, when it is added, then the work consists of the playbook's steps only and produces no design-token change, no component change, and no product-model change beyond the language list (`F3-26`).
- Given a language that has not passed the script, plural-rule and expansion checks, when the language picker renders, then that language is not offered (`F3-27`).
- Given a language that has passed those checks but is incompletely translated, when it is selected, then it is offered and its gaps fall back to English (`F3-27`, `F3-05`).
- Given a language in a script the product does not yet bundle, when it is added, then a matching face is bundled at every sanctioned weight and no component or token is changed (`F3-28`).

---
### T-FPLAT-010 · STRUCK 2026-08-07 — the offline vocabulary and the capability boundary registry
**Type:** — · **Tier:** —
**PRD rows:** none — every row this task carried was deleted 2026-08-07.

**Struck in place by owner decision 2026-08-07**, which removed the offline/sync capability from the product and replaced `prd/foundations/F4-offline-and-sync.md` with `prd/foundations/F4-data-integrity.md`. Everything this task built was the boundary itself — the closed three-term vocabulary, the one-boundary-both-platforms parity rule, the time-not-scope commitment, the ruled offline-capable and online-only sets and their per-capability tables, the design-editing carve-out, the queued proposal-draft rule, and the boundary-governance row with its `Q15` ruling. With no connectivity boundary there is nothing to name, classify, police or move by ruling, and `prd/foundations/F4-data-integrity.md` §5 makes losing the connection an ordinary network error. Nothing is built here. **The task id is struck in place and not renumbered**, so `T-FPLAT-011` onward keep their numbers and every existing citation still resolves.

**Where the surviving obligations went — no citation was dropped:**

- **The stale-save rule** — a save that fails the server's version check rolls back the optimistically applied state and prompts a reload, never merged, never silently kept — is `F4-15`'s ("Design — single editor plus a server version check. No merge, ever") and, module-side, `M05-09`'s. Its acceptance now sits in **`T-FPLAT-012`**.
- **No device ever prints a customer-facing price computed locally** is `F4-04`'s ("no device computes, assigns or finalises a money figure or a business identifier for any market"), restated module-side at `M06-41`. Its acceptance now sits in **`T-FPLAT-011`**.
- **The honest immediate refusal** the online-only set stated — never queued, never an optimistic result, never a silent no-op — is live and verbatim at `F8-36`, built by **`T-FPLAT-032`** with its own acceptance line.
- **No capability is deferred into a "later" bucket** is live and independent at `OV-43`, dispositioned in `tasks/F-core.md`.

---
### T-FPLAT-011 · Server-owned truth and money, and idempotent apply
**Type:** engine · **Tier:** P0
**PRD rows:** F4-04, F4-07
**Requirements (verbatim):**

- **F4-04** (P0) — **The server owns truth and money.** Version checks, tenant checks, business identifiers and **every money figure** are computed server-side. The source states it as a rule about currency — *"every rupee [is] computed server-side"* — and the rule is market-neutral: no device computes, assigns or finalises a money figure or a business identifier for any market.
- **F4-07** (P0) — **Two guarantees hold from the product's first release: a survey is versioned-append, and a submission applied twice never produces a second record.** The source ties both to the write model rather than to any connectivity layer. Survey versioning is the conflict policy of `F4-14`; idempotent submission is what makes any retry safe, whether after a dropped request, a killed application or a duplicate delivery. The mechanism is engineering; the product law is that a retried capture never duplicates a record and never silently drops one.

**DONE WHEN:**

- Given any money figure or business identifier, when it is produced, then it was computed on the server, and no device computed, assigned or finalised it (`F4-04`).
- Given any customer-facing artifact — a document, a link, an export or a spoken figure — when it is produced, then no price in it was computed on a device (`F4-04`, `M06-41`).
- Given the same submission delivered twice, when the server applies it, then exactly one record exists and the second delivery returns the first outcome (`F4-07`).

*(Swept 2026-08-07 for the removal of the offline/sync capability. `F4-02` — "reads are local, always" — and `F4-03` — the durable device write queue — were deleted with `prd/foundations/F4-offline-and-sync.md`; the local-first read engine is a non-goal by name (`prd/foundations/F4-data-integrity.md` §5: "The product does not read from a cache"), and `M04-55` now rules that the photograph queue is the product's one and only device-held queue and "holds photographs and nothing else". The two clauses inside them that had independent life are already live elsewhere and already cited: no spinner walls at `F4-27`, and "nothing a field user captured is ever unrecoverable" at `F4-21`. The task title lost "the local-first core — local reads, the durable write queue" for the same reason. `F4-04`'s and `F4-07`'s texts above were re-pulled verbatim from the live document: `F4-04` lost its trailing "Offline output is always labelled provisional" clause and the `F8-16` citation with it — the general money law is `F8-12`'s, built by `T-FPLAT-028` — and `F4-07` lost "independent of when the offline layer lands". The second acceptance line above is deleted `F4-12`'s surviving headline, repointed to `F4-04` and `M06-41` per the 2026-08-07 audit; `F4-12`'s queued proposal-draft request and its "every figure shown from local data renders provisional" clause died with the queue and the cache.)*

---
### T-FPLAT-012 · The conflict-policy engine — versioned-append survey, design version check, per-field last-writer-wins, forward-only visit status
**Type:** engine · **Tier:** P0
**PRD rows:** F4-14, F4-15, F4-16, F4-17, F4-19
**Requirements (verbatim):**

- **F4-14** (P0) — **Survey — versioned-append. A revisit NEVER overwrites the first version.** A return visit to a site creates a **new survey version**; prior versions are immutable and remain readable forever. Within one in-progress version, edits by its own author resolve last-writer-wins by server apply order. The rule is stated as a product law, not a storage strategy: the first survey is evidence of what the site looked like on that day, and no later visit is permitted to erase it.
- **F4-15** (P0) — **Design — single editor plus a server version check. No merge, ever.** Every design save carries the version it was based on; a mismatch is **refused**, the client reloads server state, and the user re-applies their change. A design is one document and is never algorithmically merged; the version check is what makes a stale second editor impossible to lose silently rather than a mechanism for combining two edits.
- **F4-16** (P0) — **Lead field edits — per-field last-writer-wins, with an activity entry for every applied change.** Server apply order wins per field, and each applied change writes an activity entry naming the field, its old and new values, the actor and the capture time — **"so a 'lost' concurrent edit is always visible and recoverable from the log."** Last-writer-wins is acceptable here *only because* the log makes the loser recoverable; a module may not apply last-writer-wins to any field without that record. Stage transitions are validated against the pipeline state machine, and an invalid transition is refused.
- **F4-17** (P0) — **Visit — status only moves forward.** A visit's status advances through its states and never regresses; a write that would move it backwards is refused.
- **F4-19** (P0) — **Last-writer-wins is resolved by server apply order, never by device clocks. Capture time is display and audit only.** A device's clock may be wrong, deliberately or otherwise, and the product never lets it decide which of two edits survives. The time a capture was taken is preserved and shown — it is what the field user means by "when" — but it orders nothing.

**DONE WHEN:**

- Given an existing survey for a site, when a revisit is captured, then a new version is created and the earlier version is unchanged and still readable (`F4-14`).
- Given a design save based on a superseded version, when it reaches the server, then it is refused, no merge occurs, and the editor is prompted to reload (`F4-15`).
- Given a studio save that fails the server's version check, when the failure returns, then the optimistically applied state is rolled back and a reload is prompted, and the save is never merged and never silently kept (`F4-15`, `M05-09`).
- Given two edits to different fields of the same lead, when both are applied, then both changes are present and each has an activity entry naming field, old value, new value, actor and capture time (`F4-16`).
- Given a lead field edited concurrently by two people, when the later write wins, then the earlier value is recoverable from the activity log (`F4-16`).
- Given a visit at a later status, when a write attempts an earlier status, then the write is refused (`F4-17`).
- Given a notification read on one device, when the read reaches the server, then the read state travels up only, is set once, and nothing un-reads (`F6-07` — the row is quoted and built at `T-FPLAT-017`).
- Given two devices whose clocks disagree, when both submit edits to the same field, then the outcome is determined by server apply order and not by either timestamp (`F4-19`).

*(Swept 2026-08-07 for the removal of the offline/sync capability. This task survives whole — the concurrency law was never about connectivity — but four things changed. `F4-18` was deleted: its catalog half ("catalog is read-only on the device") dies with the device copy of the catalog, and the read-state half survives verbatim as live `F6-07`, "Read state travels up only and is set once — reading on one device reads everywhere; nothing un-reads", which is exactly what the sweep left standing when it cut `F6-07`'s offline clause; the read-state acceptance line above is repointed there and the catalog acceptance line is deleted. `F4-16` and `F4-17` were re-pulled verbatim: both lost their "corrected on the next sync" tails, and `F4-17` lost the word "offline" before "write". The stale-save acceptance line above arrives from struck `T-FPLAT-010`, where it co-cited deleted `F4-11`; `F4-11`'s connectivity half — "mobile carries no offline design surface", the studio surviving a blip — died with the boundary, and the acceptance survives intact under `F4-15` and `M05-09` ("a stale save is refused, never merged … never a silent no-op, never an optimistic result").)*

---
### T-FPLAT-013 · Nothing captured is unrecoverable — preserved submissions and attention items
**Type:** engine · **Tier:** P0
**PRD rows:** F4-21
**Requirements (verbatim):**

- **F4-21** (P0) — **Nothing a field user captured is ever unrecoverable.** A photograph taken in the field is held on the device until it has uploaded, and its waiting count and a retry are shown **on the capture screen itself** — there is no separate sync surface. A record that fails validation is preserved and badged for attention rather than crashing the screen or vanishing, and a submission the server cannot accept is preserved for recovery rather than discarded. The law the source states, and this document adopts whole: **"nothing a field user captured is ever unrecoverable."**

**DONE WHEN:**

- Given a record that fails validation, when it is loaded, then it is preserved and badged for attention and the screen renders without crashing (`F4-21`).
- Given a submission the server cannot accept, when the refusal returns, then the submission is preserved for recovery rather than discarded — never a silent disappearance and never a raw error — and the refusal itself is stated in plain language at the moment of the attempt (`F4-21`, `F8-36`).
- Given an attention item, when the user opens it, then a reason and a retry are shown, on the capture screen itself and on no separate sync surface (`F4-21`).

*(Swept 2026-08-07 for the removal of the offline/sync capability. `F4-20` was deleted: its acknowledgement lifecycle — applied-or-rejected, the item leaving the queue, server truth replacing local state — dies with the queue, and its "Given any queued submission" acceptance line goes with it. The law inside it does not die: a rejected submission is never a silent disappearance and never a raw error, which is live at `F4-21` ("a submission the server cannot accept is preserved for recovery rather than discarded") and at `F8-36` for the honest-refusal wording, so the second acceptance line above is repointed rather than deleted. The attention-item acceptance line, which cited deleted `F4-24`'s per-record chip, is likewise repointed to `F4-21`: the queued → syncing → synced chip is excised by name (`prd/foundations/F4-data-integrity.md` §5: "no queued or unsynced marker on any record") but the attention state — badged, with a reason and a retry, on the capture screen — survives verbatim there. `F4-21`'s text above was re-pulled verbatim from the live document; the task title lost "submission acknowledgement" for the same reason `F4-20` went.)*

---
### T-FPLAT-014 · The version-kept notice
**Type:** engine · **Tier:** P0
**PRD rows:** F4-25
**Requirements (verbatim):**

- **F4-25** (P0) — **The version-kept notice.** When a revisit creates a new survey version, the product tells the user what just happened in one line — the source's wording is **"v2 — v1 kept"** — shown at the moment of the revisit and carried on the record afterwards, with the earlier version reachable from it. The notice exists because `F4-14`'s guarantee is worthless if the person on the roof does not know it held: the fear it removes is *"have I just overwritten what I did last month?"*

**DONE WHEN:**

- Given a revisit to a previously surveyed site, when the new version is created, then the user is told in one line that the earlier version is kept, the line is carried on the record afterwards, and the earlier version is reachable from it (`F4-25`).

*(Swept 2026-08-07 for the removal of the offline/sync capability. This task was the five-surface sync-state model; four of the five surfaces and the principle that required them are gone, so it is reduced to the one row that was never about connectivity and retitled accordingly. **`F4-10`** — a read served from cache says so, with a staleness banner — is a non-goal by name (`prd/foundations/F4-data-integrity.md` §5: "no staleness or freshness banner"; "The product does not read from a cache"), and the money half it pointed at `F8-16` is carried by live `F8-12`, built at `T-FPLAT-028`. **`F4-24`** — the queued → syncing → synced per-record chip — is excised by name ("no queued or unsynced marker on any record"); its fourth state survives verbatim in `F4-21` and its acceptance line now sits in `T-FPLAT-013`. **`F4-26`** — the stale-read banner — is excised by name. **`F4-28`** — "all five surfaces are translated, honest and complete" — has no subject once the five are gone, and every obligation it imposed is already binding generally: `F3-01`/`F3-06`, `F3-19`/`F3-22`, `F7-42` and `F7-43`'s Definition of Done, now three base states not four per owner ruling 2026-08-07 `Q61`. **`F7-36`** — Principle 7, "offline is a visible state on every surface" — was **struck in place** in `prd/foundations/F7-design-language.md` by the same ruling and is deliberately not resurrected here; Principles 8–12 keep their numbers. **`F4-27`** is live and unchanged as law, but it is a property of every screen rather than a component this bucket builds, so it moves to **## Laws** below with its text re-pulled verbatim — the live row now reads "A warning never disables a primary action" and no longer speaks of connectivity. `F4-25`'s text above was re-pulled verbatim: it lost its "Surface 4 — " prefix.)*

---
### T-FPLAT-015 · The device-held photograph queue — unconditional capture, deliberate resumable upload, bounded device storage
**Type:** engine · **Tier:** P0
**PRD rows:** F4-21 (the carve-out half; the preserved-submission half is `T-FPLAT-013`'s) · `M04-55` (`prd/modules/M04-survey.md`, which owns the queue and is dispositioned in `tasks/M04-survey.md`)
**Requirements (verbatim):**

- **F4-21** (P0) — **Nothing a field user captured is ever unrecoverable.** A photograph taken in the field is held on the device until it has uploaded, and its waiting count and a retry are shown **on the capture screen itself** — there is no separate sync surface. A record that fails validation is preserved and badged for attention rather than crashing the screen or vanishing, and a submission the server cannot accept is preserved for recovery rather than discarded. The law the source states, and this document adopts whole: **"nothing a field user captured is ever unrecoverable."**
- **M04-55** (P0, `prd/modules/M04-survey.md`) — **Capture is unconditional; upload is deliberate — and this is the product's one and only device-held queue.** A photograph is written to the device the moment it is taken, with no delay, and uploads when the connection returns — resumably, defaulting to Wi-Fi-or-charging, with a per-batch "upload now" available. A photograph is never blocked, never degraded to fit a network, and never lost because an upload failed. The queue is **one queue, one direction, no conflicts and no merge**, it holds photographs and nothing else, and its status is shown **on the capture screen (`SCR-M04-07`) and nowhere else** — no global indicator, no separate centre, no per-record marker anywhere else in the product. The device storage cap and its eviction order are this row's: acknowledged originals are evicted first and an unacknowledged original is never evicted.

**DONE WHEN:**

- Given no connection, when a user takes a photograph, then it is written to the device the moment it is taken, with no delay, and the capture is neither blocked nor degraded to fit a network (`M04-55`).
- Given photographs held on the device, when the connection returns, then they upload resumably, defaulting to Wi-Fi-or-charging, with a per-batch "upload now" available (`M04-55`, `F4-21`).
- Given an upload interrupted by signal loss, an application kill or a restart, when the connection returns, then it resumes rather than restarting (`M04-55`).
- Given storage pressure at the device cap, when eviction runs, then acknowledged originals are evicted first and an unacknowledged original is never evicted (`M04-55`).
- Given photographs waiting to upload, when their status is read, then the waiting count and a retry are shown on the capture screen (`SCR-M04-07`) and nowhere else — no global indicator, no separate centre, and no per-record marker anywhere else in the product (`F4-21`, `M04-55`).
- Given any device-held holding path proposed anywhere in the product, when it is reviewed, then it is refused: this queue is the product's one and only device-held queue and it holds photographs and nothing else (`M04-55`).

*(Rewritten 2026-08-07. This is the one surviving carve-out of the removed offline/sync capability, not a casualty, so the task is repointed rather than struck. `F4-29`, `F4-30` and `F4-31` were deleted with `prd/foundations/F4-offline-and-sync.md`, and live `M04-55` claims their content by name — unconditional capture with no delay, Wi-Fi-or-charging default, the per-batch "upload now", resumability, and the storage cap with acknowledged-originals-evicted-first. The clauses that did not survive: `F4-29`'s "small mutations always upload immediately", which presupposed a mutation queue that no longer exists; and the sync centre the per-batch override used to be reached from, which is replaced by `SCR-M04-07` alone. **Three details did not travel into `M04-55` and are flagged to the owner as detail lost in the move, not law lost:** `F4-31`'s **2 GB** cap figure; `F4-31`'s rule that when the cap is reached with nothing acknowledged to evict the product tells the user rather than choosing for them; and `F4-30`'s thumbnail-retention detail — the device keeping the thumbnail so the record still looks complete after the full-resolution original is pruned. The retention guarantee itself is not lost: `M04-55`'s eviction order plus `F4-21`'s "held on the device until it has uploaded" carry it.)*

---
### T-FPLAT-016 · Continuity under a billing block — the field photograph always uploads, capture runs to `halted`, reads and exports are never gated
**Type:** engine · **Tier:** P0
**PRD rows:** `M12-26`, `M12-24`, `M12-22`, `M12-27` (`prd/modules/M12-platform-billing.md`, dispositioned in `tasks/M12-platform-billing.md`) — none of this bucket's own rows survive here; every F4 row this task once carried was deleted 2026-08-07, and one obligation has no live carrier at all and is recorded below rather than dropped. See the dated sweep note at the end of the block.
**Requirements (verbatim, carried from their live carriers):**

- **M12-26** (P0, `prd/modules/M12-platform-billing.md`) — **A photograph already captured in the field always uploads, in every billing state.** The block is on new mutations from the interface, never on the upload of a photograph the field user has already taken — the one piece of work the product holds on the device (`F4-21`). No gate may inspect, delay or refuse that upload, and reads work while blocked.
- **M12-24** (P0, `prd/modules/M12-platform-billing.md`) — **The never-gated list is law:** reads · search · exports · customer links · billing screens · **engineer sign-off on already-submitted designs** (a safety workflow) · the upload of photographs already captured in the field. No enforcement design may touch any of them, in any state, for any cap.
- **M12-22** (P0, `prd/modules/M12-platform-billing.md`) — **The always-on set is enforced as unconditional:** in every state including `halted`, `expired` and post-period `cancelled` — read everything, search, dashboards; export (CSV, data export, existing proposal PDFs, invoices); customer links (view **and** respond) and progress pages; billing screens with pay/upgrade/reactivate. The gated set pauses only at `halted`/`expired`/`cancelled`(post-period): create/edit of leads, tasks, activities, surveys; studio create/edit (read-only open always works); generate/send proposals, mark won/lost, project updates; file/photo uploads. Metered features pause from `past_due` day 4; team invites (OTP spend) block from day 4.
- **M12-27** (P0, `prd/modules/M12-platform-billing.md`) — **New field capture is never cut off before `halted` (owner ruling 2026-08-04, Q16).** No enforcement mechanic cuts off new field capture during dunning — capture works through the **full dunning grace** (the `past_due` window, M12-39) and **pauses only at `halted`**; a **halt that lands mid-visit lets the current visit complete** ("never strand a surveyor on a roof"); reads, exports and the upload of already-captured photographs are unchanged, always-on (M12-24, M12-26).

**DONE WHEN:**

- Given a tenant in a blocked billing state — `halted`, `expired` or post-period `cancelled` — when the device holds a photograph already captured in the field, then that photograph still uploads and no gate inspects, delays or refuses it (`M12-26`, `M12-24`).
- Given a tenant inside the `past_due` dunning grace, when a field user captures new work, then capture is not cut off; capture pauses only at `halted`, and a halt landing mid-visit lets the current visit complete (`M12-27`).
- Given any billing state at all, when a user reads, searches or exports, then all three work and no enforcement design touches them (`M12-22`, `M12-24`).

**⚠ Obligation with no live carrier — recorded 2026-08-07 as register question `Q66`, awaiting an owner ruling. Nothing is built for it here, and no dead row is cited for it.**

> When a different user signs in on a device that is holding another user's unuploaded field photographs, tenant isolation wins: the held photographs are discarded before any new data loads, and the person whose work is being discarded is told before it happens.

*Why this is recorded rather than built (register `Q66`, raised 2026-08-07):* the obligation above was the second half of `F4-32`, deleted that day with the offline/sync capability. Its first half — local reads and writes continuing indefinitely while a session token is expired — died with the local-first store and is correctly gone. The second half did not become moot, because the photograph carve-out survived the sweep: a shared field phone still holds one user's unuploaded photographs when a different user signs in, and the answer is a tenant-isolation question rather than a convenience one ("tenant isolation beats convenience" was the source's own rule). The live PRD was read for a carrier and has none: `M04-55` governs the queue but says nothing about who is signed in; `F4-21` promises nothing captured is unrecoverable, which pulls the other way; `M01-07` covers session lifetimes and revocation but not device-held data; `F2-20` covers deactivation, not user switching. This is a hole the carve-out created, and it is a build blocker for any multi-user field device.

*(Swept 2026-08-07 for the removal of the offline/sync capability, and retitled. `F4-33`'s law survives precisely and by name at `M12-26` and `M12-24`; only its words "offline-captured survey data still syncs" needed cutting, because there is no survey queue to drain — the one piece of work the product holds on the device is the photograph. `F4-34`'s mechanism — entitlement cached on the device with a 72-hour grace so a dead zone is not read as an absent payment — dies with the cache and is cut, but the two rulings it carried are live and their citations land here rather than vanishing: the `Q16` capture edge is verbatim at `M12-27`, and "read and export always work regardless" is `M12-22`'s unconditional always-on set and `M12-24`'s never-gated list. `F4-32` is recorded above as an obligation with no live carrier.)*

---
### T-FPLAT-017 · The notification type registry and the record-of-truth model
**Type:** engine · **Tier:** P0
**PRD rows:** F6-01, F6-02, F6-05, F6-06, F6-07, F6-08, F6-09
**Requirements (verbatim):**

- **F6-01** (P0) — **The notification centre, push wiring and global search are committed v1 scope** — a bell centre with grouped, actionable items; push; one app-wide search. This document is their specification; no module builds a private notification surface or a private search box.
- **F6-02** (P0) — **Every notification deep-links to its subject and is actionable from where it lands.** A notification is a pointer to a real record — the lead, the design, the tranche, the invite — never a dead announcement. Where the subject offers a one-step act the recipient may perform (approve, resend, pay, reassign), the notification surfaces it.
- **F6-05** (P0) — **One notification type registry, complete from day one and extended only by registration.** The source's day-one enum: `proposal_opened` · `agent_escalation` · `follow_up_due` · `survey_submitted` · `design_returned` · `signoff_requested` · `payment_due` · `lead_unassigned_24h` · `system` (the full enum exists from day 1, forward-compatible). The V2 modules extend the registry with the types their §4 contracts hand this document (all in §F6.3's matrix); every type is registered here with its recipients and channels — no unregistered notification can exist.
- **F6-06** (P0) — **The notification record is the source of truth; push is best-effort by contract.** The in-app inbox and the badge derive from the record, so a dropped push never loses information — push is a tap on the shoulder, the inbox is the fact. Each record tracks read state and a push-sent marker.
- **F6-07** (P0) — **Read state travels up only and is set once** — reading on one device reads everywhere; nothing un-reads. *(Re-pulled verbatim 2026-08-07: the sweep cut this row's offline tail — "offline reads sync per F4's conflict rule for notification read-state. Notifications read from the local cache offline; new items arrive with sync" — and kept exactly the up-only law, which is also where deleted `F4-18`'s and deleted `F6-18`'s surviving halves now land.)*
- **F6-08** (P0) — **Language is fixed at emit time.** Title and body render in the recipient's language when the notification is created — notifications are not re-translated when the user later switches language; the deep-linked subject renders in whatever language the user has at open time.
- **F6-09** (P0) — **Notifications are never billing-gated.** The inbox, badge and history are reads and live in the soft-block matrix's always-on set; billing-state events themselves are matrix rows (§F6.3).

**DONE WHEN:**

- Given any notification anywhere in the product, when tapped, then it opens its subject (or the honest landing) and the act it offered is real (F6-02).
- Given every notification in the product, when traced, then its type exists in the registry with recipients, channels, grouping and urgency defined (F6-05).
- Given a dropped push, when the user opens the app, then the inbox contains the record and the badge counted it (F6-06).
- Given a language switch, when the inbox renders, then old items keep their emit-time language and new items use the new language (F6-08).
- (F6-01, F6-07 and F6-09 carry no dedicated Given/When/Then lines in the PRD's acceptance block; the requirement texts above are the binding criteria)

---
### T-FPLAT-018 · Notification delivery — the event matrix, channels, urgency classes, quiet hours, per-user mutes, recipient resolution
**Type:** engine · **Tier:** P0
**PRD rows:** F6-10, F6-11, F6-13, F6-14, F6-15, F6-16
**Requirements (verbatim):**

- **F6-10** (P0) — **The matrix below is the complete v1 event registry** — every notification-worthy event named by a module's §4 contract, with its recipients (persona + scope) and channels. It is the cross-check the suite's modules registered into (M02, M03, M04, M05, M06, M07, M08, M09, M10, M11, M12, M13, F5); an event absent from a module's contract and from this table does not notify. *(Re-pulled verbatim 2026-08-07: `F4` was dropped from the registering list when the offline/sync capability was removed — the deleted document's §4 contract raised the sync and queue events, and `prd/foundations/F4-data-integrity.md` raises none.)*
- **F6-11** (P0) — **Channels are in-app and push, and nothing else, for every staff notification** — with one exception: the M12 dunning family additionally rides the market pack's platform→tenant channel stack (registered-template SMS, opted-in business messaging — `M12-40`'s rows, `F1-38`'s rule). No other event may use an out-of-app channel; a module wanting one is asking for a pack-level decision, not a notification setting.
- **F6-13** (P0) — **Two urgency classes, fixed per type:** **immediate** (agent escalation, proposal accepted — pushed at once, never grouped, never held by quiet hours *within the working day*) and **standard** (everything else — pushed subject to quiet hours, groupable). A type's class is registered, never per-event improvised (no false urgency — F6-03).
- **F6-14** (P1) — **Quiet hours: tenant-configurable, applied to push only.** The tenant declares staff quiet hours (default: outside ordinary working hours in the tenant's timezone, `F1-10`; formats per `F1-21` — the defaults ride the market pack's locale conventions, the setting is the tenant's). During quiet hours, standard pushes hold and deliver at the window's end; the in-app record is always immediate. Immediate-class events in practice occur inside working hours (agent calls run in the market's lawful calling window — `F1-36` is the voice law, not this document's), so quiet hours and immediacy do not collide; where they ever would, the push holds and the record stands — no staff notification wakes a phone at night.
- **F6-15** (P2) — **Per-user notification preferences are minimal and honest:** a user may mute push per type-group (never the in-app record, never audit-relevant billing/compliance events for the Owner); no per-event snooze theatre. The record always lands (F6-06).
- **F6-16** (P0) — **Recipients resolve through F2 scope at emit and at open.** A notification targets personas by scope ("the record's owner", "team's manager", "portfolio Operations"), resolved by F2's domains (`F2-12`–`F2-14`, with team membership per `M10-32`); a recipient who has lost the subject's visibility gets the honest landing (F6.2 edge). No notification widens anyone's visibility — the notification never contains more of the record than its recipient may read.

**DONE WHEN:**

- Given every module's §4 contract (M01–M13, F5), when its named events are checked against the matrix, then each appears with recipients and channels, and the matrix contains no event no module raises (F6-10).
- Given an agent escalation, when it fires, then the rep's push is immediate and ungrouped, and the record deep-links to the call/lead (F6-13, F6-02).
- Given quiet hours configured, when a standard event fires at night, then no push sounds before the window ends and the in-app record is already there (F6-14).
- Given any notification, when its content is compared against the recipient's scope, then it discloses nothing beyond what the recipient may read (F6-16).
- Given the matrix this task builds, when its M05 rows are inspected, then `design_survey_superseded` stands beside `signoff_requested` and `design_returned` with recipient "the design's author (own)" and push marked, sourced to M05-13 (owner ruling 2026-08-04, Q24); and given the supersession emitter (`tasks/MS-studio-a.md` T-MS-117) raising that event when a newer survey version supersedes a design's inputs, then delivery resolves that author through F2 scope, the in-app record lands, and the push carries the standard class F6-13 assigns to everything outside its immediate pair — no ad-hoc type anywhere in the path (F6-10, F6-13, F6-16, owner ruling 2026-08-04 Q24).
- (F6-11 and F6-15 carry no dedicated Given/When/Then lines in the PRD's acceptance block; the requirement texts above are the binding criteria)

---
### T-FPLAT-019 · The notification centre's data contract — up-only read state and the bounded horizon
**Type:** engine · **Tier:** P0
**PRD rows:** F6-19 · F6-07 (the centre's read-state contract; the row is quoted and built at `T-FPLAT-017`)
**Requirements (verbatim):**

- **F6-19** (P2) — **History is bounded and honest:** the centre keeps a practical horizon of items (with read state); the underlying facts live on their records' timelines forever — the centre is an inbox, not an archive, and says so at its horizon.

**The centre's read-state contract is `F6-07`'s** — "Read state travels up only and is set once — reading on one device reads everywhere; nothing un-reads" — quoted verbatim and built at `T-FPLAT-017`, and never blocking on the network is `F4-27`'s, carried under **## Laws**.

**DONE WHEN:**

- (F6-19 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion. The centre's read-state acceptance is `F6-07`'s at `T-FPLAT-017`.)

*(Swept 2026-08-07 for the removal of the offline/sync capability. `F6-18` — "the centre works offline: cached items read, read-state syncs up-only, new items arrive with sync" — was deleted. Its cached-items and arrive-with-sync clauses die with the cache; its read-state clause is live and verbatim at `F6-07`, and its never-blocking clause is live at `F4-27`, so the citation is repointed rather than excised — a plain excise would have left the centre's read-state contract with no row at all. The airplane-mode acceptance line is deleted, and the task title lost "offline cached reads".)*

---
### T-FPLAT-020 · Global search — scope-enforced results, the alias law, junk leads and plain ranking
**Type:** engine · **Tier:** P0
**PRD rows:** F6-21, F6-22, F6-23, F6-24, F6-25
**Requirements (verbatim):**

- **F6-21** (P0) — **Search is scoped by role visibility — D20, per domain, no leakage.** A result appears only if the searcher's F2 scopes would let them open it: leads per lead visibility, projects per project visibility, people per people-records scope, campaigns per campaign scope (`F2-12`–`F2-14`). Search never becomes the side door around a scope — the dedupe sheet's minimal-disclosure surface (`M02-08`) is the only sanctioned cross-scope reveal in the product, and it is not this one.
- **F6-22** (P0) — **The search-alias law (R1's single exception):** the queries "quote" and "quotation" return **Proposals** — because that is what users will type — while both words stay banned from identifiers, interface strings and documents. The alias is a query behaviour only; results, labels and the opened records say "Proposal" in every locale.
- **F6-23** (P0) — **Junk leads surface in search only.** A lead marked junk leaves every queue and list but is never deleted; search is the one surface that still finds it (with its junk state plain), and Reopen exists from there for the rare mistake.
- **F6-24** (P0) — **Search is never billing-gated.** In every billing state, search works — it is in the soft-block matrix's always-on set. *(Re-pulled verbatim 2026-08-07: the sweep cut this row's offline half — "Search works offline over synced data"; "Offline, the box searches the device's synced cache with the standard staleness indication (`F4-02`)" — which cited a row that no longer exists. The task title lost "offline reads" with it.)*
- **F6-25** (P1) — **Search finds records, not analytics:** results are records the searcher can open — no computed answers, no cross-record aggregation, no natural-language querying in v1 (§5). Result ranking is plain (exact identifier matches — phone, proposal number — first; then name/city matches); no engagement tuning.

**DONE WHEN:**

- Given a searcher with any scope set, when results render for each entity type, then every result is a record their scopes let them open, and none other (F6-21).
- Given the queries "quote" and "quotation", when submitted, then Proposals return and every rendered label says Proposal (F6-22).
- Given a junk lead, when its phone number is searched by a user whose scope contains it, then it returns with its junk state visible; and given any list or queue, then it does not appear there (F6-23).
- Given a halted tenant, when search runs, then results return (F6-24).
- (F6-25 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion)

---
### T-FPLAT-021 · The message-template registry
**Type:** engine · **Tier:** P0
**PRD rows:** F6-26, F6-27
**Requirements (verbatim):**

- **F6-26** (P0) — **One message-template registry supplies every manual copy-paste flow:** templates per key — `proposal_share` · `follow_up_nudge` · `payment_reminder` · `visit_confirmation` · `survey_complete` (the post-survey promise-with-a-date of `foundations/F5`'s `F5-14`, seeded as *"Survey done. Your proposal will reach you by <date>."* with `<date>` as its placeholder — the key was seeded when `Q24` was applied and enters this list by owner ruling 2026-08-06, Q55) · `handover` · `crew_arrival` (the evening-before pre-installation message of `foundations/F5`'s `F5-68`, seeded with who is coming, when, how long it will take and what disturbance to expect, plus the crew lead's name and number — owner ruling 2026-08-06, Q49). **This list is exhaustive, not illustrative (owner ruling 2026-08-06, Q55):** every key the platform seeds appears in it, so this one row answers *"what messages does this product send to customers?"* — and seeding a key anywhere, by any later ruling, task or module, is not complete until the key is added here. Templates are tenant-extendable, one version per template per language (three at launch), with placeholders; the platform seeds a starter set. Consumed by the share flows of `modules/M06`, `M07`, `M08` (and `M11`'s payment-request message); the composed output **sends from the tenant's connected transactional channel where one exists, and is copied for a person to send where none is** (owner ruling 2026-08-04, Q33 — the fallback path claims no delivery, D32's surviving discipline). The hour a scheduled send goes out is never this registry's: it is market-pack data under `F1-15`/`F1-17`, read on the tenant's timezone under `F1-10` (owner rulings 2026-08-06, Q50 and Q54). *(Amended to owner ruling 2026-08-06, Q49 — the authoring act applying `Q46`, not a new decision; this key list previously read `proposal_share` · `follow_up_nudge` · `payment_reminder` · `visit_confirmation` · `handover` and carried no row for the evening-before crew message, a gap `foundations/F5-customer-link.md` §6 recorded as open — register `Q49` — once `Q46` put that message on the automatic transactional lane. The precedent named by the ruling is `survey_complete`, seeded when `Q24` was applied. Nothing else in the row changes; the send-rail sentence and the Q33 fallback discipline are untouched.)* *(Further amended to owner ruling 2026-08-06, Q55 — the list's status and its one missing key. Immediately before this amendment the key list read `proposal_share` · `follow_up_nudge` · `payment_reminder` · `visit_confirmation` · `handover` · `crew_arrival`, and the row said nothing about whether that was the registry's whole seeded set: `survey_complete`, seeded when `Q24` was applied, lived only in `tasks/F-platform.md` T-FPLAT-021's DONE WHEN and `tasks/F5-customer-link.md`'s `F5-14` trace, so two seeded keys were recorded two different ways — the asymmetry §6's `F6-Q4` recorded as open, register `Q55`. The ruling makes the list exhaustive and adds `survey_complete` to it. No key is removed, no seeded copy changes, and the tenant-extendable clause, the send-rail sentence, the Q33 fallback discipline and the never-this-registry's-hour sentence are all untouched.)*
- **F6-27** (P0) — **Templates are tenant data, per language — never translation-catalog messages.** The content-class law is `F3-10`'s; the missing-language behaviour is ruled (owner ruling 2026-08-04, `Q10`): the reader sees the original language with a small note — never a silent substitution — and the gap is surfaced to the author.

**DONE WHEN:**

- Given each template key, when a share flow requests it in each launch language, then the tenant's version (or the seeded default) returns with placeholders resolved, and the composed output sends from the tenant's connected transactional channel where one exists and is copied for a person to send where none is — the copy path claiming no delivery (F6-26, owner ruling 2026-08-04 Q33). *(This line previously read "no send capability exists anywhere in the flow", the pre-Q33 D32 discipline; it contradicted F6-26's own reconciled text above and is corrected here — see `prd/registers/conflicts.md` row 4.)*
- Given the starter set this registry seeds, when it is inspected, then it carries a `survey_complete` key beside `visit_confirmation`, whose seeded copy is the fixed customer-facing form *"Survey done. Your proposal will reach you by <date>."* with `<date>` as its placeholder — the promise-with-a-date `F5-14` fixes; and given the survey-submission emitter (`tasks/M04-survey.md` T-M04-009) requesting that key in each launch language, then the composed output sends from the tenant's connected transactional channel where one exists and is copied for a person to send where none is, with no delivery claimed on that path (`F6-26`, `F5-14`, `M03-03`, owner ruling 2026-08-04 Q33).
- Given the starter set this registry seeds, when it is inspected, then it carries a `crew_arrival` key beside `visit_confirmation` and `survey_complete`, whose seeded copy carries the four facts `F5-68` requires — who is coming, when, how long it will take, and what disturbance to expect — plus the crew lead's name and number; and given the evening-before scheduler (`tasks/F5-customer-link.md` T-F5-002) requesting that key in each launch language, then the composed output sends from the tenant's connected transactional channel where one exists and is copied for a person to send where none is, with no delivery claimed on that path (`F6-26`, `F5-68`, `M03-03`, owner ruling 2026-08-06 Q49 — the authoring act applying Q46, on the `survey_complete` precedent set when Q24 was applied).
- Given that same `crew_arrival` send, when the moment it goes out is resolved, then the hour comes from the market pack and never from this registry, and this task seeds no hour, no default hour and no tenant setting for one: the hour is a pack default the tenant may narrow and the statutory messaging window it sits inside is a pack floor, so a configured slot outside lawful hours resolves to the last lawful moment before it and never after; and the clock that hour is read on is the **tenant's** timezone (`F1-10`) and never the customer's, so this task reads no customer timezone and stores none for send timing; and the window that hour sits inside is evaluated on that **same tenant clock** — one clock for the hour and the window, never two — so this task computes no second frame and reconciles none, including where a tenant's timezone differs from its market's default (`F1-21`) (`F1-15`, `F1-17`, `F5-68`, owner rulings 2026-08-06 Q50, Q54 and Q58). *(Clock clause for the hour added by the pass applying Q54; Q50 had read the hour on "the customer's market timezone", the divergence against `F1-10` that `prd/foundations/F1-global-market-framework.md` §6 recorded as open. Clock clause for the window added by the pass applying Q58, which settles the frame question `F1-Q4` had recorded as open once Q54 moved the hour alone; the owner's premise and its accepted consequence are the same as Q54's, recorded at `F1-15`. **What the hour and the window *are* is still not declared for IN** — the IN pack declares neither a statutory messaging window nor a send hour, register `Q53` is open — so this criterion tests the resolution rule and no build here may assume a value for either.)*
- Given the starter set this registry seeds, when its keys are compared with `F6-26`'s key list, then the two sets are identical — every seeded key is named in the list, including `survey_complete` and `crew_arrival`, and the list names no key the starter set lacks; and given a later act that seeds a new key, then that act is incomplete until the key is added to `F6-26`'s list, because the list is exhaustive rather than illustrative (`F6-26`, owner ruling 2026-08-06 Q55). *(Criterion added by the pass applying Q55. Before the ruling this task's DONE WHEN was the only place `survey_complete` was recorded — the asymmetry `prd/foundations/F6-notifications-and-search.md` §6 raised as `F6-Q4` — and nothing tested the seeded set against the list.)*
- (F6-27 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion)

---
### T-FPLAT-022 · Tenant branding scope and the contrast re-verification engine
**Type:** engine · **Tier:** P0
**PRD rows:** F7-07
**Requirements (verbatim):**

- **F7-07** (P0) — **Tenant branding applies to customer-facing documents and link pages only; the operator application is never restyled per tenant.** A tenant supplies a logo and a primary brand colour that appear on the generated proposal document and the tokenised customer-link pages. There is no tenant stylesheet, no theme upload and no per-tenant palette anywhere in the web or mobile application. When a tenant saves a palette, contrast is **re-verified computationally and the palette is never rejected**: compliant shades are derived from what the tenant chose and previewed live, so a tenant is never told their brand colour is wrong and never allowed to publish an unreadable document.

**DONE WHEN:**

- **Given** a tenant has saved a brand colour and logo, **when** a proposal document and a customer-link page render, **then** both carry that branding and the operator application carries none; and **when** the saved colour would fail contrast, **then** a compliant shade is derived and previewed rather than the palette being refused (`F7-07`).

---
### T-FPLAT-023 · The design-system adherence build gate
**Type:** engine · **Tier:** P0
**PRD rows:** F7-03, F7-26
**Requirements (verbatim):**

- **F7-03** (P0) — **No document in this suite, and no screen in the product, restates a design-system value.** Requirements name roles and rules; values stay in the token files. On screens the same law is mechanical: **zero raw colour literals and zero off-scale dimensions** — every visual value reaches a screen through the design system, never by transcription. This is a completion condition, not a style preference (`F7-43`, item 10).
- **F7-26** (P0) — **Every icon-only control carries an accessible label, and a missing label is a build failure rather than a warning.** The source's escalation is carried deliberately: this is not a lint suggestion, it is a completion condition. An icon-only control without a label is unusable by a screen-reader user and ambiguous to everyone else.

**DONE WHEN:**

- **Given** a requirement in any PRD in this suite that concerns appearance, **when** a reader looks for the value behind it, **then** the value is found in `design/ds-source/`, and the PRD states only the role or rule (`F7-01`, `F7-03`).
- **Given** any screen in the product, **when** its rendered styles are inspected, **then** no raw colour literal and no off-scale dimension is present (`F7-03`).
- **Given** an icon-only control, **when** the build runs, **then** a missing accessible label fails the build rather than warning (`F7-26`).
- **Given** the shipped product, **when** its surfaces and settings are inspected, **then** no dark value-set ships, no per-user theme switch exists and no surface — including the studio canvas and the customer's 3D view — renders a dark variant, while the semantic alias layer remains intact so a dark set could be added later without a redesign (`F7-04`).

---
### T-FPLAT-024 · Opt-in high-contrast field mode as a per-user capability
**Type:** engine · **Tier:** P1
**PRD rows:** F7-16
**Requirements (verbatim):**

- **F7-16** (P1) — **A high-contrast field mode exists as a sanctioned, opt-in escape hatch for working in sunlight.** It is a product-visible capability, not a styling variant: a user working outdoors can turn it on and get a legible interface on a phone screen in direct sun, and turning it on is the one condition under which the no-borders law of `F7-15` yields. It is opt-in and per user; it is not a theme, not a tenant setting, and not the light/dark switch that `F7-04` excludes.

**DONE WHEN:**

- **Given** a user in direct sunlight, **when** they enable field mode, **then** the interface becomes legible and the change is per user and reversible (`F7-16`).

---
### T-FPLAT-025 · Role-adaptive shell centre-verb resolution
**Type:** engine · **Tier:** P0
**PRD rows:** F7-22
**Requirements (verbatim):**

- **F7-22** (P0) — **The mobile shell is an arc bar with an elevated centre action; the desktop shell is a sidebar.** Mobile navigation is not a flat tab rectangle: it is an arc with a raised centre action that is **near-black — the primary-action colour, not a brand colour** — carrying an ink glyph that never changes per screen, while the **verb it performs adapts to the person's role** (a sales persona adds a lead; a surveyor starts a survey). The surrounding slots are the persona's few standing destinations. Desktop uses the sidebar-and-header shell. Both shells are part of the design system rather than per-module inventions.

**DONE WHEN:**

- **Given** the mobile application, **when** the shell renders for any persona, **then** the arc centre is the near-black primary action with a fixed glyph and a role-appropriate verb (`F7-22`).

---
### T-FPLAT-026 · The provenance model — four closed tiers, weakest-member aggregation, shown tier changes, configuration-proof labels
**Type:** engine · **Tier:** P0
**PRD rows:** F8-01, F8-02, F8-03, F8-04, F8-05, F8-06, F8-07
**Requirements (verbatim):**

- **F8-01** (P0) — **Every user-visible number carries exactly one provenance tier.** Not most numbers, not the headline numbers — every number a user can read, on every surface named in §2, including numbers inside generated documents and numbers spoken aloud. A number whose tier cannot be established is not rendered as a number; the surface shows what is missing instead.
- **F8-02** (P0) — **The four tiers, verbatim and canonical:** `measured` (on site) · `derived` (computed from model/imagery/BOM geometry) · `estimated` (heuristic from capacity+location, incl. Path B AI fill) · `assumed` (catalog defaults without design). These definitions are the product's, not a screen's: the BOM's per-line confidence, the proposal's honesty labels and the customer link's disclaimers all read the same four values with the same meanings.
- **F8-03** (P0) — **The set is closed: "No screen invents a fifth tier."** No surface, module, market pack, tenant configuration or future release adds a tier, renames one, or introduces a parallel vocabulary (a "provisional" or "unverified" tier alongside these four). Where a surface needs to say more than the tier says, it says it as prose beside the tier — never as a new tier value. A genuine need for a fifth tier is an owner ruling recorded in `registers/open-questions.md`, not a local decision.
- **F8-04** (P0) — **An aggregate inherits the weakest tier of its members.** Any number computed from other numbers — a block total, a system total, a project roll-up, a comparison row, a dashboard tile — carries the weakest tier present in its inputs, in the order `measured` → `derived` → `estimated` → `assumed` (weakest last). Aggregation never launders a weak input into a stronger claim, and resolution changes never change the honesty: at any scale, tiers go block-level, not away.
- **F8-05** (P0) — **A tier change is shown, never silent.** When a number's provenance improves or degrades — a proposal built without a design later gets one, a source of record becomes unavailable and a fallback takes over, a survey moves from remote to on-site — the product states what changed before committing it, and the new tier is visible where the number is read. Energy figures in particular "never silently switch source".
- **F8-06** (P0) — **Number-honesty is platform behaviour and is never a tenant configuration surface.** The source draws the line explicitly against the fully tenant-configurable voice agent: the product's own number-honesty — provenance labels, and estimates never printed as calculations — governs the proposal and design *output*, not anyone's speech, and is therefore not the tenant's to shape. No preset role, no permission, no plan entitlement, no white-label setting and no template edit can remove, weaken, rename or hide a provenance tier, a source label, a staleness state or a disclosure required by this document.
- **F8-07** (P0) — **Labels are readable, not decorative, and never hover-only.** A tier, a source label, a staleness state or an honesty caveat renders as persistent, legible content beside the number it qualifies — not as a tooltip, not as a hover state, not as a colour difference alone, not as a footnote the reader must seek out. The source states the failure mode it is guarding against directly: the caveat is on the screen, not in a tooltip.

**DONE WHEN:**

- Given any surface in the product, when it renders a number, then exactly one of the four tiers of `F8-02` accompanies that number, in persistent visible content (`F8-01`, `F8-07`).
- Given any screen, document, export or spoken output in the product, when its provenance values are enumerated, then the set is a subset of `{measured, derived, estimated, assumed}` and no other tier value exists anywhere (`F8-02`, `F8-03`).
- Given a total computed from members of mixed provenance, when the total renders, then its tier equals the weakest tier among its members (`F8-04`).
- Given a number whose provenance changes, when the change is applied, then the user is shown what changed before it commits and the new tier renders with the number afterwards (`F8-05`).
- Given any role, plan, tenant setting or template in the product, when it is exercised, then no provenance tier, source label, staleness state or required disclosure is removed, renamed or hidden (`F8-06`).

---
### T-FPLAT-027 · Energy source labelling and the fallback chain
**Type:** engine · **Tier:** P0
**PRD rows:** F8-08, F8-09, F8-10, F8-11
**Requirements (verbatim):**

- **F8-08** (P0) — **Energy figures carry a source label in addition to their provenance tier, and the label names the database.** The two labels are fixed copy, verbatim: **"Real · PVGIS ({database})"** where the energy source of record supplied the figure, and **"Built-in estimate ±10%"** where the built-in latitude-fit fallback did. The `{database}` slot is filled with the specific database the figure came from, so a reader can tell two source-of-record figures apart. Per the suite's vendor rule, the capability is "the market's energy source of record"; the v1 reference implementation is PVGIS with its documented database ladder, and the label copy above is the required v1 rendering.
- **F8-09** (P0) — **The source is never switched silently, and the label is per figure.** A figure produced from the fallback is labelled as such wherever it appears, including inside documents already generated; a screen may not label itself once and let mixed-source figures share the header. The provenance line naming the database travels with the figure into the proposal, the customer link and every export.
- **F8-10** (P0) — **A source fallback never blocks work, and it never stops at the energy figure.** When the source of record is unavailable, the product falls back to the built-in estimate, labels it, and continues — "design is never blocked". The estimate badge rides on the energy output *and* on every financial output computed from it, and money produced from an estimate carries the provisional provenance chain of §F8.3 rather than rendering as final.
- **F8-11** (P0) — **A model's documented limits travel with the model's outputs.** Where a computed output is produced by a model with known, documented limitations, those limitations are stated where the output is read — at every scale and on every surface, not only in a specification. Decorative scene elements that do not participate in a computation say so plainly rather than implying they were considered. Faster computation never changes what the physics claims.

**DONE WHEN:**

- Given an energy figure produced by the source of record, when it renders on any surface, then it carries "Real · PVGIS ({database})" with the database named (`F8-08`).
- Given an energy figure produced by the built-in fallback, when it renders on any surface, then it carries "Built-in estimate ±10%" (`F8-08`).
- Given the source of record is unavailable, when a user creates or opens a design, then the work proceeds, the fallback label appears on the energy figure, and every financial figure computed from it carries the fallback badge and the provisional chain (`F8-10`).
- Given a document containing energy figures, when it is exported or opened through the customer link, then each figure's source label travels with it unchanged (`F8-09`).
- Given an output produced by a model with documented limitations, when it is read on any surface or in any export, at any scale, then those limitations are stated where the output is read, and a scene element that does not participate in the computation states plainly that it does not (`F8-11`).

---
### T-FPLAT-028 · Money never renders stale — version pinning, comparison-derived staleness, provisional rendering, sent-document immutability
**Type:** engine · **Tier:** P0
**PRD rows:** F8-12, F8-13, F8-14, F8-15, F8-17, F8-18, F8-19
**Requirements (verbatim):**

- **F8-12** (P0) — **The law, verbatim: "money must never render as final while stale — this is a hard product rule."** Before a money figure is displayed it is reconciled against its inputs; if it is current, it renders as final; if it is not — or if it cannot be reconciled at that moment — it renders as provisional, visibly labelled, and it is never presented as a final price. There is no surface, no export and no speed optimisation exempt from this.
- **F8-13** (P0) — **Staleness is derived by comparison, never stored as a flag.** The product decides whether an output is current by comparing what it was computed from against what is current now — "staleness = compare, not flag-flipping". Nothing marks an output stale as a state change, and nothing can mark a stale output fresh; a surface that has not performed the comparison has not established freshness and must render provisional under `F8-12`.
- **F8-14** (P0) — **Every computed money-bearing or engineering-bearing output pins the versions of every input it used.** Catalog release label, price-book version, market-pack/rules version (`F1-11`), and the versions of the engines that computed it are pinned into the output at the moment of computation, so that any later change to any of them self-stales the output rather than silently rewriting it. Pinning is what makes the comparison in `F8-13` possible; an output that pinned nothing cannot be shown as final.
- **F8-15** (P0) — **A sent document keeps the versions it was built with, forever.** Once a priced document has been shared with a customer, its figures never move: it keeps the rate versions, catalog release and pack version pinned at generation, and a later price change produces a *new* version of the document rather than editing the sent one. The customer's copy and the tenant's copy of the same sent document always agree.
- **F8-17** (P0) — **While a recompute is in flight, the affected outputs are provisional for the whole window, and issue is blocked until they reconcile.** A long recomputation does not license an optimistic display: for the entire duration the priced outputs render provisional, and sending, sharing or issuing the document is blocked until the computation and the money path agree. Duration changes nothing about the rule — there is no express lane for large jobs.
- **F8-18** (P0) — **A stale output says so where it is read, and offers the corrective action.** The staleness state is visible on the object itself — in the list, on the detail screen, in the customer-facing rendering — and is accompanied by the action that resolves it (recompute, regenerate, or open the newer version). "Stale" is never communicated only by absence, only by a colour, or only after the user tries to send.
- **F8-19** (P0) — **Staleness is not only a money rule: any artifact produced before a change is stale and must say so.** Captured views, rendered sheets, generated drawings and exported files carry what they were produced from; when their inputs have moved on, they are labelled stale rather than presented as a current picture, and the reader is told what changed since.

**DONE WHEN:**

- Given a money figure whose pinned inputs no longer match current inputs, when any surface renders it, then it renders as provisional with a visible label and never as a final price (`F8-12`, `F8-13`).
- Given any computed money-bearing output, when it is created, then it pins the catalog release, price-book version, pack/rules version and engine versions it used (`F8-14`).
- Given a document already sent to a customer, when any pinned input changes afterwards, then the sent document's figures are unchanged and a new version is required to reflect the change (`F8-15`).
- Given a recompute in progress, when a user attempts to issue or share the affected document, then the action is blocked and the outputs render provisional until reconciliation completes (`F8-17`).
- Given a stale priced object, when it is listed or opened, then the stale state and its corrective action are both visible without the user attempting to send (`F8-18`).
- Given a capture, rendered sheet, drawing or export produced before a change to its inputs, when it is shown, opened or shared, then it says it is stale rather than silently showing an out-of-date picture, and the reader is told what changed since (`F8-19`).

*(Swept 2026-08-07 for the removal of the offline/sync capability. `F8-16` — "money read from cache, or produced away from the server, renders provisional" — was deleted with its subject: there is no cache and no away-from-server computation. The obligation itself is the general money law and is fully live at `F8-12` above ("if it is not [current] — or if it cannot be reconciled at that moment — it renders as provisional, visibly labelled … no surface, no export and no speed optimisation exempt"), with `F8-13`'s compare-not-flag and `F4-04`'s server-owns-money, all of which already carry their own acceptance lines here and at `T-FPLAT-011`. Nothing is repointed to a new row, and the `F8-16` acceptance line is deleted rather than rewritten. **Flagged to the owner:** `F8-16` is still cited by live PRD rows outside this bucket — `M02-38`, `M08-37`, `M11` §pointers and `M05` §548 — and by `tasks/M06-proposals.md`'s `M06-41`; those are dangling citations in the live PRD today and should be repointed to `F8-12` in the same pass. They are out of this file's ownership.)*

---
### T-FPLAT-029 · Document-level disclosure and one-figure-one-source
**Type:** engine · **Tier:** P0
**PRD rows:** F8-20, F8-21, F8-22, F8-23, F8-24
**Requirements (verbatim):**

- **F8-20** (P0) — **A priced document built without a design must say so visibly, on the document — not in fine print.** The required line is fixed copy, verbatim: *"Indicative proposal. Generation and savings are estimated from system size and location. A site survey and shadow analysis will confirm the final figures."* It renders on the document itself and on the customer-facing rendering of that document, in the reading flow, at the same visual weight as the figures it qualifies.
- **F8-21** (P0) — **Numbers in a document built without a design are `estimated` or `assumed` — never `derived`.** Path B figures are heuristics from capacity and location (AI auto-fill included) or catalog defaults; they never borrow the tier of a modelled design. Where a design exists, its figures are `derived` from the model and the BOM. The distinction is the point of the label, and it is not softened for presentation. **Ruling clause carried from the cell:** **Reading FINAL (owner ruling 2026-08-04, Q8 — the two-flow simplicity rule):** a typed Path B figure is `assumed`, never `derived`.
- **F8-22** (P0) — **A document built on a remote survey states its basis.** Remote data is derived from imagery; on-site data is measured on site; the document carries the fixed line, verbatim: *"Roof measured from satellite imagery. A site visit will confirm dimensions, shading and electrical access."* A proposal built on remote data is legitimate and sellable — "it just must not claim to be a site survey."
- **F8-23** (P0) — **A financial projection is labelled as a projection and travels with its assumptions.** Multi-year savings, payback, lifetime value, per-unit tariff projections and pipeline forecasts render as projections, never as amounts owed, earned or promised; the fixed assumptions they rest on (escalation rate, horizon, margin, incentive assumptions supplied by the market pack) are disclosed alongside the projection rather than held in a specification. This is the honesty label that rides on alternative commercial document types, whose per-unit terms are projections by construction.
- **F8-24** (P0) — **One figure, one source: every rendering of the same figure shows the same value, tier and disclosure.** The screen, the generated document, the customer link, the export and the voice agent's spoken version of a figure are renderings of one computed value — they do not recompute independently, round differently, or drop a qualifier that the other renderings carry. A disagreement between two renderings of the same number is a defect, not a display difference.

**DONE WHEN:**

- Given a priced document generated without a design, when it renders on any surface, then the verbatim indicative line of `F8-20` appears in the reading flow of the document, and every figure it carries is tiered `estimated` or `assumed` (`F8-20`, `F8-21`).
- Given a document built on remote-survey data, when it renders, then the verbatim imagery line of `F8-22` appears and the roof figures are tiered `derived` (`F8-22`).
- Given a multi-year financial projection, when it renders on any surface or in any document, then it is labelled a projection, its fixed assumptions are disclosed with it, and it is never presented as an amount owed, earned or promised (`F8-23`).
- Given one computed figure, when it is read on the screen, in the generated document, through the customer link and in an export, then all renderings show the same value, the same tier and the same disclosure (`F8-24`).

---
### T-FPLAT-030 · Structural adequacy — never computed, sign-off recorded and pinned, disclaimer travels, customer gate
**Type:** engine · **Tier:** P0
**PRD rows:** F8-25, F8-26, F8-27, F8-28, F8-29
**Requirements (verbatim):**

- **F8-25** (P0) — **The product never computes structural adequacy — at any scale, on any surface, for any segment.** No output states, implies or scores whether a structure, foundation, roof or mounting system is safe or sufficient. Structure-related outputs are material estimates and visual models: a bill of material quantities and a geometric representation, never a wind, uplift, load-path or roof-capacity verdict. The largest and the smallest job are treated identically.
- **F8-26** (P0) — **Structural verification is a recorded human decision, and the human is named.** Adequacy is established by a sign-off recorded with who signed and when, held by the **Design Engineer** preset (and the EPC Owner) through the capability row `F2.M05.approve-designs`. The product's role is to record the decision faithfully, never to substitute for it, and never to imply a decision that no one made.
- **F8-27** (P0) — **A sign-off pins exactly what was reviewed, and a change after approval un-approves it.** The recorded decision names the version of the design it applies to; an edit after approval means the approval no longer describes what exists, so the design returns to unapproved and requires a fresh decision. Decisions are append-only — an approval or a return is added, never edited or erased — and a return carries comments pinned to the specific fault.
- **F8-28** (P0) — **The structure disclaimer travels with every structure-bearing output.** Every surface, document, drawing, sheet and export that carries structural quantities or a structural model also carries the statement of what it is and is not — a material estimate and a visual model, not a structural check, requiring engineer verification. The disclaimer is not confined to the screen where the structure was authored.
- **F8-29** (P0) — **An unapproved design is never shown to the customer.** No customer-facing surface — the tokenised link, a generated document, a shared file — renders a design that has not been signed off. The gate belongs to `foundations/F5-customer-link.md`; the law that there is a gate belongs here.

**DONE WHEN:**

- Given any output of the product, when it is inspected for structural claims, then no output states or scores structural adequacy, safety or sufficiency (`F8-25`).
- Given a design requiring structural verification, when it is approved, then the decision is recorded with the approver's identity, the time, and the design version reviewed (`F8-26`, `F8-27`).
- Given an approved design, when it is edited, then its approval no longer applies and the design is unapproved until a fresh decision is recorded (`F8-27`).
- Given any surface or file carrying structural quantities or a structural model, when it renders or is exported, then the material-estimate-not-structural-check statement travels with it (`F8-28`).
- Given a design without a recorded sign-off, when any customer-facing surface is requested for it, then nothing is shown to the customer (`F8-29`).

---
### T-FPLAT-031 · The correlation-not-attribution reporting contract
**Type:** engine · **Tier:** P0
**PRD rows:** F8-30, F8-31, F8-32
**Requirements (verbatim):**

- **F8-30** (P0) — **Influence is reported as correlation, and the screen says so.** The rule, verbatim: **"'Deals it touched' is correlation, not attribution — and the screen must say so."** The automated agent's impact block renders with its caption, verbatim: *"The agent called and the customer responded within 3 days. We cannot prove the call caused it."* The product never claims that an automated touch generated a deal or a value of pipeline.
- **F8-31** (P0) — **The caveat renders beside the number, not behind an interaction.** The correlation statement is persistent on-screen content adjacent to the figure it qualifies — never a tooltip, an info icon, a hover state, or a link to an explanation elsewhere. The source names the failure it is preventing: an owner sees a big number and over-trusts it because the caveat was one interaction away.
- **F8-32** (P0) — **The law generalises: no surface claims causation where the product observed only sequence.** Any metric that relates an action to an outcome — automated-call impact, campaign influence, a rep's touch, a nudge, a notification — is reported as observed sequence with its window stated, never as credit. Related laws that flow from the same principle and are owned elsewhere: a forecast is a projection and never counted as revenue; won means signed; and an outcome that reverses stops counting immediately rather than quietly persisting in a total.

**DONE WHEN:**

- Given an impact block reporting the automated agent's influence, when it renders, then the verbatim correlation caption of `F8-30` renders with it, as persistent on-screen content adjacent to the figure (`F8-30`, `F8-31`).
- Given any metric relating an action to an outcome, when it renders, then its observation window is stated and no causal claim is made (`F8-32`).
- Given a projection and an achieved figure on the same surface, when they render, then the projection is never included in the achieved total (`F8-32`).

---
### T-FPLAT-032 · Honest state, usage figures and declared degradation
**Type:** engine · **Tier:** P0
**PRD rows:** F8-33, F8-34, F8-35, F8-36
**Requirements (verbatim):**

- **F8-33** (P0) — **Usage screens show exactly the numbers the product enforces and bills from.** The tenant-visible usage view reads the same rollups, from the same query, that entitlement enforcement and invoicing use — same numbers, no smoothing, no rounding for presentation, no separate display counter. Each figure is labelled with the period it covers and described in **plain "actual usage" language** (owner ruling 2026-08-04, Q9): the provenance word "measured" — and the tier vocabulary generally — is **reserved for engineering and survey data** and does not appear on usage or billing screens. Consumption is disclosed *before* a gate fires: when a bundle is substantially consumed, the screen says so ahead of the block, never afterwards.
- **F8-34** (P0) — **A message about product state describes the actual state.** Copy about billing, entitlement, gating or account state states what is true and what will happen: it never threatens a consequence that will not occur, it names exactly what has paused and what still works, and where an action would restrict the tenant it shows exactly what will be blocked before they confirm. The product's standing pre-commitment — reads, exports and customer links keep working — is stated plainly rather than left ambiguous as leverage.
- **F8-35** (P0) — **A capability that is unavailable degrades on a declared path and says so — it never silently no-ops.** Where a capability the product advertises is not provided by the underlying rail in a given market or deployment, the affected step is skipped or downgraded along a defined path, the outcome is recorded on the record it affects, and a human is told what did not happen. The named v1 instance: automated menu traversal is unavailable because the reference telephony rail does not provide the required capability, so traversal "degrades honestly" and the call is flagged for human follow-up.
- **F8-36** (P0) — **An action that cannot be performed fails fast and honestly rather than appearing to succeed.** Where the product cannot complete an action — connectivity, entitlement, a missing capability — it says so at the moment of the attempt, in plain language naming the reason, and does not silently queue, partially apply, or display an optimistic result. *(Trailing sentence removed 2026-08-07 by owner ruling `Q61`: it read "The offline/online boundary that decides which actions this covers is `foundations/F4-data-integrity.md`'s." That sentence was never in the F8-36 cell, and the boundary it pointed at no longer exists — F4-data-integrity §5 makes the connectivity layer a non-goal by name. F8-36 needs no boundary: it covers every action the product cannot complete.)*

**DONE WHEN:**

- Given the tenant-visible usage view, when it renders a metered figure, then that figure equals the rollup used for enforcement and invoicing for the same period, and the period and provenance are labelled with it (`F8-33`).
- Given a bundle that is 80% consumed, when the tenant opens the usage view before any gate fires, then the screen already says so (`F8-33`).
- Given any billing, entitlement or account-state message, when it renders, then it names what has changed, what still works, and no consequence that will not occur (`F8-34`).
- Given a restricting action a tenant can choose, when confirmation is requested, then exactly what will be blocked is shown before the confirmation (`F8-34`).
- Given an automated step whose required capability is unavailable, when the step is reached, then it degrades on its declared path, the record shows what did not happen, and a human is notified (`F8-35`).
- Given an action the product cannot complete, when a user attempts it, then it fails at the attempt with a plain-language reason and is never queued, partially applied, or shown as having succeeded (`F8-36`).

---
## Laws (enforced through screens and review, no standalone build)

These rows state properties of the product that engineering does not build as a component: they are satisfied by the screens other buckets build, by the shared design-system components, and by the review gates named against each row. They are reproduced verbatim because the wording is the requirement.

- **F2-04** (P0, `prd/foundations/F2-roles-and-permissions.md`) — **The approver of record is not the design's author.** Sign-off approval or return is recorded with who and when — "the engineer-led structural safety record" — and a returned design goes back to its author with comments pinned to what is wrong. Where the only person holding sign-off is the author (the one-person firm — the matrix has always granted the Owner both capabilities), the approval record still names the approver, so the record shows the same person did both; see edge cases.
  **Enforced by:** the design sign-off record specified by `prd/modules/M05-design-studio.md` and built in `tasks/MS-studio-c.md`; the approver-and-time pinning of `T-FPLAT-030` (`F8-26`, `F8-27`); the audit entry of `T-FPLAT-004`.

- **F2-06** (P0, `prd/foundations/F2-roles-and-permissions.md`) — **No commercial figures, ever, on any surface the Installation Team Member preset grants.** No price, discount, tranche, margin or customer value appears on any screen this preset reaches. v1 achieved the property by giving crew no screen at all; where V2 gives them a screen, the surface itself must preserve it (`02-personas.md` `PS-27` carries the same law persona-side).
  **Enforced by:** every screen the Installation Team Member preset reaches — the installation surfaces briefed in `ux/briefs/**` and built in `tasks/M08-projects.md` — checked at screen review; the grants that reach them come from `T-FPLAT-001`'s matrix and `T-FPLAT-002`'s resolution.

- **F2-07** (P1, `prd/foundations/F2-roles-and-permissions.md`) — **The coordinator fallback survives the preset.** Where the checklist is run by a coordinator rather than the crew, ticks are attributed to the coordinator and an optional free-text "done by" per step records the crew member's name. This fallback is not removed when crew accounts exist, because mixed crews are the normal case (`02-personas.md` `PS-28`).
  **Enforced by:** the installation-checklist screen `SCR-M08-04` (`ux/briefs/SCR-M08-04-installation-checklist.md`, built in `tasks/M08-projects.md`), which attributes the tick to the coordinator and carries the optional per-step free-text name.

- **F3-16** (P0, `prd/foundations/F3-localization.md`) — **Layouts survive text expansion of roughly 15–30% without truncating meaning.** No fixed-width labels; buttons and chips size to their content; table headers wrap rather than clip; **amounts and units are never truncated**; and a long string wraps or truncates with the full text still reachable — it never overflows its container and never hides a value. The source names the usual casualties: buttons, chips, table headers and the proposal builder's eleven step titles.
  **Enforced by:** per-screen review at both viewports against `F7-43` item 7 over the briefs in `ux/briefs/**`; the per-script line-height mechanism it depends on is built by `T-FPLAT-007`.

- **F3-18** (P0, `prd/foundations/F3-localization.md`) — **A screen is not done until it has been rendered and checked in a non-Latin launch language.** This is a completion condition, not a testing recommendation: the design language's per-screen Definition of Done already lists "rendered in Hindi and checked — layout survives expansion" as one of its items, and the source's own recommendation is to do it early, on real screens, because English-only design that is translated later always breaks and the breakage is invisible until a real user opens it. The five densest surfaces — the BOM, the generated proposal document, the proposal builder, the lead list and the studio panels — are checked in every language in the set.
  **Enforced by:** the per-screen Definition of Done (`F7-43` item 7) applied at screen review, over the five densest surfaces the row names.

- **F3-25** (P0, `prd/foundations/F3-localization.md`) — **The product is built for an open language set.** Every requirement in this suite is written for "the languages in the set", never for three named ones: no screen, document, template structure, preference, permission or product rule may assume the set's size, its members, or that every member shares one script. A requirement phrased "in all three languages" is a defect against this rule.
  **Enforced by:** document and code review — no requirement, screen, template, preference or rule may name a fixed language count; `T-FPLAT-005` reads the set from the catalog rather than from a constant, and `T-FPLAT-009` extends it as configuration.

- **F3-29** (P0, `prd/foundations/F3-localization.md`) — **The interface language set and the voice agent's language set are independent, and never converge by accident.** The agent's set is broader than the interface's — six at launch, the three interface languages plus Gujarati, Tamil and Telugu — is chosen **per customer** for a call, and is tenant-configurable. It is specified in `modules/M07-sales-execution.md`; F3 neither owns it, bounds it, nor changes when the interface set changes. A Marathi-speaking rep may call a Hindi-speaking customer from an interface in English, and nothing in the product ties the three choices together.
  **Enforced by:** `prd/modules/M07-sales-execution.md` owning the agent's language set separately from `T-FPLAT-005`'s interface set; review confirms a change to either leaves the other untouched.

- **F4-27** (P0, `prd/foundations/F4-data-integrity.md`) — **A warning never disables a primary action.** No modal and no spinner wall stands between a user and their work, and no primary action is pre-emptively greyed out. Where an action genuinely cannot be performed, it is refused honestly **at the attempt**, with a reason, rather than disabled with no explanation.
  **Enforced by:** per-screen review of every brief in `ux/briefs/**` — no surface pre-emptively disables a primary action or stands a modal or a spinner wall in front of one; the honest refusal at the attempt is `F8-36`'s, built by `T-FPLAT-032`. *(Moved here 2026-08-07 from `T-FPLAT-014`, which was the five-surface sync-state model. The row is live and unchanged in force, but its text was re-pulled verbatim — it previously read "Never blocking, in any of the five" and spoke of connectivity, saves succeeding locally and the deleted `F4-09` — and what is left is a property of every screen rather than a component this bucket builds.)*

- **F6-03** (P0, `prd/foundations/F6-notifications-and-search.md`) — **Notification honesty: no false urgency, ever.** A notification's tone matches its fact: informational facts inform, attention items say why they need attention, and nothing is dressed as urgent to drive engagement — the same discipline the dunning ladder (`M12-41`) and the state banners obey (`F8-34`'s family). No engagement mechanics exist: no streaks, no badges-for-opening, no re-notification of an unchanged fact.
  **Enforced by:** a tone audit of the complete catalogue registered by `T-FPLAT-017`, plus copy review of every message body; `T-FPLAT-018` emits no re-notification of an unchanged fact.

- **F6-04** (P0, `prd/foundations/F6-notifications-and-search.md`) — **Nothing in this document reaches the EPC's customer.** Every matrix recipient is a tenant user; the customer's surfaces are the link's own states (`F5-48`'s confirmation-state law) and the transactional message flows. The two source moments that ask for automatic customer messages — the design-wait message and the acceptance acknowledgement — are **ruled (owner ruling 2026-08-04, Q33)**: they send automatically from the tenant's connected transactional channel, owned by `foundations/F5` (`F5-16`, `F5-48`) with `modules/M03`'s connection (`M03-03`); this document still defines **no send channel of its own** and stays staff-side.
  **Enforced by:** `T-FPLAT-018`'s recipient resolution, which resolves tenant users only; the two customer-facing sends belong to `prd/foundations/F5-customer-link.md` and connect through `prd/modules/M03-marketing.md`.

- **F7-01** (P0, `prd/foundations/F7-design-language.md`) — **`design/ds-source/` is the single source of every visual fact in the operator product.** The vendored design-system package — its token files, its typefaces, its component set and its brand law — is canon, and it is canon *pixel-perfect*: no document, module, screen, tenant or release re-decides a visual fact it already settles. The character it encodes is part of the ruling, not decoration around it: a precision instrument for people quoting jobs worth a great deal of money, calm under dense data, warm-neutral, with hierarchy carried by luminance and softness rather than by lines. Every requirement below is a rule *about* that artifact, never a replacement for it.
  **Enforced by:** `T-FPLAT-023`'s adherence gate, which fails any value that did not reach the screen through the design system, plus screen review against `design/ds-source/`.

- **F7-02** (P0, `prd/foundations/F7-design-language.md`) — **When the artifact and a ruling disagree, the ruling wins — and the divergences are named, not silently patched.** The overlay's own standing law governs, verbatim: *"If code and a ruling disagree, the ruling wins until the product owner changes it in this file."* Precedence is therefore: an owner ruling in `docs/15` first, the package's token files second, the package's prose readme last. Three divergences are recorded as of this writing and are **not resolved here**: the readme's dark-mode index line is declared false by `R19-A` (the token files carry no dark values and declare a light colour scheme, so ruling and artifact agree and only the prose is stale); the semibold weight sanctioned by `R19-D` is not yet present in the type tokens (ruling wins — the sanctioned set is the ruling's); and the "medium weight restricted to buttons, tabs and table headers" clause — carried by both the readme and the token file's own header comment (`tokens/typography.css:2`, "500 permitted for buttons, tabs, table headers only") — is dead by the same ruling *(second carrier named by Task 26)*.
  **Enforced by:** review at implementation — the three recorded divergences are carried in this row and resolved in favour of the ruling, never patched silently in code.

- **F7-04** (P0, `prd/foundations/F7-design-language.md`) — **v1 is light-only, by law and by fact — dark mode is struck from the definition of done.** There is no dark theme, no per-user theme switch and no dark variant of any surface, and the studio canvas is light like everything else: the source is explicit that *"the old 'studio canvas stays dark' doctrine is dead."* The semantic alias layer is deliberately kept so that a dark value-set can be dropped in later without a redesign; keeping that seam open is a requirement, shipping dark is not.
  **Enforced by:** `T-FPLAT-023`'s adherence gate and screen review: **no brief in `ux/briefs/**` instructs a dark variant or a theme switch** — the one transcribed prototype fact (`MS12-08`, carried verbatim in `SCR-MS-03` per the never-paraphrase rule) travels with a superseding annotation and is not drawn — the law is stated positively for every design session in `ux/claude-design-context.md`, and the semantic alias seam stays in `design/ds-source/` so a dark value-set can be added later without a redesign.

- **F7-05** (P0, `prd/foundations/F7-design-language.md`) — **There is no invented logo mark — and the launch app icon is a typographic letter-tile derived from the wordmark (owner ruling 2026-08-04, Q12).** The source is categorical: *"No logo was provided. There is no HelioGrid logo mark — the wordmark is rendered in plain Geist Bold… Do not invent a mark."* Every surface that would ordinarily carry a mark carries the wordmark instead. The one sanctioned exception is the owner's own ruling: the **app icon at launch is a letter-tile — a bold "H" in the brand face on the near-black brand background, derived entirely from the wordmark's style, nothing invented** — which unblocks store submission on both platforms; a **commissioned logo replaces it post-launch via an ordinary update**. Everything else the no-invention law covered stays covered: no screen, asset or release draws a mark of its own.
  **Enforced by:** release asset review on both platforms; no brief in `ux/briefs/**` specifies a mark, and the launch app icon is the ruled letter-tile.

- **F7-06** (P0, `prd/foundations/F7-design-language.md`) — **Two accent systems exist and are never conflated, and the primary action is near-black — never coloured.** (a) The **interactive accent** drives focus rings, links, selected states, active tabs and control fills, and **never fills a button**. (b) The **iridescent trio** is atmosphere only — ambient glow, gradient object, icon wash, AI cue — and **never fills a button, a row, a chip or a field**. (c) The **primary action button is near-black**, in both density modes, on every surface and for every tenant: the source calls this *"the strongest identity marker"*, and it is the one visual fact a reader of this suite should be able to recall without opening the token files. Around all three, restraint is the rule: neutrals carry the overwhelming majority of every screen, a screen carries **at most one accent gesture**, and brand or AI affordances are expressed as a gradient-filled object rather than an outlined icon — which is also how a user tells an AI-produced affordance from an ordinary one.
  **Enforced by:** `T-FPLAT-023`'s adherence gate for the token roles, plus per-screen review of accent count and primary-action treatment.

- **F7-08** (P0, `prd/foundations/F7-design-language.md`) — **The product has two typefaces — a brand sans and its monospaced companion — and one sanctioned weight set.** The families are named here once, because the design spec names them as part of what is preserved: **Geist** and **Geist Mono**, with the package's declaration in `tokens/fonts.css` and `assets/fonts/` remaining the binding statement of which files ship. The families are the package's (`tokens/fonts.css`, `tokens/typography.css`); the sanctioned weight set is **four weights**, fixed by ruling `R19-D`, which added the semibold weight on the evidence of real usage and killed the readme's clause restricting the medium weight to buttons, tabs and table headers. No screen introduces a fifth weight, and **no weight is synthesised** — a weight that is not in the shipped face is not used. Headings are tightly tracked and that tracking is part of the identity, not a per-screen choice.
  **Enforced by:** `T-FPLAT-023`'s adherence gate over the type tokens, plus screen review; the script-face weight parity half is built by `T-FPLAT-007`.

- **F7-09** (P0, `prd/foundations/F7-design-language.md`) — **Identity-bearing and quantity-bearing text renders in the monospaced face, tabular, and right-aligned in tables.** The set is named by the source and is closed to interpretation: record identifiers, energy readings, monetary amounts, coordinates, invoice numbers and phone numbers. Numeric data is tabular so digits align down a column, and currency and quantity columns are right-aligned in every table. This is legibility law for a product whose users compare numbers for a living, and it applies identically on web, on mobile, in generated documents and in exports.
  **Enforced by:** per-screen review of every identifier-, amount- and reading-bearing surface, including generated documents and exports.

- **F7-10** (P0, `prd/foundations/F7-design-language.md`) — **The overline micro-label is the single sanctioned exception to the minimum type-size floor.** The signature uppercase micro-label that sits above a section is the one place in the product where text is allowed below N3's floor, and it is allowed **only** as a micro-label — never as body text, never as data, never as interactive text. Its exact size, weight, case and tracking are design-system values (`tokens/typography.css`); what this document fixes is that there is exactly one exception and this is it. A meaning-bearing overline additionally obeys `F7-11`.
  **Enforced by:** per-screen review — text below the floor is an overline micro-label or it is a defect.

- **F7-11** (P0, `prd/foundations/F7-design-language.md`) — **Three colour roles are restricted, and the restriction is on the role rather than on the value.** The tertiary text role is decorative — timestamps and similar — and **never carries load-bearing text**; a meaning-bearing overline renders in the secondary text role instead. The warning tone **always sits on its tinted chip and never appears as bare foreground text**. A disabled state is never the only signal that something is unavailable. Two further restrictions that ruling `R19-C` originally imposed have since been **retired rather than relaxed** — the danger and secondary-text values were darkened at the token level to meet the contrast standard — and any caveat still attached to those two roles describes nothing.
  **Enforced by:** `T-FPLAT-023`'s adherence gate over the restricted roles, plus per-screen review of overline and warning usage.

- **F7-12** (P0, `prd/foundations/F7-design-language.md`) — **Status is never conveyed by colour alone — always a label plus a mark.** Every domain status in the product (a lead's stage, a design's review state, a project stage, a payment state) renders as text plus a status dot drawn from the fixed status-to-semantic-colour map, so the status survives colour blindness, greyscale printing and a sunlit screen. The map itself is the design system's (the package ships a status component for exactly this reason); what is binding here is that no surface ever substitutes a colour for the word.
  **Enforced by:** the shared status component and per-screen review; the billing-state names of `prd/modules/M12-platform-billing.md` obey it. *(Amended 2026-08-07 — this pointer also named "the sync-state chips of `T-FPLAT-014`", which were deleted `F4-24`'s per-record chips; `prd/foundations/F4-data-integrity.md` §5 forbids any queued or unsynced marker on a record, so there are no sync chips to bind. The row's own text is unchanged and still names a sync state among its examples, so it is quoted as it stands under the never-paraphrase rule.)*

- **F7-13** (P0, `prd/foundations/F7-design-language.md`) — **Interface colour and data colour are two separate systems and are never conflated.** A control is never styled with a data colour and a chart, heatmap or canvas overlay is never drawn in the interface accent. Data palettes used in the studio — roof identity, electrical strings, irradiance — must be **distinguishable under the most common colour-vision deficiency within each set**, and every data-colour encoding is paired with a second, non-colour channel: a label, a pattern or a position. Data colours are **never tenant-overridable**, because they carry engineering meaning rather than brand.
  **Enforced by:** studio screen review in `tasks/MS-studio-a.md`, `tasks/MS-studio-b.md` and `tasks/MS-studio-c.md`, including colour-vision-deficiency simulation of each data palette.

- **F7-14** (P0, `prd/foundations/F7-design-language.md`) — **The type system carries every script the product's languages need, at every sanctioned weight, with per-script line height, and every component absorbs text expansion.** Localization places four standing obligations on the visual system and F7 accepts them as its own: a matched script face bundled with the product rather than an operating-system fallback; that face present at **every** weight in `F7-08`'s sanctioned set with no synthesis; the type scale keeping its sizes while **line heights take a per-script adjustment**; and components — buttons, chips, table headers, step titles — sized to their content so that a substantially longer translation wraps or truncates with the full text still reachable, never overflowing and never clipping an amount or a unit. **The face is chosen (owner ruling 2026-08-04, Q14): Noto Sans Devanagari (OFL, free)** for the launch non-Latin script, with the design phase confirming weights and the pairing against the brand face; the obligations above bind it in full.
  **Enforced by:** `T-FPLAT-007`, which builds the bundled faces, the weights and the per-script line height, plus per-screen review for expansion.

- **F7-15** (P0, `prd/foundations/F7-design-language.md`) — **There are no structural borders: hierarchy comes from luminance and soft shadow.** Surfaces separate because they are brighter than the canvas behind them and carry a soft, wide, low-opacity shadow — not because a line has been drawn around them. The source states the governing rule as *"Hierarchy comes from luminance and softness, never from lines."* Exactly **two** exceptions exist: the dashed drop zone of a file upload, and the opt-in high-contrast field mode of `F7-16`. Depth is blur and desaturation, never dimming.
  **Enforced by:** per-screen review; the single sanctioned exception is the field mode built by `T-FPLAT-024`, and the file-upload drop zone.

- **F7-17** (P0, `prd/foundations/F7-design-language.md`) — **Two density modes exist and the choice is made by surface, not by breakpoint.** *Expressive* serves mobile, onboarding, authentication, dashboards, empty states and marketing surfaces; *Functional* serves data tables, long forms, kanban boards, inventory and reporting views, settings and administration. **Colour, type and every rule in this document are identical in both** — only spacing and radius change, and the functional mode remains borderless, keeps its pill controls and keeps the near-black primary action unchanged. The default is expressive on mobile and functional on desktop data screens; the correct density for the surface is a completion condition (`F7-43`, item 9).
  **Enforced by:** per-screen review against the surface's declared density (`F7-43` item 9).

- **F7-18** (P0, `prd/foundations/F7-design-language.md`) — **Overlays blur the layer behind and fade it toward white — never a dark scrim.** When a sheet, modal, popover or menu opens, the content behind it recedes by blurring and lightening, so the user keeps their sense of where they are. No surface in the product darkens the page to focus attention.
  **Enforced by:** the shared overlay component and per-screen review of every sheet, modal, popover and menu.

- **F7-19** (P0, `prd/foundations/F7-design-language.md`) — **One icon family, outlined, at one stroke weight, never mixed within a context.** Filled variants exist for exactly one purpose — the active item in the mobile navigation — and filled and outlined icons never appear together in the same context. **No icon font, no emoji, and no unicode character used as an icon**, anywhere in the product, including in content the product generates. Brand and AI affordances use the gradient object of `F7-06` rather than an outlined icon. Every icon-only control additionally carries the accessible label of `F7-26`.
  **Enforced by:** per-screen review of icon usage, plus copy review of generated content for emoji and unicode stand-ins (`F7-42`).

- **F7-20** (P1, `prd/foundations/F7-design-language.md`) — **Photography is masked and never colour-treated.** Site photographs — the roof, its obstructions, the surroundings — are presented masked to the system's corner treatment and are **never colour-filtered, tinted or stylised**, because a designer reads them as evidence. There are no repeating background patterns and no full-bleed photographic surfaces anywhere in the product.
  **Enforced by:** per-screen review of every surface that renders site photographs.

- **F7-21** (P0, `prd/foundations/F7-design-language.md`) — **One sheet grammar serves every editor in the product: a sheet on mobile, a side panel on desktop — sheets, not pages.** Editing something in context never navigates away from it. The same grammar carries every editor the product has — an obstruction's settings, a bill-of-materials line, a lead's detail, a filter set — and it carries progressive disclosure inside it (`F7-34`) so a chained or nested editor reveals itself a stage at a time with its live consequences visible rather than presenting every control at once.
  **Enforced by:** per-screen review — every module editor in `tasks/**` uses the one sheet grammar. *(Amended 2026-08-07 — this pointer named "the sync centre of `tasks/SHELL.md`" as its worked example; the sync centre screen `SCR-SHELL-04` was deleted by owner decision `D3` along with the offline/sync capability, and deleted `F4-23` with it.)*

- **F7-23** (P0, `prd/foundations/F7-design-language.md`) — **The ten numbered interaction and accessibility rules are product law, carried unchanged.** The source is explicit that they are *"never renumber, never reword"*, so they are reproduced verbatim below the table and bind every surface in the suite: **N1** no hover-only meaning · **N2** targets ≥44×44 · **N3** 12px floor (overline exception) · **N4** contrast verified not eyeballed · **N5** accessible names + focus trap/restore · **N6** UI vs data colour · **N7** provenance tier on every number · **N8** destructive actions confirmed AND undoable, undo thumb-reachable on mobile · **N9** no layout tuned to a fixed viewport · **N10** loading/empty/error/offline states are part of "done". N7's four tiers are `foundations/F8-data-honesty.md`'s and are closed there; N6 is `F7-13`; N3's exception is `F7-10`. **AMENDED BY OWNER RULING 2026-08-07 (`Q61`): N10 is now three states — loading, empty, error.** The offline capability was removed from the product, so an `offline` state has nothing to describe. The N-set is carried under *"never renumber, never reword"*, so N10 is **not rewritten in the verbatim blockquote below** — it is amended here by ruling, exactly as `R19-B` amended N3 and recorded it at `F7-10`. The blockquote preserves the source's wording; this cell states what binds.
  **Enforced by:** per-screen audit against the ten rules; N7's tiers are supplied by `T-FPLAT-026`, N6 by `F7-13`, N10 by the Definition of Done of `F7-43`.

- **F7-24** (P0, `prd/foundations/F7-design-language.md`) — **Focus is always visible, and it is never removed.** Every interactive element shows the system's focus ring at the system's offset whenever it is focused, on both platforms and for every input method. Inputs are borderless and signal focus through elevation rather than through a drawn outline (`F7-15`); an input in error carries an inset danger ring. No surface, no density mode and no third-party component suppresses the ring.
  **Enforced by:** the shared input and focus-ring components on both platforms, plus per-screen keyboard review (`F7-43` item 3).

- **F7-25** (P0, `prd/foundations/F7-design-language.md`) — **Modals and sheets move focus in, keep it inside, and give it back — on both platforms.** When an overlay opens, focus moves into it; while it is open, keyboard and assistive-technology focus cannot escape behind it; when it dismisses, focus returns to the control that opened it. This is stated for both platforms because the source states it for both, and because a sheet is the product's most common editing surface (`F7-21`).
  **Enforced by:** the shared overlay component on both platforms, plus per-screen assistive-technology review.

- **F7-27** (P0, `prd/foundations/F7-design-language.md`) — **Every data table carries a caption.** The reason is commercial rather than stylistic and is carried from the source: the bill of materials and the quote are commercial documents, and an anonymous table in a document a customer may hold is a defect. A caption names what the table is and, where the table is filtered or scoped, what it currently shows.
  **Enforced by:** per-screen review of every table surface and of every generated document that carries a table.

- **F7-28** (P0, `prd/foundations/F7-design-language.md`) — **Numeric entry commits on blur with an explicit confirm or cancel — never on keystroke — and it is always available beside every gesture.** A number a user types takes effect when they finish, not while they are typing, and on a mobile keyboard the commit is an explicit action. The second half is the one that makes the product usable with a fingertip: **wherever a value can be set by dragging, pinching or nudging, typing it exactly is also available** — the precise path is never gesture-only.
  **Enforced by:** the shared numeric-entry component, plus review of every canvas and gesture-set value in `tasks/MS-studio-a.md`, `tasks/MS-studio-b.md` and `tasks/MS-studio-c.md`.

- **F7-29** (P0, `prd/foundations/F7-design-language.md`) — **The touch contract binds every interactive surface, and the canvases share one gesture vocabulary.** Four clauses, carried whole. *(a) Capability, not width* — build for pointer events and branch on **input capability, never on screen width**. *(b) One vocabulary* — the satellite canvas, the layout editor and the 3D scene use the same gestures: one-finger pan, pinch to zoom, two-finger rotate, tap to select, long-press for contextual actions, drag with snapping, two-finger tap to undo; and **no function is reachable only by wheel, middle-click or keyboard**. *(c) Precision under a fingertip* — magnification, offset dragging, snap-then-nudge, always-available numeric entry (`F7-28`) and an explicit commit. *(d) Reachability* — primary actions sit in the lower third of a phone screen, a destructive action is **never adjacent to a primary one**, and undo stays persistently reachable while any canvas tool is active. One gesture is one undo step.
  **Enforced by:** review of the canvas surfaces built in `tasks/MS-studio-a.md`, `tasks/MS-studio-b.md` and `tasks/MS-studio-c.md` against the four clauses, on a phone.

- **F7-30** (P0, `prd/foundations/F7-design-language.md`) — **Principle 1 — mobile-first at 375 px, with full parity and no reduced edition.** Every screen in the product is designed at the small viewport first and expanded to the desktop one; the small screen is the design constraint, not a cut-down variant of a desktop design. **Every feature is present on both** — including the 3D design studio, which the source names as *"the hardest and least negotiable commitment in the system"* and which owner directive 9 protects absolutely: *"no studio feature is dropped on any surface."* Both viewports render without horizontal scrolling, and this is a completion condition (`F7-43`, item 1), not an aspiration.
  **Enforced by:** per-screen review at 375 px and 1536 px with full parity, recorded on every brief in `ux/briefs/**` (`F7-43` item 1).

- **F7-31** (P0, `prd/foundations/F7-design-language.md`) — **Principle 2 — parity is symmetric: the web experience stays full-featured and the mobile experience feels native and extremely fast.** Mobile-first is a design order, not a hierarchy of investment. The owner's mandate is carried whole: *"Mobile-first DOES NOT mean web is compromised. Every feature must work beautifully on web and mobile. The mobile experience should feel native and extremely fast. The web experience should remain full-featured."* Neither surface is the reduced edition of the other; neither is allowed to be the one that ships later.
  **Enforced by:** per-screen review of both platform implementations, and release review that neither surface ships later than the other.

- **F7-32** (P0, `prd/foundations/F7-design-language.md`) — **Principle 3 — touch-first, including the flagship.** Touch is the primary input the product is designed for, not an adaptation layer over a pointer design: mode-based canvases rather than modifier keys, selection that promotes an object to large handles, snapping and nudging in place of pixel-accurate dragging, and no meaning that exists only on hover. The full contract is `F7-29`; the principle is what it means for planning — a feature is not designed until it is designed for a fingertip, and the studio is included rather than excepted.
  **Enforced by:** per-screen review with a fingertip alone, the studio included.

- **F7-33** (P0, `prd/foundations/F7-design-language.md`) — **Principle 4 — one record that travels, and navigation follows the record.** The product replaces a re-keying pipeline with a single record that moves from enquiry through survey, design, proposal, customer link, follow-up, project and money. The interface obligation that follows is concrete: a user reaches the next stage **from the record**, not by leaving it and entering another module; the record's identity, its customer and its current state stay visible as it moves; and **nothing a person has already told the product is ever asked for again** to cross a stage boundary. Modules are an authoring concept, not a navigation model.
  **Enforced by:** navigation review across the module briefs in `ux/briefs/**` — the next stage is reached from the record and nothing already captured is asked for again.

- **F7-34** (P0, `prd/foundations/F7-design-language.md`) — **Principle 5 — progressive disclosure: never present the whole control surface at once.** A screen shows what the user needs for the decision in front of them and reveals the rest as they go. The source names the worked failure: *"The BOM screen presents ~286 controls at once"* — and rules that the answer is disclosure, *"not a smaller font"*. The same law shapes chained editors (each stage revealed with its live consequence, `F7-21`), teaching empty states that show a new user what to do rather than apologising for emptiness, and onboarding that asks for the minimum needed to produce one real quote and collects the rest when it is actually needed (`OV-33`).
  **Enforced by:** per-screen review of control density at the moment of the decision, over the briefs in `ux/briefs/**`.

- **F7-35** (P0, `prd/foundations/F7-design-language.md`) — **Principle 6 — honesty is a UI pattern, not a disclaimer.** Every honesty law in `foundations/F8-data-honesty.md` has a visible form, and the visible form is the requirement: a **provenance tier** rendered beside every user-visible number, **source labels** on energy figures, a **provisional or staleness treatment** on money and on any output whose inputs have moved, an **indicative banner** on a priced document built without a design, and a **structural disclaimer** travelling with structure-bearing output. All of them render as persistent, legible content **adjacent to the number they qualify — never as a tooltip, never behind a tap, never hover-only** (N1, `F8-07`, `F8-31`). A surface that cannot carry the label does not get to carry the number instead.
  **Enforced by:** `T-FPLAT-026`, `T-FPLAT-027`, `T-FPLAT-028` and `T-FPLAT-029`, which produce the tier, source, staleness and disclosure values; the adjacency and persistence of the rendering is enforced per screen.

- **F7-37** (P0, `prd/foundations/F7-design-language.md`) — **Principle 8 — the source's speed budgets are product requirements, and the interface is measured against them.** Two are carried from the source as binding: **a lead is added in under thirty seconds on a phone**, and **a remote survey reaches a sendable proposal in under ten minutes**. They are requirements on the *experience*, not on a server: the number of fields, taps, screens and confirmations between intent and done is what determines whether they hold, so any design that adds a step to either path is measured against the budget before it ships. Where a design cannot meet the budget, that is a finding to record, not a number to quietly restate.
  **Enforced by:** measurement of the two named paths at review — the lead-add flow of `tasks/M02-crm-leads.md` and the remote-survey-to-proposal path of `tasks/M04-survey.md` and `tasks/M06-proposals.md`.

- **F7-38** (P0, `prd/foundations/F7-design-language.md`) — **Principle 9 — consistency and stability over cleverness.** Where a problem has already been solved somewhere in the product, it is solved the same way again: one sheet grammar, one gesture vocabulary, one status treatment, one empty-state pattern, one error voice. A novel interaction must be *better enough* to justify the cost of being learned twice, and this principle is the standing tie-breaker whenever a proposed enhancement trades familiarity for ingenuity.
  **Enforced by:** cross-module design review whenever two modules solve the same interaction problem.

- **F7-39** (P0, `prd/foundations/F7-design-language.md`) — **Principle 10 — cross-platform parity is structural, not aspirational.** Every shared visual component exists as a **web-and-native pair satisfying one shared contract, shipped in the same change**. A component that exists on one platform only, or whose two implementations drift because they were changed at different times, is a defect rather than a backlog item — this is what makes `F7-30` and `F7-31` hold in practice instead of degrading release by release.
  **Enforced by:** release review — a shared component's web and native implementations ship in the same change.

- **F7-40** (P0, `prd/foundations/F7-design-language.md`) — **Principle 11 — every carried-over v1 UX decision must earn its place, in writing.** V2 redesigns the experience from first principles, so a pattern that survives from v1 survives **because it is objectively better**, not because it exists. A carried decision is marked *carried-because-better* where it appears, with its reason. Three are carried and marked in this suite. (a) **The component-selection pattern** — the worked example: the accordion sections with three entry paths per component and compliance badges in the picker, validated against the studio census and against four competitors, none of whom offers the self-serve datasheet route (design spec §10, `DD12`). (b) **The honesty UI** — provenance badges, money-staleness treatment and indicative labelling (`F7-35`), carried because no rival prints defensible numbers. (c) **The two shells and the sheet grammar** (`F7-21`, `F7-22`), carried with their reasons stated and with the part that did not survive — the arc centre's original colour — named. Anything carried without this justification is a finding for the closure pass.
  **Enforced by:** review of every carried v1 pattern for its written carried-because-better reason, at the closure pass.

- **F7-41** (P0, `prd/foundations/F7-design-language.md`) — **Principle 12 — no screen is designed only in English.** Every screen is rendered and reviewed in a non-Latin launch language before it is considered done, because *"English-only design that gets translated later always breaks — and the breakage is invisible until it ships."* This is a completion condition (`F7-43`, item 7) and the practical enforcement of `F7-14`: the script, the line height and the text expansion are checked on the real screen, at both viewports, in the densest surfaces the module owns.
  **Enforced by:** the per-screen Definition of Done (`F7-43` item 7) at both viewports; the same obligation as `F3-18`.

- **F7-42** (P0, `prd/foundations/F7-design-language.md`) — **The product's voice is plain, direct, short and in sentence case, and its buttons are verbs.** A button says what it does — "Schedule survey", "Approve design", "Mark installed" — and never "Submit", "OK" or "Click here". An error **states the problem and the fix**, never blames the user, and never shows a code to a field user. Empty states are encouraging rather than apologetic and teach the next action (`F7-34`). Domain vocabulary is used correctly and consistently (the ruled term for the commercial document is *Proposal* everywhere, `OV-35`/`F3-11`); numbers always carry their units; prose lines stay short enough to read; **no emoji appear anywhere in the product**, including in generated content.
  **Enforced by:** copy review of every brief in `ux/briefs/**` and of all product-generated content.

- **F7-43** (P0, `prd/foundations/F7-design-language.md`) — **A screen is done only when it satisfies every item of the per-screen Definition of Done — violating any single item means it is not done.** The twelve items, carried whole: (1) works at the mobile and desktop viewports with **no horizontal scroll**; (2) all three base states present — loading, empty and error *(amended by owner ruling 2026-08-07 `Q61`: this item read "all four states present — loading, empty, error and offline"; the offline capability was removed from the product, and the 2026-08-07 sweep struck `offline` from the list without correcting the count, leaving the item self-contradicting until now)*; (3) keyboard-operable with visible focus; (4) contrast verified, including the restricted roles of `F7-11`; (5) every target meets the minimum size; (6) the light theme correct; (7) rendered in a non-Latin launch language and checked, with the layout surviving the script and its expansion; (8) **every user-visible number carries its provenance tier**; (9) density correct for the surface; (10) zero raw colour literals and zero off-scale values; (11) tested at realistic volume — a long list, a full bill of materials, a large design — rather than at demo volume; (12) **wired into the flows that reach it — no orphan screens.**
  **Enforced by:** screen review — the twelve items are the completion gate every brief in `ux/briefs/**` is checked against. *(Item 2 re-pulled verbatim 2026-08-07: the live row now reads "all four states present — loading, empty and error" after owner ruling `Q61` removed the `offline` state, the offline capability having been removed from the product. The cell's own count word is carried unchanged under the never-paraphrase rule; `F7-23`'s N10 clause states what binds — three states.)*

- **F7-44** (P0, `prd/foundations/F7-design-language.md`) — **The Definition of Done applies unreduced to the 3D design studio.** No item is waived, softened or deferred for the flagship: it is light like everything else, it carries its three base states, it carries provenance on every number, and it holds full parity at the mobile viewport — which the source calls *"the hardest and least negotiable commitment in the system."* The studio's own tool census remains its separate acceptance gate and never shrinks.
  **Enforced by:** the same twelve-item gate applied unreduced to the studio screens of `tasks/MS-studio-a.md`, `tasks/MS-studio-b.md` and `tasks/MS-studio-c.md`.

- **F7-45** (P0, `prd/foundations/F7-design-language.md`) — **A registered UX gap is closed only when its screen ships wired into its flow, complete — and closing it is a design-at-implementation act, not a new design phase.** Each of the source's registered gaps is designed by the implementing team **directly in the design system, inside the owning module's slice**; the register's own rule is that there is *"no new Claude-Design phase."* A gap is closed when the screen exists **wired into its flow (never orphaned)**, with loading, empty and error states, at both viewports, with the light theme correct — the Definition of Done, applied to a gap. Rows are marked closed and **never deleted**; new gaps are appended in the same form. The one gap this rule could not close — the missing brand mark (`F7-05`) — was closed by the owner instead (ruling 2026-08-04, Q12: letter-tile at launch, commissioned logo post-launch; §6).
  **Enforced by:** the owning module's slice closing each registered gap with a wired, complete screen; register rows are marked closed and never deleted.

---

## Realized elsewhere

These rows are screen rows: their verbatim text is the specification of a screen another bucket owns, and it lives in that screen's brief. They are carried here with their pointers so the bucket's row set is complete.

- **F3-03** (P0, `prd/foundations/F3-localization.md`) — **Every user can reach a language picker, at first run and afterwards.** It appears in onboarding on first run and permanently in the user's own profile and preferences — reachable by every persona on both platforms. It lists each language **in that language's own script and name, never translated into the current language**, and it defaults to the device's language when that language is in the set.
  **Realized by:** `ux/briefs/SCR-M01-03-onboarding-language.md` and `ux/briefs/SCR-M01-11-profile-preferences.md` → `tasks/M01-onboarding.md`. The picker itself is M01's screen; the language set it lists and the device-language default it applies come from `T-FPLAT-005`, and the readiness gate that decides which languages it may offer is `T-FPLAT-009`.

*(Three F4 rows were carried in this section and are struck from it 2026-08-07, with the offline/sync capability that created them. **`F4-22`**, the persistent global sync indicator with its counts sentence and its last-sync time, is killed by name — `prd/foundations/F4-data-integrity.md` §5 ("no global connection indicator"), owner decision `D7`, and the amended `SCR-SHELL-01` brief; nothing is ever waiting, so there is nothing to state, and `tasks/SHELL.md` `T-SHELL-001` loses that element entirely. **`F4-23`**, the sync centre, lost its screen: `SCR-SHELL-04` was deleted by owner decision `D3` and §5 forbids a sync surface; the per-item retry it hosted survives only for photographs and only on the capture screen, where live `F4-21` and `M04-55` place it — `SCR-M04-07` "and nowhere else". **`F4-35`**, "an application too old to sync still reads", was built entirely on the sync contract — the trigger is a sync-contract change and the mitigation is that local reads keep working — so with no local store the soft lockout it required is impossible rather than merely unnecessary; the owner deleted its only screen for exactly that reason (`D4`: `SCR-SHELL-05` "existed only for `F4-35`"). No row id is renumbered and none of the three appears in the Disposition index, which the same sweep cleared.)*

- **F6-12** (P1, `prd/foundations/F6-notifications-and-search.md`) — **Grouping: standard events group; nothing important hides.** The centre groups same-type events on the same subject class ("3 proposals opened today") with each item still individually reachable; immediate-class events (F6-13) never group. Grouping is presentation only — every record still exists individually (F6-06).
  **Realized by:** `ux/briefs/SCR-SHELL-03-notification-center.md` → `tasks/SHELL.md` `T-SHELL-003`. The grouping is presentation over `T-FPLAT-017`'s records; the immediate class that never groups is registered by `T-FPLAT-018`.
- **F6-17** (P0, `prd/foundations/F6-notifications-and-search.md`) — **One notification centre: the bell, the badge, the list.** The badge counts unread from the record (never from push state); the list renders grouped per F6-12, filterable by type-group and read state, newest first; every item deep-links and offers its one-step act where the recipient holds it (F6-02).
  **Realized by:** `ux/briefs/SCR-SHELL-03-notification-center.md` → `tasks/SHELL.md` `T-SHELL-003`. The badge count, the read state, the filters and the one-step act each item offers come from `T-FPLAT-017` and `T-FPLAT-019`.
- **F6-20** (P0, `prd/foundations/F6-notifications-and-search.md`) — **One global search box, everywhere:** finds **leads, customers, sites, proposals, projects and catalog items** — by name, phone or city — plus **people** (employee records) within the searcher's people-records scope. One box in the app shell on web and mobile; results grouped by entity type; every result deep-links. *(The journey's own list says "quotes" — rendered here as proposals per the naming ruling, with the alias law at F6-22.)*
  **Realized by:** `ux/briefs/SCR-SHELL-02-global-search.md` → `tasks/SHELL.md` `T-SHELL-002`. The entity coverage, the grouping, the scope enforcement and the deep links come from `T-FPLAT-020`.

---

## Disposition index

| Row | Disposition |
|---|---|
| F2-01 | T-FPLAT-001 |
| F2-02 | T-FPLAT-001 |
| F2-03 | T-FPLAT-001 |
| F2-04 | LAW |
| F2-05 | T-FPLAT-001 |
| F2-06 | LAW |
| F2-07 | LAW |
| F2-08 | T-FPLAT-001 |
| F2-09 | T-FPLAT-001 |
| F2-10 | T-FPLAT-002 |
| F2-11 | T-FPLAT-002 |
| F2-12 | T-FPLAT-002 |
| F2-13 | T-FPLAT-002 |
| F2-14 | T-FPLAT-002 |
| F2-15 | T-FPLAT-002 |
| F2-16 | T-FPLAT-001 |
| F2-17 | T-FPLAT-002 |
| F2-18 | T-FPLAT-002 |
| F2-19 | T-FPLAT-003 |
| F2-20 | T-FPLAT-003 |
| F2-21 | T-FPLAT-003 |
| F2-22 | T-FPLAT-004 |
| F2-23 | T-FPLAT-004 |
| F2-24 | T-FPLAT-004 |
| F2-25 | T-FPLAT-001 |
| F2-26 | T-FPLAT-001 |
| F3-01 | T-FPLAT-005 |
| F3-02 | T-FPLAT-005 |
| F3-03 | realized-by: T-M01-003, T-M01-011 — `ux/briefs/SCR-M01-03-onboarding-language.md` + `ux/briefs/SCR-M01-11-profile-preferences.md` → `tasks/M01-onboarding.md` |
| F3-04 | T-FPLAT-005 |
| F3-05 | T-FPLAT-005 |
| F3-06 | T-FPLAT-005 |
| F3-07 | T-FPLAT-005 |
| F3-08 | T-FPLAT-006 |
| F3-09 | T-FPLAT-007 |
| F3-10 | T-FPLAT-006 |
| F3-11 | T-FPLAT-006 |
| F3-12 | T-FPLAT-006 |
| F3-13 | T-FPLAT-007 |
| F3-14 | T-FPLAT-007 |
| F3-15 | T-FPLAT-007 |
| F3-16 | LAW |
| F3-17 | T-FPLAT-007 |
| F3-18 | LAW |
| F3-19 | T-FPLAT-008 |
| F3-20 | T-FPLAT-008 |
| F3-21 | T-FPLAT-008 |
| F3-22 | T-FPLAT-008 |
| F3-23 | T-FPLAT-008 |
| F3-24 | T-FPLAT-008 |
| F3-25 | LAW |
| F3-26 | T-FPLAT-009 |
| F3-27 | T-FPLAT-009 |
| F3-28 | T-FPLAT-009 |
| F3-29 | LAW |
| F4-04 | T-FPLAT-011 |
| F4-07 | T-FPLAT-011 |
| F4-14 | T-FPLAT-012 |
| F4-15 | T-FPLAT-012 |
| F4-16 | T-FPLAT-012 |
| F4-17 | T-FPLAT-012 |
| F4-19 | T-FPLAT-012 |
| F4-21 | T-FPLAT-013 (preserved submissions and attention items) · T-FPLAT-015 (the device-held photograph queue) |
| F4-25 | T-FPLAT-014 |
| F4-27 | LAW |
| F6-01 | T-FPLAT-017 |
| F6-02 | T-FPLAT-017 |
| F6-03 | LAW |
| F6-04 | LAW |
| F6-05 | T-FPLAT-017 |
| F6-06 | T-FPLAT-017 |
| F6-07 | T-FPLAT-017 (also read by T-FPLAT-012 and T-FPLAT-019) |
| F6-08 | T-FPLAT-017 |
| F6-09 | T-FPLAT-017 |
| F6-10 | T-FPLAT-018 |
| F6-11 | T-FPLAT-018 |
| F6-12 | realized-by: `ux/briefs/SCR-SHELL-03-notification-center.md` → `tasks/SHELL.md` `T-SHELL-003` |
| F6-13 | T-FPLAT-018 |
| F6-14 | T-FPLAT-018 |
| F6-15 | T-FPLAT-018 |
| F6-16 | T-FPLAT-018 |
| F6-17 | realized-by: `ux/briefs/SCR-SHELL-03-notification-center.md` → `tasks/SHELL.md` `T-SHELL-003` |
| F6-19 | T-FPLAT-019 |
| F6-20 | realized-by: `ux/briefs/SCR-SHELL-02-global-search.md` → `tasks/SHELL.md` `T-SHELL-002` |
| F6-21 | T-FPLAT-020 |
| F6-22 | T-FPLAT-020 |
| F6-23 | T-FPLAT-020 |
| F6-24 | T-FPLAT-020 |
| F6-25 | T-FPLAT-020 |
| F6-26 | T-FPLAT-021 |
| F6-27 | T-FPLAT-021 |
| F7-01 | LAW |
| F7-02 | LAW |
| F7-03 | T-FPLAT-023 |
| F7-04 | LAW |
| F7-05 | LAW |
| F7-06 | LAW |
| F7-07 | T-FPLAT-022 |
| F7-08 | LAW |
| F7-09 | LAW |
| F7-10 | LAW |
| F7-11 | LAW |
| F7-12 | LAW |
| F7-13 | LAW |
| F7-14 | LAW |
| F7-15 | LAW |
| F7-16 | T-FPLAT-024 |
| F7-17 | LAW |
| F7-18 | LAW |
| F7-19 | LAW |
| F7-20 | LAW |
| F7-21 | LAW |
| F7-22 | T-FPLAT-025 |
| F7-23 | LAW |
| F7-24 | LAW |
| F7-25 | LAW |
| F7-26 | T-FPLAT-023 |
| F7-27 | LAW |
| F7-28 | LAW |
| F7-29 | LAW |
| F7-30 | LAW |
| F7-31 | LAW |
| F7-32 | LAW |
| F7-33 | LAW |
| F7-34 | LAW |
| F7-35 | LAW |
| F7-37 | LAW |
| F7-38 | LAW |
| F7-39 | LAW |
| F7-40 | LAW |
| F7-41 | LAW |
| F7-42 | LAW |
| F7-43 | LAW |
| F7-44 | LAW |
| F7-45 | LAW |
| F8-01 | T-FPLAT-026 |
| F8-02 | T-FPLAT-026 |
| F8-03 | T-FPLAT-026 |
| F8-04 | T-FPLAT-026 |
| F8-05 | T-FPLAT-026 |
| F8-06 | T-FPLAT-026 |
| F8-07 | T-FPLAT-026 |
| F8-08 | T-FPLAT-027 |
| F8-09 | T-FPLAT-027 |
| F8-10 | T-FPLAT-027 |
| F8-11 | T-FPLAT-027 |
| F8-12 | T-FPLAT-028 |
| F8-13 | T-FPLAT-028 |
| F8-14 | T-FPLAT-028 |
| F8-15 | T-FPLAT-028 |
| F8-17 | T-FPLAT-028 |
| F8-18 | T-FPLAT-028 |
| F8-19 | T-FPLAT-028 |
| F8-20 | T-FPLAT-029 |
| F8-21 | T-FPLAT-029 |
| F8-22 | T-FPLAT-029 |
| F8-23 | T-FPLAT-029 |
| F8-24 | T-FPLAT-029 |
| F8-25 | T-FPLAT-030 |
| F8-26 | T-FPLAT-030 |
| F8-27 | T-FPLAT-030 |
| F8-28 | T-FPLAT-030 |
| F8-29 | T-FPLAT-030 |
| F8-30 | T-FPLAT-031 |
| F8-31 | T-FPLAT-031 |
| F8-32 | T-FPLAT-031 |
| F8-33 | T-FPLAT-032 |
| F8-34 | T-FPLAT-032 |
| F8-35 | T-FPLAT-032 |
| F8-36 | T-FPLAT-032 |
