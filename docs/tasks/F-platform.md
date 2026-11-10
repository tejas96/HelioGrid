# F-platform (F2 · F3 · F4 · F6 · F7 · F8) — engineering tasks

This file dispositions every requirement row of the suite's six platform foundations — `docs/prd/foundations/F2-roles-and-permissions.md` (F2), `docs/prd/foundations/F3-localization.md` (F3), `docs/prd/foundations/F4-data-integrity.md` (F4), `docs/prd/foundations/F6-notifications-and-search.md` (F6), `docs/prd/foundations/F7-design-language.md` (F7) and `docs/prd/foundations/F8-data-honesty.md` (F8) — under the task-id prefix **T-FPLAT-**. This bucket owns no screens: the platform surfaces these documents describe (the app shell, global search, the notification centre, the language picker, the profile preferences and the branding settings) are built in `docs/tasks/SHELL.md` and `docs/tasks/M01-onboarding.md`, and appear here under **## Realized elsewhere**. What this file builds is the machinery those screens and every module screen read from: the permission and audit engines, the message catalog and the four format implementations, the server-owns-truth engine, the notification registry and delivery engine, global search, and the provenance, staleness and disclosure engines of the data-honesty foundation. Every rule that engineering cannot build as a component — because it is a property of screens and of review — is carried verbatim under **## Laws**. Every row appears exactly once in the **## Disposition index** at the end.

---

