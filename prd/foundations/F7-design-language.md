# F7 · Design language — the binding visual system and the V2 UX principles

Status: draft · Origin mix: SRC-dominant — 43 of 45 requirements are source-derived; two `BRIEF`
requirements (`F7-31`, the symmetric-parity mandate; `F7-40`, the carried-decision justification
rule); no `REC` items · Depends on: `00-README.md`, `01-product-overview.md` (`OV-04` the
travelling record, `OV-08`/`OV-09` mobile-first, `OV-33` progressive onboarding, `OV-38`/`OV-40`
the honesty and vernacular moats), `02-personas.md`,
`foundations/F3-localization.md` (the script, expansion and render-check obligations this
document's type system must satisfy), `foundations/F8-data-honesty.md` (the honesty laws this
document gives a visual grammar to) · Forward: `foundations/F4-data-integrity.md`,
`foundations/F5-customer-link.md`, `foundations/F6-notifications-and-search.md`, and every module
PRD (`M01`–`M13`) — every screen in the suite is designed under this document

## 1. Purpose & scope

This document does two jobs, and they must be read as one. First, it declares the **binding
visual language**: the vendored design-system package at `design/ds-source/` is the product's
visual truth, and this suite neither re-authors it nor paraphrases it. Second, it states the
**V2 UX principles** — the small set of product-level laws every screen in every module is
designed against, which exist because V2 redesigns the product's experience from first principles
while keeping the visual system it already has. The design spec puts the split in one sentence:
*"the design system remains; the UX does not."*

The visual half is settled and is not this suite's to decide. The V2 brief mandates a redesign of
screens and workflows, not of the brand: the vendored package — its tokens, its typefaces, its
near-black primary action, its light canvas — was ruled pixel-perfect canon by the owner
(`docs/15` §3), and the earlier "Instrument" graphite-and-brass identity was formally retired
(`R19-E`). What this document adds is not a second opinion about colour; it is the set of product
laws that a screen can violate — parity, touch, disclosure, honesty, speed —
none of which a token file can express.

**The single most important boundary in this document: no visual value is a requirement here.**
Colour values, spacing steps, radii, elevation specifications, motion durations and easings, type
sizes, line heights, tracking and font-weight numerals live in `design/ds-source/tokens/*.css` and
nowhere else. This document names roles, rules and obligations — "the primary action is near-black
and never coloured", "the overline is the single exception to the type floor" — and points at the
artifact for the values behind them. Duplicating a token value into a PRD creates a second place
to maintain it, and a second place is how drift starts; the design system's own adherence
configuration forbids exactly this in code (`_adherence.oxlintrc.json` restricts raw hex literals
and off-scale pixel values), and the per-screen Definition of Done forbids it on screens
(`F7-43`, item 10). The one class of number this document does state is the class that exists to
protect a person rather than to describe a style: accessibility and surface **floors** — the
minimum touch target, the minimum type size, the mobile viewport the product is designed at.
Those are product law, carried verbatim from the source's own numbered interaction rules, and
they are not tokens.

**In scope.** The authority of the design-system artifact and what happens when the artifact and
a ruling disagree; the light-only law; the absence of a logo mark; brand restraint and the
identity markers; type, numeral rendering and colour-role restrictions; surface grammar
(borders, density, overlays, iconography, photography, sheets and shells); the interaction and
accessibility contract (N1–N10, focus, labels, captions, numeric entry, touch); the twelve V2 UX
principles; content voice; and the per-screen Definition of Done that closes a screen.

**Explicitly not in scope.**

- **Token values and component internals.** Every colour, dimension, duration and type value is
  `design/ds-source/`'s, read-only forever (design spec §1). The component set (its manifest lists
  the primitives — buttons, inputs, cards, chips, list rows, empty states, banners, toasts, tabs
  and the brand-specific status chip and icon circle) exists in the package and is
  not re-specified here. Where a requirement below needs a value, it names the token file, never
  the value.
- **Screen designs.** F7 is not a screen catalog. Screens are designed at implementation time,
  directly in the design system, inside the owning module's slice — the source's UX-gap register
  is explicit that there is *"no new Claude-Design phase"* — and each module PRD states what its
  screens must do. `F7-45` states the closure contract those designs are held to.
- **The honesty laws themselves.** Which tier a number carries, when money renders provisional,
  what a document must disclose and what may never be computed are
  `foundations/F8-data-honesty.md`'s. F7 owns how those laws appear — persistent, adjacent,
  never hover-only, never dropped for want of room (`F7-35`).
- **Format rendering and the language set.** Money, number, date, digit and unit rendering is
  `foundations/F3-localization.md`'s single implementation reading `pack.formats` values from
  `foundations/F1-global-market-framework.md`. F7 states the obligations localization places on
  the *type system* (`F7-14`) and the design-time discipline that keeps layouts honest
  (`F7-41`).
