# F3 · Localization — languages, translated content, script correctness and formats

Status: draft · Origin mix: SRC-dominant — 28 of 29 requirements are source-derived; one `BRIEF`
requirement (`F3-25`, the open-language-set mandate); no `REC` items · Depends on: `00-README.md`,
`01-product-overview.md` (`OV-35` naming law, `OV-40` vernacular interface), `02-personas.md`,
`foundations/F1-global-market-framework.md` (`pack.formats` — every format *value* F3 renders),
`foundations/F2-roles-and-permissions.md` (the twelve preset names) · Forward:
`foundations/F5-customer-link.md`, `foundations/F6-notifications-and-search.md`,
`foundations/F7-design-language.md`, `foundations/F8-data-honesty.md`, and every module PRD
(`M01`–`M13`) — every user-visible string in the suite renders under this document

## 1. Purpose & scope

This document is the language law book. It states, once, which languages the product speaks, who
chooses the language, what is translated and what is deliberately never translated, what the
product owes a script that is not Latin, and which single implementation renders every number,
amount, date and unit a user reads. Every other document in this suite writes strings and numbers
that land on these rules; none of them re-rules them.

The mandate is the owner's, and it has two halves that must be read together: *"Initially English,
Hindi, Marathi. Design everything assuming many more languages will be added later."* The first
half is the launch set and is source-confirmed (`D25` supersedes the v1 English-only decision).
The second half is the harder one, and it is why this document is written as an open-set law
rather than a three-language specification: a requirement that says "in all three languages" has
already failed the brief. The competitive reading of the same law is recorded in
`01-product-overview.md` `OV-40` — the field workforce is not English-first, and no rival
acknowledges it.

**In scope.** The launch language set and the per-user choice of language; the language picker and
what switching does; the fallback law for missing translations; the boundary between
product-supplied catalog copy and tenant-authored data; the translated / never-translated sets;
one-term-per-concept vocabulary across locales; script coverage, document shaping and layout
resilience under text expansion; the single rendering implementation for money, numbers, dates,
digits and units; and the readiness playbook that makes adding a language configuration rather
than a product change.

**Explicitly not in scope.**

- **Format *values*.** Currency symbol, grouping rule, compact notation, minor unit, date style,
  default timezone, phone specification and default measurement units are market data declared by
  `pack.formats` (`F1-21`; the India values are `F1-46`–`F1-50`). F3 owns the single rendering
  implementation of each; F1 owns what it renders. **No market fact — no currency symbol, no
  grouping example, no timezone — is stated as a requirement in this document.**
- **The visual system.** The type scale, the sanctioned weight set, the font families as design
  values, the component grammar and the per-screen Definition of Done are
  `foundations/F7-design-language.md`'s. F3 states the obligations localization places *on* that
  system — script coverage at every sanctioned weight, per-script line height, layouts that
  survive expansion — and F7 holds the values that satisfy them.
- **The voice agent's language set.** The agent speaks a broader set than the interface (six at
  launch), chosen per customer and configured per tenant. That set, its configuration surface and
  everything the agent says are `modules/M07-sales-execution.md`'s. F3 states the boundary
  (`F3-29`) and nothing more: **the two sets are referenced here, never specified here.**
- **Message and template management surfaces.** Where a tenant authors per-language templates,
  knowledge-base entries or document copy, the surfaces belong to
  `modules/M01-onboarding-and-tenant-config.md`, `modules/M06-proposals.md` and
  `modules/M07-sales-execution.md`. F3 states only what kind of content those strings are
  (`F3-10`) and therefore how they may and may not be handled.
- **Any implementation mechanism.** The catalog format, extraction workflow, per-request
  instances, transformers, polyfills, script-detection primitives and lint gates are described at
  length in the source and are deliberately absent here (design spec §14 / DD4). One reference
  implementation is recorded, once, so the source's choice is not lost: the v1 build uses a
  **compile-time message-catalog library (Lingui v5) with one catalog serving both the web and
  mobile apps** (`docs/10` §7, `D25` "Lingui v5, per-user re-render, Devanagari chain"). That is a
  reference implementation, not a requirement — the requirements below are stated so that any
  implementation satisfying them is acceptable.

## 2. Personas & surfaces

F3 binds **all twelve personas** of `02-personas.md` — EPC Owner · Sales Manager · Sales
Executive · Survey Engineer · Design Engineer · Project Manager · Field Technician · Installation
Team Member · HR/Admin · Finance · Operations · Marketing — and the anonymous customer-link reader
of `foundations/F5-customer-link.md`. Every one of them reads strings and numbers, so every one of
them is inside this law.

The source states the persona case that makes per-user language non-negotiable, and it is worth
carrying verbatim: *"One company can have an English-speaking owner and a Marathi-speaking
surveyor. Language is a user setting."* The two of them share leads, designs, proposals and
projects; they read the same records in different languages on the same day.

**Surfaces the laws apply to, without exception** — web and mobile (both platforms from launch),
generated documents and drawing sheets, the no-login customer link, notifications, exports and
downloads, and the voice agent's spoken text where it reads a product-formatted number.

**Mobile/web emphasis.** The emphasis is mobile, and the reason is demographic rather than
technical: the personas most likely to work in Hindi or Marathi — Survey Engineer, Field
Technician, Installation Team Member — are the personas who live on the phone (`OV-08`). The
narrowest surface is therefore also the one carrying the longest strings, which is why `F3-16`'s
expansion law and `F3-18`'s render check are stated as completion conditions rather than
recommendations. The language picker itself is reachable on both platforms from the first run
onward (`F3-03`).

## 3. Feature areas

