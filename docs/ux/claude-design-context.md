# HelioGrid V2 — Claude Design session context

Paste this file, unchanged, at the top of EVERY Claude Design session, followed by exactly one
screen brief from `docs/ux/briefs/`. The design system is already selected in Claude Design and owns
how everything looks. Everything in this file is **product law**: what a screen must do, carry and
survive. Authority: `docs/prd/foundations/F7-design-language.md` (`F7-23`, `F7-43`, `F7-46`),
`docs/prd/foundations/F8-data-honesty.md`.

## 1 · The product

HelioGrid is a mobile-first SaaS platform for solar EPC companies (India-first, global-ready).
Users are salespeople, surveyors, design engineers, project managers, field technicians and their
customers — often on a phone, outdoors, one-handed, in bright sun.

The product's stated UX goals: **uncluttered screens, progressive disclosure, easy navigation,
accessibility**. A screen shows what the person needs for the decision in front of them and reveals
the rest as they go — never the whole control surface at once (`F7-34`).

**The product requires a connection.** Never draw a sync strip, a sync centre, a queued marker, a
staleness banner, a last-synced time or an `offline` state — on any screen, in any frame, at any
breakpoint. Losing the connection shows one shared full-screen state the design system owns. The
single exception: field **photographs** are held on the device and upload when the connection
returns; that status appears on `SCR-M04-07` only. A brief that still asks for any of these carries
residue — do not draw it.

## 2 · Words — a screen is not a manual (`F7-46`)

Progressive disclosure governs **prose**, not only controls. Every word on a frame is one of five
kinds. Each kind has ONE form and ONE home, so a reader knows what a word is from where it sits and
how it looks, before reading it.

| Kind | It answers | Its only form | Its home |
|---|---|---|---|
| **Data** | what is true | a label–value row, a list row, a meter, a table cell — never a sentence | the body of a region |
| **Status** | what state it is in | a status chip: dot and word (`N6b`) | top-right of the object it describes — its domain status is ONE chip, and a stale or provisional mark (`F8-18`) rides beside it when it is true; never two chips that say the same thing |
| **Action** | what needs me | one primary button per region, a verb; ONE line at the button — what pressing it does, or, while it cannot be pressed, why and what unlocks it (`N4`), never both; an act with several consequences opens a review sheet that lists them as data rows | the foot of the region or sheet |
| **Help** | how it works, and why | the ask (below) | never in the reading flow |
| **More detail** | what I may want to see | a row that opens in place or leads somewhere | the end of its region |

**Never behind a tap:** money and what will be charged · what paused, what still works and until
when · the provenance tier beside every number · an honesty disclosure · an error and what fixes it
· a named gap where a value is missing · any consequence that must be read BEFORE the act, at the
act. **These stay on the screen as data rows, a status chip or the one line at the act — never as
paragraphs.** `Total today · ₹6,851.61` is a row; a sentence that says the same is a manual.

**Always behind the ask:** how a feature works · reassurance the screen already implies · the
reasoning behind a rule · what the product can accept or read · anything whose absence would not
change the decision. **The test:** if not reading it would change what the person does, it stays on
the screen. If it only answers curiosity, it goes behind the ask.

**Carrying a row is not printing it.** A brief's requirement is met by a control, a state, a data
row, an arrangement — or by behaviour that needs no words at all. A sentence is the last resort,
and only for a fact on the never-behind-a-tap list. Never print a rule's reasoning. Never explain the
product's insides — its passes, engines and boundaries. **A source label the law requires is not an
inside:** the database behind an energy figure (`F8-08`), the price list and its date behind a
price — that is provenance, and it stays. Never say what the product will NOT do unless that changes
the act — a disclosure the law requires always does. Write from the person's side of the screen.

**A budget never beats a fact.** Where a budget and the never-behind-a-tap list collide, the fact
stays and its FORM changes — a row, a chip, the one line. Never drop, shorten, paraphrase or hide a
fact to pass a count; name the collision in the self-audit instead.

**Not counted, and never trimmed:**

