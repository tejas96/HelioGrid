# Traceability register

Purpose: the requirement ↔ source pointer index. Every source item catalogued in the Task 2
extraction ledger (D-decisions, R-rulings, journey stages/steps, studio-census entries, UX gaps,
competitive-gap verdicts, doc-level business rules) must appear here exactly once, mapped to
where it landed — a live PRD requirement, a register entry, or an explicit exclusion. This is the
register the §13 completeness gate is checked against.

Row format (one row per source key, appended by every task as it disposes of source material):

| source key | disposition | PRD ref |
|---|---|---|

- **source key** — a ledger key from the Task 2 extraction ledger, e.g. `D22`, `R9`, `S5.wrong.3`, `C8`, `UXG-11`, `CG-14`, `DOC16.softblock`.
- **disposition** — one of: `live` (present as a requirement in a module/foundation PRD), `superseded` (v1 text overridden — cite the overlay ruling), `excluded` (explicit non-goal, v1 rationale recorded), `conflict` (unresolved contradiction — also recorded in `conflicts.md`).
- **PRD ref** — the requirement ID(s) this source key landed as (e.g. `M02-31`, `F1-07`), or the register file it lives in instead (e.g. `registers/conflicts.md`, `registers/enhancements.md`).

## Task 3 — `01-product-overview.md`

Appended by Task 3. Requirement IDs in the root overview use the prefix `OV-<nn>`; where the
overview carries a source key as narrative rather than as a numbered requirement, the ref is a
section anchor (`01 §Glossary`, `01 §Non-goals`).

Two conventions used in this block, so the closure pass can read it unambiguously:

1. **`DOC00.*` is disposed of here in full.** The vision-and-scope document is the overview's
   own source, and its rows fan out across the suite. Every `DOC00.*` key therefore appears
   exactly once — here — with the ref naming the document that owns the detail; that document's
   task assigns the requirement ID and should **not** re-append the key.
2. **Shared keys are named once.** `CG-moat.*`, the `DOC01.*` positioning rows, `DOC03.mobile-scope`
   and `DOC07.ports-vendor-neutral` are recorded here because the overview states them. Their
   mechanics belong to the owning document named in the ref, which likewise should not re-append
   the key. Source keys the overview only *cites* as a pointer without disposing of them —
   `DOC16.softblock.*`, `DOC04.*`, `TC.*`, `S2.rule.dedupe`, `S6B.rule.honesty`, `S7.rule.my-day`,
   and the rulings `R1`/`R2`/`R5`/`R6`/`R9`/`R13`/`R14`/`R18` — are **not** listed below; they stay
   with their owning tasks.

| source key | disposition | PRD ref |
|---|---|---|
| `DOC00.product-definition` | live | `OV-01`, `OV-03` (globalized restatement: `OV-02`, `BRIEF`) |
| `DOC00.one-record` | live | `OV-04` |
| `DOC00.market-moment` | live | `04-business-model.md` (India market context; the cited `docs/research/market.md` is source gap #1 in `registers/conflicts.md`) |
| `DOC00.studio-flagship` | live | `OV-21` · detail in `modules/M05-design-studio.md` |
| `DOC00.honesty-conviction` | live | `OV-22`, `OV-38` · mechanism in `foundations/F8-data-honesty.md` |
| `DOC00.india-first-global-ready` | live | `OV-23` (V2 restatement `OV-24`, `BRIEF`) · pack framework in `foundations/F1-global-market-framework.md` |
| `DOC00.buyer-and-auth` | live | `OV-05`, `OV-06` (Google Login addition: `OV-07`, `BRIEF`) |
| `DOC00.nine-stage-backbone` | live | `03-journey-map.md` |
| `DOC00.customer-journey-parallel` | live | `OV-32` · lifecycle in `foundations/F5-customer-link.md` |
| `DOC00.tenant-config-scope` | live | `modules/M01-onboarding-and-tenant-config.md` |
| `DOC00.v1-entire-product` | live | `OV-43` — scope half live; the calendar attached to it in source is superseded by owner directive OD-5 and appears nowhere |
| `DOC00.outside-window` | live | `OV-44` |
| `DOC00.nongoal-projects-light` | excluded | `modules/M08-projects.md` §Non-goals (D9) · summarised at `01 §Non-goals` |
| `DOC00.nongoal-whatsapp-send` | conflict | `registers/conflicts.md` (SRC non-goal D32 vs `BRIEF` M03 campaign channels) · `modules/M06-proposals.md` + `modules/M03-marketing.md` · surfaced at `01 §Non-goals` |
| `DOC00.nongoal-custom-roles` | excluded | `foundations/F2-roles-and-permissions.md` §Non-goals (D28/D29; preset-only widened to ~12 presets per DD3) · summarised at `01 §Non-goals` |
| `DOC00.nongoal-measurement` | excluded | `modules/M04-survey.md` §Non-goals (D35) · summarised at `01 §Non-goals` |
| `DOC00.nongoal-discount-approval` | excluded | `modules/M06-proposals.md` §Non-goals (D34, superseding D19) · summarised at `01 §Non-goals` |
| `DOC00.nongoal-feature-flags` | live (as non-goal, `01 §6`) | `OV-27` (the non-goal stated positively as the entitlements-only gating principle) · `modules/M12-platform-billing.md` §Non-goals |
| `DOC00.nongoal-ppa-billing` | excluded | `modules/M06-proposals.md` §Non-goals (R17); bounds `modules/M11-payments-and-collections.md` · summarised at `01 §Non-goals` |
| `DOC00.nongoal-lead-channels` | conflict | `registers/conflicts.md` (SRC non-goal D13 vs `BRIEF` M03 campaign lead capture) · `modules/M02-crm-and-leads.md` + `modules/M03-marketing.md` · surfaced at `01 §Non-goals` |
| `DOC00.three-audiences` | live | `01 §Audiences & surfaces` · role semantics in `foundations/F2-roles-and-permissions.md` |
| `DOC00.customer-link-audience` | live | `OV-32`, `01 §Glossary` (Customer link) · lifecycle in `foundations/F5-customer-link.md` |
| `DOC00.voice-touchpoint` | live | `01 §Glossary` (Voice agent, Compliance gate) · `modules/M07-sales-execution.md` |
| `DOC00.demo-rooftop` | live | `modules/M01-onboarding-and-tenant-config.md` |
| `CG-moat.1` | live | `OV-37` · `modules/M07-sales-execution.md` + `foundations/F1-global-market-framework.md` (statutory ruleset is pack data, D36 amended) |
| `CG-moat.2` | live | `OV-38` · `foundations/F8-data-honesty.md` |
| `CG-moat.3` | superseded *(2026-08-07 — the claim's carrier row `OV-39` was **deleted** by owner ruling `Q61` along with `BM-05`'s public pricing-page feature line, "because a product that requires a connection cannot advertise an offline field app". The boundary this row pointed at is gone too: `R14` is superseded and `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1 makes the offline capability a non-goal. The residue — field photographs held on the device until they upload (`F4-21` / `M04-55`) — is a **recovery guarantee, not a differentiator**, and is not re-asserted as a moat claim here. The moat table's other five entries, `OV-37`, `OV-38`, `OV-40`, `OV-41`, `OV-42`, are untouched and keep their numbering)* | `registers/open-questions.md` `Q61` (records the deletion of `OV-39`) · the corresponding matrix key `CG-matrix.3` is excluded in the Task 10 block |
| `CG-moat.4` | live | `OV-40` · `foundations/F3-localization.md` + `foundations/F7-design-language.md`; number grouping is pack data in `foundations/F1-global-market-framework.md` |
| `CG-moat.5` | live | `OV-41`, `01 §Glossary` (Catalog, Catalog release, Price book) · `modules/M01-onboarding-and-tenant-config.md` |
| `CG-moat.6` | live | `OV-42`, `OV-29` · `04-business-model.md` |
| `DOC01.in-price-book` | live | `OV-25` (positioning) · mechanics in `04-business-model.md` |
| `DOC01.org-pays` | live | `OV-29` (positioning) · mechanics in `04-business-model.md` |
| `DOC01.gates-capacity-not-features` | live | `OV-28` (positioning) · tier axis in `04-business-model.md` |
| `DOC01.tier-positioning` | live | `OV-20` (positioning only — no tier names or price points in 01) · `04-business-model.md` |
| `DOC01.price-for-every-epc` | live | `OV-20` (positioning only — the entry-price anchor stays in 04) · `04-business-model.md` |
| `DOC03.mobile-scope` | live | `OV-08` · per-feature emphasis in each module's *Personas & surfaces* section |
| `DOC07.ports-vendor-neutral` | live | `OV-34`, `01 §Glossary` (Reference implementation) |

## Task 4 — `02-personas.md`

Appended by Task 4. Requirement IDs in the personas document use the prefix `PS-<nn>`; where the
document carries a source key as persona narrative rather than as a numbered requirement, the ref
is a section anchor (`02 §<Persona>`).

Two conventions used in this block, so the closure pass can read it unambiguously:

1. **Only keys this document disposes of are listed.** Task 4 read a great deal of source it does
   not own. The stage and screen keys behind the persona narratives — `S1.happy`, `S1.screen.1`–`.5`,
   `S1.wrong.1`–`.4`, `S2.*`, `S3.*`, `S4.*` (incl. `S4.screen.6`, `S4.screen.10`), `S5.*` (incl.
   `S5.screen.2`, `S5.screen.3`), `S6.*`, `S6B.*`, `S7.*` (incl. `S7.rule.my-day`, `S7.rec.1`),
   `S8.*` (incl. `S8.rule.roles`, `S8.screen.1`, `S8.screen.5`, `S8.screen.6`), `TC.*`, `AP.*`,
   `D2`, `D5`, `D9`, `D13`, `D14`, `D15`, `D17`, `D21`, `D32`, `D34`, `D35`, `D37`, `R1` — are
   **cited as pointers in persona pains and day-in-the-life narratives and are not disposed of
   here**. They stay with their owning module tasks.
2. **The roles-matrix keys stay with F2.** `D20`, `D27`, `D28`, `D29`, `DOC08.matrix.*`,
   `DOC08.six-roles`, `DOC08.roles-or`, `DOC08.no-per-user-exceptions`, `DOC08.min-owner` and
   `DOC08.deactivate-never-delete` were all read by Task 4 from the persona side and are
   dispositioned by Task 5 in `foundations/F2-roles-and-permissions.md` per that task's own append
   list. They are deliberately **not** duplicated here; the persona-side reading of the same
   material appears in `02` §2 and in the permissions summary of each persona section.
   `R16` is the one exception and is listed below under a third convention.
3. **Shared disposition (`R16`).** `R16` lands in two documents for two different halves of the
   ruling, so it is recorded once here for the persona half and is expected to appear once more in
   Task 5's block for the preset half. The row below is marked *shared* so the closure pass reads
   the pair as intentional rather than as a duplicate; Task 5's `R16` row carries the preset
   ruling and `modules/M08` carries the checklist behaviour.

| source key | disposition | PRD ref |
|---|---|---|
| `S1.rec.1` | live | `PS-01` (role decides the home screen) + the source-derived home rows `PS-07`, `PS-09`, `PS-11`, `PS-13`, `PS-16`, `PS-18` · the screens themselves are `modules/M13-dashboards-and-reporting.md` (role homes) with the first-run landing in `modules/M01-onboarding-and-tenant-config.md`; both carry this key's mechanics and should **not** re-append it |
| `D7` | live | `01 §2 Audiences & surfaces` (the three audiences) · `PS-04` (every persona sits inside one of them; none is the customer) · role semantics in `foundations/F2-roles-and-permissions.md` |
| `journey §ROLES & PERMISSIONS L1414–1479` *(no Task-2 ledger key — read directly from source per the Task 4 brief; its rules are keyed via `DOC08.matrix.*`)* | live | `02 §2` (v1 six presets → V2 twelve personas mapping) · `PS-03`, `PS-05`, `PS-06`, `PS-08`, `PS-10`, `PS-12`, `PS-15`, `PS-17` · the matrix itself in `foundations/F2-roles-and-permissions.md` |
| `journey §DASHBOARDS & REPORTS L1523–1572` *(no Task-2 ledger key — read directly; `D37` carries the governing rules and stays with `modules/M13`)* | live | `PS-07` (owner home = pipeline dashboard, attention list first) · `PS-09` (same dashboard, team-scoped — the source's only statement of a manager home) · screens in `modules/M13-dashboards-and-reporting.md` |
| `R16` | live *(shared disposition — see convention 3; the preset ruling is Task 5's row)* | `02 §Installation Team Member` — `PS-27` (no commercial figures on the installation surface), `PS-28` ("done by" attribution when the crew never signs in) · preset ruling → `foundations/F2-roles-and-permissions.md` (Task 5) · checklist behaviour → `modules/M08-projects.md` |

## Task 5 — `foundations/F2-roles-and-permissions.md`

Appended by Task 5. Requirement IDs in F2 use the prefix `F2-<nn>`; matrix rows use the row-key
convention `F2.M<nn>.<slug>` (defined at `F2-25`), which is what module PRDs and this register
point at for cell-level grants.

Conventions for reading this block:

1. **This block closes the keys Task 4's convention 2 held for Task 5** — `D20`, `D27`, `D28`,
   `D29`, the `DOC08.matrix.*` set, `DOC08.six-roles`, `DOC08.roles-or`,
   `DOC08.no-per-user-exceptions`, `DOC08.min-owner`, `DOC08.deactivate-never-delete` — plus
   `DOC08.midtask-permission`, `DOC08.audit-coverage`, `DOC08.audit-tenant-export` and
   `DOC08.admin-impersonation`, all ledger-mapped to F2.
2. **`R16` row per Task 4's convention 3 (shared disposition).** Task 4 carries the persona half
   (`PS-27`, `PS-28`); the row below is the preset half. The pair is intentional, not a
   duplicate. The checklist behaviour itself remains `modules/M08-projects.md`'s.
3. **One v1 key splits.** `DOC08.matrix.record-payments` ("Record payments, upload documents")
   is one v1 capability carrying two V2 rows in different module tables; its row below names
   both landing keys.
4. **Keys cited but not disposed here:** `D15` and the `S8.rule.roles` / `S8.screen.6` /
   `S5.wrong.6` / `AP.screen.4` / `TC.roles.1` stage keys are cited in F2 as grounding and stay
   with their owning module tasks (M04, M08, M05, M07/M13, M01 respectively). `D34` (no discount
   approval) is cited in `F2.M06.create-edit-proposals` and §5 Non-goals and stays with M06.
   `DOC00.nongoal-custom-roles` and `DOC00.three-audiences` were already dispositioned by
   Task 3 and are satisfied by F2 §5 / F2-18 without new rows.

| source key | disposition | PRD ref |
|---|---|---|
| `D20` | live | `F2-12` (visibility law, quoted verbatim) · cells at `F2.M02.lead-visibility` · scoping note at `F2.M13.company-reports` |
| `D27` | live | `F2-10` (stacking, quoted verbatim), `F2-11` (OR-across-roles), `F2-13` (widest wins) |
| `D28` | live | `F2-15` (no per-person exceptions, quoted verbatim) · restated in F2 §5 Non-goals |
| `D29` | live | `F2-16` (no custom roles, quoted verbatim; DD3 carries the position into V2), `F2-02` · restated in F2 §5 Non-goals |
| `R16` | live *(shared disposition — preset half; persona half in Task 4's block)* | `F2-05` (Installation Team Member preset, the R16-anticipated addition), `F2-06` (no commercial figures — surface law), `F2-07` (coordinator attribution + "done by"), `F2.M08.installation-checklist` |
| `DOC08.six-roles` | superseded *(preset count 6 → 12 per design spec §2 DD3; the fixed-preset principle and all 16 capability rows carried)* | `F2-01`, `F2-26` · full carry accounting in F2 §F2.5 |
| `DOC08.roles-or` | live | `F2-11` |
| `DOC08.no-per-user-exceptions` | live | `F2-15` |
| `DOC08.min-owner` | live | `F2-19` |
| `DOC08.midtask-permission` | live | `F2-17` |
| `DOC08.deactivate-never-delete` | live | `F2-20` (referenced by M01/M10 at their authoring; they do not re-append) |
| `DOC08.audit-coverage` | live | `F2-22` (covered-events checklist carried whole; also grounds `F2-04`'s approval record) |
| `DOC08.audit-tenant-export` | live | `F2-23` |
| `DOC08.admin-impersonation` | live | `F2-24` |
| `DOC08.matrix.lead-visibility` | live | `F2.M02.lead-visibility` · law form `F2-12`/`F2-13` |
| `DOC08.matrix.add-edit-leads` | live | `F2.M02.add-edit-leads` |
| `DOC08.matrix.assign-leads` | live | `F2.M02.assign-leads` |
| `DOC08.matrix.delete-leads` | live | `F2.M02.delete-leads` |
| `DOC08.matrix.capture-surveys` | live | `F2.M04.capture-surveys` |
| `DOC08.matrix.create-edit-designs` | live | `F2.M05.create-edit-designs` |
| `DOC08.matrix.approve-designs` | live | `F2.M05.approve-designs` (grant carried whole; v1 grantee preset `Engineer` folded into Design Engineer per decision A — `F2-03`, `F2-04`) |
| `DOC08.matrix.create-edit-proposals` | live | `F2.M06.create-edit-proposals` (discount rides it per D34, no separate permission) |
| `DOC08.matrix.send-proposals` | live | `F2.M06.send-proposals` |
| `DOC08.matrix.update-project-stages` | live | `F2.M08.update-stages` (successor grants per decision B — `F2-08`) |
| `DOC08.matrix.record-payments` | live *(one v1 key, two V2 rows — convention 3 above)* | `F2.M08.project-documents` + `F2.M11.record-payments` |
| `DOC08.matrix.configure-agent` | live | `F2.M01.configure-agent` |
| `DOC08.matrix.agent-performance` | live | `F2.M07.agent-performance` |
| `DOC08.matrix.manage-team` | live | `F2.M01.manage-team` (EPC Owner-only; HR/Admin explicitly not delegated — F2 §F2.1, §5) |
| `DOC08.matrix.manage-catalog` | superseded *(grant set only: v1 Owner-only → Owner + Operations manage, Finance views prices/margins, per design spec §2 DD11; the capability itself is live)* | `F2.M01.manage-catalog` · consistent with `02-personas.md` §Operations |
| `DOC08.matrix.manage-billing` | live *(capability restored — D38-era strike superseded by owner directive 4; billing is v1)* | `F2.M12.manage-billing` |
| `DOC08.matrix.company-reports` | live | `F2.M13.company-reports` |
| `journey §ROLES & PERMISSIONS L1480–1521` *(no Task-2 ledger key — screens list, deferred-to-v2 note, what-goes-wrong, recommendations; read directly per the Task 5 brief; L1414–1479 is Task 4's row)* | live | what-goes-wrong items carried at F2 §F2.2 edge cases + `F2-19`/`F2-20`/`F2-21` · fixed-preset guard `F2-02` · screens (Team / Assign roles / Roles reference / Invite person) and the plain-English grant line → `modules/M01-onboarding-and-tenant-config.md` via F2 §4 contract · role-decides-home recommendation already carried as `PS-01`/`PS-05` (Task 4) |

## Task 6 — `foundations/F1-global-market-framework.md`

Appended by Task 6. Requirement IDs in F1 use the prefix `F1-<nn>` (`F1-01`–`F1-61`); §F1.2
defines the eight pack keys, §F1.3 is the India pack. F1 §4 carries the standing
market-neutrality verification rule every module task and the closure pass run.

Conventions for reading this block:

1. **Grounding keys already dispositioned by Task 3 are not re-appended.** Task 3's rows for
   `DOC00.india-first-global-ready`, `DOC01.in-price-book`, `CG-moat.1` and `CG-moat.4`
   already point their F1 halves here ("pack framework / statutory ruleset / number grouping
   in F1"); F1 assigns the requirement IDs (F1-02/F1-04 lineage, F1-36, F1-46) without new
   rows, per Task 3's convention 1.
2. **Shared dispositions (Task 4 convention-3 precedent).** Rows below marked *shared* carry
   the **F1 half** — market data, IN ruleset, IN rails, labels — of a key whose mechanism or
   surface half belongs to another task's document: M07 (`D36` gate mechanism, `R3`
   capability framework, `D36.callrules.escape` hand-over shaping), M08 (`R2` state machine),
   M12 (`DOC16.*` billing mechanics), M01 (`R13` catalog mechanics), F5 (`R6` link
   lifecycle), Task 7 (`DOC16.gst-supplier-of-record` business-model posture). Each pair is
   intentional, not a duplicate; the owning task appends its own half.
3. **Cited-but-not-disposed keys stay with their owners.** F1 cites, as grounding only:
   `DOC01.tier-table`, `DOC01.billing-cadence`, `DOC01.gtm`, `DOC01.price-under-incumbents`,
   `DOC01.mandate-at-conversion`, `DOC01.yearly-payment-rail`, `DOC01.supplier-of-record`,
   `DOC16.pricing-single-source`, `DOC16.hosted-checkout`, `DOC16.dunning-channels`,
   `DOC16.manual-payment-modes`, `DOC04.proposal-tax-model`, `DOC04.document-checklist`,
   `DOC04.blockers`, `DOC04.project-machine`, `DOC04.payments-append-only`,
   `DOC04.subscription-states`, `DOC04.plan-prices-per-currency`,
   `DOC04.catalog-certifications`, `DOC04.compliance-flags`, `DOC04.user-lifecycle`,
   `DOC04.user-language-units`, `DOC04.tenant-onboarding-fields`,
   `DOC04.design-freshness-pins`, `DOC05.bom-money-locked`, `DOC07.compliance-gate`,
   `DOC08.compliance-gate`, `DOC08.recording-retention`, `DOC08.link-named-otp`,
   `DOC09.compliance-fail-closed`, `DOC14.activation-vs-build`, the `DOC10.*`/`DOCARCH.*`
   format-rendering rows (F3), `R4`/`UD-6` (M12/M07), `CG-1`/`CG-2`/`CG-3`/`CG-reslink.5`
   and the `CG-matrix.*` rows, customer-journey `C10`-family rows (F5), `TC.*` rows (M01),
   `S2.wrong.4` and the S7 agent rows (M02/M07), `UXG-16`/`UXG-17` (M07), and `SC.*` rows
   (M05).
4. **Supersessions inside D36's calling-rules block are recorded in-row** (the pre-overlay
   "owner can change or switch off any of them / widen the window" wording is dead for
   statutory items per the 2026-08-02 D36 amendment; the disposition stays `live` because the
   post-overlay rule itself lands as F1 requirements).

| source key | disposition | PRD ref |
|---|---|---|
| `DOC02.market-pack-unit` | live | `F1-01`, `F1-02` · engineering rules data carried at F1 §F1.3 intro (M05/DD13) · standards labels `F1-20`, checklist/labels framework `F1-22` |
| `DOC02.market-invariants` | live | `F1-03` (lifecycle consequence `F1-04`) |
| `DOC02.tz-schedules` | live | `F1-10` |
| `DOC03.dpdp-residency` | live | `F1-55` (same IN determination as `DOC08.residency`; new-market consequence `F1-05`) |
| `DOC04.currency-stamp` | live | `F1-07` |
| `DOCFC.money-generic` | live | `F1-07` |
| `DOCFC.tax-generic` | live | `F1-08`, `F1-13` |
| `DOCFC.market-vocab` | live | `F1-09`, `F1-18`, `F1-22` |
| `DOCFC.tz-scheduling` | live | `F1-10` |
| `DOCFC.new-market-gate` | live | `F1-05`, `F1-23` · supplier-of-record half also recorded open at `registers/open-questions.md` Q7 |
| `UD-9` | live *(shared — market-pack + India-only-launch half; the one-currency and global-safe-billing halves land via M12/`04-business-model.md` citing `F1-06`/`F1-07`/`F1-27`; market-neutral module bodies bind all modules via F1 §4)* | `F1-06`, `F1-03`, `F1-27` |
| `DOC08.otp-destination` | live | `F1-49` (framework `F1-21`) |
| `DOC08.dlt-templates` | live | `F1-38` |
| `DOC08.dpdp-roles` | live | `F1-54` |
| `DOC08.residency` | live | `F1-55` (rails cross-ref `F1-43`) |
| `DOC08.consent-records` | live | `F1-58` (pre-dial surfacing is M07's per F1 §4 contract) |
| `DOC08.data-rights-export` | live | `F1-56` · framework law `F1-24` |
| `DOC08.data-rights-correction` | live | `F1-56` |
| `DOC08.erasure-anonymise` | live | `F1-57`, `F1-32` · framework law `F1-24`, `F1-13` |
| `DOC08.breach-grievance` | live | `F1-59` |
| `DOC16.gst-supplier-of-record` | live *(shared — IN tax-scheme half; business-model posture with Task 7, invoicing mechanics with M12)* | `F1-29` |
| `DOC16.gst-invoice` | live *(shared — scheme-data half; invoice mechanics M12)* | `F1-28`, `F1-29` · scheme-neutral framework `F1-13` |
| `DOC16.e-invoicing-threshold` | live | `F1-30` |
| `DOC16.mandate-routes` | live *(shared — IN rails half; billing enforcement M12)* | `F1-40` · framework `F1-18` |
| `DOC16.mandate-ladder` | live *(shared — IN rails half; dunning/billing mechanics M12)* | `F1-40`, `F1-41` |
| `D36` | live *(shared — IN statutory-ruleset + configure-within-law halves; the non-swappable gate mechanism and tenant-config surfaces are M07/M01's rows)* | `F1-12`, `F1-15`–`F1-17`, `F1-36` |
| `D36.callrules.frame` | live *(the "switch off any of them" wording is superseded for statutory items by the 2026-08-02 D36 amendment — convention 4)* | `F1-15`, `F1-17` |
| `D36.callrules.dnd` | live | `F1-36`(a) |
| `D36.callrules.hours` | live *(floor half; the source's owner-may-widen wording superseded by the D36 amendment — tenants may only narrow, `F1-17`)* | `F1-36`(b) |
| `D36.callrules.disclosure` | live *(statutory-floor status unresolved — enforced as floor pending owner ruling)* | `F1-36`(d) · F1 §6 `F1-Q1` → `registers/open-questions.md` Q6 |
| `D36.callrules.recording` | live | `F1-36`(e), `F1-39` |
| `D36.callrules.escape` | live *(shared — statutory opt-out half here; hand-over shaping and the always-offered human are M07's)* | `F1-36`(c) |
| `R2` | live *(shared — IN labels/skippable-stage half; the canonical machine M08, tranche mapping M11, link stage display F5, days-in-stage metrics M13)* | `F1-51`, `F1-35` · framework `F1-09`, `F1-22` |
| `R3` | live *(shared — IN reference-rails half; the capability framework and vendor-to-capability translation M07)* | `F1-43` |
| `R6` | live *(shared — OTP IN reference rail + tenant-currency threshold denomination; named-link lifecycle and the default threshold value F5. The default-threshold-value route is fulfilled as an open **placement** item: the value's home is a pack-key addition raised at `registers/open-questions.md` Q42 — Task 25, closing F5 §6's closure-pass note)* | `F1-43`, `F1-07` · `Q42` |
| `R13` | live *(shared — scheme-keyed certifications with ALMM/DCR as the IN entries; catalog resolution mechanics M01)* | `F1-19`, `F1-44` |

## Task 7 — `foundations/F8-data-honesty.md`

Appended by Task 7. Requirement IDs in F8 use the prefix `F8-<nn>` (`F8-01`–`F8-36`); §F8.1
defines the four-tier provenance vocabulary the rest of the suite reads, and F8 §4 carries the
standing conformance rule every module task and the closure pass run.

Conventions for reading this block:

1. **Keys already closed by Task 3 are not re-appended.** `DOC00.honesty-conviction` (Task 3
   convention 1 — the whole `DOC00.*` set is disposed of once, in Task 3's block) and
   `CG-moat.2` (Task 3 convention 2 — shared keys named once, with the ref pointing here) both
   already carry `foundations/F8-data-honesty.md` as their named owner. F8 assigns the
   requirement IDs those refs resolve to — the tier vocabulary at `F8-01`–`F8-04`,
   money-never-stale at `F8-12`, indicative labelling at `F8-20`, engineer sign-off at
   `F8-25`/`F8-26`, correlation-not-attribution at `F8-30` — without new rows for either key.
2. **Shared dispositions** (Task 4 convention 3 / Task 6 convention 2 precedent). Rows marked
   *shared* carry the **F8 half** — the law, its wording and its consequences — of a key whose
   surface, screen or mechanism half belongs to another task's document: M04 (`S4.rule.honesty`
   survey modes), M05 (`R5` source-of-record ladder, `DOC04.signoff-append` review surfaces, the
   `DOC11.*` studio surfaces, `CG-reslink.4`/`CG-reslink.7` features), M06 (`S6B.rule.honesty`
   builder + document template, `R17` document type), M07/M13 (`AP.honesty.1`, `AP.wrong.3`
   screens; `OD-7` telephony), M12 (`DOC16.usage-honesty`, `DOC16.dunning-honesty` screens and
   copy), M01 (`TC.principle.4` configuration surfaces), F1 (`OD-7` number-series rules). Each
   pair is intentional, not a duplicate; the owning task appends its own half.
3. **Cited-but-not-disposed keys stay with their owners.** F8 cites, as grounding only:
   `DOC10.n-rules` (N7), `DOC10.dod`, `DOC10.money-format`, `DOC10.i18n-*` (F3/F7);
   `R14`, `DOC06.server-owns-money`, `DOC06.online-only-set` (F4); `D37`, `R2` (M13/M08);
   `D21`, `D30`, `D35`, `S6B.rule.two-paths`, `S6B.rule.prefill`, `S6B.wrong.7`, `S6B.wrong.9`,
   `S6.wrong.1`, `S6.wrong.7`, `S5.wrong.4`, `S5.wrong.6`, `S5.wrong.7`, `S5.wrong.2`
   (M05/M06); `DOC04.proposal-versions-immutable`, `DOC04.proposal-paths` (M06); `R13`,
   `DOC04.catalog-provenance`, `DOC04.catalog-release-stale` (M01); `DOC16.downgrade`,
   `DOC16.dunning-ladder`, `DOC16.never-gated`, `DOC07.metering-entitlement-order` (M12);
   `DOC07.telephony-capabilities`, `DOC07.roof-detect-honesty`, `DOC07.google-enhancement-only`,
   `DOC05.ai-doorway` (M07/M04); `C5.wrong.3`, `C.framing.4`, `C.lifecycle.5` (F5);
   `CG-10`, `CG-matrix.4`, `CG-matrix.6`, `CG-matrix.9`, `UXG-06`, `UXG-23` and the `SC.*`
   census rows (`SC.10-1.20`, `SC.10-3.41`, `SC.10-5.38`, `SC.10-6.50`, `SC.10-7.13`,
   `SC.10-7.17`, `SC.10-7.27`, `SC.10-8.20`, `SC.10-9.12`, `SC.10-10.23`, `SC.10-11.18`) (M05).
4. **F1 and F2 are referenced by requirement ID, not by source key.** `F1-07`, `F1-11`, `F1-21`
   (currency stamp, pack versioning as a staleness input, format values) and `F2-03`, `F2-04`,
   `F2-15`, `F2.M05.approve-designs` are consumed as published requirements; no source key is
   re-disposed for them.

| source key | disposition | PRD ref |
|---|---|---|
| `R18` | live | `F8-02` (the four tier definitions, verbatim), `F8-01` (tier on every user-visible number), `F8-03` (closed set — "No screen invents a fifth tier"), `F8-05`, `F8-21` · consumers read the vocabulary without re-appending: BOM per-line confidence `modules/M05`/`modules/M06`, customer-link disclaimers `foundations/F5`, survey tiers `modules/M04` |
| `R5` | live *(shared — the provenance/source-labelling half; the PVGIS-as-source-of-record ruling and its database ladder stay with `modules/M05`, per-tenant metering of the three services with `modules/M12`)* | `F8-08` (both labels verbatim), `F8-09` ("energy figures never silently switch source"), `F8-05` |
| `DOC02.money-never-stale-api` | live | `F8-12`, `F8-13` (the rule stated as product law; the API-enforcement mechanism is excluded per design spec §14/DD4) |
| `DOC04.design-freshness-pins` | live | `F8-14` (pinned inputs self-stale), `F8-13` ("staleness = compare, not flag-flipping"), `F8-09` (energy figures surface their irradiance source) |
| `DOC05.fingerprint-self-stale` | live | `F8-14` (engine/catalog/price-book versions join the pin set so an external change self-stales older outputs; the fingerprint graph itself is excluded as implementation) |
| `DOC07.pvgis-energy-of-record` | live | `F8-10` (fallback never blocks; estimate badge on energy *and* finance outputs; money from an estimate carries the provisional chain), `F8-08` |
| `CG-matrix.25` | live | `foundations/F8-data-honesty.md` as a whole — the "provenance tiers + money-staleness honesty system" capability line lands as §F8.1 + §F8.3 (`F8-01`–`F8-04`, `F8-12`–`F8-15`, `F8-17`–`F8-19` — the range is enumerated around the gap because `F8-16` was deleted 2026-08-07 by owner ruling `Q61`; the surviving money-honesty law is `F8-12`) |
| `S6B.rule.honesty` | live *(shared — the honesty-law half; the eleven-step builder and the document template stay with `modules/M06`)* | `F8-20` (the "Indicative proposal…" line, verbatim), `F8-21` (Path B is `estimated`/`assumed`, never `derived`) |
| `S4.rule.honesty` | live *(shared — the document-disclosure half; survey modes, the gaps list and capture behaviour stay with `modules/M04`)* | `F8-22` (the satellite-imagery line, verbatim; remote = `derived`, physical = `measured`) |
| `AP.honesty.1` | live *(shared — the honesty law and its required caption; the agent-performance screen stays with `modules/M07`, its dashboard rendering with `modules/M13`)* | `F8-30` (rule + caption, both verbatim) |
| `AP.wrong.3` | live *(shared — the placement law; the screen stays with `modules/M07`/`modules/M13`)* | `F8-31` ("the caveat is on the screen, not in a tooltip"), `F8-07` |
| `TC.principle.4` | live *(shared — the platform-behaviour carve-out; the tenant-configuration surfaces that must not offer these switches stay with `modules/M01`)* | `F8-06` (number-honesty is never a tenant config surface) |
| `DOC16.usage-honesty` | live *(shared — F8 carries the honesty half: same query / same numbers / no smoothing, period + provenance labelling, and the concrete **80%-consumed pre-warning before the gate fires**. The gate-mechanics half — ceilings, enforcement points, the metering ledger and the usage screen itself — stays with `modules/M12-platform-billing.md`, which re-appends this key at Task 23)* | `F8-33` |
| `DOC16.dunning-honesty` | live *(shared — the honest-state law; dunning copy and the ladder stay with `modules/M12`)* | `F8-34` |
| `OD-7` | live *(shared — the "IVR traversal degrades honestly" half explicitly routed to F8 by the ledger; the capability framework and call-control plane stay with `modules/M07`, the number-series rules with `foundations/F1`)* | `F8-35` (declared degradation path, recorded outcome, human told) |
| `R17` | live *(shared — the "honesty label on financial projections" half; the proposal document type stays with `modules/M06`, post-close stage behaviour with `modules/M08`; the PPA-engine non-goal was excluded by Task 3 as `DOC00.nongoal-ppa-billing`)* | `F8-23` (projections labelled, assumptions disclosed with them) |
| `DOC04.signoff-append` | live *(shared — the honesty law the ledger marks "shared with F8"; the sign-off queue and review surfaces stay with `modules/M05`)* | `F8-26` (recorded human decision, who + when), `F8-27` (pins what was reviewed; an edit after approval un-approves; append-only), `F8-28` |
| `DOC11.structural-never-computed` | live *(shared — the never-computed law and the travelling disclaimer; the structure tooling, sheets and scale surfaces stay with `modules/M05`)* | `F8-25`, `F8-28` |
| `DOC11.provenance-at-scale` | live *(shared — the weakest-tier-inherits law; block-level studio behaviour stays with `modules/M05`)* | `F8-04` |
| `DOC11.money-stale-at-scale` | live *(shared — the provisional-for-the-whole-window law and the issue block; recompute surfaces stay with `modules/M05`, the money path with `modules/M11`)* | `F8-17` |
| `DOC11.shading-limits-printed` | live *(shared — the model-limits-travel-with-outputs law; the shading model and its limit text stay with `modules/M05`)* | `F8-11` |
| `CG-reslink.4` | live *(shared — the provenance-labelling half of the PV report line; the report itself stays with `modules/M05`)* | `F8-08`, `F8-01` |
| `CG-reslink.7` | live *(shared — "never a computed safety verdict" + engineer sign-off; the parametric structure model and material estimate stay with `modules/M05`)* | `F8-25`, `F8-26`, `F8-28` |

## Task 8 — `foundations/F3-localization.md`

Appended by Task 8. Requirement IDs in F3 use the prefix `F3-<nn>` (`F3-01`–`F3-29`); §F3.1–§F3.5
carry, in order, per-user language, the catalog-copy/tenant-data split, script correctness, the
single format-rendering layer, and the add-a-language playbook. F3 §4 carries the standing
conformance rule every module task and the closure pass run.

Conventions for reading this block:

1. **The `docs/10` split convention — recorded here because it decides which task owns which
   rows.** The Task 2 ledger routes the whole of `docs/10-i18n-and-design-system.md` to
   "F3 + F7", and applies that mapping as **i18n rules → F3, design-system rules → F7** (the
   convention is stated in the ledger's own header at `_process/extraction/docs-rules.md`,
   part B).
   This block therefore disposes of the nine `DOC10.*` **i18n** rows only. The `DOC10.*`
   design-system rows (`canon`, `light-only`, `mono-numerics`, `weights`, `accent-systems`,
   `no-borders`, `restricted-colours`, `overline-exception`, `status-not-colour-alone`,
   `data-colour-law`, `brand-restraint`, `overlay-scrim`, `focus-ring`, `density`,
   `iconography`, `no-logo`, `content-voice`, `photos`, `numberfield-blur`, `table-caption`,
   `icon-label`, `focus-management`, `tenant-branding`, `dod`, `n-rules`, `touch-contract`) are
   **Task 9's**, in `foundations/F7-design-language.md`. So are the ruling rows the ledger labels
   with a bare "F3" for the same pre-split reason — `R19-CTX`, `R19-A`, `R19-B`, `R19-C`,
   `R19-D`, `R19-E` (design-system rulings; Task 9's brief step 4 appends them) — and the
   principle row `EOD-6 · consistency-over-cleverness` (ledger: "nearest home F3 (design/
   interaction consistency)"), which under the split is design-language material. **None of
   these is dropped; each is Task 9's to append.**
2. **Keys already closed by Task 3 are not re-appended.** `CG-moat.4` (Task 3 convention 2 —
   shared keys are named once, with the ref naming this document as owner) already points its
   vernacular-interface half here; F3 assigns the requirement IDs `OV-40` resolves to — the
   launch language set at `F3-01`, script-correct documents at `F3-15`, market-correct number
   grouping at `F3-19`/`F3-20` — without a new row.
3. **Shared dispositions** (Task 4 convention 3 / Task 6 convention 2 / Task 7 convention 2
   precedent). Rows below marked *shared* carry the **F3 half** — the language law, the content
   class, or the rendering rule — of a key whose surface, mechanism or visual half belongs to
   another task's document: F7 (type scale, weights, Definition of Done), M07 (the agent
   language set and its configuration), M01/M06/F6 (template and message surfaces), F5 (the
   customer link's rendering), F1 (the format *values*). Each pair is intentional, not a
   duplicate; the owning task appends its own half.
4. **Cited-but-not-disposed keys stay with their owners.** F3 cites, as grounding only:
   `DOC10.dod` (item 7, the Hindi render check) and `DOC10.n-rules`, `R19-D` (the sanctioned
   weight set) — F7; `TC.message-templates.1`, `TC.kb.3` — M01 (+M06/F6); `UXG-17`'s
   per-language greeting clause — M07; `R3` (the "sets never converge by accident" consequence,
   dispositioned by Task 6 as shared) — M07; `S6B.step.5` — M06; `C5.wrong.4` — F5;
   `CG-reslink.12` — M05; `DOC08.otp-destination` — F1.
5. **F1, F2 and F8 are referenced by requirement ID, not by source key.** `F1-07`, `F1-09`,
   `F1-10`, `F1-12`, `F1-21`, `F1-22` and the IN instances `F1-46`–`F1-51`; the twelve preset
   names of `F2-01`; and `F8-01`, `F8-02`, `F8-12`, `F8-20`, `F8-22`, `F8-24`, `F8-28` are
   consumed as published requirements. No source key is re-disposed for them.

| source key | disposition | PRD ref |
|---|---|---|
| `D25` | live | `F3-01` (the launch language set), `F3-02`, `F3-04` (the overlay's "per-user re-render") · the Devanagari half at `F3-13`; the named v1 reference implementation is recorded once in F3 §1 and is not a requirement |
| `D12` | superseded *(the English-only UI half, by `D25` per docs/15; the surviving agent-language-set half is not F3's to specify — it is stated as a boundary here and owned by `modules/M07-sales-execution.md`)* | UI half → `F3-01` · surviving agent-set half → `F3-29` (boundary only; M07 specifies the set) |
| `DOC10.i18n-locales` | live | `F3-01` (one catalog, product-level set), `F3-02` (per-user, not per-tenant), `F3-04` (immediate whole-app re-render) |
| `DOC10.i18n-fallback` | live | `F3-05` |
| `DOC10.templates-are-data` | live *(shared — the content-class law: tenant templates are per-language data, never catalog messages; the template-management surfaces stay with `modules/M01`, `modules/M06`, `modules/M07` and `foundations/F6`)* | `F3-10` · the unruled fallback case recorded at F3 §6 `F3-Q1` → `registers/open-questions.md` Q10 |
| `DOC10.devanagari` | live | `F3-13` (bundled script face, never OS fallback), `F3-14` (every sanctioned weight, no synthesis), `F3-16` (expansion; the ~20–30% band variance against `MULTI.2`'s 15–30% is recorded in-row — the 30% ceiling is common to both) |
| `DOC10.money-format` | live *(shared — the single-rendering-implementation law is F3's; the format **values** are `pack.formats` (`F1-21`, IN at `F1-46`), and the provenance/never-stale obligations the money string carries are F8's (`F8-12`, `F8-24`))* | `F3-19`, `F3-20`, `F3-24` |
| `DOC10.units-not-translated` | live | `F3-08` (never-translated set; value+unit unbreakable), `F3-23` (m/ft preference; procurement stays metric) |
| `DOC10.latin-digits` | live | `F3-21` |
| `DOC10.dates-tz` | live *(shared — the no-hand-rolled-date-strings rendering rule here; the date style and default timezone are pack values, `F1-21`/`F1-48`, and the tenant-timezone law is `F1-10`)* | `F3-22` |
| `DOC10.add-language` | live | `F3-26` (the playbook as product requirement), `F3-27` (the readiness gate), `F3-28` (a new script is a font question, not a redesign) · the five-densest-screens list also grounds `F3-18` |
| `DOC03.currency-units-law` | live *(shared — the never-translate-units and dedicated-font-chain halves here; the grouping **value** is the IN pack's, `F1-46`)* | `F3-08`, `F3-13`, `F3-20` |
| `DOC03.devanagari-documents` | live | `F3-15` (script-correct generated documents; the renderer is stated as a vendor-neutral capability with the v1 reference implementation named once) |
| `DOC04.user-language-units` | live | `F3-02` (per-user UI language), `F3-23` (m/ft preference; procurement metric regardless) |
| `DOCARCH.money-grouping` | live | `F3-19`, `F3-20` ("money never renders with locale-default number formats" stated as the boundary on the rendering layer) |
| `MULTI.1` | live *(the surviving rule only: the Latin brand face has no coverage for the launch non-Latin script and must be paired with a matched script face. The **named** Latin face (Inter) is dead — `D3` superseded by docs/15 §3 / `R19-E`; the pairing itself, as a type-system fact, is `foundations/F7`'s)* | `F3-13` |
| `MULTI.2` | live *(shared — the expansion law here; the components and type scale that must absorb it are `foundations/F7`'s; the eleven builder step titles are `modules/M06`'s)* | `F3-16` |
| `MULTI.3` | live *(shared — the per-script line-height obligation here; the type scale that carries it is `foundations/F7`'s)* | `F3-17` |
| `MULTI.4` | live *(both columns carried whole; the "₹ stays Indian in every language" clause is carried as the market-format rule narrowed post-overlay — the value is `F1-46`, the rendering law is `F3-20`)* | `F3-07` (translated set), `F3-08` (never-translated set), `F3-20` (money), `F3-06` (notifications render in the recipient's language) · voice-agent speech → `modules/M07` per `F3-29` |
| `MULTI.5` | live | `F3-03` (picker placement, own-script names, device default), `F3-04` (immediate re-render, no reload) |
| `MULTI.6` | live | `F3-02`, `F3-06` · quoted in F3 §2 |
| `MULTI.7` | live | `F3-05` |
| `MULTI.8` | live | `F3-16` (wrap or truncate with the full text available; never overflow) |
| `MULTI.9` | live | `F3-09` (mixed script normal, deliberate, and a required test case) |
| `MULTI.10` | live *(shared — the independence law here; the agent language set, its per-customer selection and its tenant configuration are `modules/M07`'s)* | `F3-29` |
| `MULTI.11` | live *(post-overlay narrowing recorded: "always" holds **per market** — the grouping is `pack.formats` data (`F1-46`) under the global-backend ruling, not a universal rule)* | `F3-20` |
| `MULTI.12` | live *(the source's recommendation, carried as a requirement because `DOC10.dod` item 7 already makes it a completion condition — cited; `foundations/F7` owns the Definition of Done)* | `F3-18` |
| `R1` | live *(shared — the cross-locale vocabulary half: one term per concept in every language, no dual vocabulary in any of them. The search-alias clause stays with `foundations/F6`, the customer-link wording with `foundations/F5`, and the entity and document with `modules/M06` — **a corrected route, disclosed (Task 26):** the ledger's mapping cell reads "F7 + M04", but the proposal entity and its customer-facing document are `modules/M06`'s subject matter (M04 is survey), and the ledger's own notes cell routes the law to F3/F7 with halves to F6/F5, never M04 — Task 8 corrected the target without stating so in-row; `01-product-overview.md` `OV-35` states the law without disposing the key, per Task 3's convention)* | `F3-11`, `F3-12` · the ruling's identical HI/MR consequence string — flagged in the ledger as a possible source defect and **not corrected here** — recorded at F3 §6 `F3-Q2` → `registers/open-questions.md` Q11 |
| `CG-matrix.24` | live *(shared — the vernacular-UI and script-correct-document capability lines; the visual half of the same competitive claim is `foundations/F7`'s)* | `F3-01`, `F3-13`, `F3-15` |

## Task 9 — `foundations/F7-design-language.md`

Appended by Task 9. Requirement IDs in F7 use the prefix `F7-<nn>` (`F7-01`–`F7-45`); §F7.1–§F7.6
carry, in order, the binding visual language and its authority, type/numerals/colour roles,
surface grammar, the interaction and accessibility contract, the twelve V2 UX principles, and
content voice with the per-screen Definition of Done. F7 §4 carries the standing conformance rule
every module task and the closure pass run.

Conventions for reading this block:

1. **This block closes the `docs/10` split that Task 8's convention 1 opened.** Task 8 disposed
   of the nine `DOC10.*` **i18n** rows and named, explicitly, the rows it was leaving for this
   task. All of them are disposed of here: the **twenty-six `DOC10.*` design-system rows**
   (`canon`, `light-only`, `mono-numerics`, `weights`, `accent-systems`, `no-borders`,
   `restricted-colours`, `overline-exception`, `status-not-colour-alone`, `data-colour-law`,
   `brand-restraint`, `overlay-scrim`, `focus-ring`, `density`, `iconography`, `no-logo`,
   `content-voice`, `photos`, `numberfield-blur`, `table-caption`, `icon-label`,
   `focus-management`, `tenant-branding`, `dod`, `n-rules`, `touch-contract`), the six
   design-system ruling rows the ledger labels with a bare "F3" for the same pre-split reason
   (`R19-CTX`, `R19-A`, `R19-B`, `R19-C`, `R19-D`, `R19-E`), and the principle row `EOD-6`. With
   this block the `docs/10` corpus is fully disposed of across Tasks 8 and 9, and no `DOC10.*`
   key remains unowned.
2. **Shared dispositions** (Task 4 convention 3 / Task 6 convention 2 / Task 7 convention 2 /
   Task 8 convention 3 precedent). Rows marked *shared* carry the **F7 half** — the visual law,
   the interaction contract, or the design-time principle — of a key whose screens, tools or
   mechanism belong to another task's document: `modules/M05` (`DOC10.studio-dod`, `UXG-22`,
   `UXG-24`, `CG-matrix.2`, `S5.rule.uxprob.1`), `modules/M01` (`TC.branding.1`),
   `foundations/F3` (`MULTI.1`, `MULTI.2`, `MULTI.3`, `MULTI.8`, `MULTI.12`, `CG-matrix.24` —
   each already appended by Task 8 with F7 named as the other half). Each pair is intentional,
   not a duplicate; the owning task appends its own half.
3. **The UX-gap register informs this document; it is not disposed of by it.** All twenty-seven
   `UXG-01`–`UXG-27` rows were read in full as mandatory input to the V2 UX principles (design
   spec §7: the register and every "what goes wrong" section are mandatory inputs, and "V2 UX
   must fix documented v1 pain, not re-inherit it"). **Twenty-three of them are informing-only
   here and stay with their owning module tasks** — `UXG-01`–`UXG-05`, `UXG-19` (M02);
   `UXG-06`–`UXG-08`, `UXG-21`, `UXG-23`, `UXG-25` (M05); `UXG-09` (M06); `UXG-10` (F4);
   `UXG-11`, `UXG-12` (F5); `UXG-13`–`UXG-15` (M12); `UXG-16`–`UXG-18` (M07); `UXG-20` (M08).
   Only four are disposed of below: the two the ledger routes to F7 as a shared half (`UXG-22`
   touch contract, `UXG-24` sheet grammar and visual law) and the two it routes to F7 outright
   (`UXG-26`, `UXG-27`). The register's own **cross-cutting frame** — design-at-implementation
   with no separate design phase, the closure condition, "never delete rows", and the contracts
   every gap inherits (dual breakpoints, teaching empty states, provenance labels,
   sheets-not-pages, arc-nav/sidebar shells) — lands as `F7-45`, `F7-21`, `F7-22`, `F7-34` and
   `F7-35`; the frame is cited from the ledger head rather than from any one row, so no row is
   consumed by it.
4. **Keys already closed by earlier tasks are not re-appended.** `DOC00.one-record` and
   `DOC00.product-definition` (Task 3 convention 1 — the whole `DOC00.*` set is disposed of once,
   in Task 3's block) and `CG-moat.4` (Task 3 convention 2) are cited as the grounding for
   `F7-33` and `F7-37` without new rows; `01-product-overview.md` `OV-04`, `OV-09`, `OV-33`,
   `OV-35`, `OV-38`, `OV-40` and `OV-43` are consumed as published requirements.
5. **Cited-but-not-disposed keys stay with their owners.** F7 cites, as grounding only:
   `DOC01.gtm` (the speed budgets — `04-business-model.md`); `S2.rule.channel.1`, `S0.happy`,
   `S0.rule.minimum-first` (M02/M01); `R14` (`foundations/F4`); `R1`, `R18`, `R5` (F3/F8/M05);
   `DOC10.devanagari` (`foundations/F3` owns it at `F3-13`/`F3-14`; F7 cites it at `F7-14`/`F7-41`
   — omitted from this list when written, added by Task 26);
   `D35` (M04); `D37` (M13); `OD-3`, `OD-6`, `OD-9` (surface commitment, complexity
   counterweight, and the flagship directive — dispositioned by their owning tasks); `EOD-4`
   (the authority for keeping UX gaps as registered design-time items — its register home is
   `registers/enhancements.md`/`registers/open-questions.md`); `CG-18` (white-label verdict —
   `04-business-model.md`); the `UXG-A11Y-*` appendix rows behind `F7-11`'s retired restrictions
   (outside the 01–27 numbering, recorded in the ledger appendix).
6. **F3 and F8 are referenced by requirement ID, not by source key.** `F3-02`, `F3-07`–`F3-11`,
   `F3-13`, `F3-14`, `F3-16`–`F3-23`, `F3-18` and `F8-01`, `F8-07`, `F8-08`, `F8-12`, `F8-18`,
   `F8-20`, `F8-28`, `F8-31`, `F8-36` are consumed as published requirements. No source key is
   re-disposed for them.
7. **The design-system artifact is source, not a ledger key.** `design/ds-source/` (readme,
   `tokens/*.css`, `assets/fonts/`, `_ds_manifest.json`, `_adherence.oxlintrc.json`) is read-only
   source material referenced by path throughout F7. It carries no ledger key of its own; the
   rulings that bind it (`DOC10.canon`, `R19-*`, `D3`) are the keys, and they are disposed of
   below. Three artifact-versus-ruling divergences found while reading it are recorded inside
   `F7-02` rather than in `registers/conflicts.md`, because the overlay's own precedence law
   ("the ruling wins") resolves each one — they are stale artifact text, not unresolved
   contradictions.

| source key | disposition | PRD ref |
|---|---|---|
| `DOC10.canon` | live | `F7-01` (the package is the single source of every visual fact, pixel-perfect), `F7-02` (precedence when artifact and ruling disagree), `F7-03` (no restated values) · the retirement half of the same row is `R19-E`/`D3` below |
| `DOC10.light-only` | live | `F7-04` · the light studio canvas is also `modules/M05`'s to render; dark mode recorded as a non-goal at F7 §5 |
| `DOC10.mono-numerics` | live | `F7-09` (mono face, tabular figures, right-aligned money and quantity columns) · the money **format** is `F3-19`/`F3-20`, its values `F1-21` |
| `DOC10.weights` | live | `F7-08` (four sanctioned weights, no synthesis; the readme's dead restriction clause named), `F7-02` (the token file does not yet carry the sanctioned semibold — ruling wins) |
| `DOC10.accent-systems` | live | `F7-06` (two accent systems never conflated; near-black primary action as the strongest identity marker) |
| `DOC10.no-borders` | live | `F7-15` (hierarchy from luminance and shadow; the two exceptions), `F7-16` (the high-contrast field mode as a product-visible capability) |
| `DOC10.restricted-colours` | live | `F7-11` (the three surviving role restrictions, with the two retired-not-relaxed ones recorded as describing nothing) |
| `DOC10.overline-exception` | live | `F7-10` · the exception's values stay in `design/ds-source/tokens/typography.css` per `F7-03` |
| `DOC10.status-not-colour-alone` | live | `F7-12` |
| `DOC10.data-colour-law` | live | `F7-13` (UI vs data colour; deuteranopia-distinguishable sets; second non-colour channel; never tenant-overridable) · the studio palettes themselves are `modules/M05`'s |
| `DOC10.brand-restraint` | live | `F7-06` |
| `DOC10.overlay-scrim` | live | `F7-18` |
| `DOC10.focus-ring` | live | `F7-24` |
| `DOC10.density` | live | `F7-17` · density correctness is also `F7-43` item 9 |
| `DOC10.iconography` | live | `F7-19` |
| `DOC10.no-logo` | live | `F7-05` · the unresolved brand-asset decision → F7 §6 `F7-Q1` → `registers/open-questions.md` Q12 |
| `DOC10.content-voice` | live | `F7-42` · date/number/unit rendering is `F3-19`–`F3-23`; the naming law is `R1` via `OV-35` |
| `DOC10.photos` | live | `F7-20` |
| `DOC10.numberfield-blur` | live | `F7-28` |
| `DOC10.table-caption` | live | `F7-27` |
| `DOC10.icon-label` | live | `F7-26` |
| `DOC10.focus-management` | live | `F7-25` |
| `DOC10.tenant-branding` | live *(shared — the branding **law** and its boundary are F7's; the tenant-facing branding settings surface stays with `modules/M01-onboarding-and-tenant-config.md`)* | `F7-07` · no-tenant-theming recorded as a non-goal at F7 §5 |
| `DOC10.dod` | live | `F7-43` (all twelve items) · item 7 also `F7-41`; item 8 reads `foundations/F8`; item 10 is `F7-03`; the struck dark half is `R19-A`/`F7-04` |
| `DOC10.studio-dod` | live *(shared — the "DoD applies unreduced, light, full parity at the mobile viewport" half is F7's; the studio's tools, screens and census acceptance stay with `modules/M05-design-studio.md`, which re-appends this key)* | `F7-44`, `F7-30` |
| `DOC10.n-rules` | live | `F7-23` (N1–N10 carried verbatim, numbering fixed) · N3's exception `F7-10`, N6 `F7-13`, N5 `F7-24`/`F7-25`/`F7-26`, N7 `foundations/F8` (`F8-01`–`F8-03`) via `F7-35`, N10 `F7-23`/`F7-43` *(corrected 2026-08-07: the ref named `F7-36`, which is **STRUCK** by owner ruling `Q61` — tier `—`, principle 7 no longer binds — and cannot be a carrier. Under `Q61` N10 is amended to three states, loading/empty/error; the amendment is stated in `F7-23`'s own cell, the N-set being carried under "never renumber, never reword", and enforced at `F7-43` item 2)* |
| `DOC10.touch-contract` | live | `F7-29` (all four clauses), `F7-32` (the principle), `F7-28` (always-available numeric entry) · the studio canvases are `modules/M05`'s |
| `DOC03.light-only` | live *(the ledger records it as a duplicate of `R19-A`; disposed here so the docs/engineering/03 row is not left unowned)* | `F7-04` |
| `DOCARCH.platform-parity` | live *(the product-level reading only; the shared-contract mechanism is implementation and stays excluded per design spec §14/DD4)* | `F7-39` |
| `R19-CTX` | live | `F7-01` (the canon paragraph's rule: the vendored package is the canonical visual system, implemented and not re-litigated) · **two source facts recorded, not resolved:** the paragraph's "four open items" count against the five rulings that follow, and the missing `./research/ds-reconciliation.md` conflict list — both are recorded in the extraction ledger; the second is an instance of the source gap already seeded in `registers/conflicts.md` |
| `R19-A` | live | `F7-04` (light-only, alias layer kept), `F7-02` (the readme's dark-mode index line declared false — artifact prose stale, tokens and ruling agree) · dark mode → F7 §5 non-goals; the light studio canvas → `modules/M05` |
| `R19-B` | live | `F7-10` (the single named exception to N3's floor), `F7-23` (N3 otherwise unchanged) |
| `R19-C` | live | `F7-11` (restricted roles as the owner-accepted trade-off, with the two later-retired restrictions recorded), `F7-23` (N4's contrast gate stays) |
| `R19-D` | live | `F7-08` (the sanctioned weight set and the dead restriction clause), `F7-02` (the token file's missing semibold — ruling wins) · `F3-14`'s "every sanctioned weight" obligation resolves against this row |
| `R19-E` | live | `F7-01` (every visual fact comes from the package), `F7-22` (the "brass centre" half of `D31` is void — the arc centre is the near-black primary action), `F7-23` (the retired POC document survives only as the interaction/a11y contract layer) |
| `EOD-6 · consistency-over-cleverness` | live *(the ledger records it as a principle with "no single owner doc" and "nearest home F3"; under the `docs/10` split it is design-language material and lands here as a stated principle rather than as a register note)* | `F7-38` |
| `D2` | live | `F7-30` (full parity at the mobile viewport including the studio) · the studio's own parity commitment `F7-44`; the WebView presentation stated in `modules/M05` §2 per `OD-9` |
| `D3` | superseded *(by the design-system owner ruling of 2026-07-24, docs/15 §3; `R19-E` formally retires "Instrument". The superseded graphite-and-brass text never enters this suite as a live requirement)* | post-overlay state → `F7-01`, `F7-04`, `F7-06` · the surviving half of the row — the POC document retained "for interaction/a11y/product-law contracts ONLY" — → `F7-23` |
| `D6` | live *(recorded as design-system provenance only; the stack half — styling framework and primitive library — is implementation and is excluded from PRD bodies per design spec §14/DD4)* | F7 §1 "Explicitly not in scope" (the reference implementation, named once) · the "screen gaps designed at implementation time via the UX-gap register" half → `F7-45` |
| `D31` | live *(amended — the arc-bar and role-adaptive-verb halves are live; the "brass centre" half is **void with `D3`** per `R19-E` and mockup ground truth. The census's "add this component to the Claude Design system" sentence is historical process, not a requirement, per the ledger note)* | `F7-22` · the multi-preset home/shell composition rule stays open at `registers/open-questions.md` Q5 (`modules/M13`) |
| `UXG-22` | live *(shared — the touch/interaction contract half the ledger routes explicitly to F7; the studio's mode toolbar, gesture layer and per-step tools stay with `modules/M05-design-studio.md`)* | `F7-29`, `F7-32`, `F7-23` (the no-hover-only and target-size contract the row inherits) |
| `UXG-24` | live *(shared — the sheet grammar and the "blur-toward-white per brand law" half; the obstruction settings sheet, the bridging chain, the BOM line-edit sheet and the studio's electrical gate stay with `modules/M05`)* | `F7-21`, `F7-18`, `F7-34` (progressive disclosure with the live consequence visible) |
| `UXG-26` | live *(the product-level law the row states — one boot colour, no stock vendor branding, no flash across the native-to-application handoff; the token-generation mechanism is engineering detail and is excluded. **Resolved 2026-08-04 (owner ruling Q13):** boot/splash = plain canvas + wordmark until the Q12 commissioned logo exists; the Android-12+ icon-on-splash follows the Q12 outcome — the letter-tile now — so the accepted divergence stands against a product asset, not a stock placeholder)* | `F7-05` · F7 §6 `F7-Q2` (resolved) → `registers/open-questions.md` Q13 (decision recorded 2026-08-04) |
| `UXG-27` | live *(was the owner-blocked brand-asset decision — **resolved 2026-08-04 (owner ruling Q12):** the launch app icon is a typographic letter-tile — bold H, brand face, near-black brand background, derived from the wordmark, nothing invented — unblocking store submission on both platforms; a commissioned logo replaces it post-launch via update)* | `F7-05` (amended with the ruling) · F7 §6 `F7-Q1` (resolved) → `registers/open-questions.md` Q12 (decision recorded 2026-08-04), with the boot-surface consequence at Q13 |
| `MULTI.1` | live *(shared — the F7 half Task 8's row names: the type-system pairing itself. The brand face has no coverage for the launch non-Latin script and must be paired with a matched script face; the face named in the source is stale with `D3`/`R19-E` and no replacement is asserted here)* | `F7-14` · the package ships no such face — recorded at F7 §6 `F7-Q3` → `registers/open-questions.md` Q14 |
| `MULTI.2` | live *(shared — the F7 half: the components and type scale that must absorb 15–30% expansion; the language-side law is `F3-16`, the eleven builder step titles are `modules/M06`'s)* | `F7-14`, `F7-41` |
| `MULTI.3` | live *(shared — the F7 half: the type scale keeps its sizes and line heights take a per-script adjustment; the language-side obligation is `F3-17`)* | `F7-14` |
| `MULTI.8` | live *(shared — the component half: buttons and chips wrap or truncate with the full text available and never overflow; the language-side law is `F3-16`)* | `F7-14` |
| `MULTI.12` | live *(shared — the design-time half: design every screen in the non-Latin launch script at least once, early; the completion-condition half is `F3-18`)* | `F7-41`, `F7-43` (item 7) |
| `CG-matrix.24` | live *(shared — the **visual** half of the competitive claim, which Task 8's row names as F7's: script-correct rendering is a type-system obligation, not only a translation one; the vernacular-UI and document lines stay with `foundations/F3`)* | `F7-14` |
| `CG-matrix.2` | live *(shared — the design-language half of the "full design parity on mobile (375 px, touch)" line, which no desktop-first rival holds; the studio capability that has to hold it stays with `modules/M05-design-studio.md`)* | `F7-30`, `F7-32` |
| `TC.branding.1` | live *(shared — the branding **law** half: logo and brand colour on customer documents only, contrast re-verified and never rejected; the tenant-configuration screen stays with `modules/M01-onboarding-and-tenant-config.md`)* | `F7-07` |
| `S5.rule.uxprob.1` | live *(shared — the general law the row states: dense control surfaces are answered with progressive disclosure, "not a smaller font"; the BOM screen itself and its redesign stay with `modules/M05-design-studio.md`)* | `F7-34` |

## Task 10 — `foundations/F4-data-integrity.md`

Appended by Task 10, re-dispositioned 2026-08-07. Requirement IDs in F4 use the prefix
`F4-<nn>`, and **ten rows are live** — `F4-04`, `F4-07`, `F4-14`, `F4-15`, `F4-16`, `F4-17`,
`F4-19`, `F4-21`, `F4-25`, `F4-27` — each keeping the id it had in the deleted document, so every
citation below that names one of them still resolves. §F4.1 states that the server owns truth and
money, §F4.2 the concurrency law (two people, one record, on a live connection), and §F4.3 the
nothing-captured-is-ever-lost laws, including the single photograph carve-out. F4 §4 records what
the document expects from other documents, and **F4 §5 · Non-goals** is what most of this block's
keys now land against.

**Block note — 2026-08-07, owner ruling `Q61`.** This block was written against
`foundations/F4-offline-and-sync.md`, **which no longer exists.** The owner removed the offline
and sync capability from the product entirely and the document was replaced by
`foundations/F4-data-integrity.md`: 25 of its 35 rows were deleted, and the ten that were never
about connectivity survived **with their original ids**. Every source key disposed of here
**keeps its row** — nothing is merged, dropped or renumbered — but the disposition and the PRD ref
are re-stated against the live document. Keys whose substance the ruling removed are now
`excluded` against `F4-data-integrity.md` §5 · Non-goals, or `superseded` by
`registers/open-questions.md` `Q61` where the ruling overrode a **ruling or a directive** rather
than declaring a non-goal; the precedent for a ruling-overrides-ruling mark is `Q15`, `Q16` and
`Q20`, all stamped SUPERSEDED 2026-08-07 by `Q61`. Where a key's substance survives whole or in
part, the row stays `live` and points at the row that actually carries it. Two holes the sweep
left inside this block's territory are recorded as **OPEN** owner questions and are deliberately
**not closed here**: `Q65` (`DOC06.update-required`, deleted `F4-35`) and `Q66`
(`DOC06.token-expiry`, deleted `F4-32`). No row is re-instated and no replacement is invented for
either. The surviving carve-out — field photographs held on the device until they upload — is
`F4-21` / `M04-55`, with its status on `SCR-M04-07` alone.

Conventions for reading this block:

1. **`DOC06.*` is disposed of here in full — all seventeen rows.** The offline-and-sync document
   was F4's own source and the ledger routes every one of its rows to F4, so each appears exactly
   once, below. Counted against the re-dispositioned table: **9 stay `live`, 5 are `excluded` and
   3 are `superseded`** *(recount 2026-08-07: `sync-status-ux` moved `excluded` → `live`, its key
   being carried verbatim by live P0 `F4-27`; and one of the three `superseded` rows,
   `online-only-set`, carries a **live half** at `F8-36` while its set-as-boundary half stays
   superseded — it is counted once, under `superseded`, and the live half is named in its row)* —
   the rows whose substance `Q61` removed are marked in place, never
   deleted. Where a row's surviving surface or mechanism half belongs elsewhere (`designs-not-mobile-offline` → `modules/M05`; `conflict-matrix` per
   entity → `modules/M02`/`M04`/`M05`/`M09`; `entitlement-grace` → `modules/M12`; `no-local-price`
   → `modules/M06`; the photograph queue → `modules/M04`, `M04-55`), the row says so and the owning
   module task states the surface without re-appending the key. The clause that used to close this
   convention — `F4-13` forbidding a module from restating the boundary differently — is void:
   `F4-13` is deleted and there is no boundary to restate.
2. **Shared dispositions** (Task 4 convention 3 / Task 6 convention 2 / Task 7 convention 2 /
   Task 8 convention 3 / Task 9 convention 2 precedent). Rows marked *shared* carry the **F4 half**
   of a key whose surfaces, screens or enforcement mechanics belong to another task's document.
   After `Q61` the F4 half of most of these is a **non-goal** rather than a law, and the row says
   which: `R14`'s per-surface offline notes (`modules/M02`, `modules/M04`, `modules/M11`) go with
   the boundary that was removed, while the ruling's non-connectivity clauses stay **live** at
   `F8-36`, `M05-09`, `M05-67` and `M02-36` — joined 2026-08-15 by `M02-66`, `M02-67` and `M09-71`, the three rows restored by rulings `Q62`–`Q64` (corrected 2026-08-07 — the M05 design-mutation note
   is a live clause, not a casualty of the boundary); `S4.rule.offline` keeps a live capture
   half in `modules/M04` (`M04-55`) while its F4 half is excluded; `DOC16.offline-drain-never-blocked`
   survives only as the photo instance in `modules/M12` (`M12-26`, which re-appends the key at
   Task 23); `CG-matrix.3` (the moat claim) and `OD-10` (the studio half, `modules/M05`) keep their
   pairings. Each pair is still intentional, not a duplicate; the owning task appends its own half,
   and a `live` half elsewhere does **not** make F4's half live.
3. **`UXG-10` is disposed of here, as Task 9 convention 3 said it would be.** Task 9 read all
   twenty-seven UX-gap rows as mandatory input to the V2 UX principles and recorded `UXG-10` as
   **informing-only there, staying with F4**. F4 absorbed it whole as seven rows; after `Q61` two
   of the seven are live with their ids — the version-kept notice `F4-25` and the non-blocking law
   `F4-27` — the photo-upload-progress element relocated to the capture screen (`M04-55` /
   `SCR-M04-07`), and the five sync surfaces (global indicator, sync centre, per-record chips and
   attention state, stale-read banner, localization of all of them) are non-goals under F4 §5
   bullet 2. The row's `OVERLAY:` half — the `R14` boundary it restated — is disposed of through
   `R14` below, not twice.
4. **Keys already closed by earlier tasks are not re-appended.** `CG-moat.3` (Task 3 convention 2 —
   shared keys named once, with the ref already pointing here) and `DOC03.mobile-scope` (Task 3)
   were cited as grounding for the offline-capable set and §2 without new rows; that grounding is
   void with the set, and `CG-moat.3`'s carrier `OV-39` was itself deleted by `Q61` (recorded in
   `Q61`: a product that requires a connection cannot advertise an offline field app). `OV-04`,
   `OV-08`, `OV-09` are consumed as published requirements, as are `F1-10`, `F2-12`,
   `F2.M02.*`/`F2.M04.*`/`F2.M12.*`
   capability rows, `F3-01`, `F3-06`–`F3-08`, `F3-16`, `F3-18`–`F3-24`, `F3-27`, `F7-12`, `F7-21`,
   `F7-30`, `F7-36` *(**STRUCK** 2026-08-07 by `Q61`, tier `—`: it was principle 7, "offline is a
   visible state on every surface", and it no longer binds — it is listed because the row is
   marked, never deleted, and it is not available as a carrier for anything)*, `F7-37`,
   `F7-39`, `F7-41`–`F7-43`, and `F8-08`–`F8-15`, `F8-17`–`F8-19`
   (`F8-16` was deleted in the same 2026-08-07 sweep; the surviving money-honesty law is `F8-12`),
   `F8-36`. No source key is re-disposed for any of them.
5. **Cited-but-not-disposed keys stay with their owners.** F4 cites, as grounding only:
   `S4.screen.10` (the Mode B sync-status screen), `S4.wrong.6` (no signal → everything works),
   `S4.rule.capture` (the capture groups), `D35` (`modules/M04`); `S2.screen.1` (quick-add is
   offline-full — `modules/M02`); `S7.rule.my-day` (`modules/M07`); `S6B.rec.5` (draft-save vs the
   boundary — `modules/M06`); `DOC16.never-gated`, `DOC16.softblock.always-on`,
   `DOC16.soft-block-never-hard` (`modules/M12`); `DOC08.session-lifetimes` (`modules/M01`);
   `DOC02.money-never-stale-api`, `DOC04.design-freshness-pins` (already disposed at
   `foundations/F8`); `R18` (the tier vocabulary, `foundations/F8`); `R16` (the crew-login law
   behind the task-tick row — `foundations/F2`/`modules/M08`). The grounding citations framed
   around connectivity (`S4.screen.10`, `S4.wrong.6`, `S2.screen.1`, `S6B.rec.5`) no longer appear
   in the live document, `Q61` having removed what they grounded; they are listed as written
   because the keys still belong to their owners and none is re-disposed here.

| source key | disposition | PRD ref |
|---|---|---|
| `R14` | superseded *(shared — the **boundary half only**. This ruling **was** the offline-scope boundary: an offline-full set, an online-only set, and reads degrading to cache behind a staleness banner, declared normative. Owner ruling `Q61` (2026-08-07) overrode **that half** wholesale — there is no offline-capable set left to draw a boundary around — and five of its six original refs (`F4-08`, `F4-09`, `F4-10`, `F4-01`, `F4-13`) are deleted rows. A ruling overriding a ruling takes the SUPERSEDED mark; the precedent is `Q15`, `Q16` and `Q20`, all stamped SUPERSEDED 2026-08-07 by `Q61`. The sixth ref, `F4-15`, is alive but survives as the **concurrency** law under `DOC06.conflict-matrix` / `DOC06.designs-not-mobile-offline`, and is deliberately **not** carried here — carrying it would make this row read as though a boundary still existed. The per-surface offline notes the ledger routed to `modules/M02` (quick-add lead, activity logging, My Day), `modules/M04` (survey capture + photos) and `modules/M11` (money-never-stale) go with the boundary. The money note has a live echo at `M11-06` ("every money mutation is online-only and is refused, never queued"), but `M11-06`'s source line is `DOC06.server-owns-money`, so it is **not** claimed as this key's carrier)* + live *(**corrected 2026-08-07 — the surviving half, which the wholesale mark had left dispositioned nowhere.** `R14` is not a dead ruling: four live rows name it in their own `SRC` cells, and two of the four have nothing to do with connectivity. **`F8-36`** carries the fail-fast clause verbatim — actions that cannot be performed *"fail fast, honest message, never queued"* — as a general honesty law covering connectivity, entitlement and missing capability alike. **`M05-09`** carries the design-mutation clause, its `SRC` naming the M05 half word for word: *"design mutations (single-editor LWW + server version check)"* — which is why that clause is **no longer** listed above among the per-surface notes that went with the boundary. **`M05-67`** carries the server-side render clause — the PDF is rendered server-side per `R14`, cited. **`M02-36`** consumes the ruling through `F4-16`/`F4-19` for capture-time semantics and conflict policy, restating neither. (`OV-38` additionally names `R14` among the honesty system's grounding rulings; the overview block owns that citation and it is not re-disposed here.) None of these four is claimed for the boundary half, and none of the four is one of `Q62`–`Q66`. **Extended 2026-08-15 — three further live carriers of this same surviving half.** Owner rulings `Q62`, `Q63` and `Q64` ruled on three obligations the `Q61` sweep had cut although connectivity was never their subject, and restored each as a **new** row rather than by re-instating a deleted id: **`M02-66`** (`modules/M02-crm-and-leads.md` §M02.2 — a duplicate the live check could not see is resolved explicitly, never silently, and nothing is ever merged automatically), **`M02-67`** (§M02.5 — triage actions are completed by the server, and the inbox says so rather than assuming) and **`M09-71`** (`modules/M09-field-workforce.md` §M09.5 — a day start or a day end is recorded only once the server has it). Each names `F8-36` — the live P0 carrying this ruling's fail-fast clause verbatim, "does not silently queue, partially apply, or display an optimistic result" — as the law it makes concrete at its own surface, alongside `M11-06` for money and `M05-09` for designs; none of the three names `R14` in its own `SRC` cell, and none is claimed for the boundary half either. The rows they restore — `M02-04`, `M02-26` and `M09-36` — were genuinely deleted on 2026-08-07 and **stay deleted**; their ids are not reused and nothing recorded about their deletion is unstruck. Of the five holes the sweep left, `Q65` and `Q66` alone remain OPEN)* | `registers/open-questions.md` `Q61` (offline capability removed entirely) · the boundary half's non-goal is recorded at `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1 ("No offline mode") and bullet 2 ("No sync surface") · **the surviving half is live at `F8-36` (fail-fast, verbatim), `M05-09` (design mutations — LWW + server version check), `M05-67` (server-side PDF render) and `M02-36` (`R14` via `F4-16`/`F4-19`), and — through `F8-36`, by owner rulings `Q62`–`Q64` (2026-08-15) — at `M02-66`, `M02-67` and `M09-71`** |
| `DOC06.reads-local` | excluded *(the key's claim is "Reads are local, always" — every synced entity read from an on-device store. `F4-02`, which quoted it verbatim, is deleted, and F4 §5 bullet 1 names exactly this a non-goal: the product "does not read from a cache, does not queue mutations". **Nothing live carries a local read.** The trailing clause this key shared with `DOC06.sync-status-ux` — no spinner wall, no blocked primary action — does survive verbatim at `F4-27`, but `F4-27`'s source line names `DOC06.sync-status-ux`, and "no screen blocks on connectivity" is precisely what `Q61` reversed; the key is therefore excluded rather than live)* | `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1 ("No offline mode" — the product does not read from a cache); per `Q61` |
| `DOC06.writes-queued` | excluded *(two halves. The **durable upload queue for offline mutations** is deleted with `F4-03` and is a named non-goal — F4 §5 bullet 1, "does not queue mutations"; the only device-held queue left in the product holds photographs and nothing else (`M04-55`, and that queue is `DOC06.attachment-pipeline`'s, not this key's). The second half — **"the server is the only writer of record"** — does survive, stated as "The server owns truth and money" at `F4-04`, whose source line names `DOC06.server-owns-money`. It is named in the ref so the surviving half is not lost, but the key's own substance, queued writes, is excluded)* | `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1 ("does not queue mutations"); the *server is the only writer of record* half is stated at `F4-04` |
| `DOC06.server-owns-money` | live *(unchanged by `Q61` — `F4-04` survived the sweep with its id and its text intact in `foundations/F4-data-integrity.md` §F4.1: version checks, tenant checks, business identifiers and every money figure computed server-side, with the source's rupee phrasing quoted and restated market-neutrally per design spec §6. The in-row pointer this register used to carry to `F8-16` for provisional labelling is dropped — `F8-16` was deleted in the same sweep; the surviving money-honesty law is `F8-12`, "money must never render as final while stale", carried at the module surfaces by `M06-41` and `M11-06`)* | `F4-04` |
| `DOC06.offline-full-set` | excluded *(the eight-capability offline-full set — survey capture, survey photos, quick-add lead, activity/visit logging, task ticks, My Day and the read cache — is exactly the capability `Q61` removed; `F4-08` and its table are deleted, and F4 §5 bullet 1 makes the cache and the mutation queue non-goals by name. **Exactly one of the eight survives, and only as the carve-out:** survey photographs are held on the device until they upload — one queue, one direction, no conflicts, no merge, status on `SCR-M04-07` only. It is named in the ref so the carve-out stays visible, but the set as a boundary is gone)* | `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1; the single surviving item — field photographs held on the device — is `F4-21` (F4's carve-out) / `M04-55` (the queue itself, status on `SCR-M04-07` only) |
| `DOC06.online-only-set` | superseded *(the **set-as-boundary** half — not a non-goal, the opposite. The nine-capability online-only set existed only as the contrast half of `R14`'s boundary, and `Q61` made the **whole product** online-only: "The product requires a live connection" (F4 preamble). `F4-09`, its table and the three-term vocabulary `F4-01` that named the set are all deleted, so there is no set left to enumerate — the ruling absorbed it)* + live *(**corrected 2026-08-07 — the key has a live home this row failed to name.** `F8-36` carries `DOC06.online-only-set` **by name in its own `SRC` cell**, alongside `R14`, and states the set's operative law without the set: where the product cannot complete an action — connectivity, entitlement, a missing capability — it says so at the moment of the attempt, in plain language naming the reason, and does not silently queue, partially apply or display an optimistic result. That is what being online-only *means* once the enumeration is gone, so the key is dispositioned live there rather than left wholly dead. The money instance stays separately live at `M11-06` and the studio/design instance at `M05-09`; those are surfaces of the law, not this key's carrier)* | `F8-36` (the live carrier — this key is on its source line) · `registers/open-questions.md` `Q61` · `foundations/F4-data-integrity.md` preamble (the product requires a live connection; losing it is an ordinary network error) — the money instance stays live at `M11-06` |
| `DOC06.stale-reads` | excluded *(both original refs are deleted rows and both halves of the key are named non-goals: reads degrading to cache is F4 §5 bullet 1 (no cache), and the staleness banner is F4 §5 bullet 2 ("no staleness or freshness banner"). The **money** half of the key is not lost, but it was never F4's — it is `F8-12`'s law, "money must never render as final while stale", carried at `M06-41`. The `F8-16` citation this row used to carry is dropped: `F8-16` was deleted in the same sweep, so `F8-12` is cited alone)* | `foundations/F4-data-integrity.md` §5 · Non-goals, bullets 1–2 (no cache; no staleness or freshness banner); the money-staleness law is unaffected at `F8-12` / `M06-41` |
| `DOC06.designs-not-mobile-offline` | live *(shared — `F4-11` is deleted, but the **substantive** half of this key survives whole at `F4-15` in §F4.2: every design save carries the version it was based on, a mismatch is refused, the client reloads server state and the user re-applies — "No merge, ever". That is the source's stale-save rollback-and-reload clause, now stated as an ordinary concurrency law rather than an offline one. The other two halves die with the capability and are **excluded**: "designs are not in the mobile offline set" is moot, since nothing is, and the web studio's connectivity-blip tolerance — local geometry, layout and electrical with only recomputes and saves queued — is a queue, a non-goal under F4 §5 bullet 1. The studio's editor, tools, recompute surfaces and reload prompt stay with `modules/M05-design-studio.md`, `M05-09`)* | `F4-15` |
| `DOC06.conflict-matrix` | live *(shared — the concurrency law survived whole and with original ids; F4 §F4.2 reframes all five rows as governing "two people working at the same moment on a live connection". The entities they govern belong to `modules/M04` (survey versions), `modules/M05` (design, `M05-09`), `modules/M02` (lead fields, stage machine, `M02-36`) and `modules/M09` (visit states), each of which states its surface without restating the policy. **`F4-18` is dropped from the ref:** it carried the matrix's two device-store entries — catalog read-only on the device, notification read-state up only — and was deleted correctly, since with no on-device store neither has a subject; the notification-side row `F6-18` went with it and `foundations/F6` is no longer a sharer of this key. That loss is **not** one of `Q62`–`Q66` and needs no hole: it is a direct consequence of the removal. **Extended 2026-08-15 — new live rows at two of the surfaces named above.** Owner rulings `Q62`, `Q63` and `Q64` restored three obligations the `Q61` sweep had cut, each as a **new** row: at `modules/M02`, **`M02-66`** (the apply-time duplicate — `M02-07`'s check runs *before* the save, so two captures of the same number in the same moment can both pass it and the server finds the collision only on apply; both records are flagged and nothing is ever merged automatically, which is this key's "No merge, ever" at the lead surface) and **`M02-67`** (the case it exists for is two people triaging the same lead — the second sees it already assigned rather than overwriting the first); at `modules/M09`, **`M09-71`** (a day start or a day end is recorded only once the server has it — the honest-refusal instance, whose carrier law is `F8-36` rather than the visit-state entity of this matrix). All three state their surface without restating the policy, exactly as the entities above do; the policy itself stays F4's at the five rows in the ref. The rows they restore — `M02-04`, `M02-26`, `M09-36` — stay deleted and their ids are not reused)* | `F4-14` (survey versioned-append, "a revisit NEVER overwrites v1", verbatim), `F4-15` ("No merge, ever", verbatim), `F4-16` (per-field LWW + activity entry, verbatim), `F4-17` (visit forward-only), `F4-19` (server apply order, never device clocks, verbatim) *(The three rows restored 2026-08-15 by `Q62`–`Q64` — `M02-66`, `M02-67`, `M09-71` — sit next to this key at the same surfaces but are **not** claimed as its carriers: each names `F8-36` in its own `SRC` cell, not this matrix. Same treatment as `DOC06.rejects-ack` and as `M11-06` on the `R14` row. A ref cell listing them here would double-claim them, which this block forbids.)* |
| `DOC06.rejects-ack` | excluded *(both original refs, `F4-20` and `F4-24`, are deleted. The key is the **queue's acknowledgement protocol**: every mutation response acks, server truth replaces local state on next sync, rejections surface in the attention tray. With no queue and no local state there is nothing to acknowledge and nothing to replace (F4 §5 bullet 1), and the attention tray is a sync surface (F4 §5 bullet 2). The nearest surviving statement is `F4-21`'s preserve-and-badge guarantee — "a record that fails validation is preserved and badged for attention… a submission the server cannot accept is preserved for recovery rather than discarded" — but that clause is `DOC06.quarantine`'s and is disposed there; it is **not** double-claimed as this key's carrier)* | `foundations/F4-data-integrity.md` §5 · Non-goals, bullets 1–2 (no queue, therefore no ack protocol; no attention tray) — the preserve-and-badge guarantee it neighboured is `F4-21`, disposed under `DOC06.quarantine` |
| `DOC06.attachment-pipeline` | live *(**this is THE carve-out** and it survives almost intact, relocated. All three original refs (`F4-29`, `F4-30`, `F4-31`) are deleted, but `M04-55` carries the pipeline verbatim in substance: written to the device the moment it is taken, uploads when the connection returns, resumable, Wi-Fi-or-charging default with a per-batch "upload now", never blocked or degraded to fit a network, plus the storage cap and its eviction order — acknowledged originals evicted first, an unacknowledged original never evicted (old `F4-31`). `F4-21` carries F4's half: the photograph is held on the device until it has uploaded, with its waiting count and retry on the capture screen itself. **Two clauses die:** "small mutations always upload immediately" — there are no queued mutations — and the ack-then-prune thumbnail detail, which no live row restates. Related but not this key's ref: `M12-26` / `M12-24` guarantee the upload is never gated by billing state)* | `F4-21` (held on device until uploaded; count + retry on the capture screen), `M04-55` (the queue itself: resumable, Wi-Fi-or-charging default, per-batch override, storage cap and eviction order; status on `SCR-M04-07` only) |
| `DOC06.sync-status-ux` | live *(shared — **re-dispositioned 2026-08-07 from `excluded`, which was wrong: a key whose text a live P0 requirement carries verbatim in its own `SRC` cell cannot be an explicit non-goal.** `F4-27` is live in `foundations/F4-data-integrity.md` §F4.3 and **names this key by name on its own source line** — "`DOC06.sync-status-ux` (docs/06 §9), quoted verbatim: *Never blocking — no modal, no spinner wall, no disabled primary actions*" — now a general honesty law rather than a connectivity one, and the same pass already treats `F4-27` as the live carrier of `UXG-10`'s non-blocking half and of the surviving `F4-02`/`F4-18` never-blocking obligation in the Task 23 — F6 block. The photo-upload-progress element is the one status **surface** left, on the capture screen only (`F4-21` / `M04-55`, status on `SCR-M04-07`). **The excluded halves are the five deleted sync surfaces**, all non-goals under F4 §5 · Non-goals, bullet 2: the global connection indicator (`F4-22`), the sync centre (`F4-23`), the per-record queued-or-unsynced chips and attention state (`F4-24`), the per-record chips (`F4-24`) and the stale-read banner (`F4-26`) — with `F4-28`, the row requiring all five be translated, dying with them — with `Q61` adding "no `offline` state on any screen" and recording `SCR-SHELL-04`/`SCR-SHELL-05` deleted, 152 → 150 screens. The localization obligation needs **no hole**, since the surfaces it localized no longer exist)* | `F4-27` ("Never blocking", verbatim — this key is on its source line) · the one surviving status surface is the photo queue on `SCR-M04-07` only (`F4-21`, `M04-55`) · the five excluded halves at `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2 ("No sync surface") · `registers/open-questions.md` `Q61` |
| `DOC06.token-expiry` | superseded *(`F4-32` is deleted and this is **one of the five holes the sweep recorded (`Q62`–`Q66`) — `Q66`** — and, since the owner ruled on `Q62`, `Q63` and `Q64` on 2026-08-15, one of the **two still OPEN**. The key's first half — local reads and writes continuing indefinitely while the session token is expired — died correctly with the local-first store and is a non-goal under F4 §5 bullet 1. Its second half, the **tenant-isolation wipe** — a different user signing in wipes the local DB and queue first, "tenant isolation beats convenience" — did **not** become moot, because photographs still sit on the device. `Q66` records that no live row carries it: `M04-55` governs the queue but not who is signed in, `M01-07` covers session lifetime and revocation but not device-held data, `F2-20` covers deactivation not user switching, and `F4-21` pulls the other way. `Q66` is **OPEN** and blocks any multi-user field device. The row is **not** re-instated and no replacement is invented — the residue is `Q66`'s)* | `registers/open-questions.md` `Q61` (the deletion) · the tenant-isolation half is OPEN as `Q66` — no live row carries it; `M01-07` is adjacent (session lifetime and revocation) but does not cover device-held data |
| `DOC06.update-required` | superseded *(`F4-35` is deleted and this is the hole recorded as **`Q65`**. It was deleted correctly *as written* — its trigger was a sync-contract change and its mitigation was that local reads keep working, and with no local store neither half is possible — **but the product still ships client versions.** A grep across `docs/prd/foundations`, `docs/prd/modules` and `docs/prd/0*.md` for "update required", "forced upgrade", "minimum supported version" and "version skew" returns nothing, so no live row carries it. `Q65` is **OPEN**; it blocks no screen, `SCR-SHELL-05` having been deleted with the row, but it blocks the first breaking API change. Not re-instated, no replacement invented)* | `registers/open-questions.md` `Q61` (the deletion) · the too-old-client rule is OPEN as `Q65` — no live row on client version skew exists anywhere in the PRD |
| `DOC06.quarantine` | live *(`F4-21` survived with its id and is now the whole of §F4.3, quoting both source phrases verbatim — "Quarantine, never crash, never silently drop" carried as the preserve-and-badge behaviour, and "nothing a field user captured is ever unrecoverable" adopted whole as the row's headline. **`F4-03` is dropped** (deleted; it was the queue). The eviction-order guarantee that used to sit at `F4-31` — an unacknowledged original is never evicted — is live at `M04-55` and is cited in its place; it is the only place the never-silently-drop rule is still mechanised. Note: `Q66` records that `F4-21`'s "nothing is unrecoverable" promise is in **direct conflict** with the deleted tenant-isolation wipe on a shared field phone, and the product currently states both)* | `F4-21` (both source phrases, verbatim), `M04-55` (the eviction-order half: acknowledged originals first, an unacknowledged original never) |
| `DOC06.entitlement-grace` | live *(shared — `F4-34` is deleted but the substance **moved intact to M12**, and `Q16`'s 2026-08-07 update states the split precisely. The half that survives — field capture is never cut off by elapsed time, works through the full dunning grace and pauses only at `halted`, with a mid-visit halt letting the current visit complete ("never strand a surveyor on a roof") — is live and unchanged at `M12-27`, with the always-on read/export/customer-link set at `M12-22` and `M12-24`. The half that dies is the **mechanism only**: no cached entitlement, no 72-hour device grace, no state the device learns on reconnect, no queue to drain (F4 §5 bullet 1). **`F4-Q2`/`Q16` is closed, not open** — this key is no longer routed to an open question. Entitlement enforcement, the billing-state matrix and every gate stay with `modules/M12-platform-billing.md`)* | `M12-27` (capture through the full grace, pauses only at `halted`, finish-the-visit), `M12-22` and `M12-24` (the always-on read/export/customer-link set) · `Q16` PARTLY SUPERSEDED 2026-08-07, mechanism half excluded at `foundations/F4-data-integrity.md` §5 |
| `DOC06.no-local-price` | live *(shared — `F4-12` is deleted but the law itself is live twice over. `F4-04` states that every money figure is computed server-side and that no device computes, assigns or finalises a money figure for any market; `M06-41` states the module surface verbatim — "No device prints a customer-facing price computed locally (`F4-04` consumed)" — plus the stale-renders-visibly obligation. The only half that dies is "offline, a user can queue a proposal-draft request": there is no queue (F4 §5 bullet 1). The `F8-16` pointer this row used to carry is replaced by `F8-12`, which is live and carries "money must never render as final while stale". The proposal builder and its draft behaviour stay with `modules/M06-proposals.md`)* | `F4-04`, `M06-41` · the provisional-rendering obligation is `F8-12` (not `F8-16`, which is deleted) |
| `DOC06.online-first-until-offline` | live *(`F4-06` — the online-first-is-a-move-in-time-only half — is deleted: with no offline layer coming there is no interim state to qualify, and the claim "never a reduction in scope" is exactly what `Q61` falsified. `F4-07` survived with its id and carries the two guarantees the source tied to the **write model** rather than to any connectivity layer: a survey is versioned-append, and a submission applied twice never produces a second record. Its live text says so explicitly, which is why the ref narrows cleanly to one row. The sequencing half — tracks, phases, day numbers — remains excluded from PRD bodies per design spec §14/DD4)* | `F4-07` |
| `UXG-10` | live *(F4 absorbed it whole, as Task 9 convention 3 recorded; five of the seven refs are now deleted, but two survived with their ids and one element relocated. `F4-25` is live in §F4.3 and **still cites `UXG-10` as its source**, quoting "v2 — v1 kept" verbatim — the version-kept notice survives because it belongs to `F4-14`'s concurrency law, not to connectivity. `F4-27` is live and carries the non-blocking law. The photo-upload-progress element that used to sit inside the sync centre now lives on the capture screen. **Excluded halves:** the global indicator (`F4-22`), the sync centre (`F4-23`), the per-record chips and attention state (`F4-24`), the stale-read banner (`F4-26`) and the localization obligation (`F4-28`) are all non-goals under F4 §5 bullet 2. The row's routing notes are honoured with one correction: money-staleness labelling is `foundations/F8`'s at `F8-12`, not the deleted `F8-16`; survey capture is `modules/M04`'s)* | `F4-25` (version-kept notice, "v2 — v1 kept", verbatim), `F4-27` (non-blocking), `M04-55` (photo upload progress, on `SCR-M04-07` only) · the five sync surfaces are excluded at `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2 |
| `S4.rule.offline` | excluded *(shared — all four original refs are deleted, and the **F4 half this row disposes of IS the offline law**: "Offline is the normal case, not the edge case", "Everything saves locally first. Sync is a background fact, not a user action." That is the precise capability F4 §5 bullet 1 now names a non-goal, and F4 §1 no longer quotes it. The shared-disposition structure is kept: the **survey capture half stays with `modules/M04`**, where it is genuinely live — `M04-55`'s source line still names `S4.rule.offline` (the capture half) — and F4's own residue is the photograph carve-out at `F4-21`. This row is **not** marked live on the strength of `M04-55`: that is the M04 block's half, appended there. The survey's two modes and its capture groups stay with `modules/M04-survey.md`)* | `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1 · the capture half stays live in `modules/M04` (`M04-55`) and F4's residue is the photo carve-out `F4-21` |
| `DOC16.offline-drain-never-blocked` | live *(shared — `F4-33` is deleted, but the key's **surviving instance is already published in M12** and the M12 block (Task 23) disposes of it there at `M12-26`: a photograph already captured in the field always uploads, in every billing state; the block is on new mutations from the interface, never on the upload of a photograph the field user has already taken — and `M12-26`'s source line names this exact key, calling the photo carve-out its surviving instance after the offline capability was deleted. `M12-24` reinforces it by putting "the upload of photographs already captured in the field" in the never-gated list. The **generic queue-drain half is moot**: there is no queue but the photo queue. The billing-state matrix, the soft-block law and every enforcement point stay with `modules/M12-platform-billing.md`, which re-appends this key at Task 23)* | `M12-26` (the surviving instance — an already-captured photograph always uploads, in every billing state), `M12-24` (never-gated list) |
| `DOC14.offline-scope` | excluded *(every ref is deleted, **including §F4.4**, the whole sync-status section. The key is a scope commitment naming three things — physical survey fully offline, photo attachments, and sync-status UX, "all committed and unreduced". Two of the three are now non-goals by name: survey-offline under F4 §5 bullet 1, the sync-status UX under bullet 2. The "unreduced" framing is precisely what `Q61` reversed, with its cost stated plainly — a surveyor with no signal cannot open their assigned work. **The one commitment that holds is photo attachments.** The dependency ordering and the "last track" framing remain excluded per design spec §14/DD4 as before)* | `foundations/F4-data-integrity.md` §5 · Non-goals, bullets 1–2 · `registers/open-questions.md` `Q61` — the one surviving commitment, photo attachments, is `F4-21` / `M04-55` |
| `OD-10 · studio-and-offline-last` | superseded *(shared — `F4-06` is deleted. The F4 half of this key was the promise that deferring offline was "a move in TIME only — never in scope or quality", with online-first as an interim state qualifying `R14`'s boundary as the target state. `Q61` falsified **both clauses at once**: the move turned out to be in scope, permanently, and there is no target-state boundary left to be interim to. A ruling overriding a directive takes the same SUPERSEDED mark as `Q15`/`Q16`/`Q20`. The studio-ordering half (`OD-10`'s row at M05 §1) and the build-ordering exclusion per design spec §14/DD4 are separate register rows, untouched by this disposition. **The flag this row used to raise against `modules/M05` §1 is withdrawn (read and verified 2026-08-07):** M05 §1 uses the phrase about the studio's **build priority** — *"Low priority / design this last" in the source is sequencing history, not scope: the owner's directives make it a move in time only, never in scope or quality* — which is a statement about the flagship's ordering that `Q61` does not touch and did not falsify. Only the **offline** instance of the phrase, F4's `F4-06`, was falsified. Nothing in M05 §1 is to be struck on this row's account)* | `registers/open-questions.md` `Q61` — the interim-state clause it qualified (`R14`'s boundary) no longer exists; the studio-ordering half stays with `modules/M05` (M05 §1), unflagged and still true |
| `CG-matrix.3` | excluded *(shared — a competitive-moat claim **the product can no longer make**. The claim is "Offline field capture (survey, photos)" — read+write with a durable queue, held partially by one rival and by none of the other five. Every ref is a deleted row, and `OV-39` itself is deleted: `Q61` records that `OV-39`'s competitive-moat claim and `BM-05`'s public pricing-page feature line were both struck "because a product that requires a connection cannot advertise an offline field app". Surveys are no longer captured offline, so the claim's survey half is void, and the residual — photographs held on the device until they upload (`M04-55`) — is a **recovery guarantee, not a differentiator**. Marking this row live on `M04-55` would restate a claim the owner deleted on purpose. The capture experience itself stays with `modules/M04-survey.md`)* | `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1 · `registers/open-questions.md` `Q61` (records `OV-39`'s moat claim and `BM-05`'s public feature line deleted for exactly this reason) |

## Task 11 — `04-business-model.md`

Appended by Task 11. Requirement IDs in the business-model document use the prefix `BM-<nn>`
(`BM-01`–`BM-47`); §04.1 carries the packaging convictions and the nine-principles carriage
table, §04.2 the tier structure, §04.3 the five-meter set, §04.5 the soft-block law and state
capability matrix, §04.6 the market price-book architecture with the India book (`BM-41`, the
reciprocal of F1's `F1-60`/`F1-61` identification).

Conventions for reading this block:

1. **Keys already dispositioned by Task 3 are not re-appended.** Task 3's rows for
   `DOC01.in-price-book`, `DOC01.org-pays`, `DOC01.gates-capacity-not-features`,
   `DOC01.tier-positioning`, `DOC01.price-for-every-epc`, `CG-moat.6` and `DOC00.market-moment`
   already name this document as the owner of their mechanics. Per Task 3's conventions 1–2,
   this document assigns the requirement IDs those refs resolve to — `BM-10` (+`BM-41`
   discipline), `BM-01`, `BM-05`, `BM-14`, `BM-08`, `BM-04`, and `BM-43` (§04.8 market
   context) respectively — without new rows.
2. **Shared dispositions** (Task 4 convention 3 / Task 6 convention 2 / Task 7 convention 2
   precedent). Rows below marked *shared* carry the **business-model-law half** — who pays,
   packaging law, the cap law, the soft-block law and its product-level capability matrix, the
   supplier-of-record posture — of keys whose mechanics/enforcement half belongs to
   `modules/M12-platform-billing.md` (Task 23: lifecycle, gates, ledger, dunning, invoicing) or
   `modules/M11-payments-and-collections.md` (Task 22: BYO collections). Each pair is
   intentional, not a duplicate; the owning task appends its own half.
3. **Cited-but-not-disposed keys stay with their owners.** This document cites, as grounding
   only: `DOC16.lifecycle-states`, `DOC16.past-due-grace`, `DOC16.trial-expired-terminal`,
   `DOC16.trial`, `DOC16.trial-nudges`, `DOC16.reactivation`, `DOC16.soft-block-never-hard`,
   `DOC16.never-gated`, `DOC16.halted-inbound-degrade`, `DOC16.metering-rules`,
   `DOC16.usage-ledger`, `DOC16.overage`, `DOC16.usage-honesty` (Task 7 → `F8-33`; M12
   re-appends), `DOC16.upgrade`, `DOC16.downgrade`, `DOC16.gate.state-guard`,
   `DOC16.gate.design-kw`, `DOC16.gate.voice`, `DOC16.gate.ai-detection`, `DOC16.gate.storage`,
   `DOC16.route-rejected`, `DOC16.no-feature-flags` (owner directive 8 — `00-README`/M12),
   `DOC16.goodwill-credits`, `DOC04.subscription-states`, `DOC05.no-kw-clamp`, `UD-5` (all
   M12/M11/M04/M05 per the ledger's targets). `DOC16.mandate-routes` and `DOC16.mandate-ladder`
   were disposed by Task 6 (shared, `F1-40`/`F1-41`); `BM-13`/`BM-29`/`BM-41` consume `F1-40`
   as a published requirement without re-disposing them. F1, F8, F2, F4 and OV requirements
   (`F1-24`–`F1-27`, `F1-40`, `F1-60`/`F1-61`, `F8-33`/`F8-34`, `F2.M12.manage-billing`,
   `OV-20`, `OV-26`–`OV-30`) are consumed by ID; no source key is re-disposed for them. `F4-34`
   was in this consumed set and is **deleted** (2026-08-07, owner ruling `Q61`): the cached
   entitlement and its 72-hour device grace were the mechanism half, now a non-goal under
   `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1. What this document consumed of
   it survives whole in M12 — capture through the full dunning grace, pausing only at `halted`,
   with a mid-visit halt letting the visit finish (`M12-27`), and the always-on read/export set
   (`M12-22`, `M12-24`) — so `M12-27` is the id to consume in its place. `BM-05`'s public
   pricing-page offline feature line was deleted by the same ruling.
4. **Correction note on `DOC16.gst-supplier-of-record`.** Task 6's row routes its
   "business-model posture" half to "Task 7"; Task 7's F8 block does not carry it (F8 has no
   supplier-of-record content). The posture half lands here, at `BM-40`, as this block's shared
   row — recorded so the closure pass reads Task 6's pointer as resolving to Task 11.

| source key | disposition | PRD ref |
|---|---|---|
| `DOC16.billing-in-v1` | live | `BM-03` |
| `DOC16.two-money-systems` | live | `BM-02` · collections detail stays with `modules/M11` per the ledger |
| `DOC16.pricing-single-source` | live *(shared — the **definition half**: `04-business-model.md` is the one place a price, tier name, state name or matrix row is defined. The **consumption half** — M12 consumes those definitions by ID and never re-defines them — is `M12-02`, appended in the Task 23 block; the split is deliberate and the two rows are not a duplicate)* | `BM-09` (restated as this document's one-definition-per-fact law) |
| `DOC16.org-pricing` | live | `BM-01`, `BM-04` |
| `DOC16.unlimited-users` | live | `BM-06` (capacity-not-features half at `BM-05`) |
| `DOC16.capacity-levers` | live | `BM-12` (values as IN-book data at `BM-41`) |
| `DOC16.softblock.always-on` | live *(shared — the product-law always-on rows of the matrix; enforcement mechanics re-appended by `modules/M12` at Task 23)* | `BM-32`, `BM-35` (matrix rows 1–4) |
| `DOC16.softblock.core-gated` | live *(shared — same split)* | `BM-35` (matrix rows 5–8) |
| `DOC16.softblock.metered-pause` | live *(shared — same split)* | `BM-35` (matrix rows 9–10) |
| `DOC16.softblock.invites` | live *(shared — same split)* | `BM-35` (matrix row 11) |
| `DOC16.gst-supplier-of-record` | live *(shared — the business-model posture half, per convention 4; the IN tax-scheme half is `F1-29` (Task 6), invoicing mechanics `modules/M12`)* | `BM-40` |
| `DOC01.byo-collections` | live *(shared — the who-pays half; BYO-gateway collections mechanics are `modules/M11`'s, Task 22)* | `BM-02` |
| `DOC01.trial` | live | `BM-28` (trial law; cap values as IN-book data at `BM-41`), `BM-03` |
| `DOC01.mandate-at-conversion` | live *(shared — the conversion-not-signup law; gateway mechanics `modules/M12`, the IN rail facts `F1-40` per Task 6)* | `BM-29` |
| `DOC01.trial-soft-block` | live *(shared — the law half; enforcement `modules/M12`)* | `BM-30`, `BM-32` |
| `DOC01.no-free-tier` | live | `BM-03` · rationale carried verbatim at §5 Non-goals |
| `DOC01.reslink-calibration` | live | `BM-41` (recorded benchmarks), `BM-12` (capacity-axis adoption; the replaced cumulative meter noted in §04.2 behavior detail) |
| `DOC01.billing-cadence` | live | `BM-13` (cadence law), `BM-41` (IN anchors and yearly prices) |
| `DOC01.tier-table` | live | `BM-41` (the IN book instance — every value), `BM-11` (structure half), `BM-15` (Enterprise column; the never-features reading recorded in-row, not silently resolved) |
| `DOC01.cap-soft-block` | live *(shared — the cap-enforcement law; per-gate enforcement points `modules/M12` per `DOC16.gate.*`)* | `BM-34` |
| `DOC01.metered-bundles` | live | `BM-16` (meter set), `BM-18`–`BM-20` (the three carried meters), `BM-24` (OTP absorbed), `BM-25` (quota containment) |
| `DOC01.rate-card-caution` | live | `BM-26` (CAUTION carried; extended to the V2 meters via BM-Q1/Q1) |
| `DOC01.margin-ruling` | live | `BM-17` (≥40% overage floor, bundle sizing, margin target), `BM-31` (trial COGS bound) |
| `DOC01.gtm` | live | `BM-43`–`BM-47` (§04.8, product-level carriage) |
| `DOC01.price-under-incumbents` | live | `BM-39` (generalized benchmark law; IN instance `BM-41`) |
| `DOC01.yearly-payment-rail` | live *(shared — the cadence/collection posture half; rail mechanics `modules/M12`, IN rail facts `F1-40` per Task 6)* | `BM-13`, `BM-41` (collection routes) |
| `DOC01.supplier-of-record` | live *(shared — the posture half; invoice generation mechanics `modules/M12`)* | `BM-40` |
| `DOC01.grandfather` | live | `BM-42` |
| `DOC01.creation-caps` | live *(shared — the caps-as-signals law; enforcement `modules/M12` per `DOC01.cap-soft-block`)* | `BM-07` (law), `BM-41` (counts) |
| `DOC04.plan-prices-per-currency` | live | `BM-38` (the architecture statement, per `F1-27`'s pointer; schema/provider mechanics excluded as implementation) |
| `BILL.1` | superseded *(the struck deferred-era section; nothing in it survives as scope — recorded so it can never be quoted as live law. Shared — `modules/M12` appends its half at Task 23)* | `BM-03` · overlay chain: `OD-4` / docs/15 §2 `D38` |
| `BILL.2` | live *(shared — the pre-committed law half lands here; enforcement and the billing screens `modules/M12`)* | `BM-32` |
| `D38` | superseded *(by product-owner override 2026-07-24, `OD-4`; billing/entitlements/usage in v1, trial-only, no free tier. The pre-commitment kept verbatim in the overlay — read + export always work — lands live at `BM-32`. Shared — lifecycle mechanics `modules/M12`)* | `BM-03`, `BM-32` |
| `OD-4` | live *(shared — the business-model half: billing in v1, trial-only, no free tier; the mechanics half — usage metering surfaces, trial-state UX — stays with `modules/M12`, which the ledger names first)* | `BM-03` |

## Task 12 — `modules/M01-onboarding-and-tenant-config.md`

Appended by Task 12. Requirement IDs in M01 use the prefix `M01-<nn>` (`M01-01`–`M01-60`);
matrix rows `F2.M01.manage-tenant-settings` and `F2.M01.add-own-catalog-items` were appended to
`foundations/F2-roles-and-permissions.md` §F2.5-M01 (replacing its placeholder row) per F2-25.

Conventions for reading this block:

1. **Keys already closed by earlier tasks are not re-appended.** `DOC00.tenant-config-scope`
   and `DOC00.demo-rooftop` (Task 3 convention 1 — the `DOC00.*` set is disposed once, with
   this module named as owner) resolve to M01 §1/§M01.9 and `M01-27`; `CG-moat.5` (Task 3
   convention 2) resolves to `M01-32`/`M01-43`/`M01-48`; `S1.rec.1` (Task 4's row: M01 carries
   the first-run-landing mechanics "and should not re-append it") resolves to `M01-17`. IDs
   are assigned without new rows.
2. **Shared dispositions** (Task 4 convention 3 precedent, used by every task since). Rows
   marked *shared* carry the **M01 half** — the settings surface, the catalog mechanics, or
   the onboarding screen — of a key whose other half belongs to another task's document, which
   appends its own half: `modules/M07` (Task 17: TC.principle.2/.3, the `TC.agent-setup.*`
   and `TC.kb.*` behaviours, `TC.rec.1`, `TC.wrong.1/.2/.3/.7`), `modules/M06` (Task 16:
   `TC.timeline.1` builder step, `R11` Quick mode, `CG-1` Generate-time check),
   `modules/M11` (Task 19: `TC.payment-terms.1` / `DOC04.tranche-templates` money path),
   `modules/M02` (Task 13: `TC.lead-sources.1` channel policy), `modules/M05` (Task 15:
   `CG-15` electrical-model half), `modules/M12` (Task 23: `D11` billing half),
   `foundations/F1` (Task 6 already appended the pack halves of `D36`/`R13`),
   `foundations/F2` (Task 5 already appended `TC.roles.1`'s semantics context),
   `foundations/F7` (Task 9 already appended `TC.branding.1`'s law half) and
   `foundations/F8` (Task 7 already appended `TC.principle.4`'s law half at `F8-06`). Each
   pair is intentional, not a duplicate.
3. **Cited-but-not-disposed keys stay with their owners.** M01 cites, as grounding only:
   `UXG-03` (per its ledger target the disposition is Task 13's; M01-58 is the settings-surface
   half its row names), `UXG-01` (import-wizard pattern — M02), `UXG-16`/`UXG-17` (M07),
   `S2.screen.5` (M02), `S5.wrong.4` (M05), `S6B.step.6`, `S6B.step.9`, `S6B.wrong.3`,
   `S6B.wrong.5`, `S6B.rec.5`, `D32`, `D34` (M06), `R10`, `D18` (M07), `R14` and
   `DOC06.conflict-matrix` (both disposed by Task 10; **M01 no longer states a catalog surface
   for either.** `M01-47` — the catalog held read-only on the device — was deleted 2026-08-07
   with the offline capability, as was the `F4-18` shared note it answered, which carried the
   conflict matrix's two device-store entries. With no on-device store neither entry has a
   subject. `R14` is superseded by `Q61` and `DOC06.conflict-matrix` survives as the
   concurrency law at `F4-14`, `F4-15`, `F4-16`, `F4-17`, `F4-19` (enumerated around the gap —
   `F4-18` is the deleted row named just above), none of whose rows names M01. The loss is a direct
   consequence of the removal, is **not** one of `Q62`–`Q66`, and needs no hole; M01's live
   catalog rows — `M01-45`, `M01-46`, `M01-48`, `M01-49` — are untouched by it), the `D36`
   family (Task 6), `DOC08.matrix.*` and the journey
   roles-screens block (Task 5), `PS-01` (Task 4), and `BM-28` / `F1-*` / `F2-*` / `F3-*` /
   `F4-*` / `F8-*` requirements consumed by published ID. **`CG-matrix.13`** (the matrix
   restatement of `CG-1`; primary target F1, declined by Task 6) is deliberately left for
   Task 16 — the ✔ it records is the compliance-*checking* feature, whose gate is M06's.
4. **The UXG parity-appendix items** (`UXG-PAR-02`…`-05`, outside the UXG-01–27 numbering)
   are not ledger rows; per the ledger appendix note ("product-law questions the auth rebuild
   must answer… with F2/M01 as the owning slice") they land as open question `Q20`
   (M01 §6 M01-Q3) rather than as dispositions.
5. **Supersessions recorded in-row:** `S0.notv1.1`'s billing-deferral text is dead (OD-4);
   the census contradiction inside `D11` ("no trial gate… anywhere" vs trial-only billing) is
   resolved by the overlay itself — overlay wins, no new conflict entry. The OTP resend
   30 s / 45 s divergence (`S0.wrong.2` vs `DOC08.otp-limits`) is recorded at `M01-04`
   in-row for the closure pass, not silently resolved.

| source key | disposition | PRD ref |
|---|---|---|
| `S0.rule.minimum-first` | live | `M01-22` (law, quoted), `M01-28`, `M01-29` |
| `S0.screen.1` | live | `M01-01` |
| `S0.screen.2` | live | `M01-23` |
| `S0.screen.3` | live | `M01-24` (tax-registration field set is `pack.tax` data per the ledger note) |
| `S0.screen.4` | live | `M01-12` |
| `S0.screen.5` | live | `M01-26` |
| `S0.happy` | live | `M01-26`, `M01-22` (the first-lead door's quick-add is `modules/M02`'s) |
| `S0.wrong.1` | live | `M01-08` |
| `S0.wrong.2` | conflict *(the resend path is carried at `M01-03`/`M01-04`; its "after 30s" timing vs docs/engineering/08's 45 s cooldown (`DOC08.otp-limits`) is an unresolved source divergence, recorded at `registers/conflicts.md` row 9 — retyped from `live` by Task 25 once the register entry existed, per convention 5's closure-pass flag)* | `M01-03` · `M01-04` · `registers/conflicts.md` row 9 |
| `S0.wrong.3` | live | `M01-25` (format is F1 pack data) |
| `S0.wrong.4` | live | `M01-10` |
| `S0.wrong.5` | live | `M01-09` |
| `S0.notv1.1` | superseded *(the D38-era deferral text, by owner directive OD-4; the surviving signup-shaped fact — no payment/plan step at signup, no-card trial — is live)* | `M01-11` · billing surfaces `modules/M12` (Task 23); trial law consumed at `BM-28` |
| `S0.notv1.2` | excluded | M01 §5 (no SSO in v1) |
| `S0.notv1.3` | excluded *(v1 rationale recorded at M01 §5: custom domains are Enterprise white-label packaging rather than a withheld v1 capability — `CG-18`/`BM-15`, routing designed at `F5-81`–`F5-83`; rationale added by Task 25)* | M01 §5 (no custom domains in v1) |
| `S0.rec.1` | live *(elevated from recommendation to committed scope by `DOC14.coach-demo-seed`; globalized "per market pack" per design spec §6 — IN demo content recorded as the Pune-class rooftop)* | `M01-27` · pack-key placement open at `registers/open-questions.md` Q19 |
| `D11` | live *(shared — the self-serve-signup half; the billing half belongs to `modules/M12`, Task 23. The census's internal contradiction is resolved by the overlay — convention 5)* | `M01-01`, `M01-11` |
| `S1.screen.1` | live | `M01-13` |
| `S1.screen.2` | live | `M01-13` |
| `S1.screen.3` | live | `M01-14` |
| `S1.screen.4` | live | `M01-15` |
| `S1.screen.5` | live | `M01-16` |
| `S1.happy` | live | `M01-17` |
| `S1.wrong.1` | live | M01 §M01.2 edge cases (one-tap re-invite request) |
| `S1.wrong.2` | live | M01 §M01.2 edge cases (decline notifies the EPC Owner) |
| `S1.wrong.3` | live | M01 §M01.2 edge cases (teaching empty state, F7 contract) |
| `S1.wrong.4` | live | M01 §M01.2 edge cases + `M01-18` (`F2-20` consumed by ID) |
| `TC.principle.1` | live | M01 §1 (quoted) + `M01-22` |
| `TC.principle.2` | live *(shared — governing-principle surface half; gate mechanism `modules/M07` Task 17, statutory ruleset data F1 per Task 6's `D36` rows)* | `M01-56` |
| `TC.principle.3` | live *(shared — same split; the five shipped defaults' behaviours are M07's)* | `M01-56`, `M01-57` |
| `TC.principle.4` | live *(shared — the M01 surfaces half; the law half is Task 7's `F8-06`)* | M01 §5 (no honesty switches on any M01 surface) |
| `TC.agent-setup.1` | live *(shared — surface listed here; behaviour `modules/M07`, Task 17)* | `M01-57` |
| `TC.agent-setup.2` | live *(shared — same)* | `M01-57` |
| `TC.agent-setup.3` | live *(shared — same; disclosure floor status stays register Q6)* | `M01-57` |
| `TC.agent-setup.4` | live *(shared — same)* | `M01-57` |
| `TC.agent-setup.5` | live *(shared — same; window edits only narrow within the F1 floor)* | `M01-57` |
| `TC.agent-setup.6` | live *(shared — same; "the most important screen here")* | `M01-57` |
| `TC.agent-setup.7` | live *(shared — same; versioned config history)* | `M01-57` |
| `TC.kb.1` | live *(shared — the KB surface listed here; structure and behaviour `modules/M07`, Task 17)* | `M01-57` |
| `TC.kb.2` | live *(shared — same)* | `M01-57` |
| `TC.kb.3` | live *(shared — same; brand names untranslated per `F3-08`)* | `M01-57` |
| `TC.kb.4` | live *(shared — same)* | `M01-57` |
| `TC.kb.5` | live *(shared — same)* | `M01-57` |
| `TC.kb.6` | live *(shared — same)* | `M01-57` |
| `TC.kb.7` | live *(shared — same; IN subsidy colour is F1 pack material)* | `M01-57` |
| `TC.kb.8` | live *(shared — same)* | `M01-57` |
| `TC.kb.9` | live *(shared — same)* | `M01-57` |
| `TC.kb.10` | live *(shared — the unanswered-questions loop; mechanism pinned by R10, M07's)* | `M01-57` |
| `TC.kb.11` | live *(shared — seeded-not-empty; seed content is market-pack material, Q19 adjacency noted)* | `M01-57` |
| `TC.rec.1` | live *(shared — the loop's settings entry point here; the committed mechanism is R10/M07's, Task 17)* | `M01-57` |
| `TC.branding.1` | live *(shared — the settings-surface half; the law half is Task 9's `F7-07`)* | `M01-50` |
| `TC.catalog.1` | live *(the source's duplicate catalog row is void per R13 — one catalog surface)* | `M01-32` |
| `TC.pricebook.1` | live *(R1 vocabulary applied: "old quotes" written as proposals)* | `M01-48`, `M01-49` |
| `TC.templates.1` | live | `M01-51` |
| `TC.payment-terms.1` | live *(shared — template management here; tranche money path `modules/M11`, Task 19)* | `M01-54` |
| `TC.timeline.1` | live *(shared — template surface here; the builder step `modules/M06`, Task 16)* | `M01-52` |
| `TC.discount-limits.1` | excluded *(explicit non-goal — "Not in this release — no approval, no ceiling (D34)")* | M01 §5 · the arithmetic guard is M06's (D34/R12) |
| `TC.lead-sources.1` | live *(shared — the settings surface + honesty rule here; the channel set and D13 policy `modules/M02`, Task 13)* | `M01-58` |
| `TC.roles.1` | live *(shared — the screens half; semantics are Task 5's F2. The row's "who approves what" phrase is carried as written; the D34 tension it brushes stays recorded in F2 §5, not re-resolved)* | `M01-21`, `M01-19`, `M01-20` |
| `TC.message-templates.1` | live | `M01-55` |
| `TC.config-ux.1` | live | `M01-28` |
| `TC.config-ux.2` | live | `M01-29`, `M01-39` · grant at `F2.M01.add-own-catalog-items` |
| `TC.config-ux.3` | live | `M01-30` (instances at `M01-50`, `M01-54`, `M01-55`) |
| `TC.config-ux.4` | live | `M01-31` |
| `TC.wrong.1` | live *(shared — post-overlay split carried: statutory items blocked by the gate (M07 enforcement); the disclosure-edit half stays owner-editable with its floor status at register Q6)* | M01 §M01.9 edge cases + `M01-56` |
| `TC.wrong.2` | live *(shared — M07 owns the KB save validation)* | M01 §M01.9 edge cases |
| `TC.wrong.3` | live *(shared — M07 owns config versioning per D18)* | M01 §M01.9 edge cases |
| `TC.wrong.4` | live | `M01-42` (archive-never-delete; draft keeps components) |
| `TC.wrong.5` | live | `M01-49` (sent proposals keep original prices, always) |
| `TC.wrong.6` | live | `M01-28` (zero-config fallback total) |
| `TC.wrong.7` | live *(shared — M07 owns the preview/test surface)* | M01 §M01.9 edge cases + `M01-30` |
| `DOC04.tenant-onboarding-fields` | live | `M01-23`, `M01-24` |
| `DOC04.user-lifecycle` | live | `M01-18` (identity consumed at `M01-01`/`M01-02`) |
| `DOC04.invites-phone` | live | `M01-12`, `M01-13` |
| `DOC04.tenant-settings` | live | `M01-51`, `M01-58`, `M01-59` (branding section at `M01-50`) |
| `DOC04.catalog-two-tier` | live | `M01-32`, `M01-37`, `M01-42` |
| `DOC04.catalog-certifications` | live | `M01-34` (scheme data consumed from `F1-19`/`F1-44`) |
| `DOC04.catalog-provenance` | live | `M01-35` (surfacing per F8, as the ledger notes) |
| `DOC04.catalog-release-stale` | live | `M01-43` (staleness mechanics consumed from `F8-13`/`F8-14`) |
| `DOC04.pricebook-versions` | live | `M01-48` |
| `DOC04.tranche-templates` | live *(shared — the management-surface half the ledger routes here; the money path and due-on-stage mechanics `modules/M11`, Task 19)* | `M01-54` |
| `DOC07.otp-delivery` | live | `M01-03` (limits at `M01-04`) |
| `DOC08.auth-phone-otp` | live *(the ledger's note carried: Google Login is `BRIEF`-only, absent from source — not a contradiction)* | `M01-05`, `M01-01` · Google at `M01-02` (`BRIEF`) with linking open at Q18 |
| `DOC08.invite-attach` | live | `M01-13` |
| `DOC08.session-lifetimes` | live | `M01-07` (revocation surface at `M01-19`) |
| `DOC08.otp-limits` | conflict *(the anti-abuse limits are carried at `M01-04`; the 45 s resend cooldown vs the journey's "after 30s" (`S0.wrong.2`) is an unresolved source divergence, recorded at `registers/conflicts.md` row 9 — retyped from `live` by Task 25 once the register entry existed, per convention 5's closure-pass flag)* | `M01-04` · `registers/conflicts.md` row 9 |
| `DOC08.otp-copy` | live | `M01-06` |
| `DOC08.credentials-last4` | live | `M01-60` |
| `DOC09.credential-probe-nag` | live | `M01-60` |
| `DOC10.templates-are-data` | live *(shared — the template-management-surface half named by Task 8's row; the content-class law is `F3-10`; M06/M07/F6 halves stay with their tasks)* | `M01-55` |
| `DOC14.coach-demo-seed` | live | `M01-16`, `M01-27` |
| `DOC14.message-templates` | live | `M01-55` |
| `R13` | live *(shared — the catalog-mechanics half; the scheme-keyed-certifications half is Task 6's `F1-19`/`F1-44`; sent-proposal pinning consumed suite-wide via `F8-15`)* | `M01-32`, `M01-37`, `M01-43`, `M01-44`, `M01-48`, `M01-49` |
| `R11` | live *(shared — the "tenant defaults for steps 6/7/9/11 → M01" half of the ruling's routing; Quick mode itself is `modules/M06`'s, Task 16)* | `M01-53` |
| `EOD-5 · two-tier-catalog` | live | `M01-32` (identical in substance to R13/UD-4 — no contradiction, per the ledger) |
| `UD-4` | live | `M01-32` |
| `CG-1` | live *(shared — the catalog-flags/badges half; the Generate-time compliance check is `modules/M06`'s, Task 16; the pack rule is `F1-34`/`F1-44`)* | `M01-34` |
| `CG-13` | excluded *(SKIP-DELIBERATELY verdict carried as product law — catalog neutrality; the revenue-model half is the same non-goal read from `04-business-model.md`'s side, no new row there)* | M01 §5 (no partner-funded placement; "never silent ranking") |
| `CG-15` | live *(shared — the catalog-holds-the-components half; the string-ladder and absent MLPE electrical model are `modules/M05`'s, Task 15)* | `M01-45` |
| `CG-matrix.10` | live | `M01-32`, `M01-43`, `M01-48` |

## Task 13 — `modules/M02-crm-and-leads.md`

Appended by Task 13. Requirement IDs in M02 use the prefix `M02-<nn>` (`M02-01`–`M02-67` —
extended 2026-08-15 by owner rulings `Q62`/`Q63`, which added the new rows `M02-66` and `M02-67`;
`M02-04`, `M02-22` and `M02-26` remain deleted and their ids are not reused);
matrix rows `F2.M02.dedupe-override`, `F2.M02.import-leads`, `F2.M02.lead-state-changes`,
`F2.M02.book-site-visit` and `F2.M02.merge-customers` were appended to
`foundations/F2-roles-and-permissions.md` §F2.5-M02 (replacing its placeholder row) per F2-25.

Conventions for reading this block:

1. **Keys already closed by earlier tasks are not re-appended.** `DOC00.nongoal-lead-channels`
   (Task 3, disposition `conflict` — the `D13`-vs-brief tension) resolves to M02-17 and M02 §5;
   `S0.happy`'s first-lead door (Task 12: "the first-lead door's quick-add is `modules/M02`'s")
   resolves to `M02-01`/`M02-25`; `D20`/`D27`/`D28` (Task 5) resolve to `F2.M02.lead-visibility`
   and the scope conditions on this module's new rows; `D2` (Task 9) resolves to §2's parity
   statement; `R14` (Task 10) **no longer resolves to anything in M02 through its boundary half** — that half is superseded by
   owner ruling `Q61` (2026-08-07), §2's offline paragraph was removed with the capability, and
   three of the four rows it resolved to were deleted in the same sweep: `M02-04` (the
   apply-time duplicate — deleted, and its substance **RULED on 2026-08-15** at
   `registers/open-questions.md` `Q62`, which restores the law as the **new** row **`M02-66`**
   in §M02.2; the screens `Q62` had blocked are `SCR-M02-01` and `SCR-M02-04`), `M02-26`
   (triage actions are server-completed — deleted, and **RULED** the same day at `Q63`, which
   restores the law as the **new** row **`M02-67`** in §M02.5; the screen `Q63` had blocked is
   `SCR-M02-02`) and `M02-22` (the import's offline behaviour, deleted
   with no replacement, covered by no open question and unaffected by the 2026-08-15 rulings,
   since an import is a desk action on a
   live connection). **The one row that survives is `M02-36`**, which carries the concurrency
   half — capture time preserved for display and audit while server apply order decides
   ordering (`F4-19`), and per-field last-writer-wins with an activity entry for every applied
   change (`F4-16`) — and it resolves from **both**: `docs/prd/modules/M02-crm-and-leads.md` gives its source as "`SRC` — `R14` via `F4-16`/`F4-19`", so `M02-36` is one of the live carriers named on `R14`'s own row in the Task 10 block, alongside `F8-36`, `M05-09` and `M05-67` (and, from 2026-08-15, `M02-66`, `M02-67` and `M09-71`). *(Corrected 2026-08-15: this clause read "it resolves from `DOC06.conflict-matrix`, not from `R14`", which contradicted both `M02-36`'s SRC cell and `R14`'s re-disposition; the paragraph's opening sentence is narrowed to the boundary half with it.)* `Q62` and
   `Q63` were closed **by the owner on 2026-08-15**, not here, and **no row is re-instated**:
   `M02-04` and `M02-26` stay deleted, their ids are not reused, and every struck register row
   and dated task record saying they were deleted on 2026-08-07 stays true. What is live again
   is the law each carried, under the new ids `M02-66` and `M02-67` — each naming the row it
   restores in its own `SRC` cell, each an instance of `F8-36` (live P0: the product "does not
   silently queue, partially apply, or display an optimistic result"), and each therefore a new
   live carrier of `R14`'s surviving half in the Task 10 block. IDs are assigned without new rows.
2. **Shared dispositions** (Task 4 convention 3 precedent, used by every task since). Rows marked
   *shared* carry the **M02 half** — the channel policy, the CRM-core capability, or the lead-side
   record — of a key whose other half belongs to another task's document, which appends its own
   half: `modules/M01` (Task 12 already appended `TC.lead-sources.1`'s and `UXG-03`'s
   settings-surface half at `M01-58`), `modules/M13` (Task 23: the `R9`/`R15` win-loss and
   "needs you" surfaces), `modules/M08` (Task 18: the handover-time referral ask of `UXG-19`),
   `modules/M07` (Task 17: the close surfaces, the compliance gate and the agent halves),
   `04-business-model.md` (Task 11 already published the packaging conviction `BM-05` behind
   `CG-17`/`CG-matrix.11`). Each pair is intentional, not a duplicate.
3. **Cited-but-not-disposed keys stay with their owners.** M02 cites, as grounding only:
   `D15`, `D30`, `DOC04.visits` (`modules/M04`); `D17`, `D18`, `D36`, `DOC04.compliance-flags`,
   `DOC04.tasks`, `S7.rule.my-day`, `S7.screen.6`, `S7.screen.7`, `S7.screen.8`, `S7.wrong.4`,
   `S7.wrong.8` (`modules/M07`, Task 17 — note that `R9` is the single definition of the states
   those S7 rows describe, so M07's rows defer to §M02.10); `D32`, `D34`, `R1` (`modules/M06`);
   `S8.rec.1` (`modules/M08`); `D37`, `DOC04.forecast-not-revenue` (`modules/M13`);
   `C1`, `C1.wrong.1`–`.4`, `C8.wrong.3`, `C.framing.6` (`foundations/F5`, Task 20 — the
   customer-side reading of this module's speed, duplicate-check and six-month-suppression rules);
   `UXG-10`, `DOC06.*` (`foundations/F4`, Task 10); and every `F1-*` / `F2-*` / `F3-*` / `F4-*` /
   `F7-*` / `F8-*` / `M01-*` requirement consumed by published ID.
4. **Supersessions and tensions recorded in-row, not silently resolved:** `S3.screen.1`'s "or use
   a rule" phrase is dead under `D14` (recorded at `M02-27`); `DOC04.lead-sources`' "referral
   dormant" marking is overtaken by `R15` for `referral` only (recorded at `M02-13` — the overlay
   wins, no new conflict entry); `S2.screen.5`'s capture-settings over-promise is **not carried**
   and is corrected by `UXG-03`'s later-card rule (`M02-65`); `S3.wrong.7`'s "the customer gets
   one reminder" is carried as composed-not-sent under `D32` (`M02-48`) *(reconciled to owner
   ruling 2026-08-04 `Q33`, 2026-08-06: the reminder is a transactional-lane member — it
   **sends from the tenant's connected official channel where one is connected**, with a
   delivery state there, and is **composed for a person only where none is connected**, the
   one path claiming no delivery; `D32`'s unscoped composed-not-sent reading is retired,
   `M02-48` carries the two-branch shape, `registers/conflicts.md` row 4)*; the `R9.lost` /
   `S7.screen.7` reason-vocabulary mismatch is carried as written and opened as `Q21`
   (`M02-54`, M02 §6 M02-Q1); the duplicate gap was opened as `Q22` and closed by owner ruling
   2026-08-04 (`M02-Q2`), **then superseded 2026-08-07 by `Q61`** — `Q22` was framed as an
   *offline-sync* precedent and the row it made final, `M02-04`, was deleted with the sweep,
   but the race it ruled on is an ordinary online race (`M02-07` runs the live duplicate check
   strictly *before* the save). Its substance was therefore re-opened as
   `registers/open-questions.md` **`Q62`**, and the **owner ruled on `Q62` on 2026-08-15**: the
   law is live again as the **new** row **`M02-66`** (§M02.2), which — with `Q62` — is the
   citation to use for the apply-time duplicate. `M02-04` no longer exists, is not re-instated
   here or anywhere, and its id is not reused; `Q22`'s SUPERSEDED mark and `M02-04`'s deletion
   both stand exactly as recorded.

| source key | disposition | PRD ref |
|---|---|---|
| `S2.rule.dedupe` | live *(the module's governing law, quoted in M02 §1)* | `M02-02`, `M02-07` |
| `S2.rule.channel.1` | live | `M02-01` (the <30 s bar), `M02-13` |
| `S2.rule.channel.2` | live *(shared — the lead-side capture; the agent that answers is `modules/M07`'s)* | `M02-14` |
| `S2.rule.channel.3` | excluded *(inbound business-messaging is not a v1 channel — `D13`; the source's channel table lists it without the deferral flag and `D13` governs. Later card, no capture path; the brief's campaign channels are `modules/M03`'s, Task 21)* | `M02-17`, `M02-65` · M02 §5 |
| `S2.rule.channel.4` | excluded *(website form — same disposition and same hand-off)* | `M02-17`, `M02-65` · M02 §5 |
| `S2.rule.channel.5` | live *(post-overlay `R15`: the tag and chip ship; the source's "they get credited" half is the excluded credits ledger)* | `M02-16` · exclusion at M02 §5 |
| `S2.rule.channel.6` | live | `M02-13`, `M02-18` |
| `S2.screen.1` | live | `M02-01`, `M02-05`, `M02-06` |
| `S2.screen.2` | live | `M02-23` |
| `S2.screen.3` | live | `M02-08`, `M02-09` |
| `S2.screen.4` | live | `M02-18`, `M02-19` |
| `S2.screen.5` | live *(the screen's existence and channel list; its website-snippet / messaging-number over-promise is **not carried** — corrected by `UXG-03`'s later-card rule, convention 4. Settings surface is `M01-58`)* | `M02-64`, `M02-65` |
| `S2.happy` | live | `M02-23`, `M02-24`, `M02-31` |
| `S2.wrong.1` | live | `M02-07` |
| `S2.wrong.2` | live | `M02-55` |
| `S2.wrong.3` | live | `M02-03` |
| `S2.wrong.4` | live *(shared — capture and scheduling intent here; the window is `F1-36` pack data and the gate is `modules/M07`'s)* | `M02-15` |
| `S2.wrong.5` | live | `M02-19` |
| `S2.wrong.6` | live *(the source's "offer merge later" is dead — `R8`)* | `M02-59` |
| `S2.wrong.7` | live | `M02-50` |
| `S2.notv1.1` | excluded | M02 §5 (no lead scoring) |
| `S2.notv1.2` | excluded *(the v1 non-goal stands for this module; campaign management is the brief's `modules/M03` scope, with the tension already recorded by Task 3)* | M02 §5 (no marketing automation) |
| `S2.notv1.3` | excluded *(same reading — attribution beyond source badge + referral link is `modules/M03`'s scope decision, not a silent inheritance)* | M02 §5 (no campaign attribution) |
| `S2.notv1.4` | excluded | M02 §5 (no website chatbot) |
| `S2.rec.1` | live *(the triage law, quoted)* | `M02-24`, `M02-23` |
| `S3.screen.1` | live *(the "or use a rule" half is superseded by `D14` and appears nowhere — convention 4)* | `M02-27`, `M02-28` |
| `S3.screen.2` | live | `M02-32`, `M02-33` |
| `S3.screen.3` | live | `M02-39` |
| `S3.screen.4` | live *(shared — the booking act here; the visit object and capture flow are `modules/M04`'s)* | `M02-46`, `M02-47` |
| `S3.screen.5` | live *(the six disqualify reasons, verbatim)* | `M02-42`, `M02-53` |
| `S3.happy` | live | `M02-32`, `M02-39`, `M02-46`, `M02-47` |
| `S3.wrong.1` | live *(shared — attempt log and retry here; the three-attempt agent trigger is `D17`/`modules/M07`)* | `M02-43` |
| `S3.wrong.2` | live | `M02-44` |
| `S3.wrong.3` | live | `M02-34` |
| `S3.wrong.4` | live | `M02-45` |
| `S3.wrong.5` | live *(timer semantics defer to `R9.snoozed`)* | `M02-51` |
| `S3.wrong.6` | live | `M02-30` |
| `S3.wrong.7` | live *(as authored, the single reminder is composed-not-sent under `D32` — convention 4. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** it **sends from the tenant's connected official channel where one is connected** and is **composed for a person where none is** — only the fallback claims no delivery. Still exactly one reminder either way; `M02-48` carries both branches. See `registers/conflicts.md` row 4)* | `M02-48` · `registers/conflicts.md` row 4 |
| `S3.rec.1` | live *(snooze as a first-class action, quoted; implemented as `R9`'s state)* | `M02-51` |
| `R8` | live | `M02-59`, `M02-60`, `M02-61`, `M02-62`, `M02-63` · grant at `F2.M02.merge-customers` |
| `R9` | live *(the single definition; "no state deletes" and 09:00 tenant-local wake-ups carried as module-wide law)* | `M02-49`, `M02-58` · states at `M02-50`–`M02-57` |
| `R9.unassigned` | live *(shared — the state here; the escalation notification type registers with `foundations/F6` and the owner's "needs you" surface is `modules/M13`'s)* | `M02-50` |
| `R9.snoozed` | live | `M02-51` |
| `R9.dormant` | live | `M02-52` |
| `R9.disqualified` | live *(shared — the state here; the win/loss "disqualified early" list is `modules/M13`'s)* | `M02-53` |
| `R9.lost` | live *(shared — the state here; the mark-lost surface is `modules/M07`'s and the win/loss "lost late" list `modules/M13`'s. The "not interested" vocabulary mismatch is carried as written and opened — convention 4)* | `M02-54` · → M02 §6 M02-Q1 → `registers/open-questions.md` Q21 |
| `R9.junk` | live *(shared — the state here; the search-only surface is `foundations/F6`'s)* | `M02-55` |
| `R9.reopened` | live | `M02-56` |
| `R15` | live *(shared — the referral tag and "came from" chip here; the win/loss analytics surface is `modules/M13`'s and the handover-time ask `modules/M08`'s. The credits ledger is the spec-locked exclusion)* | `M02-16` · exclusion at M02 §5 |
| `D1` | live *(shared — the segment flag captured and carried here; the flag's proposal-side use is `modules/M06`'s and the 1 kW→100 MW design range `modules/M05`'s)* | `M02-05` |
| `D13` | live *(the closed v1 source set; the deferred channels' hand-off to `modules/M03` recorded at `M02-17`)* | `M02-13`, `M02-17` · M02 §5 |
| `D14` | live | `M02-27`, `M02-28` · M02 §5 (no rules engine) |
| `UXG-01` | live *(absorbed whole: auto-guess mapping, "N rows · M duplicates by phone" preview, skippable-or-logged duplicates, background job with progress and failure report; the job mechanism is dropped as implementation per the ledger's own note. `M02-22`, the fifth ref, was **deleted 2026-08-07** by owner ruling `Q61` — it stated the wizard's offline behaviour, and an import is a desk action on a live connection, so no live row replaces it and no open question covers it. The four remaining rows carry the whole of the gap: the wizard's four steps and auto-guess mapping at `M02-18`, the counts sentence at `M02-19`, the dedupe reuse at `M02-20`, the background job with visible progress and an honest partial-success report at `M02-21`)* | `M02-18`, `M02-19`, `M02-20`, `M02-21` · grant at `F2.M02.import-leads` |
| `UXG-02` | live *(absorbed whole: the sheet's three facts, its three choices verbatim, and one sheet with three entry points)* | `M02-08`, `M02-09`, `M02-10`, `M02-11`, `M02-12` · grant at `F2.M02.dedupe-override` |
| `UXG-03` | live *(shared — the M02 half its row names: the channel set, each channel's true state and what a toggle does; the settings surface and its honesty rule are `M01-58`, appended by Task 12)* | `M02-64`, `M02-65` |
| `UXG-04` | live *(absorbed whole: open-load + overdue at assign time, single tap, both entry points, bulk-assign from multi-select, "no rules engine")* | `M02-27`, `M02-28`, `M02-29` · grant at `F2.M02.assign-leads` |
| `UXG-05` | live *(absorbed whole: survivor pick, re-point, audit trail, irreversible-with-confirm; in v1 scope per `R8` as amended, calendar phrasing retired by `OD-5`)* | `M02-59`, `M02-60`, `M02-61`, `M02-62`, `M02-63` |
| `UXG-19` | live *(shared — the CRM-core tag + "came from" chip half; the handover-time referral ask is `modules/M08`'s and the credits ledger is the excluded spec-lock)* | `M02-16` · exclusion at M02 §5 |
| `DOC04.phone-identity-dedupe` | live | `M02-02`, `M02-07` |
| `DOC04.contacts` | live | `M02-34` |
| `DOC04.merge-tombstone` | live | `M02-60`, `M02-62` |
| `DOC04.lead-sources` | live *(post-overlay: `referral` is live per `R15`; only website and business-messaging stay dormant. The ledger's flagged contradiction is resolved by the overlay itself — overlay wins, recorded in-row at `M02-13`, no new conflict entry)* | `M02-13`, `M02-17` |
| `DOC04.lead-machine` | live *(the funnel here; the consolidated timer semantics are `R9`'s)* | `M02-41`, `M02-56`, `M02-57` |
| `DOC04.unassigned-inbox` | live | `M02-50`, `M02-23` |
| `DOC04.qualification` | live | `M02-39`, `M02-40` |
| `DOC04.assignment-history` | live | `M02-30` |
| `DOC04.timeline` | live *(the one stream every module writes into — cross-module contract stated at M02 §4)* | `M02-35` |
| `DOC04.referral-no-credit` | live *(the attribution half; the credits ledger is the exclusion)* | `M02-16` · exclusion at M02 §5 |
| `DOC14.csv-import` | live *(the roadmap-side restatement of `UXG-01`; committed scope, calendar phrasing retired by `OD-5`)* | `M02-18`, `M02-19` |
| `DOC14.merge-included` | live *(roadmap-side restatement of `R8`)* | `M02-59`, `M02-60`, `M02-62` |
| `DOC14.referral-ships` | live *(roadmap-side restatement of `R15`)* | `M02-16` |
| `DOC14.snooze-jobs` | live *(roadmap-side restatement of `R9`/`D14` — the full state machine, dedupe at quick-add, assignment with load visible, qualification, timeline; tasks are `modules/M07`'s)* | `M02-49`, `M02-07`, `M02-28`, `M02-39`, `M02-35` |
| `DOCFC.crm-compliance-day1` | live *(shared — the fields live on this module's customer record from day one; the gate that reads them per dial is `modules/M07`'s and the statutory ruleset is `F1-36` pack data)* | `M02-37`, `M02-13`, `M02-59` |
| `TC.lead-sources.1` | live *(shared — the channel set and `D13` policy half Task 12's row names; the settings surface and its honesty rule are `M01-58`)* | `M02-64` |
| `CG-17` | live *(shared — the CRM capability itself is this module in full; the packaging conviction "every feature in every tier" is `04-business-model.md`'s, already published)* | `modules/M02-crm-and-leads.md` (whole) · packaging at `BM-05` |
| `CG-matrix.11` | live *(the matrix restatement of `CG-17` — "CRM + pipeline included in base price")* | `modules/M02-crm-and-leads.md` (whole) · packaging at `BM-05` |

## Task 14 — `modules/M04-survey.md`

Appended by Task 14. Requirement IDs in M04 use the prefix `M04-<nn>` (`M04-01`–`M04-66`); matrix
rows `F2.M04.run-remote-survey`, `F2.M04.schedule-survey-visits` and `F2.M04.resolve-survey-gaps`
were appended to `foundations/F2-roles-and-permissions.md` §F2.5-M04 (replacing its placeholder
row) per `F2-25`, alongside the source-filled `F2.M04.capture-surveys` row that was already there.

Conventions for reading this block:

1. **Keys already closed by earlier tasks are not re-appended.** `DOC00.nongoal-measurement`
   (Task 3, disposition `excluded` — its named home is this document) resolves to M04 §5 and
   `M04-53`; `DOC08.matrix.capture-surveys` (Task 5) is the `F2.M04.capture-surveys` row this
   module references; `S1.rec.1` (Task 4 — the role homes) resolves to `M04-38` through `PS-13`;
   `R18` (Task 7 — the four tiers) resolves to `M04-34`/`M04-35`; `R14` and `UXG-10` (Task 10)
   resolve, after owner ruling `Q61` (2026-08-07), to `M04-55` **alone** — `R14` is superseded
   with the boundary it drew, `UXG-10`'s five sync surfaces are non-goals under
   `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2, and `M04-39`, `M04-40` and
   `M04-41` were deleted in the sweep (recorded in `M04-survey.md` §M04.4). `M04-55` is the
   product's one and only device-held queue — photographs, one direction, no conflicts, status
   on `SCR-M04-07` and nowhere else — and `UXG-10`'s surviving version-kept notice is
   `F4-25` / `M04-57`; `BM-16` and
   `BM-19` (Task 11 — the meter and the never-metered manual path) resolve to `M04-22`/`M04-23`;
   `D20`/`D28` (Task 5) resolve to `M04-61`. IDs are assigned without new rows.
2. **Shared dispositions** (Task 4 convention 3 precedent, used by every task since). Rows marked
   *shared* carry the **M04 half** — the survey's modes, its capture behaviour, its screens and its
   detection honesty — of a key whose law, surface or downstream mechanism belongs to another
   task's document, which appends its own half: `foundations/F8` (Task 7 already appended
   `S4.rule.honesty`'s document-disclosure half at `F8-22` and `R5`'s provenance/source-labelling
   half at `F8-08`/`F8-09`), `foundations/F4` (Task 10 appended `S4.rule.offline`'s offline-law
   half and `CG-matrix.3`'s boundary half, **both of which it now marks `excluded` after owner
   ruling `Q61`, 2026-08-07**; it listed `S4.screen.10` as **cited-but-not-disposed**, so that
   key is disposed of here — as `excluded`, since the five sync surfaces it named are non-goals
   under `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2 and the rows that carried
   them are deleted. The pairing itself is intact; what changed is that F4's half of each of
   these three keys is a non-goal rather than a law, and a live M04 half does not make it live),
   `modules/M05` (Task 15: `R5`'s energy source-of-record ladder,
   `DOC05.ai-doorway`'s application and entity stamping, `DOC07.map-tile-pinned`'s studio canvas,
   `DOC04.sanctioned-load`'s auto-design soft cap, `CG-matrix.4`'s studio-side detection surface),
   `modules/M02` (Task 13 listed `DOC04.visits` as **cited-but-not-disposed** and pointed it here,
   so that key is disposed of in this block; the booking act it feeds is Task 13's own `M02-46`),
   `modules/M13` (Task 23: the role-home composition `S4.screen.6` lands in), `modules/M12`
   (Task 22: the server-side detection allowance check). Each pair is intentional, not a
   duplicate.
3. **Cited-but-not-disposed keys stay with their owners.** M04 cites, as grounding only: `D32`
   (`modules/M06`); `DOC16.gate.ai-detection`, `DOC16.metering-rules` (`modules/M12`);
   `DOC05.auto-design-soft-cap`, `DOC07.metering-entitlement-order` (`modules/M05`/`modules/M12`);
   `D1`, `M02-05`, `M02-35`, `M02-39`, `M02-46`, `M02-47`, `M02-48` (`modules/M02`); `C1`,
   `C3`, `C3.wrong.1`–`.3` (`foundations/F5`, Task 20 — the customer's side of the visit, the
   trust rule and the promise-with-a-date); `M01-27` (the per-pack demo project); `R2`
   (`modules/M13`/`modules/M08` — market-neutral state names, consumed through `F1-03`); and every
   `F1-*` / `F2-*` / `F3-*` / `F4-*` / `F7-*` / `F8-*` / `BM-*` requirement consumed by published
   ID.
4. **Supersessions and tensions recorded in-row, not silently resolved.** `S4.rule.two-modes`'
   "Google Solar API drives the roof" phrasing is corrected by `R5` on sight and appears nowhere —
   imagery and roof data are a vendor-neutral capability that is an enhancement and never a
   dependency (`M04-09`); `S4.rule.mode-choice`'s rule 3 reads post-`R5` as an imagery/roof-data
   coverage failure and never as an energy-source failure (`M04-25`, `M04-27`); `S4.wrong.9`'s
   "customer gets one WhatsApp" is carried as composed-not-sent under `D32`, exactly as `M02-47`
   and `M02-48` already carry the same class (`M04-58`) — the standing brief-vs-source tension is
   `registers/conflicts.md` rows 3–4 and no new entry is opened *(reconciled to owner ruling
   2026-08-04 `Q33`, 2026-08-06: the tension is settled and the composed-not-sent reading is now
   scoped, not unscoped — the could-not-complete message **sends from the tenant's connected
   official channel where one is connected**, with a delivery state there, and is **composed for
   a person only where none is connected**, the one path claiming no delivery. `M04-58` carries
   the two-branch shape and `registers/conflicts.md` row 4 enumerates it by name; `M02-47`/`M02-48`
   move with it as the same class, exactly as this convention says)*; `S4.wrong.5`'s "the customer must
   always be able to correct it" wording is carried verbatim and opened as `Q25` (`M04-15`, M04 §6
   M04-Q2) rather than silently read as "the operator"; the design/proposal reconciliation a
   superseding survey version implies is unruled by any source and is opened as `Q24` (`M04-66`,
   M04 §6 M04-Q1).
5. **One ledger routing flagged for the closure pass, not acted on here.** The extraction ledger's
   `target_doc` column routes `R12` (chip-rail free navigation vs step gating) to `M04`, but the
   ruling's own text governs **the proposal builder** ("applies to the proposal builder"), with its
   named exception belonging to the studio's electrical gate. `R12` is therefore **not** disposed
   of here; `modules/M06-proposals.md` (Task 16) is its substantive home and `modules/M05` carries
   the studio-gate half. M04's own never-block posture is grounded in `F4-27` instead (`M04-51`).
6. **One extraction-ledger omission recorded, not silently resolved (design spec §3.5).** The
   Task-2 ledger's Stage-4 slice captured every screen, rule, failure and non-goal of Mode A but
   **not the stage's "Who" line** — journey L339, *"Who: rep or designer, at a desk, minutes after
   the lead arrives"*. The line matters because it names the **designer** as a remote-survey
   operator, which the roles matrix's `capture-surveys` row (journey L1449) does not grant. The
   reading applied — recorded here rather than resolved away — is that these are **two
   capabilities**: `capture-surveys` governs field capture and withholds it from the Design
   Engineer, while remote survey is desk work the source explicitly gives the designer. The line is
   therefore disposed of below under a source-pointer key (Task 4 convention precedent for source
   read directly, with no Task-2 ledger key), it grants `F2.M04.run-remote-survey` to the Design
   Engineer, and no cell of `F2.M04.capture-surveys` is widened (`F2-15` stands). The first draft of
   this module asserted the contrary ("Designers do not capture surveys"); that sentence is
   corrected at M04 §2.

| source key | disposition | PRD ref |
|---|---|---|
| `S4.rule.two-modes` | live *(the module's governing decision, quoted in M04 §1; the source's "Google Solar API drives the roof" phrasing is dead under `R5` — convention 4)* | `M04-01`, `M04-02`, `M04-03`, `M04-04`, `M04-07` |
| `S4.rule.mode-choice` | live *(all five rules verbatim; surfaced as guidance, never as a lock)* | `M04-05` · rule 3 at `M04-25`, rule 4 at `M04-13` |
| `S4.rule.honesty` | live *(shared — the survey-side half: the mode-to-tier stamp, the sellable-but-not-a-site-survey rule and the gaps that qualify it; the document-disclosure half and its fixed line are `foundations/F8`'s `F8-22`, appended by Task 7)* | `M04-34`, `M04-36`, `M04-33` |
| `S4.rule.remote-cannot` | live *(the five limits verbatim, surfaced on screen as the source requires)* | `M04-29`, `M04-30` |
| `S4.rule.offline` | live *(shared — **the capture half only**, and it is the half that survived. `M04-39` and `M04-40` were deleted 2026-08-07 by owner ruling `Q61`, but `M04-55` is live and its source line still names this key as "(the capture half)": a photograph is written to the device the moment it is taken and uploads when the connection returns, resumably, never blocked and never lost because an upload failed — the product's one and only device-held queue, status on `SCR-M04-07`. The **offline law itself** — "Offline is the normal case, not the edge case", "Everything saves locally first. Sync is a background fact, not a user action." — is `foundations/F4`'s half and is **excluded** there against `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1; F4's own residue is the carve-out `F4-21`. The physical capture flow, its groups and its screens remain live at `M04-42`–`M04-46`, no longer conditioned on connectivity)* | `M04-55` · the capture flow and its groups at `M04-42`, `M04-43`–`M04-46` |
| `S4.rule.capture` | live *(the five capture groups verbatim, including "observations only, never a verdict")* | `M04-43`, `M04-44`, `M04-45`, `M04-46` |
| `S4.screen.1` | live | `M04-08` |
| `S4.screen.2` | live *(the three progress phrases verbatim)* | `M04-14` |
| `S4.screen.3` | live *("Accept / adjust / reject — never applied silently", verbatim; confidence per detection)* | `M04-15`, `M04-16` |
| `S4.screen.4` | live *(the coverage message verbatim; "Not a dead end")* | `M04-26` |
| `S4.screen.5` | live | `M04-29`, `M04-31` |
| `S4.screen.6` | live *(shared — the visits home's content and behaviour; the role-home composition it lands in is `modules/M13`'s, and the persona statement is `PS-13`)* | `M04-38` |
| `S4.screen.7` | live *(skippable-but-flagged and the inline camera, verbatim)* | `M04-42`, `M04-43` |
| `S4.screen.8` | live | `M04-46` |
| `S4.screen.9` | live | `M04-49`, `M04-52`, `M04-63` |
| `S4.screen.10` | excluded *(shared — the Mode B sync-status screen. Both refs, `M04-40` and `M04-41`, were deleted 2026-08-07 by owner ruling `Q61`, and the five sync surfaces this screen was the survey-side content of are non-goals by name at `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2 — no sync centre, no global indicator, no staleness banner, no queued-or-unsynced marker on any record. A **queued survey** no longer exists to say anything about itself. **One fragment survives:** what the photographs say about themselves — the waiting count and retry — shown on the capture screen `SCR-M04-07` and nowhere else (`M04-55`, `F4-21`). No open question covers the rest; the screen it described was deleted with the capability)* | `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2 · `registers/open-questions.md` `Q61` — the surviving photo-status fragment is `M04-55` / `F4-21`, on `SCR-M04-07` only |
| `S4.happy` | live *(carried whole; Mode A defines no separate happy path in the source and none is invented)* | `M04-52` · §M04.9 behavior detail |
| `S4.wrong.1` | live | `M04-12` |
| `S4.wrong.2` | live | `M04-26` (via the coverage-failure screen; the fallback ladder is `R5`'s) |
| `S4.wrong.3` | live | `M04-13` |
| `S4.wrong.4` | live *(carried as a standing limit of remote survey rather than a detector defect — it is gap 4 of the remote-cannot list in every remote survey)* | `M04-30` · edge case at §M04.3 |
| `S4.wrong.5` | live *(the source's "customer" wording carried verbatim and opened rather than read as "operator" — convention 4)* | `M04-15` · → M04 §6 M04-Q2 → `registers/open-questions.md` Q25 |
| `S4.wrong.6` | superseded *(the source's wrong-way row is "no signal → everything works", and `M04-39`, the row that carried it, was deleted 2026-08-07 by owner ruling `Q61`. The ruling reverses the claim outright and records the cost in the owner's own terms: **a surveyor on a roof with no signal cannot open their assigned work.** The owner was shown this and chose it, so this is a superseded claim, not an unclosed gap — no open question covers it. What still holds of the surveyor's protection is narrower and lives elsewhere: a photograph already taken is never lost to a bad network (`M04-55`, `F4-21`), and a submission the server cannot accept is preserved for recovery rather than discarded (`F4-21`))* | `registers/open-questions.md` `Q61` · `foundations/F4-data-integrity.md` preamble and §5 · Non-goals, bullet 1 |
| `S4.wrong.7` | live | `M04-47` |
| `S4.wrong.8` | live | `M04-48` |
| `S4.wrong.9` | live *(as authored, the single message is composed-not-sent under `D32`, as `M02-47`/`M02-48` already carry; the standing tension is `registers/conflicts.md` rows 3–4, no new entry. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** the message **sends from the tenant's connected official channel where one is connected**, with a delivery state on that branch, and is **composed for a person where no channel is connected** — only that branch claims no delivery. Still exactly one message either way; `M04-58` carries both branches and its own row states that row 4 holds the resolution note. See `registers/conflicts.md` row 4)* | `M04-58` · `registers/conflicts.md` row 4 |
| `S4.wrong.10` | live | `M04-44` |
| `S4.wrong.11` | live *(the on-site half here; the remote-side address correction is `M04-12`)* | `M04-59` |
| `S4.wrong.12` | live | `M04-50`, `M04-51` |
| `S4.wrong.13` | live | `M04-57` |
| `S4.notv1.1` | live *(the photograph half is in scope and live — capture, tag, source, hand-off, from phone, customer or drone; the deriving-numbers half is the excluded non-goal, recorded with its rationale)* | `M04-53`, `M04-54` · exclusion at M04 §5 |
| `S4.rec.1` | live *("Make the review screen the star", carried as a requirement — the source's own recommendation, `SRC`, not a suite `REC`)* | `M04-49`, `M04-50` |
| `D15` | live *(surveying is a capability, not a gatekeeper; one capture flow for every holder)* | `M04-06` · grant at `F2.M04.capture-surveys`, persona statement at `PS-14` |
| `D30` | live *(amended on the imagery source by `R5` — recorded at `M04-09`; the provenance split rides `R18` via `F8-02`)* | `M04-01`, `M04-02`, `M04-03`, `M04-04`, `M04-05`, `M04-34` |
| `D35` | live *(photographs from any source including drone are in scope and travel to the designer; deriving numbers from them is the excluded non-goal — drone-as-imagery ok, drone-as-measurement not)* | `M04-53`, `M04-54`, `M04-46` · exclusion at M04 §5 |
| `R5` | live *(shared — the imagery / roof-detection half: coverage is a fact about a location and never a dependency, the two detection paths with the fallback returning shapes only, and the guarantee that a coverage failure never touches an energy figure. The provenance/source-labelling half is `foundations/F8`'s (`F8-08`, `F8-09`, Task 7); the energy source-of-record ladder stays with `modules/M05`; per-tenant metering of the proxied services with `modules/M12`)* | `M04-09`, `M04-18`, `M04-25`, `M04-27` |
| `DOC04.survey-versioned` | live *(the four survey states and the versioned-append law; the conflict story it doubles as is `F4-14`'s — live with its id, but **reframed 2026-08-07 (owner ruling `Q61`) as an ordinary concurrency law** governing two people working at the same moment on a live connection, not an offline one)* | `M04-57`, `M04-52`, `M04-56`, `M04-66` |
| `DOC04.survey-provenance` | live *(per-field provenance and skipped-but-flagged markers; per-detection confidence, source and version)* | `M04-16`, `M04-18`, `M04-28`, `M04-34`, `M04-35` |
| `DOC04.sanctioned-load` | live *(shared — the capture half and the figure it produces; the auto-design soft cap that reads it is `modules/M05`'s)* | `M04-45` |
| `DOC04.survey-gaps` | live *(the four resolutions verbatim; booking pulls the open capture-on-site set into the guided flow)* | `M04-31`, `M04-32` |
| `DOC04.visits` | live *(shared — the visit object and its four states here; the booking act from a lead is `modules/M02`'s `M02-46`, appended by Task 13)* | `M04-60` |
| `DOC04.photos-reference` | live *(the tag set, the three sources and the pin-to-obstruction rule, verbatim)* | `M04-53`, `M04-54` |
| `DOC05.ai-doorway` | live *(shared — the artifact's production and validation, and the drop-with-reason rule, are this module's; applying it and stamping entity provenance inside a design are `modules/M05`'s)* | `M04-24`, `M04-65` |
| `DOC07.google-enhancement-only` | live *("enhancement, never dependency", verbatim; every path it serves has a manual equivalent that costs nothing)* | `M04-09`, `M04-22`, `M04-25` |
| `DOC07.roof-detect-honesty` | live *(both paths and all five honesty rules: no-guessing, determinism and schema constraint, versioned provenance, 1:1 tile mapping, the geometry cross-check, and "never a hard error"; the model, its parameters and the prompt store are excluded as implementation)* | `M04-17`, `M04-18`, `M04-19`, `M04-20`, `M04-21` |
| `DOC07.map-tile-pinned` | live *(shared — the survey-side pin and its never-blocks fallback; the studio canvas that renders the same pinned tile is `modules/M05`'s)* | `M04-10`, `M04-11` |
| `CG-7` | excluded *(skip-deliberately, with the source's rationale recorded rather than assumed: elevation coverage too thin to be honest about, confidence shown on what the remote survey does use, physical-survey fallback. The confidence display and the measured/derived split are `foundations/F8`'s system, referenced not restated)* | M04 §5 · the honest alternative at `M04-16`, `M04-22`, `M04-26` |
| `CG-matrix.5` | excluded *(the matrix restatement of `CG-7` — LiDAR/DSM measurement, "✖ (D35)")* | M04 §5 |
| `CG-matrix.3` | excluded *(shared — the M04 half of a competitive claim **the product can no longer make.** The claim is "Offline field capture (survey, photos)": read+write with a durable queue, held partially by one rival and by none of the other five. Its survey half is void — `M04-39` and `M04-40` were deleted 2026-08-07 by owner ruling `Q61`, guided capture no longer happens offline, and the boundary that made the claim true is excluded at `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1. The positioning row `OV-39` was deleted by the same ruling, along with `BM-05`'s public pricing-page feature line, "because a product that requires a connection cannot advertise an offline field app". `M04-55` is deliberately **not** cited as this key's carrier: photographs held on the device until they upload are a **recovery guarantee, not a differentiator**, and marking this row live on it would restate a claim the owner deleted on purpose. The capture experience itself remains live at `M04-42`–`M04-46`, as an online flow)* | `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1 · `registers/open-questions.md` `Q61` (records `OV-39` and `BM-05`'s feature line deleted) |
| `CG-matrix.4` | live *(shared — the M04 half: AI roof detection with per-detection confidence and an accept/adjust/reject review, and the validated doorway out of it. The studio-side detection surface stays with `modules/M05`, where Task 7 routed this key, and the confidence-rendering law is `foundations/F8`'s `F8-01`/`F8-07`)* | `M04-15`, `M04-16`, `M04-24` |
| `journey §STAGE 4 · Mode A "Who" L339` *(no Task-2 ledger key — the extraction ledger's `S4.*` slice omitted the stage's "Who" line; read directly from source, convention 6)* | live *(shared — the grant and the two-capabilities reading are recorded at `foundations/F2` §F2.5-M04; the persona statement is this module's)* | `F2.M04.run-remote-survey` (Design Engineer cell) · M04 §2 (Design Engineer) |

## Task 15 — `modules/M05-design-studio.md`

Appended by Task 15. Requirement IDs in M05 use the prefix `M05-<nn>` (`M05-01`–`M05-95`);
matrix row `F2.M05.run-roof-detection` was appended to `foundations/F2-roles-and-permissions.md`
§F2.5-M05 (replacing its placeholder row) alongside the source-filled `create-edit-designs` and
`approve-designs` rows already there, with a notes block recording that design visibility
follows lead visibility and is not a new permission domain.

Conventions for reading this block:

1. **The census-block mechanism.** All **401** `SC.*` entries of the studio census checklist
   (`_process/extraction/studio-census-checklist.md`, post-overlay) are disposed of as **twelve
   census-block rows below — one per census section**, each naming the section's full key range.
   The census is incorporated **verbatim by reference** as M05's normative acceptance baseline
   (M05 Appendix A, one mapping row per entry, 401 rows, with a conformance rule stating that
   the source text governs and the census never shrinks); a per-entry re-listing here would
   duplicate that appendix, so the block row is the register's unit. Census entries other tasks
   listed as cited-but-not-disposed (Task 7 convention 3's `SC.10-1.20`, `SC.10-3.41`,
   `SC.10-5.38`, `SC.10-6.50`, `SC.10-7.13`, `SC.10-7.17`, `SC.10-7.27`, `SC.10-8.20`,
   `SC.10-9.12`, `SC.10-10.23`, `SC.10-11.18`) are disposed of inside their blocks.
   **Superseded fragments inside entries stay recorded, not resolved away:** the 10-step count
   and "3 / 10" indicator (`SC.10-1.04`/`SC.10-1.06`, `SC.10-6.01` — superseded by `R7`, 9
   visible steps), "Quote total"/"preliminary-quote" as UI copy (`SC.10-10.07`/`SC.10-10.41` —
   superseded by `R1`), and the brass-accent premise (`SC.10-7.42` — palette retired) are
   carried per the checklist's own `[note: …]` markers, which Appendix A declares part of each
   entry; the surviving rules are live at the named requirement IDs.
2. **Keys already closed by earlier tasks are not re-appended.** `DOC00.studio-flagship`
   (Task 3, `OV-21` — its named detail home is this document, landing at M05 §1/`M05-01`);
   `DOC08.matrix.create-edit-designs`/`.approve-designs` (Task 5 — the `F2.M05.*` rows this
   module references); `R18` (Task 7 — the four tiers, consumed via `F8-01`/`F8-02` at
   `M05-72`, `M05-94`); `DOC04.design-freshness-pins` and `DOC05.fingerprint-self-stale`
   (Task 7 — `F8-13`/`F8-14`; the studio's pin-and-self-stale surface is `M05-10`);
   `DOC02.money-never-stale-api` (Task 7 — `F8-12`); `R14` and the `DOC06.*` boundary rows
   (Task 10, re-dispositioned 2026-08-07 — `R14` is superseded by owner ruling `Q61` and
   `F4-09`, the online-only set it named, is deleted: the whole product is online-only now, so
   there is no set left to place the studio in. What resolves here is `F4-15`/`F4-27`, both
   live; the studio-side behaviour is `M05-09`, where
   `DOC06.designs-not-mobile-offline`/`DOC06.conflict-matrix`'s studio halves land, and the
   design instance of online-only mutation is `M05-09`'s "design mutations fail fast" rather
   than a membership in a ruled set);
   `D2` (Task 9 — `F7-30`; the WebView statement its row expects from M05 is at M05 §2);
   `BM-16`/`BM-19` (Task 11 — detection metering, consumed at `M05-23`/`F2.M05.run-roof-detection`);
   the M01 catalog set (Task 12 — `M01-32`–`M01-46` consumed by ID at `M05-37`, `M05-38`,
   `M05-43`, `M05-10`). IDs are assigned without new rows.
3. **Shared dispositions** (Task 4 convention 3 precedent, used by every task since). Rows
   marked *shared* carry the **M05 half** — the studio's tools, canvases, surfaces and computed
   outputs — of keys whose law, boundary or other-surface half belongs to another task's
   document: `foundations/F8` (Task 7 appended the law halves of `R5`, `DOC04.signoff-append`,
   `DOC11.structural-never-computed`, `DOC11.provenance-at-scale`, `DOC11.money-stale-at-scale`,
   `DOC11.shading-limits-printed`, `CG-reslink.4`, `CG-reslink.7`), `foundations/F7` (Task 9
   appended the visual/contract halves of `DOC10.studio-dod`, `UXG-22`, `UXG-24`,
   `CG-matrix.2`, `S5.rule.uxprob.1`), `foundations/F4` (Task 10 appended `OD-10`'s F4 half),
   `modules/M04` (Task 14 appended the survey halves of `R5`, `DOC05.ai-doorway`,
   `DOC07.map-tile-pinned`, `DOC04.sanctioned-load`, `CG-matrix.4` — the five halves its
   convention 2 owed this task, all appended below), `modules/M01` (Task 12 appended
   `CG-15`'s catalog half), and forward: `modules/M06` (Task 16: `R12`'s free-navigation half,
   `D16`'s customer-facing single recommendation with `foundations/F5`, `DOC05.bom-money-locked`'s
   proposal-money surface, the Generate-time checks `M05-61` hands off), `modules/M11`
   (Task 19: the money path `M05-70` feeds), `modules/M12` (Tasks 22/23: `R5` per-tenant
   metering, `DOC16.gate.design-kw` gate mechanics), `modules/M13` (Task 23: the sign-off-queue
   home composition), `modules/M08` (Task 18: installation-plan execution). Each pair is
   intentional, not a duplicate; the owning task appends its own half.
4. **Cited-but-not-disposed keys stay with their owners.** M05 cites, as grounding only:
   `D21`, `D22`, `D34`, `R11` (`modules/M06` — Generate-time enforcement per `R12`); `D5`,
   `R6` (`foundations/F5` — the share-link join is opened as Q27, not disposed); `R16` (Task 5
   / `modules/M08` — coordinator checklist attribution, consumed via `F2`); `D1` (segment flag,
   `modules/M02`); `D35` (Task 14 — photographs never measured); `DOC04.timeline` design events
   (`modules/M02`); `DOC16.gate.ai-detection`, `DOC16.metering-rules`,
   `DOC07.metering-entitlement-order` (`modules/M12`); `M02-32`/`M02-35`, `M04-10`/`M04-11`,
   `M04-45`, `M04-54`, `M04-63`–`M04-66` and every `F1-*`/`F2-*`/`F3-*`/`F4-*`/`F7-*`/`F8-*`/
   `BM-*`/`M01-*` requirement consumed by published ID.
5. **Tensions and supersessions recorded in-row, not silently resolved.** (a) The census's
   "no PRO/tier gate" rule (`SC.10-2.14`, `SC.10-6.66`) survives with a dead rationale (`D38`
   superseded — billing/entitlements are in v1) while `DOC16.gate.design-kw` already places an
   entitlement check at design save/creation; carried at `M05-12`/`M05-50` and **opened as Q28**
   rather than resolved (the checklist itself records the contradiction; no new conflicts-register
   entry is opened for a tension the adopted-verbatim source already records in-line). (b) DD12's
   **Battery** accordion section appears in the owner-supplied v1 screenshots and not in the
   census — recorded at `M05-37`; the census loses nothing by it. (c) The census's
   "available-later" markers on manual-specs/datasheet entry (`SC.10-5.10`/`SC.10-5.11`) vs the
   no-later-buckets scope law: DD12 rules all three entry paths present as P0, and the recorded
   tension is carried in the checklist's own notes and at `M05-37`. (d) `S5.rec.1` is POC-era
   design-process advice ("connect the codebase … one improvement at a time"), not product
   behaviour — excluded below with its surviving law named. (e) The physical-supersedes-remote
   reconciliation join is **deferred, explicitly**: `M05-13` states the honest interim behaviour
   and M05 §6 M05-Q2 extends register Q24 rather than inventing a policy.

| source key | disposition | PRD ref |
|---|---|---|
| `SC.gate.01`–`SC.gate.04` | live *(census-block row, convention 1 — canonical status, port-gate law, promoted-verbatim provenance; the docs/research source gap stays recorded at conflicts row 1)* | `M05-01` · M05 §1 · Appendix A.gate |
| `SC.10-1.01`–`SC.10-1.20` | live *(census-block row — shell, wizard, header, gates, Design Health; `SC.10-1.02`/`SC.10-1.03` land in the variants area, `SC.10-1.11` in the design-record area)* | `M05-02`–`M05-08` · `M05-09` (Save) · `M05-78` (list/variants) · Appendix A.10-1 |
| `SC.10-2.01`–`SC.10-2.20` | live *(census-block row — Step 1 setup and location; `SC.10-2.14`'s D38 contradiction recorded per convention 5, → Q28)* | `M05-14`–`M05-21` · Appendix A.10-2 |
| `SC.10-3.01`–`SC.10-3.42` | live *(census-block row — Step 2 roof CAD, AI ghosts, calibration, dependent-items guard, provenance, pinch-zoom addition)* | `M05-22`–`M05-29` · Appendix A.10-3 |
| `SC.10-4.01`–`SC.10-4.42` | live *(census-block row — Step 3 obstructions: eleven types, seven context actions, bridging chain, platform conversion)* | `M05-30`–`M05-36` · Appendix A.10-4 |
| `SC.10-5.01`–`SC.10-5.41` | live *(census-block row — Step 4 components and the DD12 picker; "available-later" tension per convention 5)* | `M05-37`–`M05-43` · Appendix A.10-5 |
| `SC.10-6.01`–`SC.10-6.66` | live *(census-block row — panel layout, stringing, validation, hard gate; `SC.10-6.66`'s D38 contradiction per convention 5, → Q28)* | `M05-44`–`M05-50` · Appendix A.10-6 |
| `SC.10-7.01`–`SC.10-7.43` | live *(census-block row — 3D view, sun/shadow, layers, edit cards, energy report; `SC.10-7.18`'s share-link open point → Q27; `SC.10-7.42`'s retired-palette premise per convention 1)* | `M05-51`–`M05-56` · Appendix A.10-7 |
| `SC.10-8.01`–`SC.10-8.20` | live *(census-block row — captures, readiness verdicts, staleness law)* | `M05-57`–`M05-61` · Appendix A.10-8 |
| `SC.10-9.01`–`SC.10-9.37` | live *(census-block row — SLD and drawing sheets, compliance box, edit ratings, structural two-state, exports)* | `M05-62`–`M05-67` · Appendix A.10-9 |
| `SC.10-10.01`–`SC.10-10.47` | live *(census-block row — BOM and pricing; `R1` supersedes "quote" as UI copy per convention 1)* | `M05-68`–`M05-74` · Appendix A.10-10 |
| `SC.10-11.01`–`SC.10-11.19` | live *(census-block row — Done, installation plan, crew-no-money, engineer sign-off, variants list; `SC.10-11.05`'s share-link open point → Q27)* | `M05-75`–`M05-77` · `M05-82`–`M05-86` · `M05-78`/`M05-80` · Appendix A.10-11 |
| `S5.rule.priority` | live *(the surviving product law only: flagship status binding, no scope or quality reduction; build ordering excluded per §14/DD4 — same reading as `OD-10`'s row below)* | M05 §1 |
| `S5.rule.redesign-not-invent` | live *(redesign-not-invent + the census gate, quoted in §1)* | M05 §1 · `M05-01` |
| `S5.rule.photos` | live *(photos as the designer's reference, never measured from)* | `M05-29` |
| `S5.rule.existing-steps` | live *(the ten existing steps, presented as 9 visible per `R7`)* | `M05-02` · feature areas §M05.3–§M05.12 |
| `S5.rule.uxprob.1` | live *(shared — the BOM screen and its progressive-disclosure redesign; the general law is `F7-34`, appended by Task 9)* | `M05-68` |
| `S5.rule.uxprob.2` | live *(desktop-only is the named failure; the touch model is the remedy)* | `M05-08` · `F7-29`/`F7-32` consumed |
| `S5.rule.uxprob.3` | live *(the phantom-step problem is ruled closed by `R7`; carried as the no-visible-step-5 requirement)* | `M05-02` |
| `S5.rule.uxprob.4` | live *(three header systems retired; one header set)* | `M05-04` |
| `S5.rule.uxprob.5` | live *(no blank-until-hydrated; explicit states)* | `M05-07` |
| `S5.screen.1` | live | `M05-78` |
| `S5.screen.2` | live | `M05-83` |
| `S5.screen.3` | live | `M05-86` |
| `S5.wrong.1` | live | `M05-21` |
| `S5.wrong.2` | live *(the honesty surface: shading results say so and a smaller layout is offered; the honesty law is F8's)* | `M05-54` · §M05.7 edge cases |
| `S5.wrong.3` | live | `M05-20` |
| `S5.wrong.4` | live *(catalog flags it; existing outputs keep their pricing — pinning via `M01-43`/`M01-44`)* | `M05-43` |
| `S5.wrong.5` | live | `M05-81` |
| `S5.wrong.6` | live | `M05-86` · `M05-82` |
| `S5.wrong.7` | live | `M05-11` |
| `S5.rec.1` | excluded *(POC-era design-process advice — "connect the codebase, ask for one improvement at a time"; process, not product. The surviving product law it points at — redesign-not-invent + the census gate — is live at M05 §1/`M05-01`; its "test-covered" claim describes the POC and is not carried)* | M05 §1 (surviving law) · this register |
| `R7` | live *(9 visible steps; arrival options exactly as the census describes; internal IDs stable)* | `M05-02` · `M05-44` |
| `R12` | live *(shared — the studio half only: "the studio's electrical hard gate stays", the ruled asymmetry named so it is never normalised. The free-navigation/validate-at-Generate half belongs to `modules/M06` — Task 16 appends it, per Task 14 convention 5's flag; this row does not dispose of it)* | `M05-05` · `M05-49` |
| `R5` | live *(shared — the M05 half: the energy source-of-record ruling and its database ladder, carried as "the market's energy source of record" with the v1 reference implementation named per the vendor rule. Label copy is `F8-08`/`F8-09` (Task 7); the imagery/roof-detection half is `M04-09`/`M04-18` (Task 14); per-tenant metering is `modules/M12`'s)* | `M05-17` · `M05-54` |
| `D16` | live *(shared — the M05 half: variants authored here, compared side-by-side, `is_recommended` set here, exactly one per lead. The customer-facing single recommendation is `modules/M06`'s/`foundations/F5`'s half — primary ledger home M06, Task 16)* | `M05-79` · `M05-80` |
| `D23` | live *(the surviving product facts only: the studio is in scope whole, flagship status unchanged; the build-order content is excluded per §14/DD4 and this row carries it for traceability alone)* | M05 §1 |
| `D39` | live *(kept and refactored: design-system restyle, touch model, production hardening; canonical census per directive 9; the phase-10-prompts non-canonical note and the repo/stack detail are excluded as process/implementation)* | M05 §1 · `M05-01` · `M05-08` |
| `OD-10 · studio-and-offline-last` | live *(shared — the M05 half: "never in scope or quality"; the F4 half was appended by Task 10; the build-ordering half stays excluded per §14/DD4)* | M05 §1 |
| `DOC05.wizard-9-steps` | live | `M05-02` |
| `DOC05.shading-validation-banner` | live *(the banner travels with shading outputs)* | `M05-54` |
| `DOC05.electrical-locked-rules` | live *(unstrung-over-illegal; empty voltage window stays an explicit fault)* | `M05-48` |
| `DOC05.bom-money-locked` | live *(shared — the BOM-side invariants, carried market-neutrally; the proposal money surface is `modules/M06`'s and the money path `modules/M11`'s)* | `M05-70` |
| `DOC05.bom-overrides` | live *(override=measured; stale-field tracking)* | `M05-72` |
| `DOC05.review-read-only` | live *(read-only, never a second gate)* | `M05-84` |
| `DOC05.auto-design-soft-cap` | live *(design can exceed the sanctioned load, with warning)* | `M05-20` |
| `DOC05.ai-doorway` | live *(shared — the M05 half: applying the validated artifact and stamping entity provenance in-canvas; production/validation is `M04-24`/`M04-65`, Task 14)* | `M05-23` |
| `DOC04.design-variants-recommended` | live *(sibling designs, lineage kept, exactly one recommended)* | `M05-78` · `M05-80` |
| `DOC04.signoff-append` | live *(shared — the M05 half: the queue, the review surface, approve/return with pinned comments, fingerprint-mismatch un-approval as surfaces; the append-only law and its pinning are `F8-26`/`F8-27`, Task 7)* | `M05-85` · `M05-86` |
| `DOC04.sanctioned-load` | live *(shared — the M05 half: the soft-cap read and its warning; capture is `M04-45`, Task 14)* | `M05-20` |
| `DOC07.map-tile-pinned` | live *(shared — the M05 half: the studio canvas on the pinned tile, and the never-blocks fallback into manual calibration; the survey-side pin is `M04-10`/`M04-11`, Task 14)* | `M05-16` · `M05-26` |
| `DOC07.dem-honesty` | live *(flat-terrain assumption, provenance `assumed`, visible warning; rooftop never touches it)* | `M05-92` |
| `DOC11.range` | live | `M05-87` |
| `DOC11.regimes` | live | `M05-87` |
| `DOC11.block-unit` | live | `M05-88` |
| `DOC11.regime-per-design` | live | `M05-88` |
| `DOC11.paradigm-switch` | live *("every tool survives")* | `M05-89` |
| `DOC11.per-panel-in-table` | live *("scoped, not deleted")* | `M05-89` |
| `DOC11.phase-a-in-build` | live *(capability tier P0; calendar language excluded)* | `M05-90` · `M05-88` (payload) |
| `DOC11.phase-b-capabilities` | live *(capability tier P1; GPU/CPU ±2% equivalence carried as an honesty-relevant requirement)* | `M05-91` |
| `DOC11.phase-c-trackers` | live *(capability tier P2; reference model per the vendor rule)* | `M05-92` |
| `DOC11.phase-c-terrain` | live *(capability tier P2; DEM sources as reference implementations; flat default)* | `M05-92` |
| `DOC11.terrain-spacing` | live *(cross-slope articulation stays deferred with its trigger, §5)* | `M05-92` · M05 §5 |
| `DOC11.block-electrical` | live *(extends, never replaces; MV as labelled assumption; reconciliation gates)* | `M05-93` |
| `DOC11.dxf-at-scale` | live *(provenance tiers print on every sheet)* | `M05-93` |
| `DOC11.deferrals` | excluded *(explicit non-goals, each carried with its re-evaluation trigger — including WebXR/photoreal "Never, absent a paying driver")* | M05 §5 |
| `DOC11.perf-budgets` | live *(release criteria per regime — quality gates, not schedule)* | `M05-95` |
| `DOC11.provenance-at-scale` | live *(shared — the M05 half: block-level provenance surfaces; the weakest-tier law is `F8-04`, Task 7)* | `M05-94` |
| `DOC11.shading-limits-printed` | live *(shared — the M05 half: the limits printed at every scale; the travels-with-outputs law is `F8-11`, Task 7)* | `M05-94` |
| `DOC11.structural-never-computed` | live *(shared — the M05 half: the structure tooling, sheets and scale surfaces that must never claim adequacy; the law is `F8-25`/`F8-28`, Task 7)* | `M05-94` · `M05-82` · M05 §5 |
| `DOC11.money-stale-at-scale` | live *(shared — the M05 half: recompute surfaces provisional for the whole window, issue blocked; the law is `F8-17`, Task 7; the money path `modules/M11`)* | `M05-94` |
| `DOC14.studio-scale-scope` | live *(the roadmap-side duplicate of `DOC11.phase-a-in-build`; capability commitment carried, calendar excluded)* | `M05-90` |
| `DOC14.census-quality-gate` | live *("the census never shrinks"; the release-valve sequencing detail excluded per §14/DD4)* | `M05-01` · Appendix A conformance rule |
| `DOC02.scale-editable-unit` | live *(blocks alongside the per-panel model from day one; no migration)* | `M05-88` |
| `DOC03.webview-parity` | live *(authenticated WebView at full parity; native canvas editing not rebuilt; no feature dropped)* | `M05-08` · M05 §2 |
| `DOC16.gate.design-kw` | live *(shared — the M05 half: enforcement placement only — never mid-edit, never per-keystroke, existing designs always open; the gate itself, its ceiling and its upgrade prompt are `modules/M12`'s, Task 23)* | `M05-12` |
| `UXG-06` | live *(queue contract verbatim: oldest-first; customer, kWp, designer, waiting time; role-gated; feeds the role-home redirect — composition `modules/M13`)* | `M05-83` |
| `UXG-07` | live *(read-only studio + drawings; approve records who+when; return requires ≥1 pinned comment; notification type registers into `foundations/F6`)* | `M05-84` · `M05-85` · `M05-86` |
| `UXG-08` | live *(compare 2–4 with the five figures; `is_recommended` set here; mobile snap cards; provenance labels on compared generation)* | `M05-79` |
| `UXG-21` | live *(single header; 9 visible steps; step states; mobile step sheet)* | `M05-04` · `M05-02` · `M05-03` |
| `UXG-23` | live *(the full ghost accept/reject contract; provenance vocabulary fixed by `R18` via F8)* | `M05-23` |
| `UXG-25` | live *(scale-program surfaces reuse the studio sheet grammar; block/table the editable unit; calendar language in its Blocks line retired per OD-5 — capability tiers carry it)* | `M05-91` · §M05.15 |
| `UXG-22` | live *(shared — the M05 half: the studio's mode toolbar, gesture layer and per-step tools; the touch/interaction contract half is `F7-29`/`F7-32`, Task 9)* | `M05-08` · §M05.4/§M05.5/§M05.7 canvases |
| `UXG-24` | live *(shared — the M05 half: the obstruction settings sheet and bridging chain, the BOM line-edit surfaces, the electrical sheets; the sheet grammar and visual law are F7's, Task 9)* | `M05-35` · `M05-72` |
| `DOC10.studio-dod` | live *(shared — the M05 half: the studio's tools, screens and census acceptance under the unreduced DoD; the DoD statement itself is `F7-43`/`F7-44`, Task 9)* | `M05-07` · `M05-08` |
| `CG-10` | live *(DESIGN-FOR verdict carried as designed-for capability: P50/P90 as an additive reporting layer on the same energy model, P2)* | `M05-56` |
| `CG-15` | live *(shared — the M05 half: MLPE offered as components with no MLPE electrical model — the deliberate "◐"; the catalog half is `M01-45`, Task 12)* | `M05-40` · M05 §5 |
| `CG-matrix.2` | live *(shared — the M05 half: the studio capability that holds full design parity on mobile; the design-language half is `F7-30`/`F7-32`, Task 9)* | `M05-08` |
| `CG-matrix.4` | live *(shared — the studio half Task 14 owed here: in-canvas AI detection with ghosts, confidence and provenance stamping; the survey half is `M04-15`/`M04-16`/`M04-24`, the confidence-rendering law `F8-01`/`F8-07`)* | `M05-23` · `F2.M05.run-roof-detection` |
| `CG-matrix.6` | live *(energy simulation with provenance labels — the studio's energy model and card/report surfaces; the labels are `F8-08`'s)* | `M05-17` · `M05-54` |
| `CG-matrix.9` | live *(auto-BOM with per-field overrides + provenance — the six-emitter derived BOM with override grammar; tier vocabulary F8's)* | `M05-70`–`M05-73` |
| `CG-reslink.4` | live *(shared — the M05 half: the energy report at every tier — monthly, losses, 25-yr; the provenance-labelling half is `F8-08`/`F8-01`, Task 7)* | `M05-54` |
| `CG-reslink.7` | live *(shared — the M05 half: the parametric member/steel model and foundations as material estimate + visual model; the never-a-computed-safety-verdict law is `F8-25`/`F8-26`/`F8-28`, Task 7)* | `M05-47` · `M05-53` |
| `CG-reslink.12` | live *(title-blocked drawing sheets at every tier; script-correct document render is F3's law)* | `M05-62` |

## Task 16 — `modules/M06-proposals.md`

Appended by Task 16. Requirement IDs in M06 use the prefix `M06-<nn>` (`M06-01`–`M06-58`,
contiguous; `M06-33` is the module's single `REC`, mirrored in `registers/enhancements.md`).
`foundations/F2-roles-and-permissions.md` §F2.5-M06's placeholder row was replaced with a notes
block recording that the two source rows are the complete grant set (no new row — `D34` leaves
no approval grant to place; proposal visibility follows lead visibility, per the M04/M05
precedent). `registers/open-questions.md` gained **Q29** (OPEX/PPA entitlement gating, M06 §6
M06-Q1).

Conventions for reading this block:

1. **This block closes the held halves earlier tasks routed here:** `R12`'s
   free-navigation/validate-at-Generate half (held since Task 14 convention 5; the studio-gate
   half is Task 15's row), `R1`'s entity/document half (Task 8's forward note), `R11`'s Quick
   mode half and `CG-1`'s Generate-time-check half plus `CG-matrix.13` whole (Task 12's forward
   notes), `D16`'s customer-facing single-recommendation half and `DOC05.bom-money-locked`'s
   proposal-money half and the `M05-61` Generate-time checks (Task 15 convention 3), and
   `S6B.rule.honesty`'s builder/document half (Task 7 holds the law half at `F8-20`/`F8-21`).
2. **Keys cited as grounding but not disposed here stay with their owners:** the customer-journey
   family (`C4`, `C5`, `C5.wrong.1`, `C5.wrong.3`, `C8`, `C8.wrong.1`, `C8.wrong.2`,
   `C.framing.7`, `C.lifecycle.4`), `DOC07.pdf-artifact`, `D5`, `R6`,
   `DOC04.accepted-human-confirms`, `DOC04.link-lifecycle`/`link-named-otp`/`link-events` —
   `foundations/F5` (Task 20); `D17`, `DOC04.tasks` — `modules/M07` (Task 17);
   `DOC04.message-templates` — `foundations/F6` (Task 23); `DOC04.tranche-templates`,
   `DOC04.tranches-money-path` — `modules/M11` (Task 19; the step-7 surface is `M06-13`);
   `D1` (Task 13, `M02-05`); `TC.wrong.4`/`TC.wrong.5` (Task 12); `S5.wrong.4`/`S5.wrong.7`
   (Task 15); and every `F1-*`/`F2-*`/`F3-*`/`F4-*`/`F8-*`/`BM-*`/`M01-*`/`M02-*`/`M05-*`
   requirement consumed by published ID.
3. **Keys already closed by earlier tasks are not re-appended:** `DOC00.nongoal-whatsapp-send`
   (Task 3, disposition `conflict` → conflicts rows 3–4; its M06 §Non-goals forward reference is
   now fulfilled), `DOC00.nongoal-discount-approval` and `DOC00.nongoal-ppa-billing` (Task 3,
   `excluded` → now fulfilled at M06 §5), `DOC08.matrix.create-edit-proposals`/`send-proposals`
   (Task 5 — the `F2.M06.*` rows this module references), `R13`/`R14`/`R18`/`R17`-halves and the
   `DOC04.currency-stamp`/`DOC06.no-local-price` laws (Tasks 6/7/10 — consumed by ID).
4. **One source contradiction carried verbatim, recorded, not resolved — and one file-boundary
   note.** `S6.wrong.4` ("delivery fails visibly; offer SMS or email") contradicts `D32`/
   `S6.screen.6` (the app does not send and has no delivery state, so it cannot see delivery
   fail); the extraction ledger flags it for the conflicts register. M06 carries the wording
   verbatim at `M06-57` with the v1-honest composed-not-sent reading (Task 14's `M04-58`
   precedent) and cites conflicts rows 3–4 for the standing composition-vs-sending tension;
   **`registers/conflicts.md` was outside this task's allowed file set, so the internal
   delivery-state contradiction is recorded here and in-row and flagged for the closure pass to
   mirror as its own conflicts entry.** *(Done: mirrored by Task 25 (gate closure) as
   `registers/conflicts.md` row 8; the `S6.wrong.4` row below now carries disposition `conflict`
   with the row-8 cite, per the legend.)* *(Reconciled to owner ruling 2026-08-04 `Q33`,
   2026-08-06: the contradiction this convention carries is **settled** — the ruling chose
   between the promise and the architecture. The transactional lane **sends from the tenant's
   connected official channel where one exists**, so on that branch delivery failure is visible
   exactly as `S6.wrong.4` demands and an alternate channel is offered; the **composed-not-sent
   reading survives only on the no-channel fallback**, where no delivery state is ever claimed.
   `M06-57` now carries both halves and `D32`'s unscoped manual-only rule is retired —
   `registers/conflicts.md` rows 4 and 8 both record it. The `S6.wrong.4` row below is retyped
   from `conflict` to `live` accordingly, the legend reserving `conflict` for contradictions
   still unresolved.)*
5. **Two more recorded-not-resolved readings, stated in-row:** (a) `S6B.step.3`'s 0.5–7000 kW
   capacity range vs `D1`'s 1 kW→100 MW design-range commitment — both carried, divergence
   recorded at `M06-09`, nothing normalised; (b) `S6B.wrong.6`'s unstated enforcement point for
   the OFFGRID force-battery block — read per `R12` (the builder has no earlier blocking point):
   ⚠ notice at step 3 immediately, hard block at Generate, stated as the adopted reading at
   `M06-30`.
6. **Superseded census keys are recorded as superseded, with the surviving behaviour named** —
   `D4` (→`D32`) and `D19` (→`D34`), both already struck in the census itself.

| source key | disposition | PRD ref |
|---|---|---|
| `S6.rule.one-object` | live | `M06-01` (one object; R1 naming) · `M06-39`/`M06-02` (BOM-is-internal half) |
| `S6.screen.1` | live | §M06.2 (`M06-07`–`M06-17`, one row per step) |
| `S6.screen.2` | live | `M06-39` (BOM detail — card list on mobile, internal, online-only edits) |
| `S6.screen.3` | live | `M06-42` (versions screen — what changed, and why) |
| `S6.screen.4` | live | `M06-50` (preview = exactly what the customer sees) |
| `S6.screen.5` | live | `M06-53` (Download PDF · Copy link · suggested message; mark-shared starts the clock) |
| `S6.screen.6` | live *(shared — the tracking-states surface and the no-'delivered' honesty rule land here; the link lifecycle, named links and OTP are `foundations/F5`'s slice, Task 20)* | `M06-54` |
| `S6.happy` | live | §M06.1 behavior detail (the whole flow) · `M06-53` · `M06-54` · `M06-55` (+2-days task) |
| `S6.wrong.1` | live *(the law is `F8-12`, Task 7; the module surfaces are here)* | `M06-41` · `M06-46` |
| `S6.wrong.2` | live | `M06-37` (below-cost warns with the loss stated; never blocks) |
| `S6.wrong.3` | live | `M06-36` (payable ≤ 0 blocks Generate — the only hard discount guard) · `M06-35` |
| `S6.wrong.4` | live *(carried verbatim at `M06-57`. Its history stays visible: the delivery-state promise vs `D32` was an unresolved internal source contradiction — read v1-honest as composed-not-sent — recorded at `registers/conflicts.md` row 8, disposition retyped from `live` to `conflict` by Task 25 once the register entry existed. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06), and retyped back to `live`:** the contradiction is resolved — where the tenant has a **connected official channel** the lane sends, so delivery **does** fail visibly and the alternate route the source demands is offered; where **no channel is connected** the message is composed for a person and no delivery state is claimed. `M06-57` carries both branches; see convention 4 and `registers/conflicts.md` rows 4 and 8)* | `M06-57` · `registers/conflicts.md` rows 4 and 8 |
| `S6.wrong.5` | live *(the agent trigger itself is `D17`/M07's, Task 17)* | `M06-54` · `M06-55` |
| `S6.wrong.6` | live | `M06-42` · `M06-45` (new version, old preserved; link shows latest) |
| `S6.wrong.7` | live | `M06-43` (sent proposals keep original prices; `R13`/`F8-15` consumed) |
| `S6.wrong.8` | live | `M06-58` (both visible on the customer record; one withdrawn) · `M02-08` consumed |
| `S6.rec.1` | live *(the source's own recommendation, already reflected in `S6.happy` — carried as `SRC`)* | `M06-55` |
| `S6B.rule.two-paths` | live | `M06-02` |
| `S6B.rule.prefill` | live | `M06-03` (the pre-fill table, faithful; typed-figure tier per `F8-21`/Q8, not re-opened) |
| `S6B.rule.honesty` | live *(shared — the builder/document half closing convention 1; the law half is `F8-20`/`F8-21`, Task 7)* | `M06-04` · `M06-51` |
| `S6B.rule.entry-points` | live | `M06-05` · `M06-48` (duplicate first-class) |
| `S6B.rule.shell` | live *(post-overlay: the "Next is disabled" source gating is superseded by `R12` and ships nowhere; "sage green" is retired POC palette — visual facts from `design/ds-source` via F7)* | `M06-21` · `M06-22` |
| `S6B.step.1` | live | `M06-07` · `M06-06` (type modal; OPEX/PPA gating open at Q29) |
| `S6B.step.2` | live | `M06-08` |
| `S6B.step.3` | live *(capacity-range divergence vs `D1` recorded — convention 5a; tax/incentive/administrative-area terms are IN pack instances per F1)* | `M06-09` · `M06-30` · `M06-34` · `M06-35` · `M06-40` |
| `S6B.step.4` | live | `M06-10` |
| `S6B.step.5` | live | `M06-11` |
| `S6B.step.6` | live | `M06-12` (`M01-52` consumed) |
| `S6B.step.7` | live | `M06-13` (100% rule enforced at Generate post-R12; `M01-54` consumed) |
| `S6B.step.8` | live | `M06-14` · `M06-27` · `M06-29` · picker cited from `modules/M05` §M05.6, never restated |
| `S6B.step.9` | live | `M06-15` (`M01-51` round-trip) |
| `S6B.step.10` | live | `M06-16` (`M06-44` number; pack phone spec `F1-49`) |
| `S6B.step.11` | live | `M06-17` |
| `S6B.rule.battery` | live | `M06-30` (card, modal, step-8 section, payable inclusion, force-battery block) |
| `S6B.rec.1` | live *(elevated from recommendation to committed scope by `R11`)* | `M06-18` |
| `S6B.rec.1b` | live | `M06-32` (kits removed; the three speeds; the duplicating-easier law verbatim) |
| `S6B.rec.2` | live *(adopted as the ruling by `R12` — recorded as satisfied by it)* | `M06-22` · `M06-21` (the dot treatment) |
| `S6B.rec.3` | live *(carried as a requirement — the source's own recommendation, `SRC`, per `S4.rec.1`'s precedent)* | `M06-48` |
| `S6B.rec.4` | live *(same precedent — the mobile chip-rail contract as `SRC`)* | `M06-24` |
| `S6B.rec.5` | live *(same precedent; the draft-save specification its ledger note routes here is stated **in `M06-25` itself** — every field commits on blur, a draft exists from the first commit and is resumable from the lead, shown as "Proposal draft — 7/11". **Amended 2026-08-07 (owner ruling `Q61`):** as written this row said the specification "is stated within `R14`'s boundary by ID". **There is no boundary to be stated within** — `R14`'s offline-scope half is superseded, and Task 10 convention 5 lists `S6B.rec.5` among the connectivity-framed grounding citations that no longer appear in the live `foundations/F4` document. What the key contributes survives whole as an ordinary save-continuously law, which is exactly what `M06-25` states; the key stays with this module and is not re-disposed by F4)* | `M06-25` |
| `S6B.wrong.1` | live | `M06-25` ("Proposal draft — 7/11" on the lead) |
| `S6B.wrong.2` | live | `M06-35` (live warn at step 3) · `M06-36` (block at Generate) |
| `S6B.wrong.3` | live | `M06-13` · `M06-23` (remainder stated, e.g. "12% unallocated") |
| `S6B.wrong.4` | live | `M06-27` · `M06-23` (jump to step 8, missing categories highlighted) |
| `S6B.wrong.5` | live | `M06-07` (upload validation with actual limits stated) |
| `S6B.wrong.6` | live *(enforcement-point reading per convention 5b)* | `M06-30` |
| `S6B.wrong.7` | live | `M06-46` (stale, says so, regenerate offered; staleness derived) |
| `S6B.wrong.8` | live | `M06-44` (server-assigned, never client-generated) |
| `S6B.wrong.9` | live | `M06-47` (upgrade offered, diff shown before commit; `F8-05` consumed; Q24 cited for the wider reconciliation ruling) |
| `D4` | superseded *(by `D32`, already struck in the census; the surviving behaviour it named — manual copy, opens tracked, delivery never — is kept visible as the v1 reading. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** the surviving behaviour is now two-branch — the share **sends from the tenant's connected official channel where one exists**, and a delivery state exists on that branch; where **no channel is connected** it is **composed for a person to send** and only that branch tracks opens without ever claiming delivery. Open tracking is unchanged on both. `M06-53`/`M06-54` carry the reconciled shape — see `registers/conflicts.md` row 4)* | `M06-53` · `M06-54` · `registers/conflicts.md` row 4 |
| `D16` | live *(shared — the customer-facing single-recommendation half closing Task 15's forward note; the authoring/compare half is `M05-79`/`M05-80`. **Route note corrected by Task 25:** no customer compare surface exists — the customer link renders the recommendation only, with variants present only where the designer deliberately added them, stated at `F5-35` (Task 20), which consumes this half rather than adding a compare surface)* | `M06-56` · `F5-35` |
| `D19` | superseded *(by `D34`, already struck in the census — no approval flow exists)* | M06 §5 · `M06-36` |
| `D21` | live | `M06-02` · `M06-03` · `M06-05` |
| `D22` | live *(enforcement at Generate only, per `R12`; kits-removed note carried)* | `M06-27` · `M06-23` · `M06-32` · `M06-48` |
| `D32` | superseded *(in its manual-only rule)* + live *(in the fallback discipline it leaves behind)* — *the v1 reading is kept visible: HONORED, manual copy as reference implementation, v2 BYO business-messaging as documented direction, M03 tension = conflicts rows 3–4, not re-resolved. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** `D32`'s manual-only rule is **fully retired** for the transactional lane — proposal links, payment links and status updates **send automatically from the tenant's connected official channel where one exists** (same connection as M03 campaigns, transactional/utility template class per pack rules), with a real delivery state on that branch. What survives of `D32` is the **fallback branch only**: where **no channel is connected** the message is **composed for a person to send**, and that path alone claims no delivery. The v2 "BYO business-messaging" direction has arrived rather than been deferred. `M06-53`/`M06-54`/`M06-57` and M06 §5 carry the reconciled shape — see `registers/conflicts.md` rows 4 and 8* | `M06-53` · `M06-54` · `M06-57` · M06 §5 · `registers/conflicts.md` rows 4 and 8 |
| `D34` | live *(HONORED — payable ≤ 0 blocks Generate, below-cost warns, both Generate-time per `R12`; revisit trigger recorded in §5)* | `M06-36` · `M06-37` · M06 §5 · F2 §F2.5-M06 notes |
| `R1` | live *(shared — the entity/document half closing Task 8's forward note; vocabulary law `F3-11`, search-alias half `foundations/F6` Task 23, customer-link wording `foundations/F5` Task 20)* | `M06-01` |
| `R11` | live *(shared — the Quick-mode half; the tenant-defaults-for-6/7/9/11 half is `M01-53`, Task 12)* | `M06-18` · `M06-19` · `M06-20` |
| `R12` | live *(shared — the free-navigation/validate-at-Generate half, closing the hold open since Task 14 convention 5; the studio electrical-gate half is Task 15's row. Kills the Next-disabled rule on sight; re-homes D22/D34 enforcement to Generate; tappable failure list "Fix 2 issues to share")* | `M06-22` · `M06-23` · `M06-20` |
| `R17` | live *(shared — the proposal-document-type half; the projection-label half is `F8-23` (Task 7), post-Won stage behaviour `modules/M08` (Task 18); the PPA-engine non-goal was closed by Task 3 and is fulfilled at M06 §5)* | `M06-06` · M06 §5 · Q29 |
| `UXG-09` | live *(entry toggle, 4 visible steps, AI-fill 4/5, defaults 6/7/9/11, loss-free expand, Generate-only validation)* | `M06-18` · `M06-19` · `M06-20` |
| `DOC02.server-identifiers` | live *(shared — the proposal-number half; the project-number half is `modules/M08`'s, Task 18)* | `M06-44` |
| `DOC04.proposal-paths` | live | `M06-02` · `M06-04` (mandatory indicative disclaimer) · `M06-06` (type enum) |
| `DOC04.proposal-status-machine` | live | `M06-45` |
| `DOC04.proposal-versions-immutable` | live | `M06-42` · `M06-43` · `M06-46` (staleness derived, never stored) |
| `DOC04.proposal-tax-model` | live *(scheme-generic; strategy from `pack.tax` — `F1-13`; the named IN strategy is `F1-28`'s)* | `M06-34` |
| `DOC04.components-gate` | live *(its "BOS" naming for the fifth category is carried as the source's synonym for the step's Electrical/Structure split — recorded, not normalised)* | `M06-27` · `M06-30` · `M06-31` |
| `DOC04.payable-guard` | live | `M06-36` |
| `DOC05.narrative-facts` | live *(the product law — every narrative claim maps to a facts entry; the traceability-test mechanism is implementation detail, dropped per §14)* | `M06-52` |
| `DOC05.bom-money-locked` | live *(shared — the proposal-money half Task 15 convention 3 routed here; the BOM arithmetic is `M05-70`'s, the money path `modules/M11`'s, Task 19)* | `M06-39` |
| `DOC07.messaging-manual` | live *(the v1 reading kept visible: v1 manual copy, with "the v1 path never leaves the codebase" carried as v2-fallback direction; M03 widening = conflicts rows 3–4. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** the key's own forward clause is what shipped — the manual path is now exactly the **fallback**, not the whole. Where the tenant has a **connected official channel** the share **sends** from it and a delivery state exists; where **none is connected** it is **composed for a person to send**, the only branch that claims no delivery. `D32`'s unscoped manual-only reading is retired; `M06-53` and M06 §5 carry the two-branch shape. The F6 half of this same key is that block's row. See `registers/conflicts.md` row 4)* | `M06-53` · M06 §5 · `registers/conflicts.md` row 4 |
| `DOC14.quick-mode` | live | `M06-18` |
| `DOC16.gate.proposal-count` | live *(shared — the placement half: create-only, existing-proposal operations and reads/exports never pause; the gate mechanics, banner and grace are `modules/M12`'s, Task 23)* | `M06-26` |
| `CG-1` | live *(shared — the Generate-time compliance-check half owed since Task 12; the catalog-flags half is `M01-34`, the pack rule `F1-34`/`F1-44`, Task 6)* | `M06-23`(f) |
| `CG-matrix.13` | live *(the matrix restatement of `CG-1`, deliberately left for this task by Task 12's convention — the elevated checked-feature capability lands as the Generate-time check plus its F1/M01 halves)* | `M06-23`(f) · `F1-34` · `F1-44` · `M01-34` |
| `CG-2` | live *(shared — the proposal-consumption half: the computed incentive amount in the payable; the computation model and slab-revisions-as-data are `F1-33`/`F1-14`, Task 6)* | `M06-38` |
| `CG-matrix.14` | live *(shared — matrix restatement of `CG-2`; the "computed in domain" capability is `F1-33`'s, the proposal surface here)* | `M06-38` |
| `CG-matrix.12` | live *(shared — the M06 half of the "proposal + no-login customer accept link" capability line: the generated version, one value set, honesty labels; the tokenised-lifecycle link half is `foundations/F5`'s, Task 20)* | §M06.9 · `M06-51` · `M06-54` |
| `CG-reslink.2` | live *(the M06 half — 11-step builder, versions, Path A/B on every tier, free navigation per R12, Quick mode per R11; the counts-per-01 tier dimension is `BM-12`, Task 11)* | §M06.2 · `M06-42` · `M06-02` · `M06-22` |
| `CG-4` | live *(the EMI-calculator half — "v1 ships the EMI calculator only")* + excluded *(the financing-marketplace half → M06 §5, designed-for as a portable capability, never load-bearing)* | `M06-40` · M06 §5 |
| `CG-14` | live *(shared — DESIGN-FOR carried: manual copy behind a port boundary, v2 BYO business-messaging documented, zero rework; the link half is `foundations/F5`'s, Task 20. The v1 clause "`D32` stands for v1" is kept visible as what the verdict was carried against. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** `D32` no longer stands unscoped — the port boundary the verdict designed for is now **used**, not merely reserved: the connected-channel adapter **sends** where a tenant channel exists and a delivery state exists on that branch, and the manual-copy adapter **composes for a person** where none is connected, the only branch claiming no delivery. The zero-rework claim is borne out. `M06-53`/M06 §5 carry it — see `registers/conflicts.md` row 4)* | `M06-53` · M06 §5 · `registers/conflicts.md` row 4 |
| `CG-9` | excluded *(shared — the M06 half: bankable-file exports for C&I lenders are post-launch designed-for, recorded at M06 §5; the studio/DXF half stays with `modules/M05` — its emitter-architecture claim is `M05-70`-adjacent and pass-two territory, not disposed here)* | M06 §5 |

## Task 17 — `modules/M07-sales-execution.md`

Appended by Task 17. Requirement IDs use the prefix `M07-<nn>` (`M07-01`–`M07-65`).
`docs/prd/foundations/F2-roles-and-permissions.md` §F2.5-M07's placeholder was replaced with four
rows (`F2.M07.hand-lead-to-agent`, `F2.M07.see-agent-queue`, `F2.M07.control-agent-queue`,
`F2.M07.mark-won-lost`) plus a notes block (agent controls stay Owner-only via
`F2.M01.configure-agent`; queue control Owner-only per `S7.screen.2`; queue visibility
lead-scoped). `registers/open-questions.md` gained **Q30** (statutory calling window vs manual
human dials, M07 §6 M07-Q1) and — in fix round 1 — **Q31** (agent-queue cancel asymmetry,
M07 §6 M07-Q2). Fix round 1 also wrote `registers/conflicts.md` **rows 6–7** (the
`DOC04.byo-number` and `DOC04.ivr-flows` recorded supersessions — see convention 4).

Conventions for reading this block:

1. **This block closes the held halves earlier tasks routed here:** Task 12's M07 halves of
   `TC.principle.2`/`.3`, `TC.agent-setup.1`–`.7`, `TC.kb.1`–`.11`, `TC.rec.1`,
   `TC.wrong.1`/`.2`/`.3`/`.7`; Task 16's `D17`/`DOC04.tasks` forward note; Task 6's `D36`
   gate-mechanism half, `D36.callrules.escape` hand-over-shaping half and `R3`
   capability-framework half; Task 7's `R10`/`D18` routing and `OD-7` capability-framework
   half (`F8-35` holds the degradation law); Task 8's `D12` surviving agent-language half;
   Task 13's cited S7 close/agent keys (`S7.rule.my-day`, `S7.screen.6`/`.7`/`.8`,
   `S7.wrong.4`/`.8`, `D17`, `D18`, `D36`, `DOC04.compliance-flags`, `DOC04.tasks`); and
   Task 11's cited `DOC16.gate.voice`/`DOC16.halted-inbound-degrade` M07 surface halves.
2. **Shared-with-M13 rows.** `S7.rule.my-day`, `S7.rec.1` and every `AP.*` key carry the M07
   half here (working surfaces); `modules/M13-dashboards-and-reporting.md` appends its
   dashboard/role-home half (D37 tiles, win/loss lists, the Sales Executive step-back view).
   Each pair is intentional, not a duplicate.
3. **Cited-but-not-disposed keys stay with their owners:** the customer-journey family (`C2`,
   `C6`, `C7`, `C7.wrong.1`–`.6`, `C8`, `C8.wrong.3`, `C1.wrong.2`) — `foundations/F5`
   (Task 20); `R9` and its state rows, `S2.rule.channel.2`, `S2.wrong.4`, `S3.wrong.1`,
   `UXG-02`, `DOC04.timeline`, `DOC04.lead-machine` — `modules/M02` by published ID
   (`M02-37`, `M02-43`, `M02-50`–`M02-58` consumed); `S8.rec.1`, `S8.wrong.8`, `R2` —
   `modules/M08` (Task 18); `D37`, `DOC04.forecast-not-revenue` — `modules/M13`;
   `DOC04.accepted-human-confirms`, `C8`'s acceptance law — `foundations/F5`;
   `DOC04.notification-types`, `DOC04.message-templates` — `foundations/F6`;
   `DOC04.usage-ledger`, `UXG-15`, `DOC16.*` billing mechanics — `modules/M12` (Task 23);
   `DOC08.consent-records` (Task 6, `F1-58`); `D13`, `D25`, `D10`'s acceptance-via-link
   cross-reference (`C8`) as grounding; and every `F1-*`/`F2-*`/`F3-*`/`F4-*`/`F8-*`/`BM-*`/
   `M01-*`/`M02-*`/`M06-*` requirement consumed by published ID. `DOC00.voice-touchpoint` and
   `CG-moat.1` were disposed by Task 3 (conventions 1–2, refs already naming this module);
   M07 assigns the IDs (`M07-24`, `M07-27`, §M07.6) without new rows.
4. **Superseded wording recorded, not implemented:** `UXG-16`'s "BYO = hosted/ported with
   KYC" and `UXG-18`'s "`sendDtmf()`/`onDtmf()` over AgentStream" premises (both superseded by
   owner directive 7 as amended 2026-07-26, ADR-0019 — the post-overlay ledger rows are what
   M07 implements); `DOC04.byo-number`'s porting/KYC wording and `porting` status;
   `DOC04.ivr-flows`' outbound sendDtmf clause; `D10`'s "may never discuss discounts" clause
   (superseded by D36 — owner-configurable defaults); `D24`'s "locked by platform" half
   (superseded by D36, which is itself amended — the floor is enforced by the gate);
   `AP.screen.3`'s "no plan cap or limit (billing deferred, D38)" clause (D38 superseded —
   the usage view reads the real ledger). The `DOC04.byo-number`/`DOC04.ivr-flows`
   stale-wording-vs-ADR-0019 supersessions the extraction ledger flags ("record conflict")
   are **written in `registers/conflicts.md` as rows 6 and 7** (fix round 1 — the file
   entered this task's scope on review), recorded in-row at `M07-52`/`M07-47`, and both are
   recorded supersessions with no open contradiction — the amended directive wins and
   `M07-52`/`M07-49` are the live specs.
5. **Open questions deferred-to, not re-opened:** Q6 (disclosure floor status — enforced as
   floor at `M07-10`/`M07-24`/`M07-32` pending the ruling) and Q21 (lost-reason vocabulary —
   `M07-63` renders R9-as-written). New: Q30 (M07-Q1, window vs manual dials) and Q31
   (M07-Q2, queue-cancel asymmetry — fix round 1).
6. **Vendor names appear only as reference implementations** (Global Constraint §6 / OV-34):
   Exotel + Sarvam are the IN reference rails behind capability ports (`F1-43`, Task 6);
   M07's rows are written against declared capabilities (`M07-54`), and the module body
   names no vendor outside reference-implementation citations.

| source key | disposition | PRD ref |
|---|---|---|
| `S7.rule.my-day` | live *(shared — M07 working-surface half; the role-home/dashboard half is `modules/M13`'s, with `PS-11` reciprocated)* | `M07-01` · `M07-02` · `M07-04` |
| `S7.rec.1` | live *(shared — the separate-block law; also binds M13's My Day layout)* | `M07-03` |
| `S7.screen.1` | live | `M07-09` · `M07-12` · `M07-15` · `M07-34` |
| `S7.screen.2` | live | `M07-35` · `F2.M07.see-agent-queue` · `F2.M07.control-agent-queue` |
| `S7.screen.3` | live | `M07-38` |
| `S7.screen.4` | live *(post-overlay — "the owner owns the choice" survives only above the enforced floor)* | `M07-28` |
| `S7.screen.5` | live | `M07-42` |
| `S7.screen.6` | live | `M07-62` · `F2.M07.mark-won-lost` |
| `S7.screen.7` | live *(the six reasons as written; vocabulary fork open at Q21)* | `M07-63` |
| `S7.screen.8` | live | `M07-64` |
| `S7.rule.agent-defaults` | live *(does/holds-back lists verbatim; discount/negotiation owner-enableable per D36; acceptance-only-via-link and statutory-stop carried as law)* | `M07-22` · `M07-23` |
| `S7.rule.disclosure` | live *(floor status pending Q6)* | `M07-10` · `M07-24` |
| `S7.wrong.1` | live *(post-overlay — gate enforcement, not a default; manual-dial question → Q30)* | `M07-30` |
| `S7.wrong.2` | live | `M07-31` · `M07-23` |
| `S7.wrong.3` | live *(post-overlay — R10 mechanism)* | `M07-25` · `M07-26` |
| `S7.wrong.4` | live | `M07-40` |
| `S7.wrong.5` | live | `M07-43` · `M07-42` |
| `S7.wrong.6` | live *(holiday calendar is pack/tenant data — F1-48)* | `M07-31` |
| `S7.wrong.7` | live | `M07-25` |
| `S7.wrong.8` | live *(the dormant machine is `M02-52`'s; the surface consequence lands here)* | `M07-04` · M07 §M07.12 edge cases |
| `D8` | live *(HONORED — the voice agent ships; inbound IVR per OD-7)* | M07 §1 · `M07-22` · `M07-47` |
| `D10` | live *(default-behaviour half; its "may never discuss discounts" clause superseded by D36 — recorded; acceptance-only-via-link (C8) cross-references `foundations/F5`)* | `M07-22` · `M07-23` |
| `D12` | live *(shared — the surviving agent-language-set half routed here by Task 8; the superseded UI half is `F3-01`'s trail)* | `M07-15` |
| `D17` | live *(closing Task 13's and Task 16's forward notes; trigger surfaces `M06-55`/`M02-43` consumed)* | `M07-33` · `M07-07` · `F2.M07.hand-lead-to-agent` |
| `D18` | live *(HONORED — plus the overlay's agent-config-version and IVR-marker additions)* | `M07-38` |
| `D24` | live *(guided-config + KB + unanswered-loop halves; the "locked by platform" half superseded by D36 — recorded, and D36's own amendment enforces the floor)* | `M07-08` · `M07-16` · `M07-18` |
| `D36` | live *(shared — the non-swappable gate MECHANISM and tenant-config behaviour halves close here; the statutory-ruleset halves are `F1-12`/`F1-15`–`F1-17`/`F1-36`, Task 6; the settings-surface half is `M01-56`/`M01-57`, Task 12)* | `M07-27` · `M07-09` · `M07-14` |
| `D36.callrules.escape` | live *(shared — hand-over shaping + always-offered human half; the statutory opt-out half is `F1-36`(c), Task 6)* | `M07-11` · `M07-24` |
| `R3` | live *(shared — the capability-framework/vendor-to-capability half, closing Task 6's routing; the IN rails half is `F1-43`; metered-minute pricing `BM-18`/`BM-41`)* | `M07-54` · `M07-37` · `M07-15` |
| `R10` | live *(ruling verbatim — review-queue only, no auto-training ever in v1; non-goal recorded at M07 §5)* | `M07-26` · M07 §5 |
| `OD-7` | live *(shared — the capability-framework and BYO-forwarding/DTMF operative facts close here; the honest-degradation law is `F8-35` (Task 7), the number-series rules `F1-37` (Task 6))* | `M07-52` · `M07-49` · `M07-54` · M07 §5 |
| `UD-6` | live *(shared — vendors as v1 reference implementation only; read under OD-7's capability framework)* | `M07-54` |
| `TC.principle.2` | live *(M07 half — governing principle behaviour; the surface statement is `M01-56`)* | `M07-27` · `M07-09` |
| `TC.principle.3` | live *(M07 half — the five shipped safe defaults as agent behaviour; floor items enforced)* | `M07-22` · `M07-24` · `M07-28` |
| `TC.agent-setup.1` | live *(M07 half)* | `M07-08` |
| `TC.agent-setup.2` | live *(M07 half — everything editable within the ComplianceGate floor)* | `M07-09` |
| `TC.agent-setup.3` | live *(M07 half — disclosure default editable per its floor status; Q6)* | `M07-10` |
| `TC.agent-setup.4` | live *(M07 half — "asks to stop" is statutory)* | `M07-11` |
| `TC.agent-setup.5` | live *(M07 half — within-the-law window editing)* | `M07-12` |
| `TC.agent-setup.6` | live *(M07 half — "the most important screen here")* | `M07-13` |
| `TC.agent-setup.7` | live *(M07 half — change history reads the versions)* | `M07-14` |
| `TC.kb.1` | live *(M07 half — structured, not an upload)* | `M07-16` |
| `TC.kb.2` | live *(M07 half)* | `M07-16` |
| `TC.kb.3` | live *(M07 half — brand/model names never translated, F3 law cited)* | `M07-16` |
| `TC.kb.4` | live *(M07 half — example values, not platform defaults)* | `M07-16` |
| `TC.kb.5` | live *(M07 half)* | `M07-16` |
| `TC.kb.6` | live *(M07 half — price talk is the owner's call, D36)* | `M07-16` · `M07-23` |
| `TC.kb.7` | live *(M07 half — incentive colour is pack material, F1-33 cited)* | `M07-16` |
| `TC.kb.8` | live *(M07 half — bank/NBFC lists are pack colour)* | `M07-16` |
| `TC.kb.9` | live *(M07 half)* | `M07-16` |
| `TC.kb.10` | live *(M07 half — the committed loop; R10 pins promotion)* | `M07-18` |
| `TC.kb.11` | live *(M07 half — seeded, not empty; IN seed content is F1's)* | `M07-17` |
| `TC.rec.1` | live *(M07 half — the loop is the mechanism that keeps the system honest; source recommendation carried as SRC)* | `M07-18` |
| `TC.wrong.1` | live *(M07 half — statutory items blocked by the gate; above-floor edits remain the owner's)* | M07 §M07.3 edge cases · `M07-27` |
| `TC.wrong.2` | live *(M07 half)* | `M07-19` |
| `TC.wrong.3` | live *(M07 half — queued calls keep their version; owner told)* | `M07-14` · `M07-36` |
| `TC.wrong.7` | live *(M07 half — preview catches the mismatch)* | `M07-21` · `M07-13` |
| `AP.retention.1` | live *(shared — M13 reciprocates; "its first invoice" literal post-overlay)* | `M07-55` |
| `AP.dashboard.1` | live *(shared — sample figures illustrative, not targets)* | `M07-55` |
| `AP.dashboard.2` | live *(shared — pack formatting on the pipeline figure)* | `M07-56` |
| `AP.honesty.1` | live *(shared — the law is `F8-30`/`F8-31`, Task 7; the screens land here and in M13)* | `M07-56` |
| `AP.screen.1` | live *(shared — M13)* | `M07-57` |
| `AP.screen.2` | live *(shared — M13; same loop as TC.kb.10)* | `M07-58` |
| `AP.screen.3` | live *(shared — the struck "no plan cap" deferred-era clause appears nowhere; entitlement data is M12's)* | `M07-59` |
| `AP.screen.4` | live *(shared — M13; visibility per `F2.M07.agent-performance`)* | `M07-60` |
| `AP.wrong.1` | live *(shared — M13)* | `M07-61` |
| `AP.wrong.2` | live *(shared — M13)* | `M07-61` · `M07-58` |
| `AP.wrong.3` | live *(shared — acceptance-level restatement of the F8-31 law)* | `M07-56` |
| `AP.wrong.4` | live *(shared — push type registers with F6)* | `M07-61` |
| `UXG-16` | live *(post-overlay row implemented: platform number instant/default; BYO = inbound forwarding, outbound CLI not portable; series explainer; status states + honest lead-time. The original "hosted/ported with KYC" definition superseded — convention 4; settings surface listed at `M01-57`; series/statutory rules `F1-37`)* | `M07-51` · `M07-52` · `M07-53` |
| `UXG-17` | live *(list-based step editor, business-hours reuse of the calling-window control within the floor, per-language greeting + preview, versioned like agent config; the per-language greeting clause also cited by F3, Task 8)* | `M07-47` |
| `UXG-18` | live *(post-overlay row implemented: capability-conditional traversal surfacing + honest degradation; "stuck in IVR — escalated" required; the `sendDtmf`/`onDtmf` premise superseded — convention 4; degradation law `F8-35`)* | `M07-49` |
| `DOC04.tasks` | live *(closing Task 16's forward note)* | `M07-05` · `M07-06` · `M07-07` |
| `DOC04.compliance-flags` | live *(shared — the gate-read half; the record half is `M02-37`, Task 13)* | `M07-28` |
| `DOC04.agent-config-versions` | live | `M07-14` · `M07-36` · `M07-09` |
| `DOC04.kb-unanswered-loop` | live *(KB mutable; calls pin config version — auditability pairing per R10)* | `M07-16` · `M07-18` |
| `DOC04.call-queue-compliance` | live | `M07-33` · `M07-35` · `M07-30` |
| `DOC04.call-ledger` | live *(per-call cost breakdown carried as internal/never-customer-facing; ledger mechanics excluded per §14)* | `M07-38` · `M07-32` |
| `DOC04.byo-number` | superseded *(by owner directive 7 as amended 2026-07-26, ADR-0019/spike S5 — the stale porting/KYC wording and `porting` status ship nowhere; forwarding-only is the live behaviour at `M07-52`. Recorded supersession, written at `registers/conflicts.md` row 6 per convention 4; disposition retyped from `conflict` to `superseded` by Task 25 to match row 6's own status: recorded supersession, no open contradiction)* | `M07-52` · `M07-53` · `registers/conflicts.md` row 6 |
| `DOC04.ivr-flows` | live *(inbound flow half; its outbound sendDtmf clause is the superseded directive-7 wording — recorded supersession, written at `registers/conflicts.md` row 7 per convention 4)* | `M07-47` · `registers/conflicts.md` row 7 |
| `DOC04.routing-policies` | live | `M07-44` |
| `DOC04.handoff-ledger` | live | `M07-45` |
| `DOC04.user-presence` | live | `M07-46` |
| `DOC07.telephony-capabilities` | live *(declared capabilities; degradation ladder; branch on declaration never vendor name)* | `M07-54` · `M07-45` · `M07-49` |
| `DOC07.routing-tenant-data` | live | `M07-44` · `M07-45` |
| `DOC07.byo-forwarding` | live *(supersedes docs/04's porting wording; "product copy must say 'forwarding'")* | `M07-51` · `M07-52` |
| `DOC07.inbound-ivr` | live | `M07-47` |
| `DOC07.compliance-gate` | live *(mechanism half — "no override flag", fail-closed, before every dial; the IN ruleset content is F1-36's)* | `M07-27` · `M07-29` |
| `DOC07.call-failure-honesty` | live *("call record always written")* | `M07-39` |
| `DOC07.agent-orchestration` | live *(product-visible half only — disclosure ≤30 s, escalate-to-human, stall ladder to hand-off/voicemail per tenant config, queue-time version; orchestration internals excluded per §14)* | `M07-39` · `M07-32` · `M07-36` |
| `DOC08.agent-lead-scope` | live | `M07-20` |
| `DOC08.compliance-gate` | live *(shared — mechanism here; ruleset items F1-36)* | `M07-27` |
| `DOC08.recording-retention` | live *(shared — the retention bound is pack data F1-36(e); the record behaviour lands here)* | `M07-38` |
| `DOC09.compliance-fail-closed` | live | `M07-29` |
| `DOC02.trigger-schedule` | live *(shared — the M07-visible timers: trigger queues, scrub-before-window, retention purge; R9 sweep semantics are M02's, the trial sweep M12's; fixed clock-times carried as product timers, not calendar language)* | `M07-33` · `M07-35` · `M07-29` · `M07-38` |
| `DOC14.voice-capabilities` | live *(the committed launch capability set: inbound IVR, provisioning with BYO-as-forwarding, cold transfer + pinned context + callback queue, warm-if-verified, single-level chains as data, honest DTMF degradation)* | `M07-45` · `M07-47` · `M07-49` · `M07-52` · M07 §5 |
| `DOC16.gate.voice` | live *(shared — the M07 surface half: check before insert AND dial, blocked entry marked + owner notified, inbound over-allowance to ring group/voicemail; gate mechanics `modules/M12`, Task 23)* | `M07-37` · `M07-50` |
| `DOC16.halted-inbound-degrade` | live *(shared — the M07 degradation surface; the halted billing state is M12's)* | `M07-50` |
| `CG-matrix.23` | live *(the competitive matrix restatement of the moat — "AI voice agent (outbound + inbound, 6 languages): unique"; the moat row itself was disposed by Task 3, `CG-moat.1` → `OV-37` + this module)* | M07 §1 · `M07-15` · `M07-22` |

## Task 18 — `modules/M08-projects.md`

Appended by Task 18. Requirement IDs use the prefix `M08-<nn>` (`M08-01`–`M08-53`); permission
row keys added to `foundations/F2-roles-and-permissions.md` §F2.5-M08 are named where they carry
a source key.

Six conventions used in this block:

1. **Shared dispositions are named as halves.** `R2`'s canonical machine lands here while its IN
   labels/skippable-stage half stays with `foundations/F1` (Task 6, `F1-51`/`F1-35`), its tranche
   `due_on_stage` mapping with `modules/M11` (Task 19), its customer-link stage display with
   `foundations/F5` (Task 20) and its days-in-stage metrics with `modules/M13` (Task 23). The same
   applies to `R15` (handover ask here, CRM tag at `M02-16`), `R16` (checklist behaviour here,
   preset ruling Task 5, persona half Task 4), `R17` (post-Won behaviour here, document type
   `M06-06`, projection label `F8-23`, PPA non-goal closed by Task 3), `DOC02.server-identifiers`
   (project number here, proposal number `M06-44`) and `DOC04.document-checklist` (seeding,
   statuses and the handover rule here; the row-set instance is `F1-52`'s). Each pair is
   intentional, not a duplicate.
2. **`DOC00.nongoal-projects-light` is not re-appended.** Task 3's convention 1 disposes every
   `DOC00.*` key once; that row already names this module's §5 as its home. Both of its clauses
   are fulfilled here — the exclusions at §5 and the commissioning-artefact retention at
   `M08-48`.
3. **Keys cited but not disposed here** stay with their owning tasks: `S8.screen.3` and
   `S8.rule.tranches`' money mechanics, `DOC04.tranches-money-path`, `DOC04.tranche-templates`,
   `DOC04.payments-append-only` (`modules/M11`, Task 19); `S8.screen.7`, `S8.rec.4`,
   `DOC04.link-lifecycle`, `DOC04.accepted-human-confirms` and the customer-journey rows this
   module cites as grounding — `C10`, `C10.wrong.1`, `C10.wrong.2`, `C11`, `C12`, `C.framing.8`,
   `C.lifecycle.6`, `C.lifecycle.7` (`foundations/F5`, Task 20); `DOC04.timeline`,
   `DOC04.lead-machine`, `DOC04.merge-tombstone` (`modules/M02`); `D32` (`modules/M06`);
   `D37`, `DOC04.forecast-not-revenue` (`modules/M13`); `DOC04.proposal-versions-immutable`
   (`modules/M06`); `D5`, `D20`, `D27` and every `F1-*`/`F2-*`/`F3-*`/`F4-*`/`F7-*`/`F8-*`/
   `M02-*`/`M04-*`/`M05-*`/`M06-*`/`M07-*` requirement consumed by published ID.
4. **Superseded wording recorded, not implemented.** `D9`'s five-state shorthand
   (Won → Ordered → Installed → Commissioned → Handed over) is deprecated by `R2` and **appears
   nowhere** in this module — not as a model, a filter or a display grouping; only D9's scope half
   is live. `R2`'s own pre-amendment vocabulary (the market-specific blocker-party and stage names
   it replaced) is likewise recorded rather than written: the module body carries only the
   market-neutral values, and the market labels are `F1-51`'s pack data. `R16`'s "coordinator
   (Manager role)" names v1's preset — V2's holder is the Project Manager per decision B
   (`F2-08b`), recorded on the `F2.M08.installation-checklist` row itself so no reader is misled.
5. **Market neutrality.** No stage name, checklist row name, blocker label, payment mode, utility
   name, incentive scheme or currency figure appears in the module body; each is referenced as
   pack data (`F1-09`, `F1-14`, `F1-22`, `F1-35`, `F1-46`, `F1-51`–`F1-53`). The `F1` §4 sentinel
   grep over this file returns no market-specific term.
6. **Open questions.** New: **Q32** (M08-Q1 — the collection schedule of an operating-expense /
   power-purchase project, `R17` being silent on money while `M06-13` requires payment terms on
   every proposal). Deferred-to, not re-opened: **Q29** (whether that proposal type is
   entitlement-gated). No `REC` arose in this module — the scope law of `M08-01` is the reason
   and it is stated as such.

| source key | disposition | PRD ref |
|---|---|---|
| `S8.rule.v1-boundary` | live *(the scope law, verbatim; every excluded item is an explicit non-goal with its rationale)* | `M08-01` · M08 §1 · M08 §5 |
| `S8.rule.stage-chain` | live *(the canonical nine-stage chain; labels and skippable stages are pack data)* | `M08-08` · `M08-09` |
| `S8.rule.external-delays` | live *(shared — the honest-attribution law here; the market's typical-wait content and labels are `F1-53`'s)* | `M08-26` · `M08-29` |
| `S8.rule.tranches` | live *(shared — the project-side surfaces here: schedule inherited, stage makes a tranche due, collected-vs-due display, copy-request action; the money path and tranche states are `modules/M11`'s)* | `M08-35` · `M08-36` · `M08-38` |
| `S8.rule.roles` | live *(shared — the stage-scoped slice here and as F2 cells; the preset matrix itself is Task 5's)* | `M08-18` · `F2.M08.project-visibility` · F2 §F2.5-M08 notes |
| `S8.screen.1` | live | `M08-10` · `M08-12` · `M08-37` |
| `S8.screen.2` | live | `M08-16` · `M08-17` |
| `S8.screen.4` | live | `M08-30` · `M08-31` · `M08-32` |
| `S8.screen.5` | live | `M08-20` · `M08-21` · `M08-24` |
| `S8.screen.6` | live *(the execution surface here; the plan's derivation is `M05-76`)* | `M08-41` · `M08-42` · `M08-43` |
| `S8.screen.8` | live | `M08-46` · `M08-47` |
| `S8.happy` | live *(the spine: won → project → stage by stage → tranche due + link updated → pack sent → closed)* | `M08-02` · `M08-15` · `M08-46` |
| `S8.wrong.1` | live | `M08-12` |
| `S8.wrong.2` | live *(shared — the blocker facts here; the customer-link line is `foundations/F5`'s copy)* | `M08-29` |
| `S8.wrong.3` | live *(shared — the board/chase surface and the never-block-the-link law here; the money mechanics are `modules/M11`'s and the link law also binds `foundations/F5`)* | `M08-39` |
| `S8.wrong.4` | live | `M08-24` |
| `S8.wrong.5` | live *(internal reason and customer-visible framing kept separate)* | `M08-25` |
| `S8.wrong.6` | live *(incentive vocabulary per pack — `F1-14`/`F1-35`)* | `M08-27` |
| `S8.wrong.7` | live *(shared — the project's reference moves and history is preserved; version mechanics `modules/M06`, tranche revision `modules/M11`)* | `M08-50` |
| `S8.wrong.8` | live | `M08-51` · `M08-52` |
| `S8.wrong.9` | live | `M08-13` |
| `S8.rec.1` | live *(adopted as law, not as a recommendation — the source's own framing)* | `M08-02` |
| `S8.rec.2` | live | `M08-11` · `M08-12` |
| `S8.rec.3` | live | `M08-23` |
| `R2` | live *(shared — the canonical state machine and blocker sub-states here; IN labels/skippable set `F1-51`/`F1-35` (Task 6), tranche `due_on_stage` `modules/M11`, link stage display `foundations/F5`, days-in-stage metrics `modules/M13`)* | `M08-08` · `M08-09` · `M08-20` · `M08-22` · `M08-36` · `M08-51` |
| `R15` | live *(shared — the handover-time referral ask here; the CRM tag and "came from" chip are `M02-16`'s and the credits ledger is the spec-locked exclusion)* | `M08-47` · M08 §5 |
| `R16` | live *(shared — the checklist behaviour half; the preset ruling is Task 5's and the persona half Task 4's)* | `M08-41` · `M08-42` · `M08-43` · `M08-45` |
| `R17` | live *(shared — the post-Won half: same stages, same checklist, no recurring invoicing, no meter ingestion; document type `M06-06`, projection label `F8-23`, PPA-engine non-goal closed by Task 3)* | `M08-06` · M08 §5 |
| `D9` | live *(the scope half only — no inventory, purchase orders, scheduling engine or O&M; its five-state shorthand is **superseded** by `R2` and appears nowhere, per convention 4)* | `M08-01` · M08 §5 |
| `DOC02.server-identifiers` | live *(shared — the project-number half; the proposal-number half is `M06-44`, Task 16)* | `M08-03` |
| `DOC04.project-machine` | live | `M08-08` · `M08-09` · `M08-11` · `M08-51` |
| `DOC04.document-checklist` | live *(shared — seeding, the three statuses and the handover rule here; the market row set and its per-segment omissions are `F1-52`'s)* | `M08-30` · `M08-31` · `M08-32` · `M08-34` |
| `DOC04.blockers` | live | `M08-20` · `M08-21` · `M08-25` · `M08-29` |
| `DOC04.installation-checklist` | live *(shared — execution, attribution and manual additions here; derivation from the design is `M05-76`)* | `M08-41` · `M08-42` |
| `DOC16.gate.active-projects` | live *(shared — the "active = neither handed over nor cancelled" definition and the never-strand-a-live-installation law here; the gate mechanics, denial and upgrade prompt are `modules/M12`'s, Task 23)* | `M08-07` |
| `UXG-19` | live *(shared — the handover-time ask half; the CRM-core tag half is `M02-16` and the credits ledger is the excluded spec-lock)* | `M08-47` · M08 §5 |
| `UXG-20` | live *(the checklist behaviour and its attribution here; the role decision is `foundations/F2`'s, Task 5)* | `M08-42` · `M08-45` · F2 §F2.5-M08 |
| `CG-3` | live *(DESIGN-FOR — utility on the site record, blocker attribution, checklist tracks the application; the pack's utility directory is `F1-53` and generated application packets are a §5 non-goal)* | `M08-28` · M08 §5 |
| `CG-6` | excluded *(SKIP-DELIBERATELY — no monitoring, telemetry, service module or customer app; the commissioning-artefact retention half is **live**)* | `M08-48` · M08 §5 · summarised at `01 §6` |
| `CG-matrix.15` | live *(the matrix restatement: "◐ selection + blocker attribution")* | `M08-28` |
| `CG-matrix.19` | excluded *(the matrix restatement of `CG-6`: post-sale monitoring / O&M — "✖ (D9)")* | M08 §5 · summarised at `01 §6` |

## Task 19 — `modules/M11-payments-and-collections.md`

Appended by Task 19. Requirement IDs use the prefix `M11-<nn>` (`M11-01`–`M11-56`); permission row
keys added to `foundations/F2-roles-and-permissions.md` §F2.5-M11 are named where they carry a
source key.

Six conventions used in this block:

1. **Shared dispositions are named as halves.** `S8.rule.tranches` and `S8.wrong.3` land here as
   the *money* halves (states, ledger, collect actions, the never-gate law as this module's own
   statement) while their board/project surfaces stay with `modules/M08` (`M08-35`–`M08-39`) and
   the customer-link lifecycle with `foundations/F5` (Task 20). `S8.wrong.7`'s tranche-revision
   half is here; the project's reference move is `M08-50`'s. `DOC01.byo-collections` closes the
   hold Task 11 recorded (`BM-02` carries the who-pays-whom half; the collections mechanics are
   here). `DOC04.tranche-templates` and `TC.payment-terms.1` land here as the money-path halves
   the template-management rows at `M01-54` route onward. `R2`'s `due_on_stage` mapping half,
   `R4`'s tenant-collections half and `R17`'s money-surface interim are the halves those rulings'
   earlier dispositions (Task 6 `F1-51`/`F1-35`, Task 18 `M08-06`/`M08-08`, Task 7 `F8-23`, Task
   16 `M06-06`) explicitly left open. Each pair is intentional, not a duplicate. **Pointer
   correction recorded, not edited:** Task 11's convention block and its `DOC01.byo-collections`
   row name "Task 22" for this hand-off; the module task is **Task 19** and the hold is closed
   here. No earlier block is rewritten (append-only discipline).
2. **Cited-but-not-disposed keys stay with their owners.** This module cites, as grounding only:
   `S8.rule.roles`, `S8.screen.1`, `S8.screen.2`, `S8.wrong.8` (`modules/M08`, Task 18);
   `S6B.step.7`, `S6B.wrong.3`, `DOC04.proposal-versions-immutable`, `D32` (`modules/M06`);
   `DOC08.matrix.record-payments` (Task 5, already split across `F2.M08.project-documents` +
   `F2.M11.record-payments`); `DOC08.credentials-last4`, `DOC09.credential-probe-nag`,
   `DOC04.tenant-settings` (`modules/M01`, Task 12); `DOC16.two-money-systems` (Task 11, `BM-02`
   — the tenant half is fulfilled here and the key is not re-disposed); `DOC04.link-lifecycle`,
   `DOC02.link-grant`, `C.lifecycle.7`, and the `C9` customer-rendering half (`foundations/F5`,
   Task 20); `DOC04.notification-types` (`foundations/F6`, Task 23); `R14`,
   `DOC06.server-owns-money` (`foundations/F4`, Task 10); `DOC07.ports-vendor-neutral` (Task 3);
   `DOC04.audit-log` (`foundations/F2`, Task 5); `R16` (Task 18/Task 5); `R12` (`modules/M06`);
   plus every `F1-*`/`F2-*`/`F3-*`/`F4-*`/`F7-*`/`F8-*`/`M01-*`/`M05-*`/`M06-*`/`M08-*`/`PS-*`
   requirement consumed by published ID.
3. **Author readings are disclosed in-row and are never cited as source truth.** Four rules in
   this module go beyond what the source states and say so where a reader meets them: `M11-12`
   (a tranche mapped to a skipped stage becomes due when the project passes that point — the
   inference is `M08-36`'s, reciprocated here as a *disclosed reading* with the alternative named,
   not carried as `SRC` text by either module); `M11-30` (a payment link whose amount no longer
   matches what is owed is superseded — applied from `F8-12`/`F8-24` where the source is silent on
   link lifecycle); `M11-23` (the disconnect consequence — the product never claims revocation
   power over an account it does not hold); and `M11-36`'s surplus-visibility clause. All four are
   listed in M11 §6 as recorded readings deliberately not raised as questions.
4. **Market neutrality.** No payment mode, rail vendor, currency symbol, tax scheme, regulator or
   market name appears in the module body — the sentinel grep (`upi|neft|cheque|gst|india|
   razorpay|₹`, word-bounded) returns nothing. Payment modes, rails, minor unit and display labels
   resolve to `F1-09`, `F1-18`, `F1-21`, `F1-22` (IN instance `F1-42`, `F1-43`, `F1-46`), and the
   licensing consequence of the never-touch-funds law is stated market-neutrally at `M11-01` with
   the market instance left to the pack. `R1`'s ban holds: no `quote`/`quotation`/`quoted`.
5. **The never-touch-funds law is stated as product law, not as background.** `M11-01` carries it
   as a requirement with `M11-03` (no cut) and `M11-04` (master-merchant split rejected) beside
   it, and §5 records both exclusions with the source's own revisit triggers. `CG-5` is therefore
   dispositioned **excluded** (the capability is skipped) while the law it produces is **live**.
6. **Open questions and `REC`.** **Q32** is mirrored, not re-raised: this module's interim
   (`M11-16`) is written to be word-for-word compatible with `modules/M08` §M08.6 so the two
   cannot drift, and `modules/M11` is named in the register row as an input. **Q7** is referenced
   as a dependency (rail-neutrality is written so the answer lands in a pack, not in a
   requirement) and is not re-opened. **No `REC` arose:** every plausible enhancement in this area
   — platform-held balances, split settlement, automated customer dunning, financing — is either
   excluded by the regulatory law or by an explicit ruling, so recommending one would contradict
   `M11-01`; `registers/enhancements.md` is untouched by this task and the absence is a decision.

| source key | disposition | PRD ref |
|---|---|---|
| `DOC16.byo-collections` | live *(the module's spine: own account, links minted on it, funds settling to the tenant's bank, confirmation attaching the receipt, and the load-bearing never-touch-funds line as product law)* | `M11-01` · `M11-17` · `M11-27` · `M11-41` · M11 §1 |
| `DOC01.byo-collections` | live *(shared — the collections mechanics half Task 11 held for this module; the who-pays-whom half is `BM-02`)* | `M11-01` · `M11-02` · `M11-17` |
| `DOC04.byo-credentials` | live *(product-level credential handling: encrypted, never logged, never in a customer-facing artefact, never client-side; the settings screen and its probe are `M01-60`'s)* | `M11-18` · `M11-22` · `M11-19` |
| `DOC07.payment-link-fallback` | live *(both clauses: missing/invalid credentials fall back to manual collection, and missed confirmations are healed by reconciliation on view plus a periodic sweep)* | `M11-19` · `M11-29` · `M11-31` |
| `DOC14.byo-payment-links` | live | `M11-17` · `M11-24` |
| `DOC16.manual-payment-modes` | live *(manual modes stand without an account; the link rail is an accelerator, never a dependency; tranche math stays on the one money path)* | `M11-21` · `M11-33` · `M11-08` |
| `DOC16.route-rejected` | excluded *(non-goal with the source's own revisit trigger — "only if a marketplace revenue model appears"; recorded as a documented alternate adapter and nothing more)* | `M11-04` · M11 §5 |
| `DOC04.tranches-money-path` | live *(the whole money path: one chain reconciling to the minor unit, Σpct = 100.00 per version, schedule-at-Won, stage-driven due-ness, and the state machine recomputed from payments with `waived` terminal)* | `M11-08` · `M11-09` · `M11-10` · `M11-11` · `M11-13` · `M11-49` |
| `DOC04.payments-append-only` | live *(the receipts ledger: mode validated against the market's list, reference and receipt file, append-only with reversal rows, never edited; rail confirmations insert here)* | `M11-34` · `M11-35` · `M11-40` · `M11-46` · `M11-47` |
| `DOC04.tranche-templates` | live *(shared — the money-path half: the percentages the schedule inherits and their 100.00 rule; the template-management surface is `M01-54`, Task 12)* | `M11-09` · `M11-13` |
| `TC.payment-terms.1` | live *(shared — the money-path half Task 12's row routes here; template management stays at `M01-54`)* | `M11-09` · `M11-13` |
| `S8.rule.tranches` | live *(shared — the money half: the schedule as the collection schedule, stage completion making a tranche due, the collect actions, and the cash-flow rationale; the project-side surfaces are `M08-35`/`M08-36`/`M08-38`)* | `M11-09` · `M11-11` · `M11-52` · `M11-53` |
| `S8.screen.3` | live *(the payments screen itself — schedule, mark received, copy the request message, record mode, attach receipt — the one place money is written, that every other surface links into)* | `M11-52` · `M11-33` · `M11-34` |
| `S8.wrong.3` | live *(shared — the money half: what is owed and since when, the chase prompt, and this module's own statement of "never block the customer's progress link over money"; the board/dashboard surfaces are `M08-39`'s and the link law binds `foundations/F5`)* | `M11-32` · `M11-53` |
| `S8.wrong.7` | live *(shared — the tranche-revision half: the schedule follows the version in force, receipts survive untouched, the original stays readable; the project's reference move is `M08-50`)* | `M11-14` |
| `C9` | live *(shared — the tenant-side half: the payment link on the due tranche and the instant receipt with its confirmation state; the customer-facing rendering, the named contact and the what-happens-next line are `foundations/F5`'s, Task 20. The source records no "goes wrong" items for `C9`)* | `M11-24` · `M11-41` · `M11-45` · `M11-55` |
| `UXG-12` | live *(shared — the payment-link handoff half: "Copy payment link" on the due tranche once an account is connected, and receipt state following the account's confirmation; the tenant-side question inbox stays with `foundations/F5`/`foundations/F6`)* | `M11-24` · `M11-27` · `M11-28` |
| `CG-5` | excluded *(SKIP-DELIBERATELY — no platform cut of customer payments, because it would make the platform a regulated money-mover; the **law** it produces is live at `M11-01`/`M11-03` and the alternate adapter is `M11-04`)* | `M11-03` · `M11-01` · M11 §5 |
| `CG-matrix.18` | live *(the matrix restatement of the capability line — tenant-owned payment links against tranches, with no platform cut)* | `M11-17` · `M11-24` · `M11-03` |
| `R4` | live *(shared — the tenant-customer-collections half, carried vendor-neutrally: per-tenant own-account payment links and "platform never touches tenant funds". The platform-billing half is `modules/M12`'s (Task 23), the IN rail + payment-data localisation half is `F1-43`'s, and the supplier-of-record blocker is register `Q7`)* | `M11-01` · `M11-05` · `M11-17` |
| `R2` | live *(shared — the tranche `due_on_stage` mapping half the ledger routes here; the canonical machine is `M08-08`, IN labels/skippable set `F1-51`/`F1-35`, link stage display `foundations/F5`, days-in-stage metrics `modules/M13`)* | `M11-11` · `M11-12` |
| `R17` | live *(shared — the money-surface interim half: same stages, no recurring invoicing, no meter ingestion, and therefore display-what-the-version-carries pending `Q32`; document type `M06-06`, post-Won stage behaviour `M08-06`, projection label `F8-23`)* | `M11-16` · `M11-15` · M11 §5 · `Q32` |
| `DOC05.bom-money-locked` | live *(shared — the money-path third that Task 15 and Task 16 both routed here: the locked BOM arithmetic reconciles through the proposal into the tranche schedule and the receipts against it, to the minor unit. The BOM invariants are `M05-70`'s and the proposal-money surface `M06-39`'s; neither is restated here)* | `M11-08` |
| `DOC11.money-stale-at-scale` | live *(shared — the money-path half Task 7's and Task 15's rows route here: a collections figure that cannot be reconciled at display time renders provisional rather than final. The law is `F8-17`/`F8-12` and the recompute surfaces are `modules/M05`'s)* | `M11-44` |

## Task 20 — `foundations/F5-customer-link.md`

Appended by Task 20. Requirement IDs use the prefix `F5-<nn>` (`F5-01`–`F5-83`); the two
permission row keys added to `foundations/F2-roles-and-permissions.md` §F2.5-F5
(`F2.F5.mint-customer-link`, `F2.F5.revoke-customer-link`) are named where they carry a source
key.

Six conventions used in this block:

1. **The customer-journey slice is disposed of in full, key by key.** All **54** rows of
   `_process/extraction/customer-journey.md` — `C.framing.1`–`8`, `C1`–`C13`, the 24 per-step
   wrong-items, and `C.lifecycle.1`–`9` — appear below exactly once. Steps where the customer
   touches no screen (`C1`–`C4`, `C6`, `C7`) land as **customer-facing obligations** in
   `foundations/F5` §F5.2 with the owning module named; they are `live` here because F5 states
   the obligation, not because F5 re-specifies the mechanism.
2. **Shared dispositions are named as halves.** `C9` was disposed by Task 19 as the *tenant-side*
   half (payment link on the due tranche, receipt with its confirmation state, `M11-24`/`M11-41`/
   `M11-45`/`M11-55`); it lands here as the **customer-facing** half — the three anxiety-reducers
   rendered, the named person, and the what-happens-next line. `R1`'s customer-link wording half
   (held open by Task 8's split and again by Task 16) closes here at `F5-41`. `R15`'s
   customer-facing referral ask closes here at `F5-72`; the CRM tag stays `M02-16`'s and the
   project-side ask `M08-47`'s, and the credits ledger stays excluded. `R2`'s **customer-link
   stage-display** half — named in the ruling's own consequence line — closes here at `F5-62`;
   the machine is `M08-08`'s, the labels `F1-22`'s and the tranche mapping `M11-11`'s. `R6` was
   disposed by Task 6 for its rail and currency-denomination halves (`F1-43`, `F1-07`); the
   **link lifecycle, naming, attribution and acceptance-challenge** halves close here. `UXG-12`
   was disposed by Task 19 for the payment-link handoff; the **question-inbox customer half**
   closes here. Each pair is intentional, not a duplicate.
3. **Cited-but-not-disposed keys stay with their owners.** This document cites, as grounding
   only: `D32`, `D34`, `D16`, `D22` and `S6.wrong.6` (`modules/M06`, Task 16); `D10`, `R3`,
   `R10` (`modules/M07`, Task 17); `R9`, `S2.rule.dedupe`, `S3.screen.4` (`modules/M02`, Task
   13); `D30`, `S4.wrong.5` (`modules/M04`, Task 14); `R16`, `S8.wrong.2`, `S8.wrong.3`,
   `S8.screen.8`, `DOC04.blockers`, `DOC04.document-checklist` (`modules/M08`, Task 18);
   `SC.10-7.18`, `SC.10-11.05` (`modules/M05`, Task 15); `R4`, `DOC16.byo-collections`,
   `DOC04.tranches-money-path` (`modules/M11`, Task 19); `R17`, `R18`, `R5`, `D9`
   (`foundations/F8` / `modules/M06` / `modules/M08`); `DOC16.softblock.*`,
   `DOC16.two-money-systems`, `DOC01.tier-table` (`04-business-model.md`, Task 11);
   `DOC08.matrix.send-proposals`, `DOC08.audit-coverage` (`foundations/F2`, Task 5);
   `DOC00.customer-journey-parallel`, `DOC00.customer-link-audience`, `DOC00.honesty-conviction`
   (Task 3's convention 1 — the `DOC00.*` family is disposed there in full and is not
   re-appended); `UXG-19`, `CG-4`, `OD-5`; plus every `F1-*`/`F2-*`/`F3-*`/`F7-*`/`F8-*`/`M02-*`/
   `M04-*`/`M05-*`/`M06-*`/`M07-*`/`M08-*`/`M11-*`/`BM-*`/`PS-*`/`OV-*` requirement consumed by
   published ID. *(Count corrected by Task 25 — the originally quoted "210 such references" was
   not reproducible. Measured at the gate by pattern-match over the published document:
   **331 references to 130 unique cross-document requirement IDs**, each unique ID re-verified
   to exist in its target document.)* `D16`'s customer half is stated as consumed law in
   `F5-35`'s own source tag; the register disposition stays `modules/M06`'s row (Task 16),
   which cites `F5-35`.
4. **Two source gaps are raised as register questions rather than filled.** `C4`/`C4.wrong.1`
   and `C8.wrong.1` both require an immediate customer message that `D32` gave this release no
   channel to send; F5 stated the honest interim in both places and raised **`Q33`**.
   *(Reconciled to owner ruling 2026-08-04 `Q33`, 2026-08-06: the first gap is **filled by the
   owner, not by this suite**. The immediate customer message these three source items require
   now **sends automatically from the tenant's connected official channel where one is
   connected** — proposal link, payment link and status updates, transactional/utility template
   class per pack rules — and is **composed for a person to send only where no channel is
   connected**, the one path on which no delivery is ever claimed. The honest interims stood
   only for the unconnected case and survive there. `F5-16`/`F5-28`/`F5-48` carry the reconciled
   shape; `D32`'s unscoped manual-only rule is retired. See `registers/conflicts.md` row 4. The
   second gap, `Q34`, is unaffected by this and was resolved on its own terms.)*
   `C5.wrong.2`/`C.lifecycle.9` name link expiry as a failure mode with no renewal path; F5
   states the honest expired page and raises **`Q34`**. Neither gap is resolved inside a
   requirement, and neither register row pre-empts the owner.
5. **One market value is deliberately absent.** `DOC08.link-named-otp` states a default
   acceptance threshold for the launch market. The threshold itself is `live` (`F5-44`, tenant
   configuration denominated per `F1-07`); **the amount is market data and this market-neutral
   document names no figure** (Global Constraint §6). Where the default should be declared — a
   market-pack key or a product default the tenant edits — is a placement question recorded in
   F5 §6 for the closure pass, not an owner ruling.
6. **Four earlier questions receive F5's input without being answered.** `Q27` (is the studio's
   3D share link an instance of this framework), `Q30` (does the calling floor bind manual
   dials), `Q25` (whose correction right is it) and `Q24` (survey-supersession reconciliation)
   each name `foundations/F5` as an input; their register rows now record what F5 states and why
   it pre-empts nothing. `Q21` is cited at `F5-51` because the customer-facing outcome is owed
   whichever close state the ruling assigns the reason to.

| source key | disposition | PRD ref |
|---|---|---|
| `C.framing.1` | live *(two archetypes served by one design; the source's value band is market data and stays in the pack per Global Constraint §6)* | `F5-03` · F5 §2 |
| `C.framing.2` | live *(the no-login law and the "one link" surface, read post-overlay: a manual messaging channel per `D32`, and one link **per named recipient** per `R6`. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** the messaging-channel clause is now two-branch — the link **is sent from the tenant's connected official channel where one exists**, with a delivery state on that branch, and is **composed for a person to send where none is connected**, the only branch claiming no delivery. The no-login law and the per-named-recipient rule are untouched by the ruling. See `registers/conflicts.md` row 4)* | `F5-01` · `F5-02` · `registers/conflicts.md` row 4 |
| `C.framing.3` | live *(the two acceptance themes — message timing and link truthfulness — made testable against every requirement in the document)* | `F5-04` · `F5-52` · F5 §1 |
| `C.framing.4` | live *("Trust is the actual product here" → every customer-visible number carries its honesty labels, with no tenant switch)* | `F5-05` |
| `C.framing.5` | live *(the whole-project surface-area budget as a law: one link per named recipient, zero logins, zero installs)* | `F5-02` · `F5-45` · F5 §2 |
| `C.framing.6` | live *(deciding moment 1 — speed of first callback, stated as a customer-facing obligation; the mechanism is `modules/M02`'s)* | `F5-06` · `F5-09` |
| `C.framing.7` | live *(deciding moment 2 — opened once, on a phone, in the evening: the mobile-first single-session design constraint)* | `F5-06` · `F5-07` · F5 §2 |
| `C.framing.8` | live *(deciding moment 3 — visible progress during the long wait decides the referral; ties §F5.9 to §F5.10)* | `F5-06` · `F5-61` · `F5-72` |
| `C1` | live *(shared — the customer-facing half: the callback and its speed as a product obligation; capture, dedupe and assignment are `modules/M02`'s)* | `F5-09` · `F5-10` |
| `C2` | live *(shared — the customer-facing half: consistent answers whoever speaks, and the four mandatory fields of a visit confirmation; the knowledge base is `modules/M07`'s and the composed message `M02-47`'s)* | `F5-12` · `F5-13` |
| `C3` | live *(shared — the customer-facing half: a promise with a date, and nobody leaving without saying what happens next; both survey modes are `modules/M04`'s)* | `F5-14` |
| `C4` | live *(the never-silent law. As authored: the **automatic** send the source describes had no channel in this release — honest interim stated in-row, gap raised at `Q33`. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** the source's automatic send now exists — where the tenant has a **connected official channel** the message **sends** from it automatically and a delivery state exists; where **no channel is connected** it is **composed for a person to send**, and only that branch keeps the honest interim and claims no delivery. `F5-16` carries both. See `registers/conflicts.md` row 4)* | `F5-16` · `Q33` (decision recorded 2026-08-04) · `registers/conflicts.md` row 4 |
| `C5` | live *(the proposal surface whole: the element list, the 3D roof moment, the honesty rule and its competitive rationale, and the two actions)* | `F5-32`–`F5-42` |
| `C6` | live *(the thinking window: the product answers rather than chases; the source records no wrong-items for this step and none is invented)* | `F5-17` · `F5-12` |
| `C7` | live *(shared — the customer-facing half: the four protections the shipped defaults buy; the queue, the gate and the config surfaces are `modules/M07`'s)* | `F5-18` · `F5-11` |
| `C8` | live *(the decision, all three outcomes: accept on the link only, same-day negotiation with no approval hop, and a recorded decline)* | `F5-43` · `F5-50` · `F5-51` |
| `C9` | live *(shared — the **customer-facing** half Task 19 held for this document: the three anxiety-reducers rendered, the named person, and the what-happens-next line; the tenant-side link and receipt mechanics are `M11-24`/`M11-41`/`M11-45`/`M11-55`. The source records no "goes wrong" items for this step)* | `F5-57` · `F5-58` · `F5-59` · `F5-55` |
| `C10` | live *(the long wait made visible and attributable: the same URL, done/current/waiting with dates, and the reason-and-duration line the source calls the highest-value line in the product)* | `F5-61`–`F5-67` |
| `C11` | live *(installation: who is coming, when, how long and what disturbance — the four facts, carried on the page as well as in the composed message)* | `F5-68` |
| `C12` | live *(commissioning and handover: the system on, the document pack, and the referral asked at the moment the customer decides)* | `F5-69` · `F5-70` · `F5-71` · `F5-72` |
| `C13` | excluded, with one live requirement *(monitoring, cleaning reminders, service and warranty claims are out of scope; the live half — the handover leaves the customer knowing exactly who to call — ships)* | `F5-73` · F5 §5 |
| `C1.wrong.1` | live *("Nobody calls back" — the unowned-enquiry escalation is `M02-50`'s; the customer-facing statement is F5's)* | `F5-09` · `F5-10` |
| `C1.wrong.2` | live *(open question — `Q30`: "they get called at 10pm" is enforced for automated dials and the source is silent on manual ones; an unruled gap, recorded not resolved, stated in-row. Disposition retyped from `conflict` by Task 25 — the legend reserves `conflict` for contradictions mirrored in `registers/conflicts.md`, and this is a gap awaiting a ruling, not a contradiction)* | `F5-11` · `Q30` · `registers/open-questions.md` |
| `C1.wrong.3` | live *("asked the same questions twice by two different reps")* | `F5-10` |
| `C1.wrong.4` | live *("called by three different people from the same company" — prevented by the duplicate check that runs on capture from every channel, `M02-07`)* | `F5-10` |
| `C2.wrong.1` | live *(a fumbled basic answer loses the deal before price — the customer must not be able to tell which channel they reached)* | `F5-12` |
| `C3.wrong.1` | live *("surveyor arrives late, or not at all" — the visit reschedules with exactly one reminder, `M02-48`)* | `F5-14` |
| `C3.wrong.2` | live *("nobody tells them what happens next" — the promise with a date is the answer)* | `F5-14` |
| `C3.wrong.3` | live *("a verbal price that the real proposal later contradicts" — no surveyor-side or call-side surface emits a customer-facing price)* | `F5-15` |
| `C4.wrong.1` | live *(the silence itself; as authored, the same `D32` send-channel limit as `C4`. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** the limit is retired on the connected branch — the message **sends from the tenant's connected official channel where one exists** and the silence this wrong-item names cannot occur there; **where no channel is connected** it is composed for a person, and only that branch claims no delivery. Same reconciliation as `C4`, same carrier `F5-16`. See `registers/conflicts.md` row 4)* | `F5-16` · `Q33` (decision recorded 2026-08-04) · `registers/conflicts.md` row 4 |
| `C5.wrong.1` | live *("the PDF is too large to open on a slow connection" — the web rendering is the path of record to every number)* | `F5-39` · `F5-07` |
| `C5.wrong.2` | live, with a recorded gap *("the link expires" — the honest expired page is specified; no renewal path exists in source, raised at `Q34`)* | `F5-25` · `Q34` |
| `C5.wrong.3` | live *("the numbers on the PDF and the link disagree" — one value set, `F8-24`)* | `F5-38` |
| `C5.wrong.4` | live *(the customer reads a different language than the sender — language follows the reader)* | `F5-08` |
| `C7.wrong.1` | live *("calling three times in a week" — capped attempts)* | `F5-18` |
| `C7.wrong.2` | live *("calling at dinner" — a statutory floor item, not a tenant default)* | `F5-11` · `F5-18` |
| `C7.wrong.3` | live *(not understanding the language used — per-customer language, agent set independent of the interface set per `F3-29`)* | `F5-18` |
| `C7.wrong.4` | live *(not letting them reach a human — an always-offered route to a person, and the customer's own request-a-call affordance)* | `F5-18` · `F5-54` |
| `C7.wrong.5` | live *(a discount question handled however the owner configured it, defaulting to offering a person)* | `F5-18` |
| `C7.wrong.6` | live *("they say stop and get called again" — opt-out is a statutory floor item, not a switchable default)* | `F5-11` |
| `C8.wrong.1` | live *(silence after Accept — the link's own confirmation state is the acknowledgement of record. As authored this row carried a recorded contradiction: the instant **message** the source also describes had no channel, `Q33`. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** the contradiction is settled — the instant message **sends from the tenant's connected official channel where one is connected**, with a delivery state there; **where none is connected** it is **composed for a person to send** and only that branch claims no delivery. `F5-48` carries both branches. See `registers/conflicts.md` row 4)* | `F5-48` · `Q33` (decision recorded 2026-08-04) · `registers/conflicts.md` row 4 |
| `C8.wrong.2` | live *("They should not wait two days for an answer" — no approval hop exists to make them)* | `F5-50` |
| `C8.wrong.3` | live *(not called for six months after saying no; which close state carries the reason is `Q21`, and the customer-facing outcome is owed either way)* | `F5-51` · `Q21` |
| `C10.wrong.1` | live *(silence rather than delay is what breaks the relationship — "a delay you explained is tolerable; a delay you hid is a complaint")* | `F5-65` · `F5-67` |
| `C10.wrong.2` | live *(the support-call loop the page exists to kill, including the reason-and-expected-duration line)* | `F5-67` · `F5-63` |
| `C.lifecycle.1` | live *(one link, its whole life; three phases, one object, advancing in place — "designing it as three separate things would be the mistake")* | `F5-19` · `F5-70` |
| `C.lifecycle.2` | live *(tokenised, never an account; the link is minted by the share act and by nothing else)* | `F5-01` · `F5-20` |
| `C.lifecycle.3` | live *(named per-contact links, superseding `D33`'s single-link form)* | `F5-26` |
| `C.lifecycle.4` | live *(the acceptance challenge above a tenant-set value threshold — "reading stays frictionless, only the commitment is verified" — and the challenge is not a credential)* | `F5-44` · `F5-45` · `F5-46` |
| `C.lifecycle.5` | live *(phase 1, the proposal surface and its element list)* | `F5-32` |
| `C.lifecycle.6` | live *(phase 2, the progress tracker on the same URL, with the canonical stage chain and pack labels)* | `F5-61` · `F5-62` |
| `C.lifecycle.7` | live *(phase 3, the document pack — and the money law that protects the link: "chase the person, do not punish the view")* | `F5-24` · `F5-60` · `F5-70` · `F5-74` |
| `C.lifecycle.8` | live *(the source key's rule kept visible: opens yes, delivery never; per-link open attribution added by `R6`. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** "delivery never" was `D32`'s unscoped rule and is retired. The shape is now two-branch — where the tenant has a **connected official channel** the link is sent from it and a **delivery state exists**; where **no channel is connected** it is composed for a person and **only that branch claims no delivery**. Open tracking and per-link open attribution are unchanged on both branches and remain the acceptance evidence. `F5-28` carries the reconciled wording — see `registers/conflicts.md` row 4)* | `F5-27` · `F5-28` · `registers/conflicts.md` row 4 |
| `C.lifecycle.9` | live *(open question — `Q34`: stated source gap — no time-to-live, renewal path or expired-link behaviour; the honest interim is specified at `F5-25` and the policy is raised as a register question. Disposition retyped from `conflict` by Task 25 — an unruled gap, not a `conflicts.md`-mirrored contradiction)* | `F5-25` · `Q34` · `registers/open-questions.md` |
| `D5` | live *(the founding law: no customer login, no portal account; the acceptance challenge is a per-accept verification, never a credential)* | `F5-01` · `F5-45` · F5 §5 |
| `D33` | superseded *(by `R6` as amended 2026-07-24 — per-contact labelled links, per-link open attribution and the acceptance challenge ship at launch; the accepted risk is closed, not deferred)* | `F5-26` · `F5-44` · `F5-46` |
| `R6` | live *(shared — the **link** halves Task 6 left open: named per-contact links, per-link open attribution, the acceptance challenge above a tenant-set threshold, and the full attribution record. The IN reference rail and the currency-denomination law are `F1-43`/`F1-07`; the tenant setting that holds the threshold is `modules/M01`'s)* | `F5-26` · `F5-27` · `F5-44` · `F5-46` · `F2.F5.mint-customer-link` |
| `R1` | live *(shared — the **customer-link wording** half held open by Task 8 and Task 16: the page and the customer-facing document say "Proposal" in the reader's language, in every language; vocabulary law `F3-11`, entity and document `M06-01`)* | `F5-41` |
| `R15` | live *(shared — the **customer-facing** referral ask on the handover page, promising no credit; the CRM tag is `M02-16`'s, the project-side ask `M08-47`'s, the credits ledger the spec-locked exclusion)* | `F5-72` · F5 §5 |
| `R2` | live *(shared — the **customer-link stage display** half named in the ruling's own consequence: the canonical chain rendered with the market pack's labels, skippable stages absent rather than permanently empty. The machine is `M08-08`, the labels `F1-22`/`F1-35`, the tranche mapping `M11-11`)* | `F5-62` |
| `UXG-11` | live *(named links + acceptance challenge — in scope, not deferred: the labelled per-contact link, its open attribution, the deal-side link manager and the customer-side challenge sheet, plus the two `foundations/F2` §F2.5-F5 rows)* | `F5-26` · `F5-27` · `F5-30` · `F5-44` · `F2.F5.mint-customer-link` · `F2.F5.revoke-customer-link` |
| `UXG-12` | live *(shared — the **customer-side** half Task 19 held for this document: the question affordance in every phase, its honest acknowledgement, the reply-by-call shape with the app never sending, and the customer's face of the payment handoff. The tenant-side payment-link action is `M11-24`/`M11-27`/`M11-28`; the notification type is `foundations/F6`'s)* | `F5-52` · `F5-53` · `F5-57` · `F5-58` |
| `DOC07.pdf-artifact` | live *(both clauses: the customer link always renders the proposal as web and the document is an artifact, never the only path to the number; render failure retries once then notifies)* | `F5-39` |
| `DOC08.link-token` | live *(the four product-level token properties — unguessable, scoped, expiring, revocable — plus the instant-death rule for a revoked or regenerated link)* | `F5-75` · `F5-76` |
| `DOC08.link-named-otp` | live *(named per-contact links and the acceptance challenge above a tenant-set threshold. **The default amount the row states is market data and is deliberately not restated here** — see convention 5 and F5 §6)* | `F5-26` · `F5-44` |
| `DOC08.link-scopes` | live *(the four scopes and the intersection rule — effective rights are the token's scopes ∩ the link's current phase; one link per deal migrating through the lifecycle)* | `F5-21` · `F5-19` |
| `DOC08.link-expiry` | live *(twelve months on view scopes; re-minting issues a fresh token and the old one survives to its own expiry unless regenerate-with-revoke is chosen)* | `F5-22` |
| `DOC08.accept-revalidates` | live *(Accept is never trusted from the token: latest-version, not-stale, deal-not-already-closed and challenge-satisfied are all re-checked server-side, and the acceptance record captures full attribution)* | `F5-47` · `F5-46` |
| `DOC08.open-tracking` | live *(all four clauses: opens as link + moment + device class, no network address on the open event, no customer data in any URL, and zero third-party scripts, fonts or analytics on the public pages — and there is no delivered state)* | `F5-29` · `F5-77` · `F5-28` |
| `DOC08.link-rate-limits` | live *(per-link view and respond ceilings and a global public-route ceiling with backoff, tuned so ordinary reading does not reach one and failing to an honest page when it does)* | `F5-78` · `F5-25` |
| `DOC08.link-never-billing-blocked` | live *(customer links stay live in every tenant billing state — view **and** respond; the soft-block matrix's always-on rows are `BM-32`/`BM-35`)* | `F5-23` · `F5-60` |
| `DOC02.link-grant` | live *(a scoped, expiring grant that is never a session and sits outside the role system; its grants include paying a tranche through the tenant's own instrument; every access is audit-logged)* | `F5-21` · `F5-58` · `F5-79` |
| `DOC04.link-lifecycle` | live *(one URL advancing in place through proposal → progress → handover; status active / revoked / expired; "never revoked over unpaid money")* | `F5-19` · `F5-22` · `F5-24` · `F5-76` |
| `DOC04.link-named-otp` | live *(a deal may carry several labelled per-contact links; the challenge threshold lives in tenant settings denominated in the tenant's currency; acceptance captures full attribution from day one)* | `F5-26` · `F5-44` · `F5-46` |
| `DOC04.link-events` | live *(the append-only event set — opened / section viewed / accepted / negotiate requested / declined, with section and duration — and the no-PII rule on URLs and logs)* | `F5-27` · `F5-29` |
| `DOC04.accepted-human-confirms` | live *(the customer's Accept notifies the tenant; a person still marks the deal won, and that act creates the project — cross-contracted with `M02-57` and `M08-02`)* | `F5-49` |
| `DOC05.share-links-replaced` | live *(the prototype-era local share viewer is replaced by tokenised, scoped, server-rendered customer links; no local-only share path survives anywhere)* | `F5-80` |
| `DOCFC.link-full-lifecycle` | live *(the link ships its full lifecycle plus label, contact attribution and acceptance challenge from the start — "named links now in scope, used at launch"; the A–F stage letters are the `C1`–`C13` framing above)* | `F5-80` · `F5-26` |
| `DOC14.named-links-otp` | live *(committed launch scope, closing the single-link acceptance risk at launch rather than later)* | `F5-26` · `F5-44` · `F5-80` |
| `DOC14.link-3g` | live *(the text-first rule on slow connections — link pages usable before any heavy asset arrives)* | `F5-07` · `F5-39` |
| `S8.screen.7` | live *(the customer progress link itself: same tokenised URL as the proposal, stages, what is waiting and why, expected dates)* | `F5-61` · `F5-19` · `F5-63` |
| `S8.rec.4` | live *("the highest-value screen in the stage" — most support calls are "what is the status?", "and one honest link answers them"; carried as the rationale of §F5.9)* | `F5-61` |
| `CG-18` | live *(DESIGN-FOR: tenant branding on customer documents and link pages is all-tiers already; full white-label — custom domain + unbranded customer surface — is an Enterprise option whose **routing is designed at this document** and built when the first Enterprise deal asks. Tier placement is `BM-15`'s; the branding law is `F7-07`'s)* | `F5-81` · `F5-82` · `F5-83` |
| `CG-reslink.17` | live *(the competitor-row restatement of the same Enterprise white-label content; no additional requirement — same rows)* | `F5-82` |

## Task 21 — `modules/M03-marketing.md`

Appended by Task 21. Requirement IDs use the prefix `M03-<nn>` (`M03-01`–`M03-58`); the six
permission row keys added to `foundations/F2-roles-and-permissions.md` §F2.5-M03
(`F2.M03.campaign-visibility`, `F2.M03.manage-campaigns`, `F2.M03.build-campaign-audience`,
`F2.M03.author-campaign-content`, `F2.M03.manage-channel-connections`,
`F2.M03.approve-campaign-spend`) are named where they carry a source key.

Seven conventions used in this block:

1. **This module's origin mix is inverted, and the register shows it.** M03 exists by owner brief,
   not by v1 source: **52 of its 58 rows are `BRIEF`**, **two** are `SRC` (`M03-25` inbound voice,
   `M03-29` `TC.lead-sources.1`) and four are `REC`. `M03-18` is `BRIEF`, not `SRC`: it **extends**
   `CG-14`'s business-messaging law to every channel, which is this module's pattern-extension and
   not the ledger's claim — the same move it makes at `M03-11`, `M03-19`, `M03-27`, `M03-46` and
   `M03-47`. `BRIEF` rows key to
   the on-disk attestation `_process/owner-brief-2026-08-03.md` §Marketing rather than to a Task-2
   ledger key, so this block itemises that attestation's clauses as `BRIEF§Marketing.*` rows below.
   **Those keys are not Task-2 ledger keys** — they are the brief's own sentence broken into its
   clauses so the closure pass can verify, clause by clause, that the brief is covered and that
   nothing beyond it entered as core scope. Every `REC` row is additionally mirrored in
   `registers/enhancements.md`.
2. **Two supersessions close here, as halves, and the register says which half.** `D13` and `D32`
   were disposed `live` by Tasks 13 and 16 for the surfaces they still govern (`M02-13`/`M02-17`;
   `M06-53`/`M06-54`/`M06-57`). Their **superseded halves** — the deferred capture channels and the
   campaign-lane sending capability — close here under design spec §2 `DD2`, as
   `registers/conflicts.md` rows 3 and 4 each require of "the owner of the superseding
   specification". Neither conflicts row is edited or re-resolved: both already name this module,
   and this block is the pointer they were waiting for. The same half-split applies to
   `S2.rule.channel.3`/`S2.rule.channel.4` (Task 13 disposed them `excluded` for `modules/M02`) and
   to `S2.notv1.2`/`S2.notv1.3` (Task 13's M02 §5 non-goals).
3. **The supersession was bounded, and the boundary was a register fact.** As authored: `D32`
   stayed `live` for every transactional composing surface — `modules/M06`'s share,
   `M02-33`/`M02-47`/`M02-48`, `modules/M08`'s handover pack and `foundations/F5`'s two
   held-open moments — and this module stated that at `M03-03`; no row in this block was to be
   read as dispositioning `Q33`, which asked whether those transactional moments ever gain a
   send channel, with `modules/M03` recorded as one of its inputs. *(Reconciled to owner ruling
   2026-08-04 `Q33`, 2026-08-06: **the boundary moved, by owner ruling and not by this block.**
   The transactional surfaces named above now **send from the tenant's connected official
   channel where one is connected** — the **same connection as this module's campaigns**, under
   the transactional/utility template class per pack rules and distinct from the marketing lane
   — and are **composed for a person only where no channel is connected**, the one path that
   claims no delivery. `D32`'s manual-only rule is retired; what survives of it is that fallback
   discipline. `M03-03` names the lane, and `docs/tasks/M03-marketing.md`'s `M03-03` entry carries
   its complete membership. See `registers/conflicts.md` row 4 and `registers/open-questions.md`
   `Q33`, which is decided, not open.)*
4. **Cited-but-not-disposed keys stay with their owners.** This document cites, as grounding only:
   `UXG-03` (Tasks 12/13 — `M01-58`, `M02-64`, `M02-65`; `M03-19` obeys its honesty rule and
   claims no disposition), `UXG-02`, `S2.wrong.3`, `S2.screen.2`, `R9`, `R8`/`UXG-05`,
   `DOC04.merge-tombstone` (`modules/M02`, Task 13); `D20`, `D27`, `DOC08.matrix.lead-visibility`
   (`foundations/F2`, Task 5); `D36`, `DOC07.compliance-gate` (`modules/M07`, Task 17);
   `AP.honesty.1`/`D37`, `AP.wrong.3`, `DOC10.n-rules` N1 (`foundations/F8` / `foundations/F7`);
   `DOC10.templates-are-data`, `DOC10.i18n-fallback` (`foundations/F3`, Task 8);
   `DOC08.open-tracking`, `DOC08.link-token`, `CG-18` (`foundations/F5`, Task 20);
   `DOC01.metered-bundles`, `DOC01.cap-soft-block`, `DOC16.softblock.*` (`04-business-model.md`,
   Task 11); `UXG-01`, `R14`, `F1-57` (cited as patterns); `DOC00.nongoal-lead-channels` and
   `DOC00.nongoal-whatsapp-send` (Task 3's convention 1 — the `DOC00.*` family is disposed there in
   full and is **not** re-appended; both rows already name this module); plus every
   `F1-*`/`F2-*`/`F3-*`/`F4-*`/`F5-*`/`F7-*`/`F8-*`/`M01-*`/`M02-*`/`M07-*`/`BM-*`/`PS-*`
   requirement consumed by published ID.
5. **Three questions are raised and none is resolved inside a requirement.** `Q35` (what identity a
   capture with no phone number keys on — the brief's channels against the source's phone-as-identity
   model), `Q36` (where marketing-messaging consent lives in the market pack, given that `F1-58`'s
   IN record set is voice-shaped) and `Q37` (how far a campaign audience may reach, given the
   Marketing preset's *Own captures until triage* cell). Each carries the conservative reading in
   its requirement (`M03-33`, `M03-34`/`M03-46`, `M03-10`) and defers the choice. Six existing
   questions are cited and left untouched: `Q33`, `Q22`, `Q15`, `Q10`, `Q1`, `Q6`.
6. **No market rule and no figure is written here.** Every compliance duty resolves to
   `pack.calling-rules` (`F1-15`, `F1-12`; IN instance `F1-38`) and every bundle size, rate and
   price to the market book (`BM-21`, `BM-41`, `F1-61`) — whose V2 marketing slots are empty
   pending `Q1`, which `M03-52` renders honestly rather than defaulting. Vendor names appear only
   as the identity a channel *is*; the embedded-signup mechanics `CG-14` names as the reference
   implementation stay out of the product text (design spec §6, §14).
7. **One reconciliation is flagged for the closure pass, and no earlier document is edited to get
   it.** `M03-31` gives this module's captures five source badges — website form · business
   messaging · email · SMS · social lead form — which **extends** the lead-source set `M02-13`
   calls *"closed"* (manual quick add · file import · inbound call · referral). The extension is
   licensed by `M02-17`, which already promises that whatever `modules/M03` lands "arrives in this
   module's inbox, carries **its own source badge**, and passes through this module's dedupe sheet
   unchanged" — so the two rows are consistent in substance and only the word "closed" now reads
   narrower than the suite is. **No `modules/M02` edit is made here** (`D13` still closes the *v1*
   set, which is what `M02-13` was written to state). The closure pass should reconcile `M02-13`'s
   wording — most cheaply by scoping the adjective, e.g. "the **v1** lead-source set is closed" —
   so a reader meeting `M03-31` first is not left holding two true sentences that sound opposed.

| source key | disposition | PRD ID(s) or register |
|---|---|---|
| `D13` | **superseded** *(shared — the **deferred-channels** half, closing `registers/conflicts.md` row 3: website forms and inbound business-messaging enter core scope here as `BRIEF` under design spec §2 `DD2`. The v1 source-set half stays `live` with `modules/M02` (`M02-13`, `M02-17`, Task 13), which specifies none of these channels; the inbound-voice source it names stays `live` and is cited below)* | `M03-01` · `M03-21` · `M03-24` · `registers/conflicts.md` row 3 |
| `D32` | **superseded** *(shared — the **campaign-lane sending** half, closing `registers/conflicts.md` row 4: the product sends marketing messages from tenant-owned channel identities, with the delivery-state semantics that follow. as authored, `D32` stayed `live` for every transactional composing surface (`modules/M06` Task 16; `M02-33`/`M02-47`/`M02-48`; `modules/M08`; `foundations/F5`) — the boundary being convention 3 and `M03-03`, with `Q33` not answered. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** `Q33` is answered and the remaining half of `D32` is superseded too — the **transactional lane sends** from the tenant's connected official channel where one is connected, over the **same connection** this row's campaign half describes, under the transactional/utility template class per pack rules; where **no channel is connected** the message is **composed for a person to send**, and only that fallback claims no delivery. `D32`'s manual-only rule is retired in full, surviving solely as that fallback's no-delivery-claim discipline)* | `M03-02` · `M03-03` · `M03-04` · `M03-21` · `registers/conflicts.md` row 4 |
| `S2.rule.channel.3` | **superseded** *(the `modules/M03` half of Task 13's exclusion — inbound business messaging is a live channel here, tenant-connected and tenant-owned; the M02 half stays `excluded` at `M02-17`/`M02-65`)* | `M03-21` · `M03-01` |
| `S2.rule.channel.4` | **superseded** *(same half-split — the website form is a live capture channel here; the M02 half stays `excluded`)* | `M03-24` · `M03-01` |
| `S2.notv1.2` | **superseded** *(the `modules/M03` half — "no marketing automation" was a v1 non-goal and campaign management is brief scope under `DD2`; M02 §5 keeps the non-goal for itself, correctly, and this module holds nothing that nurtures or sequences either — the sequenced form is the `REC` at `M03-16`)* | `M03-08` · M03 §M03.2 · `registers/enhancements.md` (`M03-16`) |
| `S2.notv1.3` | **superseded in part** *(the `modules/M03` half — a capture carries the **one** campaign that produced it, which is the attribution this module lands; **multi-touch attribution stays excluded**, here as in M02, and campaign impact is correlation-framed rather than modelled)* | `M03-31` · `M03-56` · M03 §5 |
| `CG-14` | live *(shared — the **business-messaging** half is consumed as written at `M03-21`: the tenant connects its own business number and owns its reputation. `M03-18` **cites the verdict as a pattern, not as its source** — generalising "tenant owns the number and reputation" to **every** channel is this module's `BRIEF` extension and is tagged as such, so no `SRC` claim is made about channels the verdict never addressed; the named reference implementation stays out of the product text. The v1 `D32`/manual-copy-behind-a-port half is `modules/M06`'s (`M06-53`, Task 16) and the link half `foundations/F5`'s (Task 20))* | `M03-21` · `M03-18` (pattern-cited) |
| `TC.lead-sources.1` | live *(shared — the **third** half: "which channels are live" answered for this module's channels on the channel-health surface. The settings surface and its honesty rule are `M01-58`'s (Task 12); the v1 channel set, `D13` policy and toggle semantics are `M02-64`'s (Task 13); this row is the marketing-channel instance, with the allowance and registration columns as this module's addition)* | `M03-29` · `M03-19` |
| `BRIEF§Marketing.integrated-module` | live *(attestation clause: "Design an integrated marketing module" — the module's existence, its scope laws and its boundary against `modules/M02`)* | `M03-07` · M03 §1 · `modules/M03-marketing.md` (whole) |
| `BRIEF§Marketing.channels` | live *(attestation clause: "lead generation and engagement across channels such as Email, WhatsApp, Facebook, Instagram, SMS" — each named channel is a requirement; the website form arrives with the `D13` supersession and inbound voice stays `SRC`)* | `M03-20` · `M03-21` · `M03-22` · `M03-23` · `M03-24` |
| `BRIEF§Marketing.campaigns` | live *(attestation clause: "The platform should manage marketing campaigns" — the campaign object, its state set, audience, schedule and editing law)* | `M03-08` · `M03-09` · `M03-10` · `M03-11` · `M03-12` · `M03-13` · `M03-14` |
| `BRIEF§Marketing.capture` | live *(attestation clause: "capture leads" — capture on every channel, its consent record, its honest failure log, and the identity gap it exposes)* | `M03-30` · `M03-33` · `M03-34` · `M03-36` · register `Q35` |
| `BRIEF§Marketing.into-pipeline` | live *(attestation clause: "feed them into the sales pipeline" — the reciprocal of `M02-17`: M02's inbox, M02's dedupe sheet, M02's source badge, unassigned on arrival)* | `M03-07` · `M03-30` · `M03-31` · `M03-32` |
| `BRIEF§Marketing.voice-remains` | live *(attestation clause: "Existing voice AI follow-up capabilities from the source documentation should remain part of the product" — honored by leaving it entirely where the source put it: `modules/M07`. This module references it as a channel surface and restates nothing)* | `M03-25` · `M03-05` |
| `BRIEF§Marketing.no-invented-ai` | live *(attestation clause: "Do not invent AI features beyond what is supported or clearly proposed; identify additional ideas separately as recommendations" — carried as a law of the module, with the four ideas it would otherwise have produced tagged `REC` and mirrored)* | `M03-05` · `M03-16` · `M03-17` · `M03-37` · `M03-43` · `registers/enhancements.md` |
| `BM-21` *(consumed, not disposed — `04-business-model.md` Task 11 owns it)* | live *(the marketing-sends meter's campaign-side surface: projected burn before commit, exhaustion behaviour under the cap and soft-block laws, the paid-social boundary, and the empty-book-slot state)* | `M03-44` · `M03-45` · `M03-51` · `M03-52` |
| `F8-30` *(consumed, not disposed — `foundations/F8` Task 7 owns it)* | live *(the correlation law applied to campaign impact, with the caveat rendered beside the number per `F8-31` and travelling into exports and `modules/M13`)* | `M03-53` · `M03-54` · `M03-57` · `M03-58` |

## Task 22 — `modules/M09-field-workforce.md`

Appended by Task 22. Requirement IDs use the prefix `M09-<nn>` (`M09-01`–`M09-71` — extended
2026-08-15 by owner ruling `Q64`, which added the new row `M09-71`; `M09-20` and `M09-36` remain
deleted and their ids are not reused); the seven
permission row keys added to `foundations/F2-roles-and-permissions.md` §F2.5-M09
(`F2.M09.field-visibility`, `F2.M09.check-in-out`, `F2.M09.mark-attendance`,
`F2.M09.attendance-visibility`, `F2.M09.toggle-tracked-seat`, `F2.M09.manage-geofences`,
`F2.M09.view-live-location`) are named where they carry a key.

Nine conventions used in this block:

1. **This module's origin mix is the most inverted in the suite, and the register shows it.** M09
   exists by owner brief, not by v1 source. **Recounted 2026-08-15** against the live document
   after owner ruling `Q64`: **64 of its 69 rows are `BRIEF`**, **four** are `REC` (`M09-25`,
   `M09-33`, `M09-34`, `M09-63`, each mirrored in `registers/enhancements.md`), and **one is
   `SRC`** — the new row `M09-71`, which restores the law of the deleted `M09-36` and takes its
   `SRC` tag through `F8-36` (see conventions 2 and 6). The v1 corpus therefore reaches this
   module once more, through `F8-36`'s lineage rather than through any v1 rule of the module's
   own. The 2026-08-07 recount after `Q61` read **64 of 68 / none `SRC` / four `REC`** — correct
   on that date, the module's then-single `SRC` row `M09-20` having been deleted in the offline
   sweep — and the figures before it read 65 of 70 / one `SRC` / four `REC`; both are superseded
   by this recount. `BRIEF` rows key to the on-disk attestation
   `_process/owner-brief-2026-08-03.md` §Field-workforce rather than to a Task-2 ledger key, so this
   block itemises that attestation's clauses as `BRIEF§Field-workforce.*` rows below — **the brief's
   ten named capabilities, one row each**, plus its four instructions (study-not-replicate, no fleet
   surplus, recommend-additional, distinguish-origins). **Those keys are not Task-2 ledger keys**;
   they are the brief's own sentence broken into its clauses so the closure pass can verify, clause
   by clause, that all ten capabilities are specified and that nothing beyond them entered as core
   scope.
2. **Amended 2026-08-07 — the one `SRC` row is gone, and with it the only place the v1 corpus
   ruled on this module.** *(Further amended 2026-08-15: an `SRC` row exists again — the **new**
   `M09-71`, added by owner ruling `Q64` and tagged through `F8-36`, per convention 1's recount.
   `M09-20` is still gone and everything below about it stands unchanged.)* As written, this
   convention said that `R14`'s offline-full list named
   *"activity/visit logging"*, that `foundations/F4` published it at `F4-08` row 4, and that
   `M09-20` consumed that row while restating none of the boundary (`F4-13`). **All three of
   those rows are deleted.** `R14` is superseded by owner ruling `Q61`, `F4-08` and `F4-13` went
   with the offline capability, and `M09-20` — the check-in's offline behaviour — was deleted in
   the same sweep. What survives is the concurrency half, still consumed by published ID and
   still restated nowhere: `F4-17` (visit status forward-only), consumed at **`M09-31`** ("status
   never regresses; a write that would move it backwards is refused (`F4-17`)", with `M09-26`
   citing the same row for the visit-object split), and `F4-19` (capture time is display and audit
   only), consumed at **`M09-19`** (the check-in's "when"), and also at `M09-37` and `M09-54`.
   *(Corrected 2026-08-07: this convention named `M09-19` and `M09-24`. **`M09-24` consumes
   neither** — its `SRC` names `F8-01`/`F8-34`, `F2-22` and `M09-44`, and its subject is the
   never-invented check-out time, not conflict policy.)* **`R14` itself is still not
   re-dispositioned here** — Task 10 disposed of it and re-dispositioned it as `superseded` on its **boundary half only**, keeping the surviving concurrency and honest-refusal half live at `F8-36`, `M05-09`, `M05-67` and `M02-36` — and, from 2026-08-15, at `M02-66`, `M02-67` and this module's `M09-71` — and
   `foundations/F4-data-integrity.md` owns what is left. The deletion of `M09-20` is **not** one
   of the recorded holes `Q62`–`Q66` and is untouched by the 2026-08-15 rulings: check-in and
   check-out remain fully specified as online
   acts at `M09-18`, `M09-19`, `M09-21`–`M09-24`.
3. **`DD7` is carried verbatim, and the design-spec keys below are spec clauses, not ledger keys.**
   `M09-02` and `M09-03` quote `DD7`'s two lists without paraphrase and `M09-04` quotes its billing
   sentence; the commercial half is `04-business-model.md`'s (`BM-22`, `BM-23`, `BM-24`, Task 11) and
   is **consumed by published ID, never restated** — no price, bundle size, overage rate or
   month-fraction rule appears anywhere in `modules/M09`.
4. **`DD7` is silent on three of the brief's ten capabilities, and the silence is recorded rather
   than resolved.** Attendance, team visibility and the activity **timeline** appear in neither of
   `DD7`'s lists (the bundle says "activity *playback*"; the brief says "Activity *timeline*").
   `M09-05` states the conservative adopted reading in-row — the bundle list is closed and
   `DD5`/`BM-05` forbid gating features by tier, so the unplaced capabilities are included for
   everyone, and playback is distinguished from timeline because only playback needs the location
   stream — and refers the placement to register **`Q38`**. The reading is the one that cannot
   silently create a charge. Nothing in this block may be read as having decided `Q38`.
5. **Cited-but-not-disposed keys stay with their owners.** This document cites, as grounding only:
   `R16` (the crew-login ruling — **three halves already disposed**: the persona half at Task 4
   (`PS-27`, `PS-28`), the preset half at Task 5 (`F2-05`–`F2-07`) and the checklist-behaviour half
   at Task 18 (`M08-41`–`M08-43`, `M08-45` — enumerated around the gap: `M08-44`, which made
   checklist ticks offline-capable and queued, was deleted 2026-08-07 by owner ruling `Q61`, and
   a tick is now an ordinary server write that fails fast and honestly per `F8-36`); `modules/M09`
   adds **no fourth half** — it inherits `R16`'s
   constraint through `F2-06` as a surface law on the Installation Team Member's field surfaces and
   claims no disposition); `R14` (Task 10, `foundations/F4`); `D20`, `D27`, `D28`
   (`foundations/F2`, Task 5, consumed through `F2-12`–`F2-15`); `S4.rule.offline`, `S4.wrong.6`,
   `S4.wrong.7`, `S4.wrong.8`, `S4.wrong.9`, `S4.screen.6`, `S4.screen.10` (`modules/M04`, Task 14 —
   the surveyor's day and its offline law); `S1.rec.1` (Task 4 — role decides the home screen);
   `S3.wrong.7` (`modules/M02`, Task 13 — the no-show reminder, cited by the `M09-34` `REC`);
   `DOC04.payments-append-only` (`modules/M11`, Task 19 — cited as the append-not-overwrite pattern
   at `M09-38`); `CG-6` (`modules/M08`, Task 18 — cited in §5's no-monitoring non-goal);
   `DOC04.visits` (`modules/M04`, Task 14); plus every
   `F1-*`/`F2-*`/`F3-*`/`F4-*`/`F7-*`/`F8-*`/`M02-*`/`M04-*`/`M08-*`/`M11-*`/`BM-*`/`PS-*`
   requirement consumed by published ID. **The `PS-*` family is Task 4's in full and is not
   re-appended:** `PS-22`/`PS-23` (Field Technician — `PS-24` was deleted 2026-08-07 with the
   offline capability; the persona's live rows are the two above, and `02-personas.md` §Handoffs
   still names `PS-22`–`PS-23` as this module's), `PS-25`–`PS-28` (Installation Team Member),
   `PS-13`/`PS-14` (Survey Engineer), `PS-20`/`PS-21` (Project Manager), `PS-33`/`PS-34`
   (Operations) and `PS-05` (one composed home) are consumed as published requirements and none is
   re-dispositioned.
6. **Superseded 2026-08-07 by owner ruling `Q61`, and one of the two statements left a hole.** As
   written, this convention said that `M09-36` (attendance day start/end) and `M09-52` (geofence
   events) stated the **online-first** reading, named `F4-13` as the reason a module may not
   decide otherwise, and cited register `Q15`. **There is no ruled set left to extend by nothing:**
   `F4-13` is deleted, `Q15` is stamped SUPERSEDED 2026-08-07 by `Q61`, and the whole product is
   online. `M09-52` survives with its substance intact — a crossing is evaluated and recorded
   server-side and the prompt it raises is never a dependency of the core workflow (the geofence
   paragraph that stated the offline side was removed from §M09.7, the row was not). **`M09-36`
   was deleted, and that was a recorded hole — since closed by the owner, not here.** `M09-36`
   stated that marking a day start or a day end
   reaches the server to complete, showing as waiting and never as recorded until the server has
   it; the sweep left no live row carrying it — `M09-35` governs who marks it, `M09-37` what a
   check-in may
   propose, `M09-38` correction-by-append, `M09-39` absence — and it stood OPEN as
   `registers/open-questions.md` **`Q64`**, blocking `SCR-M09-02` (which carried an
   `attendance-waiting` state and a dated UNRESOLVED note) as the most consequential of the
   holes, since an optimistic local tick was unforbidden in the one area where a lost or
   fabricated record is read as a judgement about a person and drives payroll. **The owner RULED
   on `Q64` on 2026-08-15** and the law is live again as the **new** row **`M09-71`** (§M09.5):
   a day start or a day end is recorded only once the server has it, shown **pending, never as
   recorded**, with no optimistic tick and no local clock time presented as a record fact, and a
   failure said plainly with the mark not lost from the screen — an instance of `F8-36`, live P0.
   **`M09-36` itself stays deleted**, is not re-instated, and its id is not reused; `M09-71`
   names the row it restores in its own `SRC` cell. **No row in this
   block dispositions `Q64`** — the owner closed it — and the deletion record above stands
   exactly as written. `Q15`'s surviving consequence, now unconditional rather than a no-signal
   edge case, is that an attendance day-start and the tracking window it opens happen when the
   server has them.
7. **One cross-document reading is reconciled, and no earlier document is edited to get it.**
   `F4-17`'s shared note assigns *"the visit object and its states"* to `modules/M09`, while
   `M02-46` creates a visit that *"`modules/M04-survey.md` owns from that moment"* and `M04-38`
   builds the surveyor's day on it. `M09-26` states the reading that makes both true — they are
   different objects, and every survey visit is a field stop while not every field stop is a survey
   visit — discloses it in-row per design spec §3.5, and **edits neither `foundations/F4` nor
   `modules/M04`**. If the closure pass prefers the reconciliation to be visible from the other
   side, the cheapest fix is one clause on `F4-17`'s shared note; it is recorded here rather than
   applied, since neither published row is false as written.
8. **Two authorities are distinguished, because they are different documents.** Design spec §11
   carries this module's **scope** (the ten capabilities, the `BRIEF`/`REC` tagging rule, the
   no-fleet-surplus instruction, "Pricing per DD7") and `DD7` carries the **seat boundary**. The
   **four privacy laws** — tracking only during work hours · owner-toggled per employee ·
   employee-visible tracking state · per-market privacy compliance via `pack.data-rights` — and the
   **geofencing phrasing** ("auto check-in prompts, site radius per project site") are authored in
   `_process/2026-08-03-v2-prd-authoring-plan.md` §Task 22 Step 2, **which the owner approved before
   execution**. Their `BRIEF` tag class is therefore correct and unchanged; only the pointer differs,
   and every row carrying one now names the plan (`PLAN.T22.privacy-*` below, and the tag cells of
   `M09-10`, `M09-11`, `M09-13`, `M09-14`, `M09-23`, `M09-42`, `M09-44`, `M09-49`, `M09-51`,
   `M09-64`–`M09-67`). Where §11 genuinely carries the text — `M09-01`, `M09-06`, `M09-07`,
   `M09-08`, `M09-35`, `M09-39`, `M09-40` and `SPEC11.M09.scope` — it remains the cited source.
9. **No market rule and no figure is written here.** Every privacy duty resolves to
   `pack.data-rights` (`F1-23`, `F1-24`, and the new-market gate `F1-05`), every unit and format to
   `pack.formats` (`F1-21`) through `foundations/F3`'s single rendering implementation, and every
   price to the market book (`BM-22`, `BM-41`, `F1-25`, `F1-61`) — whose per-tracked-seat slot is
   empty pending `Q1`, which `M09-16` renders honestly rather than defaulting. No vendor, map
   provider, positioning technology or studied product is named as a requirement anywhere in the
   module body; the studied product appears only inside the brief's own quoted sentence.

| source key | disposition | PRD ID(s) or register |
|---|---|---|
| `BRIEF§Field-workforce.study-not-replicate` | live *(attestation clause: "Study products like TrackoBit. We do NOT want to replicate TrackoBit" — carried as the capability-level reading law: what is taken is the question each capability answers, never a surface)* | `M09-01` · `M09-06` · M09 §1 |
| `BRIEF§Field-workforce.live-location` | live *(capability 1 of 10 — per-seat per `DD7`; work-hours-bounded, gap-honest, last-known rather than false-current)* | `M09-42` · `M09-43` · `M09-45` · `M09-46` · `M09-48` |
| `BRIEF§Field-workforce.attendance` | live *(capability 2 of 10 — day start/end, correction-by-append, absence never inferred, shared with `modules/M10`. **One of its rows was deleted and has since been restored under a new id:** `M09-36` — a day mark reaches the server to complete and never reads as recorded until it has — was deleted 2026-08-07 with the offline sweep, leaving no live row; it stood OPEN as `registers/open-questions.md` `Q64`, blocking `SCR-M09-02`, until the **owner RULED on `Q64` on 2026-08-15** and the law came back as the **new** row `M09-71` (§M09.5, tagged `SRC`, an instance of `F8-36`). `M09-36` stays deleted and its id is not reused. The "online-first" framing of convention 6 is superseded with `Q15` and the whole product is online. The other six rows carry who marks it, what a check-in may propose, correction-by-append and absence-never-inferred, unchanged)* | `M09-35` · `M09-37` · `M09-38` · `M09-39` · `M09-40` · `M09-41` · `M09-71` (added 2026-08-15 — the new row restoring the deleted `M09-36`) · `registers/open-questions.md` `Q64` (RULED 2026-08-15 — restored as `M09-71`; `M09-36` stays deleted), `Q15` (SUPERSEDED 2026-08-07 by `Q61`) · register `Q38` |
| `BRIEF§Field-workforce.visit-tracking` | live *(capability 3 of 10 — included per `DD7`; planned vs actual as facts, the `modules/M02`/`M04`/`M08` reciprocals, outcomes, unplanned stops)* | `M09-26` · `M09-27` · `M09-28` · `M09-29` · `M09-30` · `M09-31` · `M09-32` |
| `BRIEF§Field-workforce.route-timeline` | live *(capability 4 of 10 — per-seat per `DD7`; the ordered day with travel between stops and every gap shown as a gap)* | `M09-43` · `M09-45` · `M09-48` |
| `BRIEF§Field-workforce.site-check-in` | live *(capability 5 of 10 — included per `DD7`; no-fix honesty; `measured` provenance. The "offline-capable per convention 2" clause is void: `M09-20`, the row that carried the check-in's offline behaviour, was deleted 2026-08-07 by owner ruling `Q61`, and check-in is now an ordinary online act. The capability itself is unaffected — the five surviving rows carry who may check in on which tier, the four facts recorded, the unknown-position honesty and the accuracy-carrying `measured` provenance)* | `M09-18` · `M09-19` · `M09-21` · `M09-22` · `M09-23` |
| `BRIEF§Field-workforce.site-check-out` | live *(capability 6 of 10 — included per `DD7`; elapsed time from the two capture times; an open check-in is never closed with an invented time. `M09-20` is dropped from the ref — deleted 2026-08-07 with the offline capability; nothing the capability needs went with it)* | `M09-19` · `M09-24` · `registers/enhancements.md` (`M09-25`) |
| `BRIEF§Field-workforce.geofencing` | live *(capability 7 of 10 — per-seat per `DD7`; anchored to places other modules own, prompts and never acts. **The "online-first per convention 6" clause is void, and the row is corrected 2026-08-07 to match its sibling `BRIEF§Field-workforce.attendance`:** convention 6 of this same block was itself superseded by owner ruling `Q61` and no longer draws an online-first distinction — there is none left to draw, the whole product being online — and `Q15` is stamped SUPERSEDED 2026-08-07 by `Q61`. **The capability is unaffected and no hole opens here:** `M09-52` survives with its substance intact — a crossing is evaluated and recorded server-side, and the prompt it raises is never a dependency of the core workflow; the geofence paragraph in §M09.7 that stated the offline side was removed, the row was not. The six rows carry the anchor, the prompt-never-act law, the crossing record and the employee's own view, unchanged)* | `M09-23` · `M09-49` · `M09-50` · `M09-51` · `M09-52` · `M09-53` · `registers/open-questions.md` `Q15` (SUPERSEDED 2026-08-07 by `Q61`) |
| `BRIEF§Field-workforce.activity-timeline` | live *(capability 8 of 10 — included under the adopted reading of `M09-05`; append-only, three-way distinction between an act, an observed event and an unrecorded interval)* | `M09-54` · `M09-56` · `M09-57` · `M09-58` · register `Q38` |
| `BRIEF§Field-workforce.daily-movement` | live *(capability 9 of 10 — per-seat per `DD7` ("movement history, activity playback"); the map replay with its gaps present, computing no speeds, distances or dwell scores)* | `M09-55` · `M09-45` · `M09-09` |
| `BRIEF§Field-workforce.team-visibility` | live *(capability 10 of 10 — included under the adopted reading of `M09-05`; resolved in `F2-14`'s field-work domain with no cross-domain widening; untracked people render honestly)* | `M09-59` · `M09-60` · `M09-61` · `M09-62` · register `Q38` |
| `BRIEF§Field-workforce.no-fleet-surplus` | live *(attestation clause: "Do NOT copy unnecessary fleet-management features" — carried as the exclusion law and discharged by seven individually named non-goals: vehicle records, fuel, vehicle maintenance, driver-behaviour scoring and telematics, trip/route economics, vehicle hardware, consignment/dispatch)* | `M09-06` · M09 §5 |
| `BRIEF§Field-workforce.recommend-additional` | live *(attestation clause: "Recommend additional field features if valuable" — four recommendations made, each tagged `REC`, each with its conditions, all mirrored)* | `M09-25` · `M09-33` · `M09-34` · `M09-63` · `registers/enhancements.md` |
| `BRIEF§Field-workforce.distinguish-origins` | live *(attestation clause: "Clearly distinguish: Source-derived features, Recommended enhancements" — made structural. **Counts recomputed 2026-08-15 against the live document: 64 `BRIEF`, 4 `REC`, 1 `SRC` across 69 rows** (the 2026-08-07 recount read 64 / 4 / **0** across 68; before it, 65 `BRIEF` / one `SRC` / four `REC` across 70). The v1-era `SRC` row `M09-20` was deleted with the offline capability and stays deleted; the module's one `SRC` row today is the **new** `M09-71`, added 2026-08-15 by owner ruling `Q64` to restore the law of the deleted `M09-36`, so the clause's three-way distinction is live again rather than reduced to `BRIEF` versus `REC`. The module's status line reads `BRIEF`-dominant and stays correct — its **No `SRC` rows** clause was amended to **One `SRC` row** (`M09-71`) on 2026-08-15, the same day, so the module and this row now agree)* | `M09-01` · `M09-07` · `modules/M09-field-workforce.md` status line · the four `REC` rows `M09-25`, `M09-33`, `M09-34`, `M09-63` · the one `SRC` row `M09-71` |
| `DD7.included` | live *(design-spec clause, not a ledger key — "Included in every tier: site check-in/out and visit logging (part of the core visit workflow)", carried without paraphrase; the commercial half is `BM-23`'s)* | `M09-02` · `M09-18` · `M09-26` · `F2.M09.check-in-out` |
| `DD7.bundle` | live *(design-spec clause — "Per-seat bundle covers live location, route timeline, geofencing, movement history, activity playback", carried without paraphrase as a **closed** list; the commercial half is `BM-22`'s)* | `M09-03` · `M09-42` · `M09-49` · `M09-55` · `F2.M09.view-live-location` |
| `DD7.owner-toggle` | live *(design-spec clause — "Owner toggles tracking per employee; billed as tracked-seat-months in the usage ledger"; this module owns the toggle as a product surface and none of the accounting, which stays `modules/M12`'s)* | `M09-04` · `M09-10` · `M09-11` · `M09-12` · `M09-14` · `M09-15` · `M09-65` · `F2.M09.toggle-tracked-seat` |
| `DD7.market-price` | live *(design-spec clause — "per-seat price set per market book"; the launch market's slot is empty pending `Q1` and the module states that rather than defaulting)* | `M09-16` · register `Q1` |
| `DD7.unplaced` | live *(**a spec silence, recorded not resolved, and deliberately **not** dispositioned `conflict`: `DD7`'s two lists simply do not place three of the brief's ten capabilities (attendance, team visibility, and activity **timeline** against the bundle's "activity playback"). No two source documents contradict each other, so `registers/conflicts.md` gains no row and none is referenced. `M09-05` carries the conservative adopted reading — disclosed in-row per design spec §3.5 — and the placement decision is referred to the owner at register `Q38`)* | `M09-05` · register `Q38` |
| `PLAN.T22.privacy-work-hours` | live *(field-workforce law 1, verbatim — "tracking only during work hours" — carried as a testable requirement and enforced at the collection and window rows. **Pointer stated precisely:** the four privacy laws are authored in `_process/2026-08-03-v2-prd-authoring-plan.md` §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope, which is owner-approved; §11 carries M09's *scope* and does not itself contain these sentences, so this key names the plan)* | `M09-64` · `M09-42` · `M09-44` · register `Q39` |
| `PLAN.T22.privacy-owner-toggled` | live *(law 2, verbatim — "owner-toggled per employee"; nothing else in the product turns tracking on, and there is no tenant-wide pre-answer. Same pointer note as the row above; `DD7`'s own "Owner toggles tracking per employee" is the design-spec half and is cited separately at `DD7.owner-toggle`)* | `M09-65` · `M09-10` · `M09-11` |
| `PLAN.T22.privacy-employee-visible` | live *(law 3, verbatim — "employee-visible tracking state" — plus this module's own stated extension: the tracked person can read their **own** record without a grant, tagged as the module's extension rather than as the plan's words. Same pointer note as the two rows above)* | `M09-66` · `M09-13` |
| `PLAN.T22.privacy-per-market` | live *(law 4, verbatim — "per-market privacy compliance via pack.data-rights" — carried as the determination's contents, the packs-are-floors rule, the new-market gate's consequence for tracking, and the export/erasure rights reaching location history. Same pointer note as the three rows above)* | `M09-67` · `M09-68` · `M09-69` · register `Q40` |
| `SPEC11.M09.scope` | live *(**this key alone genuinely names design spec §11** — its M09 paragraph as a whole — "TrackoBit-informed but EPC-filtered… Each capability tagged `BRIEF`; anything I add beyond that list is `REC`. No fleet-management surplus… Pricing per DD7")* | `M09-01` · `M09-06` · `M09-07` · `modules/M09-field-workforce.md` (whole) |
| `R14` *(cited, not disposed — `foundations/F4` Task 10 owns it, which marks its boundary half superseded and its concurrency/honest-refusal half live)* | superseded *(re-stated 2026-08-07. As written, this row said the offline-full clause "activity/visit logging" reached the module through `F4-08` row 4, that `M09-20` consumed it, that the boundary was restated nowhere (`F4-13`), and that attendance and geofence events sat outside the ruled set as online-first. **Owner ruling `Q61` removed the boundary and every row named here.** `F4-08`, `F4-13` and `M09-20` are deleted, `Q15` is SUPERSEDED, and there is no ruled set for anything to be inside or outside of. `M09-36` is deleted; its law stood OPEN as `Q64` until the **owner ruled on 2026-08-15**, restoring it as the **new** row `M09-71` (`M09-36` itself stays deleted and its id is not reused). `M09-52` is the only original ref that survives, and it survives on its own merits — a crossing is evaluated and recorded server-side and the prompt is never what the workflow depends on — not as a position relative to a boundary. `R14` is still not disposed of here; Task 10 owns it, marks its boundary half superseded, and now names `M09-71` among the live carriers of its surviving honest-refusal half)* | `registers/open-questions.md` `Q61` · `M09-52` (the one surviving original ref, no longer boundary-relative) · `Q64` (RULED 2026-08-15 — the deleted `M09-36`'s law restored as the new `M09-71`) · `M09-71` |
| `BM-22` *(consumed, not disposed — `04-business-model.md` Task 11 owns it)* | live *(the tracked-seat meter's product surface: the closed bundle, the owner toggle as a billing switch, the per-person confirmation, and ingestion covered by the seat with no second meter)* | `M09-03` · `M09-04` · `M09-12` · `M09-15` · `M09-47` |
| `BM-23` *(consumed, not disposed — Task 11)* | live *(the included boundary's product surface: check-in, check-out and visit logging on every tier for every employee, never gated by plan, entitlement or billing state)* | `M09-02` · `M09-17` · `M09-18` · `M09-26` |
| `BM-24` *(consumed, not disposed — Task 11)* | live *(the absorbed-cost law applied: no usage counter, allowance or overage for location appears on any surface in this module)* | `M09-47` |
| `F2-14` *(consumed, not disposed — `foundations/F2` Task 5 owns it)* | live *(the **field work** visibility domain and its Own ⊂ Team ⊂ All ladder, with `F2-14`'s own worked example honored unchanged: the Sales Manager holds no field cell, and the compensating route is that visit facts ride the lead's scope)* | `M09-60` · `M09-28` · `F2.M09.field-visibility` |
| `F1-24` *(consumed, not disposed — `foundations/F1` Task 6 owns it)* | live *(the two product-law data rights reaching field and location records: read + export always work in every billing state; erasure is anonymisation with the market's statutory carve-outs)* | `M09-57` · `M09-69` · `M09-17` |
| `F8-02` *(consumed, not disposed — `foundations/F8` Task 7 owns it)* | live *(the closed tier set applied to positions: a satellite fix taken where the person is standing satisfies `measured` — "(on site)" — literally, which the module notes as an alignment rather than stretching the definition; accuracy renders beside the value per `F8-07`)* | `M09-22` · `M09-46` |

## Task 23 — M10 (`docs/prd/modules/M10-hr-lite.md`)

Conventions for this block:

1. **The module is `BRIEF`-origin with two `SRC` reaches.** Only two source rules reach M10 as
   requirements — `DOC08.deactivate-never-delete` (through `F2-20`, per Task 5's disposition
   note "referenced by M01/M10 at their authoring; they do not re-append") and the
   data-rights pair (`F1-23`/`F1-24`, Task 6's). Everything else is owner-brief scope
   (`_process/owner-brief-2026-08-03.md` §HR) shaped by design spec §11 and the owner-approved
   authoring plan; the tag mix is stated on the module's status line.
2. **The provenance-pointer convention is Task 22's (its convention 8), applied again.**
   Design spec §11 carries M10's *scope sentence* ("people records, roles/teams wiring into
   F2, attendance/leave surfaces shared with M09, onboarding of employees = invite-by-phone
   flow") and is cited where that text genuinely governs (`SPEC11.M10.scope`). The
   **offboard definition** — "offboard = access revocation + reassignment of open work —
   source wrong-items from S1" — and the **per-employee document-storage clause**
   ("contracts/certs") are authored in `_process/2026-08-03-v2-prd-authoring-plan.md`
   §Task 23 Step 1 (owner-approved plan, 2026-08-03), not in §11; rows carrying them name the
   plan (`PLAN.T23.*` below), and `M10-18` states the pointer in-row.
3. **S1/S0 stage keys are M01's and are not re-disposed.** Task 12 disposed `S0.screen.4`,
   `S1.screen.1`–`S1.screen.5`, `S1.happy` and `S1.wrong.1`–`S1.wrong.4` to `modules/M01`;
   M10 consumes them through M01's requirement IDs (`M01-12`–`M01-21`) and through the
   persona rows (`PS-29`/`PS-30`) that already carry them. Consumed-not-disposed rows below
   record the reliance without moving ownership.
4. **The shared attendance surface is reciprocated, not restated.** `M09-40` (Task 22) states
   the hand-off from the field side; `M10-23`–`M10-30` are the HR side, relying on
   `M09-39` (absence never inferred), `M09-38` (correction-by-append) and `M09-41`
   (attendance-only HR boundary) as published. No M09 key is re-appended.
5. **Team structure closes a presupposition rather than a ledger key.** Every **Team**
   visibility cell since Task 5 presupposed a membership definition; `M10-31`–`M10-34` supply
   it as data under F2's unchanged law (`D20` stays disposed at `F2-12`; consumed row below).
6. **No enterprise-HR surplus, verified:** no payroll/compensation field, no recruitment, no
   performance review or people-score, no shift patterns (input recorded on register `Q39`),
   no org chart beyond the flat mapping, no leave accrual, no document workflow — each a
   stated non-goal with rationale in M10 §5, none arguable enough to be a `REC`
   (`registers/enhancements.md` unchanged by this sub-unit).

| source key | disposition | PRD ID(s) or register |
|---|---|---|
| `BRIEF§HR.attestation` | live *(the module's governing law, verbatim — "lightweight HR module suitable for SMEs… only features that support EPC operations… avoid enterprise HR complexity unless justified" — carried as the scope law and discharged by the §5 exclusion list)* | `M10-01` · `M10-02` · M10 §5 |
| `SPEC11.M10.scope` | live *(design spec §11's M10 paragraph as a whole — the closed area list, the F2 wiring, the M09 shared surface, invite-by-phone onboarding, the no-enterprise-complexity instruction)* | `M10-02` · `M10-03` · `M10-04` · `M10-13` · `M10-23` · `M10-31` · `modules/M10-hr-lite.md` (whole) |
| `PLAN.T23.offboard` | live *(plan-authored definition, verbatim — "offboard = access revocation + reassignment of open work — source wrong-items from S1"; authored in `_process/2026-08-03-v2-prd-authoring-plan.md` §Task 23 Step 1, owner-approved; §11 does not contain the sentence — pointer stated in-row per Task 22 convention 8)* | `M10-18` · `M10-19` · `M10-20` · `M10-21` · `M10-22` |
| `PLAN.T23.employee-documents` | live *(plan-authored clause — "document storage per employee (contracts/certs)"; same pointer convention as the row above)* | `M10-35` · `M10-36` · `M10-37` · `M10-38` · `M10-39` |
| `PLAN.T23.team-structure` | live *(plan-authored clause — "team structure (manager mapping used by D20 visibility)"; same pointer convention; the D20 law itself stays `F2-12`'s)* | `M10-31` · `M10-32` · `M10-33` · `M10-34` · `F2.M10.manage-team-structure` |
| `PS-29` *(consumed, not disposed — `02-personas.md` Task 4 owns it)* | live *(the HR/Admin persona's job description is this module's scope; its S1/S0 groundings reach M10 through it)* | `M10-01` · `M10-06` · `M10-17` · M10 §2 |
| `PS-30` *(consumed, not disposed — Task 4)* | live *(the people-today home — invites pending/expired, joiners mid-onboarding, attendance exceptions, leave awaiting decision, documents needing attention; composition into the role home is `modules/M13`'s)* | `M10-14` · `M10-15` · `M10-16` · `M10-26` · `M10-36` |
| `S1.wrong.1` / `S1.wrong.2` / `S1.wrong.3` / `S1.wrong.4` *(consumed, not disposed — `modules/M01` Task 12 owns them)* | live *(the invite-expired resend, wrong-recipient decline, nothing-assigned empty state and graceful removal reach M10 as queue states and as the offboard's person-side guarantee, through `M01-19`'s edge list)* | `M10-14` · `M10-15` · `M10-16` · `M10-18` |
| `DOC08.deactivate-never-delete` *(consumed, not disposed — `foundations/F2` Task 5 owns it; its note names M10)* | live *(deactivation hides and revokes, never removes: the register keeps deactivated people, history stays attributed, the offboard sweep reassigns open work only)* | `M10-10` · `M10-18` · `M10-19` · `M10-20` |
| `F2-19` / `F2-20` / `F2-17` / `F2-22` *(consumed, not disposed — Task 5)* | live *(guard rails, deactivate-never-delete, mid-task grace and audit reach the offboard flow and the mapping act as published laws)* | `M10-18` · `M10-20` · `M10-21` · `M10-33` |
| `F2-14` / `F2-15` *(consumed, not disposed — Task 5)* | live *(the people-records domain and the no-exceptions law: records/documents/leave resolve in their own domain; own-record reads are own-scope by construction, not exceptions)* | `M10-05` · `M10-09` · `M10-39` · `F2.M10.people-records` |
| `M09-38` / `M09-39` / `M09-40` / `M09-41` *(module reciprocals, not ledger keys — `modules/M09` Task 22)* | live *(the shared attendance surface's field half, relied on as published: correction-by-append, absence never inferred, the hand-off, the attendance-only HR boundary)* | `M10-23` · `M10-24` · `M10-26` · `M10-30` |
| `F1-23` / `F1-24` *(consumed, not disposed — `foundations/F1` Task 6 owns them)* | live *(employee PII rides the market's data-rights determination: export always works, erasure is anonymisation with statutory carve-outs — no second privacy regime)* | `M10-12` · M10 §M10.7 edge cases |
| `BM-20` / `BM-32` *(consumed, not disposed — `04-business-model.md` Task 11 owns them)* | live *(employee documents live in tenant storage under the storage meter and the soft-block law; reads/exports never pause)* | `M10-37` |
| `S8.rule.v1-boundary` *(consumed, not disposed — `modules/M08` Task 18 owns it)* | live *(the crew-rostering exclusion extends naturally: M10 ships no rostering or scheduling engine)* | M10 §5 |

## Task 23 — M12 (`docs/prd/modules/M12-platform-billing.md`)

Conventions for this block:

1. **This block closes the suite's largest set of owed halves.** Blocks 7 (F8), 10 (F4), 11
   (04-business-model), 12 (M01), 15 (M05), 16 (M06), 17 (M07), 18 (M08) and 19 (M11) each
   routed a billing half to "modules/M12, Task 23"; every such key is re-appended below with
   its M12 half named. Where the other half was already disposed (e.g. `F8-33`, `BM-32`), the
   earlier row stands unchanged and the row below carries only the mechanics half. **Amended
   2026-08-07:** the F4 halves this block was paired against were re-dispositioned by owner
   ruling `Q61`. `F4-33` and `F4-34` are deleted, and in both cases **the surviving substance is
   the M12 half named below**, not the F4 one — Task 10 now routes `DOC16.offline-drain-never-blocked`
   to `M12-26` and `DOC06.entitlement-grace` to `M12-27`/`M12-22`/`M12-24`. The pairing survives
   with M12 carrying it alone.
2. **`04-business-model.md` is consumed, never re-defined** (`DOC16.pricing-single-source`,
   `BM-09`): every number, tier name, state name and matrix row reaches M12 by ID. BM rows
   appear below only as consumed-not-disposed entries.
3. **Vendor neutrality:** Razorpay appears exactly once in the module (M12-03), as reference
   implementation, per Global Constraint §6; the IN rails stay `F1-40`/`F1-41`'s.
4. **The three open questions touching billing are stated as interims, not resolved:** `Q16`
   (no capture cut-off assumption — M12-27), `Q28` (no studio gating beyond design-kW —
   M12-20), `Q29` (no proposal-type entitlement key — M12-20). No row below hardens any of
   them.
5. **The deferred-era billing section is dead and recorded dead:** `BILL.1` and `D38` remain
   `superseded` with their M12 halves now landed (the enforcement side of the kept
   pre-commitment at M12-28); nothing in the struck text survives as scope.

| source key | disposition | PRD ID(s) or register |
|---|---|---|
| `DOC16.two-money-systems` | live *(shared — the platform half lands here; the collections half is `M11-01`/`M11-02`, Task 19; the 04 posture `BM-02`)* | `M12-01` |
| `DOC16.pricing-single-source` | live *(shared — the **consumption half**: the one-definition-per-fact discipline enforced as M12's consumption law. The **definition half** is `BM-09` in the Task 11 block, where `04-business-model.md` is named the single source; the split is deliberate and the two rows are not a duplicate)* | `M12-02` |
| `DOC16.lifecycle-states` | live *(the six-state machine, transitions verbatim; names fixed at `BM-33`)* | `M12-04` |
| `DOC04.subscription-states` | live *(one non-terminal subscription per tenant; charge as grant trigger; mandate types per market `F1-41`; cancel-at-period-end)* | `M12-04` · `M12-09` · `M12-50` |
| `DOC16.entitled-buffer` | live | `M12-05` |
| `DOC16.past-due-grace` | live *(7-day two-phase grace; core selling to day 7)* | `M12-06` |
| `DOC16.trial-expired-terminal` | live | `M12-07` |
| `DOC16.reactivation` | live *(always available; new gateway subscription; never resume; data intact)* | `M12-08` |
| `DOC16.entitlement-truth` | live *(successful charge as source of truth; no event regression; reconcile-by-poll with alerts)* | `M12-09` |
| `DOC16.hosted-checkout` | live *(platform never sees instruments; IN residency facts `F1-43`)* | `M12-10` |
| `DOC16.mandate-routes` | live *(shared — the M12 enforcement half; IN rails `F1-40`, Task 6)* | `M12-11` |
| `DOC16.mandate-ladder` | live *(shared — same split; pre-debit notices referenced, never built)* | `M12-11` |
| `DOC01.mandate-at-conversion` | live *(shared — the gateway-mechanics half; the conversion-not-signup law `BM-29`, Task 11)* | `M12-11` · `M12-54` |
| `DOC01.yearly-payment-rail` | live *(shared — the rail-mechanics half; cadence posture `BM-13`, IN facts `F1-40`)* | `M12-11` |
| `DOC16.plan-objects` | live *(two gateway plan objects per tier; our tables own entitlements, the gateway's own money; cycle switch = upgrade mechanics)* | `M12-12` · `M12-03` |
| `DOC16.pause-resume-not-offered` | live | `M12-13` |
| `D11` | live *(shared — the billing half lands here per Task 12's routing: signup carries no billing step, billing first appears as the trial state; the census's post-strike "no trial gate anywhere" text is dead, overlay wins. Signup half `M01-01`/`M01-11`)* | `M12-14` |
| `S0.notv1.1` | superseded *(the billing-surfaces half now landed: the D38-era deferral text is dead — superseded by owner directive 4 (`OD-4`, docs/15 §4) via the `D38` supersession; the surviving signup-shaped fact is `M01-11`'s; the billing surfaces the overlay adds are §M12.9/§M12.10)* | `M12-14` · `M12-53` · `M12-55` |
| `D26` | superseded *(by owner directive 4 via D38's chain — "mock billing screens" exist nowhere; the real suite is `UXG-13`'s, landed at M12-55)* | `M12-55` |
| `DOC16.no-feature-flags` / `OD-8` / `DOC00.nongoal-feature-flags` | live *(shared — the enforcement home lands here: entitlements as the only runtime gating; the principle statements are `00-README`/`OV-27`'s, Task 3)* | `M12-15` · M12 §5 |
| `DOC04.entitlements-current` | live *(recompute on charge/plan change; plan/trial/manual_grant; hot-path query; no hostage mechanism)* | `M12-16` |
| `DOC04.plans-bundles` | live *(trial days + bundles on the plan; ceilings in the plan definition; seats reserved, always unlimited)* | `M12-17` |
| `DOC07.metering-entitlement-order` | live *(check before action; metering never blocks)* | `M12-18` |
| `DOC16.goodwill-credits` | live *(audited entitlement-override records)* | `M12-19` · `M12-52` (the trial extension) |
| `DOC05.no-kw-clamp` | live *(ceilings are billing entitlements at product boundaries, never engine clamps)* | `M12-20` |
| `DOC16.gate.state-guard` | live *(every mutation gated; typed error + banner + reactivate)* | `M12-21` |
| `DOC16.soft-block-never-hard` | live *(shared — the error/banner mechanics half; the law `BM-32`, Task 11)* | `M12-21` |
| `DOC16.softblock.always-on` | live *(shared — enforcement half re-appended per Task 11's routing; product-law rows `BM-32`/`BM-35`)* | `M12-22` · `M12-55` |
| `DOC16.softblock.core-gated` | live *(shared — same split)* | `M12-22` |
| `DOC16.softblock.metered-pause` | live *(shared — same split)* | `M12-22` |
| `DOC16.softblock.invites` | live *(shared — same split)* | `M12-22` · enforcement table row |
| `DOC16.gate.design-kw` | live *(shared — the gate, ceiling and upgrade prompt land here; enforcement placement `M05-12`, Task 15)* | `M12-23` (table row 1) |
| `DOC16.gate.proposal-count` | live *(shared — gate mechanics, banner and grace here; placement half `M06-26`, Task 16)* | `M12-23` (table row 2) · `M12-30` |
| `DOC16.gate.active-projects` | live *(shared — gate mechanics, denial and upgrade prompt here; the active-definition and never-strand law `M08-07`, Task 18)* | `M12-23` (table row 3) |
| `DOC16.gate.voice` | live *(shared — gate mechanics here; the M07 surface half `M07-37`/`M07-50`, Task 17)* | `M12-23` (table row 4) |
| `DOC16.gate.ai-detection` | live *(server-side pre-call check; manual outline always available — `M04-23`'s surface)* | `M12-23` (table row 5) |
| `DOC16.gate.storage` | live *(upload issuance only, ceiling × 1.1 headroom; reads/exports never)* | `M12-23` (table row 6) |
| `DOC16.never-gated` | live *(the closed list, incl. engineer sign-off on already-submitted designs as a safety workflow and **the upload of photographs already captured in the field** — `M12-24`'s own wording. **Amended 2026-08-07 (owner ruling `Q61`):** this row read "offline drain". There is no drain: the generic queue is gone with the capability, and the one thing that still uploads from a device is the photograph carve-out (`M12-26`, `F4-21`, `M04-55`). The list's other members — reads, search, exports, customer links, billing screens — are untouched)* | `M12-24` |
| `DOC16.halted-inbound-degrade` | live *(shared — the billing-state half; the degradation surface `M07-50`, Task 17)* | `M12-25` |
| `DOC16.offline-drain-never-blocked` | live *(shared — the enforcement half re-appended per Task 10's routing. **The F4 half `F4-33` was deleted 2026-08-07 by owner ruling `Q61`, so M12 now carries the key alone**, and Task 10 routes it here: `M12-26` is the surviving instance — a photograph already captured in the field always uploads, in every billing state; no gate may inspect, delay or refuse that upload. The generic queue-drain half is moot, there being no queue but the photograph queue (`M04-55`). `M12-24` reinforces it by naming that upload in the never-gated list)* | `M12-26` · `M12-24` |
| `DOC06.entitlement-grace` | live *(shared — the enforcement half re-appended per Task 10's routing. **The offline half `F4-34` was deleted 2026-08-07 by owner ruling `Q61`, so M12 now carries the key alone**, and `Q16` is PARTLY SUPERSEDED the same day: the surviving half is that field capture is never cut off by elapsed time, works through the full dunning grace and pauses only at `halted`, with a mid-visit halt letting the current visit complete — `M12-27`, unchanged, consistent with `BM-36`. The half that dies is the mechanism: no cached entitlement, no 72-hour device grace, no state the device learns on reconnect, no queue to drain. `Q16` is **closed, not open**; the always-on read/export/customer-link set is `M12-22`/`M12-24`)* | `M12-27` · `M12-22` · `M12-24` · register `Q16` (PARTLY SUPERSEDED 2026-08-07 by `Q61`) |
| `BILL.2` | live *(shared — the enforcement half of the pre-committed law lands here; the law half `BM-32`, Task 11)* | `M12-28` |
| `BILL.1` | superseded *(the M12 half now landed: nothing in the struck deferred-era section survives as scope; its screens exist only as `UXG-13`'s real suite)* | `M12-28` · `M12-55` · overlay chain `OD-4`/`D38` |
| `D38` | superseded *(by owner directive 4 — `OD-4`, docs/15 §4, product-owner override 2026-07-24; the M12 lifecycle-mechanics half now landed; the kept pre-commitment is enforced at M12-28; the business-model half was Task 11's `BM-03`/`BM-32`)* | `M12-28` · §M12.2 (whole) |
| `OD-4` | live *(shared — the mechanics half lands here: usage metering surfaces §M12.5, trial-state UX §M12.9; the business-model half `BM-03`, Task 11)* | `M12-52` · `M12-53` · `M12-32`–`M12-38` |
| `UD-5` | live *(trial-only, no free tier — confirmed as the machine's shape: `trialing` is the only non-paying state and no free state exists; per Task 11's convention the key confirms `OD-4`/`R4` rather than adding law)* | `M12-04` · `M12-52` |
| `DOC01.trial-soft-block` | live *(shared — the enforcement half; the law `BM-30`, Task 11)* | `M12-28` · `M12-53` |
| `DOC01.cap-soft-block` | live *(shared — the per-gate enforcement half; the law with the 80% pre-warning `BM-34`, Task 11)* | `M12-30` · `M12-23` |
| `DOC16.usage-ledger` | live *(shared — the ledger-is-the-bill mechanics; the usage-figure honesty law is `F8-33`'s, Task 7)* | `M12-32` |
| `DOC04.usage-ledger` | live *(billable + non-billable metrics, provenance, idempotency, reproducible rollups, costs never customer-facing)* | `M12-32` · `M12-37` |
| `DOC16.metering-rules` | live *(per-meter rules verbatim; V2 meters added per `BM-21`/`BM-22`)* | `M12-33` |
| `DOC16.usage-honesty` | live *(shared — the gate-mechanics half re-appended per Task 7's routing: same-query screen, period + provenance label, the 80% pre-warning as a gate-side obligation; the honesty law `F8-33`)* | `M12-34` |
| `DOC16.overage` | live *(published-rate add-ons on the next invoice; accruing display in tenant currency/grouping)* | `M12-35` |
| `UXG-15` | live *(the usage screen — owner-only, informational, ledger deep links)* | `M12-36` · `F2.M12.view-usage-and-invoices` |
| `R5` | live *(shared — the per-tenant-metering half of the proxied services lands here, as platform cost lines with quotas, never tenant bills; energy/label halves `M05-17`/`F8-08`, imagery half `M04-09`)* | `M12-37` |
| `AP.screen.3` | live *(shared — the M12 half: the usage view reads the real ledger, caps are entitlement data, the struck "no plan cap" clause appears nowhere; screen halves `M07-59` and M13)* | `M12-38` |
| `DOC16.dunning-ladder` | live *(the seven-rung ladder verbatim, incl. day-4 exact-pause copy and day-7 what-still-works confirmation)* | `M12-39` · `M12-31` |
| `DOC16.dunning-channels` | live *(pack channel stack; platform→tenant messaging is ours — D32 constrains tenant→customer only; banner audience owner + managers)* | `M12-40` · `M12-56` |
| `DOC16.dunning-honesty` | live *(shared — the copy/ladder half; the honest-state law `F8-34`, Task 7)* | `M12-41` |
| `DOC16.trial-nudges` | live | `M12-42` |
| `DOC02.trigger-schedule` | live *(shared — the M12 timers: trial-expiry sweep to soft-block, 6 h reconciliation; the M07-visible timers were Task 17's)* | `M12-43` · `M12-09` |
| `DOC16.gst-invoice` | live *(shared — the invoice-mechanics half re-appended per Task 6's routing; the IN scheme facts `F1-28`/`F1-29`)* | `M12-44` |
| `DOC04.invoices` | live *(scheme-generic breakdown, scheme-tagged extras, statuses, PDF attached)* | `M12-44` |
| `DOC01.supplier-of-record` | live *(shared — the invoice-generation half; the posture `BM-40`, Task 11)* | `M12-45` |
| `DOC16.gst-supplier-of-record` | live *(shared — the invoicing-mechanics half; posture `BM-40`, IN scheme `F1-29`)* | `M12-44` · `M12-45` |
| `DOC16.invoices-exportable` | live | `M12-46` |
| `DOC16.refunds` | live *(first-cycle-only 7-day money-back; refund-to-source; scheme credit note; renewals none)* | `M12-47` |
| `DOC16.upgrade` | live *(immediate entitlements; prorated one-time invoice; swap at boundary)* | `M12-48` |
| `DOC16.downgrade` | live *(next-cycle effect; honest blocked-preview before confirm; over-ceiling designs readable/exportable forever)* | `M12-49` |
| `DOC16.cancellation` | live *(owner-initiated; reason as signal; runs to period end; reactivation offered)* | `M12-50` |
| `DOC16.trial-no-conversion` | live | `M12-51` |
| `DOC16.trial` | live *(in-app trial model; gateway subscription at conversion; caps as book data; one support extension)* | `M12-52` · `M12-54` |
| `UXG-14` | live *(trial lifecycle + soft-block states: subtle countdown to D-7, expiry → plan pick, no hostage patterns)* | `M12-53` |
| `UXG-13` | live *(the real billing suite: plan selection, mandate setup, current plan, invoices, dunning — the D26-era mock superseded)* | `M12-55` |
| `R4` | live *(shared — the M12 half: provider-neutral billing capability with the launch-market reference implementation named once; the collections half `M11-05`, IN rail facts `F1-40`)* | `M12-03` |
| `DOC16.billing-in-v1` *(consumed, not disposed — `04-business-model.md` Task 11 owns it at `BM-03`)* | live *(the machine below it is this module's)* | `M12-04` · M12 (whole) |
| `BM-32`–`BM-36` *(consumed, not disposed — Task 11)* | live *(the matrix as non-negotiable floor: enforcement may add detail, never move a ✓; Q16 non-reading carried at M12-27)* | `M12-21` · `M12-22` · `M12-27` |
| `BM-28`–`BM-31` *(consumed, not disposed — Task 11)* | live *(trial law enforced at §M12.9)* | `M12-52`–`M12-54` |
| `BM-42` *(consumed, not disposed — Task 11)* | live *(grandfathering mechanics: protected plan-price rows, never mid-cycle, lapse ends protection)* | `M12-57` |
| `F8-33` / `F8-34` *(consumed, not disposed — `foundations/F8` Task 7 owns them)* | live *(usage-screen equality and honest-state copy, enforced across §M12.4–§M12.8)* | `M12-34` · `M12-31` · `M12-41` · `M12-49` |
| `F4-33` / `F4-34` *(consumed-not-disposed as written; **both rows deleted 2026-08-07** — `foundations/F4` Task 10 still owns the keys behind them)* | live *(the two obligations this module's gates honour survive **in M12 itself**, which is why the row stays live: `M12-26` — a photograph already captured in the field always uploads, in every billing state, and no gate may inspect, delay or refuse it — and `M12-27` — capture is never cut off before `halted`, with a mid-visit halt letting the visit finish. What died with `F4-33`/`F4-34` is the generic queue drain and the cached-entitlement mechanism, both non-goals under `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1. Nothing is consumed from F4 here any more; the ids to cite are M12's own, with `M12-24` as the never-gated list)* | `M12-26` · `M12-27` · `M12-24` |
| `F2.M12.manage-billing` *(consumed, not disposed — `foundations/F2` Task 5 owns it)* | live *(every billing act Owner-only; the new read row added beside it)* | `M12-56` · `F2.M12.view-usage-and-invoices` |

## Task 23 — M13 (`docs/prd/modules/M13-dashboards-and-reporting.md`)

Conventions for this block:

1. **The journey's dashboards section has no Task-2 ledger keys and is read directly** —
   the gap Task 4 noted (its block's row: "journey §DASHBOARDS & REPORTS L1523–1572 — no
   Task-2 ledger key — read directly"). Per Task 4's precedent, its rows below are
   **source-pointer rows** naming the section and line span; `D37` remains the governing key
   and is disposed here as the module's law.
2. **Shared-with-M07 keys are reciprocated, not moved:** `S7.rule.my-day`, `S7.rec.1` and the
   `AP.*` family carry M07's working-surface halves (Task 17); the rows below land the
   role-home/dashboard halves Task 17's convention 2 routed here. Neither half restates the
   other.
3. **`S1.rec.1` is not re-appended**, per Task 4's routing note ("both authors should carry
   this key's mechanics and should **not** re-append") — M13 consumes `PS-01` and composes
   the homes; M01 owns the first-run handoff.
4. **`Q5` is closed as a recorded decision** (`M13-10`): the fixed preset-precedence ladder
   over `F2-14`'s lattice; register row updated to "Decision recorded — not open"; F2's
   `F2-Q1` row updated to match; the F2 §F2.5-M13 placeholder is replaced by a notes block
   because dashboards create no capability (no new grant — every read rides existing scopes).
5. **Twelve persona rows verified:** `M13-29`–`M13-40`, one per persona in F2-01's fixed
   order — the brief's Step 3 gate.
6. **V2-module rollups carry their publishers' conditions as law:** `M03-57`'s
   caveat-travels condition, `M09-62`'s gaps-stated/no-score conditions and `M10-25`'s
   facts-only condition are accepted at `M13-46`–`M13-48` rather than re-derived.

| source key | disposition | PRD ID(s) or register |
|---|---|---|
| `D37` | live *(the governing law, whole: periodic decision tool, tasks-not-KPIs boundary, every-tile-answers, forecast-never-revenue, won-means-signed, correlation-not-attribution, D20 scoping, no-new-metric rule)* | `M13-01` · `M13-03` · `M13-04` · `M13-06` · `M13-07` · `M13-41` |
| `journey §DASHBOARDS & REPORTS L1524–1541` *(source-pointer row — governing rules + framing; read directly per Task 4's precedent)* | live | `M13-01` · `M13-03` · `M13-05` · `M13-06` · `M13-07` |
| `journey §DASHBOARDS L1543–1548` *(source-pointer row — the screens table: owner dashboard sections, rep dashboard contents, funnel + both reason lists; the notifications/search row of the same table is `foundations/F6`'s and is dispositioned in its block)* | live | `M13-14` · `M13-15` · `M13-16` · `M13-22` · `M13-23` · `M13-29` · `M13-30` · `M13-31` |
| `journey §DASHBOARDS L1550–1555` *(source-pointer row — "These screens READ; they never create"; deep-link law)* | live | `M13-02` |
| `journey §DASHBOARDS L1557–1566` *(source-pointer row — the six what-goes-wrong items: empty-teach, outlier, inline-target/no-nag, mid-month, gamed metric, owner-never-opens)* | live | `M13-12` · `M13-18` · `M13-17` · `M13-19`/`M13-20` · `M13-27` · `M13-21` |
| `journey §DASHBOARDS L1568–1571` *(source-pointer row — the recommendation: "what needs you" and cash lead)* | live | `M13-20` |
| `DOC04.forecast-not-revenue` | live | `M13-03` |
| `DOC04.targets` | live *(goal-only storage, tenant or per-user scope, actuals derived at read time; inline on the dashboard, no separate settings screen)* | `M13-17` |
| `DOC14.dashboards` | live *(owner + rep dashboards and funnel/win-loss committed under the D37 honesty rules)* | `M13-14` · `M13-22` · `M13-31` |
| `S7.rule.my-day` | live *(shared — the role-home half lands here: My Day as the Sales Executive's home with the fixed block order composed by this module; working-surface half `M07-01`–`M07-04`, Task 17)* | `M13-31` · `M13-11` |
| `S7.rec.1` | live *(shared — the M13-layout half: the agent block stays separate in every composed home; M07 half `M07-03`)* | `M13-13` |
| `AP.retention.1` | live *(shared — the dashboard-rendering half; M07 half `M07-55`)* | `M13-41` |
| `AP.dashboard.1` | live *(shared — the monthly block rendered under D37; sample numbers illustrative, never targets; M07 half `M07-55`)* | `M13-41` |
| `AP.dashboard.2` | live *(shared — "deals it touched" with the (see note) pointing at the honesty rule; M07 half `M07-56`)* | `M13-42` |
| `AP.honesty.1` | live *(shared — the screens' M13 half; the law is `F8-30`, Task 7; M07 half `M07-56`)* | `M13-42` |
| `AP.screen.1` | live *(shared — call log rendering; M07 half `M07-57`)* | `M13-43` |
| `AP.screen.2` | live *(shared — unanswered questions rendering; M07 half `M07-58`)* | `M13-43` |
| `AP.screen.3` | live *(shared — usage view rendering, same numbers as billed; M07 half `M07-59`, M12 half `M12-38`)* | `M13-43` · `M13-50` |
| `AP.screen.4` | live *(shared — per-rep view, Sales Manager + EPC Owner only; M07 half `M07-60`)* | `M13-43` |
| `AP.wrong.1` / `AP.wrong.2` | live *(shared — the screen-defends-itself halves; M07 half `M07-61`)* | `M13-44` |
| `AP.wrong.3` | live *(shared — caveat-on-screen, in exports too; the placement law `F8-31`, Task 7)* | `M13-42` · `M13-53` |
| `AP.wrong.4` | live *(shared — the monthly summary push, dashboard side; M07 half `M07-61`; push type `foundations/F6`)* | `M13-45` · `M13-21` |
| `S4.screen.6` | live *(shared — the role-home composition half routed here by Task 14; content `M04-38`, persona `PS-13`)* | `M13-32` |
| `UXG-06` | live *(shared — the sign-off-queue composition half routed here by Task 15; queue contract `M05-83`)* | `M13-33` |
| `S5.screen.2` | live *(shared — the engineer sign-off-queue home; composed per `PS-18`, contract `M05-83`)* | `M13-33` |
| `R9.unassigned` | live *(shared — the owner "needs you" surface half routed here by Task 13; state `M02-50`, notification type F6)* | `M13-15` |
| `R9.disqualified` | live *(shared — the win/loss "disqualified early" list half; state `M02-53`)* | `M13-23` |
| `R9.lost` | live *(shared — the win/loss "lost late" list half; state `M02-54`; the `Q21` vocabulary mismatch carried, not repaired)* | `M13-23` · register `Q21` |
| `R15` | live *(shared — the win/loss analytics half routed here by Task 13; the referral row `M02-16`; no credits ledger, ever)* | `M13-26` |
| `R2` | live *(shared — the days-in-stage metrics half routed here by Tasks 6/18; machine `M08-08`, IN labels `F1-51`; CANCELLED's immediate revenue stop as reporting law)* | `M13-25` · `M13-04` |
| `S8.rec.2` *(consumed, not disposed — `modules/M08` Task 18 owns it)* | live *(days-in-stage as the only board metric, carried into the dashboard's ageing views)* | `M13-25` |
| `S8.wrong.8` *(consumed, not disposed — Task 18)* | live *(the reporting half: a cancellation never silently keeps counting)* | `M13-04` |
| `D31` | live *(the multi-preset home/shell composition question its Task-9 row left open at register `Q5` — now resolved by the composition rule; the arc-bar visual halves stay `F7-22`'s)* | `M13-10` · register `Q5` (decision recorded) |
| `PS-05` *(consumed, not disposed — `02-personas.md` Task 4 owns it)* | live *(one person, one home + compose + switch — the rule's source inputs, honored by the ladder including the source's rep + surveyor example)* | `M13-10` |
| `F2-14` *(consumed, not disposed — `foundations/F2` Task 5 owns it)* | live *(the domain lattice as the composition rule's input, exactly as `F2-Q1` assigned)* | `M13-10` |
| `M03-57` *(module reciprocal — Task 21)* | live *(cross-campaign reporting with the caveat-travels condition accepted as law)* | `M13-46` · `M13-28` |
| `M09-62` / `M09-45` / `M09-09` *(module reciprocals — Task 22)* | live *(field-day rollups with gaps stated and no scores)* | `M13-47` |
| `M10-14` / `M10-25` / `M10-32` *(module reciprocals — Task 23 M10)* | live *(people-today composition, facts-only attendance rollup, team membership for Team scoping)* | `M13-37` · `M13-48` · `M13-07` |
| `M11-54` *(module reciprocal — Task 19)* | live *(cash/collections figures with qualifiers a dashboard may not drop)* | `M13-16` · `M13-38` · `M13-08` |
| `BM-11` / `BM-33` / `BM-47` *(consumed, not disposed — Task 11)* | live *(reporting vocabulary and the trial-to-paid launch metric)* | `M13-49` · `M13-51` |
| `F8-30` / `F8-31` *(consumed, not disposed — Task 7)* | live *(correlation law + caveat placement on every influence figure and export)* | `M13-06` · `M13-24` · `M13-42` · `M13-53` |
| `F8-33` *(consumed, not disposed — Task 7)* | live *(usage figures read the billed rollups)* | `M13-50` |
| `BM-32` *(consumed, not disposed — Task 11)* | live *(dashboards + search + export in the always-on set — the export-in-every-state rule)* | `M13-52` |
| `F5-28` *(module reciprocal — Task 20)* | live *(no delivered state on any link figure this module renders)* | M13 §5 |
| `DOC14.release-valves` *(consumed, not disposed — dispositioned by the Task 25 gate-closure block below; Task 9 appended no row, and this block's earlier pointer to one was corrected by Task 25)* | see Task 25 disposition of record *(consumed here: dashboard polish and analytics depth as the sanctioned scope valves — stated as the module's scope guard)* | M13 §5 |

## Task 23 — F6 (`docs/prd/foundations/F6-notifications-and-search.md`)

Conventions for this block:

1. **The matrix is the cross-check, both ways.** Every notification event named by a module's
   §4 contract (M01–M13, F4, F5 — enumerated in F6-10's acceptance criterion) appears as a
   matrix row citing its registering module; the matrix contains no event no module raises.
   The V2 modules' registered types (M03 ×3, M09 ×3, M10 ×4, M11 ×4, M12 family, M13 ×2) are
   `BRIEF` per their modules' hand-offs; the day-one enum is `SRC`.
2. **F6 stays staff-side.** No row assumes a customer-facing send channel of F6's own; `Q33`'s
   interims (F5's honest states) stood at authoring time, with F6's input recorded on the
   register row's named-inputs list satisfied by F6 §6 F6-Q1. *(Reconciled to owner ruling
   2026-08-04 `Q33`, 2026-08-06: the interims are spent — the transactional lane now **sends
   from the tenant's connected official channel where one exists** and is **composed for a
   person only where none is connected**, the one path that claims no delivery. The convention
   itself holds unchanged in its own terms — F6 still owns **no** send channel; the channel is
   `modules/M03`'s connection, which `F6-04`'s reconciled boundary names and `F6-26` supplies
   text for. See `registers/conflicts.md` row 4.)*
3. **The search-alias half of `R1` closes the forward notes Tasks 8 and 16 left** (`F3-11`'s
   and `M06-01`'s routing of "the alias surface is `foundations/F6`'s").
4. **No F2 matrix table exists for F6, recorded deliberately:** `F2-25`'s table set is
   M01–M13 + F5; F6 creates no capability, so a note in F2 §F2.5 (after the F5 notes) records
   that its surfaces ride existing grants — no placeholder existed and none remains.
5. **No new open question**; F6 records inputs to `Q33` and `Q10` without moving either. At
   authoring time `Q33` was unchanged by this block: the two transactional customer moments had
   no send channel, and F6 stayed staff-side and took no position, recorded at F6 §6 F6-Q1.
   *(Reconciled to owner ruling 2026-08-04 `Q33`, 2026-08-06: `Q33` is decided and no longer
   open — the two moments **send from the tenant's connected official channel where one is
   connected**, and are **composed for a person where none is**, the only branch claiming no
   delivery. The convention's own point stands: this block still moved nothing and F6 still
   takes no position — the ruling came from the owner, not from here. See
   `registers/conflicts.md` row 4.)* *(A
   pseudo-key table row previously restated this with an out-of-vocabulary disposition
   ("conflict-adjacent open item"); Task 25 folded it into this convention — `Q33` is a
   register question, not a ledger key, and takes no disposition row.)*

| source key | disposition | PRD ID(s) or register |
|---|---|---|
| `DOC14.notifications-search` | live *(bell centre + push wiring + app-wide global search as committed scope — the document's charter)* | `F6-01` · `F6-11` · `F6-17` · `F6-20` |
| `journey §DASHBOARDS L1548` *(source-pointer row — the "Notifications + global search" screens-table row: the centre's type list, "push + in-app, grouped, each actionable", and the one search field "leads, customers, sites, quotes and projects by name, phone or city"; the dashboards rows of the same table are `modules/M13`'s block)* | live *(the row's "quotes" renders as Proposals per `R1`; the settings-hub aside is `M01`'s surface, cited not moved)* | `F6-01` · `F6-02` · `F6-12` · `F6-17` · `F6-20` |
| `DOC04.notification-types` | live *(the day-one enum verbatim — proposal_opened · agent_escalation · follow_up_due · survey_submitted · design_returned · signoff_requested · payment_due · lead_unassigned_24h · system — with deep-link, read-state and push-sent marker; extended by registration only)* | `F6-05` · `F6-02` · §F6.3 matrix |
| `DOC04.notification-language` | live *(rendered in the recipient's language at emit time; never re-translated)* | `F6-08` |
| `DOC07.push-best-effort` | live *(the record is the truth; inbox + badge derive from it; a dropped push never loses information)* | `F6-06` · `F6-17` · `F6-19` |
| `DOC06.conflict-matrix` | live *(shared — the notification-read-state entity half lands here: up-only, set-once. **`F4-18`, the F4 row that carried the matrix's two device-store entries, was deleted 2026-08-07 by owner ruling `Q61`** — with no on-device store, "catalog read-only on the device" and "read-state up only *on the device*" have no subject — so F6 now carries this entity half **alone**, and `F6-07` stands on its own merits: reading on one device reads everywhere and nothing un-reads, which is a plain product law rather than a sync rule. `F6-07`'s source line still names this key. The policy itself stays F4's, live at `F4-14`, `F4-15`, `F4-16`, `F4-17`, `F4-19` (enumerated around the gap left by the deleted `F4-18`, as the `DOC06.conflict-matrix` row in the Task 10 block does), and every other entity stays with its module per Task 10's routing)* | `F6-07` |
| `DOC04.message-templates` | live *(the template registry: five seeded keys, tenant-extendable, per-language with placeholders. The source key's tail — "composed and copied, never sent" — is `D32`'s and is kept visible as the v1 meaning. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** a registered template now **sends from the tenant's connected official channel where one exists**, under the transactional/utility template class per pack rules, and is **composed for a person to copy where no channel is connected** — only that fallback branch claims no delivery. The registry's shape is untouched; the channel is `modules/M03`'s connection, not F6's. See `registers/conflicts.md` row 4)* | `F6-26` · `registers/conflicts.md` row 4 |
| `DOC10.templates-are-data` | live *(shared — the F6 registry half closing Task 8's forward note; the content-class law `F3-10`, the management surface `M01-55`, the M06/M07 halves with their tasks)* | `F6-27` |
| `TC.message-templates.1` | live *(shared — the F6 supply half; the settings surface `M01-55`, the share flows M06/M07/M08)* | `F6-26` |
| `DOC07.messaging-manual` *(consumed, not disposed — `modules/M06` Task 16 owns it)* | live *(the source key's own posture, kept visible: in v1 the template supply served **manual copy**, and no send capability existed. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** that unscoped reading was `D32`'s and is retired. The posture the supply serves is now two-branch — where the tenant has a **connected official channel** the composed message **sends** from it and a delivery state exists; where **no channel is connected** it is **composed for a person to send**, and only that fallback branch claims no delivery. `F6-26` is unchanged as a registry — it supplies the text on both branches — and F6 still operates no send channel of its own; the channel is `modules/M03`'s connection. See `registers/conflicts.md` row 4, which enumerates `F6-26` among the surfaces this ruling moves)* | `F6-26` · `registers/conflicts.md` row 4 |
| `R1` | live *(shared — the **search-alias clause** lands here, closing the ruling's F6 routing: "quote"/"quotation" as query aliases for Proposals, the single exception to the ban; vocabulary law `F3-11` (Task 8), entity/document `M06-01` (Task 16), link wording `foundations/F5` (Task 20))* | `F6-22` |
| `R9.junk` | live *(shared — the search-only surface half routed here by Task 13; the state is `M02-55`'s)* | `F6-23` |
| `R9.unassigned` | live *(shared — the escalation notification type registered here per Task 13's routing; state `M02-50`, owner surface `M13-15`)* | §F6.3 matrix (`lead_unassigned_24h`) |
| `S7.wrong.5` | live *(shared — the F6 half of the escalation contract: immediate push, never grouped, never a task buried in a list; the M07 surface half is `M07-43`/`M07-42`, Task 17)* | `F6-13` · §F6.3 matrix (`agent_escalation`) |
| `AP.wrong.4` | live *(shared — the F6 half: the monthly summary push types (agent + dashboard) registered; screen halves `M07-61`/`M13-45`/`M13-21`)* | §F6.3 matrix (monthly summaries) |
| `UXG-12` | live *(shared — the tenant-side question-inbox half routed here by Tasks 19/20: "customer asked a question" and "customer requested a call" are matrix rows landing on the record's owner; the customer-side affordance is `F5-52`–`F5-54`, the payment-handoff halves `M11-24`/`F5-57`)* | §F6.3 matrix (question / call-request rows) |
| `UXG cross-cutting note` *(ux-gaps.md preamble — "notification types for the new v1 systems (billing events, sync failures, number-provisioning status) extend the existing NotificationsCentre patterns; register them in each module's slice rather than as separate screens")* | live *(the no-private-alert-surface law; every new-system type is a matrix row. **Amended 2026-08-07 (owner ruling `Q61`):** the ref used to name a "billing/sync/provisioning" class of matrix rows. **There is no sync row and there can be none** — `docs/prd/foundations/F6-notifications-and-search.md` contains no occurrence of "sync", those notification types having gone with the offline capability. The preamble is quoted as written in the source-key cell, because the register never rewrites a source; only the ref is corrected. The rule the note states is untouched, and its two live examples are the billing family — dunning day 0 / day 4 / day 6–7, trial nudges and expiry, the usage 80% warning — and the number-provisioning status row)* | `F6-01` · F6.1 edge cases · §F6.3 matrix (the billing family and the number-provisioning status row; **no sync row exists**) |
| `D32` *(consumed, not disposed — `modules/M06` Task 16 owns it; the disposing row is that block's)* | live *(as read here in v1: the app never sends for the tenant's customer, F6's channels are staff-only, and the template supply feeds manual copy. **Reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06):** the first clause is retired — the transactional lane **sends from the tenant's connected official channel where one exists**, with a delivery state on that branch, and is **composed for a person only where no channel is connected**, the one branch that claims no delivery. The **second clause survives intact**: F6 still operates no customer-facing send channel of its own — `F6-04`'s reconciled boundary names the transactional flows and hands the channel to `modules/M03`, and `F6-26` supplies the template text on both branches. See `registers/conflicts.md` row 4, which enumerates `F6-04` and `F6-26`)* | `F6-04` · `F6-26` · `registers/conflicts.md` row 4 |
| `F4-02` / `F4-18` *(consumed-not-disposed as written; **both rows deleted 2026-08-07** by owner ruling `Q61` — `foundations/F4` Task 10 owns the keys behind them)* | live *(two of the three obligations survive and F6 carries them alone. **Gone:** "offline search over synced data" — there is no synced data and no cache (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1), and `F6-18`, the row that stated the centre's offline behaviour, was deleted in the same sweep with no replacement and no open question, search and the inbox being ordinary online reads. **Surviving:** read-state up-only and set-once at `F6-07`, and the centre never blocking — now the general law `F4-27` ("no modal, no spinner wall, no disabled primary actions") rather than a connectivity promise — with `F6-24` keeping search always-on in every billing state. The ids to cite are F6's own plus `F4-27`)* | `F6-07` · `F6-24` · `F4-27` |
| `D20` *(consumed, not disposed — `foundations/F2` Task 5 owns it at `F2-12`)* | live *(search results and notification recipients resolve through role visibility, per domain, no leakage — search is never a side door around scope)* | `F6-16` · `F6-21` |
| `BM-32` *(consumed, not disposed — `04-business-model.md` Task 11 owns it)* | live *(search and the notification inbox are always-on reads in every billing state)* | `F6-09` · `F6-24` |
| `F1-10` / `F1-21` / `F1-38` *(consumed, not disposed — `foundations/F1` Task 6 owns them)* | live *(quiet-hours defaults from tenant timezone and pack locale conventions; the dunning family's out-of-app messages ride registered templates)* | `F6-14` · `F6-11` |
| `M09-13` / `M09-24` / `M09-51` *(module reciprocals — Task 22)* | live *(the three M09 types registered: tracking on/off · open check-in · geofence arrival)* | §F6.3 matrix (M09 rows) |
| `M12-39`–`M12-42` *(module reciprocals — Task 23 M12)* | live *(the dunning family, trial nudges and usage warning registered; the ladder and channels stay M12's)* | §F6.3 matrix (M12 rows) · `F6-11` |

## Task 24 — `03-journey-map.md`

Appended by Task 24. `03-journey-map.md` is a **narrative** document: it assigns no requirement
ID, carries no requirement row, and states no tier or origin tag on a row. Five conventions make
this block readable against that fact.

1. **Narrative disposition, and what the `PRD ref` column means here.** A source key disposed to
   this document lands as **narrative**, so its ref is a **section anchor** (`03 §3`, `03 §6`),
   never an ID — this document assigns none, by design (`03 §1`, `03 §9`). `live` on such a row
   means *"the key is present, whole, as narrative in the named section, and the requirement
   that carries it is in the module the section links to."* The precedent is Task 3's use of
   section anchors (`01 §Glossary`, `01 §Non-goals`) for the same situation.
2. **This block covers the map-level key only; stage and customer-journey keys are not
   re-appended.** Every stage key (`S0.*`–`S8.*`), every customer-journey key (`C.framing.*`,
   `C1`–`C13`, `C*.wrong.*`, `C.lifecycle.*`) and the `D36.callrules.*` preamble family was
   already disposed by its owning module or foundation in Tasks 12–23. Verified before writing:
   of the 275 unique keys in `_process/extraction/journey-stages.md` and
   `_process/extraction/customer-journey.md`, **274 already carried a disposition row** and
   exactly one — `JOURNEY.map` — did not. That one key is disposed below; nothing else is moved.
3. **`DOC00.*` stays with Task 3.** Task 3's convention 1 disposes every `DOC00.*` key once, in
   its own block, with the ref naming the document that owns the detail — and states that the
   named document's task "should **not** re-append the key". `DOC00.nine-stage-backbone` already
   points at this file. The three `DOC00.*` rows below are therefore **consumed, not disposed**:
   they record what this document narrates without moving ownership or double-counting the key.
4. **The V2 extensions appended nothing.** The three brief-scoped extensions narrated at `03 §4`
   (marketing feeding Stage 2, field workforce riding Stages 4/8, HR-lite supporting Stage 1) are
   `BRIEF`-origin and were disposed in their own modules' blocks — Task 21 (`modules/M03`),
   Task 22 (`modules/M09`), Task 23 (`modules/M10`). `03 §4` states them as extensions of the v1
   spine, links each to its module, and carries no key of its own.
5. **Nothing resolved, nothing new opened.** No open question and no conflict is created or
   closed here. As authored, the C4/C8 send-channel tension was repeated as a tension and
   pointed at `Q33` (`03 §5`) *(reconciled to owner ruling 2026-08-04 `Q33`, 2026-08-06: the
   tension is resolved — the C4 and C8 messages **send from the tenant's connected official
   channel where one is connected**, under the transactional template class, and are **composed
   for a person to send where none is connected**, the only path claiming no delivery
   (`F5-16`/`F5-48`). `03 §5` now states the ruling rather than the tension; the convention's
   own point still holds — this document resolved nothing on its own authority, the owner did.
   See `registers/conflicts.md` row 4)*; the source's stale Stage-8 scope note is dropped in favour of
   `S8.rule.v1-boundary`'s boundary, which is `modules/M08`'s and is not re-appended.

| source key | disposition | PRD ID(s) or register |
|---|---|---|
| `JOURNEY.map` | live *(narrative disposition — the nine-stage map is this document's spine: each stage carries the source's who/goal/what-goes-wrong framing as narrative, its owning-module link, its personas and its P0 heart. The map's stale scope-placeholder note on Stage 8 (source text says the scope is still to be decided) is not carried — wording paraphrased by Task 26 so no inline open-item token survives in `docs/prd/`: the boundary is `S8.rule.v1-boundary`'s, disposed by Task 18 to `modules/M08`. The map's CROSS-cutting half — roles & permissions · notifications · search · settings · reporting — lands at `03 §7`, routed to `foundations/F2`, `foundations/F6`, `modules/M01` and `modules/M13`)* | `03 §3` (Stages 0–8) · `03 §6` (stage ↔ module ↔ persona map) · `03 §7` (cross-cutting) |
| `DOC00.nine-stage-backbone` *(consumed, not disposed — `01-product-overview.md` Task 3 owns it, and its ref already names this file)* | live *(the backbone rendered as narrative, one block per stage, each linking its owning module)* | `03 §3` |
| `DOC00.one-record` *(consumed, not disposed — Task 3 owns it at `OV-04`)* | live *(the connective thread: `03 §2` narrates the record end to end — identity at capture → site → design → proposal → link → project → collection schedule — and repeats `OV-04`'s conformance test rather than restating the requirement)* | `03 §2` |
| `DOC00.customer-journey-parallel` *(consumed, not disposed — Task 3 owns it at `OV-32`; the lifecycle is `foundations/F5`'s, Task 20)* | live *(C1–C13 narrated in parallel with the EPC spine, every step pointing at its F5 requirement)* | `03 §5` |
| `C.framing.5`–`C.framing.8` *(consumed, not disposed — `foundations/F5` Task 20 owns them at `F5-02` and `F5-06`)* | live *(the customer's surface-area budget and the three deciding moments are the frame `03 §5` is written around; no figure or obligation is restated differently)* | `03 §5` |

## Task 25 — gate closure (completeness verification, design spec §13)

Appended by Task 25, the §13 completeness gate. This block is **register bookkeeping only**:
every row below dispositions a Task-2 extraction-ledger key that carried no traceability row
after Tasks 3–24. No product content was added by this wave beyond two rationale edits in
`modules/M01-onboarding-and-tenant-config.md` (the §5 custom-domains rationale and the
`M01-04` conflicts-row-9 pointer); every in-place correction to an earlier block is marked
"Task 25" where it was made. The gate's full report is
`docs/prd/_process/verification-report.md`.

Conventions for reading this block:

1. **The excluded-with-no-carrier convention.** Engineering and process keys (stack directives,
   test policy, build/release process) are `excluded` per design spec §14/DD4. Their ref cell
   reads "this register (no PRD carrier)" — deliberately: for content barred from PRD bodies,
   the register row **is** the disposition, and no module section exists or should exist for it.
   Where such a key has a product-visible residue, the residue's live requirement is named
   beside the exclusion.
2. **Corrections made in earlier blocks by this task**, each marked in place: Task 16's
   `S6.wrong.4` retyped `live`→`conflict` (conflicts row 8 now exists) and its `D16` route note
   corrected (no customer compare surface exists — `F5-35` renders the recommendation only);
   Task 17's `DOC04.byo-number` retyped `conflict`→`superseded` (matching conflicts row 6's own
   status); Task 20's `C1.wrong.2` and `C.lifecycle.9` retyped `conflict`→`live (open question)`
   (unruled gaps, not mirrored contradictions) and its convention-3 reference count corrected to
   the measured value (331 references / 130 unique IDs, method stated there); Task 23 M12's
   `D38` and `S0.notv1.1` rows now name their superseder in-row (owner directive 4, `OD-4`,
   docs/15 §4); Task 23 F6's out-of-vocabulary `Q33` pseudo-row folded into that block's
   convention 5; Task 12's `S0.notv1.3` row and M01 §5 now carry the source rationale
   (`CG-18`/`BM-15` Enterprise white-label packaging); Task 6's `R6` row now records the
   default-threshold placement route as fulfilled at `Q42`.
3. **Two conflicts-register entries written** (the register was outside the flagged tasks'
   file sets): row 8 — `S6.wrong.4`'s delivery-state promise vs `D32` composed-not-sent
   (`M06-57` carries the reading); row 9 — the OTP resend 30 s/45 s divergence
   (`S0.wrong.2` vs `DOC08.otp-limits`; `M01-04` carries both values pending ruling).
4. **Two open questions raised:** `Q41` (the `EOD-7` "AI-agent rules" ambiguity — recorded by
   the ledger, disambiguation owed by the owner) and `Q42` (the acceptance-threshold default's
   pack-key placement, closing F5 §6's closure-pass note).
5. **Dead-file citations reviewed and accepted as source-gap-mitigated.** `DOC00.market-moment`
   cites `docs/research/market.md` and `R19-CTX` cites `./research/ds-reconciliation.md`;
   neither file exists in this repository. Both are instances of source gap #1
   (`registers/conflicts.md` row 1): facts that survive only as citations are used as-is with
   the citation noted, nothing invented. The gate reviewed both rows and accepts them —
   no further action owed.
6. **The `DOC14.release-valves` row below is the disposition of record.** The Task 23 M13
   block's "consumed, not disposed — Task 9's 00-README disposition" pointer resolved to no
   row (Task 9 appended none); it resolves here.
7. **UXG appendix rows sit outside the UXG-01–27 numbering** (the ledger's own scope note) and
   are dispositioned here so nothing is lost. The three `UXG-A11Y-*` rows are closed in source
   at the token level: the binding values live in `design/ds-source` (`F7-01`/`F7-03` — visual
   facts are never restated in this suite) and the product-law floor they satisfy is `F7-23`'s
   N4 contrast gate. Partial coverage is stated honestly: `F7-23` carries the floor, not the
   token values, and the coverage-gate/DECLARED_PAIRS mechanics are engineering, excluded
   per §14.
8. **Competitive rows never invent a carrier.** Where a matrix row's honest answer is
   "documented contrast, no requirement carrier", the row says so; where a capability is
   census-backed, the census sections are cited. `CG-matrix.7`'s dup-check was performed: no
   `CG-*` key below carries a second disposition row anywhere in this register.

| source key | disposition | PRD ID(s) or register |
|---|---|---|
| `OD-1` | excluded *(implementation-only — the backend-stack directive; engineering content outside PRD scope per design spec §14/DD4. Surfaces only as source context inside R3/R14's rows)* | this register (no PRD carrier) |
| `OD-2` | excluded *(implementation-only — the hosting/storage directive, ADR-0007/0008; §14/DD4. The product-visible residency residue is already live at `F1-55`/`F1-43` via `DOC03.dpdp-residency`/`DOC08.residency` — no new content owed)* | this register (no PRD carrier) · residue `F1-55`, `F1-43` |
| `OD-3` | live *(the surface-commitment half — both mobile platforms at launch, no phased platform rollout: `OV-08`'s lockstep mobile scope, `F7-39`'s structural web-and-native pairs, and every module's §2 Personas & surfaces declaration)* + excluded *(the bare-RN/no-Expo stack half, ADR-0011 — implementation per §14/DD4)* | `OV-08` · `F7-39` · module §2 sections |
| `OD-5` | live *(the surviving scope law, whole: the calendar is dead and no day number appears anywhere in this suite; the scope commitment — no Launch-2, no "later" buckets — is `OV-43`'s, as corrected by this directive, with the suite-wide reading rule ("ships in the N-day build" reads as "in v1 scope") stated in `OV-43` itself and held by `00-README` §Tier definitions ("No dates, no phases, no build plan"). The directive's owner-blocked activation items (store accounts, billable infrastructure; the cited `docs/engineering/ops/company-registration-blockers.md` is not present in this repo) are process facts outside PRD scope; the one product-visible consequence — store submission blocked — is recorded at register `Q12`)* | `OV-43` · `00-README` §Tier definitions · `Q12` (store-submission consequence) |
| `OD-6` | live *(the product-visible clauses: "global expansion" is the root of the market-pack framework and the market-neutrality law — `F1-01`–`F1-05` and F1 §4's standing verification rule — and of the 2026-08-02 global-backend amendments (`UD-9`'s row, Task 6); "long-term scalability"'s product face is the scale program, `M05-87` (§M05.15). "Without unnecessary complexity" stands as the recorded counterweight to REC inflation, beside `EOD-6`'s consistency principle at `F7-38`)* + excluded *(the engineering-principle remainder — clean code, AI-assisted development, production ops — per §14/DD4)* | `F1-01`–`F1-05` · F1 §4 · `M05-87` · `F7-38` |
| `OD-9` | live *(studio-is-flagship, whole: the flagship conviction `OV-21`; the census as binding acceptance baseline that never shrinks `M05-01` (canonical artifact `studio-census.md`, the canon correction carried); full-parity WebView presentation on mobile `M05-08`; the scale program as investment into the studio moat, never a reason to cut capability, `M05-87`)* | `OV-21` · `M05-01` · `M05-08` · `M05-87` |
| `R20` | excluded *(implementation-only — the auth-teardown/database-reset ruling: migrations, schema, package structure; §14/DD4. Product-visible residue: auth exists in this suite as requirements (`M01-01`–`M01-07`, F2 §F2.5), not as built behaviour — both source login flows are stubs, and the auth-rebuild product-law questions are register `Q20`. The renumbering note is honoured suite-wide: "R19" cited for the auth teardown means R20; "R19" for visual/DS matters means R19-A…E)* | this register (no PRD carrier) · residue context `Q20` |
| `EOD-1` | excluded *(engineering process — the thin-test-net / no-test-files rule; §14/DD4. Noted for readers: nothing in this suite's acceptance criteria assumes an automated test program exists)* | this register (no PRD carrier) |
| `EOD-2` | live *(the pricing-benchmark posture — price below Reslink/ARKA/Aurora with healthy margin: generalized as `BM-39`'s benchmark law (under the market's incumbents at equivalent capacity, always; margin from `BM-17`'s COGS discipline, never list price), with the IN instance recorded at `BM-41` (Reslink India, ARKA — priced under at every rung))* | `BM-39` · `BM-41` · `BM-17` |
| `EOD-3` | live *(the 1 kW → 100 MW design range with a credible scale path: `OV-03`'s box, `OV-44`'s "remains a v1 commitment", and the scale program `M05-87`–`M05-94` (§M05.15). Consistent with the `D1` row, as the ledger notes — no contradiction)* | `OV-03` · `OV-44` · `M05-87` (§M05.15) |
| `EOD-4` | live *(gaps-first-class: competitive verdicts and UX gaps are first-class PRD input. The discipline is enacted across this register — every `UXG-*` and `CG-*` key carries a disposition row — and the design-time half is `F7-45`'s law (a registered gap closes only when its screen ships, a design-at-implementation act, and rows are never deleted); every `REC` lives in `registers/enhancements.md` with rationale)* | `F7-45` · `registers/enhancements.md` · this register (the UXG/CG dispositions themselves) |
| `EOD-7` | live *(interpretation resolved 2026-08-04 — owner ruling `Q41`: `EOD-7` is read as the **voice-agent behaviour rulebook** — the first-class deliverable reflecting the Q6/Q30/Q31 rulings across `modules/M07`'s D10/D24/D36/R10 family, which carries the owner's top-priority weighting; the coding-rules reading is handed to the engineering phase in a one-line note on the register row)* | `registers/open-questions.md` Q41 (decision recorded 2026-08-04) · `modules/M07` (the weighted surfaces) |
| `UD-1` | excluded *(process/environment — the docs-home path; §14/DD4. The ledger's recorded workspace contradiction (stated home `/Volumes/works-space/heliogrid` vs this project reading `heliogrid_v2_prd/docs/`) is a fact about repositories, not about product source content — carried in-row here, deliberately not a `conflicts.md` entry)* | this register (no PRD carrier) |
| `UD-2` | live *(the competitors of record — ARKA 360, Aurora, OpenSolar, Reslink: consumed as the docs/12 corpus, dispositioned key-by-key across this register's `CG-*` rows; the two named in the IN book's recorded benchmark set are `BM-41`'s (Reslink India, ARKA) under `BM-39`'s benchmark law. No module body names a competitor — market-neutral bodies per Global Constraint §6. The ledger's recorded non-reconciliation — OpenSolar in the competitor set but not the pricing-benchmark set — is carried, not repaired)* | `BM-39` · `BM-41` · the `CG-*` rows of this register |
| `UD-3` | excluded *(engineering process — the same decision as `EOD-1`, which the ledger names as the live form (2026-07-29 hardening); §14/DD4)* | this register (no PRD carrier) · see `EOD-1` row |
| `UD-7` | excluded *(implementation — the "final review" stack restatement of OD-1/OD-2/OD-3 naming the concrete services; §14/DD4. Its billing/entitlements/payments clause is already live via `OD-4`'s rows — `BM-03`, `M12-52`/`M12-53` — and adds no scope of its own)* | this register (no PRD carrier) · billing half `BM-03` |
| `UD-8` | excluded *(implementation — the database choice with its knowingly accepted deprecation risk; §14/DD4. The ledger notes the "mandatory mitigations and documented escape hatches" are not enumerated in docs/15 — an engineering-process source gap outside PRD scope, deliberately not raised as a register question: no product behaviour depends on it)* | this register (no PRD carrier) |
| `DOC02.roles-mechanism` | live *(the stackable-preset mechanism from the architecture side: M:N stacking `F2-10`, OR-across-roles `F2-11`, widest-scope-wins `F2-13`; the v1 six presets widened to the fixed twelve `F2-01`–`F2-03` (DD3); platform-admin operations as a separate, always-audited surface `F2-24`)* | `F2-10` · `F2-11` · `F2-13` · `F2-01` · `F2-24` |
| `DOC04.roles-no-exceptions` | live *(the same law from the data-model side: OR across held roles `F2-11`, widest visibility `F2-13`, no per-user override table — deliberately, D28 — `F2-15`, custom roles deferred (D29) `F2-16`)* | `F2-11` · `F2-13` · `F2-15` · `F2-16` |
| `DOC04.audit-log` | live *(the append-only audit log from the data-model side: the covered-events checklist and append-only law `F2-22` (nothing updates or deletes audit rows), tenant-scoped retention and export `F2-23`, platform-admin reads themselves audited `F2-24`. Task 5 dispositioned the docs/engineering/08 statements of the same log (`DOC08.audit-coverage`/`DOC08.audit-tenant-export`); this row closes the docs/04 key, flagged open since the audit)* | F2 §F2.4 — `F2-22` · `F2-23` · `F2-24` |
| `DOCFC.rbac-deny-default` | live *(the product-law halves: roles stackable M:N `F2-10`; the single OR-across capability check `F2-11` — a capability no held preset grants is denied, and no per-person grant exists `F2-15`; identity is the verified phone number `M01-01`/`M01-05`; deactivate-never-delete `F2-20`)* + excluded *(the one-guard / no-product-wide-sweep mechanism — implementation per §14/DD4)* | `F2-10` · `F2-11` · `F2-15` · `F2-20` · `M01-01` |
| `DOCFC.read-export-exemption` | live *(the guard-carried exemption: read + export always work in every billing state, enforced at `M12-28`; proposal/project caps counted over the billing-cycle window `M12-23`/`M12-30`)* | `M12-28` · `M12-23` · `M12-30` |
| `DOC07.detect-billing-outcome` | live *(detection billing: bill only when a result was returned, failures never bill — `M12-33`'s metering rules; entitlement check before dispatch `M12-18` and `M12-23` (table row 5); "the tenant buys the outcome, not the vendor" is the vendor-neutral posture `M12-03` carries)* | `M12-33` · `M12-18` · `M12-23` |
| `DOC07.quotas` | live *(per-tenant quotas on non-billable external fetches: `M12-37` — proxied imagery/energy/AI services metered per tenant with quotas, as platform cost lines, never tenant bills; the absorbed-cost posture is `BM-24`'s. The source's default numeric values (e.g. solar-data 500/day) are operational tuning data, not PRD content — deliberately not restated)* | `M12-37` · `BM-24` |
| `DOC09.cogs-honesty` | live *(the margin check that keeps pricing honest: per-tenant usage cost rolls up from the ledger beside plan revenue — ledger mechanics `M12-32`/`M12-37` (costs never customer-facing), the ≥40% overage floor it feeds `BM-17`, and the verbatim rate-card caution `BM-26`)* | `M12-32` · `M12-37` · `BM-17` · `BM-26` |
| `DOC14.scope-commitment` | live *(everything in the product journey is committed scope: the no-fourth-category scope law `OV-43`, its three named exceptions `OV-44`, and the suite's document map itself — every capability the key lists owns a module or foundation in `00-README` §Document map (M01–M13, F1–F8))* | `OV-43` · `OV-44` · `00-README` §Document map |
| `DOC14.billing-v1` | live *(billing in v1, trial-only, no free tier: the law `BM-03`; the machine `M12-04` — `trialing` the only non-paying state)* | `BM-03` · `M12-04` |
| `DOC14.no-later-bucket` | live *(verbatim at `OV-43`: no Launch-2, no v1.1, no "later" bucket — the scope commitment survives the retired calendar, per `OD-5`'s row above)* | `OV-43` |
| `DOC14.spec-locked-exclusions` | live *(as non-goals, each mirrored where it belongs: manual-copy-is-the-design D32 (`M06-53`/M06 §5) — **reconciled to owner ruling 2026-08-04 `Q33` (2026-08-06): this one exclusion no longer holds unscoped.** The v1 meaning stays visible, but sending is no longer a spec-locked non-goal: the transactional lane **sends from the tenant's connected official channel where one is connected**, and **composes for a person only where none is connected**, the sole path claiming no delivery. `D32`'s manual-only rule is retired and what survives as a non-goal is the fallback's no-delivery-claim discipline, not the ban on sending (`registers/conflicts.md` row 4; the campaign-lane half was already superseded at `M03-02`). **The other five exclusions in this row are untouched by the ruling** — custom-role builder D29 (`F2-16`), photo-derived measurement D35 (M04 §5), inventory/PO/O&M D9 (M08 §5), the referral credits ledger R15 (M02 §5 — the referral tag + "came from" chip DO ship, `M02-13`/`M02-16`), post-handover generation monitoring C13 (`F5-73`/F5 §5); summarised in the 01 §6 non-goals table)* | 01 §6 · the module §5 sections named in-row |
| `DOC14.lockstep` | live *(web + mobile lockstep as product law: mobile field-first and never a follow-up `OV-08`; full parity at the mobile viewport with no reduced edition `F7-30`; structural web-and-native pairs `F7-39`; the studio's own parity `F7-44`/`M05-08`. The per-slice build framing is process and is not carried)* | `OV-08` · `F7-30` · `F7-39` |
| `DOC14.activation-vs-build` | excluded *(build-process content — the approval-clock enumeration and per-capability fallback routes; §14/DD4)*, with the product-visible half live *(third-party approval gates activation, never scope — stated at `OV-44`(a): the product ships complete and activation follows the third party)* | `OV-44`(a) · remainder: this register (no PRD carrier) |
| `DOC14.launch-gate` | excluded *(release-process content — the all-or-nothing gate checklist is a build/QA artifact; §14/DD4. Every product fact the checklist names is separately live via its own key: the money invariants (`M11-08`-family, F8), customer-link states (F5), Hindi document correctness (F3), the 375 px pass (`F7-30`/`F7-43`), provenance surfaces (F8), the census (`M05-01`), named-link OTP accept (`F5-44`), the voice demo (M07). **Amended 2026-08-07 (owner ruling `Q61`):** as written this row listed *"the offline round-trip (F4)"* among the checklist's live product facts. **There is no offline round-trip** — `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1 makes the read cache and the mutation queue non-goals by name, and the preamble states the product requires a live connection. The only residue is the field-photograph carve-out (`F4-21` / `M04-55`, status on `SCR-M04-07`), which is a one-direction recovery guarantee, not a round-trip, and is not a gate item. The item is struck from the list rather than restated. The gate as a gate carries no product content of its own)* | this register (no PRD carrier) |
| `DOC14.release-valves` | live *(the scope-guard half. **What `modules/M13` §5 actually states, and all it states, is the valve half:** "dashboard polish and analytics depth are the sanctioned release valves (`DOC14.release-valves`), and a vanity wall is out of scope at any depth". **Amended 2026-08-07:** as written, this row attributed a "never-list" to M13 §5 — *never money invariants, tenancy isolation, census rows, the offline round-trip or provenance/honesty surfaces*. **M13 §5 states no such list**, and the word "offline" appears nowhere in that file, so the attribution is withdrawn. The source key's own never-list is dispositioned where each item lives, not here: money invariants at `foundations/F8` / `modules/M11`, tenancy isolation at `foundations/F2`, census rows at `DOC14.census-quality-gate` (`M05-01`, M05 §1's "NEVER census rows"), provenance/honesty surfaces at `foundations/F8`. Its **"offline round-trip" item is void** under owner ruling `Q61` — the capability was removed and F4 §5 · Non-goals, bullet 1 makes the cache and the queue non-goals by name — so nothing carries it and nothing should: it is struck, not relocated)* + excluded *(the build-process framing per §14/DD4)*. **Disposition of record per convention 6** — the M13 block's pointer to "Task 9's 00-README disposition" resolved to no row; it resolves here | M13 §5 (the valve half, as stated there) · the never-list's surviving items at `foundations/F8`, `foundations/F2`, `modules/M11` and `M05-01` |
| `UXG-A11Y-01` | live *(appendix row, outside UXG-01–27 — closed in source 2026-07-30: the AvatarGroup contrast finding, whose component-level fix was itself superseded by the `UXG-A11Y-03` token fix; the deliberate DECLARED_PAIRS omission is engineering, excluded per §14. Floor and authority per convention 7)* | `F7-23` (N4) · `F7-01`/`F7-03` (token authority) |
| `UXG-A11Y-02` | live *(appendix row — closed in source 2026-07-30 at the token: `--danger` darkened to a passing contrast on surface. Floor and authority per convention 7)* | `F7-23` (N4) · `F7-01`/`F7-03` |
| `UXG-A11Y-03` | live *(appendix row — closed in source 2026-07-30 at the token: `--text-secondary` darkened, fixing the SegmentedControl inactive label and the pair behind `UXG-A11Y-01`; the documented coverage-gate blind spot is engineering, excluded per §14. Floor and authority per convention 7)* | `F7-23` (N4) · `F7-01`/`F7-03` |
| `UXG-PAR-01` | live *(appendix row — closed in source 2026-08-01: the RN OTP error-state clearing fix, with the original "RN never surfaces a failed resend" finding recorded as wrong and corrected. The governing law is structural parity — `F7-39`'s web-and-native pairs, `F7-30`'s no-reduced-edition rule; the still-open resend-feedback half of the same surface is `UXG-PAR-05`'s row, `Q20`(d))* | `F7-39` · `F7-30` |
| `UXG-PAR-02` | live *(routed to `Q20` — auth-rebuild parity law (b): success-dwell timing before the post-auth handoff; the recorded unification is "a recommendation standing in for a ruling, not a ruling". Owner decision pending; blocks the auth rebuild. Routed per the ledger appendix note and Task 12 convention 4)* | `registers/open-questions.md` Q20 · M01 §6 M01-Q3 |
| `UXG-PAR-03` | live *(routed to `Q20` — auth-rebuild parity law (a): signed-out routing for an authenticated URL, decided once for both platforms; the old redirect rule went with the auth teardown and was deliberately not re-invented)* | `registers/open-questions.md` Q20 · M01 §6 M01-Q3 |
| `UXG-PAR-04` | live *(routed to `Q20` — auth-rebuild parity law (c): the OTP-submission connectivity contract, which two contradictory platform readings of one shared API had left ambiguous. **`Q20` is PARTLY SUPERSEDED 2026-08-07 by owner ruling `Q61` on exactly this law**, and this is the one of its four parity laws that moved: `F4-01` defined the three-term vocabulary (offline-capable / online-first / online-only) and was **deleted** with the offline capability, so there is no vocabulary left to state the contract in. The parity obligation itself survives, restated without it — OTP submission is simply an online action that fails fast and honestly on failure, `F8-36` — and the ambiguity the gap named is still closed, now because there is only one possible reading. `Q20`'s other three laws are untouched)* | `registers/open-questions.md` `Q20` (PARTLY SUPERSEDED 2026-08-07 by `Q61`) · `F8-36` · M01 §6 M01-Q3 |
| `UXG-PAR-05` | live *(routed to `Q20` — auth-rebuild parity law (d): resend feedback visible on every platform)* | `registers/open-questions.md` Q20 · M01 §6 M01-Q3 |
| `CG-8` | live *(DESIGN-FOR carried with its three-way split intact: the committed ramp is §M05.15 — blocks/tables/zones `M05-88`, the scale tiers through trackers-with-GCR-backtracking and DEM terrain `M05-89`–`M05-92`; the deferrals (terrain-following articulation, utility autorouting) are M05 §5's scale-program deferrals with their explicit re-evaluation triggers; AutoCAD-native is never — browser-native identity, held with `CG-matrix.21`'s row below. Directive 9's investment-into-the-moat framing is `M05-87`'s)* | `M05-87`–`M05-92` (§M05.15) · M05 §5 |
| `CG-11` | live *(SKIP-DELIBERATELY carried as the tier law: the axis is capacity — kW ceiling, creation counts, metered bundles, storage — `BM-12`, on `BM-05`'s every-module-every-tier conviction; no per-design pay-as-you-go pricing exists anywhere in the suite. The Starter floor that serves seasonal micro-installers, and the recorded revisit trigger (churn on that floor), are IN book data at `BM-41`)* | `BM-05` · `BM-12` · `BM-41` |
| `CG-12` | live *(SKIP-DELIBERATELY carried as the trial-only law: a trial exists, a permanently free tier does not, ever — `BM-03`; `trialing` is the only non-paying state `M12-04`, the trial model `M12-52`. Confirmed twice post-overlay: owner directive 4 and `UD-5`)* | `BM-03` · `M12-04` · `M12-52` |
| `CG-16` | live *(the product-level residue only: tenant API keys/quotas as an Enterprise commercial arrangement — `BM-15`'s "custom integrations / the public API surface"; `CG-19` is the same engineering's packaging row)* + excluded *(the OpenAPI-emission mechanics — implementation per §14/DD4, recorded here per the ledger's own instruction and never written into a module; no tenant-facing key-management surface is asserted anywhere, because the source does not state one)* | `BM-15` |
| `CG-19` | live *(the Enterprise packaging of `CG-16`'s engineering: custom integrations / partner API as a bespoke commercial arrangement `BM-15`, reachable — like everything — only through entitlements (`M12-15`); no self-serve Enterprise mechanics, M12 §5)* | `BM-15` · `M12-15` |
| `CG-reslink.1` | live *(CRM + project management on every tier: the CRM module whole (`M02-01`-family), the canonical 9-stage chain `M08-08` (R2's full chain, post-overlay correct), the every-tier claim `BM-05`'s first clause ("CRM and projects"). The module halves were authored by Tasks 13/18; this row closes the coverage-row key itself)* | `M02-01` · `M08-08` · `BM-05` |
| `CG-reslink.3` | live *(3D export & SLD on every tier: SVG/PNG/DXF/PDF exports `M05-67` (SC.10-9.32–.37), the four title-blocked drawing sheets `M05-62` (§M05.10). The held contrast with `CG-matrix.21`'s "✖ v1" is recorded on that row: DXF-from-studio ships; PVsyst/SketchUp/AutoCAD-native do not)* | `M05-67` · `M05-62` (§M05.10) |
| `CG-reslink.5` | live *(AC/DC & earthing layout on every tier: SLD content with DCDB/ACDB (fuse, SPD, isolators), earthing pits and the schedule tables `M05-63` (SC.10-9.03–.15); DC/AC cable routing `M05-45`/`M05-46`; the "IS/IEC ladders" are the market pack's standards declaration — `F1-20`'s pack-declared standards labels, IS being the IN instance, per the market-neutrality constraint. Flagged "suspect" because Task 6 cited it as grounding only; this is its disposition row)* | `M05-63` · `M05-45` (§M05.7/§M05.10) · `F1-20` |
| `CG-reslink.6` | live *(tin-shed support on every tier: the census roof-type set carries Metal shed — `M05-25` (SC.10-3.30; the source's `metal_shed` enum value) — and the mounting-structure surface it pairs with is `M05-47`'s parametric structure. Partial-coverage note, stated honestly: the source's "monorail structure" wording names a preset the adopted-verbatim census does not carry by that name; the census baseline (`M05-01`) is not widened by this gate)* | `M05-25` · `M05-47` |
| `CG-reslink.8` | live *(advanced shadow analysis on every tier: per-panel raycast solar access and the monthly irradiance heatmap `M05-45` (VIEW family)/`M05-52`; sun-path simulation and sun controls `M05-51`; census SC.10-6.04–.17 and SC.10-7.01–.17)* | `M05-45` · `M05-51` · `M05-52` (§M05.7–§M05.8) |
| `CG-reslink.9` | live *(detailed energy reports on every tier: full losses breakdown, specific yield, performance ratio and the 25-year projection with degradation — `M05-54` (SC.10-7.32–.41), provenance law intact per `R5`/`F8-08`)* | `M05-54` (§M05.8) |
| `CG-reslink.10` | live *(all obstruction types on every tier: the census's eleven types with icons and default dimensions `M05-32`, the bridging chain and convert-to-rooftop-platform `M05-35` (SC.10-4.34–.41) — §M05.5, census A.10-4. The "11 obstruction types" count cross-checked against the census as the ledger instructed)* | `M05-32` · `M05-35` (§M05.5) |
| `CG-reslink.11` | live *(design location editing on every tier: touch-honest pin placement `M05-16`, the >25 m relocation wipe-guard made clear and undoable `M05-19` (SC.10-2.20), two-point calibration + expert north offset `M05-26`)* | `M05-16` · `M05-19` · `M05-26` |
| `CG-reslink.13` | live *(ground mount on every tier, flat v1: ground-mount/open-access as a normal option `M05-15`, ground foundations `M05-47`/`M05-53`; trackers + terrain are the scale program's Tier C `M05-92` — the flat-v1/trackers-terrain-later split matches `CG-8`'s committed-ramp wording)* | `M05-15` · `M05-47` · `M05-92` |
| `CG-reslink.14` | live *(advanced structures on every tier: structure presets + full parametric customisation — table settings `M05-47`, the 3D edit cards `M05-53` — always under the structure disclaimer (`F8-25`, cited there; never a computed safety verdict))* | `M05-47` · `M05-53` |
| `CG-reslink.15` | live *(priority support — the first recorded exception to the every-tier conviction: support is the one ladder also climbed, carried as IN book service-terms data at `BM-41` (in-app / +WhatsApp / priority + onboarding call / named contact) under `BM-15`'s commercial-vs-capability reading; recorded so `CG-17`'s every-feature claim is not overstated)* | `BM-41` (service terms) · `BM-15` |
| `CG-reslink.16` | live *(unlimited projects — the second recorded exception: an entitlement cap, Starter capped at 10 active projects (owner directive), carried as IN book data `BM-41` on the capacity axis `BM-12`(b), enforced as the active-projects gate `M12-23` (table row 3))* | `BM-41` · `BM-12` · `M12-23` |
| `CG-reslink.18` | live *(custom integrations — the fourth recorded exception, Enterprise-only: the same content as `CG-19`'s row, carried at `BM-15`)* | `BM-15` |
| `CG-reslink.19` | live *(SLA / dedicated account manager — the fifth recorded exception: Enterprise sales-assisted commercial structure `BM-15`, named-contact support in the IN book `BM-41`. The deliberate non-commitment is honoured: the SLA is "at sales discretion (not pre-committed)" and no contractual service-level guarantee is written anywhere in this suite)* | `BM-15` · `BM-41` |
| `CG-matrix.1` | live *(the flagship line itself — 3D rooftop design + shading, "✔ flagship": the conviction `OV-21`, the census-grounded module with its never-shrinking baseline `M05-01`, the 3D/shadow/energy surface §M05.8 (`M05-51`–`M05-54`))* | `OV-21` · `M05-01` · §M05.8 |
| `CG-matrix.7` | live *(electrical sizing + autostring + SLD: stringing with the locked electrical rules `M05-48`, the validation ladder with the expressly preserved hard gate `M05-49`, the SLD `M05-63`; the row's "IEC 62548" naming is the standards ladder the market pack declares (`F1-20`) — no standards body is named in the module body. Dup-check performed per convention 8: this is the key's only disposition row)* | `M05-48` · `M05-49` · `M05-63` · `F1-20` |
| `CG-matrix.8` | live *(the honest "◐": MLPE components come from the catalog — `M05-40` (topology + MLPE choice), `M01-45` (catalog holds micro-inverters/optimisers) — with **no MLPE electrical model**, M05 §5's recorded non-goal with its demand-driven trigger; the deliberate "◐" is `CG-15`'s rows, Tasks 12/15)* | `M05-40` · `M01-45` · M05 §5 |
| `CG-matrix.16` | live *(the tax-native money path line, "✔ to the paisa": one chain reconciling end to end to the currency's minor unit `M11-08`, ledger-derived tranche state `M11-10`; "GST-native" is the IN pack's tax-scheme instance (`F1-28`/`F1-13`) — the module body is scheme-generic)* | `M11-08` · `M11-10` · `F1-28` |
| `CG-matrix.17` | live *(the EMI-calculator half — "✖ EMI calc only" — `M06-40`)* + excluded *(the financing-marketplace half → M06 §5, designed-for as a portable capability, never load-bearing — the `CG-4` seam row's precedent, Task 16)* | `M06-40` · M06 §5 |
| `CG-matrix.20` | live *(utility-scale "◐ scale program (committed ramp)": the three-regime program §M05.15 — `M05-87`/`M05-88` committed, Tier C trackers/terrain `M05-92`, honesty-at-scale `M05-94`; the deferrals recorded at M05 §5 with their triggers)* | `M05-87` · `M05-88` · `M05-92` (§M05.15) |
| `CG-matrix.21` | excluded *(the "✖ v1" state carried honestly: PVsyst/SketchUp/AutoCAD-native exports are post-launch designed-for per `CG-9`'s verdict, recorded at M06 §5 (bankable-file exports; Task 16's `CG-9` row — the studio-side emitter claim is pass-two territory per that row). The held contrast is stated, not resolved: DXF/SVG/PNG/PDF from the studio DOES ship on every tier (`M05-67`, `CG-reslink.3`'s row above). M05 §5 carries no CAD-export bullet and this gate deliberately adds none — the census baseline (`M05-01`) does not name the capability, and adding studio non-goals is pass-two territory)* | M06 §5 (`CG-9` seam) · contrast `M05-67` |
| `CG-matrix.22` | live *(the "◐ keys later" residue: the public-API line's product content is its Enterprise packaging — `BM-15`, the same carrier as `CG-16`'s row; the ledger's own target column routes this row to `04-business-model.md`)* + excluded *(the OpenAPI-emission mechanics per §14/DD4)* | `BM-15` |

## Studio step1-setup (Sitting 1, 2026-08-05)

Conventions: range rows per the census-block precedent; keys expand from docs/prd/_process/studio/inventory/step1-setup.md (115 keys, verified complete union, no dups). POC-DEFECT keys .11/.21 carry owner rulings S1-1/S1-2; uncertain keys .26/.28/.63/.87 resolved per rulings file (.87 = engineering note, no requirement). Census: SC.10-2.01 gap closed by MS1-01 (BRIEF S1-4); 20 A.10-1 cross-check entries remain owned by their sittings (s5/s10) per the ledger's unmatched table; SC.10-2.16/.20 directives absorbed at MS1-16/MS1-20.

| source key | disposition | PRD ref |
|---|---|---|
| `CODE.step1-setup{.1}` | live | `MS1-08 (replaced by walkthrough)` |
| `CODE.step1-setup{.2, .22}` | live | `MS1.1 structure (consumed: section chrome)` |
| `CODE.step1-setup{.3}` | live | `MS1-07` |
| `CODE.step1-setup{.4–.6}` | live | `MS1-02` |
| `CODE.step1-setup{.7–.10}` | live | `MS1-03 · MS1-04` |
| `CODE.step1-setup{.11}` | live | `MS1-09 (POC-DEFECT fixed, S1-1)` |
| `CODE.step1-setup{.12–.14}` | live | `MS1-10` |
| `CODE.step1-setup{.15–.16}` | live | `MS1-05` |
| `CODE.step1-setup{.17}` | live | `MS1-06` |
| `CODE.step1-setup{.18–.20}` | live | `MS1-11` |
| `CODE.step1-setup{.21}` | live | `MS1-12 (POC-DEFECT fixed, S1-2)` |
| `CODE.step1-setup{.23–.24}` | live | `MS1-13` |
| `CODE.step1-setup{.25–.26, .56–.57}` | live | `MS1-17` |
| `CODE.step1-setup{.27–.28}` | live | `MS1-14 (resolves .28)` |
| `CODE.step1-setup{.29, .31–.32}` | live | `MS1-15` |
| `CODE.step1-setup{.30}` | live | `MS1-16 (S1-5a)` |
| `CODE.step1-setup{.33–.35, .41}` | live | `MS1-18 (incl. confirmed-state chrome .41)` |
| `CODE.step1-setup{.36}` | live | `MS1-19` |
| `CODE.step1-setup{.37–.38}` | live | `MS1-20 (S1-5b)` |
| `CODE.step1-setup{.39–.40, .42}` | live | `MS1-22` |
| `CODE.step1-setup{.43}` | live | `MS1-21` |
| `CODE.step1-setup{.44–.48}` | live | `MS1-23` |
| `CODE.step1-setup{.49–.55}` | live | `MS1-24` |
| `CODE.step1-setup{.58–.59, .98–.100}` | live | `MS1-28 (tile/scale math)` |
| `CODE.step1-setup{.60, .110–.114}` | live | `MS1-30 (incl. scale-bar .60)` |
| `CODE.step1-setup{.61, .64–.65}` | live | `MS1-25` |
| `CODE.step1-setup{.62–.63}` | live | `MS1-26 (S1-5e, resolves .63)` |
| `CODE.step1-setup{.66–.67}` | live | `MS1-27` |
| `CODE.step1-setup{.68–.89, .109, .115}` | live | `engineering-internal, consumed by MS1-25..31 + MS2 drawing law (per doc §4; .75-.77/.86 rule-source forward to MS2; .87 engineering note)` |
| `CODE.step1-setup{.90–.97}` | live | `MS1-31` |
| `CODE.step1-setup{.101–.108}` | live | `MS1-29 (pinch gap .108 → ruled at MS2/MS6 per census SC.10-3.42)` |

## Studio step2-roof (Sitting 2, 2026-08-05)

Conventions: range rows; keys expand from the two Sitting-2 ledgers (105 drawing + 78 AI = 183, verified complete union no dups). POC-DEFECT keys: drawing.87 (pinch) fixed by S2-1; ai.62 (photo mode) wired by S2-2 at P1; ai.72 (cross-check) wired by S2-3. Census A.10-3: 42/42 matched across both halves; SC.10-3.42 closed by MS2-03. M04 alignment rulings S2-4a/b/c bind MS2-37/38/39. gemini-client.test.ts claim corrected: sitting-2 evidence (file-claims note appended).

| source key | disposition | PRD ref |
|---|---|---|
| `CODE.step2-roof-drawing{.1–.10}` | live | `MS2-01` |
| `CODE.step2-roof-drawing{.11}` | live | `MS2-02` |
| `CODE.step2-roof-drawing{.87}` | live | `MS2-03 (S2-1; POC-DEFECT .87 fixed)` |
| `CODE.step2-roof-drawing{.24–.25, .88}` | live | `MS2-04 (S2-5.4)` |
| `CODE.step2-roof-drawing{.12, .19}` | live | `MS2-05` |
| `CODE.step2-roof-drawing{.13–.17}` | live | `MS2-06` |
| `CODE.step2-roof-drawing{.18}` | live | `MS2-07` |
| `CODE.step2-roof-drawing{.20}` | live | `MS2-08` |
| `CODE.step2-roof-drawing{.21–.22}` | live | `MS2-09` |
| `CODE.step2-roof-drawing{.23}` | live | `MS2-10` |
| `CODE.step2-roof-drawing{.26, .29}` | live | `MS2-11 (S2-5.8)` |
| `CODE.step2-roof-drawing{.27}` | live | `MS2-12 (S2-5.7)` |
| `CODE.step2-roof-drawing{.28}` | live | `MS2-13` |
| `CODE.step2-roof-drawing{.30–.31}` | live | `MS2-14` |
| `CODE.step2-roof-drawing{.33–.37}` | live | `MS2-15` |
| `CODE.step2-roof-drawing{.38–.39}` | live | `MS2-16 (S2-1 toggle)` |
| `CODE.step2-roof-drawing{.40–.42}` | live | `MS2-17 (S2-5.1)` |
| `CODE.step2-roof-drawing{.43, .45}` | live | `MS2-18` |
| `CODE.step2-roof-drawing{.44}` | live | `MS2-19 (S2-5.2)` |
| `CODE.step2-roof-drawing{.46, .50}` | live | `MS2-20` |
| `CODE.step2-roof-drawing{.47–.48}` | live | `MS2-21` |
| `CODE.step2-roof-drawing{.49, .95}` | live | `MS2-22` |
| `CODE.step2-roof-drawing{.51–.52, .56–.57}` | live | `MS2-23` |
| `CODE.step2-roof-drawing{.53, .58–.62}` | live | `MS2-24` |
| `CODE.step2-roof-drawing{.55}` | live | `MS2-25` |
| `CODE.step2-roof-drawing{.54}` | live | `MS2-26` |
| `CODE.step2-roof-drawing{.63–.64, .66–.67}` | live | `MS2-27 (S2-5.6)` |
| `CODE.step2-roof-drawing{.65}` | live | `MS2-28` |
| `CODE.step2-roof-drawing{.68–.69}` | live | `MS2-29 (S2-5.5)` |
| `CODE.step2-roof-drawing{.76–.77}` | live | `MS2-30` |
| `CODE.step2-roof-drawing{.32, .70–.71}` | live | `MS2-31` |
| `CODE.step2-roof-drawing{.72–.74}` | live | `MS2-32 (S2-5.3)` |
| `CODE.step2-roof-drawing{.75, .78}` | live | `MS2-33` |
| `CODE.step2-roof-drawing{.79–.80}` | live | `MS2-34` |
| `CODE.step2-roof-drawing{.81–.83}` | live | `MS2-35` |
| `CODE.step2-roof-drawing{.84–.86}` | live | `MS2-36` |
| `CODE.step2-roof-drawing{.89–.91}` | live | `MS2-39 (ghost UI half)` |
| `CODE.step2-roof-drawing{.92}` | live | `MS2-43 (provenance stamp)` |
| `CODE.step2-roof-drawing{.93–.94}` | live | `MS3 forward (obstruction factory + platform conversion — surface at MS3)` |
| `CODE.step2-roof-drawing{.96–.100}` | live | `MS6 forward (segment-engine laws — surface at MS6; recorded MS2 §4)` |
| `CODE.step2-roof-drawing{.101–.105}` | live | `MS8 forward (drawing-sheet primitives — surface at MS8; recorded MS2 §4)` |
| `CODE.step2-roof-ai{.1–.5, .26, .72}` | live | `MS2-37 (S2-3 wires .72, S2-4c pinned tile)` |
| `CODE.step2-roof-ai{.6–.8, .10, .12–.13, .15–.23, .73–.74, .76}` | live | `MS2-44` |
| `CODE.step2-roof-ai{.9, .43–.51}` | live | `MS2-40` |
| `CODE.step2-roof-ai{.24–.25, .27–.42}` | live | `MS2-41` |
| `CODE.step2-roof-ai{.14, .52–.55}` | live | `MS2-39` |
| `CODE.step2-roof-ai{.56–.59}` | live | `MS2-43` |
| `CODE.step2-roof-ai{.60–.71}` | live | `MS2-42 (S2-2 wires .62)` |
| `CODE.step2-roof-ai{.75, .77}` | live | `MS2-28 (suggestion artifact half)` |
| `CODE.step2-roof-ai{.78}` | live | `MS2-38 (S2-4a/b; metering contract .78)` |
| `CODE.step2-roof-ai{.11}` | live | `MS2-44 (scope rule → non-goal)` |

## Studio step3-obstructions (Sitting 3, 2026-08-05)

Conventions: range rows; 54 keys, complete union no dups. POC-DEFECT keys .8/.12/.17/.29/.30/.32 fixed by rulings S3-2/S3-5.2/S3-5.1/S3-3/S3-3/S3-1; uncertain .19 resolved by S3-5.4. Census A.10-4: 42/42 matched (3 as defects, now ruled). Suite touch law (S2-1+S3-4) recorded for the overview doc.

| source key | disposition | PRD ref |
|---|---|---|
| `CODE.step3-obstructions{.1, .6–.7}` | live | `MS3-01` |
| `CODE.step3-obstructions{.2}` | live | `MS3-02` |
| `CODE.step3-obstructions{.3–.4}` | live | `MS3-03` |
| `CODE.step3-obstructions{.5}` | live | `MS3-04` |
| `CODE.step3-obstructions{.8}` | live | `MS3-05 (S3-2; POC-DEFECT .8 fixed)` |
| `CODE.step3-obstructions{.9}` | live | `MS3-06` |
| `CODE.step3-obstructions{.10}` | live | `MS3-07` |
| `CODE.step3-obstructions{.11}` | live | `MS3-08` |
| `CODE.step3-obstructions{.12}` | live | `MS3-09 (S3-5.2; POC-DEFECT .12 fixed)` |
| `CODE.step3-obstructions{.13}` | live | `MS3-10` |
| `CODE.step3-obstructions{.14}` | live | `MS3-11` |
| `CODE.step3-obstructions{.15}` | live | `MS3-12` |
| `CODE.step3-obstructions{.16}` | live | `MS3-13` |
| `CODE.step3-obstructions{.17}` | live | `MS3-14 (S3-5.1; POC-DEFECT .17 fixed)` |
| `CODE.step3-obstructions{.18}` | live | `MS3-15` |
| `CODE.step3-obstructions{.41}` | live | `MS3-16 (S3-5.6)` |
| `CODE.step3-obstructions{.19}` | live | `MS3-17 (S3-5.4 resolves .19)` |
| `CODE.step3-obstructions{.20}` | live | `MS3-18` |
| `CODE.step3-obstructions{.21–.22}` | live | `MS3-19` |
| `CODE.step3-obstructions{.23}` | live | `MS3-20 (S3-4)` |
| `CODE.step3-obstructions{.25}` | live | `MS3-21 (S3-4)` |
| `CODE.step3-obstructions{.26}` | live | `MS3-22` |
| `CODE.step3-obstructions{.27}` | live | `MS3-23` |
| `CODE.step3-obstructions{.24}` | live | `MS3-24 (S3-5.3)` |
| `CODE.step3-obstructions{.28}` | live | `MS3-25` |
| `CODE.step3-obstructions{.29}` | live | `MS3-26 (S3-3; POC-DEFECT .29 fixed)` |
| `CODE.step3-obstructions{.30–.31}` | live | `MS3-27 (S3-3; POC-DEFECT .30 fixed)` |
| `CODE.step3-obstructions{.32}` | live | `MS3-28 (S3-1; POC-DEFECT .32 fixed)` |
| `CODE.step3-obstructions{.33}` | live | `MS3-29` |
| `CODE.step3-obstructions{.34–.35}` | live | `MS3-30` |
| `CODE.step3-obstructions{.36}` | live | `MS3-31` |
| `CODE.step3-obstructions{.37}` | live | `MS3-32` |
| `CODE.step3-obstructions{.38–.39}` | live | `MS3-33 (S3-5.5 resolves .38 note)` |
| `CODE.step3-obstructions{.40}` | live | `MS3-34` |
| `CODE.step3-obstructions{.42}` | live | `MS3-35` |
| `CODE.step3-obstructions{.43}` | live | `MS3-36` |
| `CODE.step3-obstructions{.44}` | live | `MS3-37` |
| `CODE.step3-obstructions{.45–.46}` | live | `MS3-38` |
| `CODE.step3-obstructions{.47–.48}` | live | `MS3-39` |
| `CODE.step3-obstructions{.49–.54}` | live | `MS3-40` |

## Studio step4-components (Sitting 4, 2026-08-05)

Conventions: range rows; 92 keys, complete union no dups. 14 POC-DEFECTs all ruled (S4-1..S4-5); census A.10-5 41/41 matched with 9 divergences now closed by DD12 alignment (S4-1). Data-file rows .81-.86 (capability model) and .87-.92 (steel profiles) are recorded here (their files) and surfaced at MS3/MS5 — stated once, cited there.

| source key | disposition | PRD ref |
|---|---|---|
| `CODE.step4-components{.1–.3}` | live | `MS4-01 (S4-1 adds Battery)` |
| `CODE.step4-components{.4–.5}` | live | `MS4-02 (S4-4.1 fixes .5)` |
| `CODE.step4-components{.6}` | live | `MS4-03` |
| `CODE.step4-components{.7}` | live | `MS4-04 (S4-2/S4-4.5)` |
| `CODE.step4-components{.8, .74}` | live | `MS4-05 (S4-1 fixes .8)` |
| `CODE.step4-components{.23–.24}` | live | `MS4-06 (S4-1 retires .23/.24 captions)` |
| `CODE.step4-components{.72–.73}` | live | `MS4-07 (S4-1 activates)` |
| `CODE.step4-components{.75}` | live | `MS4-09` |
| `CODE.step4-components{.9–.14, .22}` | live | `MS4-10 (S4-4.2/.3 fix .13/.22)` |
| `CODE.step4-components{.15–.19, .21}` | live | `MS4-11 (S4-4.4 fixes .21)` |
| `CODE.step4-components{.20}` | live | `MS4-12 (S4-2 fixes .20)` |
| `CODE.step4-components{.76–.77}` | live | `MS4-13` |
| `CODE.step4-components{.25–.26, .33}` | live | `MS4-14 (S4-4.5 fixes .26)` |
| `CODE.step4-components{.27–.28}` | live | `MS4-15 (S4-4.7 fixes .28)` |
| `CODE.step4-components{.30–.32}` | live | `MS4-16 (S4-5.2 fixes .32)` |
| `CODE.step4-components{.29}` | live | `MS4-17 (S4-5.1 fixes .29)` |
| `CODE.step4-components{.34–.36}` | live | `MS4-18` |
| `CODE.step4-components{.37–.38}` | live | `MS4-19 (S4-3 fixes .37)` |
| `CODE.step4-components{.40–.42}` | live | `MS4-20 (S4-3/S4-5.4 fix .42)` |
| `CODE.step4-components{.39}` | live | `MS4-21 (S4-4.6 fixes .39)` |
| `CODE.step4-components{.43–.45}` | live | `MS4-22` |
| `CODE.step4-components{.78–.79}` | live | `MS4-23` |
| `CODE.step4-components{.46–.47}` | live | `MS4-27` |
| `CODE.step4-components{.48–.49}` | live | `MS4-28` |
| `CODE.step4-components{.50}` | live | `MS4-29` |
| `CODE.step4-components{.51–.61}` | live | `MS4-30` |
| `CODE.step4-components{.62–.63}` | live | `MS4-31` |
| `CODE.step4-components{.64–.66}` | live | `MS4-32` |
| `CODE.step4-components{.67–.69}` | live | `MS4-33` |
| `CODE.step4-components{.70–.71}` | live | `MS4-34` |
| `CODE.step4-components{.80}` | live | `MS4-08 (S4-5.3, M05-43)` |
| `CODE.step4-components{.81–.86}` | live | `MS3-15/28/30/31 (capability model recorded here, surfaced at MS3)` |
| `CODE.step4-components{.87–.92}` | live | `MS5 forward (steel profile catalog recorded here, surfaced at MS5)` |

## Studio step6-editor (Sitting 5, 2026-08-05)

Conventions: range rows across three ledgers (93 layout + 50 scene3d + 72 structures = 215 keys, each family a verified complete union with no dups). 16 POC-DEFECTs all ruled (S5-1..S5-5). Census A.10-6 + A.10-7 matched per ledger halves. Steel-profile catalog rows (structures.45) are recorded at MS4 §4 (their data file) and cited here.

| source key | disposition | PRD ref |
|---|---|---|
| `CODE.step6-layout{.1–.3}` | live | `MS6-01` |
| `CODE.step6-layout{.4}` | live | `MS6-02` |
| `CODE.step6-layout{.5–.6}` | live | `MS6-03` |
| `CODE.step6-layout{.7–.14}` | live | `MS6-04` |
| `CODE.step6-layout{.15, .20, .29}` | live | `MS6-06 (S5-5.2 fixes .29)` |
| `CODE.step6-layout{.16–.17, .93}` | live | `MS6-10 (S5-5.7)` |
| `CODE.step6-layout{.18}` | live | `MS6-05 (S5-4 fixes .18)` |
| `CODE.step6-layout{.19, .82–.84}` | live | `MS6-11` |
| `CODE.step6-layout{.21–.22}` | live | `MS6-07` |
| `CODE.step6-layout{.23}` | live | `MS6-08` |
| `CODE.step6-layout{.24–.28, .41, .85}` | live | `MS6-09` |
| `CODE.step6-layout{.30–.31}` | live | `MS6-24` |
| `CODE.step6-layout{.32}` | live | `MS6-25 (S5-1c fixes .32)` |
| `CODE.step6-layout{.33}` | live | `MS6-26` |
| `CODE.step6-layout{.34–.38}` | live | `MS6-12` |
| `CODE.step6-layout{.39–.40}` | live | `MS6-13` |
| `CODE.step6-layout{.42–.45, .48, .51}` | live | `MS6-14` |
| `CODE.step6-layout{.46}` | live | `MS6-15 (S5-5.1 fixes .46)` |
| `CODE.step6-layout{.47, .49}` | live | `MS6-16` |
| `CODE.step6-layout{.50, .52–.53}` | live | `MS6-17` |
| `CODE.step6-layout{.54–.55}` | live | `MS6-18` |
| `CODE.step6-layout{.56–.58}` | live | `MS6-19` |
| `CODE.step6-layout{.59–.62}` | live | `MS6-20 (S2-5.5 law fixes .62)` |
| `CODE.step6-layout{.63–.64}` | live | `MS6-21` |
| `CODE.step6-layout{.65}` | live | `MS6-22 (S5-1a fixes .65)` |
| `CODE.step6-layout{.66}` | live | `MS6-23` |
| `CODE.step6-layout{.67–.76}` | live | `MS6-27` |
| `CODE.step6-layout{.77}` | live | `MS6-28` |
| `CODE.step6-layout{.78–.80}` | live | `MS6-29 (S5-2 removes .80 cap)` |
| `CODE.step6-layout{.81}` | live | `MS6-13 (keyboard set + touch law)` |
| `CODE.step6-layout{.86}` | live | `MS6-24 (string-invalidation policy)` |
| `CODE.step6-layout{.87}` | live | `MS6-38 (canonical pose)` |
| `CODE.step6-layout{.88–.91}` | live | `MS6-52` |
| `CODE.step6-layout{.92}` | live | `MS6-53` |
| `CODE.step6-scene3d{.1–.6}` | live | `MS6-30 (S5-3 fixes .6)` |
| `CODE.step6-scene3d{.7–.16}` | live | `MS6-31 (S5-5.5 fixes .8)` |
| `CODE.step6-scene3d{.17–.19}` | live | `MS6-32 (S5-5.6/.8)` |
| `CODE.step6-scene3d{.20–.24}` | live | `MS6-33` |
| `CODE.step6-scene3d{.25–.26}` | live | `MS6-34` |
| `CODE.step6-scene3d{.27–.30}` | live | `MS6-35` |
| `CODE.step6-scene3d{.31–.37}` | live | `MS6-36` |
| `CODE.step6-scene3d{.38–.42}` | live | `MS6-37` |
| `CODE.step6-scene3d{.43–.50}` | live | `MS6-38` |
| `CODE.step6-structures{.1–.4}` | live | `MS6-39 (S5-1b fixes .52/.68 root cause)` |
| `CODE.step6-structures{.5–.8}` | live | `MS6-40` |
| `CODE.step6-structures{.9}` | live | `MS6-41` |
| `CODE.step6-structures{.10–.11, .13}` | live | `MS6-42` |
| `CODE.step6-structures{.12, .70}` | live | `MS6-43` |
| `CODE.step6-structures{.14–.15, .29–.30, .56}` | live | `MS6-44` |
| `CODE.step6-structures{.16, .57–.62}` | live | `MS6-45` |
| `CODE.step6-structures{.17–.19}` | live | `MS6-46` |
| `CODE.step6-structures{.20–.21, .24, .71–.72}` | live | `MS6-50` |
| `CODE.step6-structures{.22}` | live | `MS6-38 (standoff)` |
| `CODE.step6-structures{.23, .25}` | live | `MS6-22 (S5-1a)` |
| `CODE.step6-structures{.26–.28, .46–.53, .55}` | live | `MS6-48 (S5-5.4 fixes .51)` |
| `CODE.step6-structures{.31–.32}` | live | `MS6-35` |
| `CODE.step6-structures{.33, .36–.38, .54}` | live | `MS6-47 (S5-1b)` |
| `CODE.step6-structures{.34}` | live | `MS6-48 (inert-with-reason)` |
| `CODE.step6-structures{.35}` | live | `MS6-47 (shape override)` |
| `CODE.step6-structures{.39}` | live | `MS6-39 (ground resolver)` |
| `CODE.step6-structures{.40–.44}` | live | `MS6-49 (S5-5.3 fixes .41)` |
| `CODE.step6-structures{.45}` | live | `MS4-refs (profile catalog recorded at MS4 §4)` |
| `CODE.step6-structures{.63–.68}` | live | `MS6-51 (S5-1b)` |
| `CODE.step6-structures{.69}` | live | `MS6-48 (structure preview)` |

## Studio step7-proposal (Sitting 6, 2026-08-05)

Conventions: range rows; 156 keys, complete union no dups (largest single-area ledger of the pass). 29 POC-DEFECTs + 4 uncertains all ruled (S6-1..S6-7). Census A.10-8 20/20 matched; 99 rows beyond census. M06 conflicts recorded at MS7 §4, not silently resolved.

| source key | disposition | PRD ref |
|---|---|---|
| `CODE.step7-proposal{.1–.3}` | live | `MS7-01 (S6-7.7 fixes .2/.3)` |
| `CODE.step7-proposal{.4}` | live | `MS7-11 (header/gate context)` |
| `CODE.step7-proposal{.5, .44, .67}` | live | `MS7-15` |
| `CODE.step7-proposal{.6}` | live | `F7 (styling debt → design system)` |
| `CODE.step7-proposal{.7–.8}` | live | `MS7-02` |
| `CODE.step7-proposal{.9}` | live | `MS7-03 (S6-7.5 fixes .9)` |
| `CODE.step7-proposal{.10–.13, .15, .18}` | live | `MS7-04` |
| `CODE.step7-proposal{.14, .35}` | live | `MS7-05` |
| `CODE.step7-proposal{.16–.17}` | live | `MS7-06 (S6-7.6 fixes .16/.17)` |
| `CODE.step7-proposal{.19–.27}` | live | `MS7-11 (S6-5 fixes .24; S6-2 fixes .27)` |
| `CODE.step7-proposal{.30–.31}` | live | `MS7-08` |
| `CODE.step7-proposal{.32–.33}` | live | `MS7-09 (S6-2 fixes .33)` |
| `CODE.step7-proposal{.28–.29, .34}` | live | `MS7-10 (S6-2 fixes .34)` |
| `CODE.step7-proposal{.36}` | live | `MS7-07` |
| `CODE.step7-proposal{.37–.39}` | live | `MS7-14 (S6-1b fixes .38/.39)` |
| `CODE.step7-proposal{.40–.43, .134}` | live | `MS7-13 (S6-7 fixes .42/.134)` |
| `CODE.step7-proposal{.45–.46}` | live | `MS7-16` |
| `CODE.step7-proposal{.47–.49}` | live | `MS7-17` |
| `CODE.step7-proposal{.50–.51, .63–.64}` | live | `MS7-18` |
| `CODE.step7-proposal{.52–.53, .60, .66}` | live | `MS7-19 (S6-4 fixes .52/.53/.60/.66)` |
| `CODE.step7-proposal{.54–.59}` | live | `MS7-21 (S6-1c/S6-7.4 fix .56/.58/.59)` |
| `CODE.step7-proposal{.61–.62}` | live | `MS7-24b (unrounded derivations)` |
| `CODE.step7-proposal{.65}` | live | `MS7-20 (S6-6 fixes .65)` |
| `CODE.step7-proposal{.68}` | live | `MS7-23 (S6-7.8 fixes .68)` |
| `CODE.step7-proposal{.69–.70}` | live | `MS7-24` |
| `CODE.step7-proposal{.71–.75}` | live | `MS7-22` |
| `CODE.step7-proposal{.76–.79}` | live | `MS7-25` |
| `CODE.step7-proposal{.80–.83}` | live | `MS7-26` |
| `CODE.step7-proposal{.84}` | live | `MS7-27` |
| `CODE.step7-proposal{.85}` | live | `MS7-28` |
| `CODE.step7-proposal{.86}` | live | `MS7-29` |
| `CODE.step7-proposal{.87}` | live | `MS7-31 (S6-3d fixes .87)` |
| `CODE.step7-proposal{.88}` | live | `MS7-30 (S6-3a fixes .88)` |
| `CODE.step7-proposal{.89–.91, .94}` | live | `MS7-32 (S6-1a/S6-4 fix .90/.91)` |
| `CODE.step7-proposal{.92}` | live | `MS7-33 (S6-3b fixes .92)` |
| `CODE.step7-proposal{.93, .95–.102}` | live | `MS7-34 (S6-3c fixes .98)` |
| `CODE.step7-proposal{.103–.108}` | live | `MS7-35` |
| `CODE.step7-proposal{.109}` | live | `MS7-36 (S6-5 fixes .109)` |
| `CODE.step7-proposal{.110}` | live | `MS7-39` |
| `CODE.step7-proposal{.111–.114}` | live | `MS7-37` |
| `CODE.step7-proposal{.115–.120}` | live | `MS7-38` |
| `CODE.step7-proposal{.121–.122}` | live | `MS7-40` |
| `CODE.step7-proposal{.123–.125, .130–.131, .133}` | live | `MS7-41` |
| `CODE.step7-proposal{.126–.129, .132}` | live | `MS7-42 (S6-7.1/.2/.3 fix .127/.128/.132)` |
| `CODE.step7-proposal{.135–.137}` | live | `MS7-43` |
| `CODE.step7-proposal{.138}` | live | `MS7-44 (S6-1b fixes .138)` |
| `CODE.step7-proposal{.139–.141}` | live | `MS7-45 (S6-1a/c + S6-3b fix .139/.140/.141)` |
| `CODE.step7-proposal{.142}` | live | `MS7-46` |
| `CODE.step7-proposal{.143–.144}` | live | `MS7-47` |
| `CODE.step7-proposal{.145–.148}` | live | `MS7-48` |
| `CODE.step7-proposal{.149–.151}` | live | `MS7-49` |
| `CODE.step7-proposal{.152}` | live | `MS7-50 (S6-1a/S6-3a/S6-1b fix .152)` |
| `CODE.step7-proposal{.153–.156}` | live | `MS7-51` |

## Studio step8-sld (Sitting 7, 2026-08-05)

Conventions: range rows; 133 keys, complete union no dups. 11 POC-DEFECTs + 1 uncertain all ruled (S7-1 one-source-of-truth; S7-2 drawing accuracy). Census A.10-9 37/37 matched (9 with divergences, now closed). The hard-gate law (.85-.89) is shared with MS6-28.

| source key | disposition | PRD ref |
|---|---|---|
| `CODE.step8-sld{.1, .3}` | live | `MS8-01` |
| `CODE.step8-sld{.2, .13, .18, .37, .43}` | live | `MS8-02 (S7-2.2/.3/.6 fix .2/.13/.37/.43)` |
| `CODE.step8-sld{.4–.5}` | live | `MS8-03` |
| `CODE.step8-sld{.6–.7}` | live | `MS8-04` |
| `CODE.step8-sld{.8}` | live | `MS8-05` |
| `CODE.step8-sld{.9–.12}` | live | `MS8-06` |
| `CODE.step8-sld{.14–.17, .84}` | live | `MS8-07 (S7-1c fixes .16/.84)` |
| `CODE.step8-sld{.19, .33–.34}` | live | `MS8-08` |
| `CODE.step8-sld{.20–.21}` | live | `MS8-09` |
| `CODE.step8-sld{.22}` | live | `MS8-10` |
| `CODE.step8-sld{.23–.24}` | live | `MS8-11` |
| `CODE.step8-sld{.25–.29, .35}` | live | `MS8-12 (S7-1a fixes .35)` |
| `CODE.step8-sld{.30}` | live | `MS8-13 (S7-1b fixes .30)` |
| `CODE.step8-sld{.31–.32}` | live | `MS8-14` |
| `CODE.step8-sld{.36, .38, .40, .44}` | live | `MS8-15` |
| `CODE.step8-sld{.39}` | live | `MS8-16 (S7-2.1 fixes .39)` |
| `CODE.step8-sld{.41–.42}` | live | `MS8-17 (S7-2.4/.5 fix .41/.42)` |
| `CODE.step8-sld{.45–.46}` | live | `MS8-18` |
| `CODE.step8-sld{.47}` | live | `MS8-19` |
| `CODE.step8-sld{.48–.49}` | live | `MS8-20` |
| `CODE.step8-sld{.50–.52}` | live | `MS8-21 (S7-1d fixes .52)` |
| `CODE.step8-sld{.53}` | live | `MS8-22` |
| `CODE.step8-sld{.54–.56}` | live | `MS8-23` |
| `CODE.step8-sld{.57–.59}` | live | `MS8-24` |
| `CODE.step8-sld{.60–.61}` | live | `MS8-25` |
| `CODE.step8-sld{.62–.67}` | live | `MS8-26` |
| `CODE.step8-sld{.68–.76, .98–.101}` | live | `MS8-27` |
| `CODE.step8-sld{.77}` | live | `MS8-28` |
| `CODE.step8-sld{.78–.83}` | live | `MS8-29` |
| `CODE.step8-sld{.85–.89}` | live | `MS8-33` |
| `CODE.step8-sld{.90–.91}` | live | `MS8-34` |
| `CODE.step8-sld{.92–.97}` | live | `MS8-35` |
| `CODE.step8-sld{.102–.111}` | live | `MS8-36` |
| `CODE.step8-sld{.112}` | live | `MS8-37` |
| `CODE.step8-sld{.113–.115}` | live | `MS8-38` |
| `CODE.step8-sld{.116–.119}` | live | `MS8-39` |
| `CODE.step8-sld{.120–.127}` | live | `MS8-30` |
| `CODE.step8-sld{.128–.130}` | live | `MS8-31` |
| `CODE.step8-sld{.131}` | live | `MS8-32` |
| `CODE.step8-sld{.132–.133}` | live | `MS8-40` |

## Studio customer surfaces (Sitting 8, 2026-08-05)

Conventions: range rows; 109 keys, complete union no dups. 35 POC-DEFECTs — the pass's largest crop — all ruled (S8-1 identity; S8-2 gating/versioning/links; S8-3 honesty-on-paper; S8-4 privacy/robustness/polish). F5 model inversion (.102) recorded at MS9 §4 and ruled by S8-2c, not silently reconciled.

| source key | disposition | PRD ref |
|---|---|---|
| `CODE.share{.4–.6, .9, .12–.13, .15}` | live | `MS9-15 (S8-4.6/.10 fix .4/.5/.13)` |
| `CODE.share{.8, .18, .20–.23, .64}` | live | `MS9-11 (S8-4.2 fixes .8/.18/.20/.64)` |
| `CODE.share{.7, .19}` | live | `MS9-13 (S8-4.11 fixes .7)` |
| `CODE.share{.10–.11, .98–.99}` | live | `MS9-09 (S8-2c fixes .11/.98/.99)` |
| `CODE.share{.14, .107}` | live | `MS9-06 (S8-2a fixes .14/.107)` |
| `CODE.share{.16–.17, .45–.47, .92, .109}` | live | `MS9-01 (S8-1 fixes .16/.92/.109)` |
| `CODE.share{.41–.42, .49–.53, .55}` | live | `MS9-14 (S8-4.8/.12 fix .41/.53)` |
| `CODE.share{.25–.27, .29–.30, .48}` | live | `MS9-23 (S8-4.3 fixes .27/.29)` |
| `CODE.share{.28, .54}` | live | `MS9-24 (S8-4.7 fixes .28/.54)` |
| `CODE.share{.32}` | live | `MS9-28` |
| `CODE.share{.33–.35, .62–.63}` | live | `MS9-16 (S8-3a fixes .35/.62/.63)` |
| `CODE.share{.31, .36, .43}` | live | `MS9-05` |
| `CODE.share{.37, .40}` | live | `MS9-25 (S8-4.9 fixes .37)` |
| `CODE.share{.38–.39}` | live | `MS9-04` |
| `CODE.share{.44, .94}` | live | `MS9-02 (S8-1 fixes .44/.94)` |
| `CODE.share{.1–.3, .56–.57, .60, .65–.69, .71–.72, .74, .76–.79, .81–.82, .84–.91, .93, .95–.96}` | live | `MS9-03 (sections)` |
| `CODE.share{.58–.59}` | live | `MS9-18 (S8-3c fixes .59)` |
| `CODE.share{.61}` | live | `MS9-22 (S8-4.5 fixes .61)` |
| `CODE.share{.70}` | live | `MS9-21 (S8-4.2/.4 fix .70)` |
| `CODE.share{.73, .75}` | live | `MS9-19 (S8-3d/S8-4.4 fix .73/.75)` |
| `CODE.share{.24, .80}` | live | `MS9-17 (S8-3b fixes .24/.80)` |
| `CODE.share{.83}` | live | `MS9-20 (S8-3e fixes .83)` |
| `CODE.share{.97}` | live | `MS9-27 (S8-4.13 fixes .97)` |
| `CODE.share{.101}` | live | `MS9-08 (S8-2b fixes .101)` |
| `CODE.share{.102–.103}` | live | `MS9-29 (F5 inversion recorded §4)` |
| `CODE.share{.104}` | live *(**re-pointed 2026-08-07.** `MS9-30` — "link issuance is an ONLINE operation, never a silent local-only mint" — was deleted with the offline/sync capability under owner ruling `Q61`, **swept for its wording, not its content**: it is a security and attribution law, not a connectivity one. The key stays closed and stays live, now carried by `F5-80` — one customer-link framework, every share surface a tokenised server-rendered link, and **no local-only share path exists anywhere** — with mint attribution at `F5-31`/`F5-79`. `registers/screens.md` and `docs/tasks/F5-customer-link.md` record the same removal and the same re-pointing)* | `F5-80` · mint attribution `F5-31`, `F5-79` |
| `CODE.share{.105}` | live | `MS9-26` |
| `CODE.share{.106}` | live | `MS9-12 (S8-4.1 fixes .106)` |
| `CODE.share{.108}` | live | `MS9-07 (S8-2a fixes .108)` |
| `CODE.share{.100}` | live | `MS9-10 (S8-2c fixes .100)` |

## Studio step9-bom (Sitting 9, 2026-08-05)

Conventions: range rows; 167 keys (largest single area), complete union no dups. Defects + F1 pack-law flags all ruled (S9-1 pack-driven; S9-2 flat-discount reconciliation; S9-3 three fixes). Money invariants (.128-.132) recorded as suite law at MS10-30.

| source key | disposition | PRD ref |
|---|---|---|
| `CODE.step9-bom{.1–.4}` | live | `MS10-01` |
| `CODE.step9-bom{.5, .80–.83}` | live | `MS10-36` |
| `CODE.step9-bom{.6–.15, .34}` | live | `MS10-02` |
| `CODE.step9-bom{.16, .35–.39}` | live | `MS10-03 (S9-3.2 fixes .39)` |
| `CODE.step9-bom{.17}` | live | `MS10-04` |
| `CODE.step9-bom{.18–.19}` | live | `MS10-05` |
| `CODE.step9-bom{.20–.21, .139}` | live | `MS10-06` |
| `CODE.step9-bom{.22, .133}` | live | `MS10-07` |
| `CODE.step9-bom{.23–.24}` | live | `MS10-08 (S9-3.1 fixes .24)` |
| `CODE.step9-bom{.25}` | live | `MS10-09` |
| `CODE.step9-bom{.28–.33}` | live | `MS10-10 (S9-1 fixes .28)` |
| `CODE.step9-bom{.26, .40–.41}` | live | `MS10-11 (S9-2 fixes .41)` |
| `CODE.step9-bom{.27, .42–.44}` | live | `MS10-12` |
| `CODE.step9-bom{.45–.49, .138}` | live | `MS10-13` |
| `CODE.step9-bom{.50–.54}` | live | `MS10-14` |
| `CODE.step9-bom{.55}` | live | `MS10-15` |
| `CODE.step9-bom{.56–.57}` | live | `MS10-16` |
| `CODE.step9-bom{.58, .73, .148}` | live | `MS10-17` |
| `CODE.step9-bom{.59–.70, .136}` | live | `MS10-18` |
| `CODE.step9-bom{.71}` | live | `MS10-19 (S9-3.3 fixes .71)` |
| `CODE.step9-bom{.72}` | live | `MS10-20` |
| `CODE.step9-bom{.74, .146, .150}` | live | `MS10-35` |
| `CODE.step9-bom{.75–.76}` | live | `MS10-21` |
| `CODE.step9-bom{.77–.79}` | live | `MS10-22` |
| `CODE.step9-bom{.84–.88}` | live | `MS10-23` |
| `CODE.step9-bom{.89}` | live | `MS10-24` |
| `CODE.step9-bom{.90–.96}` | live | `MS10-25` |
| `CODE.step9-bom{.97, .152}` | live | `MS10-26` |
| `CODE.step9-bom{.98}` | live | `MS10-27` |
| `CODE.step9-bom{.99–.125}` | live | `MS10-28` |
| `CODE.step9-bom{.126–.127}` | live | `MS10-29` |
| `CODE.step9-bom{.128–.132}` | live | `MS10-30` |
| `CODE.step9-bom{.134–.135}` | live | `MS10-31` |
| `CODE.step9-bom{.137, .140–.145}` | live | `MS10-33` |
| `CODE.step9-bom{.147}` | live | `MS10-34` |
| `CODE.step9-bom{.149}` | live | `MS10-13 (stale text helpers)` |
| `CODE.step9-bom{.151, .153–.157}` | live | `MS10-39 (S9-1 fixes .151/.153-.157)` |
| `CODE.step9-bom{.158–.160}` | live | `MS10-38` |
| `CODE.step9-bom{.161–.166}` | live | `MS10-37` |
| `CODE.step9-bom{.167}` | live | `MS10-40` |

## Studio done + installation (Sitting 10, 2026-08-05)

Conventions: range rows across two ledgers (132 done + 64 installation = 196 keys, each a verified complete union, no dups). 34 POC-DEFECTs all ruled (S10-1 sign-off flow BUILT — the POC's largest structural gap; S10-2 installation sheet rebuilt; S10-3 five Done fixes). Fingerprint behavioural table (.85-.98) recorded as normative at MS11-23.

| source key | disposition | PRD ref |
|---|---|---|
| `CODE.step10-done{.1–.2, .12–.16, .125–.128}` | live | `MS11-01` |
| `CODE.step10-done{.3–.7}` | live | `MS11-02 (S10-1/S8-2a fix .3/.6/.7)` |
| `CODE.step10-done{.59}` | live | `MS11-03 (S10-1 fixes .59)` |
| `CODE.step10-done{.17–.23}` | live | `MS11-04 (S10-3.1 fixes .21/.22)` |
| `CODE.step10-done{.9–.11, .25–.26}` | live | `MS11-05 (S8-2c resolves .26)` |
| `CODE.step10-done{.24, .129}` | live | `MS11-06` |
| `CODE.step10-done{.8, .106–.116}` | live | `MS11-25 (S10-3.3 fixes .8)` |
| `CODE.step10-done{.28–.33, .53, .55}` | live | `MS11-07` |
| `CODE.step10-done{.34–.36}` | live | `MS11-08` |
| `CODE.step10-done{.37–.42}` | live | `MS11-09 (S10-3.4 fixes .37)` |
| `CODE.step10-done{.43–.46}` | live | `MS11-10` |
| `CODE.step10-done{.47–.52}` | live | `MS11-11 (S10-3.5 fixes .52)` |
| `CODE.step10-done{.54, .56–.58}` | live | `MS11-12 (S10-1/S8-2a)` |
| `CODE.step10-done{.60–.63}` | live | `MS11-18` |
| `CODE.step10-done{.64–.76}` | live | `MS11-19` |
| `CODE.step10-done{.77}` | live | `MS11-20` |
| `CODE.step10-done{.78–.81}` | live | `MS11-21` |
| `CODE.step10-done{.82–.84}` | live | `MS11-22` |
| `CODE.step10-done{.85–.98}` | live | `MS11-23` |
| `CODE.step10-done{.99–.105}` | live | `MS11-24` |
| `CODE.step10-done{.117–.118}` | live | `MS11-16 (S10-1 fixes .117)` |
| `CODE.step10-done{.119}` | live | `MS11-24 (fingerprint graph after copy)` |
| `CODE.step10-done{.120–.122}` | live | `MS11-26 (S10-3.2 fixes .122)` |
| `CODE.step10-done{.123–.124}` | live | `MS11-27` |
| `CODE.step10-done{.130–.131}` | live | `MS11-17 (S10-1 fixes .131)` |
| `CODE.step10-done{.132}` | live | `MS11-13/14/15 (S10-1 builds; .132 gap)` |
| `CODE.step10-done{.27}` | live | `MS11-27 (empty-state note)` |
| `CODE.installation{.38–.42, .58}` | live | `MS11-28` |
| `CODE.installation{.43–.52, .54, .56–.57}` | live | `MS11-29 (S10-2 fixes .51/.56)` |
| `CODE.installation{.9, .24, .60}` | live | `MS11-30 (S10-2 fixes .9/.24/.60)` |
| `CODE.installation{.29, .59, .61–.64}` | live | `MS11-31 (S10-2 fixes .61/.62/.64)` |
| `CODE.installation{.12–.13}` | live | `MS11-32` |
| `CODE.installation{.8, .11}` | live | `MS11-33 (S10-2 fixes .11)` |
| `CODE.installation{.7, .34–.37}` | live | `MS11-34 (S10-2 fixes .7/.35/.36)` |
| `CODE.installation{.14, .16, .19–.22, .25–.28, .30–.33}` | live | `MS11-35 (S10-2 fixes .14/.16/.30)` |
| `CODE.installation{.17–.18, .53}` | live | `MS11-36 (S10-2 fixes .18/.53)` |
| `CODE.installation{.1–.6}` | live | `MS11-37 (S10-2 fixes .4)` |
| `CODE.installation{.15}` | live | `MS11-38` |
| `CODE.installation{.10}` | live | `MS11-17 (install status gate)` |
| `CODE.installation{.23}` | live | `MS11-30 (phase headings)` |
| `CODE.installation{.55}` | live | `MS11-29 (BOS heading)` |

## Studio shell (Sitting 11, 2026-08-05)

Conventions: range rows; 131 keys, complete union no dups. Defects + platform-scope gaps ruled (S11-1 nine steps per census R7; S11-2 dead controls; S11-3 platform-native shell — real auth, server-side designs, real languages, lead-scoped list). Ledger's brief-vs-claims notes (useHealthSync, app/page, BlobImg) resolved by owning sittings.

| source key | disposition | PRD ref |
|---|---|---|
| `CODE.shell{.1–.2}` | live | `MS12-01 (S11-1 fixes .1/.2)` |
| `CODE.shell{.3–.4}` | live | `MS12-02` |
| `CODE.shell{.5–.9}` | live | `MS12-03` |
| `CODE.shell{.10}` | live | `MS12-04` |
| `CODE.shell{.11–.12, .18–.21, .24}` | live | `MS12-05 (S11-3d fixes .20)` |
| `CODE.shell{.13–.17}` | live | `MS12-06` |
| `CODE.shell{.22–.23}` | live | `MS12-07` |
| `CODE.shell{.25–.27}` | live | `MS12-08` |
| `CODE.shell{.28–.33}` | live | `MS12-09` |
| `CODE.shell{.34, .43}` | live | `MS12-15` |
| `CODE.shell{.35–.36}` | live | `MS12-19` |
| `CODE.shell{.37, .72}` | live | `MS12-18 (S11-3c fixes .37)` |
| `CODE.shell{.38–.39, .45}` | live | `MS12-10 (S11-3b/d)` |
| `CODE.shell{.40–.42}` | live | `MS12-11` |
| `CODE.shell{.44, .46–.50}` | live | `MS12-12` |
| `CODE.shell{.51}` | live | `MS12-14 (S11-2.2 fixes .51)` |
| `CODE.shell{.52–.56}` | live | `MS12-17 (S11-3a fixes .52-.56; S11-2.1 fixes .55)` |
| `CODE.shell{.57–.58}` | live | `MS12-16` |
| `CODE.shell{.59–.61}` | live | `MS12-21` |
| `CODE.shell{.62, .107, .113–.114}` | live | `MS12-28` |
| `CODE.shell{.63–.64, .82, .109}` | live | `MS12-22` |
| `CODE.shell{.65–.69, .73–.81, .83, .94–.97}` | live | `MS12-20 (S11-3b)` |
| `CODE.shell{.70, .108}` | live | `MS12-24` |
| `CODE.shell{.71, .115–.129}` | live | `MS12-26` |
| `CODE.shell{.84–.93}` | live | `MS12-23` |
| `CODE.shell{.98–.101}` | live | `MS12-30` |
| `CODE.shell{.102–.106, .110}` | live | `MS12-27 (S11-2.3 fixes .102)` |
| `CODE.shell{.111–.112}` | live | `MS12-29` |
| `CODE.shell{.130}` | live | `MS12-25` |
| `CODE.shell{.131}` | live | `MS11-18 (model-version gate, shared)` |