### F3.1 — Launch languages and per-user language

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F3-01 | **The interface language set at launch is English, Hindi and Marathi, served from one message catalog for every surface and both platforms.** The set is a product-level list, not tenant data and not market-pack data: a tenant does not choose which languages exist, and a market pack does not add or remove one (a market pack declares formats, `F1-21`, never languages). The list is expected to grow (§F3.5); nothing in the product may assume its size. | `SRC` — `D25` (`_process/extraction/d-census.md`; docs/15: HONORED — "app UI is multilingual: English, Hindi, Marathi", superseding `D12`'s English-only half); `DOC10.i18n-locales` (docs/10 §7.1: "UI languages EN/HI/MR from one catalog") · reinforced by the owner brief (`_process/owner-brief-2026-08-03.md` §Localization, launch set half) | P0 |
| F3-02 | **Language is a per-user setting, never a per-tenant setting.** Each person's interface language is their own; no tenant configuration, admin action, plan tier or market pack sets, forces or restricts the language of the people inside a tenant. Users of different languages coexist in one tenant, on one record, at the same time. | `SRC` — `MULTI.6` (`_process/extraction/tenant-config-and-ops.md`; journey L1395), quoted in §2; `DOC10.i18n-locales` ("language is per-USER, not per-tenant"); `DOC04.user-language-units` (docs/04 — per-user UI language) | P0 |
| F3-03 | **Every user can reach a language picker, at first run and afterwards.** It appears in onboarding on first run and permanently in the user's own profile and preferences — reachable by every persona on both platforms. It lists each language **in that language's own script and name, never translated into the current language**, and it defaults to the device's language when that language is in the set. | `SRC` — `MULTI.5` (journey L1394): "in onboarding (first run) and in Profile & preferences, reachable by every user from More → Profile (mobile) and the sidebar (desktop) … Shows each language in its own script … never translated names. Defaults to the device locale" | P0 |
| F3-04 | **Switching language re-renders the whole application immediately — no reload, no sign-out, and no loss of in-progress work.** The change applies to every open surface at once, including surfaces the user is midway through; a partially completed form, an open sheet or an in-progress capture survives the switch with its entered values intact. | `SRC` — `MULTI.5` ("changing it re-renders the whole app immediately, no reload"); `DOC10.i18n-locales` ("switching re-renders the whole app immediately with no reload"); `D25` overlay phrase "per-user re-render" (docs/15) | P0 |
| F3-05 | **A missing translation falls back to English at runtime — never a bare key, never a blank, never a crash.** The fallback is silent to the user: the sentence appears in English inside an otherwise translated screen rather than as an identifier, an empty space, an error or a broken layout. A missing translation is a content gap to be filled, never a failure state the user is shown. | `SRC` — `DOC10.i18n-fallback` (docs/10 §7.2): "Missing translations fall back to English at runtime — never a bare key, never a crash"; `MULTI.7` (journey L1398): "Missing translation → falls back to English, never shows a raw key" | P0 |
| F3-06 | **Language follows the reader, not the author.** A notification renders in the language of the person receiving it, at the moment it is emitted — not in the language of whoever or whatever triggered it. A customer-facing document or link renders in the customer's language, not the rep's. A record created by a Marathi-speaking surveyor and opened by an English-speaking owner shows each of them their own language around the same unchanged data. | `SRC` — `MULTI.4` (journey L1383–1389: notifications and templates are translated content); `MULTI.6` (per-user language, the coexistence case); notification rendering per docs/04's notification row ("rendered in the user's language at emit time" — cited; `foundations/F6` owns notification mechanics, `foundations/F5` owns the customer link's rendering) | P0 |

**Behavior detail.** Three of these six exist to prevent the same failure — a language setting that
is technically present but practically unusable. `F3-03` prevents a picker nobody can find: it is
offered at first run, when a new user's language is most likely wrong, and it lives permanently in
the one place every persona already knows. Listing each language in its own script matters for the
same reason — a Marathi speaker looking at an English-only list cannot reliably find "Marathi",
but recognises मराठी instantly. `F3-04` prevents a switch that costs the user their work: a reload
that discards a half-finished survey teaches the field to leave the language alone. `F3-05`
prevents a partially translated release from looking broken: English text inside a Hindi screen is
an ordinary, recoverable state, while `proposal.step.3.title` on a screen is a defect the user
must report.

`F3-02` is the structural claim, and it is stronger than a preference. Language sits on the person,
so the same record is read in different languages by different people, which means **the record
cannot store display strings** — every translatable string on a screen is either product-supplied
copy (translated, §F3.2) or tenant/customer data (never translated, `F3-08`, `F3-10`). This is the
distinction the rest of the document rests on, and per-user language is what forces it.

`F3-06` extends the same logic outward. The product's outputs travel to people who never chose a
setting inside it — a customer opening a tokenised link, a recipient of a notification. The
governing question at render time is always *who is reading this*, never *who caused it*.

**Permissions** (`foundations/F2-roles-and-permissions.md`). F3 defines **no capability row**.
Choosing one's own interface language and measurement preference is a personal setting held by
every one of the twelve presets and requires no grant; the F2 matrix has no row for it and needs
none, exactly as it has no row for a person reading their own profile. Nothing in the permission
system may make language a delegated or administered setting — that would contradict `F3-02`.
Where language touches an administered surface, it is because that surface is tenant *content*:
authoring per-language templates rides the M01/M06/M07 rows that already govern those surfaces
(e.g. `F2.M01.configure-agent` for voice-agent templates), never a language permission of its own.

**Edge cases & what-goes-wrong.**

- *The device language is not in the set.* The picker defaults to English and stays fully
  available; the user is never blocked from choosing among the languages that do exist.
- *A user switches language mid-task.* The surface re-renders around their entered values
  (`F3-04`); nothing is submitted, discarded or reset by the switch.
- *A translation is missing for one string on an otherwise translated screen.* English appears in
  place, silently (`F3-05`). Two languages on one screen is an accepted intermediate state; a raw
  key is not.
- *A tenant asks that all its users be locked to one language* (usually the owner's). Refused by
  `F3-02` — the setting is the person's. The tenant may of course train, but the product offers no
  lock.
- *A notification is triggered by a Marathi-speaking rep and delivered to an English-speaking
  owner.* It renders in English (`F3-06`).
- *A user has no language preference recorded yet* (an invited user's first sign-in before
  onboarding completes). The device language decides, English backstops it, and the picker is the
  first-run step that resolves it (`F3-03`).

**Acceptance criteria.**

- Given any user of any preset, when they open onboarding for the first time and when they open
  their profile afterwards, then a language picker is available on both platforms, listing each
  language in its own script and name (`F3-03`).
- Given a user whose device language is in the set, when they first run the app, then the app
  renders in that language without their intervention (`F3-03`).
- Given a user with an in-progress form open, when they change language, then every surface
  re-renders in the new language immediately, without a reload, and their entered values are
  unchanged (`F3-04`).
- Given a string with no translation in the active language, when the surface renders, then the
  English string appears in its place and no identifier, blank or error is shown (`F3-05`).
- Given two users of different languages in one tenant, when they open the same record, then each
  sees the interface in their own language and the record's data identical (`F3-01`, `F3-02`).
- Given a notification or a customer-facing rendering, when it is emitted or opened, then it is in
  the recipient's or customer's language, not the originating user's (`F3-06`).

**Localization notes.** This section *is* the localization law; the note that matters here is
self-referential — the language picker's own labels are translated, but the language **names**
inside it are not (`F3-03`), and the picker must remain legible when it lists a script the current
language does not use. **Analytics events:** language picker opened (surface: onboarding /
profile); language changed (from, to); first-run language resolved (device / default); missing
translation rendered (language, string identity — a content-gap signal, never surfaced to the
user).

### F3.2 — Catalog copy vs tenant data: what is translated, and what is never translated

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F3-07 | **Everything the product says is translated content.** All interface labels, buttons and navigation; all empty states, error messages and help text; notification copy; product-supplied document copy including every honesty and disclosure line required by `foundations/F8-data-honesty.md`; and the display labels the market pack declares for canonical machine values (`F1-22`). A user-visible string authored by the product exists in every language in the set, or it falls back under `F3-05` — there is no third category of "English-only product copy". | `SRC` — `MULTI.4` (journey L1383–1389, the translated column: "All UI labels, buttons, navigation · Empty states, errors, help text · Notifications and WhatsApp templates · Voice agent speech"); pack labels per `F1-22`/`F1-09`; disclosure lines per `F8-20`, `F8-22`, `F8-28` (consumed as published requirements) | P0 |
| F3-08 | **The never-translated set is fixed and binding:** customer and person names; addresses; brand and model names (panels, inverters, and every catalog manufacturer name); technical units — kW, kWh, kWp and their kin; utility/network-operator names; and the market-neutral machine values behind pack labels (`F1-09`). These render identically in every language. **A value and its unit are unbreakable**: they never separate across a line, and the unit is never localized into a translated word. | `SRC` — `MULTI.4` (the not-translated column: "Customer names, addresses · Brand and model names (panels, inverters) · Technical units — kW, kWh, kWp"); `DOC10.units-not-translated` (docs/10 §7.6): "Units are never translated … DISCOM names stay as-is in all locales; value+unit is unbreakable"; `DOC03.currency-units-law` (docs/engineering/03: "kW/kWh/kWp are never translated"); operator-name instance at `F1-51` | P0 |
| F3-09 | **A line that mixes scripts is normal, deliberate, and a required test case.** Latin values, units and names sit inside sentences in any script — the source's own example is a capacity in Latin digits and units followed by a word in Devanagari — and such lines must render with correct shaping, spacing, baseline alignment and line breaking on every surface, including generated documents. Mixed script is never treated as an error, and never worked around by translating a unit or transliterating a name. | `SRC` — `MULTI.9` (journey L1401): "Mixed script in one line ('8.2 kWp सिस्टम') → normal and must look deliberate; test it" | P0 |
| F3-10 | **Tenant-authored content is data, not catalog copy, and the product never translates it.** Message templates (voice-agent scripts, messaging templates), knowledge-base entries, catalog descriptions, document cover copy and terms are tenant content authored **per language** — one stored version per language the tenant uses. The product supplies seeds in the launch languages where the source does, offers authoring per language, and **never machine-translates, auto-fills from another language, or silently substitutes a different language's version**. **Where a version is missing, the ruled fallback applies (owner ruling 2026-08-04, Q10): the reader is shown the original language with a small note saying so** — never a silent machine translation, never an unlabelled substitute — and the gap is still surfaced to the author. | `SRC` — `DOC10.templates-are-data` (docs/10 §7.1): "Voice-agent and WhatsApp message templates are tenant DATA in all three languages — not translation-catalog messages"; `TC.message-templates.1` (cited — M01/M06/`foundations/F6` own the template surfaces; docs/04's per-language template row records one stored version per language); labelled-original fallback per owner ruling 2026-08-04 (Q10) | P0 |
| F3-11 | **One concept, one term, in every language.** The naming law is language-wide, not English-only: where the product rules that a concept has a single name, that ruling binds every locale's translation, and no language may carry a second word for the same thing. The worked instance is the ruling's own: the customer-facing commercial document is a **Proposal** — as entity, interface copy and customer-facing document — in every launch locale, and the words "quote" and "quotation" are banned from interface strings and identifiers in every language. Translators render the single term, retaining the English word where the transliteration reads more naturally in the field. The one exception is search, which accepts the banned words as **query aliases only, never as labels** (`foundations/F6`). | `SRC` — `R1` (`_process/extraction/rulings.md`; docs/15 §1), ruling and consequence: "'Proposal' everywhere — entity, schema, code identifiers, UI copy, and customer-facing documents in all three locales (EN/HI/MR) … No dual vocabulary anywhere" (shared — the search-alias half is `foundations/F6`'s, the customer-link wording `foundations/F5`'s, the entity and document `modules/M06`'s); restated at `01-product-overview.md` `OV-35` | P0 |
| F3-12 | **Canonical product vocabulary has a fixed identity and a translated display, and translation may not collapse it.** Values that the suite defines as closed sets — the four provenance tiers (`F8-02`), canonical stage and blocker values (`F1-09`), status values — keep their fixed English identities as the thing the product means, and their *display* is translated. A translation may not merge two canonical values into one word, and may not introduce a distinction the canonical set does not make; where a language lacks a distinct everyday term, the translation uses a distinguishing phrase. | `SRC` — `F8-02`/`F8-03` (the closed four-tier set and its "no screen invents a fifth tier" rule) and `F1-09` (machine values stay market-neutral; what a user reads is the pack's label) — both consumed as published requirements; `DOCFC.market-vocab` (docs/forward-compat, cited — F1 owns) | P0 |

**Behavior detail.** The translated/not-translated table is the most operationally load-bearing
thing in this document, because getting it wrong is invisible in English and obvious to a customer.
Translating a panel model name produces a document that cannot be matched against a purchase
order. Translating `kWp` produces a specification an electrician cannot read. Transliterating a
customer's name produces a proposal with the wrong name on it. The rule is therefore stated as two
closed lists rather than as a judgement call, and `F3-08`'s list is the source's own.

The catalog-versus-data distinction (`F3-07` vs `F3-10`) is the same rule seen from the authoring
side. Product copy has one author — the product — so it can be translated once, centrally, for
everyone. Tenant content has thousands of authors, says whatever each tenant wants, and goes out
under the tenant's name; machine-translating it would put words the tenant never wrote in front of
that tenant's customer, in a language the tenant may not read. So the product's obligation for
tenant content is structural, not linguistic: **store one version per language, render the one the
reader needs, and never invent the missing one.** Where a version is missing, the ruled fallback
(owner ruling 2026-08-04, Q10) shows the reader the original language with a small note saying
so — never a silent machine translation — and the gap is surfaced to the author.

`F3-11` is the vocabulary consequence of a naming ruling that most readers meet as an
English-only rule. It is not: a translation that renders "Proposal" as one word on the builder and
another on the customer link recreates in Hindi exactly the three-word confusion the ruling
existed to end. The ruling anticipates that some terms travel better untranslated — the English
word is retained where the field says it that way — and that judgement is per string, made once,
recorded in the catalog, and applied everywhere. The identical Hindi/Marathi "Proposal" string
is ruled a **likely source typo** (owner ruling 2026-08-04, Q11): the **translator confirms the
correct renderings at catalog authoring** — a translation-time task, not an open product
question — and the per-string retain-English judgements are made in the same authoring pass.

`F3-12` is the guard on the other side of translation. The suite defines several closed
vocabularies whose whole value is the distinction between their members; a translator working
string-by-string cannot see that `estimated` and `assumed` are members of a set, and the natural
Hindi word for both may be one word. So the constraint is stated at the vocabulary level, where
the translator can be told, rather than discovered when a customer reads a proposal that says the
same thing about two different numbers.

**Permissions.** None of its own. Authoring per-language tenant content is gated by the rows that
already gate those surfaces — voice-agent scripts by `F2.M01.configure-agent`, document copy and
terms by M06's proposal rows, catalog descriptions by `F2.M01.manage-catalog`. Adding a language
to a tenant's template set is not a separate grant; it is the same authoring right exercised
again. No role, on any surface, may edit the product's own catalog copy (`F3-07`) — that is not a
permission that exists.

**Edge cases & what-goes-wrong.**

- *A tenant asks for their templates to be auto-translated into the other launch languages.*
  Refused by `F3-10`; the product offers per-language authoring, and the tenant's own words go out
  under the tenant's name.
- *A brand name is written in Devanagari by a tenant in a free-text field.* It is data and renders
  as entered (`F3-08`); the product neither transliterates nor corrects it.
- *A number and its unit fall at a line break* on a narrow screen. The pair moves together to the
  next line (`F3-08`); breaking between them is a defect, not a wrapping decision.
- *A translated button label needs a unit inside it.* The unit stays Latin inside the translated
  sentence and the line is a mixed-script line (`F3-09`) — the normal case, not an exception.
- *A translation introduces a synonym for a canonical term* — a second Hindi word for Proposal
  appearing on one screen. A defect against `F3-11`, resolved by fixing the string, never by
  adding an alias to the interface.
- *A language has one everyday word covering two canonical values.* The translation uses a
  distinguishing phrase; it never merges the values (`F3-12`).
- *A tenant template exists in Hindi but the reader is a Marathi speaker.* The product does not
  silently show the Hindi version as if it were Marathi; the gap is the author's to close
  (`F3-10`, `F3-Q1`).

**Acceptance criteria.**

- Given any product-supplied user-visible string, when the language set is enumerated, then a
  translation exists for it in every language or `F3-05`'s fallback applies — and no string is
  designated permanently English-only (`F3-07`).
- Given a customer name, address, brand or model name, unit, or operator name, when it renders in
  any language on any surface including generated documents, then it is byte-identical to the
  English rendering (`F3-08`).
- Given a numeric value with a unit, when it renders at any viewport width, then value and unit
  appear together on one line (`F3-08`).
- Given a string mixing Latin values or names with another script, when it renders on any surface
  including a generated document, then shaping, spacing and line breaking are correct and nothing
  is transliterated (`F3-09`).
- Given a tenant-authored template, entry or document copy, when it is rendered in a language the
  tenant has not authored it in, then the product does not display a machine translation or a
  different language's version as if it were that language (`F3-10`).
- Given any language in the set, when interface strings for a single named concept are enumerated,
  then exactly one term is used for it, and the banned synonyms appear nowhere except as search
  query aliases (`F3-11`).
- Given a closed canonical vocabulary, when its display strings are enumerated in any language,
  then each member has a distinct display and no two members share one (`F3-12`).

**Localization notes.** The lists in `F3-07` and `F3-08` are the localization notes every other
document in the suite abbreviates when its own §Localization block says "translated EN/HI/MR" —
that phrase means `F3-07` and is bounded by `F3-08`. **Analytics events:** untranslated-string
coverage per language (content-gap reporting, never user-facing); tenant template rendered with no
version in the reader's language (the `F3-Q1` case, counted so the ruling has evidence);
banned-synonym string detected in any language (a defect signal against `F3-11`).

### F3.3 — Script correctness and layout resilience

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F3-13 | **Every language in the set renders through a bundled face that covers its script, matched to the brand face — never through the operating system's fallback.** The brand face has zero coverage for the launch non-Latin script, and OS fallback rendering (which differs per device and per OS version) is explicitly unacceptable for a product whose documents are commercial artifacts. The bundled face is matched to the brand face for optical size and weight so that a mixed-script line (`F3-09`) reads as one typeface decision rather than two. On a platform without automatic per-codepoint fallback, script runs are resolved explicitly — the obligation is the same on both platforms. | `SRC` — `DOC10.devanagari` (docs/10 §7.5): "the brand face has zero Devanagari coverage; OS-fallback rendering is unacceptable"; `MULTI.1` (journey L1368–1373): pair the Latin face with a matched Devanagari face "or Devanagari text will render in a system fallback that looks broken beside the Latin"; `DOC03.currency-units-law` (docs/engineering/03: "Devanagari renders via a dedicated font chain, never OS fallback"). **The face is chosen (owner ruling 2026-08-04, Q14): Noto Sans Devanagari (OFL, free) is the bundled Devanagari face for HI/MR UI and documents**, paired with the brand face (Geist per `design/ds-source`); the design phase confirms weights and optical pairing. `MULTI.1`'s Inter naming stays superseded (`D3`); the pairing obligation is unchanged and now has its face. `foundations/F7` holds the chain with the type system | P0 |
| F3-14 | **The bundled script face covers every weight the design language sanctions, and the product never synthesizes one.** A script face shipped at fewer weights than the interface uses forces synthetic bolding, which distorts the script's stroke and matras; it is not an acceptable degradation. Weight parity between the brand face and each script face is a condition of adding a language (`F3-27`), not a later refinement. The chosen face — **Noto Sans Devanagari (owner ruling 2026-08-04, Q14)** — ships at the full sanctioned weight set, with the design phase confirming the exact weights and pairing (`F7-14`). | `SRC` — `DOC10.devanagari` + docs/10 §7.5 weight-mapping rule ("bundle both families at the four sanctioned weights … synthetic bolding is banned"); the sanctioned weight set itself is `R19-D` (cited — `foundations/F7` owns the weight set); face per owner ruling 2026-08-04 (Q14) | P0 |
| F3-15 | **Generated documents shape every script correctly — correct conjuncts, matras and ligatures — because they are commercial documents.** A proposal in a non-Latin script is the same legal and commercial artifact as its English counterpart: broken conjuncts are not acceptable output. The document-rendering capability is chosen and kept on the strength of its script shaping; per the suite's vendor rule, the capability is "a document renderer that shapes the product's scripts correctly", and the v1 reference implementation is the headless-browser renderer with the script face bundled into its runtime. This obligation covers every generated artifact — proposals, drawing sheets, exports — not only the proposal PDF. | `SRC` — `DOC03.devanagari-documents` (docs/engineering/03): "Proposals in Hindi/Marathi are commercial documents — 'broken conjuncts are not acceptable'; PDF rendering must shape Devanagari correctly (the vendor choice exists solely to guarantee this)"; `CG-matrix.24` (docs/12 competitive matrix: "Vernacular UI (EN/HI/MR) + Devanagari-correct PDFs" — HG yes, all six rivals no); `CG-reslink.12` (cited — M05 owns drawing sheets, which share this render path) | P0 |
| F3-16 | **Layouts survive text expansion of roughly 15–30% without truncating meaning.** No fixed-width labels; buttons and chips size to their content; table headers wrap rather than clip; **amounts and units are never truncated**; and a long string wraps or truncates with the full text still reachable — it never overflows its container and never hides a value. The source names the usual casualties: buttons, chips, table headers and the proposal builder's eleven step titles. | `SRC` — `MULTI.2` (journey L1375–1378): "Hindi and Marathi run roughly 15–30% longer than English … Any layout tuned to English string lengths will break"; `MULTI.8` (journey L1399–1400): "Long string breaks a button → buttons wrap or truncate with the full text available; they never overflow"; `DOC10.devanagari` ("Layouts must survive ~20–30% Hindi/Marathi expansion: no fixed-width labels, no truncation of amounts or units, buttons size to content"). **Source variance carried, not resolved:** the two statements differ on the lower bound (15% vs 20%); the ceiling — the load-bearing figure for layout — is 30% in both, so the requirement carries the wider band | P0 |
| F3-17 | **Line height is a per-script property; the type scale keeps its sizes.** A script whose glyphs carry strokes above and below the baseline needs more vertical room than the Latin scale allows, and the correct adjustment is per-script line height inside the existing scale — never a smaller size, never a bespoke scale, never ad-hoc spacing on individual screens. | `SRC` — `MULTI.3` (journey L1380–1381): "Devanagari needs more than the Latin scale allows. The type scale keeps its sizes; line heights get a per-script adjustment" (shared — `foundations/F7` owns the type scale that must carry the adjustment) | P0 |
| F3-18 | **A screen is not done until it has been rendered and checked in a non-Latin launch language.** This is a completion condition, not a testing recommendation: the design language's per-screen Definition of Done already lists "rendered in Hindi and checked — layout survives expansion" as one of its items, and the source's own recommendation is to do it early, on real screens, because English-only design that is translated later always breaks and the breakage is invisible until a real user opens it. The five densest surfaces — the BOM, the generated proposal document, the proposal builder, the lead list and the studio panels — are checked in every language in the set. | `SRC` — `MULTI.12` (journey L1406–1410), the source's own recommendation, made binding by `DOC10.dod` item 7 (docs/10 §10 — cited; `foundations/F7` owns the Definition of Done); dense-screen list per `DOC10.add-language` (docs/10 §7.7 step 6). *Vocabulary note: the source's list says "quote"; rendered here per `F3-11` as "the generated proposal document" — `modules/M06`'s name for that artifact (label aligned by Task 26; this row previously coined "the priced document")* | P0 |

**Behavior detail.** This section is the half of localization that is a design problem rather than
a translation problem, and the source is emphatic about it: *"This is a design-system change, not
a translation task."* Three failures follow from treating it as translation. The first is
rendering: text appears, in the wrong typeface, differently on every device, and looks broken
beside the Latin — `F3-13` and `F3-14`. The second is documents: the same failure, but printed and
sent to a customer, where a broken conjunct is a misspelling in a commercial document — `F3-15`.
The third is layout: correct text that does not fit, clipping a button label or, far worse, an
amount — `F3-16` and `F3-17`.

`F3-16`'s "no truncation of amounts or units" is the clause that connects this section to
`foundations/F8-data-honesty.md`. A truncated amount is not a cosmetic defect; it is a wrong
number on screen, and a clipped provenance or disclosure label is a missing one (F8's own
localization notes state the same rule from the other side). The ordering rule when a translated
string does not fit is therefore fixed: **the layout changes, the content does not.**

`F3-18` is what makes the rest of this section verifiable rather than aspirational. The source's
argument for checking early is economic — font, spacing and line-height problems are cheap to fix
while a screen is being designed and expensive once fifty screens share the mistake — and the
Definition of Done is where that argument becomes a rule. It also names the surfaces where the
problem concentrates: dense, numeric, multi-column screens with the least spare horizontal room.

**Permissions.** None. No role, plan, tenant setting or white-label option may substitute a
different font, disable the bundled script face, or relax the expansion behaviour — per-tenant
branding is scoped to customer documents' logo and brand colour and never restyles type
(`foundations/F7` owns that scope).

**Edge cases & what-goes-wrong.**

- *A long translated label breaks a button.* The button wraps or grows; the full text stays
  reachable; it never overflows and never clips a value (`F3-16`).
- *A table header does not fit at 375 px.* The header wraps or the table becomes the narrow-screen
  presentation the design language defines; the header is never abbreviated into ambiguity.
- *A device already has a system font for the script.* Irrelevant — the bundled face is used
  regardless, so rendering is identical across devices (`F3-13`).
- *A generated document shows broken conjuncts.* A defect against `F3-15`, blocking for that
  language's launch — not a cosmetic backlog item.
- *A screen was designed in English and never rendered in another language.* It is not done
  (`F3-18`), whatever else it satisfies.
- *An amount would need to truncate to fit a translated row.* The row changes; the amount is shown
  in full (`F3-16`).

**Acceptance criteria.**

- Given any surface on either platform, when text renders in a non-Latin language, then it renders
  in the bundled script face at the correct weight, identically across devices, with no
  system-fallback rendering and no synthesized weight (`F3-13`, `F3-14`).
- Given a generated document in a non-Latin language, when it is produced and opened, then
  conjuncts, matras and ligatures are shaped correctly throughout (`F3-15`).
- Given a screen whose strings expand by 30%, when it renders at 375 px and at desktop width, then
  no container overflows, no amount or unit is truncated, and every label's full text is reachable
  (`F3-16`).
- Given text in a script requiring more vertical room, when it renders, then line height is
  adjusted per script while the type scale's sizes are unchanged (`F3-17`).
- Given any screen presented as done, when its completion record is inspected, then it has been
  rendered and checked in a non-Latin launch language (`F3-18`).

**Localization notes.** The whole section is a localization note; what it adds to other documents
is the standing obligation that **every module's own §Localization block must name its densest
screens** so `F3-18`'s check has a target. **Analytics events:** none of its own — the checks here
are build- and review-time conditions, not runtime events. Where a runtime signal is useful, it is
the truncation/overflow detector on `F3-16`, reported as a defect signal rather than as usage.

### F3.4 — Formats: one implementation, market values

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F3-19 | **Each format capability has exactly one rendering implementation, product-wide.** One way to render money, one to render non-money numbers, one to render dates and times, one to render measurements. No surface, document template, export, notification or spoken-text composer formats a value of its own, and no surface hand-rolls a date string. The values these implementations use are the tenant market's `pack.formats` declarations (`F1-21`); F3 owns the rendering, F1 owns the values, and neither is duplicated in a module. | `SRC` — `DOC10.money-format` (docs/10 §7.6): "ONE formatting function everywhere"; `DOC10.dates-tz` ("no hand-rolled date strings"); `DOCARCH.money-grouping` (docs/architecture — the rule stated as a hard boundary on the i18n layer); boundary as published at `F1-21` ("F3 owns the single rendering implementation of each of these; the pack owns the values") | P0 |
| F3-20 | **Money never renders through a language's default number format.** Amounts render through the single money implementation using the tenant market's declared symbol, grouping rule, compact notation and minor unit — **the same way in every language** — on web, on mobile, in generated documents, in exports and in the voice agent's spoken text. The formatting does not change because the reader's language changed; only the words around it do. | `SRC` — `DOC10.money-format` ("Indian grouping … in EVERY locale, on web, mobile, PDFs and voice-agent text alike"); `MULTI.11` (journey L1404: "Numbers → Indian grouping in all three languages, always"); `MULTI.4` ("₹ formatting stays Indian in every language"); `DOCARCH.money-grouping` ("Money never renders with locale-default number formats — tenant-currency grouping always"). **Post-overlay narrowing carried:** the grouping is the *market's*, declared by `pack.formats` (`F1-21`; IN values at `F1-46`) under the global-backend ruling — "always" holds per market, not universally (`CG-moat.4` note, `UD-9`) | P0 |
| F3-21 | **Digits are always Latin 0–9, in every language, including generated documents.** No language, market or document type renders numerals in another numbering script. | `SRC` — `DOC10.latin-digits` (docs/10 §7.6): "Digits are always Latin 0-9 — never Devanagari numerals, in any locale, including documents"; the market-side statement at `F1-47` | P0 |
| F3-22 | **Dates, times and durations render through the shared implementation, in the pack's declared style, on the tenant's timezone.** The date style is pack data (`F1-21`); user-facing schedules run on the tenant's timezone (`F1-10`). No surface composes its own date string, and no surface renders a user-facing time in a timezone other than the tenant's. | `SRC` — `DOC10.dates-tz` (docs/10 §7.6): "Dates in '12 Mar 2026' style; default timezone Asia/Kolkata per tenant; no hand-rolled date strings" — the *style and zone values* are pack data (`F1-21`, `F1-48`), the rendering rule is F3's; tenant-timezone law at `F1-10` | P0 |
| F3-23 | **Measurement units follow a per-user preference where the market offers one, with one fixed exception: procurement quantities stay metric regardless.** The preference sits beside the language setting on the same per-user basis (`F3-02`); the market's default is pack data (`F1-21`). Ordering, BOM and supplier-facing quantities are unaffected by the preference — they are metric in every case, for every user. | `SRC` — `DOC04.user-language-units` (docs/04): "units preference m/ft — procurement stays metric regardless"; `DOC10.units-not-translated` ("m/ft follows user preference — EXCEPT procurement quantities, which stay metric"); market default at `F1-50` | P1 |
| F3-24 | **The format layer carries every honesty obligation with the value and never drops one to fit.** A formatted amount keeps its provenance tier, its provisional/stale state and any required disclosure wherever it renders — including compact notation, narrow screens, table cells, exports and spoken text. Compact rendering never abbreviates a figure so far that its qualifier becomes unclear, and one computed figure renders identically wherever it appears rather than being re-formatted independently by each surface. | `SRC` — `DOC10.money-format` ("Money strings also obey provenance and never-stale rendering"), with the laws themselves published at `F8-12`, `F8-01` and `F8-24` (consumed, not restated) | P0 |

**Behavior detail.** "One implementation" is a product requirement rather than an engineering
preference because the failure it prevents is a customer-visible one: the same amount rendered two
ways in one document, or a total on a screen that does not match the total in the PDF. The source
states the rule in its strongest form — one function, everywhere, in every locale, on every
surface including the voice agent's spoken text — and the reason money in particular is singled
out is that money's grouping convention is a *market* property, not a language property. A person
reading the interface in English inside an Indian tenant still reads amounts in that market's
grouping; switching interface language must not change a single digit or separator.

This is also the cleanest illustration of the F1/F3 division. Every value — symbol, grouping,
compact thresholds, minor unit, date style, timezone default, unit defaults — is declared by the
tenant market's pack (`F1-21`) and is therefore stated exactly once in this suite, in F1. This
document deliberately contains **no example amount and no market's grouping rule**, because
repeating one here would create a second place to maintain it and would bake a market into a
market-neutral foundation.

`F3-24` is the join with F8, and it names the specific temptation: compact notation and narrow
screens are where a qualifier gets dropped "for space". The rule is the same as `F3-16`'s — the
layout gives way, the content does not.

**Permissions.** None. Formats are not configurable by role, plan or tenant. A tenant cannot
choose a different grouping, a different date style or a different digit set; those are the
market's, declared by its pack (`F1-12`: packs are platform-authored and never tenant-editable).
The only user-level choice in this section is the measurement preference of `F3-23`, which is a
personal setting requiring no grant.

**Edge cases & what-goes-wrong.**

- *A user reads the interface in one language inside a tenant in another market.* Language and
  market are independent: the words follow the user, the formats follow the tenant's market
  (`F3-20`).
- *A document template wants a custom date format.* Refused — templates use the shared rendering
  (`F3-19`, `F3-22`); the style is the pack's.
- *An export needs machine-readable values.* Machine-readable output is not user-visible
  rendering; where a module defines an export's data form, it does so in its own PRD and does not
  thereby acquire the right to a second user-visible format.
- *The voice agent reads an amount aloud.* It reads the product-formatted value, with the same
  qualification the written figure carries (`F3-20`, `F3-24`); the agent's *speech* is M07's, the
  *number* is not.
- *A compact amount would be ambiguous next to its provenance chip on a narrow screen.* The
  screen changes, not the qualifier (`F3-24`).
- *A user with a foot preference opens a BOM.* Procurement quantities are metric regardless
  (`F3-23`); the preference applies to the surfaces where the source grants it.

**Acceptance criteria.**

- Given any surface, document, export or spoken output in the product, when it renders an amount,
  then it renders through the single money implementation using the tenant market's declared
  format values, identically in every language (`F3-19`, `F3-20`).
- Given a user who switches interface language, when they re-read the same amount, date or
  measurement, then the rendered value is character-identical apart from surrounding words
  (`F3-20`, `F3-22`).
- Given any language and any surface including generated documents, when a numeral renders, then
  it uses Latin digits (`F3-21`).
- Given a user-facing date or time, when it renders, then it uses the pack's declared style and
  the tenant's timezone, from the shared implementation (`F3-22`).
- Given a user with a non-default measurement preference, when they open a procurement or BOM
  quantity, then it is metric (`F3-23`).
- Given an amount carrying a provenance tier, provisional state or disclosure, when it renders
  compactly or on the narrowest supported screen, then the qualifier renders with it (`F3-24`).

**Localization notes.** The inversion worth stating plainly: **formats are not localized by
language** — they are localized by market, and this section is where that distinction is made. The
only language-driven part of a formatted string is the words around the number (a compact
notation's spoken or written unit word, a relative-time phrase, a plural form), and those are
catalog copy under `F3-07`. **Analytics events:** none of its own. A format-bypass detector (a
value rendered outside the shared implementation) is a defect signal for the closure pass, not a
usage metric.

### F3.5 — Adding a language, and the language-set boundary

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F3-25 | **The product is built for an open language set.** Every requirement in this suite is written for "the languages in the set", never for three named ones: no screen, document, template structure, preference, permission or product rule may assume the set's size, its members, or that every member shares one script. A requirement phrased "in all three languages" is a defect against this rule. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Localization: "Initially English, Hindi, Marathi. Design everything assuming many more languages will be added later." · grounded in source at `DOC10.add-language` (the playbook exists because the set is expected to grow) | P0 |
| F3-26 | **Adding a language is configuration, not a product change, and the playbook is defined.** Its steps: add the locale to the language set; translate, with English fallback covering the gaps (`F3-05`); check the script renders in the bundled font chain at every sanctioned weight, adding a face for a new script where needed (`F3-13`, `F3-14`); check the language's plural and grammatical-number rules are available; confirm the money implementation is **unchanged by design** (formats are the market's, not the language's — `F3-20`); and run the expansion check on the five densest screens (`F3-18`). The source's own closing condition holds: no design-token change, no component change, and no change to the product model beyond the language list itself. | `SRC` — `DOC10.add-language` (docs/10 §7.7, the seven-step playbook and its closing rule: "No token change, no component change, no schema migration beyond the enum") | P0 |
| F3-27 | **A language ships only when it passes the readiness gate.** Until its script renders in the bundled chain at every sanctioned weight, its quantity-bearing strings have the language's own plural forms, and the densest screens pass the expansion and render check (`F3-18`), the language is **not offered in the picker** — a half-ready language is absent rather than present and broken. Translation completeness is *not* part of this gate: an incompletely translated language is legitimate and falls back to English string by string (`F3-05`); a language whose script renders wrongly is not. | `SRC` — `DOC10.add-language` (the playbook's font, plural and expansion steps read as preconditions; "Ship" is its final step; **derived reading, stated in-row (Task 26):** the "not offered in the picker" consequence is this suite's reading of the playbook's step order — the source states the steps and their order, not the withholding itself, per the M08-34 disclosure pattern) + `DOC10.i18n-fallback` (untranslated content is an accepted state, which is what separates the two halves of this gate) · readiness posture per the owner brief (`_process/owner-brief-2026-08-03.md` §Localization, "many more languages" half) | P0 |
| F3-28 | **A new script is a font and rendering question, never a redesign.** Adding a language in a script the product does not yet bundle adds that script's face at the sanctioned weights and extends the script-run handling; it does not fork the design system, the component set or the type scale. The per-script line-height mechanism (`F3-17`) is the extension point that makes this true. | `SRC` — `DOC10.add-language` (docs/10 §7.7 step 3: a new script means adding that font family at the four weights and extending the chain and the script-detection map — "no token change, no component change") | P1 |
| F3-29 | **The interface language set and the voice agent's language set are independent, and never converge by accident.** The agent's set is broader than the interface's — six at launch, the three interface languages plus Gujarati, Tamil and Telugu — is chosen **per customer** for a call, and is tenant-configurable. It is specified in `modules/M07-sales-execution.md`; F3 neither owns it, bounds it, nor changes when the interface set changes. A Marathi-speaking rep may call a Hindi-speaking customer from an interface in English, and nothing in the product ties the three choices together. | `SRC` — `D12` surviving half (`_process/extraction/d-census.md`; docs/15: English-only UI SUPERSEDED by `D25`, "agent language set (6) unchanged"): the agent speaks "Hindi, Marathi, Gujarati, Tamil, Telugu + English, chosen per customer"; `MULTI.10` (journey L1402–1403): "Agent language ≠ app language → they are independent"; `R3` consequence, verbatim: "the sets never converge by accident" (shared — the agent capability, its configuration and its speech are M07's) | P0 |

**Behavior detail.** `F3-25` is the requirement the owner's brief actually asks for, and it is
deliberately phrased as a constraint on *how other requirements are written* rather than as a
feature. The failure mode it prevents is cheap to create and expensive to undo: a permission
enumerating three languages, a template surface with three tabs, a document layout with room for
one script's line height, a settings screen with three radio buttons. None of those is wrong today
and each is a small migration later; together they are the reason "add a language" becomes a
release instead of a configuration change.

`F3-26` and `F3-27` split the playbook into the part that is work and the part that is a gate.
The work is translation, and it is explicitly allowed to be incomplete — English fallback
(`F3-05`) means a language can ship at 80% translated and improve, and the source treats
untranslated counts as reported-not-blocking. The gate is everything that cannot degrade
gracefully: a script that renders in a system fallback looks broken on every screen at once, a
missing plural rule produces ungrammatical sentences no fallback catches, and a layout that
clips at 30% expansion hides values. So the rule is asymmetric on purpose — **missing words are
acceptable, broken rendering is not.**

`F3-29` is a boundary rather than a feature, and it is stated here because the two sets are
constantly confused. They answer different questions: the interface set asks what language the
*user* works in, the agent set asks what language a *customer* prefers to be spoken to in. They
have different members, different owners, different configuration models (per-user versus
per-tenant-and-per-customer) and different growth paths. The census text that says the agent
languages default "to the same three" is superseded on this point by the overlay, which holds the
agent set at six and independent — the overlay rule governs, and the divergence is recorded in the
extraction ledger at `D25`.

**Permissions.** Adding a language to the product's set is a platform action, not a tenant one:
no role, plan or tenant setting adds, removes or hides a language (consistent with `F3-01` and
`F3-02`). Configuring which languages the *agent* uses is a tenant action under M07/M01's rows
(`F2.M01.configure-agent`), which is a separate decision about a separate set (`F3-29`).

**Edge cases & what-goes-wrong.**

- *A language is requested in a script the product does not bundle.* The playbook's font step
  applies (`F3-28`): add the face at the sanctioned weights, extend script handling, verify on
  device — not a redesign, and not a reason to refuse the language.
- *A language is ready to render but only partly translated.* It ships; English fills the gaps
  (`F3-05`, `F3-27`).
- *A language's script renders through OS fallback in a first build.* It does not ship until the
  face is bundled (`F3-27`, `F3-13`).
- *A tenant asks for a language that is not in the set.* It is a platform decision and a playbook
  run, not a tenant configuration; nothing in the product offers a tenant-added language.
- *The agent gains a language the interface does not have* (or vice versa). Expected and correct —
  the sets are independent (`F3-29`); neither change implies the other.
- *A requirement in another PRD says "in all three languages."* A defect against `F3-25`, fixed by
  rephrasing to the language set.

**Acceptance criteria.**

- Given any requirement, screen, template structure or preference in the suite, when it is
  inspected, then it makes no assumption about the number, membership or script uniformity of the
  language set (`F3-25`).
- Given a new language, when it is added, then the work consists of the playbook's steps only and
  produces no design-token change, no component change, and no product-model change beyond the
  language list (`F3-26`).
- Given a language that has not passed the script, plural-rule and expansion checks, when the
  language picker renders, then that language is not offered (`F3-27`).
- Given a language that has passed those checks but is incompletely translated, when it is
  selected, then it is offered and its gaps fall back to English (`F3-27`, `F3-05`).
- Given a language in a script the product does not yet bundle, when it is added, then a matching
  face is bundled at every sanctioned weight and no component or token is changed (`F3-28`).
- Given a change to the interface language set, when the agent's language set is inspected, then it
  is unchanged; and given a call, when its language is chosen, then it is chosen independently of
  the rep's interface language (`F3-29`).

**Localization notes.** The playbook of `F3-26` is itself the localization note for every future
market and language; the one clause worth repeating wherever expansion is planned is that the
money implementation is **unchanged by design** when a language is added, because formats belong
to the market, not the language (`F3-20`). **Analytics events:** language adopted per user (which
languages are actually used, per tenant market — the evidence base for which language to add
next); agent language selected per call versus rep interface language (divergence is expected, and
counting it verifies `F3-29` rather than flagging it).

## 4. Cross-module contracts

**What F3 provides.** One language law and one rendering layer. Every consumer references the
requirement ID; none restates the rule in different words, and none narrows it.

| Consumer | What it must conform to |
|---|---|
| Every module PRD (`M01`–`M13`) | All product copy is translated content (`F3-07`) and no string is designated English-only; the never-translated set is respected (`F3-08`); every user-visible number, amount, date and measurement renders through the shared implementations (`F3-19`–`F3-23`); every screen is render-checked in a non-Latin language before it is done (`F3-18`); no requirement assumes the size of the language set (`F3-25`) |
| `modules/M01-onboarding-and-tenant-config.md` | The first-run language picker (`F3-03`); the per-user language and measurement preference on the profile surface (`F3-02`, `F3-23`); tenant template and knowledge-base authoring is per-language tenant data with no machine translation (`F3-10`); no tenant setting locks or restricts user language (`F3-02`) |
| `modules/M06-proposals.md` | Documents render script-correct (`F3-15`); the eleven builder step titles survive expansion (`F3-16`); the document's vocabulary is the single term in every language (`F3-11`); customer-facing documents render in the customer's language (`F3-06`); amounts render through the shared money implementation with their honesty qualifiers (`F3-20`, `F3-24`) |
| `modules/M07-sales-execution.md` | **Owns the agent language set** and everything the agent says (`F3-29`); agent scripts and templates are per-language tenant data (`F3-10`); any number the agent speaks is product-formatted and keeps its qualifier (`F3-20`, `F3-24`) |
| `modules/M05-design-studio.md` | Studio panels are one of the five densest surfaces for the expansion and render check (`F3-18`, `F3-16`); BOM quantities and units follow `F3-08` and `F3-23` (procurement metric regardless); drawing sheets and captures shape script correctly (`F3-15`) |
| `modules/M11`, `modules/M12`, `modules/M13` | Money, usage and dashboard figures render through the shared implementation in the tenant market's formats, in every language (`F3-19`, `F3-20`), carrying their honesty qualifiers at every density (`F3-24`) |
| `foundations/F5-customer-link.md` | The link renders in the customer's language, not the rep's (`F3-06`); its figures and disclosures follow `F3-20`/`F3-24`; its vocabulary is `F3-11`'s single term |
| `foundations/F6-notifications-and-search.md` | Notification copy is translated and rendered in the recipient's language at emit time (`F3-07`, `F3-06`); search accepts the banned synonyms as **query aliases only**, never as labels (`F3-11`) |
| `foundations/F7-design-language.md` | Carries the values that satisfy this document's obligations: script faces at every sanctioned weight (`F3-13`, `F3-14`), per-script line height inside the type scale (`F3-17`), expansion-tolerant components (`F3-16`), and the Definition-of-Done render check (`F3-18`) |
| `foundations/F8-data-honesty.md` | Its labels, tiers and disclosure lines are translated content (`F3-07`) and are never truncated or dropped by the format layer (`F3-24`, `F3-16`); its closed vocabularies are never merged in translation (`F3-12`) |

**What F3 takes from others.** From `foundations/F1-global-market-framework.md`: every format
*value* it renders — `pack.formats` (`F1-21`) and its India instance (`F1-46`–`F1-50`) — plus the
tenant-timezone law (`F1-10`), the one-currency stamp (`F1-07`), the machine-value/label split
(`F1-09`, `F1-22`) and the pack-is-not-tenant-editable rule (`F1-12`). **F3 states no market fact
of its own.** From `foundations/F2-roles-and-permissions.md`: the twelve preset names, and the
absence of any language capability — F3 adds no row. From `foundations/F7-design-language.md`: the
type scale, the sanctioned weight set, the component behaviour under expansion and the per-screen
Definition of Done. From `foundations/F8-data-honesty.md`: the qualifiers the format layer must
carry (`F8-01`, `F8-12`, `F8-24`). From `modules/M07-sales-execution.md`: the agent language set,
referenced and never specified here (`F3-29`).

**Standing verification rule for every downstream task.** A module PRD conforms to F3 when: no
requirement in it names a language count or enumerates the launch languages as a fixed set
(`F3-25`); no requirement formats an amount, date or measurement itself or names a market's
format values (`F3-19`, `F3-20`); every screen requirement's §Localization block names its densest
surfaces for the `F3-18` check; tenant-authored strings are identified as per-language data rather
than catalog copy (`F3-10`); and the module's vocabulary uses one term per concept in every
language (`F3-11`). The closure pass checks the "all three languages" phrasing and the
market-format-in-a-module conditions mechanically across `docs/prd/`.

## 5. Non-goals

- **F3 does not hold format values.** No currency symbol, grouping rule, date style, timezone or
  unit default appears here. Rationale: they are market data with one home (`pack.formats`,
  `F1-21`); a second copy in a foundation would drift and would bake a market into a
  market-neutral document.
- **F3 does not own the visual system.** Fonts as design values, the type scale, weights,
  components and the Definition of Done are `foundations/F7-design-language.md`'s. F3 states the
  obligations localization imposes on them and no more. *(Convention note: the extraction ledger
  routes the whole of `docs/10` to "F3 + F7"; the split applied throughout this suite is **i18n
  rules → F3, design-system rules → F7**, per the ledger's own header note.)*
- **F3 does not specify the voice agent's language set** (six at launch) or anything the agent
  says. Referenced only, at `F3-29`; owned by `modules/M07-sales-execution.md`. Rationale: the sets
  are independent by ruling (`R3`), and specifying one here would create exactly the accidental
  convergence the ruling forbids.
- **No machine translation of tenant content in v1** (`F3-10`). Rationale: tenant content goes out
  under the tenant's name, to that tenant's customer, often in a language the tenant does not read;
  the product does not put words it invented in that position.
- **No per-tenant language restriction, and no tenant-added language.** Rationale: `F3-02` makes
  language the person's; `F3-01` makes the set the product's.
- **No tenant-configurable formats.** Rationale: formats are the market's and packs are
  platform-authored (`F1-12`); a tenant-chosen grouping would break the "one figure renders
  identically everywhere" law (`F3-24`, `F8-24`).
- **No bidirectional-layout claim in v1.** The launch scripts are left-to-right and the
  add-a-language playbook (`F3-26`) covers script coverage, plurals and expansion — not writing
  direction. Recorded as an explicit gap rather than discovered later: a first right-to-left market
  is a design-language change (`foundations/F7`) plus a playbook extension, and this document makes
  no claim to be ready for it today. Nothing in `F3-25` is weakened — no requirement here assumes
  direction either.
- **No implementation content.** Catalog format, extraction workflow, per-request instances,
  transformers, polyfills, script-detection primitives and lint gates are described in the source
  and deliberately absent (design spec §14 / DD4). The v1 reference implementation is recorded once
  in §1 and is not a requirement.

## 6. Open questions

Mirrored into `registers/open-questions.md`.

- **`F3-Q1` — RESOLVED (owner ruling 2026-08-04, Q10).** Tenant content with no version in the
  reader's language is shown in its **original language with a small note** saying so — a
  labelled fallback, never a silent machine translation, never an unlabelled substitute — and
  the gap is surfaced to the author (`F3-10`). The rule scales with the language set (`F3-25`):
  labelled-original is the behaviour at three languages and at ten.
- **`F3-Q2` — RESOLVED (owner ruling 2026-08-04, Q11).** The identical Hindi/Marathi
  "Proposal" rendering is treated as a **likely source typo**: the **translator confirms the
  canonical renderings at catalog authoring** — a translation-time task, closed as such in the
  register — and the per-string retain-English judgements are made in the same authoring pass
  by the named translation authority. `F3-11`'s bindingness and `F3-12`'s no-synonym guard are
  unchanged.