### T-FPLAT-074 · The provenance label prints a projection, and the design system's renderer closes
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** none claimed — `F8-23` is `T-FPLAT-029`'s, `F8-03` `T-FPLAT-072`'s; this task carries their owed lines on the design system's half.
**Split from `T-FPLAT-073` at its `/start` (owner pick):** the projection's words are the drawn document's (`SCR-M06-17`), `PENDING` when `T-FPLAT-073` started, so this waits in block 8, where that screen is drawn. The drawing is checked first, before the build.
**Owed by `T-FPLAT-029` (`F8-23`):** the label prints a figure's `projection` — the word that calls it a projection and each assumption `statedAssumptions(projection)` from `@heliogrid/domain` lists, in that order and never its own, money through the money formatter, EN/HI/MR, the words taken from the drawn document (`SCR-M06-17`) — beside the tier, never hover-only (`F8-07`). The label's `projection` prop, a free string today, takes `ProjectionAssumptions`. Proven by a label render that prints a projection's word and its horizon.
**Owed by `T-FPLAT-072` and `T-FPLAT-073` (the design system's half):** in the design system artifact, `components/data/Provenance.d.ts` declares the port's `energySource`, `freshness` and typed `projection`, and `Provenance.jsx` renders the tier closed to the four and `unmarked` and no `withLabel={false}`; `components/feedback/Disclosure` stops owning its English and `DISCLOSURE_TEXT` — its words are `i18n`'s, as the port's are since `T-FPLAT-073`; both contracts are re-pulled verbatim. The boards drawn on free words (`SCR-M01-15`, `SCR-M01-16`, `SCR-M01-17`, `SCR-M12-02`, `SCR-M12-04`, `SCR-SHELL-06`) are redrawn to print them as `source`. The indicative lead clause ("Indicative — Indicative proposal. …") says one word twice; the drawn document decides the lead.
**Owed by `T-FPLAT-066` (`F6-10`; option A, taken 2026-11-04 when the owner asked for `T-SHELL-006`'s gate to be fixed):** given every module's §4 contract (M01–M13, F5), when its named events are checked against the matrix, then each appears with recipients and channels, and the matrix contains no event no module raises — only the last V1 block can walk every module.
**Depends on:** T-FPLAT-073
The rest of the ticket is written at the task's start.
---

## Laws (enforced through screens and review, no standalone build)

These rows state properties of the product that engineering does not build as a component: they are satisfied by the screens other buckets build, by the shared design-system components, and by the review gates named against each row. They are reproduced verbatim because the wording is the requirement.

- **F2-04** (P0, `docs/prd/foundations/F2-roles-and-permissions.md`) — **The approver of record is not the design's author.** Sign-off approval or return is recorded with who and when — "the engineer-led structural safety record" — and a returned design goes back to its author with comments pinned to what is wrong. Where the only person holding sign-off is the author (the one-person firm — the matrix has always granted the Owner both capabilities), the approval record still names the approver, so the record shows the same person did both; see edge cases.
  **Enforced by:** the design sign-off record; the approver-and-time pinning of `T-FPLAT-030` (`F8-26`, `F8-27`); the audit entry of `T-FPLAT-004`.

- **F2-06** (P0, `docs/prd/foundations/F2-roles-and-permissions.md`) — **No commercial figures, ever, on any surface the Installation Team Member preset grants.** No price, discount, tranche, margin or customer value appears on any screen this preset reaches. v1 achieved the property by giving crew no screen at all; where V2 gives them a screen, the surface itself must preserve it (`02-personas.md` `PS-27` carries the same law persona-side).
  **Enforced by:** every screen the Installation Team Member preset reaches — the installation surfaces built in `docs/tasks/M08-projects.md` — checked at screen review; the grants that reach them come from `T-FPLAT-001`'s matrix and `T-FPLAT-002`'s resolution.

- **F2-07** (P1, `docs/prd/foundations/F2-roles-and-permissions.md`) — **The coordinator fallback survives the preset.** Where the checklist is run by a coordinator rather than the crew, ticks are attributed to the coordinator and an optional free-text "done by" per step records the crew member's name. This fallback is not removed when crew accounts exist, because mixed crews are the normal case (`02-personas.md` `PS-28`).
  **Enforced by:** the installation-checklist screen `SCR-M08-04` (built in `docs/tasks/M08-projects.md`), which attributes the tick to the coordinator and carries the optional per-step free-text name.

- **F3-16** (P0, `docs/prd/foundations/F3-localization.md`) — **Layouts survive text expansion of roughly 15–30% without truncating meaning.** No fixed-width labels; buttons and chips size to their content; table headers wrap rather than clip; **amounts and units are never truncated**; and a long string wraps or truncates with the full text still reachable — it never overflows its container and never hides a value. The source names the usual casualties: buttons, chips, table headers and the proposal builder's eleven step titles.
  **Enforced by:** per-screen review at both viewports against `F7-43` item 7 over every screen; the per-script line-height mechanism it depends on is built by `T-FPLAT-007`.

- **F3-18** (P0, `docs/prd/foundations/F3-localization.md`) — **A screen is not done until it has been rendered and checked in a non-Latin launch language.** This is a completion condition, not a testing recommendation: the design language's per-screen Definition of Done already lists "rendered in Hindi and checked — layout survives expansion" as one of its items, and the source's own recommendation is to do it early, on real screens, because English-only design that is translated later always breaks and the breakage is invisible until a real user opens it. The five densest surfaces — the BOM, the generated proposal document, the proposal builder, the lead list and the studio panels — are checked in every language in the set.
  **Enforced by:** the per-screen Definition of Done (`F7-43` item 7) applied at screen review, over the five densest surfaces the row names.

- **F3-25** (P0, `docs/prd/foundations/F3-localization.md`) — **The product is built for an open language set.** Every requirement in this suite is written for "the languages in the set", never for three named ones: no screen, document, template structure, preference, permission or product rule may assume the set's size, its members, or that every member shares one script. A requirement phrased "in all three languages" is a defect against this rule.
  **Enforced by:** document and code review — no requirement, screen, template, preference or rule may name a fixed language count; `T-FPLAT-005` reads the set from the catalog rather than from a constant, and `T-FPLAT-009` extends it as configuration.

- **F3-29** (P0, `docs/prd/foundations/F3-localization.md`) — **The interface language set and the voice agent's language set are independent, and never converge by accident.** The agent's set is broader than the interface's — six at launch, the three interface languages plus Gujarati, Tamil and Telugu — is chosen **per customer** for a call, and is tenant-configurable. It is specified in `modules/M07-sales-execution.md`; F3 neither owns it, bounds it, nor changes when the interface set changes. A Marathi-speaking rep may call a Hindi-speaking customer from an interface in English, and nothing in the product ties the three choices together.
  **Enforced by:** `docs/prd/modules/M07-sales-execution.md` owning the agent's language set separately from `T-FPLAT-005`'s interface set; review confirms a change to either leaves the other untouched.

- **F4-27** (P0, `docs/prd/foundations/F4-data-integrity.md`) — **A warning never disables a primary action.** No modal and no spinner wall stands between a user and their work, and no primary action is pre-emptively greyed out. Where an action genuinely cannot be performed, it is refused honestly **at the attempt**, with a reason, rather than disabled with no explanation.
  **Enforced by:** per-screen review of every screen — no surface pre-emptively disables a primary action or stands a modal or a spinner wall in front of one; the honest refusal at the attempt is `F8-36`'s, built by `T-FPLAT-032`. *(Moved here 2026-08-07 from `T-FPLAT-014`, which was the five-surface sync-state model. The row is live and unchanged in force, but its text was re-pulled verbatim — it previously read "Never blocking, in any of the five" and spoke of connectivity, saves succeeding locally and the deleted `F4-09` — and what is left is a property of every screen rather than a component this bucket builds.)*

- **F6-03** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **Notification honesty: no false urgency, ever.** A notification's tone matches its fact: informational facts inform, attention items say why they need attention, and nothing is dressed as urgent to drive engagement — the same discipline the dunning ladder and the state banners obey (`F8-34`'s family). No engagement mechanics exist: no streaks, no badges-for-opening, no re-notification of an unchanged fact.
  **Enforced by:** a tone audit of the complete catalogue registered by `T-FPLAT-017`, plus copy review of every message body; `T-FPLAT-018` emits no re-notification of an unchanged fact.

- **F6-04** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **Nothing in this document reaches the EPC's customer.** Every matrix recipient is a tenant user; the customer's surfaces are the link's own states (`F5-48`'s confirmation-state law) and the transactional message flows. The two source moments that ask for automatic customer messages — the design-wait message and the acceptance acknowledgement — are **ruled (owner ruling 2026-08-04)**: they send automatically from the tenant's connected transactional channel, owned by `foundations/F5` (`F5-16`, `F5-48`) with `modules/M03`'s connection (`M03-03`); this document still defines **no send channel of its own** and stays staff-side.
  **Enforced by:** `T-FPLAT-018`'s recipient resolution, which resolves tenant users only; the two customer-facing sends belong to `docs/prd/foundations/F5-customer-link.md` and connect through `docs/prd/modules/M03-marketing.md`.

