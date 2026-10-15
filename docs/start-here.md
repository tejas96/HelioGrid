# Designing a screen — the prompt and the checklist

Claude Code runs every design step (`/task`, Design track — one module ahead of the build): it
builds the drawing prompts from this file, the owner pastes them into Claude Design and exports the
drawn module to `.design/<module>/`, and Claude Code checks each exported board by *The checklist*
below. Each rule is written here once.

The register holds 150 screens; **99 are V1** — the `V` column in `docs/prd/registers/screens.md`
§2. A `V2` row is not drawn until V1 ships. 81 of the V1 screens are drawn from a brief; the other 18 are the
studio's, ported from the POC and never drawn. The next screen to draw is the first undrawn V1
screen on the walk in `docs/build-order.md`; the blocks, and why they run in that order, are the
screens register's (`docs/prd/registers/screens.md`).

## The Claude Design project

Every screen is drawn in the **screens project**, `2b5c5a1e-561a-4116-a710-63b85f669b70` — the
project every `DESIGN:` link names — in a new session with the live design system selected.

> **There are TWO Claude Design projects called exactly "HelioGrid Design System".**
> The live one is **`c8aa4326-21bf-453a-8d11-749cc81dee12`**. The other,
> `dcb4bbee-2b0c-4b9a-845d-cf1e15ad8a7a`, is an older, different system.
>
> Tell them apart by date in the picker: the live one is the **more recently updated** of the two.
> Every screen drawn against the wrong one is wrong.

- **One fresh session per screen, never two.** A session that has drawn several screens starts
  forgetting the laws.
- On the Claude Design home screen the composer box **is** the session's first message: pressing
  the arrow both creates the session and starts it generating. The prompt is pasted as text, never
  attached, so every document is actually in it.
- Each screen keeps one pair in the screens project — its board and its decisions record — never
  a bundled page or a second copy.
- A message to the design-SYSTEM project states what a component must do, with a neutral example —
  never a screen's id or copy: that project cannot open the screens project, and a screen named
  there rots in the component's own docs.

## The drawing prompt

One message, three texts in this order: the whole of `docs/ux/claude-design-context.md`,
unchanged; the whole brief the screens register names; then this:

> Draw this screen in four passes, in this order, and finish all four in this session.
>
> **Pass 1 — the 375px mobile layout, default state.**
>
> **Sort the words before you draw.** First print the word plan as a table: every fact this screen
> must carry, its kind from the context file's §2 — data, status, action, help, more detail — and
> its form. Where the brief carries a `Words on this screen` section, start from it. No fact is
> planned as a sentence unless §2's never-behind-a-tap list requires one, and then it is ONE line
> at the act. A requirement row is met by the design, never by a sentence about it. Copy the brief
> quotes word for word — a disclosure, a disclaimer, a consent text — is drawn whole and never
> trimmed. Then draw from that plan.
>
> **Compose it, do not just include it.** The context file's §3 is law here: one focal point per
> region, never a card inside a card, the brief's real volume proven in ONE region with the rest
> routed, one banner at a time. Start from the brief's **One job** and **Order of attention** — if
> the brief carries neither, decide them and say them back in one line each, so they can be
> written into the brief.
>
> **Draw static frames, not an interactive prototype.** No state machine, no prop editors, no
> click-through. Every situation this screen has is its own labelled frame I can see beside the
> others. Use the real components and realistic content; just don't make them stateful. Sample
> content is yours to invent; a product fact — a plan, a price, a limit, a length — is the brief's
> (§2). A product fact the brief does not hold is named as missing, never invented. Pin any date or
> time to a fixed value rather than `new Date()`, so the spec does not change tomorrow.
>
> **Pass 2 — the 1536px desktop layer.**
>
> **Parity means capability, not layout.** Every capability, state and piece of information
> reachable at one width must be reachable at the other — but the *arrangement* should be genuinely
> different, because the constraints are. A 1536px desktop that is the 375px phone stretched wide
> is wrong; so is a desktop that quietly drops something the phone can do.
>
> Two things are genuinely different at this width, and you should let them be:
>
> 1. **The shell is a different object** (`F7-22`) — a floating pill footer on
>    mobile, a rail-and-header shell on desktop.
> 2. **Desktop has room the phone does not.** More rows on screen at once, more columns, a
>    persistent side panel where the phone needed an overlay, the full comparison where the phone
>    compared two.
>
> **Use the width for GROUPING, never for stretching — and never for more words.** The §2 budgets
> hold per region. Sibling lists that answer one question become one framed region with a selector
> rather than three tables stacked down the page. If a surface is carrying too much even then, say
> which way you would split it: a sheet or side panel for anything edited (`F7-21`), a modal only
> for a decision that must be finished before anything else continues, or its own screen — which
> you NAME and do not draw.
>
> Name each place the desktop arrangement genuinely differs, one line of why. Where a section is
> honestly the same frame with more whitespace, say that too.
>
> **Then measure the alignment — nothing is placed by eye (§3).** Print, for each 1536 frame: every
> region's left and right x, the height of every card in a row of siblings, and the x of every value
> column in a panel. Fix any number that differs where it should match. A side panel with nothing
> to show is closed, never parked open and empty.
>
> **Pass 3 — every state listed in the brief:** the three base states (loading, empty, error) plus
> every screen-specific state.
>
> **A state changes the data, the status chip and the one action. It does not add a paragraph.**
> An error is one banner: what went wrong and what fixes it.
>
> Draw each state at **375px**. Then draw at **1536px only the states whose desktop arrangement
> genuinely differs** from the mobile answer. For every state you do *not* draw at desktop, name it
> and say in one line why the desktop version is the mobile one at width.
>
> **Pass 4 — the self-audit from the context file.** Walk **all five lists, the word inventory
> first**: the word inventory with its counts per frame, the brief's requirement rows one by one,
> the completion contract item by item, composition in five answers — the alignment numbers among
> them — and everything else the context file states. For each, answer PASS or FAIL and name the
> specific element that satisfies it. A count over its §2 budget is a FAIL. Where a law has no
> subject on this screen, say so and say why. **Fix every FAIL in this session — a FAIL that is
> stated and left standing is not a finished screen.** Then walk the word inventory again, and
> rewrite the record so it holds only the final walk.
>
> Inside the word inventory, print the two short lists: every **product fact** a frame prints with
> the brief row it came from, and every word on a frame that is the product's language rather than
> the person's. Last of all, **read the record against the frames as they now stand** — every
> quoted line, every count — and fix any mismatch before you hand the screen over.

