# HelioGrid V2 — Claude Design session context

Paste this file, unchanged, at the top of EVERY Claude Design session, followed by exactly one
screen brief from `docs/ux/briefs/`. The design system is already selected in Claude Design — nothing
in this file says how anything should look. Everything in this file is **product law**: what a
screen must do, carry and survive. Source of authority: `docs/prd/foundations/F7-design-language.md`
(F7-23, F7-43), `docs/prd/foundations/F8-data-honesty.md`.

## The product in one paragraph

HelioGrid is a mobile-first SaaS platform for solar EPC companies (India-first, global-ready).
Users are salespeople, surveyors, design engineers, project managers, field technicians and their
customers — often on a phone, outdoors, one-handed, in bright sun.

> **The product requires a connection, and that changes what you draw.** Offline was removed by
> owner ruling `Q61` (2026-08-07). **Never draw a sync strip, a sync centre, a queued marker, a
> staleness banner, a last-synced time or an `offline` state** — on any screen, in any frame, at
> any breakpoint. Losing the connection shows one shared full-screen state the design system owns.
> The full rule is the last section of this file; it is repeated here because this paragraph is
> where a field-app mental model forms, and a session that forms it here draws connectivity UI for
> several turns before the rule at the end catches it.

The product's stated
UX goals: **uncluttered screens, progressive disclosure, easy navigation, accessibility**. A
screen shows what the user needs for the decision in front of them and reveals the rest as they
go — never the whole control surface at once (F7-34).

## Laws every screen obeys (the N-rules of F7-23 — product law)

*F7-23 carries these as a numbered set that is "never renumber, never reword". The numbering and
order below are exact; each line then states the operative obligation the rule carries in full.*

- **N1** — no hover-only meaning: every affordance has a visible/touch equivalent.
- **N2** — touch targets ≥ 44×44.
- **N3** — 12px type floor (single exception: the overline role).
- **N4** — contrast verified, not eyeballed. **`F7-11` (P0) adds three restricted roles**, and
  they are the ones a designer reaches for without noticing: **tertiary text is never
  load-bearing**, the **warning tone always sits on its tinted chip and never as a bare
  foreground**, and **disabled is never the only signal** that something cannot be used. `F7-43`
  item 4 names these specifically, so they are part of the contrast check, not separate from it.
- **N5** — accessible names on every control; focus trapped in overlays and restored on dismiss.
- **N6** — UI colour and data colour are distinct systems, never conflated (F7-13): a control is
  never styled with a data colour, and a chart, heatmap or canvas overlay is never drawn in the
  interface accent. Two obligations travel with this rule. Data palettes must be **distinguishable
  under the most common colour-vision deficiency within each set**, and **every data-colour
  encoding is paired with a second, non-colour channel: a label, a pattern or a position**. That
  applies to chart series too — a legend alone is not the second channel.
- **N6b — status is never conveyed by colour alone (F7-12, P0).** Distinct from N6 and easier to
  miss: *"Every domain status in the product — a lead's stage, a design's review state, a project
  stage, a payment state — renders as **text plus a status dot** drawn from the fixed
  status-to-semantic-colour map, so the status survives colour blindness, greyscale printing and a
  sunlit screen. No surface ever substitutes a colour for the word."* Nearly every V1 list, board
  and ledger screen is made of status chips, so this binds more often than any other rule here.
  The map itself is the design system's — you never invent one.
- **N7** — **every user-visible number carries its provenance tier** (measured / derived /
  estimated / assumed — F8-02). F8-01 is absolute: not most numbers, not the headline numbers —
  every number a user can read, including inside generated documents. **A number whose tier
  cannot be established is not rendered as a number; the surface shows what is missing instead.**
  Money is included. **Dates split, by owner ruling 2026-08-07 (Q59, refined the same day):**
  **the test is how the value was arrived at — was it *recorded*, or was it *computed or
  guessed*?**
  - **Recorded → no tier.** Somebody or something wrote this value down: a payment's received-on
    date, a visit's check-in time, an audit timestamp, **a booked appointment time**, a user-set
    "busy until 17:00". Show *when it was recorded*; do not attach a tier. A booking has not
    happened yet, but the *booking* has — nothing estimated it, so no tier can honestly describe
    it, and `assumed` on a firm appointment reads as "we guessed this time".
  - **Computed or guessed → tier**, like any other projection: a payback month, an expected
    commissioning date, an estimated arrival window.

  *(The first form of this ruling tested "is it a fact about something that already happened",
  which sent scheduled visit times to the tiered side where none of F8's four values fits them.
  Owner refined it 2026-08-07 after the question surfaced on `SCR-SHELL-01`.)*

  **Where the tier renders, because N7 and progressive disclosure (F7-34) otherwise collide.**
  A designer told to tier every number *and* to reveal detail progressively will reach for a
  tooltip, an info icon, a colour difference or a footnote. **All four are forbidden**, by two
  live P0 rows. `F8-07`: *"A tier, a source label, a staleness state or an honesty caveat renders
  as **persistent, legible content beside the number it qualifies** — not as a tooltip, not as a
  hover state, not as a colour difference alone, not as a footnote the reader must seek out."*
  `F7-35` puts it as a principle: *"honesty is a UI pattern, not a disclaimer."* So progressive
  disclosure governs **the rest of the screen**, never the tier. If a layout only works by hiding
  the tier, the layout is what changes.