- **F7-01** (P0, `docs/prd/foundations/F7-design-language.md`) — **`design/ds-source/` is the single source of every visual fact in the operator product.** The vendored design-system package — its token files, its typefaces, its component set and its brand law — is canon, and it is canon *pixel-perfect*: no document, module, screen, tenant or release re-decides a visual fact it already settles. The character it encodes is part of the ruling, not decoration around it: a precision instrument for people quoting jobs worth a great deal of money, calm under dense data, warm-neutral, with hierarchy carried by luminance and softness rather than by lines. Every requirement below is a rule *about* that artifact, never a replacement for it.
  **Enforced by:** `T-FPLAT-023`'s adherence gate, which fails any value that did not reach the screen through the design system, plus screen review against `design/ds-source/`.

- **F7-02** (P0, `docs/prd/foundations/F7-design-language.md`) — **When the artifact and a ruling disagree, the ruling wins — and the divergences are named, not silently patched.** The overlay's own standing law governs, verbatim: *"If code and a ruling disagree, the ruling wins until the product owner changes it in this file."* Precedence is therefore: an owner ruling in `docs/15` first, the package's token files second, the package's prose readme last. Three divergences are recorded as of this writing and are **not resolved here**: the readme's dark-mode index line is declared false by `R19-A` (the token files carry no dark values and declare a light colour scheme, so ruling and artifact agree and only the prose is stale); the semibold weight sanctioned by `R19-D` is not yet present in the type tokens (ruling wins — the sanctioned set is the ruling's); and the "medium weight restricted to buttons, tabs and table headers" clause — carried by both the readme and the token file's own header comment (`tokens/typography.css:2`, "500 permitted for buttons, tabs, table headers only") — is dead by the same ruling *(second carrier named by Task 26)*.
  **Enforced by:** review at implementation — the three recorded divergences are carried in this row and resolved in favour of the ruling, never patched silently in code.

- **F7-04** (P0, `docs/prd/foundations/F7-design-language.md`) — **v1 is light-only, by law and by fact — dark mode is struck from the definition of done.** There is no dark theme, no per-user theme switch and no dark variant of any surface, and the studio canvas is light like everything else: the source is explicit that *"the old 'studio canvas stays dark' doctrine is dead."* The semantic alias layer is deliberately kept so that a dark value-set can be dropped in later without a redesign; keeping that seam open is a requirement, shipping dark is not.
  **Enforced by:** `T-FPLAT-023`'s adherence gate and screen review: **no screen instructs a dark variant or a theme switch** — and the semantic alias seam stays in `design/ds-source/` so a dark value-set can be added later without a redesign.

- **F7-05** (P0, `docs/prd/foundations/F7-design-language.md`) — **There is no invented logo mark — and the launch app icon is a typographic letter-tile derived from the wordmark (owner ruling 2026-08-04).** The source is categorical: *"No logo was provided. There is no HelioGrid logo mark — the wordmark is rendered in plain Geist Bold… Do not invent a mark."* Every surface that would ordinarily carry a mark carries the wordmark instead. The one sanctioned exception is the owner's own ruling: the **app icon at launch is a letter-tile — a bold "H" in the brand face on the near-black brand background, derived entirely from the wordmark's style, nothing invented** — which unblocks store submission on both platforms; a **commissioned logo replaces it post-launch via an ordinary update**. Until that logo exists the boot/splash is plain canvas plus the wordmark and the Android-12+ icon-on-splash shows the letter-tile — one boot colour, no stock vendor branding, no flash across the handoff (owner ruling 2026-08-04). Everything else the no-invention law covered stays covered: no screen, asset or release draws a mark of its own.
  **Enforced by:** release asset review on both platforms; no screen specifies a mark, and the launch app icon is the ruled letter-tile.

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
  **Enforced by:** the shared status component and per-screen review; the billing-state names obey it. *(Amended 2026-08-07 — this pointer also named "the sync-state chips of `T-FPLAT-014`", which were deleted `F4-24`'s per-record chips; `docs/prd/foundations/F4-data-integrity.md` §5 forbids any queued or unsynced marker on a record, so there are no sync chips to bind. The row's own text is unchanged and still names a sync state among its examples, so it is quoted as it stands under the never-paraphrase rule.)*

- **F7-13** (P0, `docs/prd/foundations/F7-design-language.md`) — **Interface colour and data colour are two separate systems and are never conflated.** A control is never styled with a data colour and a chart, heatmap or canvas overlay is never drawn in the interface accent. Data palettes used in the studio — roof identity, electrical strings, irradiance — must be **distinguishable under the most common colour-vision deficiency within each set**, and every data-colour encoding is paired with a second, non-colour channel: a label, a pattern or a position. Data colours are **never tenant-overridable**, because they carry engineering meaning rather than brand.
  **Enforced by:** studio screen review, including colour-vision-deficiency simulation of each data palette.

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
  **Enforced by:** the shared numeric-entry component, plus review of every canvas and gesture-set value.

- **F7-29** (P0, `docs/prd/foundations/F7-design-language.md`) — **The touch contract binds every interactive surface, and the canvases share one gesture vocabulary.** Four clauses, carried whole. *(a) Capability, not width* — build for pointer events and branch on **input capability, never on screen width**. *(b) One vocabulary* — the satellite canvas, the layout editor and the 3D scene use the same gestures: one-finger pan, pinch to zoom, two-finger rotate, tap to select, long-press for contextual actions, drag with snapping, two-finger tap to undo; and **no function is reachable only by wheel, middle-click or keyboard**. *(c) Precision under a fingertip* — magnification, offset dragging, snap-then-nudge, always-available numeric entry (`F7-28`) and an explicit commit. *(d) Reachability* — primary actions sit in the lower third of a phone screen, a destructive action is **never adjacent to a primary one**, and undo stays persistently reachable while any canvas tool is active. One gesture is one undo step.
  **Enforced by:** review of the canvas surfaces against the four clauses, on a phone.

- **F7-30** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 1 — mobile-first at 375 px, with full parity and no reduced edition.** Every screen in the product is designed at the small viewport first and expanded to the desktop one; the small screen is the design constraint, not a cut-down variant of a desktop design. **Every feature is present on both** — including the 3D design studio, which the source names as *"the hardest and least negotiable commitment in the system"* and which owner directive 9 protects absolutely: *"no studio feature is dropped on any surface."* Both viewports render without horizontal scrolling, and this is a completion condition (`F7-43`, item 1), not an aspiration.
  **Enforced by:** per-screen review at 375 px and 1536 px with full parity (`F7-43` item 1).

- **F7-31** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 2 — parity is symmetric: the web experience stays full-featured and the mobile experience feels native and extremely fast.** Mobile-first is a design order, not a hierarchy of investment. The owner's mandate is carried whole: *"Mobile-first DOES NOT mean web is compromised. Every feature must work beautifully on web and mobile. The mobile experience should feel native and extremely fast. The web experience should remain full-featured."* Neither surface is the reduced edition of the other; neither is allowed to be the one that ships later.
  **Enforced by:** per-screen review of both platform implementations, and release review that neither surface ships later than the other.

- **F7-32** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 3 — touch-first, including the flagship.** Touch is the primary input the product is designed for, not an adaptation layer over a pointer design: mode-based canvases rather than modifier keys, selection that promotes an object to large handles, snapping and nudging in place of pixel-accurate dragging, and no meaning that exists only on hover. The full contract is `F7-29`; the principle is what it means for planning — a feature is not designed until it is designed for a fingertip, and the studio is included rather than excepted.
  **Enforced by:** per-screen review with a fingertip alone, the studio included.

- **F7-33** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 4 — one record that travels, and navigation follows the record.** The product replaces a re-keying pipeline with a single record that moves from enquiry through survey, design, proposal, customer link, follow-up, project and money. The interface obligation that follows is concrete: a user reaches the next stage **from the record**, not by leaving it and entering another module; the record's identity, its customer and its current state stay visible as it moves; and **nothing a person has already told the product is ever asked for again** to cross a stage boundary. Modules are an authoring concept, not a navigation model.
  **Enforced by:** navigation review across each module's screens — the next stage is reached from the record and nothing already captured is asked for again.

- **F7-34** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 5 — progressive disclosure: never present the whole control surface at once.** A screen shows what the user needs for the decision in front of them and reveals the rest as they go. The source names the worked failure: *"The BOM screen presents ~286 controls at once"* — and rules that the answer is disclosure, *"not a smaller font"*. The same law shapes chained editors (each stage revealed with its live consequence, `F7-21`), teaching empty states that show a new user what to do rather than apologising for emptiness, and onboarding that asks for the minimum needed to produce one real quote and collects the rest when it is actually needed (`OV-33`).
  **Enforced by:** per-screen review of control density at the moment of the decision, over every screen.

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
  **Enforced by:** copy review of every screen and of all product-generated content.

- **F7-43** (P0, `docs/prd/foundations/F7-design-language.md`) — **A screen is done only when it satisfies every item of the per-screen Definition of Done — violating any single item means it is not done.** The twelve items, carried whole: (1) works at the mobile and desktop viewports with **no horizontal scroll**; (2) all three base states present — loading, empty and error *(amended by owner ruling 2026-08-07: this item read "all four states present — loading, empty, error and offline"; the offline capability was removed from the product, and the 2026-08-07 sweep struck `offline` from the list without correcting the count, leaving the item self-contradicting until now)*; (3) keyboard-operable with visible focus; (4) contrast verified, including the restricted roles of `F7-11`; (5) every target meets the minimum size; (6) the light theme correct; (7) rendered in a non-Latin launch language and checked, with the layout surviving the script and its expansion; (8) **every user-visible number carries its provenance tier**; (9) density correct for the surface; (10) zero raw colour literals and zero off-scale values; (11) tested at realistic volume — a long list, a full bill of materials, a large design — rather than at demo volume; (12) **wired into the flows that reach it — no orphan screens.**
  **Enforced by:** screen review — the twelve items are the completion gate every screen is checked against. *(Item 2 re-pulled verbatim 2026-08-07: the live row now reads "all four states present — loading, empty and error" after the owner ruling that removed the offline capability from the product removed the `offline` state. The cell's own count word is carried unchanged under the never-paraphrase rule; `F7-23`'s N10 clause states what binds — three states.)*

- **F7-44** (P0, `docs/prd/foundations/F7-design-language.md`) — **The Definition of Done applies unreduced to the 3D design studio.** No item is waived, softened or deferred for the flagship: it is light like everything else, it carries its three base states *(amended by owner ruling 2026-08-07 to the three-state count; see `F7-43` item 2)*, it carries provenance on every number, and it holds full parity at the mobile viewport — which the source calls *"the hardest and least negotiable commitment in the system."* The studio's own tool census remains its separate acceptance gate and never shrinks., it carries provenance on every number, and it holds full parity at the mobile viewport — which the source calls *"the hardest and least negotiable commitment in the system."* The studio's own tool census remains its separate acceptance gate and never shrinks.
  **Enforced by:** the same twelve-item gate applied unreduced to the studio screens.

- **F7-45** (P0, `docs/prd/foundations/F7-design-language.md`) — **A registered UX gap is closed only when its screen ships wired into its flow, complete — and it is designed in the design system by the owning module's Design track, before that module is built, never in a separate design phase** (owner ruling 2026-10-16: a gap stops the board at drawing time and goes to the owner as a design system change, so the board and the app never disagree; it replaces the source's "designed at implementation time"). Each of the source's registered gaps is designed **directly in the design system, inside the owning module's slice**. A gap is closed when the screen exists **wired into its flow (never orphaned)**, with loading, empty and error states, at both viewports, with the light theme correct — the Definition of Done, applied to a gap. Rows are marked closed and **never deleted**; new gaps are appended in the same form. The one gap this rule could not close — the missing brand mark (`F7-05`) — was closed by the owner instead (ruling 2026-08-04: letter-tile at launch, commissioned logo post-launch).
  **Enforced by:** the owning module's slice closing each registered gap with a wired, complete screen; gap rows are marked closed and never deleted.