- **Fixed copy the PRD gives word for word** — a disclosure, a disclaimer, a consent or legal text
  (`F8-20`, `F8-28`, `F8-30`). It is drawn whole, once, beside what it qualifies.
- **Content a person wrote, or reads as content** — a note, a message, a transcript, a
  notification's text, a document's body. It is data.
- **A document surface and a teaching surface.** A proposal, an invoice, a drawing sheet, a
  customer link page, and a screen whose one job is to explain — an explainer, a reference, a help
  surface — carry their prose as their content. The kinds, the once-per-frame rule and the
  sticky-bar rule still hold for everything around that content.
- **An inline field error** — one line: what is wrong and what fixes it.
- **An honesty label** — a tier, a source label, a projection's assumptions, a stale mark. It is
  counted as a provenance line, one line each, never as a sentence.

**A line is one short sentence — about ten words in English.** It may wrap in Hindi or Marathi, and
the layout holds when it does (contract item 4). Count the English frames; a Hindi or Marathi frame
carries the same sentences.

**Budgets. Each is counted in the self-audit, and a frame over budget FAILS:**

- Under a screen or sheet title: at most one line, and it is data — a file name, a saved date —
  never reassurance.
- In one region's reading flow: at most one sentence. A teaching empty state may carry two short
  ones. A fact that must stay on the screen is a data row, a chip or the one line — not prose.
- On one 375 frame: at most 40 words in sentences. Labels, values, chips, buttons, captions and
  table cells do not count.
- One fact appears once per frame — not in the header, again in the card and again at the foot.
- A sticky header or footer holds its controls and at most one line. Never a paragraph, never a
  provenance line.
- Helper text under a field: at most one line, and only when it changes what the person types.
- A value the person cannot change is a read-only row; why it is fixed is Help.
- At most one ask per region and three on a frame. An information control on every row is the same
  clutter in a new form: a region that needs more is a help surface.
- A table at 375 shows at most two value columns, every row label on one line, the unit riding with
  the value rather than under the label. Wider than that, it becomes a list, or a comparison of the
  person's own option with ONE other chosen by a selector. The full matrix is the 1536 answer. The
  one exception is a sideways-scrolling region the brief itself pins (contract item 1).
- A state changes the data, the status chip and the one action. It does not add a paragraph: an
  error is one banner — what went wrong and what fixes it.

**The ask is ONE affordance, never invented per screen:** a labelled information control at or
above the touch floor, opening an **anchored popover** — the same object at 375 and at 1536, never
a sheet on one and a bubble on the other. Tap and keyboard focus open it; hover may open it where
the input can hover — a capability, never a width (`F7-29a`) — and is never the only way in (`N1`).
Escape, an outside tap and scrolling away close it, and focus returns to the control. It carries a
title and **at most three pages**, a page being one to three short sentences; a paged popover
states its position and offers Back and Next, and a swipe never replaces those buttons. A fourth
page means it is not a popover: it belongs on the screen as a region of its own, in an expandable
section, or on a help surface of its own. **It carries
teaching only** — nothing from the never-behind-a-tap list is reached by pressing Next, and it never
holds a tier, a source label, a staleness state, an honesty caveat (`F8-07`) or a number's
derivation (`MS10-19`). Those stay beside the figure; a derivation is the `Derivation` disclosure,
on the screen.

**No drawn state depends on hover.** A touch screen never sees hover; the pressed state is the
touch feedback, and a card that only reveals itself on hover has revealed nothing. Draw hover as
polish on the wide frame if you like — never as the place a fact lives.

**Board notes are not screen copy.** Explanation about the design lives outside the frame; a frame
contains only what the product renders.

## 3 · Composition — the screen's shape, not its skin

A screen can carry every obligation and still be unreadable. **Nothing here licenses dropping
anything** (contract item 6): a thing that moves is re-placed, and your notes say where it went.

- **One focal point per REGION, not per screen.** A region has one primary act and one headline
  figure; everything else in it is subordinate by size, weight or position — never by colour alone
  (`N6b`). A screen may hold several regions; it may not hold several things all shouting.
- **Never a card inside a card.** Where a region's children already render as cards, the region
  goes flat and the cards are the surfaces.