- **N8** — destructive actions are confirmed AND undoable; undo is thumb-reachable on mobile.
- **N9** — no layout tuned to a fixed viewport.
- **N10** — loading, empty and error states are part of "done". *(Amended by owner ruling
  2026-08-07, `Q61`: this rule named four states. The offline capability was removed from the
  product, so there is no `offline` state on any screen.)*

**Light-only (F7-04, P0).** v1 has no dark theme, no per-user theme switch and no dark variant of
any surface. The 3D studio canvas, the map and imagery surfaces, the customer's 3D view and every
editor are light like everything else — the source is explicit that the old "studio canvas stays
dark" doctrine is dead. Where a requirement row quoted in a brief still says otherwise, it is a
transcribed fact from the prototype, carried verbatim for the record and superseded by this law.
This is a product law, not a visual value: the design system owns what "light" looks like.

**One sheet grammar (F7-21, P0).** *"One sheet grammar serves every editor in the product: a sheet
on mobile, a side panel on desktop — sheets, not pages. Editing something in context never
navigates away from it."* The same grammar carries every editor the product has — an obstruction's
settings, a bill-of-materials line, a lead's detail, a filter set. So when a brief pins a bottom
sheet for mobile and says nothing about desktop, the desktop answer is **not** a full-width sheet
and **not** a page: it is the side panel. Progressive disclosure lives inside the sheet (F7-34) —
a chained or nested editor reveals itself a stage at a time with its live consequences visible,
rather than presenting every control at once.

**No emoji, and no character used as an icon (F7-19 / F7-42, both P0).** *"No icon font, no emoji,
and no unicode character used as an icon, anywhere in the product, including in content the
product generates."* Some briefs transcribe requirement rows that use an emoji or a unicode glyph
to name a control — those are transcriptions of prototype text carried verbatim for the record,
and they are superseded by this law. Draw the icon from the design system's family instead. Every
icon-only control also carries an accessible label (F7-26).

**Density is chosen by surface, not by breakpoint (F7-17, P0).** Two density modes exist.
*Expressive* serves mobile, onboarding, authentication, dashboards, empty states and marketing
surfaces; *Functional* serves data tables, long forms, kanban boards, inventory and reporting
views, settings and administration. **Every other rule in this file is identical in both** — the
same colours, the same type, the same near-black primary action, the same borderless surfaces.
Only spacing and radius differ, and the design system owns both values. Pick the mode from what
the screen *is*, not from the viewport it is being drawn at: a data table is functional at 375px
too, and a dashboard stays expressive at 1536px.

**The ladder, lightest last (`F7-15`, owner ruling `Q77`).** This is the one composition rule that
decides how a form looks. Three steps, each brighter than the one behind it:

- **the page** — `--canvas` (#EEF0F3)
- **a container that holds controls** — `--surface-form` (#F6F7F9)
- **a control** — `--surface` (#FFFFFF) at `--e2`

A control is therefore the brightest object on screen and reads as **raised**, with no line anywhere.
**Never draw a border on a control**, and never leave a white control on a white card — that has no
luminance left to spend and the field disappears, which is the defect this rule exists to prevent. A
**primary** button needs no step (a near-black fill is its own separation) and a **ghost/text** button
gets none — no box, no edge, no fill: its label *is* the control, and outlining it collapses the
fill / outline / text hierarchy into two tiers.

**"A control" means anything you press or type into, not just a form field.** Fields, buttons, icon
buttons, filter and facet chips, language pills, slider steppers, colour swatches, the stepper
indicator, a range's end boxes, inline cell editors and **every `Try again` button** are all
`--surface` at `--e2` — 45 components. Searching by component NAME missed the whole retry class;
search by SHAPE instead — a white ground, control-sized, still on `--e1`. Three things are NOT, and each has a
reason: a **disabled** control comes OFF the ladder (one that cannot be pressed is not one to find —
`--e1` where it keeps its ground, `--canvas-sunken` and no shadow at all where it sinks; **whatever
the container beside it does, the part inside it must do too**), a **decorative label** keeps `--e1`
(`Chip` without `onClick` — raising it would say it could be pressed), and a **specimen or listed
row** keeps `--e1` because it is a surface, not a control.

**A 44px white pill is not proof of a control.** `SourceDocument`'s glyph badge is a `<span>` and
`MapSurface`'s zoom readout is a label; both pass every shape test and neither is pressed. The only
test that holds is whether a `<button>` or `Pressable` renders it.

**A hover must clear the resting step.** Rest is `--e2`, so a hover lift is `--e3` — a lift to the
same step is no lift. **Focus ADDS a ring; it never replaces the elevation**, or a focused control
sits lower than an unfocused one.

**The ladder measures itself — do not eyeball it.** `guidelines/ladder-in-a-sheet.card.html` renders a
form inside a `Sheet` and reads its own computed values live, settling until two frames agree. It
caught the whole ladder sitting one rung low on 2026-08-31 and went green on the rebuild, so it is a
probe that has been seen red. Re-run it after any elevation or ground change, and read its FIELD MODE
column for the ghost button: `none` and `--control-edge` are indistinguishable in the base scope, and
only field mode tells a token apart from a hardcoded `none`.

**An overlay is a container too, so it sits on the same rung as a form card.** A sheet, a side panel and a modal are `--surface-form`, including their sticky headers and footers, so a control or a card inside them is `--surface` and reads brighter. A white field on a white sheet is the same white-on-white defect as a white field on a white card.

**A card that holds CONTENT rather than controls stays `--surface` on the page** — it is the top of
the ladder like any control, which is why a content card and a field look alike: both are the bright
thing on a darker ground. Only a container that *wraps* controls takes `--surface-form`, so its
controls have somewhere brighter to go. **`--canvas-sunken` means below its CONTAINER**, not below the
page — a well, a disabled control, a skeleton base — and it carries the same value as the page,
because #EEF0F3 is the darkest ground this palette's marks survive.

**The shell is drawn once, in `SCR-SHELL-01`, and every other screen reuses it (F7-22, P0; Law 5 —
reuse before creation).** Where a screen renders inside the app shell, draw that shell exactly as
`SCR-SHELL-01` fixed it and never re-derive it: at 375 an arc bar with a **raised centre action**
and **exactly four** standing destinations — **Home · Leads · Quotes · More**; at 1536 the icon rail
carrying **the same four**, plus `AppHeader`. **Never add a fifth slot.** Settings, account,
grievance contact and sign-out are reached from **More** and from the avatar menu — a screen that
gives itself a rail entry has invented a navigation the product does not have, and ninety screens
each inventing one is ninety different products. The centre action's *verb* follows the home in
force; the four destinations belong to the person and never change with the screen.

**Most screens carry no shell at all, and that is an answer rather than an omission.** Anything
running before roles exist — sign-in, signup, the whole onboarding corridor — has no shell at
either width, because the shell is built around the role-decided home. Say so on the board rather
than leaving a reader to wonder. Where one screen has more than one life (an onboarding step now, a
settings destination later), the shell appears only on the life that is inside the app, and the
board labels which life each frame is.

## The completion contract (from F7-43)

*`F7-43` states the per-screen Definition of Done as **twelve** items and is categorical about
them: a screen violating any single item is not done. The list below is **this file's** numbering,
not `F7-43`'s — it was written for a design session rather than for the register, so it expands
`F7-43`'s items with the detail a designer actually needs at the drawing board, and adds one of
its own. **Items 1–6 keep their numbers permanently.** Other documents in
this suite cite them by number, so the list is only ever added to, never renumbered — items 7 and
8 were appended for exactly that reason. Beware the collision when reading across: "contract item
7" here is keyboard operability, while "`F7-43` item 7" is language expansion.*

*The cross-walk, so you can check nothing is lost: `F7-43` item 1 → 1 here · item 2 → 2 · item 11
→ 3 · item 7 → 4 · item 12 → 5 · item 3 → 7 · item 10 → 8. Its remaining five (items 4, 5, 6, 8
and 9) are stated above as
product law rather than repeated here — contrast is `N4`, target size is `N2`, provenance is `N7`,
the light theme and the density choice have their own sections. Item 6 below is the one entry with
no `F7-43` counterpart: it is this suite's brief-fidelity rule. **All of it is audited** — see the
self-audit at the end, which walks the N-rules as well as this contract, because a law this file
states and never checks is a law nobody checks.*

1. Works at **375px and 1536px** with **no page-level horizontal scroll** at either. A contained
   region may scroll sideways inside itself where the brief calls for one — a comparison rail, a
   wide table's own scroller — but the page never does. Mobile is designed first, not shrunk
   later. **Parity is about capability, never layout** (`F7-31`): no capability, state or fact is
   present at one viewport and absent at the other — **and the two arrangements are expected to
   differ**, because the constraints do. A desktop that is the phone stretched wide has failed
   this rule just as surely as one that drops a control. The design system owns most of the
   difference already: its components change form by their **own width**, not the viewport, so
   pass the same props at both widths and let each pick its form rather than hand-rolling a second
   layout.
2. **All three base states present** — loading, empty, error — plus every
   screen-specific state the brief lists. Empty states teach ("here's how to add your first
   lead"), never apologise.
3. Designed at **realistic volume**, not demo volume: a 200-lead list, a 40-line bill of
   materials, a 221-panel design. Long content scrolls inside its own region.
   **Every data table carries a caption (F7-27, P0)** — the reason is commercial, not stylistic:
   the bill of materials and the quote are documents a customer may hold, and an anonymous table
   in one is a defect. The caption names what the table is and, where the table is filtered or
   scoped, what it currently shows.
4. Survives **language expansion**: the layout must hold in Hindi and Marathi, not only English.
   No text baked into images.
5. **No orphan screens**: every screen is reachable and leads somewhere. Where the brief pins the
   entry and exit, the design must show those affordances. Where the brief says a point is **"not
   pinned by PRD — designer decides"**, that is a real decision to make, not a gap to ignore:
   choose one, draw it, and write the choice into the brief's Entry & exit section so the next
   screen's designer inherits it rather than inventing a second answer. An unrecorded decision is
   how two screens end up disagreeing about the same flow.

   **One qualification on item 5 — an owner decision, not your judgement.** The product has 150
   screens; **99 are V1** and the other 51 are V2: real scope, deliberately deferred, not designed
   or built before launch. Eight V1 briefs pin an entry or exit to a V2 screen — seven of the eight
   land in the voice-agent admin console (`SCR-M07-07`, `-08`, `-10`, `-11`, `-16`, `-17`, `-18`),
   and the rest are `SCR-M13-02` and `SCR-M09-01`.

   Where a brief pins one of those, **draw the affordance and name the gap.** Do not invent the
   destination, and do not silently drop the control — a dropped exit is how a flow quietly loses
   a step. Note it as *"exit to `SCR-…`, deferred to V2"*, so an engineer reads it as a stub by
   decision rather than an oversight. The `V` column in `docs/prd/registers/screens.md` §2 is the
   authority on which screen is which. This is the one place item 6 below does **not** mean
   "draw everything".
6. Nothing in the brief may be dropped, merged away or simplified out. If two requirements
   genuinely conflict on this screen, say so explicitly — do not silently pick one.

   **The one exception, and it is marked in the text.** 425 requirement rows across 120 briefs
   carry a trailing annotation in this exact form:

   > `_(non-UI half, build-side: … — for awareness, not for drawing)_`

   That clause is a **server or engine obligation with no surface** — an audit-log duty, a
   permission enforced beyond the UI, a stacking rule. It is in the brief so you know the screen
   sits on top of it, not so you draw it. **Design the row; do not invent a control for the
   annotated half.** Item 6 above and the self-audit both apply to the row's UI half only. If you
   cannot tell which half is which, say so rather than guessing — that ambiguity is a brief
   defect worth reporting.
7. **Keyboard-operable throughout, with focus visible at every stop** (`F7-43` item 3). Every
   interactive element on the screen is reachable and operable by keyboard, and the focus ring is
   never taken away: `F7-24` is a P0 row and states it flatly — *"Focus is always visible, and it
   is never removed."* Both platforms, every input method, both density modes, third-party
   components included. `F7-25` adds the overlay half that `N5` also carries: a sheet or modal
   moves focus in, keeps it inside while it is open, and hands it back to the control that opened
   it on dismiss. **What focus *looks* like is the design system's** — as everywhere else in this
   file, the obligation is stated and the appearance is not.

   This one is stated rather than assumed because a touch-first product is exactly where it goes
   missing. The product is designed for a fingertip (`F7-32`), so a screen reviewed only at 375px
   can reach acceptance with no keyboard path at all and nothing in the review will say so — the
   defect surfaces later, on the desktop half of a screen that parity promised would be equal work
   (`F7-31`). Note the traffic is one-directional: keyboard access is required **in addition to**
   touch, never instead of it. `F7-29`(b) is explicit that **no function is reachable only by
   wheel, middle-click or keyboard**, so a keyboard-only path is its own defect.
8. **Zero raw colour literals and zero off-scale values** (`F7-43` item 10). `F7-03` carries it:
   *"No document in this suite, and no screen in the product, restates a design-system value.
   Requirements name roles and rules; values stay in the token files."* Every visual value a
   screen uses — colour, spacing, radius, type size, shadow — reaches it through the design
   system, never by transcription. A hex code placed on a screen, a one-off 13px, a 6px gap that
   is not on the scale: each is a defect at this item even when it looks correct.

   The reason is not tidiness. `design/ds-source/` is the single source of every visual fact
   (`F7-01`), and a transcribed value is a copy that has stopped tracking its source — when the
   token moves the copy does not, and the screen drifts out of the product silently. It is also
   what keeps the two density modes honest: only spacing and radius differ between them (`F7-17`),
   and they can only differ if the screen asked the system for them instead of fixing one. You are
   designing rather than coding, so the working form of this item is: **name the role, never the
   value** — and if you cannot name the role behind something you have drawn, that is precisely
   the defect this item exists to catch. Where a brief quotes a value transcribed from the
   prototype, it is a fact carried verbatim for the record, not a licence to place it.

**Reading the tags a brief uses.** Each requirement carries a tier: **P0** ships, **P1** is
wanted, **P2** is later. A row additionally marked **`REC`** is a *recommendation* — it is not
accepted scope, and it appears on five screens only. Draw a `REC` row as a clearly separable
element so it can be removed without redrawing the screen around it, and say in your notes which
element it is.

## The self-audit (run at the end of every session, before the screen is accepted)

Walk **three lists**, in this order. For every entry on every list, answer **PASS or FAIL,
pointing at the specific element that satisfies it**. A claim of PASS without a pointed-at element
is a FAIL. Fix all FAILs in the same session.

1. **The brief's REQUIREMENTS list, row by row** — the UI half of each row, per item 6's
   annotation exception.
2. **The completion contract above, item by item** — all eight, items 1–8.
3. **Everything else this file states** — not a closed list, because the point is that nothing
   stated here goes unchecked. It includes `N1` through `N10` (`N6b` among them); light-only
   (`F7-04`); the one sheet grammar (`F7-21`); no emoji and no character used as an icon
   (`F7-19`/`F7-42`); the density choice (`F7-17`); progressive disclosure (`F7-34`) — a screen
   shows what the decision in front of the user needs and reveals the rest as they go; the `REC`
   rule — a recommendation row is drawn as a clearly separable element and your notes say which
   element it is; and the offline-residue rule — if the brief asks for an offline state, a
   staleness banner, a queued marker or a last-synced time, it is residue and you do not draw it.
   Where a law has no subject on this screen, say so and say why — *"N8: no destructive action on
   this screen"* is a PASS with a pointed-at absence. Silence is not a PASS.

**Why the third list is here.** This audit used to walk the contract alone, and most of `F7-43`'s
twelve items are not in the contract: contrast is `N4`, target size is `N2`, provenance is `N7`,
the light theme and the density choice have their own sections. So those laws were pasted at the
top of every session and then never checked at the end of one. **A law this file states but never
audits is a law nobody checks** — and it fails quietly, because nothing in the session output
records that it was skipped, so the screen reads as fully audited when it is not. Three lists,
every screen, every time.

---

**Offline was removed from this product (owner ruling 2026-08-07, `Q61`).** There is no cache, no sync, no queue, no staleness and **no `offline` state on any screen**. Losing the connection shows one shared full-screen state that the design system owns — never a state you design per screen. The single exception in the whole product is that field **photographs** are held on the device and upload when the connection returns; that status appears on `SCR-M04-07` only. If a brief still asks for an offline state, a staleness banner, a queued marker or a last-synced time, it is residue — do not draw it.