- **F8-01** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **Every user-visible number carries exactly one provenance tier.** Not most numbers, not the headline numbers — every number a user can read, on every surface named in §2, including numbers inside generated documents and numbers spoken aloud. A number whose tier cannot be established is not rendered as a number; the surface shows what is missing instead. **What counts as a number here is a quantity — something a reader could add up, compare or act on. An identifier is not one, and carries no tier (owner ruling 2026-08-28):** a tax registration, a bank account number, an invoice number, a phone number, a one-time code. Applying the four tiers to one produces nonsense — `estimated` on a GSTIN claims a guess nobody made, `measured` claims a verification nobody performed — and this row's own remedy proves the scope, because refusing to render a correct registration number and showing *what is missing* instead would be false. **Where an identifier has been checked, the surface states what was checked and what was not**, in prose beside the value, which is the mechanism `F8-03` already requires — never as a fifth tier and never as a parallel standing. `M01-25`'s live tax-registration check is the worked case: the format was checked, the issuing authority was not, and the screen says so. **A count of the reader's own records carries no tier either (owner ruling 2026-10-03, `T-SHELL-003`):** the notification centre's head line and its group sentences tally records the reader can see listed beneath them, so a tier would only repeat what the list shows; a count that is computed, estimated or sampled still carries one. **A limit the product enforces carries no tier either (owner ruling 2026-10-15, M01 board check):** a cap, an expiry, a cooldown or a size ceiling — *50 invites in any 24 hours*, *an invite lasts 7 days*, *resend in 30 s* — is a rule the product states, not a quantity it measured, derived, estimated or assumed, and the reader acts on it as written. **A value the company sets for itself in its own settings carries no tier where it is set and read back (owner ruling 2026-10-16, M01 board check):** a price or rate it types, a margin, a tranche share — *your price ₹14,100*, *default margin 18%*, *60% before dispatch* — is the company's own decision, not a quantity anyone measured, derived, estimated or assumed. A surface that carries such a value on to someone else (a proposal, a customer link) states that surface's tier. **Outside money and energy, a number carries no tier (owner ruling 2026-10-16, M01 design):** a tier marks the figures a customer's decision rests on — an amount of money (a price, a saving, a payback, a balance) and a figure of power or energy, or a site or system quantity it is computed from (kWp, kWh, roof area, shading loss). A date, a time, a count, a duration or a progress figure carries none, recorded or computed — *the invite expires 5 Sep*, *day 2 of 7*, *14 designs pinned*, *expected commissioning 12 Oct*. A date that states a money outcome, such as a payback month, is a money figure and keeps its tier.
  **Enforced by:** the format layer's `QualifiedAmount`, which cannot be built without a tier (`packages/domain/src/format/qualified.ts`); the design system's closed `Provenance` label (`T-FPLAT-072`); and screen review of every screen — a quantity with no tier beside it, or an identifier given one, is not done.