- **Implementation.** No framework, styling library, component API, build gate or platform
  scaffold is stated as a requirement (design spec §14 / DD4). One reference implementation is
  recorded once, so the source's choice is not lost: the v1 build styles with a utility CSS
  framework over an unstyled primitive library, with the design-system package as the token and
  component source (`D6`, post-overlay "Tailwind v4 + Radix in `packages/ui`; Claude-Design mockup
  phase complete"). That is provenance, not a requirement.

## 2. Personas & surfaces

F7 binds **all twelve personas** of `02-personas.md` — EPC Owner · Sales Manager · Sales
Executive · Survey Engineer · Design Engineer · Project Manager · Field Technician · Installation
Team Member · HR/Admin · Finance · Operations · Marketing — and the anonymous customer-link
reader of `foundations/F5-customer-link.md`. Nobody uses the product without using its interface,
so nobody is outside this document.

**Surfaces the laws apply to, without exception** — web and mobile (both platforms from launch,
`OD-3`), the 3D design studio on both, generated documents and drawing sheets, the no-login
customer link, notification surfaces, and exports. Two of those surfaces take partial exemptions,
and both are stated rather than implied: **generated documents and customer-link pages carry
tenant branding** (`F7-07`) while the operator application never does, and **the design system's
component set is a web-and-native pair** rather than one implementation (`F7-39`).

**Mobile/web emphasis.** The emphasis is mobile and the constraint is mobile, but the two are not
the same claim. The design constraint is the small screen: every screen is designed at 375 px
first and the desktop view is the expansion, not the original (`F7-30`, `OV-09`). The emphasis
is the field: the personas who spend their working day inside the product on a phone — Survey
Engineer, Field Technician, Installation Team Member, Sales Executive — are also the personas
most likely to be standing on a roof in sunlight with one hand free, which is why the touch
contract (`F7-29`), the reachability rules inside it, and the high-contrast field mode
(`F7-16`) are product requirements rather than polish. The design system's own framing agrees:
its stated users are *"mostly on mid-range Android phones, often on a roof with poor signal"*,
and it declares both mobile and desktop first-class.

The one surface where this is hardest is the flagship. The source calls full parity at 375 px for
the 3D studio *"the hardest and least negotiable commitment in the system"*, and owner directive 9
closes the escape route: *"no studio feature is dropped on any surface."*

## 3. Feature areas

### F7.1 — The binding visual language and its authority

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F7-01 | **`design/ds-source/` is the single source of every visual fact in the operator product.** The vendored design-system package — its token files, its typefaces, its component set and its brand law — is canon, and it is canon *pixel-perfect*: no document, module, screen, tenant or release re-decides a visual fact it already settles. The character it encodes is part of the ruling, not decoration around it: a precision instrument for people quoting jobs worth a great deal of money, calm under dense data, warm-neutral, with hierarchy carried by luminance and softness rather than by lines. Every requirement below is a rule *about* that artifact, never a replacement for it. | `SRC` — `DOC10.canon` (docs/10: "The vendored UX design-system package (design/ds-source) is the pixel-perfect source of truth"); `D3` post-overlay (`_process/extraction/d-census.md`: visual identity is the vendored package); `R19-CTX` (docs/15 §3 canon paragraph: "The canonical visual system is the vendored UX package at `design/ds-source/`… Agents implement these; they do not re-litigate them") | P0 |
| F7-02 | **When the artifact and a ruling disagree, the ruling wins — and the divergences are named, not silently patched.** The overlay's own standing law governs, verbatim: *"If code and a ruling disagree, the ruling wins until the product owner changes it in this file."* Precedence is therefore: an owner ruling in `docs/15` first, the package's token files second, the package's prose readme last. Three divergences are recorded as of this writing and are **not resolved here**: the readme's dark-mode index line is declared false by `R19-A` (the token files carry no dark values and declare a light colour scheme, so ruling and artifact agree and only the prose is stale); the semibold weight sanctioned by `R19-D` is not yet present in the type tokens (ruling wins — the sanctioned set is the ruling's); and the "medium weight restricted to buttons, tabs and table headers" clause — carried by both the readme and the token file's own header comment (`tokens/typography.css:2`, "500 permitted for buttons, tabs, table headers only") — is dead by the same ruling *(second carrier named by Task 26)*. | `SRC` — `docs/15` preamble, verbatim (`_process/extraction/rulings.md` "Standing law from the source's own preamble"); `R19-A`, `R19-D`, `R19-E`; `DOC10.canon`, `DOC10.light-only`, `DOC10.weights` · artifact state verified against `design/ds-source/tokens/` (read-only) | P0 |
| F7-03 | **No document in this suite, and no screen in the product, restates a design-system value.** Requirements name roles and rules; values stay in the token files. On screens the same law is mechanical: **zero raw colour literals and zero off-scale dimensions** — every visual value reaches a screen through the design system, never by transcription. This is a completion condition, not a style preference (`F7-43`, item 10). | `SRC` — `DOC10.dod` (Definition of Done: "zero raw hex / off-scale values"); `DOC10.canon` · the package's own adherence configuration (`design/ds-source/_adherence.oxlintrc.json`) is named as the reference mechanism, not as a requirement | P0 |
| F7-04 | **v1 is light-only, by law and by fact — dark mode is struck from the definition of done.** There is no dark theme, no per-user theme switch and no dark variant of any surface, and the studio canvas is light like everything else: the source is explicit that *"the old 'studio canvas stays dark' doctrine is dead."* The semantic alias layer is deliberately kept so that a dark value-set can be dropped in later without a redesign; keeping that seam open is a requirement, shipping dark is not. | `SRC` — `R19-A` (docs/15 §3, "final"): "Dark mode is struck from the definition of done. The DS is light-only by law and by fact"; `DOC10.light-only`; `DOC03.light-only` (docs/03 owner ruling 2026-07-24) | P0 |
| F7-05 | **There is no invented logo mark — and the launch app icon is a typographic letter-tile derived from the wordmark (owner ruling 2026-08-04, Q12).** The source is categorical: *"No logo was provided. There is no HelioGrid logo mark — the wordmark is rendered in plain Geist Bold… Do not invent a mark."* Every surface that would ordinarily carry a mark carries the wordmark instead. The one sanctioned exception is the owner's own ruling: the **app icon at launch is a letter-tile — a bold "H" in the brand face on the near-black brand background, derived entirely from the wordmark's style, nothing invented** — which unblocks store submission on both platforms; a **commissioned logo replaces it post-launch via an ordinary update**. Everything else the no-invention law covered stays covered: no screen, asset or release draws a mark of its own. | `SRC` — `DOC10.no-logo` (docs/10: "No logo exists — the wordmark is plain Geist Bold. Do not invent a mark"); `design/ds-source/readme.md` (same law, verbatim); `UXG-27` (register reading); letter-tile launch icon + commissioned-logo-later per owner ruling 2026-08-04 (Q12) | P0 |
| F7-06 | **Two accent systems exist and are never conflated, and the primary action is near-black — never coloured.** (a) The **interactive accent** drives focus rings, links, selected states, active tabs and control fills, and **never fills a button**. (b) The **iridescent trio** is atmosphere only — ambient glow, gradient object, icon wash, AI cue — and **never fills a button, a row, a chip or a field**. (c) The **primary action button is near-black**, in both density modes, on every surface and for every tenant: the source calls this *"the strongest identity marker"*, and it is the one visual fact a reader of this suite should be able to recall without opening the token files. Around all three, restraint is the rule: neutrals carry the overwhelming majority of every screen, a screen carries **at most one accent gesture**, and brand or AI affordances are expressed as a gradient-filled object rather than an outlined icon — which is also how a user tells an AI-produced affordance from an ordinary one. | `SRC` — `DOC10.accent-systems` (docs/10: "Two accent systems, never conflated… The primary action button is near-black, never coloured — the strongest identity marker"); `DOC10.brand-restraint` (docs/10: "Neutrals are the product (95%); iridescence is atmosphere only — it never fills a button, row, chip or field… Restraint is the premium signal: one accent gesture per screen") · the values behind "near-black", the accent and the trio are `design/ds-source/tokens/colors.css`'s | P0 |
| F7-07 | **Tenant branding applies to customer-facing documents and link pages only; the operator application is never restyled per tenant.** A tenant supplies a logo and a primary brand colour that appear on the generated proposal document and the tokenised customer-link pages. There is no tenant stylesheet, no theme upload and no per-tenant palette anywhere in the web or mobile application. When a tenant saves a palette, contrast is **re-verified computationally and the palette is never rejected**: compliant shades are derived from what the tenant chose and previewed live, so a tenant is never told their brand colour is wrong and never allowed to publish an unreadable document. | `SRC` — `DOC10.tenant-branding` (docs/10, whole row); `TC.branding.1` (`_process/extraction/tenant-config-and-ops.md`, journey L1241 — logo, letterhead, colours on customer documents) · the branding **settings surface** is `modules/M01-onboarding-and-tenant-config.md`'s | P0 |

**Behavior detail.** `F7-01` and `F7-02` exist together because a binding artifact without a
precedence rule is not actually binding — the first time a reader finds the readme saying one
thing and a ruling saying another, an unruled reader guesses. The overlay already answers it, and
the answer is quoted rather than reasoned: the ruling wins. The three divergences named in
`F7-02` were found by reading the artifact against the rulings while writing this document; they
are recorded here rather than corrected, because `design/` is read-only source (design spec §1)
and because a PRD that silently "fixed" a token file would be inventing the very thing `F7-03`
forbids. A builder reading this document should expect the type tokens to gain the sanctioned
weight and the readme's stale clauses to fall away; until they do, the ruling is the law.

`F7-04`'s second half is the part that gets lost. Light-only is not "dark mode later"; it is a
scope exclusion with a structural obligation attached. The obligation is that surfaces keep
reaching for semantic aliases rather than raw values, so that a future dark value-set is a data
change instead of a redesign. A screen that hard-codes a light value satisfies "light-only" and
violates `F7-03` and this requirement at once.

`F7-05` was the most consequential absence in the visual system, and the owner has now closed
its shipping consequence (2026-08-04, Q12/Q13): the launch **app icon is the wordmark-derived
letter-tile** — bold "H", brand face, near-black brand background — replacing the stock scaffold
placeholder on one platform and the empty icon set on the other, which unblocks store submission;
the **boot/splash stays plain canvas plus the wordmark** until the commissioned logo arrives
post-launch, and the Android-12+ icon-on-splash shows the letter-tile. The no-invention law
survives intact: the letter-tile is typography from the wordmark, not a drawn mark, and the
commissioned mark remains a brand-asset decision, not a design-at-implementation one.

`F7-06` and `F7-07` are the two rules most likely to be argued with by a stakeholder who wants
"more brand". The answer is in the source's own framing: the product is a precision instrument
that people use to price work worth a great deal of money, and restraint is what makes it read as
trustworthy. `F7-07` draws the line where the money is: the customer sees the tenant's brand on
the document that persuades them, and the employee sees one consistent product every day
regardless of which tenant they work for. The never-reject rule inside `F7-07` is the honest half
— refusing a tenant's brand colour is a support ticket, deriving a readable shade from it and
showing the result is a product.

**Permissions** (`foundations/F2-roles-and-permissions.md`). F7 defines **no capability row of its
own**. Reading an interface requires no grant, and none of the laws above is administrable: there
is no role that may switch off a provenance label, relax the contrast rule, disable the
banner or restyle the application, because none of those is a setting (`F8-06` states the same
law for number honesty). The one adjacent grant already exists elsewhere: authoring the tenant's
customer-document branding under `F7-07` is a tenant-configuration capability held by the EPC
Owner in the `modules/M01` matrix rows of F2.

**Edge cases & what-goes-wrong.**

- *The readme and the tokens disagree.* Ruled by `F7-02`; three live instances named. Nothing is
  patched in `design/`.
- *A screen needs a colour the system does not have.* It does not get one. The escape hatches are
  the two the source sanctions — the dashed drop zone and the high-contrast field mode
  (`F7-15`, `F7-16`) — and a genuinely missing role is a design-system change requested against
  `design/ds-source`, never a local literal.
- *A tenant uploads a brand colour that fails contrast on a white document.* `F7-07`: derived
  compliant shade, previewed live, never a rejection dialog.
- *A tenant asks to theme the operator app.* Declined by `F7-07` and recorded as a non-goal (§5).
  The competitive reading — white-labelling appears in a rival's enterprise tier — is registered
  as a `DESIGN-FOR` verdict in the source's competitive analysis, not adopted here.
- *A surface would like to draw a mark because the wordmark "looks empty".* Forbidden by `F7-05`.
  The ruled outcomes are the wordmark, or — for the app icon alone — the wordmark-derived
  letter-tile (owner ruling 2026-08-04, Q12); the commissioned mark arrives post-launch.
- *Someone proposes shipping dark mode "since the aliases are there".* Out of scope by `F7-04`;
  the aliases exist to make a later decision cheap, not to pre-authorise it.

**Acceptance criteria.**

- **Given** a requirement in any PRD in this suite that concerns appearance, **when** a reader
  looks for the value behind it, **then** the value is found in `design/ds-source/`, and the PRD
  states only the role or rule (`F7-01`, `F7-03`).
- **Given** the package readme and an owner ruling in `docs/15` state different things, **when**
  a builder implements, **then** the ruling is implemented and the divergence is already named in
  `F7-02` rather than discovered (`F7-02`).
- **Given** any screen in the product, **when** its rendered styles are inspected, **then** no raw
  colour literal and no off-scale dimension is present (`F7-03`).
- **Given** any surface, including the design studio, **when** it renders, **then** it renders
  light, and no dark variant, dark canvas or theme switch exists anywhere in the product
  (`F7-04`).
- **Given** a surface that would conventionally show a logo, **when** it renders, **then** it
  shows the wordmark and no invented mark, on every platform — with the app icon showing the
  wordmark-derived letter-tile until the commissioned logo lands (`F7-05`, owner ruling
  2026-08-04 Q12).
- **Given** any primary action button anywhere in the product, in either density mode and for any
  tenant, **when** it renders, **then** it is near-black and not coloured (`F7-06`).
- **Given** any single screen, **when** its use of brand colour is counted, **then** there is at
  most one accent gesture, no brand fill on a button, row, chip or field, and the interactive
  accent and the iridescent trio have not been used in each other's roles (`F7-06`).
- **Given** a tenant has saved a brand colour and logo, **when** a proposal document and a
  customer-link page render, **then** both carry that branding and the operator application
  carries none; and **when** the saved colour would fail contrast, **then** a compliant shade is
  derived and previewed rather than the palette being refused (`F7-07`).

**Localization notes.** Nothing in this area is language-dependent, with one exception that
matters: the wordmark of `F7-05` is a Latin-script word set in the brand face, and it is **not
translated or transliterated** in any locale — it is a name, and `F3-08` already places brand
names in the never-translated set. Tenant-supplied branding under `F7-07` is tenant data and is
likewise never translated (`F3-10`).

**Analytics events.** This area emits none of its own. Tenant-branding save and preview events
belong to `modules/M01`'s configuration surface.

### F7.2 — Type, numerals and colour roles

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F7-08 | **The product has two typefaces — a brand sans and its monospaced companion — and one sanctioned weight set.** The families are named here once, because the design spec names them as part of what is preserved: **Geist** and **Geist Mono**, with the package's declaration in `tokens/fonts.css` and `assets/fonts/` remaining the binding statement of which files ship. The families are the package's (`tokens/fonts.css`, `tokens/typography.css`); the sanctioned weight set is **four weights**, fixed by ruling `R19-D`, which added the semibold weight on the evidence of real usage and killed the readme's clause restricting the medium weight to buttons, tabs and table headers. No screen introduces a fifth weight, and **no weight is synthesised** — a weight that is not in the shipped face is not used. Headings are tightly tracked and that tracking is part of the identity, not a per-screen choice. | `SRC` — `DOC10.weights` (docs/10: "Sanctioned font-weight set… 600 sanctioned by ruling R19-D; the old '500 restricted to buttons/tabs/table-headers' clause is dead"); `R19-D` (docs/15 §3, verbatim ruling and its stated precedent: "usage overrules it"); `design/ds-source/tokens/typography.css` for the values · the no-synthesis obligation pairs with `F3-14` | P0 |
| F7-09 | **Identity-bearing and quantity-bearing text renders in the monospaced face, tabular, and right-aligned in tables.** The set is named by the source and is closed to interpretation: record identifiers, energy readings, monetary amounts, coordinates, invoice numbers and phone numbers. Numeric data is tabular so digits align down a column, and currency and quantity columns are right-aligned in every table. This is legibility law for a product whose users compare numbers for a living, and it applies identically on web, on mobile, in generated documents and in exports. | `SRC` — `DOC10.mono-numerics` (docs/10, whole row); reinforced by `DOC10.money-format`'s rendering clause (the money **format** itself is `F3-19`/`F3-20`, its values `F1-21`) | P0 |
| F7-10 | **The overline micro-label is the single sanctioned exception to the minimum type-size floor.** The signature uppercase micro-label that sits above a section is the one place in the product where text is allowed below N3's floor, and it is allowed **only** as a micro-label — never as body text, never as data, never as interactive text. Its exact size, weight, case and tracking are design-system values (`tokens/typography.css`); what this document fixes is that there is exactly one exception and this is it. A meaning-bearing overline additionally obeys `F7-11`. | `SRC` — `R19-B` (docs/15 §3, verbatim: "The overline is a NAMED EXCEPTION to the 12px floor (N3)… Micro-labels only; never body, data, or interactive text. N3 otherwise stands unchanged"); `DOC10.overline-exception` | P0 |
| F7-11 | **Three colour roles are restricted, and the restriction is on the role rather than on the value.** The tertiary text role is decorative — timestamps and similar — and **never carries load-bearing text**; a meaning-bearing overline renders in the secondary text role instead. The warning tone **always sits on its tinted chip and never appears as bare foreground text**. A disabled state is never the only signal that something is unavailable. Two further restrictions that ruling `R19-C` originally imposed have since been **retired rather than relaxed** — the danger and secondary-text values were darkened at the token level to meet the contrast standard — and any caveat still attached to those two roles describes nothing. | `SRC` — `R19-C` (docs/15 §3, verbatim ruling: "AA-failing DS colours keep their exact hex but get RESTRICTED ROLES"); `DOC10.restricted-colours` and its post-overlay note (2026-07-30: "TWO of ruling C's restrictions were RETIRED (not relaxed)… both now AA") · the accessibility rows behind the retirement are the `UXG-A11Y-*` appendix items of `_process/extraction/ux-gaps.md` | P0 |
| F7-12 | **Status is never conveyed by colour alone — always a label plus a mark.** Every domain status in the product (a lead's stage, a design's review state, a project stage, a payment state) renders as text plus a status dot drawn from the fixed status-to-semantic-colour map, so the status survives colour blindness, greyscale printing and a sunlit screen. The map itself is the design system's (the package ships a status component for exactly this reason); what is binding here is that no surface ever substitutes a colour for the word. | `SRC` — `DOC10.status-not-colour-alone` (docs/10: "Status is never conveyed by colour alone — always label + dot"); N4/N6 of `DOC10.n-rules`; the package's status component is named as the reference implementation | P0 |
| F7-13 | **Interface colour and data colour are two separate systems and are never conflated.** A control is never styled with a data colour and a chart, heatmap or canvas overlay is never drawn in the interface accent. Data palettes used in the studio — roof identity, electrical strings, irradiance — must be **distinguishable under the most common colour-vision deficiency within each set**, and every data-colour encoding is paired with a second, non-colour channel: a label, a pattern or a position. Data colours are **never tenant-overridable**, because they carry engineering meaning rather than brand. | `SRC` — `DOC10.data-colour-law` (docs/10, whole row, = N6 of the interaction contract); reinforced by `F7-07`'s no-tenant-palette rule | P0 |
| F7-14 | **The type system carries every script the product's languages need, at every sanctioned weight, with per-script line height, and every component absorbs text expansion.** Localization places four standing obligations on the visual system and F7 accepts them as its own: a matched script face bundled with the product rather than an operating-system fallback; that face present at **every** weight in `F7-08`'s sanctioned set with no synthesis; the type scale keeping its sizes while **line heights take a per-script adjustment**; and components — buttons, chips, table headers, step titles — sized to their content so that a substantially longer translation wraps or truncates with the full text still reachable, never overflowing and never clipping an amount or a unit. **The face is chosen (owner ruling 2026-08-04, Q14): Noto Sans Devanagari (OFL, free)** for the launch non-Latin script, with the design phase confirming weights and the pairing against the brand face; the obligations above bind it in full. | `SRC` — `MULTI.1` (`_process/extraction/tenant-config-and-ops.md`, journey L1368–1373: the brand face "has no Devanagari coverage… or Devanagari text will render in a system fallback that looks broken beside the Latin"; the *named* Latin face in that row is stale per `D3`/`R19-E`); `MULTI.2` (expansion); `MULTI.3` ("The type scale keeps its sizes; line heights get a per-script adjustment"); `MULTI.8` (buttons wrap or truncate, never overflow); `DOC10.devanagari` · satisfies `F3-13`, `F3-14`, `F3-16`, `F3-17` · artifact state verified against `design/ds-source/assets/fonts/` (read-only) | P0 |

**Behavior detail.** `F7-08` is where the ruling-beats-artifact precedence of `F7-02` bites
first, so it is stated as a count and an authority rather than as a list of numerals: the
sanctioned set is four weights, `R19-D` fixed it, and the token file is where the numbers live.
The no-synthesis clause is the one that protects `F7-14`: a browser or a mobile runtime asked for
a weight a face does not contain will fake it, and a faked weight in a non-Latin script is
precisely the *"looks broken beside the Latin"* failure the source names.

`F7-09` is a small rule with disproportionate consequences, because the product's core act is
comparison — this panel against that one, this quote against last month's, this reading against
the design's estimate. Proportional digits in a column defeat comparison silently; the reader
does not notice they are being slowed down. The set is deliberately enumerated in the source and
carried unedited here so that nobody has to adjudicate whether, say, a phone number "counts".

`F7-11` deserves its odd shape. The ruling it carries is an owner-accepted accessibility
trade-off: rather than change values that were judged part of the look, the owner restricted
where those values may appear. Two of the five original restrictions were later resolved properly
— the values were darkened until they passed — which is why this requirement says *retired, not
relaxed*: a restriction that no longer describes anything must not be carried forward as folklore,
and the three that remain must not be quietly dropped alongside it. The interaction with `F7-10`
is the trap: an overline that means something must not use the decorative tertiary role.

`F7-13`'s last clause is the one most likely to be requested away. A tenant asking to brand the
studio's string colours is asking to make two designs incomparable and a support call unanswerable
— the colour is the engineering identity of a string, not a preference — so the rule is absolute
and pairs with `F7-07`'s no-tenant-palette law.

**Permissions.** No capability row. Nothing in this area is tenant-configurable — `F7-13`
explicitly so.

**Edge cases & what-goes-wrong.**

- *A translated button label does not fit.* `F7-14`: the component sizes to content, wraps, or
  truncates with the full text reachable. It never overflows and never silently clips a unit.
- *A number lands in a language whose digits differ.* Not a type question — digits are always
  Latin by `F3-21`, in every locale and in every document.
- *A script face is missing a sanctioned weight.* `F7-08`/`F7-14`: it is not used and it is not
  synthesised; the face is the problem to fix.
- *A designer wants a heavier heading for emphasis.* No fifth weight (`F7-08`). Emphasis comes
  from the scale and the overline device.
- *A dense table "needs" text below the floor.* Refused by `F7-10` and N3; the answer is the
  functional density mode (`F7-17`), which changes spacing and radius, never type size below the
  floor.
- *A status chip renders correctly but the row is also colour-tinted so users read the tint.*
  Still compliant only if the label is present (`F7-12`); the tint is never the sole signal.
- *A chart is asked to use the interface accent "for consistency".* Refused by `F7-13`.

**Acceptance criteria.**

- **Given** any text in the product, **when** its weight is inspected, **then** it is one of the
  four sanctioned weights and is a real weight of the shipped face, not a synthesised one
  (`F7-08`).
- **Given** a record identifier, an energy reading, a monetary amount, a coordinate, an invoice
  number or a phone number, **when** it renders on any surface, **then** it renders in the
  monospaced face with tabular figures, and in a table its column is right-aligned (`F7-09`).
- **Given** text below the minimum type size, **when** a reviewer finds it, **then** it is an
  overline micro-label or it is a defect (`F7-10`).
- **Given** an overline that carries meaning, **when** it renders, **then** it uses the secondary
  text role, not the decorative tertiary role; and **given** a warning tone, **when** it renders,
  **then** it sits on its tinted chip rather than as bare text (`F7-11`).
- **Given** any status anywhere in the product, **when** the screen is viewed in greyscale,
  **then** the status is still readable because the label is present (`F7-12`).
- **Given** a studio data palette, **when** it is simulated for the most common colour-vision
  deficiency, **then** its members remain distinguishable, and every encoding also carries a
  label, pattern or position (`F7-13`).
- **Given** any screen rendered in a non-Latin launch language, **when** it is inspected, **then**
  the script renders in the bundled matched face at the correct weight with the per-script line
  height, and no component overflows or clips a value or unit (`F7-14`).

**Localization notes.** This whole area is where localization and the visual system meet. `F7-14`
is F7's side of the contract that `F3-13`, `F3-14`, `F3-16` and `F3-17` state from the language
side; the two documents must not diverge in wording, and where a builder needs one sentence it is
this: **the type system carries the script, not the operating system.** The render check that
proves it is `F7-41` and `F7-43` item 7.

**Analytics events.** None of its own.

### F7.3 — Surface grammar: structure, density, overlays and shells

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F7-15 | **There are no structural borders: hierarchy comes from luminance and soft shadow.** Surfaces separate because they are brighter than the canvas behind them and carry a soft, wide, low-opacity shadow — not because a line has been drawn around them. The source states the governing rule as *"Hierarchy comes from luminance and softness, never from lines."* Exactly **two** exceptions exist: the dashed drop zone of a file upload, and the opt-in high-contrast field mode of `F7-16`. Depth is blur and desaturation, never dimming. | `SRC` — `DOC10.no-borders` (docs/10: "No structural 1px borders anywhere; hierarchy comes from luminance + soft shadow. Exceptions: dashed file-upload drop zones, and an opt-in HIGH-CONTRAST FIELD MODE"); `design/ds-source/readme.md` "the one governing rule" | P0 |
| F7-16 | **A high-contrast field mode exists as a sanctioned, opt-in escape hatch for working in sunlight.** It is a product-visible capability, not a styling variant: a user working outdoors can turn it on and get a legible interface on a phone screen in direct sun, and turning it on is the one condition under which the no-borders law of `F7-15` yields. It is opt-in and per user; it is not a theme, not a tenant setting, and not the light/dark switch that `F7-04` excludes. | `SRC` — `DOC10.no-borders` (the named exception) and the ledger's own note: "Field mode is a product-visible capability" · surface context: the field personas of §2 and `design/ds-source/readme.md`'s "often on a roof with poor signal" framing | P1 |
| F7-17 | **Two density modes exist and the choice is made by surface, not by breakpoint.** *Expressive* serves mobile, onboarding, authentication, dashboards, empty states and marketing surfaces; *Functional* serves data tables, long forms, kanban boards, inventory and reporting views, settings and administration. **Colour, type and every rule in this document are identical in both** — only spacing and radius change, and the functional mode remains borderless, keeps its pill controls and keeps the near-black primary action unchanged. The default is expressive on mobile and functional on desktop data screens; the correct density for the surface is a completion condition (`F7-43`, item 9). | `SRC` — `DOC10.density` (docs/10: "Two densities… same colours, type and rules; only spacing and radius change"); `design/ds-source/readme.md` §"Two density modes" | P0 |
| F7-18 | **Overlays blur the layer behind and fade it toward white — never a dark scrim.** When a sheet, modal, popover or menu opens, the content behind it recedes by blurring and lightening, so the user keeps their sense of where they are. No surface in the product darkens the page to focus attention. | `SRC` — `DOC10.overlay-scrim` (docs/10: "Overlays blur the layer behind and fade it toward white — never a dark scrim"); `UXG-24` ("Blur-toward-white overlays per brand law", where "brand law" is post-overlay `design/ds-source`) | P0 |
| F7-19 | **One icon family, outlined, at one stroke weight, never mixed within a context.** Filled variants exist for exactly one purpose — the active item in the mobile navigation — and filled and outlined icons never appear together in the same context. **No icon font, no emoji, and no unicode character used as an icon**, anywhere in the product, including in content the product generates. Brand and AI affordances use the gradient object of `F7-06` rather than an outlined icon. Every icon-only control additionally carries the accessible label of `F7-26`. | `SRC` — `DOC10.iconography` (docs/10, whole row); `DOC10.content-voice` ("no emoji"); the family and stroke weight are design-system values (`design/ds-source/readme.md` §Iconography) | P0 |
| F7-20 | **Photography is masked and never colour-treated.** Site photographs — the roof, its obstructions, the surroundings — are presented masked to the system's corner treatment and are **never colour-filtered, tinted or stylised**, because a designer reads them as evidence. There are no repeating background patterns and no full-bleed photographic surfaces anywhere in the product. | `SRC` — `DOC10.photos` (docs/10: "Photos are masked to 16–24px radius, never colour-filtered; no repeating patterns, no full-bleed photos") · the evidentiary reading pairs with `D35` (survey photos are reference for the design) | P1 |
| F7-21 | **One sheet grammar serves every editor in the product: a sheet on mobile, a side panel on desktop — sheets, not pages.** Editing something in context never navigates away from it. The same grammar carries every editor the product has — an obstruction's settings, a bill-of-materials line, a lead's detail, a filter set — and it carries progressive disclosure inside it (`F7-34`) so a chained or nested editor reveals itself a stage at a time with its live consequences visible rather than presenting every control at once. | `SRC` — `UXG-24` (`_process/extraction/ux-gaps.md`: "One sheet grammar for all editors: spring-in bottom sheet (mobile) / side panel (desktop), progressive disclosure for the bridging chain with the live clearance calc"); the register's cross-cutting contract inherited by every gap: "sheets-not-pages" · the studio's own sheets are `modules/M05-design-studio.md`'s | P0 |
| F7-22 | **The mobile shell is an arc bar with an elevated centre action; the desktop shell is a sidebar.** Mobile navigation is not a flat tab rectangle: it is an arc with a raised centre action that is **near-black — the primary-action colour, not a brand colour** — carrying an ink glyph that never changes per screen, while the **verb it performs adapts to the person's role** (a sales persona adds a lead; a surveyor starts a survey). The surrounding slots are the persona's few standing destinations. Desktop uses the sidebar-and-header shell. Both shells are part of the design system rather than per-module inventions. | `SRC` — `D31` post-overlay (`_process/extraction/d-census.md`: arc bar with elevated centre and role-adaptive verb are live; the "brass centre" half is **void with `D3`** — the centre is the near-black primary action on the white arc, per `R19-E` and mockup ground truth); the register's cross-cutting "arc-nav/sidebar shells" contract | P0 |

**Behavior detail.** `F7-15` is the rule that makes the product look like itself, and it is also
the rule most often broken by accident: a border is the reflex fix for "these two things look too
similar". The correct fix is elevation and luminance, and the correct escape hatch when the
environment defeats them — bright sun on a phone — is `F7-16`, which is a *stated capability*
rather than a designer's discretion. Naming field mode as a requirement matters because it is the
only sanctioned way a screen in this product may show lines, and because the field personas of §2
are the ones who need it.

`F7-17`'s framing is deliberately "by surface, not by breakpoint". A dense data table on a phone
is still a dense data table; a dashboard on a desktop is still expressive. Tying density to
viewport width would also violate N9 (no layout tuned to a fixed viewport) and the touch
contract's "branch on capability, never on screen width" (`F7-29`).

`F7-21` and `F7-22` are carried-forward v1 decisions and therefore fall under `F7-40`: both are
marked **carried-because-better** rather than carried by inertia. The sheet grammar earns it
because the product's editing model is contextual — a designer changing a setback wants to see the
clearance change, not to arrive on a settings page — and because one grammar across a dozen
editors is worth more than a dozen locally optimal ones (`F7-38`). The arc shell earns it because
the centre action is the product's highest-frequency act and a role-adaptive verb puts each
persona's most common act under their thumb; what did **not** survive is its original colour, which
`D3`'s supersession voided.

**Permissions.** No capability row. `F7-16` is a per-user preference like language
(`F3-02`) and requires no grant. `F7-22`'s role-adaptive verb reads from the presets of `F2-01`;
it grants nothing and never exposes an action the person's presets do not permit.

**Edge cases & what-goes-wrong.**

- *Two adjacent surfaces are hard to tell apart.* Elevation and luminance, never a line
  (`F7-15`).
- *A user cannot read the screen in direct sunlight.* Field mode (`F7-16`) — and it must be
  reachable without leaving what they are doing.
- *A sheet opens over a canvas and the user loses their place.* `F7-18`: blur toward white keeps
  the context visible; a dark scrim would erase it.
- *An icon set is extended for one screen and mixes filled with outlined.* Refused by `F7-19`.
- *A photo is auto-enhanced to "look better" in a proposal.* Refused by `F7-20` — it is evidence.
- *A person holds several presets, so the centre verb is ambiguous.* The composition rule for
  role-adaptive home and shell is owned by `modules/M13` (register `Q5`, with `F2-14`'s domain
  lattice as its input); `F7-22` states the shell law and defers the composition.
- *An editor is deep enough that a sheet feels cramped.* Progressive disclosure inside the sheet
  (`F7-21`, `F7-34`), not a page — and never a second, competing navigation model.

**Acceptance criteria.**

- **Given** any screen, **when** its structure is inspected, **then** no structural border is
  present except a file-upload drop zone or a surface in field mode (`F7-15`).
- **Given** a user in direct sunlight, **when** they enable field mode, **then** the interface
  becomes legible and the change is per user and reversible (`F7-16`).
- **Given** a data table and a dashboard, **when** both are viewed on the same device, **then**
  the table renders functional and the dashboard expressive, with identical colour, type and rules
  and different spacing and radius only (`F7-17`).
- **Given** any overlay opens, **when** the layer behind it is observed, **then** it is blurred and
  lightened and never darkened (`F7-18`).
- **Given** any single context, **when** its icons are inspected, **then** they are one family at
  one stroke weight, not mixed filled and outlined, and no emoji or unicode glyph stands in for an
  icon (`F7-19`).
- **Given** any editor in the product, **when** a user opens it, **then** it appears as a sheet or
  side panel over the thing being edited rather than as a navigation to another page (`F7-21`).
- **Given** the mobile application, **when** the shell renders for any persona, **then** the arc
  centre is the near-black primary action with a fixed glyph and a role-appropriate verb
  (`F7-22`).

**Localization notes.** `F7-22`'s centre verb and the shell's slot labels are translated interface
copy (`F3-07`) and are subject to the expansion law (`F7-14`) — a navigation label is one of the
most expansion-sensitive strings in the product. `F7-21`'s sheets carry translated copy over
untranslated tenant and customer data, which is the ordinary mixed-script case `F3-09` declares
normal and requires as a test case.

**Analytics events.** Field-mode enable/disable (`F7-16`) is worth counting, because sustained
use would be evidence that the base contrast is failing the field; the event is defined here and
emitted by whichever surface hosts the preference (`modules/M01`).

### F7.4 — The interaction and accessibility contract

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F7-23 | **The ten numbered interaction and accessibility rules are product law, carried unchanged.** The source is explicit that they are *"never renumber, never reword"*, so they are reproduced verbatim below the table and bind every surface in the suite: **N1** no hover-only meaning · **N2** targets ≥44×44 · **N3** 12px floor (overline exception) · **N4** contrast verified not eyeballed · **N5** accessible names + focus trap/restore · **N6** UI vs data colour · **N7** provenance tier on every number · **N8** destructive actions confirmed AND undoable, undo thumb-reachable on mobile · **N9** no layout tuned to a fixed viewport · **N10** loading/empty/error/offline states are part of "done". N7's four tiers are `foundations/F8-data-honesty.md`'s and are closed there; N6 is `F7-13`; N3's exception is `F7-10`. **AMENDED BY OWNER RULING 2026-08-07 (`Q61`): N10 is now three states — loading, empty, error.** The offline capability was removed from the product, so an `offline` state has nothing to describe. The N-set is carried under *"never renumber, never reword"*, so N10 is **not rewritten in the verbatim blockquote below** — it is amended here by ruling, exactly as `R19-B` amended N3 and recorded it at `F7-10`. The blockquote preserves the source's wording; this cell states what binds. | `SRC` — `DOC10.n-rules` (docs/10 §11, promoted verbatim 2026-07-30; the ledger instructs "cite docs/10 §11, never the POC file"); `D3` post-overlay retains the POC design document "for interaction/a11y/product-law contracts ONLY"; `R19-E` restates the split of authority | P0 |
| F7-24 | **Focus is always visible, and it is never removed.** Every interactive element shows the system's focus ring at the system's offset whenever it is focused, on both platforms and for every input method. Inputs are borderless and signal focus through elevation rather than through a drawn outline (`F7-15`); an input in error carries an inset danger ring. No surface, no density mode and no third-party component suppresses the ring. | `SRC` — `DOC10.focus-ring` (docs/10: "Focus is always a single 2px accent ring at 2px offset, never removed; inputs are borderless and focus via elevation treatment; error state is an inset danger ring"); N5 of `F7-23`; values in `design/ds-source/tokens/` | P0 |
| F7-25 | **Modals and sheets move focus in, keep it inside, and give it back — on both platforms.** When an overlay opens, focus moves into it; while it is open, keyboard and assistive-technology focus cannot escape behind it; when it dismisses, focus returns to the control that opened it. This is stated for both platforms because the source states it for both, and because a sheet is the product's most common editing surface (`F7-21`). | `SRC` — `DOC10.focus-management` (docs/10: "Modals/sheets: focus moves in, wraps, and restores on dismiss — on both platforms"); N5 of `F7-23` | P0 |
| F7-26 | **Every icon-only control carries an accessible label, and a missing label is a build failure rather than a warning.** The source's escalation is carried deliberately: this is not a lint suggestion, it is a completion condition. An icon-only control without a label is unusable by a screen-reader user and ambiguous to everyone else. | `SRC` — `DOC10.icon-label` (docs/10: "Every icon-only control requires an accessible label — a missing label is a build failure, not a warning"); N5 of `F7-23` | P0 |
| F7-27 | **Every data table carries a caption.** The reason is commercial rather than stylistic and is carried from the source: the bill of materials and the quote are commercial documents, and an anonymous table in a document a customer may hold is a defect. A caption names what the table is and, where the table is filtered or scoped, what it currently shows. | `SRC` — `DOC10.table-caption` (docs/10: "Every data table requires a caption — the BOM and quote are commercial documents; no anonymous tables") | P0 |
| F7-28 | **Numeric entry commits on blur with an explicit confirm or cancel — never on keystroke — and it is always available beside every gesture.** A number a user types takes effect when they finish, not while they are typing, and on a mobile keyboard the commit is an explicit action. The second half is the one that makes the product usable with a fingertip: **wherever a value can be set by dragging, pinching or nudging, typing it exactly is also available** — the precise path is never gesture-only. | `SRC` — `DOC10.numberfield-blur` (docs/10: "NumberField commits on blur (explicit Done/Cancel on mobile keyboards) — never on keystroke. Numeric entry is the always-available precise path beside every gesture"); the same clause inside `DOC10.touch-contract` | P0 |
| F7-29 | **The touch contract binds every interactive surface, and the canvases share one gesture vocabulary.** Four clauses, carried whole. *(a) Capability, not width* — build for pointer events and branch on **input capability, never on screen width**. *(b) One vocabulary* — the satellite canvas, the layout editor and the 3D scene use the same gestures: one-finger pan, pinch to zoom, two-finger rotate, tap to select, long-press for contextual actions, drag with snapping, two-finger tap to undo; and **no function is reachable only by wheel, middle-click or keyboard**. *(c) Precision under a fingertip* — magnification, offset dragging, snap-then-nudge, always-available numeric entry (`F7-28`) and an explicit commit. *(d) Reachability* — primary actions sit in the lower third of a phone screen, a destructive action is **never adjacent to a primary one**, and undo stays persistently reachable while any canvas tool is active. One gesture is one undo step. | `SRC` — `DOC10.touch-contract` (docs/10, whole row, including the source's gesture list with its long-press timing and the reachability clauses); `UXG-22` (`_process/extraction/ux-gaps.md`: "Persistent mode bar… one gesture = one undo step; tap-select-then-big-handles replaces ~9px handles; +/− steppers for precise nudge; visible labels, zero hover-only meaning") · the studio's mode toolbar and per-step tools are `modules/M05-design-studio.md`'s | P0 |

**The ten rules, verbatim** (`docs/10` §11 — reproduced because the source forbids rewording them):

> N1 no hover-only meaning; N2 targets ≥44×44; N3 12px floor (overline exception); N4 contrast
> verified not eyeballed; N5 accessible names + focus trap/restore; N6 UI vs data colour; N7
> provenance tier on every number (tiers canonical in R18 — no screen invents a fifth); N8
> destructive actions confirmed AND undoable, undo thumb-reachable on mobile; N9 no layout tuned
> to a fixed viewport; N10 loading/empty/error/offline states are part of "done".

**Behavior detail.** The N-rules are the only part of the retired POC design document that
survives, and they survive precisely because they are not visual: they are the contract that makes
the visual system usable. Their numbering is load-bearing — the source's own rulings cite them by
number (`R19-B` amends N3; `R19-C` preserves N4's gate; `R18` defines N7's vocabulary) — which is
why `F7-23` carries them rather than restating them in this document's own words.

Three of them do the most work in this product. **N1** is the mobile-parity rule in disguise: a
meaning that exists only on hover has no expression on a phone, so N1 is what makes `F7-30`
achievable rather than aspirational. **N7** is `foundations/F8`'s entire law reduced to one line
and is the reason `F7-35` exists as a principle. **N10** is the states rule — loading, empty and error. *(It previously read as four states and was
described here as what made `F7-36` enforceable; both were amended by owner ruling 2026-08-07, `Q61`.)*

`F7-28` and `F7-29` should be read together, because between them they answer the question the
studio raises hardest: how does a person do precise engineering work with a fingertip? The answer
is never "make the handles bigger" alone. It is a mode-based canvas rather than modifier keys,
selection that promotes an object to large handles, snapping that does the coarse work, nudge
steppers and typed entry that do the fine work, and an undo that is always within reach because
the user is expected to experiment. The gesture vocabulary is shared across all three canvases so
that a surveyor who learns the satellite view already knows the 3D scene.

`F7-29`(d)'s "destructive never adjacent to primary" pairs with N8: confirmation and undo are both
required, and undo must be reachable by the thumb of the hand already holding the phone.

**Permissions.** No capability row. Accessibility is not a grant, a tier or a setting: nothing in
`F7-23`–`F7-29` may be disabled by a role, a plan, a tenant configuration or a screen that ran out
of room.

**Edge cases & what-goes-wrong.**

- *A control's meaning is carried by a tooltip.* N1 violation; the meaning must be visible.
- *A third-party or platform component suppresses the focus ring.* `F7-24`: it is restored or the
  component is not used.
- *A sheet is dismissed by gesture rather than by a button.* Focus still returns to the opener
  (`F7-25`).
- *A dense functional table wants smaller tap targets.* N2 is a floor; density changes spacing and
  radius, never the target minimum (`F7-17`).
- *A canvas function exists only as a keyboard shortcut or a scroll-wheel action.* `F7-29`(b):
  every function has a touch path.
- *A drag produces many intermediate states and pollutes undo.* `F7-29`: one gesture is one undo
  step.
- *A user types into a numeric field and navigates away.* `F7-28`: the value commits on blur; it
  does not silently discard, and it does not apply half-typed values along the way.
- *A destructive control sits beside the primary action in a sheet footer.* `F7-29`(d) violation,
  regardless of how it is labelled.

**Acceptance criteria.**

- **Given** any screen, **when** it is audited against the ten rules, **then** it satisfies all
  ten, and any exception cited is `F7-10`'s overline and nothing else (`F7-23`).
- **Given** any interactive element on either platform, **when** it receives focus by keyboard or
  assistive technology, **then** a visible focus ring is present (`F7-24`).
- **Given** a modal or sheet, **when** it opens, **then** focus moves into it and cannot leave it;
  **when** it dismisses, **then** focus returns to the control that opened it (`F7-25`).
- **Given** an icon-only control, **when** the build runs, **then** a missing accessible label
  fails the build rather than warning (`F7-26`).
- **Given** any data table on a screen or in a generated document, **when** it renders, **then** it
  carries a caption naming what it shows (`F7-27`).
- **Given** a numeric field, **when** a user types, **then** nothing commits until blur or an
  explicit confirm; and **given** any value settable by gesture, **when** the user looks for a
  precise path, **then** typed entry is available (`F7-28`).
- **Given** any canvas in the product, **when** a user works on a phone, **then** every function is
  reachable by touch, the gesture vocabulary matches the other canvases, one gesture yields one
  undo step, and undo remains reachable while a tool is active (`F7-29`).

**Localization notes.** Accessible names (`F7-26`) and table captions (`F7-27`) are translated
interface copy (`F3-07`) and must be present in every language, not only the source language — an
untranslated accessible name is an accessibility defect, not a cosmetic one.

**Analytics events.** None of its own. Where a module instruments undo usage or gesture failure on
a canvas, the definition belongs to that module.

### F7.5 — The V2 UX principles

The twelve principles below are the product-level laws V2 designs against. They are stated here
once and referenced by every module; a module PRD applies them to its screens and never re-rules
them. The first eleven say what a screen must be; the twelfth says what a screen must justify.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F7-30 | **Principle 1 — mobile-first at 375 px, with full parity and no reduced edition.** Every screen in the product is designed at the small viewport first and expanded to the desktop one; the small screen is the design constraint, not a cut-down variant of a desktop design. **Every feature is present on both** — including the 3D design studio, which the source names as *"the hardest and least negotiable commitment in the system"* and which owner directive 9 protects absolutely: *"no studio feature is dropped on any surface."* Both viewports render without horizontal scrolling, and this is a completion condition (`F7-43`, item 1), not an aspiration. | `SRC` — `D2` (`_process/extraction/d-census.md`: "Full mobile parity — every screen works at 375px, including the design studio"; docs/15 HONORED); `DOC10.studio-dod` *(shared with `modules/M05`)*; `OD-9` (owner directive 9); `CG-matrix.2` *(shared with `modules/M05` — full design parity on mobile is a competitive line no desktop-first rival holds)* · applies `01-product-overview.md` `OV-09` | P0 |
| F7-31 | **Principle 2 — parity is symmetric: the web experience stays full-featured and the mobile experience feels native and extremely fast.** Mobile-first is a design order, not a hierarchy of investment. The owner's mandate is carried whole: *"Mobile-first DOES NOT mean web is compromised. Every feature must work beautifully on web and mobile. The mobile experience should feel native and extremely fast. The web experience should remain full-featured."* Neither surface is the reduced edition of the other; neither is allowed to be the one that ships later. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Mobile-first (verbatim above); `_process/2026-08-03-v2-prd-design.md` §7 ("mobile-first at 375 px with full web parity; native-feeling, fast mobile") · grounded in source at `D2` and at `OD-3`'s "iOS + Android from day one" surface commitment | P0 |
| F7-32 | **Principle 3 — touch-first, including the flagship.** Touch is the primary input the product is designed for, not an adaptation layer over a pointer design: mode-based canvases rather than modifier keys, selection that promotes an object to large handles, snapping and nudging in place of pixel-accurate dragging, and no meaning that exists only on hover. The full contract is `F7-29`; the principle is what it means for planning — a feature is not designed until it is designed for a fingertip, and the studio is included rather than excepted. | `SRC` — `DOC10.touch-contract`; `UXG-22` *(shared — the touch/interaction contract half is explicitly routed to F7; the studio's mode toolbar and gesture layer stay with `modules/M05`)*; `OD-9` ("Mobile presents the full-parity touch studio… no studio feature is dropped on any surface") | P0 |
| F7-33 | **Principle 4 — one record that travels, and navigation follows the record.** The product replaces a re-keying pipeline with a single record that moves from enquiry through survey, design, proposal, customer link, follow-up, project and money. The interface obligation that follows is concrete: a user reaches the next stage **from the record**, not by leaving it and entering another module; the record's identity, its customer and its current state stay visible as it moves; and **nothing a person has already told the product is ever asked for again** to cross a stage boundary. Modules are an authoring concept, not a navigation model. | `SRC` — `DOC00.one-record` (docs/00: "one record that travels: CRM → survey → 3D design → proposal → no-login customer link → voice-agent follow-up → light project tracking → payments"), disposed by Task 3 and stated as `01-product-overview.md` `OV-04`; `DOC01.gtm` ("one record without rekeying") | P0 |
| F7-34 | **Principle 5 — progressive disclosure: never present the whole control surface at once.** A screen shows what the user needs for the decision in front of them and reveals the rest as they go. The source names the worked failure: *"The BOM screen presents ~286 controls at once"* — and rules that the answer is disclosure, *"not a smaller font"*. The same law shapes chained editors (each stage revealed with its live consequence, `F7-21`), teaching empty states that show a new user what to do rather than apologising for emptiness, and onboarding that asks for the minimum needed to produce one real quote and collects the rest when it is actually needed (`OV-33`). | `SRC` — `S5.rule.uxprob.1` (`_process/extraction/journey-stages.md`: the ~286-control BOM screen, "Needs progressive disclosure, not a smaller font") *(shared — the BOM screen itself is `modules/M05`'s)*; `UXG-24` (progressive disclosure through the nested bridging chain with live calculation); the UX-gap register's cross-cutting "teaching empty states" contract; `S0.rule.minimum-first` *(M01's)* · applies `OV-33` | P0 |
| F7-35 | **Principle 6 — honesty is a UI pattern, not a disclaimer.** Every honesty law in `foundations/F8-data-honesty.md` has a visible form, and the visible form is the requirement: a **provenance tier** rendered beside every user-visible number, **source labels** on energy figures, a **provisional or staleness treatment** on money and on any output whose inputs have moved, an **indicative banner** on a priced document built without a design, and a **structural disclaimer** travelling with structure-bearing output. All of them render as persistent, legible content **adjacent to the number they qualify — never as a tooltip, never behind a tap, never hover-only** (N1, `F8-07`, `F8-31`). A surface that cannot carry the label does not get to carry the number instead. | `SRC` — `F8-01`, `F8-07`, `F8-08`, `F8-12`, `F8-18`, `F8-20`, `F8-28`, `F8-31` (consumed as published requirements); `DOC10.n-rules` N7; the UX-gap register's cross-cutting "provenance labels" contract · marked **carried-because-better** under `F7-40` (design spec §7) | P0 |
| F7-36 | **STRUCK 2026-08-07 by owner ruling (`Q61`) — Principle 7 no longer binds.** It read *"offline is a visible state on every surface, never a silent one"* and required a connection indicator, per-record queued/unsynced state and a staleness banner on cached reads. The offline capability is removed: there is no cache, no queue and nothing to make visible. The principle is **struck in place and not renumbered** — Principles 8–12 keep their numbers so every existing citation still resolves. | `SRC` — struck; see `prd/registers/open-questions.md` `Q61` | — |
| F7-37 | **Principle 8 — the source's speed budgets are product requirements, and the interface is measured against them.** Two are carried from the source as binding: **a lead is added in under thirty seconds on a phone**, and **a remote survey reaches a sendable proposal in under ten minutes**. They are requirements on the *experience*, not on a server: the number of fields, taps, screens and confirmations between intent and done is what determines whether they hold, so any design that adds a step to either path is measured against the budget before it ships. Where a design cannot meet the budget, that is a finding to record, not a number to quietly restate. | `SRC` — `DOC00.product-definition` (docs/00: "from a lead captured in under 30 seconds to a signed project with money collected") *(disposed by Task 3; cited here)*; `DOC01.gtm` (docs/01: "30-second lead add, <10-minute remote survey-to-proposal, one record without rekeying") *(owned by `04-business-model.md`)*; `S2.rule.channel.1` ("Must take <30s on a phone" — `modules/M02`'s); `S0.happy` ("create the first lead in under a minute" — `modules/M01`'s) · reinforced by the owner brief's "extremely fast" mandate (`F7-31`) | P0 |
| F7-38 | **Principle 9 — consistency and stability over cleverness.** Where a problem has already been solved somewhere in the product, it is solved the same way again: one sheet grammar, one gesture vocabulary, one status treatment, one empty-state pattern, one error voice. A novel interaction must be *better enough* to justify the cost of being learned twice, and this principle is the standing tie-breaker whenever a proposed enhancement trades familiarity for ingenuity. | `SRC` — `EOD-6 · consistency-over-cleverness` (docs/15, "Earlier owner decisions (still binding)"; the ledger records it as a principle with no natural module home and names its use: "the tie-breaker when a REC proposes novelty") · reinforced by `OD-6`'s "without unnecessary complexity" clause | P0 |
| F7-39 | **Principle 10 — cross-platform parity is structural, not aspirational.** Every shared visual component exists as a **web-and-native pair satisfying one shared contract, shipped in the same change**. A component that exists on one platform only, or whose two implementations drift because they were changed at different times, is a defect rather than a backlog item — this is what makes `F7-30` and `F7-31` hold in practice instead of degrading release by release. | `SRC` — `DOCARCH.platform-parity` (`_process/extraction/docs-rules.md`, part B: "Every shared visual component exists as a web + native pair satisfying ONE shared API contract, shipped in the same change — cross-platform feature/visual parity is structural law, not aspiration"; the ledger marks it the product-level reading, the mechanism itself being implementation) | P0 |
| F7-40 | **Principle 11 — every carried-over v1 UX decision must earn its place, in writing.** V2 redesigns the experience from first principles, so a pattern that survives from v1 survives **because it is objectively better**, not because it exists. A carried decision is marked *carried-because-better* where it appears, with its reason. Three are carried and marked in this suite. (a) **The component-selection pattern** — the worked example: the accordion sections with three entry paths per component and compliance badges in the picker, validated against the studio census and against four competitors, none of whom offers the self-serve datasheet route (design spec §10, `DD12`). (b) **The honesty UI** — provenance badges, money-staleness treatment and indicative labelling (`F7-35`), carried because no rival prints defensible numbers. (c) **The two shells and the sheet grammar** (`F7-21`, `F7-22`), carried with their reasons stated and with the part that did not survive — the arc centre's original colour — named. Anything carried without this justification is a finding for the closure pass. | `BRIEF` — `_process/2026-08-03-v2-prd-design.md` §7 ("Carried-over UX decisions must earn their place; the honesty UI… and the component-selection pattern (DD12) are carried because they are objectively better, and are so marked") and §2 `DD12`, §10 (the competitive validation behind the worked example) · the pattern's own requirements live in `modules/M05` and `modules/M06` | P0 |
| F7-41 | **Principle 12 — no screen is designed only in English.** Every screen is rendered and reviewed in a non-Latin launch language before it is considered done, because *"English-only design that gets translated later always breaks — and the breakage is invisible until it ships."* This is a completion condition (`F7-43`, item 7) and the practical enforcement of `F7-14`: the script, the line height and the text expansion are checked on the real screen, at both viewports, in the densest surfaces the module owns. | `SRC` — `MULTI.12` *(shared — F3 carries the render check as `F3-18`; F7 carries it as a design-time principle and a Definition-of-Done item)*; `DOC10.dod` item 7 ("rendered in Hindi and checked (layout survives Devanagari + expansion)"); `DOC10.devanagari` | P0 |

**Behavior detail.** These twelve are ordered deliberately: the first three fix the *surface and
input* the product is designed for, the next four fix *how information behaves* on it, the next
three fix *quality and consistency across it*, the eleventh fixes *what may be inherited*, and the
last fixes *when a screen is finished being designed*.

`F7-30` and `F7-31` are two halves of one mandate and are separated because their origins differ
and because separating them prevents the common misreading. The source decision (`D2`) is about
the small screen being the constraint; the owner's brief is about neither surface being sacrificed.
Together they mean: design at 375 px, expand to desktop, and ship both — and the studio is inside
that promise, not beside it.

`F7-33` is the principle module authors will apply most often, because it constrains navigation in
every one of them. Its practical test is simple and worth stating: *can the user get to the next
thing that must happen from the record they are already looking at, without re-entering anything
the product already knows?* If not, the design has re-created the spreadsheet pipeline the product
exists to replace.

`F7-37` is the principle most likely to be treated as marketing copy. It is not. The budgets
describe an experience the product's positioning is built on — replacing a spreadsheet-and-messaging
workflow rather than another SaaS — and they are testable against a real device with a real thumb.
The honest counterpart is stated in the requirement: a design that cannot hold the budget records
the finding, because a budget quietly restated upward is worse than one missed openly.

`F7-40` is what keeps this document from being a v1 preservation order. The rule is procedural but
its effect is substantive: a carried pattern must appear in a PRD with the sentence explaining why
it beat the alternative. The worked example is the component picker, and its justification is
unusually strong — it matches the binding studio census, it matches owner-supplied screenshots of
the working v1 flow, and competitive research found that no rival offers the self-serve datasheet
path at all, routing missing components through support queues instead. That is what
*carried-because-better* is supposed to look like; inheritance without that paragraph is not.

**Permissions.** No capability row. None of these principles is scoped by role. Two touch role
behaviour without being permissions: `F7-22`'s centre verb adapts to the person's presets, and
`F7-35`'s labels are shown to every persona including the anonymous customer-link reader — no role
sees a version of a number without its provenance.

**Edge cases & what-goes-wrong.**

- *A feature is "desktop-only for now".* Refused by `F7-30`/`F7-31`/`F7-39`. There is no "for
  now" — the scope law (`OV-43`) has no later bucket.
- *A studio tool is dropped on mobile because the canvas is small.* Refused by `F7-30` and owner
  directive 9. The answer is the touch contract, not a reduced feature set.
- *A stage transition asks the user to re-enter the customer's details.* `F7-33` violation.
- *A screen is "too complex to simplify".* `F7-34`: disclosure, not a smaller font. The BOM screen
  is the source's own named instance.
- *A number is shown without room for its label.* `F7-35`: the label is not the thing that gets
  dropped — the layout changes, or the number does not appear.
- *A new step is added to lead capture "because it is only one more field".* Measured against
  `F7-37` first.
- *A module invents a second sheet pattern because its case is special.* `F7-38`: it needs to be
  better enough to justify being learned twice, and it must say so in writing.
- *A v1 screen is reproduced because it exists.* `F7-40`: without the justification paragraph it is
  a finding.
- *A screen ships reviewed only in English.* `F7-41`: it is not done.

**Acceptance criteria.**

- **Given** any feature in any module, **when** its surfaces are listed, **then** both platforms
  carry it, the mobile design is the origin rather than the reduction, and the studio is included
  (`F7-30`, `F7-31`).
- **Given** any interactive function anywhere in the product, **when** a user attempts it with a
  fingertip alone, **then** it is reachable and precise without a pointer or keyboard (`F7-32`).
- **Given** a record at any stage, **when** the user needs the next stage, **then** they reach it
  from the record and are not asked for anything the product already holds (`F7-33`).
- **Given** a screen with many controls, **when** a user opens it for a single decision, **then**
  only what that decision needs is presented, with the rest reachable progressively (`F7-34`).
- **Given** any user-visible number on any surface, **when** it renders, **then** its provenance,
  source, staleness or disclosure renders beside it as persistent content (`F7-35`).
- **Given** a rep on a mid-range phone, **when** they add a lead, **then** it takes under thirty
  seconds; and **given** a remote survey, **when** the user proceeds to a sendable proposal,
  **then** the path takes under ten minutes (`F7-37`).
- **Given** two modules solving the same interaction problem, **when** their designs are compared,
  **then** they use the same pattern, or the difference is justified in writing (`F7-38`).
- **Given** a shared visual component, **when** it changes, **then** both platform implementations
  change in the same change (`F7-39`).
- **Given** a UX pattern carried from v1, **when** a reader opens the PRD that carries it, **then**
  a stated reason marks it carried-because-better (`F7-40`).
- **Given** any screen, **when** it is reviewed for completion, **then** it has been rendered and
  checked in a non-Latin launch language at both viewports (`F7-41`).

**Localization notes.** `F7-41` is the localization principle and it is stated as a design-time
obligation rather than a testing one, because the failure it prevents — a layout tuned to English
string lengths — is created at design time. `F7-37`'s budgets are measured in the user's own
language: a path that takes thirty seconds in English and forty-five in Marathi has failed, and
the usual cause is a layout that reflows or truncates under expansion (`F7-14`).

**Analytics events.** Two, defined here because they measure principles rather than features, and
emitted by the modules that own the paths: **time-to-first-lead-created** (the `F7-37` budget on
the capture path, `modules/M02`) and **elapsed remote-survey-to-proposal-sent** (`modules/M04`
through `modules/M06`). Both are product-health measures, not user-facing metrics, and neither is
a dashboard tile (`D37` keeps dashboards decision-oriented).

### F7.6 — Content voice and the per-screen Definition of Done

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F7-42 | **The product's voice is plain, direct, short and in sentence case, and its buttons are verbs.** A button says what it does — "Schedule survey", "Approve design", "Mark installed" — and never "Submit", "OK" or "Click here". An error **states the problem and the fix**, never blames the user, and never shows a code to a field user. Empty states are encouraging rather than apologetic and teach the next action (`F7-34`). Domain vocabulary is used correctly and consistently (the ruled term for the commercial document is *Proposal* everywhere, `OV-35`/`F3-11`); numbers always carry their units; prose lines stay short enough to read; **no emoji appear anywhere in the product**, including in generated content. | `SRC` — `DOC10.content-voice` (docs/10, whole row); `design/ds-source/readme.md` §"Content fundamentals" (same law, with the button examples verbatim) · date, number and unit **rendering** is `F3-19`–`F3-23`; the naming law is `R1` via `OV-35` | P0 |
| F7-43 | **A screen is done only when it satisfies every item of the per-screen Definition of Done — violating any single item means it is not done.** The twelve items, carried whole: (1) works at the mobile and desktop viewports with **no horizontal scroll**; (2) all three base states present — loading, empty and error *(amended by owner ruling 2026-08-07 `Q61`: this item read "all four states present — loading, empty, error and offline"; the offline capability was removed from the product, and the 2026-08-07 sweep struck `offline` from the list without correcting the count, leaving the item self-contradicting until now)*; (3) keyboard-operable with visible focus; (4) contrast verified, including the restricted roles of `F7-11`; (5) every target meets the minimum size; (6) the light theme correct; (7) rendered in a non-Latin launch language and checked, with the layout surviving the script and its expansion; (8) **every user-visible number carries its provenance tier**; (9) density correct for the surface; (10) zero raw colour literals and zero off-scale values; (11) tested at realistic volume — a long list, a full bill of materials, a large design — rather than at demo volume; (12) **wired into the flows that reach it — no orphan screens.** | `SRC` — `DOC10.dod` (docs/10, the Definition of Done, whole row, with its own framing "a screen violating any single item is not done"; the source states item 1's viewport pair as "375px and 1536px" and item 11's volumes as a 200-lead list, a 40-line BOM and a 221-panel design; item 8 cross-refs `foundations/F8` per `R18`/N7) · the source's "LIGHT theme correct" item is `F7-04`; the dark half was struck by `R19-A` | P0 |
| F7-44 | **The Definition of Done applies unreduced to the 3D design studio.** No item is waived, softened or deferred for the flagship: it is light like everything else, it carries its three base states *(amended by owner ruling 2026-08-07 `Q61` — was "four states"; see `F7-43` item 2)*, it carries provenance on every number, and it holds full parity at the mobile viewport — which the source calls *"the hardest and least negotiable commitment in the system."* The studio's own tool census remains its separate acceptance gate and never shrinks. | `SRC` — `DOC10.studio-dod` *(shared — the visual/DoD half is F7's; the studio's tools, screens and census acceptance stay with `modules/M05-design-studio.md`)*; `OD-9` (the studio is the flagship, nothing is compromised against it) | P0 |
| F7-45 | **A registered UX gap is closed only when its screen ships wired into its flow, complete — and closing it is a design-at-implementation act, not a new design phase.** Each of the source's registered gaps is designed by the implementing team **directly in the design system, inside the owning module's slice**; the register's own rule is that there is *"no new Claude-Design phase."* A gap is closed when the screen exists **wired into its flow (never orphaned)**, with loading, empty and error states, at both viewports, with the light theme correct — the Definition of Done, applied to a gap. Rows are marked closed and **never deleted**; new gaps are appended in the same form. The one gap this rule could not close — the missing brand mark (`F7-05`) — was closed by the owner instead (ruling 2026-08-04, Q12: letter-tile at launch, commissioned logo post-launch; §6). | `SRC` — `_process/extraction/ux-gaps.md` register-head frame (verbatim: "designed at implementation time… No new Claude-Design phase"; "closed when the screen ships wired into its flow (never orphaned), with loading/empty/error/offline states, both breakpoints, and the light theme correct"; "closing = ship + mark CLOSED, never delete rows"); `EOD-4` ("UX gaps registered for implementation-time design" — the authority for keeping them as registered design-time gaps) | P0 |

**Behavior detail.** `F7-42` is the smallest-looking requirement in this document and one of the
most visible in use. Two clauses do most of the work. *Buttons are verbs* is what makes a screen
readable without instructions — a person scanning a sheet footer learns what will happen from the
control itself. *Errors state the problem and the fix* is the field rule: a surveyor on a roof
with one bar of signal cannot act on "Error 4012", and telling them what went wrong without
telling them what to do next is the same failure with better manners.

`F7-43` is the closing mechanism of this entire document. Every law above becomes checkable
because the Definition of Done names it as an item, and the source's framing — a screen violating
any single item is not done — is carried rather than softened into a checklist. Item 11 is the one
teams skip: a screen designed against three rows and a short bill of materials looks finished and
fails on the first real tenant, which is why the source states concrete volumes rather than "test
with realistic data". Item 12 is the one that keeps design honest about wiring: a beautiful screen
nobody can reach is not a screen.

`F7-44` exists because the flagship is exactly where an exception would be argued for, and `F7-45`
exists because the product still has a set of registered, unbuilt screens whose closure rule must
live somewhere product-level. Neither creates a new process; both name the one the source already
established.

**Permissions.** No capability row.

**Edge cases & what-goes-wrong.**

- *A screen is complete but unreachable.* Item 12: not done.
- *A screen is verified with demo data.* Item 11: not done.
- *An error message shows an internal code to a field user.* `F7-42` violation.
- *A generated proposal narrative contains an emoji.* `F7-42` violation — the rule covers generated
  content, not only interface copy.
- *A gap row is deleted once its screen ships.* Refused by `F7-45`: mark closed, never delete.
- *A gap is closed by inventing a brand mark.* Refused by `F7-05`; the owner ruled it instead —
  letter-tile at launch, commissioned logo post-launch (2026-08-04, Q12).

**Acceptance criteria.**

- **Given** any interface copy or generated content, **when** it is reviewed, **then** it is
  sentence case, its buttons are verbs, its errors state problem and fix, and it contains no emoji
  (`F7-42`).
- **Given** any screen proposed as complete, **when** it is checked against the twelve items,
  **then** all twelve pass, and a single failure means the screen is not done (`F7-43`).
- **Given** a design-studio screen, **when** it is checked, **then** the same twelve items are
  applied with none waived (`F7-44`).
- **Given** a registered UX gap, **when** its screen ships, **then** it is wired into its flow with
  all four states at both viewports, and its register row is marked closed rather than removed
  (`F7-45`).

**Localization notes.** `F7-42`'s voice rules apply per language, not only in the source language:
a translated button is still a verb, and a translated error still states the fix. Item 7 of
`F7-43` is the render check (`F7-41`, `F3-18`), and the densest screens a module owns are the ones
it must be run against.

**Analytics events.** None of its own.

## 4. Cross-module contracts

**What F7 provides.**

| To | What this document provides |
|---|---|
| Every module `M01`–`M13` | The binding visual language (§F7.1–§F7.3), the interaction and accessibility contract (§F7.4), the twelve UX principles (§F7.5) and the Definition of Done (`F7-43`) that closes each of their screens. |
| `modules/M05-design-studio.md` | `F7-30`/`F7-32`/`F7-44` — full parity at the mobile viewport, the touch contract, and the unreduced Definition of Done; plus `F7-13`'s data-colour law for roof, string and irradiance palettes and `F7-21`'s sheet grammar for its editors. |
| `foundations/F5-customer-link.md` | `F7-07` (the customer-facing surfaces are the only ones carrying tenant branding), `F7-35` (the customer sees the same honesty labels the operator does) and `F7-42` (the same voice). |
| `foundations/F6-notifications-and-search.md` | `F7-42`'s voice rules for notification copy and `F7-12`'s status treatment wherever a notification carries a state. |
| `foundations/F3-localization.md` | `F7-14` — the type-system side of `F3-13`, `F3-14`, `F3-16` and `F3-17`; and `F7-41`/`F7-43` item 7 — the render check `F3-18` states from the language side. |
| `foundations/F8-data-honesty.md` | `F7-35` and `F7-23` (N7): the visual grammar its laws are rendered in, and the rule that a label is never dropped for want of room. |
| `modules/M01-onboarding-and-tenant-config.md` | `F7-07`'s branding constraints for the settings surface it owns, and `F7-16`'s field-mode preference. |

**What F7 expects.**

| From | This document expects |
|---|---|
| Every module | Screens designed at the mobile viewport first with full parity (`F7-30`), navigation that follows the record (`F7-33`), no restated token values (`F7-03`), and a Definition-of-Done pass before any screen is called done (`F7-43`). |
| `modules/M05` | The studio's touch model expressed against `F7-29`'s single gesture vocabulary, and no census entry weakened to make parity easier (`F7-44`). |
| `foundations/F8` | The tier vocabulary and staleness laws, unchanged, so `F7-35`'s patterns have exactly one thing to render. |
| The owner | The brand-asset decision behind `F7-05` — the mark, and whether the boot surface shows it meanwhile (§6, register `Q12`/`Q13`) — and the script-face pairing behind `F7-14` (`Q14`). |

**Standing conformance rule for every later task and for the closure pass.** A document in this
suite conforms to F7 when: (1) it states **no visual value** — no colour literal, spacing step,
radius, elevation, duration, type size or weight numeral — anywhere in a requirement, naming
`design/ds-source` instead (`F7-03`); (2) every screen it specifies is specified for **both
surfaces**, with the mobile one as the design origin (`F7-30`, `F7-31`); (3) any UX pattern it
carries from v1 is marked **carried-because-better with a stated reason** (`F7-40`); (4) its
"what goes wrong" and empty-state coverage reflects **progressive disclosure and teaching empty
states** rather than dense screens and apologies (`F7-34`); (5) every number it puts on a screen
is specified with its honesty label beside it (`F7-35`); (6) every screen it specifies has all
three states (`F7-43`); and (7) it names the **densest screens it owns**
so the render check of `F7-41` has a target. Two mechanical checks are worth running suite-wide at
closure: a scan of requirement text for colour literals and dimension values, and a scan for
module-specified screens that name only one platform.

## 5. Non-goals

Each is an explicit exclusion with its rationale, not a deferral (`OV-43`).

| Non-goal | Rationale |
|---|---|
| **Dark mode** | Struck from the Definition of Done by ruling `R19-A`; the product is light-only by law and by fact, and the studio canvas is light with everything else. The semantic alias layer is kept so a dark value-set can drop in later — that seam is the entire concession (`F7-04`). |
| **A logo mark, designed or generated here** | No mark exists and the source forbids inventing one (`F7-05`). This is an owner decision, recorded as an open question rather than closed by drawing (§6). |
| **Per-tenant theming of the operator application** | Tenant branding reaches customer documents and link pages only. No tenant stylesheet, theme upload or per-tenant palette exists for the web or mobile application (`F7-07`). A rival's enterprise white-labelling is recorded in the source's competitive analysis as a design-for verdict, not adopted. |
| **Tenant-overridable data colours** | Studio data palettes carry engineering meaning — a string's colour is its identity — so they are never brand-configurable (`F7-13`). |
| **A component specification** | The component set lives in `design/ds-source` with its own manifest. Re-specifying components in a PRD would create the duplicate source of truth `F7-03` forbids. |
| **A screen catalog** | Screens are designed at implementation time inside the owning module's slice, directly in the design system; the source is explicit that there is no separate design phase (`F7-45`). F7 states the laws screens are designed under, not the screens. |
| **Motion and animation specifications** | Durations, easings and the signature motions are design-system values (`tokens/motion.css`). What F7 requires of motion is behavioural and stated elsewhere: reduced-motion preferences are honoured as part of the accessibility contract, and no meaning is carried by motion alone (N1). |
| **A styling framework, component library or platform scaffold** | Implementation, barred from PRD bodies (design spec §14 / DD4). `D6` is recorded as design-system provenance only. |
| **Marketing-site or brand-campaign design** | Outside the product; this document governs the product's surfaces, its generated documents and its customer link. |

## 6. Open questions

Mirrored into `registers/open-questions.md`. All three were consequences of the same fact — the
design system was authored without a brand mark and without the launch script's typeface — and
all three were resolved by the owner on 2026-08-04.

**`F7-Q1` — RESOLVED (owner ruling 2026-08-04, Q12).** The launch **app icon is a typographic
letter-tile**: a bold "H" in the brand face on the near-black brand background, **derived from
the wordmark's style — nothing invented**; a **commissioned logo replaces it post-launch** via
an ordinary update. This unblocks store submission on both platforms and unblocks `Q13`'s
splash. The no-invention law (`F7-05`) survives for every other surface; the register's
`UXG-27` disposition notes the resolution.

**`F7-Q2` — RESOLVED (owner ruling 2026-08-04, Q13).** The boot/splash is **plain canvas plus
the HelioGrid wordmark until the Q12 commissioned logo exists**; the Android-12+ icon-on-splash
behaviour follows the Q12 outcome (the letter-tile now, the commissioned mark later). The
accepted platform divergence stands on those terms — the icon shown is now a product asset, not
a stock placeholder — and the product-level law holds as stated: one boot colour, no stock
vendor branding, no flash across the handoff. `UXG-26`'s disposition notes the resolution.

**`F7-Q3` — RESOLVED (owner ruling 2026-08-04, Q14).** The Devanagari face is **Noto Sans
Devanagari (OFL, free)** for HI/MR UI and documents, paired with the brand face; the **design
phase confirms weights and pairing** (`F7-14`'s obligations bind it at every sanctioned weight,
and `F7-41`'s render check proves it). Licensing is clean by construction (OFL).