- **Route, don't pack.** Width buys calm, not more content. A thing the person does not need for
  the decision in front of them is a **row that leads somewhere**, never a panel competing on this
  screen — and a screen is finished when nothing more can come off it without hiding a decision.
  **The first screenful answers the screen's one job**; everything else is below it or behind it.
- **Which way a thing leaves the screen, in order:** needed to decide now → it stays · a record
  looked up now and then → a row leading to its own screen · something edited or decided → a sheet
  or side panel (`F7-21`) · teaching → the ask (§2).
- **Six cases where routing is WRONG, and the thing stays:** it is used on most visits · it is
  compared side by side (tiers, variants) · the list is under about five rows · it would lead to an
  empty destination, where a teaching empty state on this screen is the honest answer · the tenant
  is in a dead or blocked state, where the money, the state and the way back are never behind
  anything (`BM-32`) · it is a document surface, which shows everything because it is printed and
  held.
- **Group before you list.** Things decided together sit together. Order regions by the brief's
  attention list, and where the brief pins none, decide and write it back.
- **Realistic volume is PROVEN in one place, not everywhere.** One region carries the brief's real
  volume — the 200-lead list, the 40-line bill of materials — and the rest show the few that matter
  with the rest behind their own destination.
- **One banner at a time.** The broadest true fact speaks, and the others stay quiet.
- **Whitespace is a component.** Keep a comfortable reading measure, and let a region end before
  the screen does.
- **The 1536 layer is a different ANSWER, never the same answer with more room.** If it is the
  phone's section list with wider rows, it was stretched rather than designed. Use the width for
  grouping, never for stretching a row — and never for printing more words: the §2 budgets hold per
  region at 1536.
- **When one surface carries too much, split it — and name which way:** one region with a selector
  (sibling lists that answer one question, each keeping its caption, provenance and export) · a
  sheet or side panel for anything edited or decided (`F7-21` — never a page for an editor) · a
  modal only for a decision that must be finished or abandoned before anything else continues ·
  **its own screen**, which is NOT invented here: name it in your notes, say what it would hold,
  and stop — a screen needs its own register row and brief.

## 4 · Laws every screen obeys (the N-rules of `F7-23`)

*`F7-23` carries these as a numbered set that is never renumbered and never reworded.*

- **N1** — no hover-only meaning: every affordance has a visible/touch equivalent.
- **N2** — touch targets ≥ 44×44.
- **N3** — 12px type floor (single exception: the overline role).
- **N4** — contrast verified, not eyeballed. `F7-11` adds three restricted roles: **tertiary text
  is never load-bearing**, the **warning tone always sits on its tinted chip and never as a bare
  foreground**, and **disabled is never the only signal** that something cannot be used.
- **N5** — accessible names on every control; focus trapped in overlays and restored on dismiss.
- **N6** — UI colour and data colour are distinct systems, never conflated (`F7-13`): a control is
  never styled with a data colour, and a chart, heatmap or canvas overlay is never drawn in the
  interface accent. Data palettes must be **distinguishable under the most common colour-vision
  deficiency within each set**, and **every data-colour encoding is paired with a second,
  non-colour channel: a label, a pattern or a position** — chart series included; a legend alone is
  not the second channel.
- **N6b — status is never conveyed by colour alone (`F7-12`).** Every domain status — a lead's
  stage, a design's review state, a project stage, a payment state — renders as **text plus a
  status dot** drawn from the fixed status-to-semantic-colour map, so it survives colour blindness,
  greyscale printing and a sunlit screen. No surface substitutes a colour for the word. The map is
  the design system's — you never invent one.