- **F8-05** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **A tier change is shown, never silent.** When a number's provenance improves or degrades — a proposal built without a design later gets one, a source of record becomes unavailable and a fallback takes over, a survey moves from remote to on-site — the product states what changed before committing it, and the new tier is visible where the number is read. Energy figures in particular "never silently switch source".
  **Enforced by:** the rows that own each tier-changing flow, each stating the change before it commits — `M04-37` (a physical visit upgrades a remote survey), `M06-47` (a Path B proposal offered an upgrade once a design exists) and `F8-09` in `T-FPLAT-027` (the energy source's fallback) — checked at the review of those screens; the design system's `VersionDiff` already treats a tier change as a change (`packages/ui/src/components/VersionDiff/VersionDiff.resolve.ts:27`).

- **F8-06** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **Number-honesty is platform behaviour and is never a tenant configuration surface.** The source draws the line explicitly against the fully tenant-configurable voice agent: the product's own number-honesty — provenance labels, and estimates never printed as calculations — governs the proposal and design *output*, not anyone's speech, and is therefore not the tenant's to shape. No preset role, no permission, no plan entitlement, no white-label setting and no template edit can remove, weaken, rename or hide a provenance tier, a source label, a staleness state or a disclosure required by this document.
  **Enforced by:** the F2 matrix, where no row may exist for editing, suppressing or overriding a tier, a source label or a staleness state (F8's Permissions paragraph); and the review of every preset, entitlement, white-label and template surface — none may name a tier, a source label, a staleness state or a disclosure as a setting.

- **F8-07** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **Labels are readable, not decorative, and never hover-only.** A tier, a source label, a staleness state or an honesty caveat renders as persistent, legible content beside the number it qualifies — not as a tooltip, not as a hover state, not as a colour difference alone, not as a footnote the reader must seek out. The source states the failure mode it is guarding against directly: the caveat is on the screen, not in a tooltip.
  **Enforced by:** the design system's `Provenance` label, whose tier always prints its word — `T-FPLAT-072` removed its one colour-only form, `withLabel={false}`; screen review for the label's place beside its number, as `F7-35` already states.

- **F8-11** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **A model's documented limits travel with the model's outputs.** Where a computed output is produced by a model with known, documented limitations, those limitations are stated where the output is read — at every scale and on every surface, not only in a specification. Decorative scene elements that do not participate in a computation say so plainly rather than implying they were considered. Faster computation never changes what the physics claims.
  **Enforced by:** the review of each surface that prints a shading output, where the shading model's limit text must sit beside it at every scale — the Proposal Document (`T-M06-017`) carries an owed line. The model and its limit text are the studio's.

- **F8-15** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **A sent document keeps the versions it was built with, forever.** Once a priced document has been shared with a customer, its figures never move: it keeps the rate versions, catalog release and pack version pinned at generation, and a later price change produces a *new* version of the document rather than editing the sent one. The customer's copy and the tenant's copy of the same sent document always agree.
  **Enforced by:** `T-M06-025`'s version record, where a shared version's figures and pins are never updated (`M06-43`) and its figures qualify as a record, `freshness: null`, so they keep their standing; and `F5-40`'s link, which renders the version already shared. `T-M06-025` carries an owed line; `T-FPLAT-028`'s `freshnessOf` compares pins and never writes to them.

- **F8-18** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **A stale output says so where it is read, and offers the corrective action.** The staleness state is visible on the object itself — in the list, on the detail screen, in the customer-facing rendering — and is accompanied by the action that resolves it (recompute, regenerate, or open the newer version). "Stale" is never communicated only by absence, only by a colour, or only after the user tries to send.
  **Enforced by:** the proposal detail (`T-M06-018`) and list (`T-M06-019`), each printing the `Freshness` of `T-FPLAT-028` beside its corrective action, and the provenance label that prints the stale state beside the tier (`T-FPLAT-073`) — each carrying an owed line; and the studio's own surfaces.

- **F8-19** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **Staleness is not only a money rule: any artifact produced before a change is stale and must say so.** Captured views, rendered sheets, generated drawings and exported files carry what they were produced from; when their inputs have moved on, they are labelled stale rather than presented as a current picture, and the reader is told what changed since.
  **Enforced by:** each artifact's own task pinning the design fingerprint it was made from (`InputPins.design`) and comparing it through `T-FPLAT-028`'s `freshnessOf` — each export's own slice the same way.

- **F8-24** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **One figure, one source: every rendering of the same figure shows the same value, tier and disclosure.** The screen, the generated document, the customer link, the export and the voice agent's spoken version of a figure are renderings of one computed value — they do not recompute independently, round differently, or drop a qualifier that the other renderings carry. A disagreement between two renderings of the same number is a defect, not a display difference.
  **Enforced by:** `QualifiedAmount` (`T-FPLAT-026`), the one payload — value, text, tier, standing, disclosure, energy source, freshness and, from `T-FPLAT-029`, projection — formatted once by `qualifyMoney`, which each rendering reads whole and never recomputes; and the review of each rendering that prints it: the document `T-M06-017`, which carries an owed line, the customer link (`F5-05`), each export's own slice, and the voice agent's spoken figure under M07's §4 contract with F8.

- **F8-25** (P0, `docs/prd/foundations/F8-data-honesty.md`) — **The product never computes structural adequacy — at any scale, on any surface, for any segment.** No output states, implies or scores whether a structure, foundation, roof or mounting system is safe or sufficient. Structure-related outputs are material estimates and visual models: a bill of material quantities and a geometric representation, never a wind, uplift, load-path or roof-capacity verdict. The largest and the smallest job are treated identically.
  **Enforced by:** the review of every structure-bearing surface — the studio's structure, sheets and BOM, the installation checklist (`SCR-M08-04`) and the documents (`T-M06-017`) — where no output may state, imply or score adequacy; `T-FPLAT-030`'s `signOffOf`, which records a human decision and never computes one; and the `F8-28` statement those surfaces carry. No capability row grants adequacy as a computation (`F2`).

---

## Realized elsewhere

These rows are screen rows: their verbatim text is the specification of a screen another bucket owns, and it lives in that screen's brief. They are carried here with their pointers so the bucket's row set is complete.

- **F3-03** (P0, `docs/prd/foundations/F3-localization.md`) — **Every user can reach a language picker, at first run and afterwards.** It appears in onboarding on first run and permanently in the user's own profile and preferences — reachable by every persona on both platforms. It lists each language **in that language's own script and name, never translated into the current language**, and it defaults to the device's language when that language is in the set.
  **Realized by:** `SCR-M01-03` and `SCR-M01-11` → `docs/tasks/M01-onboarding.md`. The picker itself is M01's screen; the language set it lists and the device-language default it applies come from `T-FPLAT-005`, and the readiness gate that decides which languages it may offer is `T-FPLAT-009`.

*(Three F4 rows were carried in this section and are struck from it 2026-08-07, with the offline/sync capability that created them. **`F4-22`**, the persistent global sync indicator with its counts sentence and its last-sync time, is killed by name — `docs/prd/foundations/F4-data-integrity.md` §5 ("no global connection indicator"), owner decision `D7`, and the amended `SCR-SHELL-01` brief; nothing is ever waiting, so there is nothing to state, and `docs/tasks/SHELL.md` `T-SHELL-001` loses that element entirely. **`F4-23`**, the sync centre, lost its screen: `SCR-SHELL-04` was deleted by owner decision `D3` and §5 forbids a sync surface; the per-item retry it hosted survives only for photographs and only on the capture screen, where live `F4-21` and `M04-55` place it — `SCR-M04-07` "and nowhere else". **`F4-35`**, "an application too old to sync still reads", was built entirely on the sync contract — the trigger is a sync-contract change and the mitigation is that local reads keep working — so with no local store the soft lockout it required is impossible rather than merely unnecessary; the owner deleted its only screen for exactly that reason (`D4`: `SCR-SHELL-05` "existed only for `F4-35`"). No row id is renumbered and none of the three appears in the Disposition index, which the same sweep cleared.)*

- **F6-12** (P1, `docs/prd/foundations/F6-notifications-and-search.md`) — **Grouping: standard events group; nothing important hides.** The centre groups same-type events on the same subject class ("3 proposals opened today") with each item still individually reachable; immediate-class events (F6-13) never group. Grouping is presentation only — every record still exists individually (F6-06).
  **Realized by:** `SCR-SHELL-03` → `docs/tasks/SHELL.md` `T-SHELL-003`. The grouping is presentation over `T-FPLAT-017`'s records; the immediate class that never groups is registered by `T-FPLAT-018`.
- **F6-17** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **One notification centre: the bell, the badge, the list.** The badge counts unread from the record (never from push state); the list renders grouped per F6-12, filterable by type-group and read state, newest first; every item deep-links and offers its one-step act where the recipient holds it (F6-02).
  **Realized by:** `SCR-SHELL-03` → `docs/tasks/SHELL.md` `T-SHELL-003`. The badge count, the read state, the filters and the one-step act each item offers come from `T-FPLAT-017` and `T-FPLAT-019`.
- **F6-20** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **One global search box, everywhere:** finds **leads, customers, sites, proposals, projects and catalog items** — by name, phone or city — plus **people** (employee records) within the searcher's people-records scope. One box in the app shell on web and mobile; results grouped by entity type; every result deep-links. *(The journey's own list says "quotes" — rendered here as proposals per the naming ruling, with the alias law at F6-22.)*
  **Realized by:** `SCR-SHELL-02` → `docs/tasks/SHELL.md` `T-SHELL-002`. The entity coverage, the grouping, the scope enforcement and the deep links come from `T-FPLAT-020`.

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
| F3-03 | realized-by: T-M01-003, T-M01-011 — `SCR-M01-03` + `SCR-M01-11` → `docs/tasks/M01-onboarding.md` |
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
| F4-15 | realized-by: the 3D Design Studio, rebuilt from scratch — no PRD or task yet |
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
| F6-12 | realized-by: `SCR-SHELL-03` → `docs/tasks/SHELL.md` `T-SHELL-003` |
| F6-13 | T-FPLAT-018 |
| F6-14 | T-FPLAT-018 |
| F6-15 | T-FPLAT-018 |
| F6-16 | T-FPLAT-018 |
| F6-17 | realized-by: `SCR-SHELL-03` → `docs/tasks/SHELL.md` `T-SHELL-003` |
| F6-19 | T-FPLAT-019 |
| F6-20 | realized-by: `SCR-SHELL-02` → `docs/tasks/SHELL.md` `T-SHELL-002` |
| F6-21 | `T-FPLAT-020`, shipped |
| F6-22 | `T-FPLAT-020`, shipped |
| F6-23 | `T-FPLAT-020`, shipped |
| F6-24 | `T-FPLAT-020`, shipped |
| F6-25 | `T-FPLAT-020`, shipped |
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