## The fix prompt

Every change to a drawn screen — a check's findings, a `board` ruling, a brief's
`## Redesign owed` — is one message in the screen's own file, with the live design system
selected. Its size follows the change:

- **Full** — when the list adds or redraws a state, changes a layout across frames, or carries a
  rewritten brief: three texts in this order, the whole of `docs/ux/claude-design-context.md`,
  unchanged; the whole brief; then the instruction below, its list filled in.
- **Short** — every other list (a word, a title, an element moved inside a frame, a count): the
  instruction below alone, its list filled in. The board already holds the laws and the brief;
  pasting them again buys nothing.

Each line of the list names the frame, the element, what it shows now, what it must show, and
the brief row, PRD row or ruling that requires it.

> This EDITS the existing `<file>` in place — no new file, no copy, no v2. Fix these, and nothing
> else: *(the list, one line each)*. Keep every artboard, name, state and layout the list does not
> name; fix each item at 375 and at 1536, in every state it touches.
>
> Then re-run the self-audit, the word inventory first, and rewrite the record so it says only what
> the design is now: one word plan, one inventory, ONE version of every line a frame prints. Do not
> append a second inventory, and do not keep the old wording of anything you fixed. Before you
> reply, read the record against the frames: every quoted line and every count equals the frame's.
> List every change you made, one line each, in your reply, not in the record.

## The checklist

A drawn screen is judged by this list, and a fix prompt fixes what it finds.

- **Read the word plan first.** A row whose form is "sentence" and whose reason is "it explains…"
  is Help, not a fact.
- **No paragraph.** A screen that explains itself in sentences has failed the word inventory,
  however correct every sentence is. The only whole paragraphs are the ones §2 leaves uncounted:
  fixed copy the PRD gives word for word, and content a person wrote or reads.
- **The self-audit holds.** A PASS that names no element is a FAIL. A requirement "met" by a
  sentence that is not on the never-behind-a-tap list is a FAIL. A count over its §2 budget is a
  FAIL, and a FAIL left standing is not a finished screen.
- **Every state is drawn.** Loading, empty and error are where most real product quality lives.
- **The PRD row is the truth; the brief is its summary.** A product fact a frame draws — a plan, a
  price, a limit, a rate, fixed copy — is checked against the WHOLE row it cites, and what the brief
  cut is reported.
- **No visual direction in a prompt.** Colours, spacing, type and components are the design
  system's job; a prompt says what the screen must do.
- **One review, complete, with pixels.** The frames at both widths, every state's words, the
  product facts against the brief's rows and the record against the frames — then at most ONE fix
  prompt. Only a fault that changes what gets built or what a person reads goes back; a cosmetic
  fault in the record is noted, not sent.
- **A fault is usually shared.** A rule broken in one design is reported with the other drawn
  screens of its corridor, which may break it too.

## Recording a drawn screen

Before a screen's design commit, every open question it raised is closed: each is checked against the
repo first, and the survivors go to the owner as two options at most, with a pick. The register is
not edited: the task's `DESIGN:` line is the one record that a screen is drawn.

```
BEFORE  DESIGN: SCR-… → PENDING
AFTER   DESIGN: SCR-… → <link>
```

The link is the screen's main (Mobile) board. A screen with more than one board (States, Desktop
States …) lists every other board after the main link, so whoever builds the screen reaches all of
them in one click:

```
AFTER   DESIGN: SCR-… → <main link> · also: States <link> · Desktop States <link>
```

Once every `DESIGN:` line a task carries holds a link, its `Status:` turns `designed`. A choice the
brief left to the designer ("designer decides") is written into the brief, in the section it
belongs to, so the next screen inherits it: an unrecorded decision is how two screens end up
disagreeing about the same flow.

## When a brief changes after its screen was drawn

- The module's next export check reads the board against the brief as it now stands: a mismatch
  is a finding, and its fix prompt goes to the owner before the build.
- A change that must wait for the screen's turn is written into the brief as a `## Redesign owed`
  section — what the design shows and what the brief now requires — and the section is deleted
  in the `design/<module>` commit once the board meets it (`/task`, Design track).
- A screen already BUILT that no longer matches gets the task that changes it, in `docs/tasks/`.

## How you know you're finished

Count the V1 screens whose task's `DESIGN:` line holds a link: **81 when every screen is drawn**.
The 18 studio screens read `ported from the POC`.
