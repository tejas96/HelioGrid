# F-platform (F2 · F3 · F4 · F6 · F7 · F8) — engineering tasks

This file dispositions every requirement row of the suite's six platform foundations — `docs/prd/foundations/F2-roles-and-permissions.md` (F2), `docs/prd/foundations/F3-localization.md` (F3), `docs/prd/foundations/F4-data-integrity.md` (F4), `docs/prd/foundations/F6-notifications-and-search.md` (F6), `docs/prd/foundations/F7-design-language.md` (F7) and `docs/prd/foundations/F8-data-honesty.md` (F8) — under the task-id prefix **T-FPLAT-**. This bucket owns no screens: the platform surfaces these documents describe (the app shell, global search, the notification centre, the language picker, the profile preferences and the branding settings) are built in `docs/tasks/SHELL.md` and `docs/tasks/M01-onboarding.md`, and appear here under **## Realized elsewhere**. What this file builds is the machinery those screens and every module screen read from: the permission and audit engines, the message catalog and the four format implementations, the server-owns-truth engine, the notification registry and delivery engine, global search, and the provenance, staleness and disclosure engines of the data-honesty foundation. Every rule that engineering cannot build as a component — because it is a property of screens and of review — is carried verbatim under **## Laws**. Every row appears exactly once in the **## Disposition index** at the end.

---