- **N7** — **every user-visible number carries its provenance tier** (measured / derived /
  estimated / assumed — `F8-02`). `F8-01` is absolute: every number a user can read, including
  inside generated documents, money included. **A number whose tier cannot be established is not
  rendered as a number; the surface shows what is missing instead.** An identifier is not a number
  and carries no tier: a tax registration, an account number, an invoice number, a phone number, a
  one-time code.
  - **Dates — was the value *recorded*, or *computed or guessed*?** Recorded → no tier: a payment's
    received-on date, a visit's check-in time, an audit timestamp, a booked appointment time, a
    user-set "busy until 17:00". Show when it was recorded. Computed or guessed → tier: a payback
    month, an expected commissioning date, an estimated arrival window.
  - **A date follows the MARKET, not the reader.** The pack owns the order, the calendar and the
    month name, so `12 Aug 2026` renders identically in Hindi, Marathi and English — the same class
    as `BIS`, `ALMM`, `DISCOM` and `kWp`.
  - **Where the tier renders.** `F8-07`: a tier, a source label, a staleness state or an honesty
    caveat renders as **persistent, legible content beside the number it qualifies** — never a
    tooltip, an info icon, a colour difference alone or a footnote (`F7-35`: "honesty is a UI
    pattern, not a disclaimer"). Progressive disclosure governs the rest of the screen, never the
    tier. **The tier is a mark — dot and word — on the figure's own row, not a sentence**; how the
    figure was worked out is the `Derivation` disclosure under it. If a layout only works by hiding
    the tier, the layout is what changes.
- **N8** — destructive actions are confirmed AND undoable; undo is thumb-reachable on mobile. Where
  an act genuinely CANNOT be undone by the person who did it — it is already someone else's
  knowledge, or the record is gone — the confirm carries the RECOVERY ROUTE IN WORDS instead, on
  both the confirm and the after-state. Never drop half of `N8` silently.
- **N9** — no layout tuned to a fixed viewport.
- **N10** — loading, empty and error states are part of "done".

**Light-only (`F7-04`).** v1 has no dark theme, no per-user theme switch and no dark variant of any
surface. The 3D studio canvas, the map and imagery surfaces, the customer's 3D view and every editor
are light like everything else. A requirement row that says otherwise is superseded by this law.

**One sheet grammar (`F7-21`).** A sheet on mobile, a side panel on desktop — sheets, not pages.
Editing something in context never navigates away from it. The same grammar carries every editor:
an obstruction's settings, a bill-of-materials line, a lead's detail, a filter set. Where a brief
pins a bottom sheet for mobile and says nothing about desktop, the desktop answer is the side
panel — not a full-width sheet, not a page. A chained or nested editor reveals itself a stage at a
time with its live consequences visible (`F7-34`).

**No emoji, and no character used as an icon (`F7-19` / `F7-42`)** — no icon font, no emoji, no
unicode character as an icon, anywhere, including content the product generates. A requirement row
that names a control with one is superseded by this law: draw the icon from the design system's
family. Every icon-only control carries an accessible label (`F7-26`).

**Density is chosen by surface, not by breakpoint (`F7-17`).** *Expressive* serves mobile,
onboarding, authentication, dashboards, empty states and marketing surfaces; *Functional* serves
data tables, long forms, kanban boards, inventory and reporting views, settings and administration.
Every other rule is identical in both; only spacing and radius differ, and the design system owns
both values. Pick the mode from what the screen *is*: a data table is functional at 375px too, and
a dashboard stays expressive at 1536px.

**The ladder, lightest last (`F7-15`).** Three steps, each brighter than the one behind it: the
page (`--canvas`) → a container that holds controls (`--surface-form`) → a control (`--surface` at
`--e2`). A control is the brightest object on screen and reads as **raised**, with no line anywhere.

- **Never draw a border on a control**, and never leave a white control on a white card — the
  field disappears.
- A **primary** button needs no step; a **ghost/text** button gets no box, no edge, no fill — its
  label *is* the control.
- **"A control" is anything you press or type into:** fields, buttons, icon buttons, filter and
  facet chips, language pills, slider steppers, colour swatches, the stepper indicator, a range's
  end boxes, inline cell editors and **every `Try again` button**. The only test that holds is
  whether a `<button>` or `Pressable` renders it — a 44px white pill is not proof:
  `SourceDocument`'s glyph badge and `MapSurface`'s zoom readout are labels.
- **Three things are NOT controls:** a **disabled** control comes OFF the ladder (`--e1` where it
  keeps its ground, `--canvas-sunken` and no shadow where it sinks — and the part inside it does
  what its container does); a **decorative label** keeps `--e1` (`Chip` without `onClick`); a
  **specimen or listed row** keeps `--e1`, because it is a surface.
- **A hover must clear the resting step:** rest is `--e2`, so a hover lift is `--e3`. **Focus ADDS
  a ring; it never replaces the elevation.**
- **An overlay is a container.** A sheet, a side panel and a modal are `--surface-form`, sticky
  headers and footers included, so a control or a card inside them reads brighter.
- **`--surface-form` is a rung only if the container is wide enough for the control it raises:**
  six `OtpInput` boxes plus five gaps need 328px. Where the container would squeeze the control,
  take the control out — two rungs, page to control, is a legitimate answer.
- **A card that holds CONTENT stays `--surface` on the page.** Only a container that *wraps*
  controls takes `--surface-form`. **`--canvas-sunken` means below its CONTAINER** — a well, a
  disabled control, a skeleton base.
- **The ladder measures itself — do not eyeball it.** `guidelines/ladder-in-a-sheet.card.html`
  reads its own computed values live. Re-run it after any elevation or ground change, and read its
  FIELD MODE column for the ghost button.

**The shell is drawn once, in `SCR-SHELL-01`, and every other screen reuses it (`F7-22`).** At 375
an arc bar with a **raised centre action** and **exactly four** standing destinations — **Home ·
Leads · Proposals · More**; at 1536 the icon rail carrying **the same four**, plus `AppHeader`.
**Never add a fifth slot.** Settings, account, grievance contact and sign-out are reached from
**More** and from the avatar menu. The centre action's *verb* follows the home in force; the four
destinations never change with the screen. **Most screens carry no shell at all:** anything running
before roles exist — sign-in, signup, the whole onboarding corridor — has none at either width; say
so on the board. Where one screen has more than one life (an onboarding step now, a settings
destination later), the shell appears only on the life that is inside the app, and the board labels
which life each frame is.

## 5 · The completion contract (from `F7-43`)

*`F7-43` states the per-screen Definition of Done as twelve items, and a screen violating any one
is not done. The numbering below is this file's, and it is permanent: other documents cite these
items by number, so the list is only ever added to. `F7-43`'s other items are stated above as law —
contrast `N4`, target size `N2`, provenance `N7`, light-only, density. Beware the collision:
"contract item 7" here is keyboard operability; "`F7-43` item 7" is language expansion.*

1. Works at **375px and 1536px** with **no page-level horizontal scroll** at either. A contained
   region may scroll sideways inside itself where the brief calls for one — a comparison rail, a
   wide table's own scroller — but the page never does. Mobile is designed first, not shrunk later.
   **Parity is about capability, never layout** (`F7-31`): no capability, state or fact is present
   at one viewport and absent at the other — **and the two arrangements are expected to differ**.
   The design system's components change form by their **own width**, not the viewport: pass the
   same props at both widths and let each pick its form rather than hand-rolling a second layout.
2. **All three base states present** — loading, empty, error — plus every screen-specific state the
   brief lists. Empty states teach ("here's how to add your first lead"), never apologise.
3. Designed at **realistic volume**, not demo volume: a 200-lead list, a 40-line bill of materials,
   a 221-panel design. Long content scrolls inside its own region. **Every data table carries a
   caption (`F7-27`)**: it names what the table is and, where the table is filtered or scoped, what
   it currently shows — the bill of materials and the proposal are documents a customer may hold.
4. Survives **language expansion**: the layout holds in Hindi and Marathi, not only English. No
   text baked into images.
5. **No orphan screens**: every screen is reachable and leads somewhere, and where the brief pins
   the entry and exit the design shows those affordances. Where the brief says **"not pinned by PRD
   — designer decides"**, choose one, draw it, and write the choice into the brief's Entry & exit
   section so the next screen inherits it. **V2 exits:** the product has 150 screens; **99 are V1**
   and the other 51 are V2 — real scope, not designed or built before launch. Where a V1 brief pins
   an entry or exit to a V2 screen, **draw the affordance and name the gap** — *"exit to `SCR-…`,
   deferred to V2"* — never invent the destination, never silently drop the control. The `V` column
   in `docs/prd/registers/screens.md` §2 is the authority. This is the one place item 6 does
   **not** mean "draw everything".
6. Nothing in the brief may be dropped, merged away or simplified out. If two requirements
   genuinely conflict on this screen, say so explicitly — do not silently pick one. **And carrying
   a row is not printing it (§2).** **The one exception, marked in the text:** a requirement row may
   carry a trailing annotation in this exact form —
   `_(non-UI half, build-side: … — for awareness, not for drawing)_`. That clause is a **server or
   engine obligation with no surface**. Design the row; invent neither a control nor a sentence for
   the annotated half. If you cannot tell which half is which, say so rather than guessing.
7. **Keyboard-operable throughout, with focus visible at every stop.** `F7-24`: *"Focus is always
   visible, and it is never removed."* Every interactive element is reachable and operable by
   keyboard — both platforms, both density modes, third-party components included. A sheet or modal
   moves focus in, keeps it inside while it is open, and hands it back to the control that opened
   it (`F7-25`, `N5`). Keyboard access is **in addition to** touch, never instead of it: no
   function is reachable only by wheel, middle-click or keyboard (`F7-29`b). What focus *looks*
   like is the design system's.
8. **Zero raw colour literals and zero off-scale values** (`F7-03`). Every visual value a screen
   uses — colour, spacing, radius, type size, shadow — reaches it through the design system.
   **Name the role, never the value**; if you cannot name the role behind something you have drawn,
   that is the defect. A value a brief quotes from the prototype is a fact carried for the record,
   not a licence to place it.

**Reading the tags a brief uses.** Each requirement carries a tier: **P0** ships, **P1** is wanted,
**P2** is later. A row additionally marked **`REC`** is a *recommendation*, not accepted scope:
draw it as a clearly separable element so it can be removed without redrawing the screen around
it, and say in your notes which element it is.

## 6 · The self-audit (run at the end of every session, before the screen is accepted)

Walk **five lists**, in this order. For every entry, answer **PASS or FAIL, pointing at the
specific element that satisfies it**. A PASS without a pointed-at element is a FAIL. Fix every FAIL
in the same session, then print that list again.

1. **The word inventory — first, because it is what fails most.** For every 375 frame, list every
   sentence on the frame: any run of words with a verb that is not a label, a value, a chip, a
   button, a caption or a table cell. For each one, name its kind (§2) and say why it cannot be a
   data row, a status chip, the one line at the act, or behind the ask. Then print the counts per
   frame — sentences · words in sentences · provenance lines · lines in each sticky bar · facts
   that appear twice · asks · value columns in any table. Name what you left uncounted and which
   §2 entry allows it, and name every collision between a budget and a must-stay fact with the
   form you chose. **A count over its §2 budget is a FAIL.** For
   every 1536 frame, print the same counts per region.
2. **The brief's REQUIREMENTS list, row by row** — the UI half of each row, per item 6. For each
   row, name what meets it: a control, a state, a data row, an arrangement, behaviour with no
   words, or a sentence. **A sentence is accepted only for a fact on the never-behind-a-tap list.**
3. **The completion contract, item by item** — all eight.
4. **Composition, in four answers** — name the focal point of each region; name every region that
   is flat and why; say what 1536 arranges differently, and where it is honestly the same say so;
   and where a surface was split, say which of the four forms it took — if it should become its
   own screen, name it and stop.
5. **Everything else this file states** — not a closed list, because nothing stated here goes
   unchecked: `N1` through `N10` (`N6b` among them); light-only (`F7-04`); the one sheet grammar
   (`F7-21`); no emoji and no character used as an icon (`F7-19`/`F7-42`); the density choice
   (`F7-17`); the ladder (`F7-15`); the shell (`F7-22`); progressive disclosure (`F7-34`); no drawn
   state depends on hover; the `REC` rule; and the connection rule of §1. Where a law has no
   subject on this screen, say so and say why — *"N8: no destructive action on this screen"* is a
   PASS with a pointed-at absence. Silence is not a PASS.