### T-FPLAT-001 · The twelve fixed presets and the per-module capability matrix
**Type:** engine · **Tier:** P0
**Status:** shipped (#42)
**Why:** Every guard, screen and query in the suite asks one question — "does this person's preset grant this act, and how far can they see?" — and the answer must come from one table that reads exactly as `F2` §F2.5, or the first module to type its own cell is the first cross-tenant leak. The guard `T-M01-025` shipped already asks `can(roles, capability)`; today the matrix behind it holds M01's five rows and an EMPTY visibility table, so every other module's route would compile against nothing and every visibility question answers "none".
**PRD rows:** F2-01, F2-02, F2-03, F2-05, F2-08, F2-09, F2-16, F2-25, F2-26
**Design:** none — an engine task with no screen; the Roles Reference screen (`T-M01-014`) renders the tuple this task fixes.
**Depends on:** `T-M01-025` (shipped, #40 — the guard that consumes `can`).

**DONE WHEN:**

- Given any tenant, when the role list is read, then exactly the twelve presets of F2-01 exist, by exactly those names, and no tenant-created role exists (F2-01, F2-02). → proof: invariant `matrix-mirrors-f2` (static, `tests/invariants/`) — every §F2.5 table's columns are the twelve, by F2-01's names, in its order (the list is the domain tuple and has no read route: a fixed vocabulary ships in the client); invariant enum-parity (`M17`) — the pgEnum and the contract enum equal it; the schema holds no role table, so a tenant-created role has nowhere to exist
- Given a design awaiting sign-off, when a holder of `F2.M05.approve-designs` acts, then the matrix grants that act to EPC Owner and Design Engineer and to nobody else (F2-03). → proof: unit — `can` answers true for those two presets alone; the recording of who and when, and the return with pinned comments (F2-04), are the studio's approve task's lines, proven there
- Given any tenant, when roles are administered, then no create-role, edit-role or delete-role action exists on any surface (F2-16, F2-02). → proof: unit `packages/contracts/tests/no-role-editor.test.ts` — `apiContract` declares no route whose path names roles with a write method; schema — `membership_role.role_preset` is the enum, there is no role table; the screens have nothing to render because the contract has nothing to call
- Given a person holding only Sales Manager, when they act, then every v1 `Manager` matrix grant is available to them and no more (F2-08). → proof: unit over the matrix — Sales Manager holds each of the nine v1 `Manager` grants (Team lead visibility · add/edit leads · assign leads · capture surveys · create/edit and send proposals · update project stages · record payments and upload documents · see agent performance · team-scoped company reports) by their V2 row keys; "no more" is the parity test below — the preset holds exactly the cells §F2.5 states
- Given the matrices in `F2` §F2.5, when the code's matrix is compared cell for cell, then every fixed row exists in code with identical cells and no code row is absent from the PRD (F2-25, F2-26). → proof: invariant `matrix-mirrors-f2` (static, always runs, `tests/invariants/src/matrix-mirrors-f2.ts`) reads §F2.5 from the PRD file and diffs it against `CAPABILITY_MATRIX` and the visibility cells — seen red on one changed cell before it is trusted; a package may not import a file outside itself, which is why the proof is an invariant and not a domain unit test
- (F2-05, F2-09 carry no dedicated Given/When/Then lines in the PRD's acceptance block; the requirement texts above are the binding criteria.) → proof: invariant — `matrix-mirrors-f2` holds Installation Team Member and Field Technician as two columns whose cells differ where §F2.5 says they differ

---
### T-FPLAT-002 · Permission resolution — OR across held presets, per-domain visibility scope, widest-wins
**Type:** engine · **Tier:** P0
**Status:** shipped (#43)
**Why:** The matrix (`T-FPLAT-001`) says what each preset holds; a person holds several, and every guard, list and report needs ONE answer for the stack — may they, how far can they see, and which held role is doing the work. The API guard already folds `can` over the held roles and `visibilityIn` already folds widest-wins per domain, but neither is proven at its edges nor barred, and the visibility answer is not yet the closed vocabulary every repository will scope its query by; left unproven, the first module to need it re-implements the fold in a handler, which is the sweep F2-15 forbids.
**PRD rows:** F2-10, F2-11, F2-12, F2-13, F2-14, F2-15, F2-17, F2-18
**Design:** none — an engine task; the Team screen (`T-M01-012`) renders the held presets as chips and names the one doing the work from this task's answer.
**Depends on:** `T-FPLAT-001` (shipped, #42 — the matrices and ladders this resolves over).

**DONE WHEN:**

- Given a person holding Sales Executive + Survey Engineer, when they open any lead list, then they see their own leads (widest of Own and Assigned), and both grant sets are available by OR (F2-10, F2-11, F2-13). → proof: unit `packages/domain/tests/authz/resolution.test.ts` — `visibilityIn` answers `own` with `includesAssigned` and names both presets in `grantedBy`; `can` holds `crm.add_edit_leads` (the rep's) and `survey.capture_surveys` (the surveyor's) for the pair; a limited and an outright grant of one act resolve to the outright one, and two limited grants to both phrases
- Given a person holding Sales Manager + Field Technician, when they open the field surfaces, then they see the field team's day only if a field-domain scope grants it — their Team *lead* scope changes nothing outside the lead domain (F2-14). → proof: unit — the pair answers `team` in leads and `own` in field work; a domain with no fixed row answers `none`; a cell that reads through projects is carried in `through`, never folded
- Given any user, when an administrator asks what they can do, then the answer is fully determined by their preset list — no per-person exception exists to consult (F2-15). → proof: unit — `grantedCapabilities`, `can`, `limitsOn` and `visibilityIn` answer the same for a preset list in any order and with duplicates, and zero presets grant nothing anywhere; the signatures take roles alone, and the schema holds no per-user permission table
- Given a user whose role is removed mid-action, when the in-flight action completes, then it succeeds and the next action is what the restriction applies to (F2-17). → proof: unit `packages/domain/tests/auth/admission.test.ts` — a claim whose `authorizationVersion` is stale is refused, which happens at the NEXT request because the guard admits once per request (`apps/api/src/common/auth/session.guard.ts`) and never re-checks mid-flight
- (F2-12 and F2-18 carry no dedicated Given/When/Then lines in the PRD's acceptance block; the requirement texts above are the binding criteria.) → proof: unit — a rep sees own, a manager team, the owner all, in leads and in every fixed domain; invariant `matrix-mirrors-f2` — the customer is no column of any table
- Given the resolution files, when the unit suite runs with coverage, then `packages/domain/src/authz/**` is at 100% and the deferred row that named the gap is gone. → proof: gate `M71` — the bar widens from the matrix files to the folder

---
### T-FPLAT-003 · Role-administration guarded transitions — last Owner, last Manage-team, deactivation, zero-role invite
**Type:** engine · **Tier:** P0
**Status:** shipped (#44)
**Why:** An owner changes a teammate's presets or ends a leaver's access from the Team screen, and the company can never lock itself out, orphan a person's history or mint a member who signs in to nothing; without these transitions the guards are promises a screen keeps, a deactivation is a row edit no session notices, and the first screen to need a transition writes its own.
**PRD rows:** F2-19, F2-20, F2-21
**Design:** none — an engine task. The Team screen (`T-M01-012`) rests the sole owner's own row on this task's decision and calls the deactivate transition; Assign Roles (`T-M01-013`) calls the role-set transition; Invite Teammate (`T-M01-007`) is refused by the same role-set schema.
**Depends on:** `T-M01-025` (shipped, #40 — migration 0002, the guard, the session sweep) · `T-FPLAT-001` and `T-FPLAT-002` (shipped, #42, #43 — `can` over the matrix).

**DONE WHEN:**

- Given a tenant with one EPC Owner, when anyone attempts to remove that person's Owner preset or deactivate them, then the attempt is blocked with an explanation and the blocked attempt is audit-logged (F2-19, F2-22). → proof: unit `packages/domain/tests/authz/administration.test.ts` — `keepsControl` is false for no sets and for a full team without an owner, true the moment one set holds it whatever the order or the duplicates, and every preset the matrix grants Manage team is the owner (seen red on a guard that always answers true); unit `apps/api/tests/tenant/role-administration.test.ts`, against a migrated database — the refusal leaves both the role rows and the authorization version untouched, and the same write is accepted once it keeps the owner (seen red on a transition that skips its guard); qa-api — dropping the sole owner's preset and deactivating them both answer 422 `LAST_OWNER` and change no row; the audit entry is `T-FPLAT-004`'s and is proven there
- Given a person who leaves, when they are deactivated, then their sessions end, they leave assignment pickers, and their history stays attributed to them (F2-20). → proof: unit `apps/api/tests/tenant/role-administration.test.ts` — a member the company can spare is deactivated, keeps their name and every preset they held, moves the authorization version on, and their sessions under THIS company are revoked while the same person's session in another company is not (seen red on a sweep without its tenant predicate); a second deactivation and a later role write both answer not-active, and no route, grant or column deletes a person; the roster's `status` is what every picker filters on and the pickers are their own modules'
- Given an invite composed with zero roles, when it is submitted, then it is blocked before sending (F2-21). → proof: unit `packages/contracts/tests/role-set.test.ts` — `roleSetSchema` refuses the empty set and an unknown preset, and accepts one preset and all twelve (seen red on a schema without its floor); qa-api — `PUT …/roles` with an empty list answers 400 `VALIDATION_FAILED` whose `details[].path` is `roles`; the invite route itself is `T-M01-028`'s, against this schema
- Given migration 0003, when the tenancy invariants run, then a role row is written under the tenant's own pin and refused under another tenant's. → proof: invariant `tenancy-rls` — the own-tenant INSERT is accepted as `app_user` and the cross-tenant one refused by WITH CHECK, seen red as `permission denied for table membership_role` before the migration was applied; the migration applies fresh and skips cleanly when already applied
- Given the administration files, when the unit suite runs with coverage, then `packages/domain/src/authz/**` stays at 100%. → proof: gate `M71`

---
### T-FPLAT-004 · The append-only audit log, its tenant-scoped export and the impersonation record
**Type:** engine · **Tier:** P0
**Status:** shipped (#45)
**Why:** Today nothing the product performs is recorded, so "who removed my access?" has no answer at all — and F2-15 only dares to derive every permission purely from roles because this log keeps the derivation's history readable. The two guarded transitions that shipped refuse and rewrite in silence; every module from M06 to M12 is written against a log that does not exist, and without it the first one to need an entry invents its own table.
**PRD rows:** F2-22, F2-23, F2-24
**Design:** none — an engine task with no screen. `screens.md` disposes all three rows as `policy`, so no V1 surface lists the log: the export is a route a tenant administrator calls, and rendering an entry in the viewer's language (F2 §F2.4's localization note) belongs to the first screen that lists them, which is not designed.

**Depends on:** `T-M01-025` (shipped, #40 — migration 0002, `tenant`, the tenant-scoped pattern, and the auth acts this logs) · `T-FPLAT-001` (shipped, #42 — the matrix the export's gate comes from) · `T-FPLAT-003` (shipped, #44 — the two guarded transitions whose writes and refusals this logs).

**DONE WHEN:**

- Given any event named in F2-22's list, when it occurs, then an append-only entry exists recording who, what and when — including for blocked attempts (F2-22). → proof: unit `apps/api/tests/audit/audit-log.test.ts`, against a migrated database — a role change lands ONE entry carrying actor, subject, time and the old → new set; a deactivation lands its own, whose event name is the whole change; a sign-in lands one under the company the session acts under, a sign-in belonging to no company lands none, and the FOUNDING sign-in lands at the moment the session adopts the company it just created — the signer verified their code before that company existed, and without it every company's log would open with a sign-out that has no sign-in (seen red on an adoption that records nothing); the writer joins the CALLER's transaction, so a change that fails after its entry leaves no entry (seen red on a writer that opens its own connection — three cases fail, that one included); a refused last-Owner removal lands its entry with `blocked` true, carrying the set that was attempted, and changes no role row (seen red on a transition that returns before recording); that no role may EDIT or REMOVE an entry is the invariant's, below, and is deliberately not restated here — asked of a unit test it would pass locally and lie under CI, whose connecting role is a superuser that bypasses RLS and holds every privilege; the acts no code performs yet are the modules' own appends and are proven in their slices
- Given a tenant administrator, when they export the audit log, then they receive their own tenant's entries and no other tenant's (F2-23). → proof: unit `apps/api/tests/audit/audit-log.test.ts` — two companies each act, and each export returns only its own rows, newest first, over the `(tenant_id, occurred_at desc)` index (seen red on a read that has neither its tenant predicate nor the policy behind it; the predicate alone can be dropped without the test noticing, which is what defence in depth means and is said here rather than claimed away); qa-api — an EPC Owner reads the log over `curl` (200, newest first, `?page=2&limit=1` a different id at the same `totalCount`) and an unauthenticated read answers 401 `UNAUTHENTICATED`; a cross-company read returns that company's entries alone, the two id sets disjoint in the response AND under a tenant-pinned read. The 403 for a holder WITHOUT the capability is NOT proven on the wire and is not claimed: no route puts a second person in a company until `T-M01-028` lands, and seeding one is a database write the repo forbids. Its three parts are each proven — the route declares the capability, the guard denies a route's capability by construction, and the matrix invariant holds the cell — but the composition waits, as the `docs/tasks/deferred.md` row this task raises
- Given a platform-staff access to tenant data, when it occurs, then it is read-only and an audit entry records it (F2-24). → proof: unit `apps/api/tests/audit/audit-log.test.ts` — an entry whose `actor_kind` is `platform_staff` writes, exports beside a tenant user's, and its actor holds no membership in the company logged; the READ-ONLY half is unprovable here — no back-office surface exists in the suite for staff to read a tenant through — and it is the `docs/tasks/deferred.md` row this task raises, which owns the surface, its read-only enforcement and this line's second proof
- Given migration 0004, when the tenancy invariants run, then an entry is written under the tenant's own pin and refused under another tenant's, and no role may change or remove one. → proof: invariant `tenancy-rls` — the own-tenant INSERT is accepted as `app_user` and the cross-tenant one refused by WITH CHECK (seen red on a refusal aimed at its own tenant), the append-only half reads UPDATE, DELETE and TRUNCATE from the catalog over every RLS-subject role — the ONE home for that proof, because a privilege is a property of the system and a test that connects as a privileged role cannot see it — and it now names the ledger that EXISTS: it had named `audit_log`, `usage_events` and `sync_mutations`, none of which was ever built, so it matched nothing and reported a pass it never earned — it is corrected here and fails on an empty list (seen red both ways: on the empty list, and aimed at a table that does hold UPDATE); invariant `enum-parity` (`M17`) — the three new pgEnums equal their contract tuples (seen red on a value added to the tuple alone); invariant `schema-parity` (`M18`); the migration applies fresh and skips cleanly when already applied

---
### T-FPLAT-005 · The message catalog and runtime language resolution — per-user language, silent English fallback, reader-language rendering
**Type:** engine · **Tier:** P0
**Status:** shipped (#46)
**Why:** A Marathi-speaking surveyor and an English-speaking owner open the same lead and each must see their own language around the same data — and today neither does: the catalog, the provider and the switch all exist in `packages/i18n`, but both apps boot in English and stay there, because the session never says which language the person chose. Without this the first designed screen has nothing to follow, the picker screens (`T-M01-003`, `T-M01-011`) have nothing to write to that the app will honour, and every engine that must render for a READER — a notification, a customer link — has no proven seam to call.
**PRD rows:** F3-01, F3-02, F3-04, F3-05, F3-06, F3-07
**Design:** none — an engine task. The pickers that CALL it are designed and built elsewhere: `SCR-M01-03` (`T-M01-003`) and `SCR-M01-11` (`T-M01-011`), whose brief fixes the behaviour this task must honour — *every preference applies as it is touched; no Save, no confirmation; the whole application redraws*. `packages/ui`'s `LanguageSwitcher` is M07's AGENT-language strip, not the user's picker, and is not this task's.
**Depends on:** `T-M01-025` (shipped, #40 — `user_account.interface_language`, `PATCH /users/me`, the session projection) · the i18n foundation (#7 — the catalog, `createI18nRuntime`, `createTranslator`, the provider, both loaders; no task id owns it) · `T-FPLAT-001` (shipped, #42 — no capability row: language is every preset's own, F3 §F3.1).

**DONE WHEN:**

- Given two users of different languages in one tenant, when they open the same record, then each sees the interface in their own language and the record's data identical (`F3-01`, `F3-02`). → proof: qa-api — `GET /auth/session` answers `actor.interfaceLanguage` equal to what `PATCH /users/me` stored, for two accounts in one company holding different languages; qa-web — a session whose language is `mr` boots the app and `<html lang>` reads `mr` with no navigation, and the same page under an `en` session reads `en` (the data is the server's and never translated, `F3-02`'s structural claim); unit `packages/i18n/tests/runtime.test.ts` — two translators in two languages built at one moment each answer in their own (seen red on a shared instance). The copy on a SCREEN redrawing is proven by each designed screen as it lands — every live screen today is a placeholder rendering English literals, and none renders a message
- Given a user with an in-progress form open, when they change language, then every surface re-renders in the new language immediately, without a reload, and their entered values are unchanged (`F3-04`). → proof: unit `packages/i18n/tests/runtime.test.ts` — `setLocale` swaps the catalog on the SAME instance and the runtime's identity never changes, so nothing above it remounts (seen red on a runtime that rebuilds its instance); qa-web — with the person's stored language changed on the server, one boot of the app moves `<html lang>` to it with the navigation count unchanged at 1 (the switch is the client's, not a reload; the server always paints the source locale); the store's `setInterfaceLanguage` has no caller on any surface yet — the pickers are `T-M01-003`/`T-M01-011`'s — and its persist-then-follow path is proven by the same store method's read side on the wire, not by a screen; a typed value surviving the switch is proven on the first designed form (`T-M01-001`, which depends on this) — no live surface holds a form today, and a proof invented on a placeholder would prove the placeholder
- Given a string with no translation in the active language, when the surface renders, then the English string appears in its place and no identifier, blank or error is shown (`F3-05`). → proof: unit `packages/i18n/tests/runtime.test.ts` — a Hindi translator given an id its catalog lacks returns the English source text, never `''` and never a key; a translated id returns Hindi; a catalog that fails to load leaves the runtime on its current language and rejects with the cause rather than blanking (seen red on a translator that returns the raw id for a message its catalog holds); gate `M46` counts every empty translation on each run, so a gap is seen and filled while the runtime path renders it in English
- Given a notification or a customer-facing rendering, when it is emitted or opened, then it is in the recipient's or customer's language, not the originating user's (`F3-06`). → proof: unit `packages/i18n/tests/runtime.test.ts` — `createTranslator('mr')` and `createTranslator('en')` awaited together answer Marathi and English respectively, and neither moves the other (seen red on a module-level instance); the notification and document engines that emit for a reader are not built and each proves its own call when it lands — `T-FPLAT-018`, M06, F5
- Given any product-supplied user-visible string, when the language set is enumerated, then a translation exists for it in every language or `F3-05`'s fallback applies — and no string is designated permanently English-only (`F3-07`). → proof: gate `M45` (copy goes through Lingui) · gate `M46` (every empty translation reported) · gate `M47` (catalogs fresh) · gate `M48` (every language registered in both loaders and the meta table) — all HELD in `mechanisms.md`; unit `packages/domain/tests/format/languages.test.ts` — `packLabel` falls back to English for a pack label missing the reader's language (exists)
- Given `packages/i18n/src/runtime.ts`, when the unit suite runs with coverage, then it stays at 100%. → proof: gate `M71`

---
### T-FPLAT-006 · Content classes — the never-translated set, and tenant-authored per-language content
**Type:** engine · **Tier:** P0
**Status:** shipped (#104)
**Why:** Two of this ticket's four rows are already true in the tree and two belong elsewhere, and the ticket said none of that. `F3-08` landed with the format implementations (`T-FPLAT-008`): the unit formatters take no language at all, so a unit cannot vary by one, and the value–unit join is a non-breaking space proven in `measurement.test.ts`; names, addresses and brand names are DATA, which never enters the translator. the one-term law's enforceable half is `T-FPLAT-058`'s by that ticket's own words, and the closed-vocabulary guard belongs with the first closed vocabulary that gets a translated display — both rows moved to those tickets at this `/start`, with the reason on each. What is genuinely unbuilt is `F3-10`'s one open law: tenant-authored content stored per language already exists (`PerLanguage<T>`, `perLanguage()` on the wire, the tenant's default terms), but the ONE fallback the tree has — `inLanguage()` — is `F3-05`'s SILENT English substitution, right for a pack label and exactly what `F3-10` forbids for a tenant's words. No consumer renders tenant content in a reader's language yet (M06, M07 and F5 are later blocks), so this is the moment to author that resolution once, before three screens each invent it (Law 11).
**PRD rows:** F3-08, F3-10
**Design:** none — an engine task with no screen. The note a reader sees ("shown in English — not yet written in Marathi") is copy this task authors in `packages/i18n`; the part that draws it lands with the first screen that renders tenant content, per `M115`.
**Depends on:** `T-FPLAT-005` (shipped, #46 — the reader-language seam and `createTranslator`). The formatters `F3-08` is proven by landed in #13 before task ids existed; their ledger row is the `deferred.md` entry this task raises, not a dependency.

**DONE WHEN:**

- Given a customer name, address, brand or model name, unit, or operator name, when it renders in any language on any surface including generated documents, then it is byte-identical to the English rendering (`F3-08`). → proof: unit `packages/domain/tests/format/vocabulary.test.ts` reads `DISCOM` identically in `mr` and `hi`, and `measurement.test.ts` renders `m` and `ft` from a formatter that takes a MARKET and no language — a unit cannot vary by a parameter it does not have; names and addresses are data with no translator path, which is structural and said here rather than tested
- Given a numeric value with a unit, when it renders at any viewport width, then value and unit appear together on one line (`F3-08`). → proof: unit `packages/domain/tests/format/measurement.test.ts` asserts the non-breaking join on every rendered length, positive, zero and negative
- Given a tenant-authored template, entry or document copy, when it is rendered in a language the tenant has not authored it in, then the product does not display a machine translation or a different language's version as if it were that language (`F3-10`). → proof: unit `packages/domain/tests/format/authored.test.ts` — `authoredIn` returns the Marathi version when written, and when not returns the ORIGINAL with `shownIn: 'en'` and `requested: 'mr'`, never a third language and never the Hindi version dressed as Marathi (seen red on a resolver that falls through to the nearest written language); unit `packages/i18n/tests/authored-content.test.ts` — `shownInNote` says which language is shown and which was asked for, in `en`, `hi` and `mr`, and the three renderings differ
- Given the author's side, when a piece of content is read for its gaps, then every unwritten language in the set is named. → proof: unit `authored.test.ts` — `authoredIn(...).missing` lists exactly the languages with no version, in the set's order, empty when all are written
---
### T-FPLAT-007 · Script rendering — the bundled face on both platforms, its weights, and per-script line height
**Type:** engine · **Tier:** P0
**Status:** shipped (#105)
**Why:** A person who picks हिन्दी or मराठी on the phone is not reading our typeface and is losing the tops of every heading. Measured, not assumed: Geist maps 0 of the 128 Devanagari codepoints, a React Native `Text` carries ONE `fontFamily`, and iOS's cascade never reaches an app-linked face — so the phone draws Devanagari in Kohinoor while the web draws it in the Noto Sans Devanagari both surfaces bundle (`deferred.md`; the owner found the clipped Marathi heading after #53). Two records, one law: `F3-13` says script runs are resolved explicitly on a platform without per-codepoint fallback. The second half is why the clipping happened at all — Devanagari inks 1.289 em in the bundled face against Geist's 0.92 em over the same copy, and five of the scale's line boxes are shorter than that (`h4` 1.059 em, `display` and `h3` 1.100, `h1` 1.125, `h2` 1.167), so the marks have nowhere to go. `F3-17` names the fix and no token expresses it (`docs/ux/briefs/SCR-M01-03-onboarding-language.md`). The native half carries a hand-measured stand-in for the wrong face — `DEVANAGARI_INK_LINE_EM = 1.56`, Kohinoor's ink line, padded in the primitive — which this change makes both wrong and unnecessary, so the two halves cannot be split: setting the family without the line height makes the clipping worse, not better.
**PRD rows:** F3-09, F3-13, F3-14, F3-17
**Design:** none — an engine task with no screen. It changes what every existing screen draws in `hi` and `mr`: the two `Text` halves and the emitted line-height set, measured against the `HelioGrid-UX/` exports, whose frames carry no per-script rule of their own.
**Depends on:** nothing. `packages/theme`'s generator, the `Text` primitive, the bundled faces and the runtime language switch are all on `main`; confirmed ready at this `/start` from the build-order line.

**DONE WHEN:**

- Given a string mixing Latin values or names with another script, when it renders on any surface, then shaping, spacing and line breaking are correct and nothing is transliterated (`F3-09`). → proof: unit `packages/domain/tests/format/scripts.test.ts` — the source's own example, a capacity in Latin digits and units beside a Devanagari word, splits into two runs with the digits and the unit in the brand face and the word in the bundled script face; the same line the other way round splits the other way; five inputs put every character back byte for byte, and a joiner — which decides whether two consonants draw as one conjunct — stays inside its run rather than cutting it. Seen RED three times, one guard at a time: cutting the run at an uncovered character, sorting the stack instead of reading its order, and letting the current face keep a character it also covers each failed exactly the test that guards it; qa-mobile reads the line on the phone in `hi` and `mr`, qa-web in the browser
- Given any surface on either platform, when text renders in a non-Latin language, then it renders in the bundled script face at the correct weight, identically across devices, with no system-fallback rendering and no synthesized weight (`F3-13`, `F3-14`). → proof: gate `M133` — the build reads each bundled face and REFUSES to emit, seen RED on a face shipping fewer weights than the design language sanctions and on a file whose family is not the one the stack names; the resolution itself is measured, not assumed — the brand face maps 0 of the 128 Devanagari codepoints and the bundled face maps all of them, so a native `Text`'s one family is chosen from the file rather than from the operating system's cascade; qa-mobile reads a Devanagari heading at regular and bold on iOS and on Android against the export, which is where the Kohinoor substitution was found and is the only place its absence can be proven
- Given text in a script requiring more vertical room, when it renders, then line height is adjusted per script while the type scale's sizes are unchanged (`F3-17`). → proof: gate `M133` — no `--fs-*` is touched and no token is hand-edited; the floor is the bundled face's own declared line, so a Latin line is drawn exactly as `Text.css` and the native scale already drew it and only a clipped line is raised — five roles in Devanagari, none in Latin, measured through the shipped binder; qa-mobile reads those five roles on the phone with no mark clipped, qa-web reads the same five in the browser, and qa-parity reads one import list and one derived answer across the two halves
### T-FPLAT-008 · The four format implementations — money, non-money numbers, dates and times, measurements
**Type:** engine · **Tier:** P0
**Status:** shipped (#108)
**Why:** Three of the four implementations are already on `main`, built inside the slices that needed them — `packages/domain/src/format/` holds money, numbers, dates and measurements, and the `M49` invariant already refuses a second `Intl` formatter anywhere outside that folder. What never landed is the half of this section that joins F8. `F3-24` puts the honesty obligation INSIDE the format layer, and the format layer carries none: a figure and its provenance tier are two independent props today, so the narrow screen that `F3-24` names by name can render the amount and drop the label, and nothing anywhere notices. `F3-22`'s tenant half is missing the same way — every date renders on the MARKET's default zone, because nothing substitutes the tenant's own, and a rep reading an 09:00 slot from another country reads the market's answer rather than their company's.
**PRD rows:** F3-19, F3-20, F3-21, F3-22, F3-23, F3-24
**Design:** none — an engine task with no screen. The qualifier a reader sees is drawn by `packages/ui`'s `Provenance`, which is landed and is not touched: this task gives that component a value it cannot be handed without its label, not a second way to draw one.
**Depends on:** nothing open, written at this `/start` because the ticket carried no line (`M126`). The pieces it completes are all on `main` and were confirmed there at this `/start`: `packages/domain/src/format/` and its 169 passing tests, the `M49` invariant `format-rendering`, `packages/contracts`' `provenanceTierSchema`, and `packages/ui`'s `Provenance` component with its open tier vocabulary.

**DONE WHEN:**

- Given any surface, document, export or spoken output in the product, when it renders an amount, then it renders through the single money implementation using the tenant market's declared format values, identically in every language (`F3-19`, `F3-20`). → proof: invariant `format-rendering` walks every tracked file and fails on an `Intl` formatter outside the format slice; unit packages/domain/tests/format/money.test.ts renders the market's declared strings character for character
- Given a user who switches interface language, when they re-read the same amount, date or measurement, then the rendered value is character-identical apart from surrounding words (`F3-20`, `F3-22`). → proof: unit packages/domain/tests/format/language-invariance.test.ts — every formatter renders once per shipped UI language and the renderings must be ONE string, and the same test proves the claim is not vacuous by showing the same formatters DO move when the pack's own locale changes
- Given any language and any surface including generated documents, when a numeral renders, then it uses Latin digits (`F3-21`). → proof: invariant `format-rendering` scans every rendered value for a non-Latin digit, the qualified renderings included
- Given a user-facing date or time, when it renders, then it uses the pack's declared style and the tenant's timezone, from the shared implementation (`F3-22`). → proof: unit packages/domain/tests/format/tenant-pack.test.ts — a tenant zone substituted into the pack moves a date across midnight while the market default leaves it where it was; invariant `format-rendering` holds the market case
- Given a user with a non-default measurement preference, when they open a procurement or BOM quantity, then it is metric (`F3-23`). → proof: unit packages/domain/tests/format/measurement.test.ts — `PROCUREMENT_SYSTEM` is a constant and not a parameter, so an imperial reader still renders metres; invariant `format-rendering` holds the rendered string
- Given an amount carrying a provenance tier, provisional state or disclosure, when it renders compactly or on the narrowest supported screen, then the qualifier renders with it (`F3-24`). → proof: unit packages/domain/tests/format/qualified.test.ts — a qualified amount cannot be built without its tier, compacting keeps every qualifier the full rendering carried, and one qualified value renders one way for every reader; invariant `format-rendering` fails on a qualified rendering that lost a qualifier

---
### T-FPLAT-009 · The language-set boundary — the readiness gate and the add-a-language playbook
**Type:** engine · **Tier:** P0
**Status:** shipped (#153)
**Why:** Hindi and Marathi render today because `T-FPLAT-007` bundled the one face they need and a person checked them. Nothing stops the fourth language from shipping with its script drawn by the phone's system font, its plurals in English grammar, or a phone that never linked its face — each breaks every screen at once, and no fallback hides it (`F3-27`). And nobody has written down what adding a language IS, so the first one will be a release instead of a configuration change (`F3-26`).
**PRD rows:** F3-26, F3-27, F3-28
**Design:** none — an engine task with no screen. The pickers (`SCR-M01-03`, `SCR-M01-11`, the sign-in language control) already list the language set and are not changed: a language that fails the gate never reaches the set.
**Depends on:** `T-FPLAT-005` (shipped, #46 — the set, the catalogs, the fallback) · `T-FPLAT-007` (shipped, #105 — the script stack the coverage check reads) · `T-FPLAT-008` (shipped, #108 — money takes the market's pack and never a language, so `F3-20`'s step is a type fact).

**DONE WHEN:**

- Given a new language, when it is added, then the work consists of the playbook's steps only and produces no design-token change, no component change, and no product-model change beyond the language list (`F3-26`).
- Given a language that has not passed the script, plural-rule and expansion checks, when the language picker renders, then that language is not offered (`F3-27`).
- Given a language that has passed those checks but is incompletely translated, when it is selected, then it is offered and its gaps fall back to English (`F3-27`, `F3-05`).
- Given a language in a script the product does not yet bundle, when it is added, then a matching face is bundled at every sanctioned weight and no component or token is changed (`F3-28`).

---
### T-FPLAT-010 · STRUCK 2026-08-07 — the offline vocabulary and the capability boundary registry
**Type:** — · **Tier:** —
**Status:** struck
**PRD rows:** none — every row this task carried was deleted 2026-08-07.

**Struck in place by owner decision 2026-08-07**, which removed the offline/sync capability from the product and replaced `docs/prd/foundations/F4-offline-and-sync.md` with `docs/prd/foundations/F4-data-integrity.md`. Everything this task built was the boundary itself — the closed three-term vocabulary, the one-boundary-both-platforms parity rule, the time-not-scope commitment, the ruled offline-capable and online-only sets and their per-capability tables, the design-editing carve-out, the queued proposal-draft rule, and the boundary-governance row with its ruling that attendance and geofence events never joined the offline-capable set. With no connectivity boundary there is nothing to name, classify, police or move by ruling, and `docs/prd/foundations/F4-data-integrity.md` §5 makes losing the connection an ordinary network error. Nothing is built here. **The task id is struck in place and not renumbered**, so `T-FPLAT-011` onward keep their numbers and every existing citation still resolves.

**Where the surviving obligations went — no citation was dropped:**

- **The stale-save rule** — a save that fails the server's version check rolls back the optimistically applied state and prompts a reload, never merged, never silently kept — is `F4-15`'s ("Design — single editor plus a server version check. No merge, ever") and, module-side, `M05-09`'s. Its acceptance now sits in **`T-FPLAT-012`**.
- **No device ever prints a customer-facing price computed locally** is `F4-04`'s ("no device computes, assigns or finalises a money figure or a business identifier for any market"), restated module-side at `M06-41`. Its acceptance now sits in **`T-FPLAT-011`**.
- **The honest immediate refusal** the online-only set stated — never queued, never an optimistic result, never a silent no-op — is live and verbatim at `F8-36`, built by **`T-FPLAT-032`** with its own acceptance line.
- **No capability is deferred into a "later" bucket** is live and independent at `OV-43`, dispositioned in `docs/tasks/F-core.md`.

---
### T-FPLAT-011 · A submission applied twice never makes a second record — idempotent apply
**Type:** engine · **Tier:** P0
**Status:** shipped (#159)
**Why:** A request whose answer is lost is sent again — a dropped connection, a killed app, a second tap after an error. Before this task the server applied it again: `POST /settings/tranche-templates` twice wrote two templates, and `POST /tenants` twice wrote two companies for one owner. A repeated revoke, archive, decline or deactivate answered an error for an act that had succeeded. `F4-07` says none of this may happen, from the first release.
**PRD rows:** F4-07 (P0)
**Design:** none — an engine task with no screen. A retried act reads on every screen exactly like the first.
**Depends on:** none — every table and route it changes is on `main`: `tenant`, `invitation`, `tranche_template` and their three create routes.

**DONE WHEN:**

- Given the same submission delivered twice, when the server applies it, then exactly one record exists and the second delivery returns the first outcome (`F4-07`). → proof: `apps/api/tests/{settings,tenant,invitations}/retried-*.test.ts`, each create sent twice with one key
- Given a POST sent twice with the same key, when the second arrives, then no second row exists and it answers `201` with the same record — `POST /tenants`, `POST /invitations`, `POST /settings/tranche-templates` (`F4-07`) → proof: the same three files
- Given the same key with a different body or from a different person, when it arrives, then it is refused with `IDEMPOTENCY_KEY_REUSED` and nothing is written (`F4-07`) → proof: the same three files and `tranche-templates.test.ts`
- Given a POST with no key, when it arrives, then it is applied as before (`CLAUDE.md` §8) → proof: `retried-create.test.ts`
- Given a revoke, archive, decline or deactivate repeated on a record already in that state, when it arrives, then it answers success with the record and writes no second audit entry (`F4-07`) → proof: `retried-send.test.ts`, `retried-create.test.ts`, `lifecycle.test.ts`, `role-administration.test.ts`
- Given `packages/data`, when a create's answer is lost and the same input is sent again, then both sends carry the same key and one record exists; a changed input or a success starts a new key (`F4-07`) → proof: the data-layer run driven against the running api through a dropping proxy
- Given a contract route that answers `201`, when it lacks the key header, then the contracts test fails (`M138`) → proof: `create-retry-key.test.ts`, proven red

*(Swept 2026-08-07 for the removal of the offline/sync capability. `F4-02` — "reads are local, always" — and `F4-03` — the durable device write queue — were deleted with `docs/prd/foundations/F4-offline-and-sync.md`; the local-first read engine is a non-goal by name (`docs/prd/foundations/F4-data-integrity.md` §5: "The product does not read from a cache"), and `M04-55` now rules that the photograph queue is the product's one and only device-held queue and "holds photographs and nothing else". The two clauses inside them that had independent life are already live elsewhere and already cited: no spinner walls at `F4-27`, and "nothing a field user captured is ever unrecoverable" at `F4-21`. The task title lost "the local-first core — local reads, the durable write queue" for the same reason. `F4-04`'s and `F4-07`'s texts above were re-pulled verbatim from the live document: `F4-04` lost its trailing "Offline output is always labelled provisional" clause and the `F8-16` citation with it — the general money law is `F8-12`'s, built by `T-FPLAT-028` — and `F4-07` lost "independent of when the offline layer lands". The second acceptance line above is deleted `F4-12`'s surviving headline, repointed to `F4-04` and `M06-41` per the 2026-08-07 audit; `F4-12`'s queued proposal-draft request and its "every figure shown from local data renders provisional" clause died with the queue and the cache.)*

---

### T-FPLAT-070 · The server owns truth and money — no device computes a price or an identifier
**Type:** engine · **Tier:** P0
**Status:** shipped (#190)
**PRD rows:** F4-04 (P0)
**Design:** none — an engine task with no screen.
**Why:** `packages/domain` is shared by the server and both apps, and it holds the money maths. Nothing stops a screen from importing it and printing a price it computed itself — and `packages/ui` already does: `MoneySummary` (`MoneySummary.tsx:39`, `.native.tsx:49`) and `DocumentPreview` (`document-model.ts:96`) sum the payable with `resolvePayable`, and `DataTable.totalRow` (`DataTableTotal.logic.ts:60`) computes the gap with `reconcileMinorUnits`, on the phone. `F4-04` says no device may.

**Depends on:** none — the money maths is on `main`.

**DONE WHEN:**

- **D1** · Given any money figure or business identifier, when it is produced, then it was computed on the server, and no device computed, assigned or finalised it (`F4-04`). → C1, C2; identifiers: `none — no identifier is minted anywhere yet` (Out).
- **D2** · Given any customer-facing artifact — a document, a link, an export or a spoken figure — when it is produced, then no price in it was computed on a device (`F4-04`, `M06-41`). → C3 (`DocumentPreview` prints only figures it is handed), C1.

---

### T-FPLAT-071 · The PRD states roles, never design-system values
**Type:** policy · **Tier:** P0
**Status:** shipped (#191)
**PRD rows:** none claimed — this is `F7-03`'s document half, split from `T-FPLAT-023` by the owner (B); `F7-03` stays claimed there.
**Design:** none — a documents task with no screen.
**Why:** a PRD that restates a size or a colour keeps a second copy of a design-system value, and the two drift the day the design system changes — then a builder follows the stale copy.
**Depends on:** `T-FPLAT-023` (shipped #164) — the tokens the PRD names by role.
**DONE WHEN:**
- **D1** · **Given** a requirement in any PRD in this suite that concerns appearance, **when** a reader looks for the value behind it, **then** the value is found in `design/ds-source/`, and the PRD states only the role or rule (`F7-01`, `F7-03`). → `python3 scripts/gates.py` gate 32 green over `docs/prd/`, every design-system-shaped value gone or on the list with its rule; `recorded` red per C1–C5 (path ruled above)
---
### T-FPLAT-012 · STRUCK 2026-09-04 — the conflict-policy engine
**Type:** — · **Tier:** —
**Status:** struck
**PRD rows:** none — all five moved to the modules that consume them.

**Struck in place by owner decision 2026-09-04.** The concurrency law is real and unchanged; what
was wrong was building it as a block 0 engine before any module existed to use it. Law 9 puts a
rule with the slice that consumes it, so each row moved to its owner and this task carries none.

**Where every row went — no citation was dropped:**

| row | rule | now carried by |
|---|---|---|
| `F4-14` | survey is versioned-append; a revisit never overwrites | `T-M04-015` (`docs/tasks/M04-survey.md`) |
| `F4-15` | design save carries its base version; a mismatch is refused, never merged | `T-MS-367` (`docs/tasks/MS-studio-c.md`) |
| `F4-16` | lead fields are per-field last-writer-wins, with an activity entry per change | `T-M02-012` (`docs/tasks/M02-crm-leads.md`) |
| `F4-17` | a visit's status only moves forward | `T-M04-015` (`docs/tasks/M04-survey.md`) |
| `F4-19` | server apply order decides, never a device clock | `T-M02-012` (`docs/tasks/M02-crm-leads.md`) |

Each receiving task quotes its row verbatim and closes it with its own acceptance line. The
read-state line this task used to carry belongs to `T-FPLAT-017` (`F6-07`) and was already there.

---
### T-FPLAT-013 · STRUCK 2026-09-04 — nothing captured is unrecoverable
**Type:** — · **Tier:** —
**Status:** struck
**PRD rows:** none — `F4-21` moved to its module.

**Struck in place by owner decision 2026-09-04.** The guarantee is unchanged; it lands with the
module that captures photographs rather than as a block 0 engine (Law 9).

| row | now carried by |
|---|---|
| `F4-21` — nothing a field user captured is ever unrecoverable | `T-M04-017` (`docs/tasks/M04-survey.md`) |

---

### T-FPLAT-014 · STRUCK 2026-09-04 — the version-kept notice
**Type:** — · **Tier:** —
**Status:** struck
**PRD rows:** none — `F4-25` moved to its module.

**Struck in place by owner decision 2026-09-04.** The notice belongs where the version is created.

| row | now carried by |
|---|---|
| `F4-25` — the version-kept notice | `T-M04-015` (`docs/tasks/M04-survey.md`) |

---

### T-FPLAT-033 · The too-old client — server-declared minimum version and the refusal
**Type:** engine · **Tier:** P0
**Status:** shipped (#185)
**PRD rows:** F4-36 (P0)
**Why:** The product will break API compatibility, and an installer's phone updates weeks late; without a server-declared minimum that phone meets a broken screen or a silent failure mid-job, and raising the bar would need a release of the very app that cannot update.

**Depends on:** none — the transport, the env loader and `createApp` are on `main`.

**DONE WHEN:**
- **D1** · Given a client below the server-declared minimum version, when it calls the API, then the server refuses with a distinguishable version-skew response rather than a generic error (`F4-36`). → `apps/api/tests/common/client-version.test.ts › "the refusal names the required version and both store links"` · Q2
- **D2** · Given that refusal, when the app receives it, then the forced-upgrade screen replaces the requested surface, names the required version and routes to the store (`F4-36`). → moved to `T-SHELL-001` (owner, split at `/start`: the state is not drawn)
- **D3** · Given the minimum supported version is raised, when it is raised, then it takes effect with no client release (`F4-36`). → Q6
- **D4** · Given a supported client, when it calls the API, then no upgrade screen ever appears (`F4-36`). → `apps/api/tests/common/client-version.test.ts › "a supported version is served"` (minimum `1.10`: `1.10` and `1.11` served, `1.9` refused) · Q3 · Q10

---
### T-FPLAT-034 · STRUCK 2026-09-04 — shared-device user switch
**Type:** — · **Tier:** —
**Status:** struck
**PRD rows:** none — `F4-37` moved to its module.

**Struck in place by owner decision 2026-09-04.** The switch happens at sign-in and its screen half
was already `SCR-M01-01`, so the rule sits with the session engine rather than in block 0.

| row | now carried by |
|---|---|
| `F4-37` — a user switch discards held work, after warning | `T-M01-025` (`docs/tasks/M01-onboarding.md`) |

---

### T-FPLAT-015 · STRUCK 2026-09-04 — the device-held photograph queue
**Type:** — · **Tier:** —
**Status:** struck
**PRD rows:** none — both were already carried elsewhere.

**Struck in place by owner decision 2026-09-04.** This task duplicated work its module already
owns: `M04-55` was dispositioned to `T-M04-017` and `F4-21` moved there with it. Nothing was lost
by removing it, and the product keeps one device-held queue, specified once, in survey.

| row | already carried by |
|---|---|
| `M04-55` — capture unconditional, upload deliberate, storage bounded | `T-M04-017` (`docs/tasks/M04-survey.md`) |
| `F4-21` — the carve-out half | `T-M04-017`, with the rest of the row |

---

### T-FPLAT-016 · STRUCK 2026-09-04 — continuity under a billing block
**Type:** — · **Tier:** —
**Status:** struck
**PRD rows:** none — all four were already carried elsewhere.

**Struck in place by owner decision 2026-09-04.** This task restated billing rules its own module
already owns. The never-gated guarantee survives as product law (`CLAUDE.md` §9, "read and export
work regardless of billing state"), which is what `M12-24` and `M12-26` are already marked as.

| row | already carried by |
|---|---|
| `M12-22` — the always-on set is unconditional | `T-M12-009` (`docs/tasks/M12-platform-billing.md`) |
| `M12-24` — the never-gated list is law | LAW |
| `M12-26` — a captured photograph always uploads | LAW |
| `M12-27` — new field capture is never cut off before `halted` | `T-M12-008` (`docs/tasks/M12-platform-billing.md`) |

---

### T-FPLAT-017 · The notification type registry and the record-of-truth model
**Type:** engine · **Tier:** P0
**Status:** shipped (#100)
**Why:** The product cannot tell anyone anything. Nothing exists to say a proposal was opened, a survey is ready or a tranche fell due, and every module from M02 to M12 is written against a notification that has no table, no vocabulary and no inbox. The first module to need one would invent its own — a private surface `F6-01` forbids by name — and the second would invent a different one. Push makes it worse rather than better: a notification that lives only in a push is lost the moment the push is, so the RECORD has to exist first and push has to be the best-effort half (`F6-06`). This task authors the registry every later module registers into, and the one row that is the truth.
**PRD rows:** F6-01, F6-02, F6-05, F6-06, F6-07, F6-08, F6-09
**Design:** none — an engine task with no screen. The notification CENTRE is `SHELL`'s, and the bounded horizon over these rows is `T-FPLAT-019`; neither is designed, so nothing here renders. The inbox read and the badge count are the routes those screens will call.

**Depends on:** `T-FPLAT-001` (shipped, #42 — the presets the recipient rules name) · `T-FPLAT-002` (shipped, #43 — the resolution `T-FPLAT-018` will drive) · `T-FPLAT-004` (shipped, #45 — the tenant-scoped pattern and the polymorphic pointer) · `T-FPLAT-005` (shipped, #46 — the language set `language` records) · `T-FPLAT-059` (shipped, #95 — that pointer under its own name).

**DONE WHEN:**

- Given any notification, when it is written, then it carries a subject that resolves and the registry names the act its type offers (F6-02). → proof: unit `apps/api/tests/notifications/notification.test.ts`, against a migrated database — a write with a null `subject_ref` is refused by the column, and a write naming a `type` outside the vocabulary is refused by the pgEnum (seen red on a table whose subject columns are nullable); the TAP itself is the notification centre's, which no task in this slice builds, and the act each type offers is registered by the module that raises it (Law 9), so neither is claimed here
- Given every notification type in the product, when traced, then its registration names its raising module, its recipients, its channels and its urgency (F6-05). → proof: gate `NOTIFICATION_REGISTRY` is typed `Record<NotificationType, NotificationRegistration>`, so a type with no registration and a registration for no type each fail to COMPILE — the mistake is unrepresentable rather than caught (seen red both ways: one key deleted, one unknown key added); `pnpm check:all` builds. Grouping is deliberately not a registry fact, per the ruling above
- Given a dropped push, when the user opens the app, then the inbox contains the record and the badge counted it (F6-06). → proof: unit `apps/api/tests/notifications/notification.test.ts` — a record written with `push_sent_at` null reads back from `GET /notifications` and is counted by `GET /notifications/unread-count` (seen red on a read filtered by the push marker); qa-api — the same two routes over `curl`, the record present and the count matching, and an unauthenticated read 401 `UNAUTHENTICATED`
- Given a language switch, when the inbox renders, then old items keep their emit-time language and new items use the new language (F6-08). → proof: unit `apps/api/tests/notifications/notification.test.ts` — a record written in `en` reads back with its stored `title`, `body` and `language` after the recipient's language is changed to `hi` (seen red on a read that re-renders from the type rather than returning the stored strings)
- Given a record already read, when it is marked read again, then nothing changes and nothing un-reads (F6-07). → proof: unit `apps/api/tests/notifications/notification.test.ts` — the second `POST /notifications/{id}/read` leaves `read_at` at its first value (seen red on a writer with no `where read_at is null`); invariant `tenancy-rls` — the catalog holds no UPDATE privilege on any column but `read_at`, over every RLS-subject role, so no other column can be changed and `read_at` cannot be nulled by any path the application has (seen red on a table-wide UPDATE grant)
- Given migration 0008, when the tenancy invariants run, then a notification is written under the tenant's own pin and refused under another tenant's. → proof: invariant `tenancy-rls` — the own-tenant INSERT accepted as `app_user` and the cross-tenant one refused by WITH CHECK (seen red on a refusal aimed at its own tenant); invariant `enum-parity` (`M17`) — `notification_type` equals its contract tuple (seen red on a value added to the tuple alone); invariant `schema-parity` (`M18`); the migration applies fresh and skips cleanly when already applied
- Given the inbox and the badge, when the tenant is in any billing state, then both answer (F6-09). → proof: gate the three routes declare `member` access in the route map, which `M15` types against the router so a route with no entry fails to compile; no entitlement or billing check exists on this path, and none is added — `F6-01` and `F6-09` carry no dedicated Given/When/Then lines in the PRD's acceptance block, so their requirement texts are the binding criteria and this is the one that can be shown in the tree

---
### T-FPLAT-018 · Quiet hours, per-user mutes, and the channels a notification may use
**Type:** engine · **Tier:** P0
**Status:** shipped (#106)
**Why:** A notification has nowhere to be held and no way to be declined. `T-FPLAT-017` landed the record and the registry; what neither carries is the two things standing between a record and a phone at 2am — the tenant's quiet window and the reader's own mute. Without them the first module that emits will push at whatever hour it fires, and the second will invent a snooze the PRD forbids by name (`F6-15`). The tenant already carries the timezone the window is read in (`tenant.timezone`, `F1-10`), and the registry already carries each type's urgency, so both decisions are computable today and neither waits on a transport: what this task fixes is WHEN a push becomes due and WHETHER it is owed at all, which is the whole of the decision. The sending is `T-FPLAT-067`'s, and a due time is exactly what it will read.
**PRD rows:** F6-11 (P0), F6-14 (P1), F6-15 (P2)
**Design:** none — an engine task with no screen. The preferences surface is `SCR-M01-11` (Profile and Preferences), which draws five groups and is `M01`'s to build; this task authors the five, the mute record and the rule, and that screen composes them.

**Depends on:** `T-FPLAT-017` (shipped, #100 — the registry, the record and the type set this reads) · `T-FPLAT-001` (shipped, #42 — the EPC Owner preset the billing rule names) · `T-FPLAT-004` (shipped, #45 — the tenant-scoped table pattern). The tenant's `timezone` landed with M01's founding. Confirmed ready at this `/start`: nothing it needs is open.

**DONE WHEN:**

- Given a staff notification, when its channels are read, then they are in-app and push and nothing else, and no module can name another (`F6-11`). → proof: unit `packages/domain/tests/notifications/mutes.test.ts` — the channel set is closed by its type, so a third channel is a compile error rather than a test; what IS tested is that a muted group yields `in_app` alone and never an empty channel set, because the record always lands
- Given quiet hours configured, when a standard event fires inside the window, then its push becomes due at the window's end and the in-app record is already there (`F6-14`). → proof: unit `packages/domain/tests/notifications/quiet-hours.test.ts` — `pushDueAt` over the window's edges, both sides of midnight, a window that wraps the day, and the tenant's own timezone rather than the server's; qa-api emits through the route and reads `push_due_at` and `emitted_at` off the row on the wire
- Given an immediate type, when it fires inside the window, then its push is due at once and the window does not hold it (`F6-14`'s closing clause). → proof: unit `quiet-hours.test.ts` — the same window and instant, read once per urgency class, differ
- Given a user who has muted a type-group, when a type in that group fires for them, then the record lands and no push is owed (`F6-15`). → proof: unit `mutes.test.ts`; qa-api mutes through the route and reads the emitted row
- Given a holder of the EPC Owner preset, when a `billing` mute is written or read, then it is refused at write and disregarded at push (`F6-15`). → proof: unit `mutes.test.ts` over both paths; qa-api attempts the write on the wire and reads the refusal's status
- Given a mute row, when it is read across tenants, then it answers nothing (`M12`, `M13`). → proof: invariant `tenancy-rls` over the new table, and qa-api asking for another company's row on the wire

---

### T-FPLAT-066 · The recipients a record names — the matrix cross-check and scope resolution at emit
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** F6-10 (P0), F6-16 (P0)

Moved here at `T-FPLAT-018`'s `/start`. Neither proof can walk yet: `F6-10`'s done-when checks the
matrix against every module's §4 contract, and eleven of the thirteen modules have none in the
tree; `F6-16` resolves `subject_owner` and `subject_assignee`, and the subject kinds that exist
are `user_account`, `tenant_membership`, `invitation` and five tenant settings — not one lead,
design, proposal or tranche, so eight of the nine registered types have no legal subject to own.
The two preset-shaped rules, `epc_owner` and `capability_holders`, resolve against presets and
could be written today; they wait here so that resolution is authored ONCE, against all four
rules, rather than half now and half beside the first record (Law 11).

**Depends on:** `T-MS-117` for the M05 done-when line, recorded in `docs/build-order.md` as a proof that waits on block 7; the block-3 slice that lands the lead record — its subject kind, its owner and its assignee — which that block's task names at its start; `T-FPLAT-017` (shipped, #100) carries the registry and the four recipient rules; `T-FPLAT-002` (shipped, #43) carries the F2 resolution this reads.
**Block:** 3, by owner ruling at its own `/start` — built before `T-M02-011` notifies a lead's new owner, so resolution is written once.

**Requirements (verbatim):**

- **F6-10** (P0) — **The matrix below is the complete v1 event registry** — every notification-worthy event named by a module's §4 contract, with its recipients (persona + scope) and channels. It is the cross-check the suite's modules registered into (M02, M03, M04, M05, M06, M07, M08, M09, M10, M11, M12, M13, F5); an event absent from a module's contract and from this table does not notify. *(Re-pulled verbatim 2026-08-07: `F4` was dropped from the list of registering modules when the offline/sync capability was removed — the deleted document's §4 contract raised the sync and queue events, and `docs/prd/foundations/F4-data-integrity.md` raises none.)*
- **F6-16** (P0) — **Recipients resolve through F2 scope at emit and at open.** A notification targets personas by scope ("the record's owner", "team's manager", "portfolio Operations"), resolved by F2's domains (`F2-12`–`F2-14`, with team membership per `M10-32`); a recipient who has lost the subject's visibility gets the honest landing (F6.2 edge). No notification widens anyone's visibility — the notification never contains more of the record than its recipient may read.

**DONE WHEN:**

- Given every module's §4 contract (M01–M13, F5), when its named events are checked against the matrix, then each appears with recipients and channels, and the matrix contains no event no module raises (F6-10).
- Given any notification, when its content is compared against the recipient's scope, then it discloses nothing beyond what the recipient may read (F6-16).
- Given a recipient who has lost the subject's visibility, when they open the notification, then they get the honest landing rather than the record (F6-16).
- Given the matrix's M05 rows, when they are inspected, then `design_survey_superseded` stands beside `signoff_requested` and `design_returned` with recipient "the design's author (own)" and push marked, sourced to M05-13 (owner ruling 2026-08-04); and given the supersession emitter (`docs/tasks/MS-studio-a.md` T-MS-117), then delivery resolves that author through F2 scope and the record lands with the standard class (F6-10, F6-13, F6-16).

---

### T-FPLAT-067 · The push transport — a device registers, and an immediate push arrives
**Type:** integration · **Tier:** P0
**Status:** shipped (#107)
**Why:** A notification can be decided but not delivered. `T-FPLAT-017` landed the record, `T-FPLAT-018` decided WHEN a push falls due and WHETHER it is owed — and nothing carries it. `F6-13` calls an escalation "pushed at once", which is a transport's verb and the one half of that row still unbuilt. The pieces are already paid for: `apps/mobile` carries `@notifee/react-native` and both `@react-native-firebase` packages, kept at `T-FPLAT-042` because push is `F6-01` scope, and no file imports them yet; the Firebase project `heliogrid-app` registers both apps under `com.heliogrid.app`, with `google-services.json` and `GoogleService-Info.plist` committed. What is missing is ours: a place to keep a device's token, a port to leave through, and the send itself.
**PRD rows:** F6-13 (P0)
**Design:** none — an integration task with no screen. The notification a person sees is drawn by the operating system from the payload this sends; the in-app centre is `SHELL`'s.

**Depends on:** `T-FPLAT-018` (shipped, #106 — `push_due_at`, and the mute this honours) · `T-FPLAT-017` (shipped, #100 — the record and its `push_sent_at`) · `T-FPLAT-001` (shipped, #42). The owner's account decision is MADE: the Firebase project exists, both apps are registered, and the service-account credential is in place. Confirmed ready at this `/start`.

**DONE WHEN:**

- Given a signed-in person on a handset, when the app starts, then its token is registered against that person and a second start replaces rather than duplicates it (`F6-06`). → proof: qa-api registers a token on the wire and reads the row; a second registration of the same token leaves one row; unit over the domain rule that a person's own device list is theirs alone
- Given an immediate type, when it is emitted with its push already due, then the push leaves at once through the port and the record's `push_sent_at` is set (`F6-13`). → proof: unit over the sender with the development adapter, so the whole path is exercised without FCM; qa-api emits and reads `push_sent_at` off the row; and a LIVE Android run — a real token from the emulator, a real send through FCM, the notification on screen
- Given a device token the provider reports invalid, when a push is attempted, then the token is deleted and never retried (`F6` §F6.2). → proof: unit — the development adapter is asked to report a token dead and the row is gone afterwards, with no second attempt; the record still stands, because the inbox loses nothing when a push does
- Given the iOS half, when it is read, then the entitlement, the background mode, the permission request and the token handling are all present. → proof: qa-mobile drives the iOS simulator and reads the notification rendered from an injected payload — it renders, it carries its words, and tapping it lands on the subject; every line this repo owns is exercised and none of Apple's. **What that does NOT prove, said here rather than left to silence:** DELIVERY. A paid Apple Developer membership gates the APNs key Firebase needs, the push capability and provisioning onto a handset, and a simulator can never obtain an APNs token — so the path from this server to an iPhone stays unproven until there is an account and a device

---

### T-FPLAT-019 · The notification centre's data contract — the 30-day horizon, the filters, grouping and mark all read
**Type:** engine · **Tier:** P0
**Status:** shipped (#144)
**Why:** `SCR-SHELL-03` is drawn, and `T-SHELL-003` calls three things no route answers yet: a list bounded by a horizon and filterable by type-group and read state, a key that tells the screen which items group, and mark-all-read. `T-FPLAT-017` landed the inbox, the badge and mark-one-read over the whole table, so a reader sees every row forever and the badge counts items the list will never show. Without this, the centre is an archive that says it is an inbox.
**PRD rows:** F6-19 · F6-07 (quoted and built at `T-FPLAT-017`)
**Design:** none of its own — an engine task. It builds the wire for two of `T-SHELL-003`'s rows, quoted in `docs/tasks/SHELL.md`, which hands that wire to this task: the list-read half of the centre row and the grouping row. It serves `SCR-SHELL-03` (`T-SHELL-003`'s DESIGN link), whose head reads "7 unread · 13 of 46 in the last 30 days" and whose tail reads "The centre keeps the last 30 days."
**Depends on:** `T-FPLAT-017` (shipped, #100 — the record, the inbox, mark-one-read) · `T-FPLAT-018` (shipped, #106 — the type-groups and the urgency class). Confirmed ready at this `/start`.

**DONE WHEN:**

- Given a notification emitted 31 days ago and one emitted 29 days ago, when the reader lists the centre and reads the badge, then only the 29-day item is listed, counted and badged (F6-19). → proof: api HTTP test over a migrated database — red first with the horizon bound removed from the repository
- Given the unread filter and a type-group filter, when the reader lists the centre, then only matching items return and `totalCount` counts the same filter (F6-17). → proof: api HTTP test — red first with each predicate dropped
- Given two standard items of one type on one subject kind on one tenant day, and one immediate item, when they are listed, then the two share a group key and the immediate one has none (F6-12). → proof: domain unit table at the day boundary in the tenant's zone and at each urgency — red first with the urgency check removed; api HTTP test reads the keys off the wire
- Given unread items and one more emitted after `seenThrough`, when the reader marks all read, then every seen unread item is read, the later one stays unread, a second call marks nothing, and no row is deleted (F6-07). → proof: api HTTP test — red first with the `seenThrough` bound removed
- Given a malformed `typeGroups` or `seenThrough`, when it is sent, then the route refuses it as `VALIDATION_FAILED` naming the field. → proof: api HTTP test

*(Swept 2026-08-07 for the removal of the offline/sync capability. `F6-18` — "the centre works offline: cached items read, read-state syncs up-only, new items arrive with sync" — was deleted. Its cached-items and arrive-with-sync clauses die with the cache; its read-state clause is live and verbatim at `F6-07`, and its never-blocking clause is live at `F4-27`, so the citation is repointed rather than excised — a plain excise would have left the centre's read-state contract with no row at all. The airplane-mode acceptance line is deleted, and the task title lost "offline cached reads".)*

---
### T-FPLAT-020 · Global search — scope-enforced results, the alias law, junk leads and plain ranking
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** F6-21, F6-22, F6-23, F6-24, F6-25
**Requirements (verbatim):**

- **F6-21** (P0) — **Search is scoped by role visibility — D20, per domain, no leakage.** A result appears only if the searcher's F2 scopes would let them open it: leads per lead visibility, projects per project visibility, people per people-records scope, campaigns per campaign scope (`F2-12`–`F2-14`). Search never becomes the side door around a scope — the dedupe sheet's minimal-disclosure surface (`M02-08`) is the only sanctioned cross-scope reveal in the product, and it is not this one.
- **F6-22** (P0) — **The search-alias law (R1's single exception):** the queries "quote" and "quotation" return **Proposals** — because that is what users will type — while both words stay banned from identifiers, interface strings and documents. The alias is a query behaviour only; results, labels and the opened records say "Proposal" in every locale.
- **F6-23** (P0) — **Junk leads surface in search only.** A lead marked junk leaves every queue and list but is never deleted; search is the one surface that still finds it (with its junk state plain), and Reopen exists from there for the rare mistake.
- **F6-24** (P0) — **Search is never billing-gated.** In every billing state, search works — it is in the soft-block matrix's always-on set. *(Re-pulled verbatim 2026-08-07: the sweep cut this row's offline half — "Search works offline over synced data"; "Offline, the box searches the device's synced cache with the standard staleness indication (`F4-02`)" — which cited a row that no longer exists. The task title lost "offline reads" with it.)*
- **F6-25** (P1) — **Search finds records, not analytics:** results are records the searcher can open — no computed answers, no cross-record aggregation, no natural-language querying in v1 (§5). Result ranking is plain (exact identifier matches — phone, proposal number — first; then name/city matches); no engagement tuning.

**Depends on:** the lead record — the first `M02` task that authors it, in block 3 (the `M02` tickets do not yet say which one carries the `lead` table; that task names it here at its start) · `T-M02-015` (the junk state `F6-23` searches for). Each later module adds its own search target when its slice begins (Law 9): proposals (`M06`, block 8) for the alias, projects (`M08`), customers and sites, catalog items, people.
**Ruled at `/start`:** **the owner moved this task to block 3, out of block 0.** In block 0 no searchable table exists — today's schema is identity, tenancy, settings, invitations, notifications, audit and the market pack — so every done-when line would run over empty results and prove nothing, and building the engine ahead of its first target is a contract for a need no slice has yet. Recorded in `docs/build-order.md`'s block table; `T-SHELL-002`, the screen that calls it, is recorded there as waiting on it.

**DONE WHEN:**

- Given a searcher with any scope set, when results render for each entity type, then every result is a record their scopes let them open, and none other (F6-21).
- Given the queries "quote" and "quotation", when submitted, then Proposals return and every rendered label says Proposal (F6-22).
- Given a junk lead, when its phone number is searched by a user whose scope contains it, then it returns with its junk state visible; and given any list or queue, then it does not appear there (F6-23).
- Given a halted tenant, when search runs, then results return (F6-24).
- (F6-25 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion)

---
### T-FPLAT-021 · The message-template registry — the closed key list and the composer
**Type:** engine · **Tier:** P0
**Status:** shipped (#147)
**Why:** Every customer message the product composes — the proposal share, the nudge, the reminder, the visit confirmation, the survey promise, the handover, the crew's evening-before note — is one of seven keys, and `F6-26` makes that list exhaustive by owner ruling. Without one closed list, the first module that sends a message invents a private key; without one composer, each flow fills `<date>` its own way and a customer eventually reads a raw placeholder.
**PRD rows:** F6-26, F6-27
**Design:** none — an engine task. The editor that would show templates, `SCR-M01-21`, is V2 (`docs/prd/registers/screens.md`).
**Depends on:** `T-FPLAT-006` (shipped, #104 — `authoredIn`, the labelled missing-language fallback this task reuses, `M132`) · `T-FPLAT-017` (shipped, #100 — the precedent that each item's words are authored by the slice that first raises it).

**DONE WHEN:**

- Given the registry's keys, when they are compared with `F6-26`'s list, then the two sets are identical both ways — a key seeded anywhere is incomplete until `F6-26` names it, because the list is exhaustive (`F6-26`, owner ruling 2026-08-06). → proof: invariant `template-keys-mirror-f6` (`M134`) reads the PRD row; red with `handover` removed from code and with an unnamed `invoice_sent` added
- Given a template and a flow's facts, when it is composed, then every placeholder is resolved or safely omitted — never a raw `<date>`, the gap closed, the omitted names returned (`F6-26`; `M01-55`'s "resolved or safely omitted"). → proof: unit `packages/domain/tests/messaging/templates.test.ts`, 21 cases; red with a second scan over the filled text (which let `<<y>x>` join into a new placeholder), with a typed private-use marker kept, a blank value read as a value, a missing placeholder kept raw, the space before punctuation kept, any angle-bracket text read as a placeholder, an inherited name read as a value, the Devanagari stops dropped, the Windows line end dropped, a word gap closed to nothing, and a line-start gap keeping its space. Five of those cases were added after `break-it-reviewer` found them: `<toString>` threw, `धन्यवाद ।` kept its space, `\r\n` and a tab left stray space, the double-space rule had no guard, and the cleanup rewrote a value's own spacing; the coverage floor then found that closing a gap could join `<<y>x>` into a placeholder a second scan filled
- Given a template with no version in the reader's language, when it is resolved, then the original shows with the language it is in named — never a silent substitution — and the gap is listed for its author (`F6-27`). → proof: `authoredIn` reused, not rewritten (`T-FPLAT-006`, `M132`); unit `packages/domain/tests/format/authored.test.ts`

---
### T-FPLAT-022 · Tenant branding scope and the contrast re-verification engine
**Type:** engine · **Tier:** P0
**Status:** shipped (#151)
**PRD rows:** F7-07
**Why:** A tenant's brand colour must dress the proposal and the customer's page without ever making them unreadable, and must never restyle the operator application. Without one engine, each surface would judge contrast its own way and some would refuse a colour the tenant chose.
**Design:** none — an engine task. The colour field is `SCR-M01-18` (`T-M01-018`); the surfaces it dresses are `F5`'s.
**Depends on:** nothing open — built by #66 and #49.

**DONE WHEN:**

- **Given** a tenant has saved a brand colour, **when** the colour would fail contrast, **then** a compliant shade is derived and returned with the save rather than the palette being refused (`F7-07`). → proof: api HTTP test `apps/api/tests/settings/settings-writes.test.ts` ("never refuses a brand colour: the answer rides back with the save, derived, not stored"); the shade walk and both floors, unit `packages/domain/tests/branding/` at the branding slice's 100% floor
- **Given** the operator application, **when** it renders, **then** it carries no tenant branding (`F7-07`). → proof: held by review (`F5-81`); at this `/start` no file under `apps/web/src` or `apps/mobile/src` reads the brand colour, `CustomerSurface` or a `--tenant-*` token
- The render half — a proposal document and a customer-link page carrying the branding — is a done-when line of `T-F5-012` and `T-F5-001` (block 8), which build those surfaces (`F7-07`).
---
### T-FPLAT-023 · The design-system adherence build gate
**Type:** engine · **Tier:** P0
**Status:** shipped (#164)
**PRD rows:** F7-03 (P0), F7-26 (P0)
**Why:** an installer's crew reads every screen in sunlight on a phone; a colour or size typed into a screen drifts from the design system, and an unlabelled icon button is silent to a screen reader — each ships green today unless a build step refuses it.

**Depends on:** none (owner named this task) — the token files (`packages/theme/src/_generated/tokens/`) and `packages/ui`'s `IconButton` are on `main`.

**DONE WHEN:**

- **D2** · **Given** any screen in the product, **when** its rendered styles are inspected, **then** no raw colour literal and no off-scale dimension is present (`F7-03`) → proof: gate M40 + gate M143 + qa-web Q2
- **D3** · **Given** an icon-only control, **when** the build runs, **then** a missing accessible label fails the build rather than warning (`F7-26`) → proof: gate M144
- **D4** · **Given** the shipped product, **when** its surfaces and settings are inspected, **then** no dark value-set ships, no per-user theme switch exists and no surface — including the studio canvas and the customer's 3D view — renders a dark variant, while the semantic alias layer remains intact so a dark set could be added later without a redesign (`F7-04`) → proof: gate M145 + qa-web Q1 + qa-mobile Q5 + qa-mobile Q8

---
### T-FPLAT-024 · STRUCK 2026-09-28 — opt-in high-contrast field mode
**Type:** — · **Tier:** —
**Status:** struck
**PRD rows:** none — `F7-16` was struck in place 2026-09-28.
**Risk:** LOW — it deletes one `packages/ui` component that no app, screen or test imports, and edits PRD, task and brief text; no database, API, route or screen changes (`CLAUDE.md` §3).
**Depends on:** nothing.
**Scope:** **In** — the removal below, and, by owner ruling in the same change, the four block-1 rulings the plan owed once block 0 closed: `T-M01-006`, `T-M01-016` and `T-M01-019` hand the proof steps that need later screens to the tasks that build those screens (`T-M02-003`, `T-M06-010`, `T-MS-201`, `T-M06-027`), and `T-SHELL-002` moves to block 3 beside `T-FPLAT-020` · **Out** — the design system's half, which arrives through `ds:pull` (`docs/tasks/deferred.md`) · **Size** — about 19 files.

**Struck in place by owner decision 2026-09-28.** The product has no field mode. V1 ships without it,
field workers manage sunlight without it, and the base colours are being redesigned, so a contrast
mode built on today's colours would be built twice. The change that struck it removed the PRD row
(`F7-16`, struck in place and not renumbered; `F7-15` now names one exception, the file-upload drop
zone), the `FieldModeToggle` component from `packages/ui` with its two export lines, and field mode
from `T-M01-011` and its brief `SCR-M01-11`.

**Left for the colour redesign**, because it arrives through `ds:pull` and is never hand-edited here:
the design system's field-mode and edge tokens, the component styles that read them, the field-mode
parsing in `packages/theme`, and the switch on the drawn `SCR-M01-11`. `docs/tasks/deferred.md` carries it.

**Cases:**
- **C1** · something still imports the deleted component and a build breaks → no import outside its own folder (grep over `apps/`, `packages/`, `tests/`, `scripts/`) → `pnpm check:all`, which builds and typechecks every package
- **C2** · a live row, task or brief still asks for field mode → strike in place with a dated record and remove every live mention → `python3 scripts/gates.py` checks 4 and 15
- **C3** · a design-system contract with no component fails a `ds-contract` check → `pnpm check:all` runs them → none — read in the gate output
- **C4** · a proof step handed to a later task is not proven there, so it is dropped rather than moved → each handed step is read against the receiving ticket's done-when, and the two `T-M06-027` lacked are written there → none — a reviewer's read; `scripts/gates.py` check 30 proves only the placement

**DONE WHEN:**
- **D1** · Given the PRD, the tasks and the briefs, when they are read, then no live row, task or screen state asks for field mode → `python3 scripts/gates.py` checks 4 and 15
- **D3** · Given block 1 open, when the build order is read, then no block-1 task waits on a later block → `python3 scripts/gates.py` check 30
- **D2** · Given `@heliogrid/ui`, when it is built for web and native, then it ships no field-mode component → `pnpm check:all`

---
### T-FPLAT-025 · Role-adaptive shell centre-verb resolution
**Type:** engine · **Tier:** P0
**Status:** shipped (#51)
**Why:** A rep in a customer's living room reaches Add lead under their thumb and a surveyor on a roof reaches Start survey the same way — the arc centre is the product's highest-frequency act, and the shell must know which act that is for the person holding the phone without asking a screen. Without this `T-SHELL-001` has no fact to render: each screen would type its own verb and its own slot set, the centre would one day offer an act the person's presets forbid, and the two-minutes-to-useful-work promise would land on a button that does the wrong thing.
**PRD rows:** F7-22
**Design:** none — an engine task. The surface is `SCR-SHELL-01` (`T-SHELL-001`, `docs/ux/briefs/SCR-SHELL-01-app-shell.md`), whose design decisions this task honours: the verb follows the home in force and the standing destinations belong to the person and do not change with it (decision 6); the fourth destination is Proposals — Home · Leads · Proposals · More, never a fifth slot (decision 5).
**Depends on:** `T-FPLAT-001` (shipped, #42 — `ROLE_PRESETS`, `CAPABILITY_MATRIX` and the visibility cells the law tests read) · `T-FPLAT-002` (shipped, #43 — `can` and `visibilityIn`).

**DONE WHEN:**

- **Given** the mobile application, **when** the shell renders for any persona, **then** the arc centre is the near-black primary action with a fixed glyph and a role-appropriate verb (`F7-22`). → proof: unit `packages/domain/tests/shell/centre-verb.test.ts` — over all twelve presets the verb is Add lead exactly where the preset holds `crm.add_edit_leads`, Start survey where it holds `survey.capture_surveys` without Add lead, and `null` elsewhere, and every named verb's capability is granted to the preset carrying it (seen red on a cell handing Add lead to a Field Technician); unit `packages/domain/tests/shell/standing-destinations.test.ts` — every named set is exactly Home · Leads · Proposals · More, named for the three sales presets only, and no named slot is a list the preset's leads visibility calls `none` (seen red on a Finance set naming Leads); the near-black token, the fixed glyph and the verb on screen are proven at `T-SHELL-001` (qa-mobile)
- Given `packages/domain/src/shell/`, when the unit suite runs with coverage, then it stays at 100%. → proof: gate `M71`

---
### T-FPLAT-026 · The provenance model — weakest-member aggregation and the tiers' translated display
**Type:** engine · **Tier:** P0
**Status:** shipped (#168)
**PRD rows:** F8-04 (P0), F3-12 (P0)
**Why:** a system total built from one guessed reading and forty measured ones must not read `measured`, and a Hindi reader must never see two tiers printed as one word — both are honesty the installer's customer relies on.

**Depends on:** none — written at this `/start` because the ticket carried no line (`M126`). The tier and standing vocabularies are on `main`: `packages/domain/src/format/qualified.ts:30` and `:37`, derived in `packages/contracts/src/common.ts:77` and `:85`; `weakestTier` and any tier copy in `packages/i18n` are not (grep `weakest` over both packages, and `provenance` over `packages/i18n/src`: no match).

**DONE WHEN:**

- **D1** · **Given** a total computed from members of mixed provenance, **when** the total renders, **then** its tier equals the weakest tier among its members (`F8-04`) → proof: unit `packages/domain/tests/format/qualified.test.ts` › "an aggregate carries its weakest member's tier (F8-04)"
- **D2** · **Given** a closed canonical vocabulary, **when** its display strings are enumerated in any language, **then** each member has a distinct display and no two members share one (`F3-12`) → proof: unit `packages/i18n/tests/closed-vocabularies.test.ts` › "every closed vocabulary shows each member in its own words, in every language"

---
### T-FPLAT-072 · The design system's provenance label takes only the four tiers, in i18n's words
**Type:** engine · **Tier:** P0
**Status:** shipped (#192)
**PRD rows:** F8-02 (P0), F8-03 (P0)
**Design:** none — the design system's own component; no screen renders it yet (no `apps/` file names a provenance host: `grep -rn "provenance=\|<Provenance" apps` finds nothing).
**Why:** the design system prints the tier words in English itself and accepts any string as a tier, so a Marathi screen reads *Derived* and any screen can invent a fifth tier (`F8-03`). After this, a label shows only the four tiers, in the words the reader's language gives.
**Depends on:** `T-FPLAT-026` (shipped #168 — `tierLabel`, `standingLabel`).

**DONE WHEN:**
- **D1** · Given any screen, document, export or spoken output in the product, when its provenance values are enumerated, then the set is a subset of `{measured, derived, estimated, assumed}` and no other tier value exists anywhere (`F8-02`, `F8-03`). → `recorded D1.2` — `tsc` over a probe outside the tree refuses a free-word tier, a tier object, a chart tier `'Published'`, a ready node in a host slot and `withLabel`, and accepts the four and `unmarked`
- **D2** · Given the label, when it renders a tier and a standing, then it prints the words its consumer gave and none of its own (`F3-12`, the `UI.md` row "a tier word cannot be localised"). → `recorded D2.2` — a server render: outside the provider it throws naming `ProvenanceWordsProvider`; inside one built from `tierLabel` / `standingLabel` in Hindi it prints the Hindi words, and a chart's line and a `VersionDiff` tier-only row do too; a table column's tier is compared by identity
---
### T-FPLAT-073 · The provenance label prints a figure's source and freshness, and `Disclosure` prints i18n's lines
**Type:** engine · **Tier:** P0
**Status:** shipped (#193)
**PRD rows:** none claimed — the rows are claimed by `T-FPLAT-027` to `T-FPLAT-030` and the `F8` Laws below; this task carries their owed lines on the design system's half.
**Design:** none — the design system's own components; no screen renders a provenance label or a disclosure yet (`grep -rn "<Provenance\|<Disclosure\|provenance=" apps --include='*.tsx'` finds nothing).
**Why:** `Disclosure` prints English of its own that is not the PRD's verbatim text (`F8-20`, `F8-22`, `F8-28`), and the label cannot print an energy figure's source or a stale figure's state in the reader's language, so a stale or fallback figure reads as current and final. After this, both print only the words `@heliogrid/i18n` gives.
**Depends on:** `T-FPLAT-072` (shipped #192 — the words context), `T-FPLAT-027` (#169), `T-FPLAT-028` (#170), `T-FPLAT-029` (#174), `T-FPLAT-030` (#182).
**DONE WHEN:**
- **D1** · Given `Disclosure`'s `indicative-basis` and `remote-survey` kinds, when they render, then they print `@heliogrid/i18n`'s `BASIS_LINE_WORD` — in English, `F8-20`'s and `F8-22`'s verbatim text — never English of the component's own (`F8-20`, `F8-22`, owed by `T-FPLAT-029`). → `packages/i18n/tests/disclosure.test.ts` › "prints each ruled line in English as its row gives it, and translated in Hindi and Marathi" + `recorded D1.3` — a server render: outside the provider it throws naming `DisclosureWordsProvider`; inside one built from `disclosureLead` / `disclosureLine` it prints the PRD's English in document order, none of the old English, and the Hindi line
- **D2** · Given `Disclosure`'s `structure` kind, when it renders, then it prints `@heliogrid/i18n`'s `STRUCTURE_DISCLAIMER` (`F8-28`, owed by `T-FPLAT-030`). → the same test + `recorded D1.3`
- **D3** · Given a figure whose `Freshness` is not current, when its label renders, then the state — and, when stale, what moved (`moved`, `movedPackKeys`) — prints beside its tier in `i18n`'s words, EN/HI/MR, never only a colour and never hover-only (`F8-18`, `F8-07`, owed by `T-FPLAT-028`). → `packages/i18n/tests/freshness.test.ts` › "names every warning state, and what moved in pinned-input order" + `recorded D3.3` — a server render by `.git/heliogrid-harness/T-FPLAT-073/probe/render.tsx`, kept outside the tree, prints a stale label in English and Marathi, `Not checked` and `Recalculating` beside the tier, none for a current figure, and a chart's line prints the same
- **D4** · Given an energy figure, when its label renders, then its source prints through `energySourceLabel` beside its tier, and a `DataTable`'s one table-level statement never stands in for a column of another source (`F8-08`, `F8-09`, owed by `T-FPLAT-027`). → `recorded D4.3` — a server render by `.git/heliogrid-harness/T-FPLAT-073/probe/render.tsx`, kept outside the tree, prints `Real · PVGIS (SARAH3)` beside the tier, a chart's line prints its source; in a table, a column sharing the table's tier with another energy source, and a stale one, keep their own label while a tier-only column folds into the table's. `scripts/break-and-run.sh` ran each half of the table's rule broken, and an unchecked figure printing nothing (D3), red 3 of 3 by name; those runs are evidence only, withdrawn from the record, because a probe outside the tree reads as changed to git's pre-commit (`docs/tasks/deferred.md`)

---

### T-FPLAT-074 · The provenance label prints a projection, and the design system's renderer closes
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** none claimed — `F8-23` is `T-FPLAT-029`'s, `F8-03` `T-FPLAT-072`'s; this task carries their owed lines on the design system's half.
**Split from `T-FPLAT-073` at its `/start` (owner pick):** the projection's words are the drawn document's (`SCR-M06-17`), `PENDING` when `T-FPLAT-073` started, so this waits in block 8, where that screen is drawn. The drawing is checked first, before the build.
**Owed by `T-FPLAT-029` (`F8-23`):** the label prints a figure's `projection` — the word that calls it a projection and each assumption `statedAssumptions(projection)` from `@heliogrid/domain` lists, in that order and never its own, money through the money formatter, EN/HI/MR, the words taken from the drawn document (`SCR-M06-17`) — beside the tier, never hover-only (`F8-07`). The label's `projection` prop, a free string today, takes `ProjectionAssumptions`. Proven by a label render that prints a projection's word and its horizon.
**Owed by `T-FPLAT-072` and `T-FPLAT-073` (the design system's half):** in the design system artifact, `components/data/Provenance.d.ts` declares the port's `energySource`, `freshness` and typed `projection`, and `Provenance.jsx` renders the tier closed to the four and `unmarked` and no `withLabel={false}`; `components/feedback/Disclosure` stops owning its English and `DISCLOSURE_TEXT` — its words are `i18n`'s, as the port's are since `T-FPLAT-073`; both contracts are re-pulled verbatim. The boards drawn on free words (`SCR-M01-15`, `SCR-M01-16`, `SCR-M01-17`, `SCR-M12-02`, `SCR-M12-04`, `SCR-SHELL-06`) are redrawn through the Design track to print them as `source`. The indicative lead clause ("Indicative — Indicative proposal. …") says one word twice; the drawn document decides the lead.
**Depends on:** T-FPLAT-073
The rest of the ticket is written at the task's start.
---

### T-FPLAT-075 · Open page — a white page, and every field a grey well
**Type:** engine · **Tier:** P0
**Status:** shipped (#200)
**Why:** A rep typing a customer's number outdoors cannot see where the field is: every field is white, and on a white card or sheet it vanishes (`SCR-M01-05` draws exactly that). The owner chose the "Open page" layout: a white page, every field a grey well on it, one surface deep, the camera cut-out kept clear. Without it every screen still to be built inherits the missing field, and ten fields keep ten copies of their box that already disagree on the focus ring.
**PRD rows:** F7-15 (P0), F7-24 (P0), F7-49 (P0, new), F7-50 (P0, new)
**Design:** no export yet — the owner's Claude Design update waits on the plan's weekly limit. The reference is the owner-picked mockup "A · Open page" (this task's `/start`, 2026-09-29); every value below is an existing theme token, so the export, when it lands, is measured against this ticket, and a gap is fixed then. The mockup's field radius is 16; the token is 14 (`--r-input-expressive`) — a known gap, not a fault.

**Depends on:** nothing unshipped — the door screens `T-M01-001`, `T-M01-002` are shipped.

**PRD rows (verbatim, as this task writes them):**
- **F7-15** (P0) — **There are no structural borders: hierarchy comes from luminance and soft shadow.** Surfaces separate because they differ in luminance from what is behind them and, where they float, carry a soft, wide, low-opacity shadow — not because a line has been drawn around them. The source states the governing rule as *"Hierarchy comes from luminance and softness, never from lines."* Exactly **one** exception exists: the dashed drop zone of a file upload. **A control is made findable by luminance, never by outlining it (owner ruling 2026-09-29, reversing the 2026-08-28 raised-control ruling).** A field is a **well**: it takes `--canvas-sunken` and sits on a `--surface` page or sheet, so it reads darker than what holds it. A white field on a white surface has no luminance left to spend, and that is the case the ruling exists to prevent. The focus ring (`F7-24`) is not a structural border. **A control that is not a field is the opposite of what holds it:** on the page or in a sheet it takes the well's ground; inside a tile (`F7-49`) it takes `--surface`; an action is told from a field by its shape — a pill, never the field's rectangle. **Text inside a well is `--text-secondary` or stronger**: `--text-tertiary` on the well is 4.48:1, under the text floor, so a placeholder steps up. **The cost is on the record, measured:** `--canvas-sunken` against `--surface` is **1.14:1**, below WCAG's 3:1 floor for information that identifies a control; the owner chose the well with that number in hand. Depth is blur and desaturation, never dimming.
- **F7-24** (P0) — **Focus is always visible, and it is never removed.** Every interactive element shows the system's focus ring at the system's offset whenever it is focused, on both platforms and for every input method. Inputs are borderless wells (`F7-15`). Focus is the system ring outside the well on the web; on the phone it is the accent ring on the well's own edge, with no gap, because a ring outside would widen a row of code cells past a 375px screen (owner ruling 2026-09-29). An input in error carries an inset danger ring, and one in error and focused carries both. No surface, no density mode and no third-party component suppresses the ring.
- **F7-49** (P0) — **A surface never holds another surface: a section is a heading on the page, and only the items in it are surfaces.** The page is `--surface`. A list item is one tile — `--canvas-sunken`, no shadow — and a group of tiles is a heading and the tiles, never a box around them. A tile holds one record and never a field; fields sit on the page or in a sheet. The parts of one tile, and the sections of a form, are separated by space, never by a line (`F7-15`). *(Owner ruling 2026-09-29, "Open page".)*
- **F7-50** (P0) — **Every mobile screen keeps its content out of the device's safe areas.** No text, control or image is drawn under the camera cut-out or the status bar, and nothing interactive sits in the home-indicator band; the shell's navigation and any sticky action sit above it. The page's ground — and a screen's designed background, like the door's bloom — runs behind them edge to edge, as the platforms' own guidance asks. The insets are the device's, read at run time, never a fixed number. *(Owner ruling 2026-09-29; "content, not ground" ruled at `T-FPLAT-075`'s `/verify`, the reading the platforms' guidance takes.)*

**DONE WHEN:**
- **D1** · **Given** any screen, **when** its structure is inspected, **then** no structural border is present except a file-upload drop zone (`F7-15`). → Q1, Q3, Q4 · `break-it-reviewer` over the diff
- **D2** · **Given** a field on a page or in a sheet, **when** it renders, **then** it is a well darker than what holds it, never white on white and never outlined, and its text reads at `--text-secondary` or stronger (`F7-15`). → Q1, Q2, Q3, Q8
- **D3** · **Given** any focused field, **when** it is focused, **then** the system's ring shows — outside the well on the web, on its edge on the phone — and an input in error carries an inset danger ring, both at once when both hold (`F7-24`). → Q2, Q5
- **D4** · **Given** any screen, **when** its surfaces are inspected, **then** no surface holds another, a tile holds one record and never a field, and parts are separated by space, not lines (`F7-49`). → Q4 for the door; every later screen is held to it by `design-reviewer`
- **D5** · **Given** a phone with a camera cut-out, **when** any screen renders, **then** no text, control or image is drawn under the cut-out or the status bar, the page's ground runs behind them, and nothing interactive sits in the home-indicator band (`F7-50`). → Q1 for the door (`apps/mobile/src/screens/shared/InsetDoorFrame.tsx:12-14`); the shell at `T-SHELL-001`

---

### T-FPLAT-076 · Open page — the ground, the tile, and every control the opposite of what holds it
**Type:** engine · **Tier:** P0
**Status:** shipped (#201)
**Why:** After `T-FPLAT-075` the page is white and only the controls on shipped screens moved. Every other control still paints a raised white control that vanishes on the page, no tile exists to hold a record, and a control has no way to know it sits in one. Without it the next screens that use a checkbox, a chip, a switch or a card draw them invisible — and the signup's desktop step list already draws its step markers white on the white page, found only by a grey ring.
**PRD rows:** F7-15 (P0), F7-49 (P0) — written by `T-FPLAT-075`.
**Design:** no export yet. The reference is the owner-picked mockup "A · Open page" and its catalog redraw (`T-FPLAT-075`'s `/start`): a grey tile on the white page; white chips and white secondary pills inside a tile; grey round icon buttons and grey chips on the page; the segmented control a grey track with a white indicator. Every value below is an existing token, so the export, when it lands, is measured against this ticket.

**Depends on:** T-FPLAT-075 (shipped, #200)

**DONE WHEN:**
- **D1** · **Given** a control that is not a field, **when** it renders on the page or in a sheet, **then** it takes the well's ground, and inside a tile it takes `--surface` (`F7-15`). → Q1, Q3, Q4, Q5
- **D2** · **Given** any screen, **when** its surfaces are inspected, **then** no surface holds another, a list item is one tile with no shadow, a tile holds one record and never a field, and its parts are separated by space, never by a line (`F7-49`). → Q3 for `Card` and `Kanban`'s column; the other containers at `T-FPLAT-077`; every later screen is held to it by `design-reviewer`
- **D3** · **Given** any screen, **when** its structure is inspected, **then** no structural border is present except a file-upload drop zone (`F7-15`). → Q2 (the markers' inset ring) · `break-it-reviewer` over the diff

---

### T-FPLAT-077 · Open page — every control part inside a component reads the ground, every Try again is the shared `Button`
**Type:** engine · **Tier:** P0
**Status:** shipped (#202)
**Why:** After `T-FPLAT-076` the stand-alone controls and `Card` follow the page, but about thirty components still paint their own white parts — about twenty hand-drawn Try again pills with their words typed in, the other action pills, cut-out rings, `ListRow`'s hover — and each vanishes on the white page. They vanish because each names the raw white (`--surface`, `theme.colors.surface`) instead of reading `Ground`, so the rule change in `T-FPLAT-076` could not reach them. Nothing stops the next component, or the next screen, doing the same.
**PRD rows:** F7-15 (P0), F7-49 (P0)
**Design:** as `T-FPLAT-076`.

**Depends on:** T-FPLAT-076 (shipped, #201)

**DONE WHEN:**
- **D1** · **Given** a control that is not a field, **when** it renders on the page or in a sheet, **then** it takes the well's ground, and inside a tile it takes `--surface` (`F7-15`). → Q1, Q2, Q3, Q5
- **D2** · **Given** any screen, **when** its structure is inspected, **then** no structural border is present except a file-upload drop zone (`F7-15`). → Q2, Q3 · `break-it-reviewer` over the diff
- **D3** · the raw white is named in `packages/ui/src` and the apps only by a file on check 20's list → `recorded M150` — `scripts/check-adherence.sh` check 20
- **D4** · **Given** a control on a tint — a banner, a panel's warning, error or information wash, a selected column — **when** it renders, **then** it takes `--surface`, as inside a tile (`F7-15`). → Q3, Q5
- `F7-49`'s containers → `T-FPLAT-078`

---
### T-FPLAT-079 · The regression suite — every shipped web route and phone screen keeps a flow that runs on every change
**Type:** engine · **Tier:** P0
**Status:** shipped (#204)
**Why:** No end-to-end test exists (no Playwright, Maestro or Detox anywhere; CI runs none), so a change that breaks a shipped screen is caught only if a QA agent happens to drive it again, at a price in tokens, or by a person. `F7-43` item 12 (no orphan screens), item 1 (no horizontal scroll at both viewports) and `F3-18` (rendered in a non-Latin launch language) are checked today by eye, once, and never again after the screen ships.
**PRD rows:** F7-43 (P0), F3-18 (P0)
**Design:** none — no screen.

**Depends on:** T-FPLAT-077 (shipped, #202 — the `RetryButton`, `Card` and `Block` the component tests mount)

**DONE WHEN:**
- **D1** · **Given** any screen proposed as complete, **when** it is checked against the twelve items, **then** all twelve pass, and a single failure means the screen is not done (`F7-43`). → this task makes items 1 (no horizontal scroll at 375 and 1536) and 12 (wired into its flow) re-checked on every change for the four shipped web routes and three of the four phone screens (`home` held): the web specs and the phone flows above · gate 33 keeps every future screen in the suite; the other ten items stay with review
- **D2** · Given any screen presented as done, when its completion record is inspected, then it has been rendered and checked in a non-Latin launch language (`F3-18`). → `login.spec.ts` (EN → HI → MR on the door); the phone flows render in the device language only — the other screens' non-Latin check stays with review
- **D3** · `pnpm --filter @heliogrid/e2e test:web` and `test:ct` green locally on built servers → `recorded`; `e2e-web` green on the PR → owed on the PR's run
- **D4** · the Maestro flows pass on the iPhone simulator and the Android emulator, one after the other → `recorded` — `tests/e2e/mobile/run.sh`

---
### T-FPLAT-078 · Open page — the containers become tiles or page headings
**Type:** engine · **Tier:** P0
**Status:** shipped (#205)
**Why:** `F7-49` says a surface never holds another: a section is a heading on the page, and only its items are tiles. About eighteen components still draw their own white box with a shadow around other content, so on the white page each is a white box on white.
**PRD rows:** F7-15 (P0), F7-49 (P0)
**Design:** as `T-FPLAT-076`.
**Depends on:** T-FPLAT-077
**DONE WHEN:**
- **D1** · Given any screen, when its surfaces are inspected, then no surface holds another, a list item is one tile with no shadow, a tile holds one record and never a field, and its parts are separated by space, never by a line (`F7-49`) → C1, C2, C4, C6, C7, C12–C15 · Q3
- **D2** · Given a control that is not a field, when it renders on the page or in a sheet, then it takes the well's ground, and inside a tile it takes `--surface` (`F7-15`) → C1, C3, C8
- **D3** · check 20's `owed-T-FPLAT-078` group is empty and its reason gone from the set → C11
- **D4** · `NextAction`'s record card is a tile on both halves: `.hg-record-card` on the tile list, `NextAction.native.tsx`'s `RecordCard` wrapping `ground="tile"` → C9 · Q3
---
### T-FPLAT-080 · QA coverage — probes past the plan, a server error fails the step, Marathi, the drives, the API core and accessibility
**Type:** engine · **Tier:** P0
**Status:** shipped (#206)
**Why:** The QA agents drive only the steps the plan wrote, and pass a step whose screen looks right while the api answered 500. Nothing checks accessibility: `F7-26` says a missing label is a build failure, and no build looks. The edge checklist reads EN and HI though the product speaks three languages, the network dropped and the app killed are "cannot drive" though commands exist for them, and a surface that wrote one verdict line reads `wall: 0 min` (`docs/tasks/deferred.md`, the `wall:` row). In PRs #186, #198, #199 and #201 `/verify` found 0–1 code bugs and the PR review 4–5 each.
**PRD rows:** F7-26 (P0), F8-36 (P0), F3-18 (P0)
**Design:** none — no screen.

**Depends on:** T-FPLAT-079 (shipped, #204 — the suite)

**DONE WHEN:**
- **D1** · **Given** an icon-only control, **when** the build runs, **then** a missing accessible label fails the build rather than warning (`F7-26`). → every shipped web route runs axe in the suite, `e2e-web` on every change (C10); each phone `landing` checks every tappable element's label
- **D2** · Given an action the product cannot complete, when a user attempts it, then it fails at the attempt with a plain-language reason and is never queued, partially applied, or shown as having succeeded (`F8-36`). → PART met: `tests/e2e/web/login.spec.ts` proves the fail-at-once half — offline and aborted, the attempt fails at once, is not shown as sent, and offers *Send it again* (C12). The plain-language reason is NOT met: the door blames the server for the person's own network, and the fix is the `deferred.md` row this task writes (found by `break-it-reviewer`)
- **D3** · Given any screen presented as done, when its completion record is inspected, then it has been rendered and checked in a non-Latin launch language (`F3-18`). → the edge checklist names HI and MR
- **D4** · `pnpm --filter @heliogrid/e2e test:web` green locally against the running dev servers (the suite reuses a server already listening) → `recorded`; `e2e-web` green on the PR, on built servers → owed on the PR's run
- **D5** · `--api-errors` and the `wall:` measure fire on this change → `recorded M151` (C1, C3, C5)

---
### T-FPLAT-081 · Development numbers — a list of numbers with the one fixed code
**Type:** engine · **Tier:** P0
**Status:** shipped
**Why:** QA gives each surface its own account, because two surfaces on one person can end each other's sessions. Only ONE number has the fixed code today (`DEV_OTP_PHONE`), so every other surface signs up a fresh number by tapping and reads its code from the api log, and waits out `M01-04`'s caps. A list of fixed-code numbers lets every surface keep its own account and sign in at once.
**PRD rows:** none — a development facility. `M01-04`'s caps and `M01-05`'s single use still bind every number outside the list.
**Design:** none — no screen.
**Depends on:** none.

### T-FPLAT-027 · Energy source labelling and the fallback chain
**Type:** engine · **Tier:** P0
**Status:** shipped (#169)
**PRD rows:** F8-08 (P0), F8-09 (P0), F8-10 (P0)
**Why:** a yield built from the ±10% fallback that reads like the source of record is the one lie a customer cannot check, and it gets worse on its way to money — a payback from an estimate that prints as final is a price the installer cannot honour.

**Depends on:** `T-FPLAT-026` (shipped, #168 — `weakestTier` at `packages/domain/src/format/qualified.ts:48`, and the `provenance label` group at `packages/i18n/src/copy/closed-vocabularies.ts:21`). Nothing of this task exists on `main`: `pvgis`, `energySource`, `Built-in estimate` and `latitude` over `packages/domain/src` and `packages/i18n/src` match nothing; the only hits in the tree are `packages/ui`'s open `source?: string` docstrings (`Provenance.types.ts:75`, `Charts.types.ts:45`, `:72`), prose beside the tier that the design system's half keeps.

**DONE WHEN:**

- **D1** · **Given** an energy figure from the source of record or from the built-in fallback, **when** its source label is read in English, Hindi or Marathi, **then** it reads "Real · PVGIS ({database})" with the database named unchanged, or "Built-in estimate ±10%" (`F8-08`) → proof: unit `packages/i18n/tests/energy-source.test.ts` › "names the database and the tolerance unchanged in every language (F8-08)"
- **D2** · **Given** a figure computed from inputs of mixed source, **when** its source is taken, **then** it is the fallback whenever any input came from it — never switched silently to the source of record — and it travels on the figure through compacting (`F8-09`) → proof: unit `packages/domain/tests/format/energy-source.test.ts` › "a figure computed from the fallback carries the fallback (F8-10)" + unit `packages/domain/tests/format/qualified.test.ts` › "keeps the energy source however many times it is compacted"
- **D3** · **Given** money computed from a fallback energy figure, **when** it is qualified, **then** it carries the fallback source and reads `provisional`, its tier unchanged (`F8-10`) → proof: unit `packages/domain/tests/format/qualified.test.ts` › "money from the fallback reads provisional (F8-10)"
- **D4** · **Given** the source labels, the tier words and the standing words, **when** they are shown on one label in any language, **then** no source label reads as a tier or a standing word (`F3-12`, `M146`) → proof: unit `packages/i18n/tests/closed-vocabularies.test.ts` › "every closed vocabulary shows each member in its own words, in every language"

---
### T-FPLAT-028 · Money never renders stale — version pinning, comparison-derived staleness, provisional rendering
**Type:** engine · **Tier:** P0
**Status:** shipped (#170)
**PRD rows:** F8-12 (P0), F8-13 (P0), F8-14 (P0), F8-17 (P0)
**Why:** a quote that still prints a final price after the design, the price book, the catalog or the pack moved under it is a price the installer cannot honour, and a surface that simply forgot to check is the same lie.

**Depends on:** `T-FCORE-016` (shipped, #39 — `PackPin` and `stalePinnedKeys` at `packages/domain/src/market/staleness.ts:14` and `:24`) · `T-FPLAT-027` (shipped, #169 — `Qualifier` and `moneyStanding` at `packages/domain/src/format/qualified.ts:61` and `:101`). Nothing of this task exists on `main`: `git grep` for `freshness`, `InputPins`, `PINNED_INPUTS`, `recomput` and `issueBlocked` over `packages/` and `tests/` matches nothing; the only staleness code is the pack half, `stalePinnedKeys`, which this task calls rather than repeats.

**DONE WHEN:**

- **D1** · **Given** a money figure whose pinned inputs no longer match current inputs, **when** any surface renders it, **then** it renders as provisional with a visible label and never as a final price (`F8-12`, `F8-13`) → proof: unit `packages/domain/tests/format/qualified.test.ts` › "money that is not current reads provisional (F8-12)" + unit `packages/domain/tests/format/freshness.test.ts` › "each pinned input stales the output on its own (F8-14)"
- **D2** · **Given** any computed money-bearing output, **when** it is created, **then** it pins the catalog release, price-book version, pack/rules version and engine versions it used (`F8-14`) → proof: unit `packages/domain/tests/format/freshness.test.ts` › "each pinned input stales the output on its own (F8-14)" + unit `packages/domain/tests/format/freshness.test.ts` › "an output that pinned nothing, or was not compared, is never current (F8-14)"
- **D3** · **Given** a recompute in progress, **when** a user attempts to issue or share the affected document, **then** the action is blocked and the outputs render provisional until reconciliation completes (`F8-17`) → proof: unit `packages/domain/tests/format/freshness.test.ts` › "a recompute in flight is recomputing however the pins compare (F8-17)" + unit `packages/domain/tests/format/freshness.test.ts` › "issue is blocked unless the output is current (F8-17)"

---
### T-FPLAT-029 · Document-level disclosure — the basis line, the no-design tier rule, and the projection's assumptions
**Type:** engine · **Tier:** P0
**Status:** shipped (#174)
**PRD rows:** F8-20 (P0), F8-21 (P0), F8-22 (P0), F8-23 (P0)
**Why:** a Path B proposal that prints its heuristic figures with a modelled design's confidence, a remote-survey proposal that reads like a site survey, and a 25-year savings figure that reads like money owed are the three ways an installer's document over-promises — and the customer compares the final bill against it.

**Depends on:** `T-FPLAT-026` (shipped, #168 — `ProvenanceTier` at `packages/domain/src/format/qualified.ts:35`) · `T-FPLAT-027` (shipped, #169) and `T-FPLAT-028` (shipped, #170) — `Qualifier` at `packages/domain/src/format/qualified.ts:62`, whose two required fields this task's third copies. Nothing of this task exists in `packages/domain` or `packages/i18n` on `main`: `git grep -n 'basisLineOf\|BASIS_LINE\|tierFitsBasis\|PROJECTION_ASSUMPTIONS\|Indicative proposal\|Roof measured from satellite'` over both prints nothing. The two lines' only other copy is `packages/ui`'s, with other words (Impact).

**DONE WHEN:**

- **D1** · **Given** a priced document generated without a design, **when** it renders on any surface, **then** the verbatim indicative line of `F8-20` appears in the reading flow of the document, and every figure it carries is tiered `estimated` or `assumed` (`F8-20`, `F8-21`) → proof: unit `packages/domain/tests/format/disclosure.test.ts` › "a document without a design carries the indicative line, whatever survey exists (F8-20)" + unit `packages/domain/tests/format/disclosure.test.ts` › "a document without a design takes only estimated or assumed figures (F8-21)" + unit `packages/i18n/tests/document-basis.test.ts` › "prints both basis lines verbatim in English and translated in Hindi and Marathi"
- **D2** · **Given** a document built on remote-survey data, **when** it renders, **then** the verbatim imagery line of `F8-22` appears and the roof figures are tiered `derived` (`F8-22`) → proof: unit `packages/domain/tests/format/disclosure.test.ts` › "a design on a roof not measured on site carries the imagery line (F8-22)" + unit `packages/i18n/tests/document-basis.test.ts` › "prints both basis lines verbatim in English and translated in Hindi and Marathi"
- **D3** · **Given** a multi-year financial projection, **when** it renders on any surface or in any document, **then** it is labelled a projection, its fixed assumptions are disclosed with it, and it is never presented as an amount owed, earned or promised (`F8-23`) → proof: unit `packages/domain/tests/format/projection.test.ts` › "a projection keeps the standing it claims, and reads provisional when it cannot be final (F8-23)" + unit `packages/domain/tests/format/projection.test.ts` › "keeps the projection and its assumptions however many times it is compacted"

---
### T-FPLAT-030 · Structural adequacy — sign-off pinned to the version reviewed, the customer gate's one answer, the disclaimer's words
**Type:** engine · **Tier:** P0
**Status:** shipped (#182)
**PRD rows:** F8-26 (P0), F8-27 (P0), F8-28 (P0), F8-29 (P0)
**Why:** an engineer's approval that silently carries over a later edit is a rubber stamp on a roof nobody reviewed, and a customer shown an unapproved design reads it as safe. The one rule that decides "is this exact design signed off" is written once, so the studio, the customer link and every document ask it the same way and none can answer "yes" on its own.

**Depends on:** `T-FPLAT-001` (shipped — `studio.approve_designs`, `F2.M05.approve-designs`, at `packages/domain/src/authz/studio.ts:28`) · `T-FPLAT-028` (shipped, #170 — the design fingerprint as a pinned string, `InputPins.design` at `packages/domain/src/format/freshness.ts:37`). Nothing of this task exists on `main`: `git grep -n -i 'signoff\|sign_off\|signOff'` over `packages`, `apps`, `tests` and `scripts` matches only the `signoff_requested` notification type (`packages/domain/src/notifications/types.ts:17`, `registry.ts:69`, `packages/db/migrations/0008_notifications.sql:29`), which this task does not touch; no disclaimer string exists in `packages/i18n`.
**DONE WHEN:**

- **D1** · Given a design requiring structural verification, when it is approved, then the decision is recorded with the approver's identity, the time, and the design version reviewed (`F8-26`, `F8-27`). → `tsc` — `SignOffRecord` requires `decidedBy`, `decidedAt` and `designVersion`; the store is `T-MS-313`'s · C7
- **D2** · Given an approved design, when it is edited, then its approval no longer applies and the design is unapproved until a fresh decision is recorded (`F8-27`). → C1, C8, C11
- **D3** · Given any surface or file carrying structural quantities or a structural model, when it renders or is exported, then the material-estimate-not-structural-check statement travels with it (`F8-28`). → C9 for the statement; the rendering is each surface's own (Out)
- **D4** · Given a design without a recorded sign-off, when any customer-facing surface is requested for it, then nothing is shown to the customer (`F8-29`). → C2, C6, C11 for the answer; the gate is `T-F5-009`'s (Out)

---
### T-FPLAT-031 · The correlation-not-attribution reporting contract
**Type:** engine · **Tier:** P0
**Status:** shipped (#183)
**PRD rows:** F8-30 (P0), F8-31 (P0), F8-32 (P0)
**Why:** an owner who sees "₹18 lakh pipeline the agent touched" and reads it as "the agent earned ₹18 lakh" stops trusting every other number once they find out. The caption that says "sequence, not cause", and the window it names, are written once, so the agent screen, the dashboards and every export print the same words and no screen can type its own window.

**Depends on:** none — the task reads no data, and builds on the format layer already on `main` (`packages/domain/src/format/qualified.ts`) and the catalog runtime (`packages/i18n/src/runtime.ts`). Nothing of this task exists on `main`: `grep -rn -i correlation` over `packages` and `apps` source matches only the request-correlation header (`packages/contracts/src/common.ts:156`), which this task does not touch.
**DONE WHEN:**

- **D1** · Given an impact block reporting the automated agent's influence, when it renders, then the verbatim correlation caption of `F8-30` renders with it, as persistent on-screen content adjacent to the figure (`F8-30`, `F8-31`). → C1, C2 for the caption; the rendering beside the figure is `T-M07-018`'s (Out)
- **D2** · Given any metric relating an action to an outcome, when it renders, then its observation window is stated and no causal claim is made (`F8-32`). → C3, C4 for the window; no causal claim — the caption's words, held by review
- **D3** · Given a projection and an achieved figure on the same surface, when they render, then the projection is never included in the achieved total (`F8-32`). → none — `T-M13-007`'s done-when line 1 (Out)

---
### T-FPLAT-032 · Honest state, usage figures and declared degradation
**Type:** engine · **Tier:** P0
**Status:** shipped (#184)
**PRD rows:** F8-33 (P0), F8-34 (P0), F8-35 (P0), F8-36 (P0)
**Why:** a site engineer on a roof with one bar of signal taps Save and the request dies. Today the app holds only an English developer sentence for that ("The network request failed."), and for a request that timed out it cannot tell the person that the save MAY have landed — so a screen either says nothing true or says "failed" about a write the server kept. The words for "could not reach", "no answer in time" and "an answer we could not read" are written once, in three languages, and every screen finds the words for any failed attempt with one call.

**Depends on:** none — the task reads no data. It builds on the error taxonomy already on `main`: `packages/data/src/errors/errors.ts:46` (`NetworkError`, English developer text, no reason a screen can word), `packages/data/src/transport/transport.ts:143` (which failure becomes which class, unchanged here) and `packages/i18n/src/copy/api-error.ts:82` (`apiErrorMessageId`, server codes only). Nothing of this task is on `main`: `grep -rn "no_connection\|no_answer\|unreadable_answer\|attemptFailureMessageId"` over `packages` and `apps` source matches nothing.

**DONE WHEN:**

- **D1** · Given the tenant-visible usage view, when it renders a metered figure, then that figure equals the rollup used for enforcement and invoicing for the same period, and the period and provenance are labelled with it (`F8-33`). → none — `T-M12-004`'s line of the same words, and `T-M12-010` (Out)
- **D2** · Given a bundle that is 80% consumed, when the tenant opens the usage view before any gate fires, then the screen already says so (`F8-33`). → none — `T-M12-004`'s line of the same words (Out); the 80% is `CAP_WARNING_PERCENT`, on `main`
- **D3** · Given any billing, entitlement or account-state message, when it renders, then it names what has changed, what still works, and no consequence that will not occur (`F8-34`). → none — `T-M12-009`'s line of the same words, `T-M12-011`'s `M12-41` audit line, `SCR-SHELL-06` (Out)
- **D4** · Given a restricting action a tenant can choose, when confirmation is requested, then exactly what will be blocked is shown before the confirmation (`F8-34`). → none — `T-M12-003`'s line of the same words (Out)
- **D5** · Given an automated step whose required capability is unavailable, when the step is reached, then it degrades on its declared path, the record shows what did not happen, and a human is notified (`F8-35`). → none — `T-M07-029`'s line of the same words (Out)
- **D6** · Given an action the product cannot complete, when a user attempts it, then it fails at the attempt with a plain-language reason and is never queued, partially applied, or shown as having succeeded (`F8-36`). → C1–C4, C6, Q1–Q3, Q7, Q8 for the reason when the server gave no answer the client can read; the server's own refusals already have words; showing it on a screen is each screen's (Out)

---
### T-FPLAT-036 · One Temporal identity, read once
**Type:** engine · **Tier:** P0
**Status:** shipped (#67)
**Why:** Every workflow the platform runs is authorised by a signed token and a client certificate, and both the API and the worker must present theirs the same way; when each process reads its own credential its own way, a rotation fixed in one is not fixed in the other, and the failure reads as a permissions problem rather than an expired token — at which point the instinct is to widen permissions.
**PRD rows:** none of its own — it serves every row whose work runs on the worker (the notification deliveries of `F6`, the catalog import of `M01-40`), by making the identity both processes present one thing.
**Depends on:** nothing — ADR-0025 named the two halves of identity; this is where they are read.
**DONE WHEN:**
- Given the API and the worker, when each connects to Temporal, then both read the token and the certificates through one reader in `@heliogrid/env/server` and neither imports a file API of its own. → proof: gate `M116` goes red on an injected credential read in either service · qa-api both processes boot and the worker's log names its queue
- Given a token rotated while both processes run, when the next call and the next poll happen, then neither process needs a restart and neither logs an unauthorised request. → proof: qa-api rotate the token file under a running worker and a running API, then drive a workflow through the API route that starts it and read the worker log for the outcome

---
### T-FPLAT-037 · What the server images run as, and what may enter their build context
**Type:** engine · **Tier:** P0
**Status:** shipped (#68)
**Why:** The two images that carry this product to a machine decide what an intruder inherits and what a developer's laptop hands to a registry; a process running as root turns one broken dependency into a rewritten application, and a credential that reaches any image layer has leaked even if a later stage discards it.
**PRD rows:** none of its own — it serves every row that runs on a server, by making what ships unprivileged and clean.
**Depends on:** nothing.
**DONE WHEN:**
- Given either server image, when its process starts, then it runs as an unprivileged user and cannot write to the application directory. → proof: qa-api build both images and, in each, read `id` and attempt a write under the application directory
- Given a developer's working tree, when an image is built from it, then no credential, design export or downloaded tool reaches the build context. → proof: qa-api list the build stage's own tree in each image and find none of the three

---
### T-FPLAT-038 · The unit-test corpus, declared once
**Type:** engine · **Tier:** P0
**Status:** shipped (#70)
**Why:** Four things decide where a unit test may live — the runner, the write guard, the adherence check and the boundary rule — and while each carried its own copy of the list they could disagree; the runner collected from ANY package, so a test in a layer three guards refuse would run and pass, and a reader could not tell which answer was the rule.
**PRD rows:** none of its own — it serves every row whose proof is a unit test, by making the layers that may hold one a single fact.
**Depends on:** nothing.
**DONE WHEN:**
- Given the runner, the write guard, the adherence check and the boundary rule, when the corpus changes, then all four change with it and none states the list itself. → proof: gate add a package to `unit-test-packages.json` and read all four back, then revert
- Given a test written into a layer outside the corpus, when it is written, then it is refused rather than silently collected. → proof: gate the write guard refuses `packages/db/tests/` and `packages/ui/tests/` while admitting `packages/domain/tests/` and `apps/api/tests/`

---
### T-FPLAT-039 · A gate reports what it actually read
**Type:** engine · **Tier:** P0
**Status:** shipped (#72)
**Why:** A check with nothing to look at reports a pass it never earned: the tree moves, a glob stops matching, and the gate goes quietly green for ever — which is worse than no gate, because the green is believed. Six doc gates could pass on an empty corpus, one advertised a reach it did not have, one scan could not see a comment in a manifest or an image, and no gate at all held what a server image runs as.
**PRD rows:** none of its own — it serves every row whose proof is a gate, by making a pass mean the gate read something.
**Depends on:** nothing. `T-FPLAT-037` made both images unprivileged; this is the gate that keeps them so.
**DONE WHEN:**
- Given a gate whose corpus has gone empty, when the gates run, then it fails naming the corpus rather than passing. → proof: gate empty each of the six corpora in turn and read the refusal back
- Given a server image that does not drop to an unprivileged user, when the adherence check runs, then it fails; and a `USER` in a build stage does not satisfy it. → proof: gate remove the final-stage `USER` and read the failure, then move it into the build stage and read it again
- Given a comment in a manifest or a Dockerfile that carries a date, when the adherence check runs, then it is caught like any other dated comment. → proof: gate the widened scan names the four build notes that carried one

---
### T-FPLAT-040 · No app writes a number that belongs to a layer
**Type:** engine · **Tier:** P0
**Status:** shipped (#74)
**Why:** A number an app writes itself is a number nobody can move: a connection ceiling an operator cannot raise without a deploy, an auth path that three layers must agree on and none owns, a strictness setting the phone copies by hand from a file it could not even reach. Each is fine until the day it has to change, and then it changes in one place and not the others.
**PRD rows:** none of its own — it serves every row that runs on a server or a phone, by putting each number where it can be moved once.
**Depends on:** nothing.
**DONE WHEN:**
- Given an auth route moved out from under the shared prefix, when the contract loads, then it refuses rather than letting the cookie and the transport drift apart. → proof: gate move `/auth/refresh` to `/v2/auth/refresh` and read the refusal, then restore
- Given an operator who must raise the connection ceiling, when they set the environment key, then the pools follow without a deploy of new code. → proof: gate `DB_POOL_MAX` and `DB_ADMIN_POOL_MAX` in the schema and documented in `.env.example`, read by the provider that opens the pools
- Given the phone app, when it typechecks, then it inherits the workspace strictness rather than copying part of it. → proof: gate the effective compiler settings before and after the change, compared flag by flag

---
### T-FPLAT-051 · A failure that says nothing
**Type:** engine · **Tier:** P0
**Status:** shipped (#85)
**Why:** Three places reported success, or reported nothing, while something had actually gone wrong. `check-adherence.sh`'s check 10d captures its scanner's output, so a CRASH yields an empty string and empty is exactly what "no copies found" looks like — the gate printed `adherence OK` with that check never having run. It was hidden because the clean room's git INDEX is the clone's and describes the HISTORY, not the tree the overlay builds: six checks enumerate with `git ls-files --cached` and are handed paths the overlay has just deleted. And `pack:publish` died on a boot error with an empty stdout AND an empty stderr, telling an operator nothing at all. The script already carries this exact lesson in its own words for `SRC_DIRS` — a renamed folder once turned a check into a silent no-op that still printed `adherence OK` — so this is the same trap met a second time in the same file.
**PRD rows:** none of its own — it serves every row every gate stands behind, by making a check that did not run say so.
**Depends on:** nothing.
**DONE WHEN:**
- Given a check whose scanner crashes, when the gate runs, then it FAILS naming the check rather than printing a pass. → proof: gate a tracked file removed from disk — `CHECK 10d DID NOT RUN`, exit 1 and no `adherence OK`; the identical trigger exited 0 with `adherence OK` before
- Given the clean room, when it is asked which files it holds, then the answer describes the room. → proof: gate the room's `git ls-files --cached` probed with a deleted file present — it names the file without the index refresh and not with it
- Given a command that cannot boot, when an operator runs it, then they are told why. → proof: gate `pack:publish` with a provider removed prints `Nest cannot export a provider/module … Symbol(REFERENCE_DB)` through the redacting handler; the same run printed an empty stdout and an empty stderr before

---
### T-FPLAT-061 · The ask — one anchored popover, so a screen carries facts and not lectures
**Type:** engine · **Tier:** P0
**Status:** shipped (#188)
**Why:** Screens across the onboarding and catalog corridors explain themselves in paragraphs — what the importer can read, why a document's name is the product's to set, that two answers did not save — while the facts an act turns on sit in the same weight of type beside them. `F7-46` rules the split: the decision's own words stay on the screen, teaching waits until the person asks. Nothing in the product can carry that ask today. `Tooltip` opens on hover and keyboard focus and states in its own contract that a touch user will never see it; `Disclosure` is the line that must NOT be hidden; `CoachMark` is a first-run tour with a cap of three. So every screen that needed an ask so far answered it by printing the paragraph, which is the clutter the rule exists to remove — and a second screen inventing its own popover is how one product becomes two.
**PRD rows:** F7-46 (P0)
**Design:** none of its own — it is a design-system component every screen composes. The design system's own component is the reference: `components/feedback/Explainer.jsx` inside `HelioGrid-UX/_ds/*/_ds_bundle.js` (behaviour, measures, tokens), typed by `packages/theme/src/_generated/contracts/feedback/Explainer.d.ts.txt` (`T-FPLAT-068`).
**Depends on:** nothing.
**DONE WHEN:**
- **D1** · Given a person on either platform, when they press the information control, then the popover opens anchored to that control, closes on Escape, on an outside tap and on scrolling away, and returns focus to the control. → proof: `none — needs a screen`; the first composing screen's QA (Used by)
- **D2** · Given a popover of two or three pages, when it is read, then it states its position, offers Back and Next at every page, and a swipe never replaces them. → proof: explainer.test.ts › "states its position and offers Back and Next on every page"; the swipe at the first composing screen
- **D3** · Given content that would need a fourth page, when it is authored, then it is refused. → proof: C1
- **D4** · Given a touch surface, when the component renders, then no state of it depends on hover. → proof: C8
- **D5** · Given a fact the rule keeps on the screen — money, what paused, a tier, a disclosure, an error's fix — when a screen is reviewed, then it is not behind the ask (F7-46). → proof: C6, and `/verify`'s prose split per screen
- **D6** · Given the new component folder, when the contract gate runs, then every prop the design system declares is declared in `Explainer.types.ts`. → proof: gate `pnpm ds:contract`, and `pnpm check:all`

---
### T-FPLAT-068 · The design-system mirror carries the ask and the fact row
**Type:** engine · **Tier:** P0
**Status:** shipped (#122)
**Why:** A screen is built against the design system's own typings, and the mirror was two components behind: the billing screens are drawn with the ask and the fact row, and a builder opening the mirror found neither. Without the pull, the contract gate reads a census that no longer matches what the designs use.
**PRD rows:** none of its own — it keeps current the mirror every UI task builds against.
**Design:** none — generated data only; no component and no screen.
**Depends on:** nothing.

**DONE WHEN:**
- Given the four pulled files, when the theme is built, then what it emits is unchanged but for comment text. → proof: gate `pnpm --filter @heliogrid/theme build` — `base.css` and `tokens.css` identical once comments are removed, and no other emitted file differs
- Given the mirror as pulled, when the contract gate runs, then it is green — and with either held-back file pulled it fails on `Banner.actionBelow` and `Banner.onFormChange`. → proof: gate `ds:contract` seen green, and seen RED both ways with a held-back file in place

---
### T-FPLAT-069 · A package's build and typecheck see the packages it imports
**Type:** engine · **Tier:** P0
**Status:** shipped (#155)
**Why:** Seven packages compiled with `tsc -b`, which judges a project up to date from its own files alone, and the workspace keeps no project references (ADR-0001). So a type change in an imported package was invisible to them: `pnpm turbo typecheck` reported every task green over a real error in `packages/data`, and `contracts`' `dist/` kept the old types after `domain` changed — a local false green, met at `T-FPLAT-009`. CI builds a fresh clone and was not affected.
**PRD rows:** none of its own — it keeps every task's local typecheck and build honest.
**Design:** none — build scripts and their guard; no runtime path.
**Depends on:** nothing.

**DONE WHEN:**
- Given a type change in `domain` that breaks `data`, when `pnpm turbo typecheck` runs with no cache cleared, then `data`'s typecheck fails naming the error. → proof: gate `uiLanguageOrSource` retyped to `string`: `data`'s typecheck red at `store.ts(45,5): error TS2322` under `tsc -p` (recorded P2); the same break read green under `tsc -b` at `/start`; restored.
- Given a change in `domain` that `contracts` writes into its declarations, when `pnpm turbo build` runs, then `contracts`' `dist/` carries it. → proof: gate `OTP_CHANNELS` grown by `'xx'`: `dist/auth.d.ts` counts 0 → 6 → 0 across break and restore under `tsc -p` (recorded P3); `tsc -b` left it at 0 at `/start`.
- Given a package script that compiles with `tsc -b` or `tsc --build`, when `check:adherence` runs, then it fails naming the file. → proof: gate `M136`, red on `tsc -b`, `tsc --build`, `tsc  -b` and `"typecheck":"tsc -b"` in `packages/forms/package.json` (recorded P4a–d), `adherence OK` clean (P4e); restored.
- Given the whole tree, when CI's quality run checks it, then every stage is green. → proof: gate the PR's own CI run (`pnpm verify:ci`); `pnpm verify:clean` was stopped by the owner.

---
### T-FPLAT-065 · A proof's precondition has one shape, and the harness fails closed under CI
**Type:** engine · **Tier:** P0
**Status:** shipped (#103)
**Why:** `T-FPLAT-064` shipped the HTTP harness with a precondition that SKIPPED quietly: absent `DEV_OTP_PHONE` / `DEV_OTP_CODE`, both wire suites reported themselves skipped and the lane stayed green. A future edit to `ci.yml` that lost the key would erase eleven wire proofs without a red mark — the "skipped proof reports success" trap the fixture already refuses for the database, and did not extend to the number. Read from the merged run's own log rather than assumed: the suites ran there, so nothing was lost yet, and this is the hole before it is fallen into.
**PRD rows:** none of its own — it protects every wire proof any api task will write.
**Design:** none — test support only; no runtime code.
**Depends on:** `T-FPLAT-064` (shipped, #102 — the harness this hardens).

**DONE WHEN:**
- Given the development number absent under CI, when a wire suite starts, then the run FAILS naming the proof rather than skipping. → proof: unit each suite thrown `NOT RUN under CI` with `DEV_PHONE` forced empty and `CI=true`, its file failed; seen green again restored
- Given the same absence locally, when a wire suite starts, then it skips and says so. → proof: unit `SKIP NOTIFICATION WIRE PROOF …` printed and 10 tests skipped with `DEV_PHONE` forced empty and no `CI`
- Given every proof precondition in `apps/api/tests`, when read, then each is one call of `skipUnless`. → proof: gate `grep -n "skipUnless\|skipWithout" apps/api/tests/support/*.ts apps/api/tests/**/*.test.ts` shows the two wrappers and their callers, and no `console.warn` + `return true` pair outside `skipUnless`

---
### T-FPLAT-064 · The api boots in a test exactly as in production, and CI runs it with RLS on
**Type:** engine · **Tier:** P0
**Status:** shipped (#102)
**Why:** No api test drives HTTP — every one stops at the repository — so the routes were only ever met on the wire by `qa-api`, which cannot write a row and therefore only ever saw an EMPTY inbox at `T-FPLAT-017`. Ordering, paging, a real badge count, a 200 on mark-read and cross-tenant at the route were all proven at the repository and never on the wire, which `/verify` names mandatory. Three roots, each verified: `apps/api/src/config/env.ts` reads `ENV` at import and calls `process.exit(1)`, so importing the app inside a test kills the run wherever a key is absent; `temporal.module.ts` provides the client through an eager factory that dials Temporal at BOOT, so the app cannot start without one; and CI's quality lane runs the tests as the container's superuser with no Temporal and no development number — so RLS is invisible there, which the fixture admits in its own comment, while the `app_runtime` role CI itself creates goes unused.
**PRD rows:** none of its own — it serves every route's proof, and `F2`'s tenancy rows by making CI see RLS at all.
**Design:** none — an engine and CI task with no screen.
**Depends on:** `T-FPLAT-063` (the harness laws this proves under) · `T-FPLAT-017` (shipped, #100 — the first slice whose proof this widens).

**DONE WHEN:**
- Given the api, when a test boots it, then it is the SAME app production runs — request id, CORS, body limits, the filter, the guard, the tenancy precondition. → proof: unit `apps/api/tests/notifications/notification.test.ts` — the JSON body parser registered in `main.ts` alone, not in `createApp()`, kills the whole wire suite at sign-in (seen RED, restored); and `main.ts` holds nothing but `createApp()` and `listen`, which is read rather than gated — `M131`, review-only, until a script is ruled
- Given the notification routes, when driven over HTTP with seeded rows, then ordering, paging, the badge, mark-read and cross-tenant hold on the wire. → proof: unit `apps/api/tests/notifications/notification.test.ts` — three rows read newest-first across `limit=2` pages with no repeat and no gap; `unread-count` reads 3, then 2 after one mark-read; the second mark-read returns the first moment; a second company's session gets `404 NOT_FOUND`; two concurrent mark-reads land ONE `read_at` — each seen red on the guard it proves removed
- Given CI's quality lane, when the tests run, then they run under RLS. → proof: invariant `tenancy-rls` under CI reporting the runtime role is not privileged, and the boot precondition passing in the harness rather than being skipped — seen red on the lane left as superuser
- Given a test that starts no workflow, when the app boots, then no Temporal connection is attempted. → proof: unit the harness boots with `TEMPORAL_ADDRESS` pointing at a closed port and every read route still answers; seen red on the eager factory restored

---
### T-FPLAT-063 · The counts are a signal, and three misses become laws
**Type:** engine · **Tier:** P0
**Status:** shipped (#101)
**Why:** Four things this session showed about the harness itself, each verified. The PR size ceiling (`M111`) nearly withheld a finished, verified, reviewed feature over 24 lines — 509 of them the generated OpenAPI surface — and the owner ruled that a restriction must never force compromising something important: the counts are a signal to ask one-task-or-two, never a gate, and nothing is ever cut to fit one. Then three misses, two of them repeated: a first-match text edit into a 1,500-line task file landed a verify stamp in a shipped ticket 400 lines above its own and, lifted out, left a blank line that turned four unrelated gates red — twice in one session, and the owner's standing rule is that a miss made twice becomes a law; the task's ticket repairs were written on `main` before the branch existed; and a refusal test matched the error MESSAGE — which echoes the query we sent — and would have passed on our own text forever, which no rule in `testing.md` forbade. Beside them one honest gap in `/verify`: it names cross-tenant on the wire mandatory, and the notification run satisfied it with a repository test and said so only faintly.
**PRD rows:** none of its own — it changes how every task is started, tested, verified and shipped.
**Design:** none — instruction files only; the runtime tree is byte-identical to `main`.
**Depends on:** nothing.

**DONE WHEN:**
- Given a finished task past the counts, when `/ship` runs, then the PR body is printed with the number stated and nothing removed. → proof: gate the SIZE paragraphs of `/ship` §3 and `/start` §3 withhold nothing and call no split "not optional" — `/ship` §3's other sentence, that a done-when line without a proof keeps the body unprinted, stands and is not about size; `M111` reads "never a gate"; and `T-FPLAT-017` (#100) shipped whole at 25 files and 1,524 lines under the ruling this records
- Given a text edit into a task file or ledger, when `/ship` reviews it, then every hunk is named for its block and a stray one is a finding. → proof: gate `/ship` §2 carries the landed-where-it-was-meant check, and the landmine row names the trap; this PR's own `docs/tasks/F-platform.md` diff is ONE contiguous insertion sitting between `T-FPLAT-061`'s closing `---` and `T-FPLAT-062`'s heading, holding the two new blocks and nothing else — checked by reading the lines either side rather than by a hunk header, whose numbers change with the context width — and no stray blank line anywhere in the file
- Given a task's first edit, when it is made, then it is on the branch. → proof: gate `/start` §4 reads the branch name before the first edit; this task's branch existed before its first file changed
- Given a new test, when it is trusted, then it has been seen red. → proof: gate `.claude/rules/testing.md` carries the rule under its 85-line budget (40 lines); the instruction hygiene checks pass — no date, no tool name, no unsourced claim
- Given an always-on core step the wire could not prove, when `/verify` reports, then it says so in its own line. → proof: gate `/verify` §3 names the wire as the proof and `inconclusive: no emitter` as the record; §9 requires the line

---
### T-FPLAT-062 · A shipped task cannot vanish, and an id cannot be taken twice
**Type:** engine · **Tier:** P0
**Status:** shipped (#99)
**Why:** `T-FPLAT-059`'s entire ticket was deleted from `main` by its successor's merge — the branch resolved a conflict in `docs/tasks/F-platform.md` correctly, then a `git checkout --theirs .` restored the other side over that resolution, and the clobbered file was staged without being re-read. Every one of the 31 gates stayed green across the merge, because every ledger check is keyed on the block EXISTING: with no block there is no `Status:` to read, no id to dangle, and nothing to disagree with `screens.md`. The loss surfaced only when an unrelated ticket happened to cite the id days later. A ledger that cannot notice one of its own rows disappearing is not a ledger, and the record of WHY a shipped change was made is the half no code carries. Closing that hole exposed a second of the same shape: this task's own first ticket reused `T-FPLAT-061`, an id a parallel session had taken in `#98` minutes earlier, and nothing refused it — an id is the ledger's key and every set and dict in the gate, including the vanished-block check itself, collapses two blocks under one id into one. Both are the same defect: the ledger could not count its own rows.
**PRD rows:** none of its own — it protects every row's task record, which `docs/tasks/README.md` rule 0 makes the one ledger.
**Design:** none — an instruction and gate change with no screen and no runtime code.
**Depends on:** nothing.

**DONE WHEN:**

- Given an id already held by a task block, when a second block takes it, then the documentation gates refuse and name it. → proof: gate `M106` seen RED on a REAL collision, not an injected one — this task's own first ticket reused `T-FPLAT-061`, taken by `#98` minutes earlier, and the check reported `T-FPLAT-061: 2 task blocks share this id — an id is never reused (rule 0)`; green once renumbered to `T-FPLAT-062`
- Given a task block deleted from the tree, when the documentation gates run, then they refuse and name the id. → proof: gate `M106` seen RED by deleting `T-FPLAT-059`'s block again — the exact mistake — which reports `T-FPLAT-059: named by HEAD's history, so it HAD a block — and no task file holds one now`; green with the block restored
- Given the tree as it stands, when the check runs, then every id the history names still has a block. → proof: gate `python3 scripts/gates.py -v` prints `57 ids named by history, every one still held`, and 31 of 31 PASS; and the check is not vacuous in CI — the `quality` job that runs it checks out with `fetch-depth: 0`, so the history it reads there is the whole history and not one commit (a shallow checkout would make this abstain while still printing a pass, which is the shape Law 12 forbids)
- Given `T-FPLAT-059`'s lost record, when it is restored, then it is the shipped ticket and not a rewrite. → proof: gate the block is recovered from `5f75a1d` by `git show`, carrying its own `**Status:** shipped (#95)` and its verified stamp unchanged
- Given the resolution step that caused it, when the next conflict is met, then the trap is written down. → proof: gate `.claude/landmines.md` carries the `checkout --theirs` row with its fix, and Law 8's sweep covers that file

---
### T-FPLAT-060 · The flip rides the change commit, and the PR opens ready
**Type:** engine · **Tier:** P0
**Status:** shipped (#97)
**Why:** Every task has been costing the repository TWO complete CI runs. The change commit is pushed, its run is watched to green, and only then is the ledger flip written as a second commit and pushed — which starts a second run over the same tree, for a one-line edit to a document CI never reads. The draft window exists only to hold the merge shut while that second commit is in flight. Both are consequences of one choice: the flip lands after the PR number is known, so it cannot ride the commit that earns it. The number is readable BEFORE the PR opens — it is the repository's highest issue-or-PR number plus one — so the flip can ride the change commit, the ledger is correct from the moment it is true, and the task pays for one run instead of two. Owner ruling: the second run is wasted time and tokens, and the draft is unnecessary.
**PRD rows:** none of its own — it serves every task that ships, by halving what shipping costs.
**Design:** none — an instruction change with no screen and no runtime code.
**Depends on:** nothing.

**DONE WHEN:**
- Given a task ready to ship, when its change commit is made, then the ledger already reads `shipped (#n)` inside it. → proof: gate this task's own change commit — `git show --stat HEAD` carries `docs/tasks/F-platform.md` and `git log -1 --format=%s` names `T-FPLAT-060`, so the subject `M106` reads and the flip it justifies are the same commit
- Given a claim of `shipped`, when the branch's history does not name the task, then the ledger check refuses it. → proof: gate `M106` seen RED by setting a second task's `Status:` to `shipped (#0)` on this branch, whose subjects never name it; green with only this task flipped
- Given the PR this task opens, when its runs are counted, then there is exactly ONE. → proof: gate `gh run list --branch fix/t-fplat-060-flip-rides-the-change-commit` returns a single run, against the two every earlier task recorded
- Given that PR, when it is created, then it is not a draft and needs no ready-marking. → proof: gate `gh pr view --json isDraft` reads `false` on the PR as created, with no `gh pr ready` call in the session
- Given the instruction files after the change, when the documentation gates run, then no claim, budget or hygiene rule is broken. → proof: gate `python3 scripts/gates.py` — 31 of 31 pass, `M105`/`M106`/`M127` still the only place the procedure is enforced and the skill citing row ids alone

---
### T-FPLAT-059 · The suite's one polymorphic pointer gets its own name
**Type:** engine · **Tier:** P0
**Status:** shipped (#95)
**Why:** `T-FPLAT-004` ruled `subject_kind` + `subject_ref` to be ONE union every record naming a subject reads — the audit entry, then `notification`, then `file` — and then authored it inside the audit slice, where it took that slice's name. `notification` is the second reader and lands next (`T-FPLAT-017`). Left alone it would declare a column typed `audit_subject_kind` in a table that has nothing to do with the audit log, which a reader has to un-learn; and the alternative a reader reaches for instead — a second pgEnum holding the same values — is exactly the drift `M17` exists to catch. The move costs less today than it will with every reader added after it.
**PRD rows:** none of its own — it serves `F2-22` and `F6-02`, the two rows that name the pointer, by making one union stay one union.
**Design:** none — an engine task with no screen.
**Depends on:** nothing — `T-FPLAT-004` (shipped, #45) authored the union this moves.

**DONE WHEN:**
- Given a table that names a subject, when it declares the column's type, then the type is named for the pointer and not for the audit log. → proof: invariant `schema-parity` and `enum-parity` (`M17`) over the live database — the mapped key is `subject_kind` against `subjectKindSchema`, seen red with the map left pointing at `audit_subject_kind`, which is a type no database holds
- Given the union, when anything asks for it, then exactly one list answers. → proof: gate `grep -rn "AUDIT_SUBJECT_KINDS\|AuditSubjectKind\|auditSubjectKind" --include="*.ts"` over `apps/`, `packages/` and `tests/` returns nothing, and `pnpm check:all` builds — a second copy would have to be written to compile
- Given the wire, when the rename lands, then no consumer sees a change. → proof: gate `check:openapi` emits a byte-identical `openapi/openapi.json`
- Given the migration, when it is applied twice, then the second run skips it. → proof: gate `pnpm db:migrate` applies `0007_subject_kind.sql` once and reports `skip … (applied)` on the next run

---
### T-FPLAT-058 · The banned word cannot re-enter the product
**Type:** engine · **Tier:** P0
**Status:** shipped (#187)
**Why:** `F6-22` bans *quote* and *quotation* from identifiers, interface strings and documents in every locale — the search alias is the one exception, and it is a query behaviour only. Nothing in the repository holds that ban: no type, no lint rule, no gate, no `mechanisms.md` row. So the word walked back in unnoticed on both sides of the product — the shipped signup copy tells an owner their company name "goes on every quote and proposal you send", in English and in both generated catalogs, and a shared survey disclosure line opens "This quote is based on a remote survey". Every gate passed on both. A ban the tree cannot enforce is a ban that returns with the next screen, and the word is the product's own vocabulary law: a reader who is told *quote* here and *proposal* on the next screen is being told they are two things.
**PRD rows:** F3-11
**Depends on:** nothing.

**DONE WHEN:**
- **D1** · Given any language in the set, when interface strings for a single named concept are enumerated, then exactly one term is used for it, and the banned synonyms appear nowhere except as search query aliases (`F3-11`). → gate `scripts/check-adherence.sh` check 19 (`M147`), `recorded` red on the signup sentence before its fix in all three catalogs, and on an injected literal after it
- **D2** · Given a user-visible string carrying *quote*, *quotation* or *कोटेशन*, when the gates run, then the change is refused and the string is named. → `recorded` `scripts/check-adherence.sh` check 19, red under `scripts/break-and-run.sh --pattern`: the old sentence in `en`, an injected `कोटेशन` in `hi` and `mr`, and an injected string literal in `packages/ui`, each refused and named by file and line
- **D3** · Given the two live strings, when signup renders its company-name error and the survey disclosure renders its line, then both read *proposal* in every launch language. → gate check 19 green over the three catalogs and `Disclosure.lines.ts`; Q1–Q7, the signup error in `en`, `hi` and `mr` on web and iOS, and in `en` on Android; the disclosure's Hindi and Marathi are `T-FPLAT-072`'s (ruled above)
- **D4** · Given the search box, when someone types "quote" or "quotation", then proposals still return. → none — `T-FPLAT-020`'s, which has not landed (ruled above)
---
### T-FPLAT-057 · A design names the brief it was reviewed against
**Type:** engine · **Tier:** P0
**Status:** shipped (#93)
**Why:** A screen is designed against its brief, and the brief keeps changing after — a ruling folded in, a requirement re-pulled — while the design stays as drawn. Every gate that reads the design side passed while five of the twenty-three designs showed behaviour their briefs had since changed: Company Signup asked about a known number before the code was sent, Catalog Settings drew a platform price, Add Catalog Item lacked a state ruled after it was drawn, Payment Terms accepted 99.99 as full, and the App Shell's tab read a word the product bans. The gates checked that a brief file EXISTS and that its quotes match the PRD; none compared a brief against the design drawn from it. Building those screens to match their designs pixel for pixel would build what their briefs retired — and for a screen already built, nothing told anyone to look at its code again.
**PRD rows:** none of its own — it serves every row a screen renders, by making a design that has fallen behind its brief something that is refused rather than built from.
**Depends on:** nothing.
**DONE WHEN:**
- Given a designed screen whose brief changes after its design was reviewed, when the gates run, then it is refused until the design is reviewed again. → proof: gate the five briefs that gained a `Redesign owed` note were each refused with their new digest, then accepted as owed
- Given a design found stale, when the design queue and the build order are read, then it comes first in one and is absent from the other. → proof: gate `next-screen.py` lists the five before any new screen; Team marked owed drops the ready list from 28 to 27
- Given a screen already built, when its review is recorded, then it names its code's verdict, and a code change names a real task. → proof: gate a built screen with no verdict, and one owed to a task id that does not exist, are each refused
- Given a screen not yet built or not yet designed, when its cell is written, then it claims no code verdict and no review. → proof: gate an unbuilt screen with `code ok`, and a planned screen with a digest, are each refused
- Given a new design approved, when it is recorded, then its digest is taken after every brief edit. → proof: gate `docs/start-here.md` records it as Edit 4, last, and `next-screen.py` names no digest in advance

---
### T-FPLAT-056 · A change commit's CI verdict is read before the flip
**Type:** engine · **Tier:** P0
**Status:** shipped (#91)
**Why:** On every PR the second-to-last commit showed a failed-looking run and the last a green one. It was never the code: CI cancels an in-flight run when a newer push lands on the same PR, and `/ship` told the agent to push the ledger flip "at once", so the run proving each change was cancelled by our own flip — 18 of the last 100 runs. That trains everyone to ignore a red mark on exactly the commit that matters, and a cancelled run can still hold a step that had already failed: one held a secret scan killed mid-step, recorded as a failure, proven clean only by scanning the same commits again. The "at once" existed for a real reason — waiting let the owner merge before the flip landed, which has happened — so the fix has to keep that window shut too.
**PRD rows:** none of its own — it serves every row CI stands behind, by making the result on the change commit something that is read rather than cancelled.
**Depends on:** nothing.
**DONE WHEN:**
- Given a change commit's CI run, when `/ship` waits on it, then the wait ends only when that run completes, and ends in failure when the run did not succeed. → proof: gate the §5 wait replayed against real runs — a success exits 0; PR #80's runner-outage failure and PR #90's cancelled run each exit non-zero
- Given the run lookup, when it resolves the commit, then it uses the full commit id, because a short one finds nothing and nothing is not a pass. → proof: gate the short id `01009e9` returns an empty list where `git rev-parse` of it returns the run
- Given a PR whose CI is still being read, when the owner looks to merge, then it cannot be merged until it is marked ready. → proof: gate this PR reads `isDraft: true` while its runs are read, and is marked ready only after both are green

---
### T-FPLAT-055 · The build order is computed, never remembered
**Type:** engine · **Tier:** P0
**Status:** shipped (#90)
**Why:** The owner's order lives in `docs/build-order.md` — blocks 0 to 8, decided with a written reason — yet no gate read it, and the order inside each block lived only in `Depends on:` lines no gate read either. So the next task was picked from memory, and memory was wrong twice in one hour: `T-SHELL-001` was called ready while it waits on `T-SHELL-007`, and "no ordering document exists" was said while `build-order.md` sat in `docs/`. Reading the whole graph mechanically found what no reading by eye had: five dependency LOOPS that no task in them could ever start, eight V1 tasks in block 1 waiting on later blocks, and seven STRUCK stubs still reading `planned`, which inflated block 0 from 24 open tasks to 31. The owner's worry is a missed task; this makes a missed task loud.
**PRD rows:** none of its own — it serves every row by making the order they are built in something the gates compute.
**Depends on:** nothing.
**DONE WHEN:**
- Given the build order, when the gates run, then the next ready task is printed whether the run passes or fails. → proof: gate the order line reads `build order: block 0 · 24 open · 6 recorded cross-block · ready now: T-FPLAT-017 (unblocks 4) …`
- Given a ticket whose readiness rests on silence, when the order line is printed, then it says so. → proof: gate `22 of 24 declare no dependencies yet`, moving to 21 when one ticket declares a line
- Given a dependency loop, a wait on a struck task, a V1 task waiting on a V2 one, an unrecorded later-block wait, a stale record, an unplaced V1 file, a drifted copy of the blocks or an unreadable plan, when the gates run, then each is refused by name. → proof: gate each injected in turn and read back
- Given a recorded later-block wait, when its block becomes the open one, then the ruling is owed at once. → proof: gate a recorded wait inside the open block goes red
- Given a stub whose rows moved elsewhere, when the ledger is read, then it is struck and counts as no open work. → proof: gate the seven stubs read `struck`, and a heading and a status that disagree are refused

---
### T-FPLAT-054 · A skill is an instruction file
**Type:** engine · **Tier:** P0
**Status:** shipped (#89)
**Why:** `.claude/skills/` holds law — a skill tells the agent what to DO at the moment it applies — and it sat outside every instruction-file gate. `CLAUDE.md` §8 says a rule cites a mechanism row and never describes the gate itself, and `/migration` had been describing a hook and a runner in place of citing `M19`. The same class of slip was caught by hand in `/start` one task earlier, which is twice in two days that a skill carried something no gate could see. The corpus regrows in three shapes — a dated war story, an unsourced enforcement claim, a named tool — and all three were being watched everywhere except the files the agent reads first.
**PRD rows:** none of its own — it serves every row the skills stand behind, by holding the skills to the rule the rest of the corpus already obeys.
**Depends on:** nothing.
**DONE WHEN:**
- Given a skill that names a gate instead of citing its row, when the gates run, then it is refused. → proof: gate red on `.claude/skills/migration/SKILL.md:55`, which described a hook and a sha256-locked runner; it now cites `M19`
- Given a skill that claims something is enforced without naming the row, when the gates run, then it is refused. → proof: gate red on a planted `enforced by vitest` in `/verify`, caught by BOTH the claim and the tool check, green on removal
- Given a long skill, when the gates run, then no ceiling is imposed on it. → proof: gate `/verify` at 188 lines passes and no skill appears in the budget check's own report

---
### T-FPLAT-053 · Four fences the tenancy work left open
**Type:** engine · **Tier:** P0
**Status:** shipped (#88)
**Why:** `M11` closed the big hole and its gap column named what it did not hold. Four of those are closable now. `M14` walked `body` and `query` only, so a route shaped `/tenants/:tenantId/…` would have put the id on the wire and passed — the one defence against a tenant id arriving from the client had a hole in it. `tenantIdOf` was written TWICE and the copies already differed, one throwing a status its route never declares, and that is the single function deciding which company a request acts as. `createDb` was importable anywhere, so a repository could build its own pool and walk around the door entirely. And `M60`'s cast registry is kept by hand, so a brand declared and never listed there is unguarded while the check prints the same pass either way — `M125` said as much and nothing asserted it.
**PRD rows:** none of its own — it serves every tenant-scoped row by closing the ways round the door `T-FPLAT-050` built.
**Depends on:** `T-FPLAT-050`.
**DONE WHEN:**
- Given a route that would carry a tenant id in its PATH, when the invariants run, then it is refused. → proof: gate `tenant-id-on-the-wire` red on a `tenantId` injected into a path schema, naming both routes; the judged population rises from 21 to 30 as path-only routes become visible to it
- Given the function that decides which company a request acts as, when a reader looks for it, then there is ONE. → proof: gate the private copy in `tenant.controller.ts` is gone and the shared one is imported; the copy's undeclared `NotFoundException` goes with it
- Given a repository, when it tries to build its own pool, then it does not lint. → proof: gate the `createDb` ban red in an ordinary repository, with the `node:fs` ban proven to still fire in the same file
- Given a brand declared and never enrolled with the cast check, when the invariants run, then they say so. → proof: gate `brand-registry` red on `ClockTime`, unenrolled since before this row existed, and red again on `TenantScopedDb` removed from the registry

---
### T-FPLAT-052 · Silence is not evidence
**Type:** engine · **Tier:** P0
**Status:** shipped (#87)
**Why:** Five times in one run, an ABSENCE was read as a pass: `adherence OK` printed over a check that had crashed and never run; a typecheck exited 0 on a file that was outside its own program; a "red" run that changed nothing because its regex matched a shape the formatter had since rewritten; a clean room that stayed green with the fix reverted, because the file chosen to delete was filtered out before the check saw it; and `no brand obtained by a cast` printed over a brand that had never been added to the registry. The last one is the shape that matters most — `M60`'s own gap column had said all along that listing a brand there is part of landing it, and the instruction still did not fire, because nothing made anyone GO AND LOOK at a fixed moment. An unguarded fact and a guarded one look identical from the gate's output.
**PRD rows:** none of its own — it serves every row every gate stands behind, by refusing to count a gate that abstained as a gate that passed.
**Depends on:** nothing.
**DONE WHEN:**
- Given a fact added to a guarded kind, when the work is planned, then the guard it joins is named before any code is written. → proof: gate `/start` §3 asks for the `mechanisms.md` row each new fact enrols in and the injection that will prove it fires
- Given a gate reported as green, when the change is verified, then it must say what made it fire. → proof: gate `/verify` §5 item 6 turns a check that scanned none of the change's files, crashed, or has no entry for the new fact into an ABSTAIN rather than a pass
- Given the law itself, when it is added, then it does not displace an existing rule. → proof: gate `CLAUDE.md` at 220 lines against a budget raised to 220 in both the file and `scripts/gates.py`, seen red at 221

---
### T-FPLAT-050 · A cross-tenant query stops compiling
**Type:** engine · **Tier:** P0
**Status:** shipped (#86)
**Why:** `M11` is the largest safety win left. Today a tenant repository is handed the whole database and is *expected* to wrap every read in `withTenantTransaction`, which pins `app.tenant_id`. Nothing stops it skipping that, and a skipped pin is a query that reads every company's rows. Tenancy is held by review and by `M13`'s behavioural invariant — both of which run after the code is written. The handle moves it to the compiler: hand a repository a DOOR rather than a database, and the mistake stops being representable.
**PRD rows:** none of its own — it serves every tenant-scoped row in the product by making the wrong query fail to build.
**Depends on:** `T-FPLAT-049`, which moves the one consumer that legitimately reads unpinned out of the tenant pool's way.
**DONE WHEN:**
- Given a tenant repository, when it queries without pinning a tenant, then it does not compile. → proof: gate `this.db.select()` in a tenant repository, seen red as `Property 'select' does not exist on type 'TenantPool'`
- Given a raw transaction, when it is passed where a tenant-scoped one is required, then it does not compile. → proof: gate the brand is minted only inside the door, seen red on an assignment from `DbTransaction`
- Given the running api and the real database, when every tenant path is driven, then nothing it answers has moved. → proof: qa-api the six database-backed proofs and `tenancy-rls` green against the live postgres, driven not read
- Given a transaction's type, when a repository needs to name it, then one name answers. → proof: gate no `Parameters<Parameters<Db['transaction']>[0]>[0]` remains outside `packages/db`

---
### T-FPLAT-049 · The pack read gets its own door
**Type:** engine · **Tier:** P0
**Status:** shipped (#84)
**Why:** The market-pack read has no tenant predicate, and that is correct — the pack is readable global reference data every tenant reads and none owns (`F1-12`). But it asked the TENANT pool's token for it, so the one legitimately unpinned read in the api looks, at its import, exactly like a tenant read that forgot to pin. That also blocks `M11`: a tenant handle cannot be the tenant pool's only door while one consumer still needs that pool raw.
**PRD rows:** none of its own — it serves `F1-12` by giving a tenant-free read a name.
**Depends on:** nothing.
**DONE WHEN:**
- Given any file that is not a reference repository, when it reaches for the tenant-free pool, then boundaries refuse it. → proof: gate `reference-pool-fenced` seen red on `tenant.repository.ts` importing the token, green with the import removed
- Given a reader of the api, when they ask which reads run unpinned, then the file names answer. → proof: gate exactly one `*.reference.repository.ts` exists and it is the pack read; `apps/api/CLAUDE.md` states the three kinds
- Given the running api and the real database, when the pack paths are driven, then they answer as before. → proof: qa-api the pack read and publish driven against the live postgres, and the settings proofs that stand on a published pack

---
### T-FPLAT-048 · A mistake made unrepresentable, and two folders that say what they hold
**Type:** engine · **Tier:** P0
**Status:** shipped (#83)
**Why:** `M121` was written as a review-only row three hours after the mistake it describes broke every 401 in the api — a reverse scan of the status map returning whichever code was declared first. A row nobody watches is a rule the next reader can miss, and the owner's concern is exactly that: the agent must not miss a single instruction. Beside it, two folders are named for a layer rather than what they hold: `apps/web/features/app/` held nothing but the word `app`, and `apps/mobile/src/screens/shared/` was undeclared and unfenced, so a folder already waiting to empty could have become the app's second component tree.
**PRD rows:** none of its own — it serves every row the api answers, by making a wrong error code impossible rather than discouraged.
**Depends on:** nothing.
**DONE WHEN:**
- Given the exact reverse scan that broke every 401, when it is written again, then it does not compile. → proof: gate `Cannot find name 'errorHttpStatusByCode'`, seen red by writing that line back into the filter
- Given every legitimate reader of a code's status, when it asks, then one function answers. → proof: gate six call sites in `apps/api` read `httpStatusFor`, and `check:openapi` emits a byte-identical surface
- Given a folder named for a layer, when a reader looks for the capability, then the folder is the capability. → proof: gate `apps/web/features/app/` is gone and its one importer follows
- Given anything but a screen reaching into the phone's shared parts, when boundaries run, then it is refused. → proof: gate `mobile-shared-parts-are-screens-only`, seen red on `navigation/guards.ts` importing a part

---
### T-FPLAT-047 · One landing, one language provider, and a publish that cannot race
**Type:** engine · **Tier:** P0
**Status:** shipped (#82)
**Why:** Both navigators answer the same question — where does this visitor belong — and answered it in two shapes: the web computed a route, the phone a pair of booleans, and `M01-10`'s rule that a verified number with no company belongs on the company step lived in both. Beside it the language provider was written twice, the copies differing only by web's `<html lang>`. And `MarketPackService.publish` read the current revision and inserted the next with no lock, so two publishers computed the same number and the loser died on a primary key instead of seeing that the winner had already published its payload.
**PRD rows:** none of its own — it serves `M01-10` and `F3-02`/`F3-04` by answering each once, and `F1-11` by making a revision safe to take.
**Depends on:** nothing.
**DONE WHEN:**
- Given a signed-out visitor asking for a signed-in route, when the gate decides, then both platforms read ONE function. → proof: gate `landingFor` in domain, read by the web's `destinationOf` and the phone's `useHasTenant`/`useHasNoTenant`; unit at domain's 100% bar, seen red on a branch that lets a person with no company inside and red on one that stops the sign-in beat keeping the door
- Given the real web app, when a signed-out visitor opens `/home`, then they land on the door. → proof: qa-web the production build driven in a browser — `/home` renders the sign-in screen, `/company-signup` renders step 1 of 3
- Given a language the person chooses, when it is persisted, then one provider does it for both platforms. → proof: gate `LanguageFollowsUser` in `@heliogrid/i18n/react`, composed by a same-named `SessionLanguage` in each app, web's passing the one thing that is web's
- Given two publishers at once, when both would take the same revision, then one writes it and the other finds it already published. → proof: qa-api two concurrent `pack:publish` runs against the real database — one publishes, one reports no difference; seen RED with the lock removed, where the second died on the insert

---
### T-FPLAT-046 · Five parked bugs, the seam the transport never had, and the rule this change paid for
**Type:** engine · **Tier:** P0
**Status:** shipped (#81)
**Why:** `docs/tasks/deferred.md` says a row there is the NEXT task, never a parked fix. Five of its rows had waited, and two of them cost this repository real time: the worker could not be started in dev mode from a clean checkout, so every verification of it has run the built artifact by hand, and `apps/api`'s `predev` freed port 8084 by name whatever port the run would bind, so starting a second api killed the first — which is exactly how a QA run lost the instance its earlier steps were using. The third is the api's port written in four places. The last two are one defect wearing two faces: the transport could not tell the session store anything, so a refresh that failed left the store `authenticated` while every call 401'd — a screen behind the gate kept rendering for someone the server had already stopped recognising — and, never learning, it posted a doomed refresh behind every later 401 too, five wrong OTP codes costing ten calls.
**PRD rows:** none of its own — each row it closes names its own.
**Depends on:** nothing, which is the point.
**DONE WHEN:**
- Given a clean checkout that has been built, when the worker is started in DEV mode, then it finds its workflow bundle instead of dying on the boot assertion. → proof: gate `assertWorkflowBundle()` resolves under BOTH layouts — `tsx`'s `src/common/temporal` and the compiled `dist/common/temporal` — seen red on the single compiled path, which is what dev mode had
- Given an api started on a port that is not the default, when its pre-script runs, then it frees the port THAT run will bind. → proof: gate the script expands to `kill-port 8099` under `API_PORT=8099` and `kill-port 8084` under nothing
- Given the api's port, when it moves, then the api's own default, the web's dev origin and the phone's two platform fallbacks all move with it. → proof: gate the constant set to 9999 and back, the web default following both ways, and no `8084` literal left in any of the three readers
- Given a session the server no longer recognises, when a refresh cannot save the call, then the store stops saying `authenticated` and both navigators can swap to the door. → proof: gate the REAL data layer driven against a controllable origin that answers 401 — the store moves `checking` → `anonymous`; seen red with the seam unwired, where it stayed `checking`
- Given a 401 arriving after the session is known to be gone, when the transport handles it, then it posts no refresh behind it. → proof: gate the same drive — the second call is `["GET /auth/session"]` alone; seen red unwired, where it was the doomed pair again

---
### T-FPLAT-045 · One constant serves both halves, and a chart stops inventing a threshold
**Type:** engine · **Tier:** P0
**Status:** shipped (#80)
**Why:** Seven components each held the same non-visual constant twice, once per platform half — skeleton row keys, a non-digit pattern, an actor-class map, a document's design-space type size. `packages/ui/CLAUDE.md` says anything both halves share is declared once; a second copy is a place the two can part, and a skeleton or a stripped dial code is never compared side by side, so nobody would notice. Beside them `FunnelChart` invented a number: below 40 per cent carried forward it called a stage out, a product judgement authored in a package that may hold no policy, and a threshold no caller ever chose.
**PRD rows:** none of its own — it serves `F7-19` and every row a chart renders, by leaving each fact in one place.
**Depends on:** nothing.
**DONE WHEN:**
- Given each of the seven components, when both halves read their constant, then it is declared once. → proof: gate the duplicate scan, 16 copied constants in 11 files down to 9 in 8, and every one left is an English string or the theme-blocked breakpoint
- Given `ActivityGlyph`, whose halves held the same fourteen glyphs in two different ENCODINGS, when each half draws one, then it reads one shape vocabulary and renders it with its own elements. → proof: gate every path, circle and rect extracted from both halves before and after — 17, 3 and 5 — set-compared and all SAME; the two-encodings list drops it
- Given `FunnelChart`, when it renders, then the threshold it calls a stage out at came from its caller. → proof: gate `lowConversionBelow` required on `FunnelChartProps`, both halves reading it, no default anywhere
- Given the change, when the package is built the way CI builds it, then both platform resolvers walk the new files. → proof: gate `pnpm verify:clean` — `next build` and the full Metro bundle

---
### T-FPLAT-044 · One drawing serves both halves
**Type:** engine · **Tier:** P0
**Status:** shipped (#79)
**Why:** Four components each hold the same outline twice, once per platform half — the verdict ticks, the finding marks, the delta arrows and the banner glyphs. A corrected outline lands on one platform and not the other, and nothing catches it: no gate compares the two halves' geometry, and no screen imports any of these four, so there is not even a surface where the drift would show. The owner's ruling that an icon is DRAWN here rather than imported makes the drawing this package's own fact; a fact written twice is the defect this repository exists to prevent.
**PRD rows:** none of its own — it serves `F7-19`, one icon family at one stroke weight, by making each glyph one drawing rather than two.
**Depends on:** nothing.
**DONE WHEN:**
- Given each of the four components, when both halves draw their glyph, then they read ONE geometry declared once. → proof: gate the scan reports the four constants gone, 19 duplicates down to 16
- Given the change, when the outlines are compared with the tree before it, then every `d` string and every ring radius is unchanged. → proof: gate every path and radius extracted from both halves at `HEAD` and now, set-compared, all four SAME
- Given both platforms, when the package typechecks, then each half still draws with its own elements — `<path>`/`<circle>` on web, `react-native-svg` on RN. → proof: gate `pnpm check:all` and the design-system contract check

---
### T-FPLAT-043 · The session flow moves to its owner, and nine signatures stop being written twice
**Type:** engine · **Tier:** P0
**Status:** shipped (#78)
**Why:** Four decisions both platforms make — which panel each door shows, whether a person belongs inside, and where they land — live in `packages/data`, whose own `CLAUDE.md` says business logic belongs to `@heliogrid/domain` and whose layer is proven by DRIVING the client rather than by unit tests. So the flow every screen branches on was the one flow nobody could test at its edges. Beside it, `SessionApi` restates nine `SessionStore` signatures by hand: a tenth method joins one list and not the other, and the screen that needed it fails to compile for a reason no one will read as "somebody forgot the second copy".
**PRD rows:** none of its own — it serves `M01-08` and `M01-10`, whose orderings these selectors ARE, by putting them where both platforms read one copy.
**Depends on:** nothing.
**DONE WHEN:**
- Given the sign-in door, when a switch is pending, then the switch panel wins over a settled session and over the flow's step. → proof: unit `packages/domain/tests/auth/door-view.test.ts`, seen red with the switch arm removed
- Given the signup door and a settled person with no company, when the panel is chosen, then it is the company step rather than done (`M01-10`). → proof: unit `packages/domain/tests/auth/signup-view.test.ts`, seen red on a branch that always answers done
- Given a person holding several presets in any order, when their home is resolved, then it is the highest rung of the ladder. → proof: unit `packages/domain/tests/auth/company.test.ts`, seen red on taking the first role in the array
- Given a tenth method on the session store, when it is added, then `SessionApi` carries it without a second edit. → proof: gate `SessionApi` is `SessionSnapshot & Omit<SessionStore, 'getSnapshot' | 'subscribe'>` and every consumer typechecks
- Given both apps, when they are built the way CI builds them, then the moved imports resolve on each platform's own resolver. → proof: gate `pnpm verify:clean` — `next build` for web and the full Metro bundle for React Native

---
### T-FPLAT-042 · The worker proves its own idempotency, and CI stops paying three times for one graph
**Type:** engine · **Tier:** P0
**Status:** shipped (#77)
**Why:** The worker is the one process whose correctness NOBODY checks: every activity must be idempotent because Temporal retries them, and the single activity that exists proves that by hand in a map that grows for the life of the process. A long-lived worker with an unbounded map is a memory leak that arrives as an OOM kill mid-activity — which is exactly where a side effect is half-applied. Beside it, the local clean-room proof skips the one lane CI calls the only mechanical proof the React Native JavaScript resolves, two CI jobs rebuild a dependency graph they never open, and three jobs write to one cache key so whichever finishes first decides what the other two restore.
**PRD rows:** none of its own — it serves every row a workflow will ever carry, by proving the retry contract those rows rest on, and every row at all, by making the local proof and CI agree.
**Depends on:** nothing.
**DONE WHEN:**
- Given the same event and beat recorded twice, when the activity runs again, then it answers the first answer rather than applying a second time. → proof: unit `apps/worker/tests/platform/heartbeat.test.ts`, seen red on a store that returns a fresh timestamp per call
- Given more keys than the store holds, when the next one arrives, then the store stays at its bound and the oldest key is the one dropped. → proof: unit the same file, over a store of two, seen red on an unbounded map; the file itself at 100% (`vitest.config.mts`), seen red on an unreachable branch
- Given the clean room, when the full proof runs, then the React Native JavaScript is bundled there as CI bundles it. → proof: gate `pnpm verify:clean` prints the bundle stage, and goes red on an injected broken import in the mobile graph
- Given a dependency no file imports, when the tree is installed, then it is not there to import. → proof: gate `pnpm verify:clean` green with the six removed, and each one proven unreachable by `require.resolve` from the app it left
- Given the three ubuntu jobs, when they run together, then each writes its own turbo cache and the native lanes build no JavaScript graph. → proof: gate this branch's own CI run — the ci.yml change turns every lane on, so android and ios prove they need no `turbo build` by going green without one

---
### T-FPLAT-041 · The api's correctness edges — a bounded read, a precise denial, a redacted error
**Type:** engine · **Tier:** P0
**Status:** shipped (#76)
**Why:** Three small things each send someone the wrong way at the worst moment: a read with no ceiling scales with the table it reads, a deny-by-default guard that cannot find a declaration reports it as an authentication failure and starts a hunt through sessions, and a command that prints a raw error prints the connection string inside it — into the log an operator pastes when asking for help.
**PRD rows:** none of its own — it serves every row the api answers, by making its failures say what actually happened.
**Depends on:** nothing.
**DONE WHEN:**
- Given a route whose declaration cannot be found, when it is called, then the refusal names the key it looked for and both causes, rather than reading as an authentication failure. → proof: qa-api inject a prefix into the declaration key and read the message back
- Given a route that IS declared, when it is called without a session, then the ordinary refusal is unchanged. → proof: qa-api two protected routes answer `UNAUTHENTICATED` / "Sign in to continue."
- Given a repository read that has no natural bound, when it runs, then it carries a ceiling and the answer is unchanged. → proof: qa-api the OTP request still resolves its market, 200
- Given a command that fails against the database, when it prints the failure, then no credential appears in the output. → proof: unit the redaction over three real-shaped strings, connection strings among them

---
### T-FPLAT-035 · The one `file` table and direct-to-storage transfer
**Type:** engine · **Tier:** P0
**Status:** shipped (#186)
**Why:** Every photograph, datasheet, logo and document an installer stores is bytes somewhere; one table that knows where, how big and whose keeps storage measurable per tenant and keeps file bytes out of the API.
**PRD rows:** none of its own — it serves the rows that store a file (`M01-40` datasheets, `M01-50` logo and letterhead, M04 photographs, M08 documents, M10 employee documents, `M12-23` the storage gauge); each stays dispositioned on its own task.

**Depends on:** `T-FCORE-016` (0001) · `T-M01-025` (0002, `tenant`, the tenant-scoped pattern) · `T-FPLAT-059` (0007, `subject_kind`) · the creation keys (0012, `F4-07`).
**DONE WHEN:**
- **D1** · Given a declared file, when the client uploads to the presigned URL and calls complete, then the row holds provider, external id, size, checksum and content type, and a read returns a short-lived download URL → Q2 · Q3
- **D2** · Given a file of another tenant, when its id is read, then the response is 404 and no download URL is issued → invariant tenancy-rls over seeded `file` rows · Q6
- **D3** · Given a JSON body above 1 MiB on any route, when it is sent, then the edge refuses with 413 and no file route ever accepts bytes → Q11 (a regression check of the global edge)
- **D4** · Given the tenancy scan after this migration, when it runs, then `file` passes as tenant-scoped with `tenant_id`, its composite index, a fail-closed policy and explicit grants → invariant table-tenancy-scan
- **D5** · Given the Drizzle model, when schema parity runs, then the model and the migration agree on every column → invariant schema-parity
- **D6** · Given bytes that differ from the declaration or are not the declared image type, when they are uploaded and completed, then the file never becomes readable (ruling: length, checksum, type) → Q4 · Q5
- **D8** · Given the two new pgEnums, when enum parity runs, then `file_content_type` equals the contract's enum and `storage_provider` is excused as server-internal (Law 12, `M17`) → invariant `tests/invariants/src/enum-parity.ts` (proven red both ways: the excuse removed, and a content type added on the contract side alone; one added in domain alone does not compile, since `image-signature.ts` is a `Record` over the vocabulary)
- **D7** · Given the store settings, when the vendor changes, then only settings, one `STORAGE_PROVIDERS` value and its migration change — no adapter code (ruling: the port) → `apps/api/tests/files/boot.test.ts` › "the store is built from settings alone" for the binding; the second vendor itself is proven when the hosting task binds it

---

## Laws (enforced through screens and review, no standalone build)

These rows state properties of the product that engineering does not build as a component: they are satisfied by the screens other buckets build, by the shared design-system components, and by the review gates named against each row. They are reproduced verbatim because the wording is the requirement.

- **F2-04** (P0, `docs/prd/foundations/F2-roles-and-permissions.md`) — **The approver of record is not the design's author.** Sign-off approval or return is recorded with who and when — "the engineer-led structural safety record" — and a returned design goes back to its author with comments pinned to what is wrong. Where the only person holding sign-off is the author (the one-person firm — the matrix has always granted the Owner both capabilities), the approval record still names the approver, so the record shows the same person did both; see edge cases.
  **Enforced by:** the design sign-off record specified by `docs/prd/modules/M05-design-studio.md` and built in `docs/tasks/MS-studio-c.md`; the approver-and-time pinning of `T-FPLAT-030` (`F8-26`, `F8-27`); the audit entry of `T-FPLAT-004`.

- **F2-06** (P0, `docs/prd/foundations/F2-roles-and-permissions.md`) — **No commercial figures, ever, on any surface the Installation Team Member preset grants.** No price, discount, tranche, margin or customer value appears on any screen this preset reaches. v1 achieved the property by giving crew no screen at all; where V2 gives them a screen, the surface itself must preserve it (`02-personas.md` `PS-27` carries the same law persona-side).
  **Enforced by:** every screen the Installation Team Member preset reaches — the installation surfaces briefed in `docs/ux/briefs/**` and built in `docs/tasks/M08-projects.md` — checked at screen review; the grants that reach them come from `T-FPLAT-001`'s matrix and `T-FPLAT-002`'s resolution.

- **F2-07** (P1, `docs/prd/foundations/F2-roles-and-permissions.md`) — **The coordinator fallback survives the preset.** Where the checklist is run by a coordinator rather than the crew, ticks are attributed to the coordinator and an optional free-text "done by" per step records the crew member's name. This fallback is not removed when crew accounts exist, because mixed crews are the normal case (`02-personas.md` `PS-28`).
  **Enforced by:** the installation-checklist screen `SCR-M08-04` (`docs/ux/briefs/SCR-M08-04-installation-checklist.md`, built in `docs/tasks/M08-projects.md`), which attributes the tick to the coordinator and carries the optional per-step free-text name.

- **F3-16** (P0, `docs/prd/foundations/F3-localization.md`) — **Layouts survive text expansion of roughly 15–30% without truncating meaning.** No fixed-width labels; buttons and chips size to their content; table headers wrap rather than clip; **amounts and units are never truncated**; and a long string wraps or truncates with the full text still reachable — it never overflows its container and never hides a value. The source names the usual casualties: buttons, chips, table headers and the proposal builder's eleven step titles.
  **Enforced by:** per-screen review at both viewports against `F7-43` item 7 over the briefs in `docs/ux/briefs/**`; the per-script line-height mechanism it depends on is built by `T-FPLAT-007`.

- **F3-18** (P0, `docs/prd/foundations/F3-localization.md`) — **A screen is not done until it has been rendered and checked in a non-Latin launch language.** This is a completion condition, not a testing recommendation: the design language's per-screen Definition of Done already lists "rendered in Hindi and checked — layout survives expansion" as one of its items, and the source's own recommendation is to do it early, on real screens, because English-only design that is translated later always breaks and the breakage is invisible until a real user opens it. The five densest surfaces — the BOM, the generated proposal document, the proposal builder, the lead list and the studio panels — are checked in every language in the set.
  **Enforced by:** the per-screen Definition of Done (`F7-43` item 7) applied at screen review, over the five densest surfaces the row names.

- **F3-25** (P0, `docs/prd/foundations/F3-localization.md`) — **The product is built for an open language set.** Every requirement in this suite is written for "the languages in the set", never for three named ones: no screen, document, template structure, preference, permission or product rule may assume the set's size, its members, or that every member shares one script. A requirement phrased "in all three languages" is a defect against this rule.
  **Enforced by:** document and code review — no requirement, screen, template, preference or rule may name a fixed language count; `T-FPLAT-005` reads the set from the catalog rather than from a constant, and `T-FPLAT-009` extends it as configuration.

- **F3-29** (P0, `docs/prd/foundations/F3-localization.md`) — **The interface language set and the voice agent's language set are independent, and never converge by accident.** The agent's set is broader than the interface's — six at launch, the three interface languages plus Gujarati, Tamil and Telugu — is chosen **per customer** for a call, and is tenant-configurable. It is specified in `modules/M07-sales-execution.md`; F3 neither owns it, bounds it, nor changes when the interface set changes. A Marathi-speaking rep may call a Hindi-speaking customer from an interface in English, and nothing in the product ties the three choices together.
  **Enforced by:** `docs/prd/modules/M07-sales-execution.md` owning the agent's language set separately from `T-FPLAT-005`'s interface set; review confirms a change to either leaves the other untouched.

- **F4-27** (P0, `docs/prd/foundations/F4-data-integrity.md`) — **A warning never disables a primary action.** No modal and no spinner wall stands between a user and their work, and no primary action is pre-emptively greyed out. Where an action genuinely cannot be performed, it is refused honestly **at the attempt**, with a reason, rather than disabled with no explanation.
  **Enforced by:** per-screen review of every brief in `docs/ux/briefs/**` — no surface pre-emptively disables a primary action or stands a modal or a spinner wall in front of one; the honest refusal at the attempt is `F8-36`'s, built by `T-FPLAT-032`. *(Moved here 2026-08-07 from `T-FPLAT-014`, which was the five-surface sync-state model. The row is live and unchanged in force, but its text was re-pulled verbatim — it previously read "Never blocking, in any of the five" and spoke of connectivity, saves succeeding locally and the deleted `F4-09` — and what is left is a property of every screen rather than a component this bucket builds.)*

- **F6-03** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **Notification honesty: no false urgency, ever.** A notification's tone matches its fact: informational facts inform, attention items say why they need attention, and nothing is dressed as urgent to drive engagement — the same discipline the dunning ladder (`M12-41`) and the state banners obey (`F8-34`'s family). No engagement mechanics exist: no streaks, no badges-for-opening, no re-notification of an unchanged fact.
  **Enforced by:** a tone audit of the complete catalogue registered by `T-FPLAT-017`, plus copy review of every message body; `T-FPLAT-018` emits no re-notification of an unchanged fact.

- **F6-04** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **Nothing in this document reaches the EPC's customer.** Every matrix recipient is a tenant user; the customer's surfaces are the link's own states (`F5-48`'s confirmation-state law) and the transactional message flows. The two source moments that ask for automatic customer messages — the design-wait message and the acceptance acknowledgement — are **ruled (owner ruling 2026-08-04)**: they send automatically from the tenant's connected transactional channel, owned by `foundations/F5` (`F5-16`, `F5-48`) with `modules/M03`'s connection (`M03-03`); this document still defines **no send channel of its own** and stays staff-side.
  **Enforced by:** `T-FPLAT-018`'s recipient resolution, which resolves tenant users only; the two customer-facing sends belong to `docs/prd/foundations/F5-customer-link.md` and connect through `docs/prd/modules/M03-marketing.md`.

- **F7-01** (P0, `docs/prd/foundations/F7-design-language.md`) — **`design/ds-source/` is the single source of every visual fact in the operator product.** The vendored design-system package — its token files, its typefaces, its component set and its brand law — is canon, and it is canon *pixel-perfect*: no document, module, screen, tenant or release re-decides a visual fact it already settles. The character it encodes is part of the ruling, not decoration around it: a precision instrument for people quoting jobs worth a great deal of money, calm under dense data, warm-neutral, with hierarchy carried by luminance and softness rather than by lines. Every requirement below is a rule *about* that artifact, never a replacement for it.
  **Enforced by:** `T-FPLAT-023`'s adherence gate, which fails any value that did not reach the screen through the design system, plus screen review against `design/ds-source/`.

- **F7-02** (P0, `docs/prd/foundations/F7-design-language.md`) — **When the artifact and a ruling disagree, the ruling wins — and the divergences are named, not silently patched.** The overlay's own standing law governs, verbatim: *"If code and a ruling disagree, the ruling wins until the product owner changes it in this file."* Precedence is therefore: an owner ruling in `docs/15` first, the package's token files second, the package's prose readme last. Three divergences are recorded as of this writing and are **not resolved here**: the readme's dark-mode index line is declared false by `R19-A` (the token files carry no dark values and declare a light colour scheme, so ruling and artifact agree and only the prose is stale); the semibold weight sanctioned by `R19-D` is not yet present in the type tokens (ruling wins — the sanctioned set is the ruling's); and the "medium weight restricted to buttons, tabs and table headers" clause — carried by both the readme and the token file's own header comment (`tokens/typography.css:2`, "500 permitted for buttons, tabs, table headers only") — is dead by the same ruling *(second carrier named by Task 26)*.
  **Enforced by:** review at implementation — the three recorded divergences are carried in this row and resolved in favour of the ruling, never patched silently in code.

- **F7-04** (P0, `docs/prd/foundations/F7-design-language.md`) — **v1 is light-only, by law and by fact — dark mode is struck from the definition of done.** There is no dark theme, no per-user theme switch and no dark variant of any surface, and the studio canvas is light like everything else: the source is explicit that *"the old 'studio canvas stays dark' doctrine is dead."* The semantic alias layer is deliberately kept so that a dark value-set can be dropped in later without a redesign; keeping that seam open is a requirement, shipping dark is not.
  **Enforced by:** `T-FPLAT-023`'s adherence gate and screen review: **no brief in `docs/ux/briefs/**` instructs a dark variant or a theme switch** — the one transcribed prototype fact (`MS12-08`, carried verbatim in `SCR-MS-03` per the never-paraphrase rule) travels with a superseding annotation and is not drawn — the law is stated positively for every design session in `docs/ux/design-context.md`, and the semantic alias seam stays in `design/ds-source/` so a dark value-set can be added later without a redesign.

- **F7-05** (P0, `docs/prd/foundations/F7-design-language.md`) — **There is no invented logo mark — and the launch app icon is a typographic letter-tile derived from the wordmark (owner ruling 2026-08-04).** The source is categorical: *"No logo was provided. There is no HelioGrid logo mark — the wordmark is rendered in plain Geist Bold… Do not invent a mark."* Every surface that would ordinarily carry a mark carries the wordmark instead. The one sanctioned exception is the owner's own ruling: the **app icon at launch is a letter-tile — a bold "H" in the brand face on the near-black brand background, derived entirely from the wordmark's style, nothing invented** — which unblocks store submission on both platforms; a **commissioned logo replaces it post-launch via an ordinary update**. Until that logo exists the boot/splash is plain canvas plus the wordmark and the Android-12+ icon-on-splash shows the letter-tile — one boot colour, no stock vendor branding, no flash across the handoff (owner ruling 2026-08-04). Everything else the no-invention law covered stays covered: no screen, asset or release draws a mark of its own.
  **Enforced by:** release asset review on both platforms; no brief in `docs/ux/briefs/**` specifies a mark, and the launch app icon is the ruled letter-tile.

- **F7-06** (P0, `docs/prd/foundations/F7-design-language.md`) — **Two accent systems exist and are never conflated, and the primary action is near-black — never coloured.** (a) The **interactive accent** drives focus rings, links, selected states, active tabs and control fills, and **never fills a button**. (b) The **iridescent trio** is atmosphere only — ambient glow, gradient object, icon wash, AI cue — and **never fills a button, a row, a chip or a field**. (c) The **primary action button is near-black**, in both density modes, on every surface and for every tenant: the source calls this *"the strongest identity marker"*, and it is the one visual fact a reader of this suite should be able to recall without opening the token files. Around all three, restraint is the rule: neutrals carry the overwhelming majority of every screen, a screen carries **at most one accent gesture**, and brand or AI affordances are expressed as a gradient-filled object rather than an outlined icon — which is also how a user tells an AI-produced affordance from an ordinary one.
  **Enforced by:** `T-FPLAT-023`'s adherence gate for the token roles, plus per-screen review of accent count and primary-action treatment.

- **F7-08** (P0, `docs/prd/foundations/F7-design-language.md`) — **The product has two typefaces — a brand sans and its monospaced companion — and one sanctioned weight set.** The families are named here once, because the design spec names them as part of what is preserved: **Geist** and **Geist Mono**, with the package's declaration in `tokens/fonts.css` and `assets/fonts/` remaining the binding statement of which files ship. The families are the package's (`tokens/fonts.css`, `tokens/typography.css`); the sanctioned weight set is **four weights**, fixed by ruling `R19-D`, which added the semibold weight on the evidence of real usage and killed the readme's clause restricting the medium weight to buttons, tabs and table headers. No screen introduces a fifth weight, and **no weight is synthesised** — a weight that is not in the shipped face is not used. Headings are tightly tracked and that tracking is part of the identity, not a per-screen choice.
  **Enforced by:** `T-FPLAT-023`'s adherence gate over the type tokens, plus screen review; the script-face weight parity half is built by `T-FPLAT-007`.

- **F7-09** (P0, `docs/prd/foundations/F7-design-language.md`) — **Identity-bearing and quantity-bearing text renders in the monospaced face, tabular, and right-aligned in tables.** The set is named by the source and is closed to interpretation: record identifiers, energy readings, monetary amounts, coordinates, invoice numbers and phone numbers. Numeric data is tabular so digits align down a column, and currency and quantity columns are right-aligned in every table. This is legibility law for a product whose users compare numbers for a living, and it applies identically on web, on mobile, in generated documents and in exports.
  **Enforced by:** per-screen review of every identifier-, amount- and reading-bearing surface, including generated documents and exports.

- **F7-10** (P0, `docs/prd/foundations/F7-design-language.md`) — **The overline micro-label is the single sanctioned exception to the minimum type-size floor.** The signature uppercase micro-label that sits above a section is the one place in the product where text is allowed below N3's floor, and it is allowed **only** as a micro-label — never as body text, never as data, never as interactive text. Its exact size, weight, case and tracking are design-system values (`tokens/typography.css`); what this document fixes is that there is exactly one exception and this is it. A meaning-bearing overline additionally obeys `F7-11`.
  **Enforced by:** per-screen review — text below the floor is an overline micro-label or it is a defect.

- **F7-11** (P0, `docs/prd/foundations/F7-design-language.md`) — **Three colour roles are restricted, and the restriction is on the role rather than on the value.** The tertiary text role is decorative — timestamps and similar — and **never carries load-bearing text**; a meaning-bearing overline renders in the secondary text role instead. The warning tone **always sits on its tinted chip and never appears as bare foreground text**. A disabled state is never the only signal that something is unavailable. Two further restrictions that ruling `R19-C` originally imposed have since been **retired rather than relaxed** — the danger and secondary-text values were darkened at the token level to meet the contrast standard — and any caveat still attached to those two roles describes nothing.
  **Enforced by:** `T-FPLAT-023`'s adherence gate over the restricted roles, plus per-screen review of overline and warning usage.

- **F7-12** (P0, `docs/prd/foundations/F7-design-language.md`) — **Status is never conveyed by colour alone — always a label plus a mark.** Every domain status in the product (a lead's stage, a design's review state, a project stage, a payment state) renders as text plus a status dot drawn from the fixed status-to-semantic-colour map, so the status survives colour blindness, greyscale printing and a sunlit screen. The map itself is the design system's (the package ships a status component for exactly this reason); what is binding here is that no surface ever substitutes a colour for the word.
  **Enforced by:** the shared status component and per-screen review; the billing-state names of `docs/prd/modules/M12-platform-billing.md` obey it. *(Amended 2026-08-07 — this pointer also named "the sync-state chips of `T-FPLAT-014`", which were deleted `F4-24`'s per-record chips; `docs/prd/foundations/F4-data-integrity.md` §5 forbids any queued or unsynced marker on a record, so there are no sync chips to bind. The row's own text is unchanged and still names a sync state among its examples, so it is quoted as it stands under the never-paraphrase rule.)*

- **F7-13** (P0, `docs/prd/foundations/F7-design-language.md`) — **Interface colour and data colour are two separate systems and are never conflated.** A control is never styled with a data colour and a chart, heatmap or canvas overlay is never drawn in the interface accent. Data palettes used in the studio — roof identity, electrical strings, irradiance — must be **distinguishable under the most common colour-vision deficiency within each set**, and every data-colour encoding is paired with a second, non-colour channel: a label, a pattern or a position. Data colours are **never tenant-overridable**, because they carry engineering meaning rather than brand.
  **Enforced by:** studio screen review in `docs/tasks/MS-studio-a.md`, `docs/tasks/MS-studio-b.md` and `docs/tasks/MS-studio-c.md`, including colour-vision-deficiency simulation of each data palette.

- **F7-14** (P0, `docs/prd/foundations/F7-design-language.md`) — **The type system carries every script the product's languages need, at every sanctioned weight, with per-script line height, and every component absorbs text expansion.** Localization places four standing obligations on the visual system and F7 accepts them as its own: a matched script face bundled with the product rather than an operating-system fallback; that face present at **every** weight in `F7-08`'s sanctioned set with no synthesis; the type scale keeping its sizes while **line heights take a per-script adjustment**; and components — buttons, chips, table headers, step titles — sized to their content so that a substantially longer translation wraps or truncates with the full text still reachable, never overflowing and never clipping an amount or a unit. **The face is chosen (owner ruling 2026-08-04): Noto Sans Devanagari (OFL, free)** for the launch non-Latin script, with the design phase confirming weights and the pairing against the brand face; the obligations above bind it in full.
  **Enforced by:** `T-FPLAT-007`, which builds the bundled faces, the weights and the per-script line height, plus per-screen review for expansion.

- **F7-15** (P0, `docs/prd/foundations/F7-design-language.md`) — **There are no structural borders: hierarchy comes from luminance and soft shadow.** Surfaces separate because they differ in luminance from what is behind them and, where they float, carry a soft, wide, low-opacity shadow — not because a line has been drawn around them. The source states the governing rule as *"Hierarchy comes from luminance and softness, never from lines."* Exactly **one** exception exists: the dashed drop zone of a file upload. **A control is made findable by luminance, never by outlining it (owner ruling 2026-09-29, reversing the 2026-08-28 raised-control ruling).** A field is a **well**: it takes `--fill` and sits on the white page or sheet, so it reads darker than what holds it; a disabled field sinks to `--canvas-sunken` (the design system's open page, owner ruling 2026-09-29, pulled 2026-10-07 by `T-FPLAT-082a`). A white field on a white surface has no luminance left to spend, and that is the case the ruling exists to prevent. The focus ring (`F7-24`) is not a structural border. **A control that is not a field is the opposite of what holds it:** on the page or in a sheet it takes `--fill`, the open page's grey; inside a tile (`F7-49`) it takes `--surface`; an action is told from a field by its shape — a pill, never the field's rectangle. **A secondary button is raised, not filled: `--surface` at `--e2` on every ground** — the page, a sheet, a tile — as the design system's `Button` draws it (owner ruling D14 B, `T-M01-035`, 2026-10-07; built by `T-FPLAT-082c`). **A disabled control sinks to `--canvas-sunken`** on every ground, one step below the page and the tile alike. **Text inside a well is `--text-secondary` or stronger**: `--text-tertiary` measures 4.71:1 on `--fill` and 4.54:1 on `--canvas-sunken`. **A placeholder takes `--text-tertiary`, so it reads as a hint and never as a typed value (owner ruling 2026-10-08); on a disabled field's `--canvas-sunken` well it steps up to `--text-secondary`, where tertiary is at the floor's edge; a value and a label stay `--text-secondary` or stronger.** **The cost is on the record, measured:** `--fill` against the white page is **1.10:1**, below WCAG's 3:1 floor for information that identifies a control; the owner chose the well with that number in hand. Depth is blur and desaturation, never dimming. **A tint that holds a control is held as a tile is** — a banner, a panel's warning, error or information wash, a selected column: the control takes `--surface`, because white stands further from every tint than the well does (owner ruling 2026-09-30, measured: white on the warning tint 1.09:1, success 1.10:1, information and neutral 1.13:1, danger 1.14:1, the accent's subtle tint 1.16:1; `--canvas-sunken` on the same tints 1.00–1.05:1). The owner accepted the warning and success figures, below the 1.14:1 of `--canvas-sunken` on white that they were measured against (the field's `--fill` on white is 1.10:1), with those numbers in hand; the control's words carry it, as `F7-11` requires.
  **Enforced by:** per-screen review; the single sanctioned exception is the file-upload drop zone.

- **F7-17** (P0, `docs/prd/foundations/F7-design-language.md`) — **Two density modes exist and the choice is made by surface, not by breakpoint.** *Expressive* serves mobile, onboarding, authentication, dashboards, empty states and marketing surfaces; *Functional* serves data tables, long forms, kanban boards, inventory and reporting views, settings and administration. **Colour, type and every rule in this document are identical in both** — only spacing and radius change, and the functional mode remains borderless, keeps its pill controls and keeps the near-black primary action unchanged. The default is expressive on mobile and functional on desktop data screens; the correct density for the surface is a completion condition (`F7-43`, item 9).
  **Enforced by:** per-screen review against the surface's declared density (`F7-43` item 9).

- **F7-18** (P0, `docs/prd/foundations/F7-design-language.md`) — **Overlays blur the layer behind and fade it toward white — never a dark scrim.** When a sheet, modal, popover or menu opens, the content behind it recedes by blurring and lightening, so the user keeps their sense of where they are. No surface in the product darkens the page to focus attention.
  **Enforced by:** the shared overlay component and per-screen review of every sheet, modal, popover and menu.

- **F7-19** (P0, `docs/prd/foundations/F7-design-language.md`) — **One icon family, outlined, at one stroke weight, never mixed within a context.** Filled variants exist for exactly one purpose — the active item in the mobile navigation — and filled and outlined icons never appear together in the same context. **No icon font, no emoji, and no unicode character used as an icon**, anywhere in the product, including in content the product generates. Brand and AI affordances use the gradient object of `F7-06` rather than an outlined icon. Every icon-only control additionally carries the accessible label of `F7-26`.
  **Enforced by:** per-screen review of icon usage, plus copy review of generated content for emoji and unicode stand-ins (`F7-42`).

- **F7-20** (P1, `docs/prd/foundations/F7-design-language.md`) — **Photography is masked and never colour-treated.** Site photographs — the roof, its obstructions, the surroundings — are presented masked to the system's corner treatment and are **never colour-filtered, tinted or stylised**, because a designer reads them as evidence. There are no repeating background patterns and no full-bleed photographic surfaces anywhere in the product.
  **Enforced by:** per-screen review of every surface that renders site photographs.

- **F7-21** (P0, `docs/prd/foundations/F7-design-language.md`) — **One sheet grammar serves every editor in the product: a sheet on mobile, a side panel on desktop — sheets, not pages.** Editing something in context never navigates away from it. The same grammar carries every editor the product has — an obstruction's settings, a bill-of-materials line, a lead's detail, a filter set — and it carries progressive disclosure inside it (`F7-34`) so a chained or nested editor reveals itself a stage at a time with its live consequences visible rather than presenting every control at once.
  **Enforced by:** per-screen review — every module editor in `docs/tasks/**` uses the one sheet grammar. *(Amended 2026-08-07 — this pointer named "the sync centre of `docs/tasks/SHELL.md`" as its worked example; the sync centre screen `SCR-SHELL-04` was deleted by owner decision `D3` along with the offline/sync capability, and deleted `F4-23` with it.)*

- **F7-23** (P0, `docs/prd/foundations/F7-design-language.md`) — **The ten numbered interaction and accessibility rules are product law, carried unchanged.** The source is explicit that they are *"never renumber, never reword"*, so they are reproduced verbatim below the table and bind every surface in the suite: **N1** no hover-only meaning · **N2** targets ≥44×44 · **N3** 12px floor (overline exception) · **N4** contrast verified not eyeballed · **N5** accessible names + focus trap/restore · **N6** UI vs data colour · **N7** provenance tier on every number · **N8** destructive actions confirmed AND undoable, undo thumb-reachable on mobile · **N9** no layout tuned to a fixed viewport · **N10** loading/empty/error/offline states are part of "done". N7's four tiers are `foundations/F8-data-honesty.md`'s and are closed there; N6 is `F7-13`; N3's exception is `F7-10`. **AMENDED BY OWNER RULING 2026-08-07: N10 is now three states — loading, empty, error.** The offline capability was removed from the product, so an `offline` state has nothing to describe. The N-set is carried under *"never renumber, never reword"*, so N10 is **not rewritten in the verbatim blockquote below** — it is amended here by ruling, exactly as `R19-B` amended N3 and recorded it at `F7-10`. The blockquote preserves the source's wording; this cell states what binds. **AMENDED BY OWNER RULING 2026-08-31: where an act CANNOT be undone by the person who did it, `N8` is satisfied by a confirmation that carries the RECOVERY ROUTE IN WORDS**, on both the confirm and the after-state. `SCR-M01-08`'s decline voids the invite and notifies the owner — the invite is gone and someone else has been told, so no undo the invitee can operate exists. A grace window before the write was refused: it holds a destructive server write in limbo and delays another person's notification, and an undo that only half-works is worse than a stated route. The confirm and the after-state both say *Rajesh can invite you again*. This narrows nothing where undo IS possible — there `N8` binds in full, undo thumb-reachable.
  **Enforced by:** per-screen audit against the ten rules; N7's tiers are supplied by `T-FPLAT-026`, N6 by `F7-13`, N10 by the Definition of Done of `F7-43`.

- **F7-24** (P0, `docs/prd/foundations/F7-design-language.md`) — **Focus is always visible, and it is never removed.** Every interactive element shows the system's focus ring at the system's offset whenever it is focused, on both platforms and for every input method. Inputs are borderless wells (`F7-15`). Focus is the 1.5px accent ring on the well's own edge, inside it, on both platforms: a ring outside would widen a row of code cells past a 375px screen, and on the white page its gap would vanish (owner rulings 2026-09-29 and 2026-10-07). An input in error carries an inset danger ring. It is one ring, so while an input in error has focus the focus ring takes it, the error's words stay under the field, and the danger ring returns on blur (owner ruling 2026-10-07, `T-FPLAT-082a` D11). No surface, no density mode and no third-party component suppresses the ring.
  **Enforced by:** the shared input and focus-ring components on both platforms, plus per-screen keyboard review (`F7-43` item 3).

- **F7-25** (P0, `docs/prd/foundations/F7-design-language.md`) — **Modals and sheets move focus in, keep it inside, and give it back — on both platforms.** When an overlay opens, focus moves into it; while it is open, keyboard and assistive-technology focus cannot escape behind it; when it dismisses, focus returns to the control that opened it. This is stated for both platforms because the source states it for both, and because a sheet is the product's most common editing surface (`F7-21`).
  **Enforced by:** the shared overlay component on both platforms, plus per-screen assistive-technology review.

- **F7-27** (P0, `docs/prd/foundations/F7-design-language.md`) — **Every data table carries a caption.** The reason is commercial rather than stylistic and is carried from the source: the bill of materials and the quote are commercial documents, and an anonymous table in a document a customer may hold is a defect. A caption names what the table is and, where the table is filtered or scoped, what it currently shows.
  **Enforced by:** per-screen review of every table surface and of every generated document that carries a table.

- **F7-28** (P0, `docs/prd/foundations/F7-design-language.md`) — **Numeric entry commits on blur with an explicit confirm or cancel — never on keystroke — and it is always available beside every gesture.** A number a user types takes effect when they finish, not while they are typing, and on a mobile keyboard the commit is an explicit action. The second half is the one that makes the product usable with a fingertip: **wherever a value can be set by dragging, pinching or nudging, typing it exactly is also available** — the precise path is never gesture-only.
  **Enforced by:** the shared numeric-entry component, plus review of every canvas and gesture-set value in `docs/tasks/MS-studio-a.md`, `docs/tasks/MS-studio-b.md` and `docs/tasks/MS-studio-c.md`.

- **F7-29** (P0, `docs/prd/foundations/F7-design-language.md`) — **The touch contract binds every interactive surface, and the canvases share one gesture vocabulary.** Four clauses, carried whole. *(a) Capability, not width* — build for pointer events and branch on **input capability, never on screen width**. *(b) One vocabulary* — the satellite canvas, the layout editor and the 3D scene use the same gestures: one-finger pan, pinch to zoom, two-finger rotate, tap to select, long-press for contextual actions, drag with snapping, two-finger tap to undo; and **no function is reachable only by wheel, middle-click or keyboard**. *(c) Precision under a fingertip* — magnification, offset dragging, snap-then-nudge, always-available numeric entry (`F7-28`) and an explicit commit. *(d) Reachability* — primary actions sit in the lower third of a phone screen, a destructive action is **never adjacent to a primary one**, and undo stays persistently reachable while any canvas tool is active. One gesture is one undo step.
  **Enforced by:** review of the canvas surfaces built in `docs/tasks/MS-studio-a.md`, `docs/tasks/MS-studio-b.md` and `docs/tasks/MS-studio-c.md` against the four clauses, on a phone.

- **F7-30** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 1 — mobile-first at 375 px, with full parity and no reduced edition.** Every screen in the product is designed at the small viewport first and expanded to the desktop one; the small screen is the design constraint, not a cut-down variant of a desktop design. **Every feature is present on both** — including the 3D design studio, which the source names as *"the hardest and least negotiable commitment in the system"* and which owner directive 9 protects absolutely: *"no studio feature is dropped on any surface."* Both viewports render without horizontal scrolling, and this is a completion condition (`F7-43`, item 1), not an aspiration.
  **Enforced by:** per-screen review at 375 px and 1536 px with full parity, recorded on every brief in `docs/ux/briefs/**` (`F7-43` item 1).

- **F7-31** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 2 — parity is symmetric: the web experience stays full-featured and the mobile experience feels native and extremely fast.** Mobile-first is a design order, not a hierarchy of investment. The owner's mandate is carried whole: *"Mobile-first DOES NOT mean web is compromised. Every feature must work beautifully on web and mobile. The mobile experience should feel native and extremely fast. The web experience should remain full-featured."* Neither surface is the reduced edition of the other; neither is allowed to be the one that ships later.
  **Enforced by:** per-screen review of both platform implementations, and release review that neither surface ships later than the other.

- **F7-32** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 3 — touch-first, including the flagship.** Touch is the primary input the product is designed for, not an adaptation layer over a pointer design: mode-based canvases rather than modifier keys, selection that promotes an object to large handles, snapping and nudging in place of pixel-accurate dragging, and no meaning that exists only on hover. The full contract is `F7-29`; the principle is what it means for planning — a feature is not designed until it is designed for a fingertip, and the studio is included rather than excepted.
  **Enforced by:** per-screen review with a fingertip alone, the studio included.

- **F7-33** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 4 — one record that travels, and navigation follows the record.** The product replaces a re-keying pipeline with a single record that moves from enquiry through survey, design, proposal, customer link, follow-up, project and money. The interface obligation that follows is concrete: a user reaches the next stage **from the record**, not by leaving it and entering another module; the record's identity, its customer and its current state stay visible as it moves; and **nothing a person has already told the product is ever asked for again** to cross a stage boundary. Modules are an authoring concept, not a navigation model.
  **Enforced by:** navigation review across the module briefs in `docs/ux/briefs/**` — the next stage is reached from the record and nothing already captured is asked for again.

- **F7-34** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 5 — progressive disclosure: never present the whole control surface at once.** A screen shows what the user needs for the decision in front of them and reveals the rest as they go. The source names the worked failure: *"The BOM screen presents ~286 controls at once"* — and rules that the answer is disclosure, *"not a smaller font"*. The same law shapes chained editors (each stage revealed with its live consequence, `F7-21`), teaching empty states that show a new user what to do rather than apologising for emptiness, and onboarding that asks for the minimum needed to produce one real quote and collects the rest when it is actually needed (`OV-33`).
  **Enforced by:** per-screen review of control density at the moment of the decision, over the briefs in `docs/ux/briefs/**`.

- **F7-35** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 6 — honesty is a UI pattern, not a disclaimer.** Every honesty law in `foundations/F8-data-honesty.md` has a visible form, and the visible form is the requirement: a **provenance tier** rendered beside every user-visible number, **source labels** on energy figures, a **provisional or staleness treatment** on money and on any output whose inputs have moved, an **indicative banner** on a priced document built without a design, and a **structural disclaimer** travelling with structure-bearing output. All of them render as persistent, legible content **adjacent to the number they qualify — never as a tooltip, never behind a tap, never hover-only** (N1, `F8-07`, `F8-31`). A surface that cannot carry the label does not get to carry the number instead.
  **Enforced by:** `T-FPLAT-026`, `T-FPLAT-027`, `T-FPLAT-028` and `T-FPLAT-029`, which produce the tier, source, staleness and disclosure values; the adjacency and persistence of the rendering is enforced per screen.

- **F7-37** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 8 — the source's speed budgets are product requirements, and the interface is measured against them.** Two are carried from the source as binding: **a lead is added in under thirty seconds on a phone**, and **a remote survey reaches a sendable proposal in under ten minutes**. They are requirements on the *experience*, not on a server: the number of fields, taps, screens and confirmations between intent and done is what determines whether they hold, so any design that adds a step to either path is measured against the budget before it ships. Where a design cannot meet the budget, that is a finding to record, not a number to quietly restate.
  **Enforced by:** measurement of the two named paths at review — the lead-add flow of `docs/tasks/M02-crm-leads.md` and the remote-survey-to-proposal path of `docs/tasks/M04-survey.md` and `docs/tasks/M06-proposals.md`.

- **F7-38** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 9 — consistency and stability over cleverness.** Where a problem has already been solved somewhere in the product, it is solved the same way again: one sheet grammar, one gesture vocabulary, one status treatment, one empty-state pattern, one error voice. A novel interaction must be *better enough* to justify the cost of being learned twice, and this principle is the standing tie-breaker whenever a proposed enhancement trades familiarity for ingenuity.
  **Enforced by:** cross-module design review whenever two modules solve the same interaction problem.

- **F7-39** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 10 — cross-platform parity is structural, not aspirational.** Every shared visual component exists as a **web-and-native pair satisfying one shared contract, shipped in the same change**. A component that exists on one platform only, or whose two implementations drift because they were changed at different times, is a defect rather than a backlog item — this is what makes `F7-30` and `F7-31` hold in practice instead of degrading release by release.
  **Enforced by:** release review — a shared component's web and native implementations ship in the same change.

- **F7-40** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 11 — every carried-over v1 UX decision must earn its place, in writing.** V2 redesigns the experience from first principles, so a pattern that survives from v1 survives **because it is objectively better**, not because it exists. A carried decision is marked *carried-because-better* where it appears, with its reason. Three are carried and marked in this suite. (a) **The component-selection pattern** — the worked example: the accordion sections with three entry paths per component and compliance badges in the picker, validated against the studio census and against four competitors, none of whom offers the self-serve datasheet route (design spec §10, `DD12`). (b) **The honesty UI** — provenance badges, money-staleness treatment and indicative labelling (`F7-35`), carried because no rival prints defensible numbers. (c) **The two shells and the sheet grammar** (`F7-21`, `F7-22`), carried with their reasons stated and with the parts that did not survive — the arc and its raised centre, and the centre's original colour — named. Anything carried without this justification is a finding for the closure pass.
  **Enforced by:** review of every carried v1 pattern for its written carried-because-better reason, at the closure pass.

- **F7-41** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 12 — no screen is designed only in English.** Every screen is rendered and reviewed in a non-Latin launch language before it is considered done, because *"English-only design that gets translated later always breaks — and the breakage is invisible until it ships."* This is a completion condition (`F7-43`, item 7) and the practical enforcement of `F7-14`: the script, the line height and the text expansion are checked on the real screen, at both viewports, in the densest surfaces the module owns.
  **Enforced by:** the per-screen Definition of Done (`F7-43` item 7) at both viewports; the same obligation as `F3-18`.

- **F7-42** (P0, `docs/prd/foundations/F7-design-language.md`) — **The product's voice is plain, direct, short and in sentence case, and its buttons are verbs.** A button says what it does — "Schedule survey", "Approve design", "Mark installed" — and never "Submit", "OK" or "Click here". An error **states the problem and the fix**, never blames the user, and never shows a code to a field user. Empty states are encouraging rather than apologetic and teach the next action (`F7-34`). Domain vocabulary is used correctly and consistently (the ruled term for the commercial document is *Proposal* everywhere, `OV-35`/`F3-11`); numbers always carry their units; prose lines stay short enough to read; **no emoji appear anywhere in the product**, including in generated content.
  **Enforced by:** copy review of every brief in `docs/ux/briefs/**` and of all product-generated content.

- **F7-43** (P0, `docs/prd/foundations/F7-design-language.md`) — **A screen is done only when it satisfies every item of the per-screen Definition of Done — violating any single item means it is not done.** The twelve items, carried whole: (1) works at the mobile and desktop viewports with **no horizontal scroll**; (2) all three base states present — loading, empty and error *(amended by owner ruling 2026-08-07: this item read "all four states present — loading, empty, error and offline"; the offline capability was removed from the product, and the 2026-08-07 sweep struck `offline` from the list without correcting the count, leaving the item self-contradicting until now)*; (3) keyboard-operable with visible focus; (4) contrast verified, including the restricted roles of `F7-11`; (5) every target meets the minimum size; (6) the light theme correct; (7) rendered in a non-Latin launch language and checked, with the layout surviving the script and its expansion; (8) **every user-visible number carries its provenance tier**; (9) density correct for the surface; (10) zero raw colour literals and zero off-scale values; (11) tested at realistic volume — a long list, a full bill of materials, a large design — rather than at demo volume; (12) **wired into the flows that reach it — no orphan screens.**
  **Enforced by:** screen review — the twelve items are the completion gate every brief in `docs/ux/briefs/**` is checked against. *(Item 2 re-pulled verbatim 2026-08-07: the live row now reads "all four states present — loading, empty and error" after the owner ruling that removed the offline capability from the product removed the `offline` state. The cell's own count word is carried unchanged under the never-paraphrase rule; `F7-23`'s N10 clause states what binds — three states.)*

- **F7-44** (P0, `docs/prd/foundations/F7-design-language.md`) — **The Definition of Done applies unreduced to the 3D design studio.** No item is waived, softened or deferred for the flagship: it is light like everything else, it carries its three base states *(amended by owner ruling 2026-08-07 to the three-state count; see `F7-43` item 2)*, it carries provenance on every number, and it holds full parity at the mobile viewport — which the source calls *"the hardest and least negotiable commitment in the system."* The studio's own tool census remains its separate acceptance gate and never shrinks., it carries provenance on every number, and it holds full parity at the mobile viewport — which the source calls *"the hardest and least negotiable commitment in the system."* The studio's own tool census remains its separate acceptance gate and never shrinks.
  **Enforced by:** the same twelve-item gate applied unreduced to the studio screens of `docs/tasks/MS-studio-a.md`, `docs/tasks/MS-studio-b.md` and `docs/tasks/MS-studio-c.md`.

- **F7-45** (P0, `docs/prd/foundations/F7-design-language.md`) — **A registered UX gap is closed only when its screen ships wired into its flow, complete — and closing it is a design-at-implementation act, not a new design phase.** Each of the source's registered gaps is designed by the implementing team **directly in the design system, inside the owning module's slice**; the register's own rule is that there is *"no new Claude-Design phase."* A gap is closed when the screen exists **wired into its flow (never orphaned)**, with loading, empty and error states, at both viewports, with the light theme correct — the Definition of Done, applied to a gap. Rows are marked closed and **never deleted**; new gaps are appended in the same form. The one gap this rule could not close — the missing brand mark (`F7-05`) — was closed by the owner instead (ruling 2026-08-04: letter-tile at launch, commissioned logo post-launch).
  **Enforced by:** the owning module's slice closing each registered gap with a wired, complete screen; gap rows are marked closed and never deleted.

- **F8-01** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **Every user-visible number carries exactly one provenance tier.** Not most numbers, not the headline numbers — every number a user can read, on every surface named in §2, including numbers inside generated documents and numbers spoken aloud. A number whose tier cannot be established is not rendered as a number; the surface shows what is missing instead. **What counts as a number here is a quantity — something a reader could add up, compare or act on. An identifier is not one, and carries no tier (owner ruling 2026-08-28):** a tax registration, a bank account number, an invoice number, a phone number, a one-time code. Applying the four tiers to one produces nonsense — `estimated` on a GSTIN claims a guess nobody made, `measured` claims a verification nobody performed — and this row's own remedy proves the scope, because refusing to render a correct registration number and showing *what is missing* instead would be false. **Where an identifier has been checked, the surface states what was checked and what was not**, in prose beside the value, which is the mechanism `F8-03` already requires — never as a fifth tier and never as a parallel standing. `M01-25`'s live tax-registration check is the worked case: the format was checked, the issuing authority was not, and the screen says so.
  **Enforced by:** the format layer's `QualifiedAmount`, which cannot be built without a tier (`packages/domain/src/format/qualified.ts`); the design system's closed `Provenance` label (`T-FPLAT-072`); and screen review of every brief in `docs/ux/briefs/**` — a quantity with no tier beside it, or an identifier given one, is not done.

- **F8-05** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **A tier change is shown, never silent.** When a number's provenance improves or degrades — a proposal built without a design later gets one, a source of record becomes unavailable and a fallback takes over, a survey moves from remote to on-site — the product states what changed before committing it, and the new tier is visible where the number is read. Energy figures in particular "never silently switch source".
  **Enforced by:** the rows that own each tier-changing flow, each stating the change before it commits — `M04-37` (a physical visit upgrades a remote survey), `M06-47` (a Path B proposal offered an upgrade once a design exists) and `F8-09` in `T-FPLAT-027` (the energy source's fallback) — checked at the review of those screens; the design system's `VersionDiff` already treats a tier change as a change (`packages/ui/src/components/VersionDiff/VersionDiff.resolve.ts:27`).

- **F8-06** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **Number-honesty is platform behaviour and is never a tenant configuration surface.** The source draws the line explicitly against the fully tenant-configurable voice agent: the product's own number-honesty — provenance labels, and estimates never printed as calculations — governs the proposal and design *output*, not anyone's speech, and is therefore not the tenant's to shape. No preset role, no permission, no plan entitlement, no white-label setting and no template edit can remove, weaken, rename or hide a provenance tier, a source label, a staleness state or a disclosure required by this document.
  **Enforced by:** the F2 matrix, where no row may exist for editing, suppressing or overriding a tier, a source label or a staleness state (F8's Permissions paragraph); and the review of every preset, entitlement, white-label and template surface — none may name a tier, a source label, a staleness state or a disclosure as a setting.

- **F8-07** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **Labels are readable, not decorative, and never hover-only.** A tier, a source label, a staleness state or an honesty caveat renders as persistent, legible content beside the number it qualifies — not as a tooltip, not as a hover state, not as a colour difference alone, not as a footnote the reader must seek out. The source states the failure mode it is guarding against directly: the caveat is on the screen, not in a tooltip.
  **Enforced by:** the design system's `Provenance` label, whose tier always prints its word — `T-FPLAT-072` removed its one colour-only form, `withLabel={false}`; screen review for the label's place beside its number, as `F7-35` already states.

- **F8-11** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **A model's documented limits travel with the model's outputs.** Where a computed output is produced by a model with known, documented limitations, those limitations are stated where the output is read — at every scale and on every surface, not only in a specification. Decorative scene elements that do not participate in a computation say so plainly rather than implying they were considered. Faster computation never changes what the physics claims.
  **Enforced by:** the review of each surface that prints a shading output, where the limit text of `M05-94` (itself a law) must sit beside it at every scale — the Step 6 Layout Editor (`T-MS-205`), the Step 7 Proposal sheet (`T-MS-260`) and the Proposal Document (`T-M06-017`), each carrying an owed line; and `MS6-32` in `T-MS-206` — a decorative scene element states it casts no shadow. The model and its limit text are M05's (F8's own source pointer).

- **F8-15** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **A sent document keeps the versions it was built with, forever.** Once a priced document has been shared with a customer, its figures never move: it keeps the rate versions, catalog release and pack version pinned at generation, and a later price change produces a *new* version of the document rather than editing the sent one. The customer's copy and the tenant's copy of the same sent document always agree.
  **Enforced by:** `T-M06-025`'s version record, where a shared version's figures and pins are never updated (`M06-43`) and its figures qualify as a record, `freshness: null`, so they keep their standing; and `F5-40`'s link, which renders the version already shared. `T-M06-025` carries an owed line; `T-FPLAT-028`'s `freshnessOf` compares pins and never writes to them.

- **F8-18** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **A stale output says so where it is read, and offers the corrective action.** The staleness state is visible on the object itself — in the list, on the detail screen, in the customer-facing rendering — and is accompanied by the action that resolves it (recompute, regenerate, or open the newer version). "Stale" is never communicated only by absence, only by a colour, or only after the user tries to send.
  **Enforced by:** the proposal detail (`T-M06-018`) and list (`T-M06-019`), each printing the `Freshness` of `T-FPLAT-028` beside its corrective action, and the provenance label that prints the stale state beside the tier (`T-FPLAT-073`) — each carrying an owed line; and the studio's own surfaces under the `M05-10` and `M05-11` laws.

- **F8-19** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **Staleness is not only a money rule: any artifact produced before a change is stale and must say so.** Captured views, rendered sheets, generated drawings and exported files carry what they were produced from; when their inputs have moved on, they are labelled stale rather than presented as a current picture, and the reader is told what changed since.
  **Enforced by:** each artifact's own task pinning the design fingerprint it was made from (`InputPins.design`) and comparing it through `T-FPLAT-028`'s `freshnessOf` — the capture, `T-MS-261` (`MS7-09`, under the `M05-60` law), which carries an owed line; each export's own slice the same way.

- **F8-24** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **One figure, one source: every rendering of the same figure shows the same value, tier and disclosure.** The screen, the generated document, the customer link, the export and the voice agent's spoken version of a figure are renderings of one computed value — they do not recompute independently, round differently, or drop a qualifier that the other renderings carry. A disagreement between two renderings of the same number is a defect, not a display difference.
  **Enforced by:** `QualifiedAmount` (`T-FPLAT-026`), the one payload — value, text, tier, standing, disclosure, energy source, freshness and, from `T-FPLAT-029`, projection — formatted once by `qualifyMoney`, which each rendering reads whole and never recomputes; and the review of each rendering that prints it: the document `T-M06-017`, which carries an owed line, the customer link (`F5-05`), each export's own slice, and the voice agent's spoken figure under M07's §4 contract with F8.

- **F8-25** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **The product never computes structural adequacy — at any scale, on any surface, for any segment.** No output states, implies or scores whether a structure, foundation, roof or mounting system is safe or sufficient. Structure-related outputs are material estimates and visual models: a bill of material quantities and a geometric representation, never a wind, uplift, load-path or roof-capacity verdict. The largest and the smallest job are treated identically.
  **Enforced by:** the review of every structure-bearing surface — the studio's structure, sheets and BOM (`docs/tasks/MS-studio-b.md`, `MS-studio-c.md`), the installation checklist (`SCR-M08-04`) and the documents (`T-M06-017`) — where no output may state, imply or score adequacy; `T-FPLAT-030`'s `signOffOf`, which records a human decision and never computes one; and the `F8-28` statement those surfaces carry. No capability row grants adequacy as a computation (`F2`).

---

## Realized elsewhere

These rows are screen rows: their verbatim text is the specification of a screen another bucket owns, and it lives in that screen's brief. They are carried here with their pointers so the bucket's row set is complete.

- **F3-03** (P0, `docs/prd/foundations/F3-localization.md`) — **Every user can reach a language picker, at first run and afterwards.** It appears in onboarding on first run and permanently in the user's own profile and preferences — reachable by every persona on both platforms. It lists each language **in that language's own script and name, never translated into the current language**, and it defaults to the device's language when that language is in the set.
  **Realized by:** `docs/ux/briefs/SCR-M01-03-onboarding-language.md` and `docs/ux/briefs/SCR-M01-11-profile-preferences.md` → `docs/tasks/M01-onboarding.md`. The picker itself is M01's screen; the language set it lists and the device-language default it applies come from `T-FPLAT-005`, and the readiness gate that decides which languages it may offer is `T-FPLAT-009`.

*(Three F4 rows were carried in this section and are struck from it 2026-08-07, with the offline/sync capability that created them. **`F4-22`**, the persistent global sync indicator with its counts sentence and its last-sync time, is killed by name — `docs/prd/foundations/F4-data-integrity.md` §5 ("no global connection indicator"), owner decision `D7`, and the amended `SCR-SHELL-01` brief; nothing is ever waiting, so there is nothing to state, and `docs/tasks/SHELL.md` `T-SHELL-001` loses that element entirely. **`F4-23`**, the sync centre, lost its screen: `SCR-SHELL-04` was deleted by owner decision `D3` and §5 forbids a sync surface; the per-item retry it hosted survives only for photographs and only on the capture screen, where live `F4-21` and `M04-55` place it — `SCR-M04-07` "and nowhere else". **`F4-35`**, "an application too old to sync still reads", was built entirely on the sync contract — the trigger is a sync-contract change and the mitigation is that local reads keep working — so with no local store the soft lockout it required is impossible rather than merely unnecessary; the owner deleted its only screen for exactly that reason (`D4`: `SCR-SHELL-05` "existed only for `F4-35`"). No row id is renumbered and none of the three appears in the Disposition index, which the same sweep cleared.)*

- **F6-12** (P1, `docs/prd/foundations/F6-notifications-and-search.md`) — **Grouping: standard events group; nothing important hides.** The centre groups same-type events on the same subject class ("3 proposals opened today") with each item still individually reachable; immediate-class events (F6-13) never group. Grouping is presentation only — every record still exists individually (F6-06).
  **Realized by:** `docs/ux/briefs/SCR-SHELL-03-notification-center.md` → `docs/tasks/SHELL.md` `T-SHELL-003`. The grouping is presentation over `T-FPLAT-017`'s records; the immediate class that never groups is registered by `T-FPLAT-018`.
- **F6-17** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **One notification centre: the bell, the badge, the list.** The badge counts unread from the record (never from push state); the list renders grouped per F6-12, filterable by type-group and read state, newest first; every item deep-links and offers its one-step act where the recipient holds it (F6-02).
  **Realized by:** `docs/ux/briefs/SCR-SHELL-03-notification-center.md` → `docs/tasks/SHELL.md` `T-SHELL-003`. The badge count, the read state, the filters and the one-step act each item offers come from `T-FPLAT-017` and `T-FPLAT-019`.
- **F6-20** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **One global search box, everywhere:** finds **leads, customers, sites, proposals, projects and catalog items** — by name, phone or city — plus **people** (employee records) within the searcher's people-records scope. One box in the app shell on web and mobile; results grouped by entity type; every result deep-links. *(The journey's own list says "quotes" — rendered here as proposals per the naming ruling, with the alias law at F6-22.)*
  **Realized by:** `docs/ux/briefs/SCR-SHELL-02-global-search.md` → `docs/tasks/SHELL.md` `T-SHELL-002`. The entity coverage, the grouping, the scope enforcement and the deep links come from `T-FPLAT-020`.

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
| F3-03 | realized-by: T-M01-003, T-M01-011 — `docs/ux/briefs/SCR-M01-03-onboarding-language.md` + `docs/ux/briefs/SCR-M01-11-profile-preferences.md` → `docs/tasks/M01-onboarding.md` |
| F3-04 | T-FPLAT-005 |
| F3-05 | T-FPLAT-005 |
| F3-06 | T-FPLAT-005 |
| F3-07 | T-FPLAT-005 |
| F3-08 | T-FPLAT-006 |
| F3-09 | T-FPLAT-007 |
| F3-10 | T-FPLAT-006 |
| F3-11 | T-FPLAT-058 |
| F3-12 | T-FPLAT-026 |
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
| F4-04 | T-FPLAT-070 |
| F4-07 | T-FPLAT-011 |
| F4-14 | moved to T-M04-015 (`docs/tasks/M04-survey.md`) |
| F4-15 | moved to T-MS-367 (`docs/tasks/MS-studio-c.md`) |
| F4-16 | moved to T-M02-012 (`docs/tasks/M02-crm-leads.md`) |
| F4-17 | moved to T-M04-015 (`docs/tasks/M04-survey.md`) |
| F4-19 | moved to T-M02-012 (`docs/tasks/M02-crm-leads.md`) |
| F4-21 | moved to `docs/tasks/M04-survey.md` T-M04-017 (the module that captures photographs, Law 9) |
| F4-25 | T-FPLAT-014 |
| F4-27 | LAW |
| F6-01 | T-FPLAT-017 |
| F6-02 | T-FPLAT-017 |
| F6-03 | LAW |
| F6-04 | LAW |
| F6-05 | T-FPLAT-017 |
| F6-06 | T-FPLAT-017 |
| F6-07 | T-FPLAT-017 (also read by T-FPLAT-019) |
| F6-08 | T-FPLAT-017 |
| F6-09 | T-FPLAT-017 |
| F6-10 | T-FPLAT-018 |
| F6-11 | T-FPLAT-018 |
| F6-12 | realized-by: `docs/ux/briefs/SCR-SHELL-03-notification-center.md` → `docs/tasks/SHELL.md` `T-SHELL-003` |
| F6-13 | T-FPLAT-018 |
| F6-14 | T-FPLAT-018 |
| F6-15 | T-FPLAT-018 |
| F6-16 | T-FPLAT-018 |
| F6-17 | realized-by: `docs/ux/briefs/SCR-SHELL-03-notification-center.md` → `docs/tasks/SHELL.md` `T-SHELL-003` |
| F6-19 | T-FPLAT-019 |
| F6-20 | realized-by: `docs/ux/briefs/SCR-SHELL-02-global-search.md` → `docs/tasks/SHELL.md` `T-SHELL-002` |
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
| F7-46 | T-FPLAT-061 |
| F8-01 | LAW |
| F8-02 | T-FPLAT-072 |
| F8-03 | T-FPLAT-072 |
| F8-04 | T-FPLAT-026 |
| F8-05 | LAW |
| F8-06 | LAW |
| F8-07 | LAW |
| F8-08 | T-FPLAT-027 |
| F8-09 | T-FPLAT-027 |
| F8-10 | T-FPLAT-027 |
| F8-11 | LAW |
| F8-12 | T-FPLAT-028 |
| F8-13 | T-FPLAT-028 |
| F8-14 | T-FPLAT-028 |
| F8-15 | LAW |
| F8-17 | T-FPLAT-028 |
| F8-18 | LAW |
| F8-19 | LAW |
| F8-20 | T-FPLAT-029 |
| F8-21 | T-FPLAT-029 |
| F8-22 | T-FPLAT-029 |
| F8-23 | T-FPLAT-029 |
| F8-24 | LAW |
| F8-25 | LAW |
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

### T-FPLAT-082 · The open page — the app's design tokens and components pulled level with the live design system
**Type:** port · **Tier:** P0
**Status:** shipped
**Why:** Every screen is drawn on the live design system, but the app draws with a snapshot of it pulled on 2026-08-19 plus partial pulls. The design system's open page (2026-09-29) made the page white and moved grey to the fill of fields, tiles and chips, restyled the fields, the phone header and footer and the list tiles, and added tokens the boards use (`--fill`, `--tile-pad`, `--r-tile`). Without the pull, no screen can match its board: a screen built now is built against values the design has already left.
**PRD rows:** none of its own — the design system is the visual authority (`F7`); `docs/engineering/17-ui-architecture-v2.md` §6 owns the pull.
**Design:** none — no screen of its own; each part checks the built screens it touches against their boards.
**Depends on:** `T-FPLAT-023` (shipped — the adherence gate the pulled typings feed).

### T-FPLAT-083 · A route answers only what its contract declares
**Type:** policy · **Tier:** P1
**Status:** shipped
**Why:** A handler can throw a status its contract never declares, which response validation turns into an opaque 500 (D18); a route's `:param` need not declare its shape, so raw text reaches the database as a 500 (D29); and no route declares the shared 400, 403 and 500 the filter and guard really send, so the OpenAPI spec and the typed client understate every route (D30).
**PRD rows:** none of its own — `CLAUDE.md` §8, every boundary has a contract.
**DONE WHEN:**
- A Biome plugin refuses `throw new *Exception` inside a `tsRestHandler` block in `apps/api/`, with its `.claude/protections.md` row. → proof: `pnpm lint` green, and red on a planted throw.
- Every `:segment` in a contract path has a matching `pathParams` key. → proof: a unit test over `packages/contracts/src/`, red on a planted route.
- Every route's spec carries the shared 400 `VALIDATION_FAILED`, 403 and 500 `INTERNAL` from one declaration. → proof: `check:openapi` and a contract test.
- The api guard's `RouteAccess` stays the guard's own type (owner ruling, deferred review 2026-10-08, D71); its `biome-ignore` cites that ruling. → proof: `pnpm lint`.
- A contract route's `body`, `query` or `pathParams` is never a `z.union` or `.or()`, so a refusal names its key (D127). → proof: a Biome plugin, red on a planted line, with its protections row.

### T-FPLAT-084 · Every colour pair the components draw clears its contrast floor
**Type:** policy · **Tier:** P0 (`F7-11`, `N4`)
**Status:** shipped
**Why:** The theme build measures only the pairs declared in `packages/theme/src/contrast.ts`, so a pairing `packages/ui` draws but never declares, or a re-pulled colour, can drop under its floor unseen (D25).
**PRD rows:** `F7-11`; `N4` of `F7-23`.
**Depends on:** `T-FPLAT-082` (part h, its last part — split by `T-FPLAT-082c`'s ruling C1, `T-FPLAT-082f`'s ruling F2 and `T-FPLAT-082g`'s ruling G2).
**DONE WHEN:**
- A check — a theme build step or an invariant, never a script — reads every text and mark colour set on a background across `packages/ui`'s CSS and native styles, reports each pair no declared pair covers, and fails one under its role's floor. → proof: the gate green, and red on a planted undeclared pair under the floor.

### T-FPLAT-085 · A repeat is harmless
**Type:** policy · **Tier:** P1
**Status:** shipped
**Why:** The invite SMS leaves inside the create transaction, so a failed commit can leave a dead link and a retry sends a second SMS (D36); an accept sent twice answers the second time as a conflict though the join ran (D37); a save of an unchanged value writes a second audit entry and moves the authorization version (D38).
**PRD rows:** none of its own — `F4` data integrity (one act, one record).
**DONE WHEN:**
- The invite SMS leaves after the commit, from the worker's outbox, keyed by the invitation id — once, and only for a stored invite. → proof: an api test with a failed commit sends nothing; a retry sends one.
- A repeat accept by the same person answers as the first did; an invite accepted by another number stays refused. → proof: api test.
- A replace whose new value equals the stored one writes and records nothing — every settings save and the role write. → proof: api tests, red on a planted second audit entry.
**Depends on:** none — the outbox, its sweep, the step host and every route this changes are on `main`.

### T-FPLAT-086 · A screenshot baseline holds every web route's look
**Type:** policy · **Tier:** P1
**Status:** shipped
**Why:** QA checks only the screens a change reaches, so a change to a shared `packages/ui` part can break the look of a screen nobody opens (D74).
**PRD rows:** none of its own — `F7-43` (Definition of Done at 375 and 1536).
**Depends on:** `T-FPLAT-082` (part h, its last part — split by `T-FPLAT-082c`'s ruling C1, `T-FPLAT-082f`'s ruling F2 and `T-FPLAT-082g`'s ruling G2), so the baseline is taken on the open page.
**DONE WHEN:**
- Playwright `toHaveScreenshot` holds every web route at 375 and 1536; the images are committed; a run fails when one differs; a baseline changes only with the owner's yes. → proof: the e2e lane green, and red on a planted one-token change to a shared part.

### T-FPLAT-087 · Dates and digits in the reader's language
**Type:** policy · **Tier:** P0 (`F3-21`, `F3-22`)
**Status:** shipped
**Why:** Every date prints its words in the market pack's locale, not the reader's language — "THURSDAY · 1 OCT 2026" in Hindi and Marathi (D97); and Marathi mixes digit systems, an ICU plural's `#` in Devanagari beside a plain `{count}` in Latin, against `F3-21` (D98).
**PRD rows:** `F3-21` (Latin digits in every language); `F3-22`, amended 2026-10-08 (a date's words follow the reader's language).
**Depends on:** none — the date formatters, `useFormat`, the i18n runtime and both screens it is proven on (the centre `T-SHELL-003`; the home, `apps/web/features/shell/HomeScreen.tsx` and `apps/mobile/src/screens/shell/ShellScreen.tsx`) are on `main`.
**DONE WHEN:**
- A date's month and weekday names follow the reader's language through `useFormat`; the order and style stay the pack's. → proof: unit tests of the date formatter in English, Hindi and Marathi; QA of the centre and home in Hindi and Marathi.
- Every number renders in Latin digits in every language, an ICU `#` and a plain `{n}` alike. → proof: a unit test of the i18n runtime over a plural and a count in Marathi.
