# Start here — designing one screen

> ## ▶ Run `python3 scripts/next-screen.py` — it prints the next screen, and any redesign owed comes before it.

This file is how you design **one** screen. Then you repeat it until the script prints nothing.
Nothing else in this repository needs your attention while you do that.

The register holds 150 screens; **99 are V1**. The `V` column in `docs/prd/registers/screens.md` §2
says which. **You skip every `V2` row** — real scope, not designed until V1 ships.

## The only four files you ever touch

| # | File | What you do with it |
|---|---|---|
| 1 | `docs/ux/claude-design-context.md` | **Paste it.** Same file, every session, never edited in a session. |
| 2 | `docs/ux/briefs/SCR-….md` | **Paste it.** One per session. This is the screen. |
| 3 | `docs/prd/registers/screens.md` | **Edit 1 line** when the screen is approved. |
| 4 | `docs/tasks/<module>.md` | **Edit 1 line** when the screen is approved. |

Files 1 and 2 go into Claude Design. Files 3 and 4 record that it's done. Everything else in this
repo is the reasoning behind those briefs — you never open it.

---

## The order is the V1 build order. `V2` rows are skipped.

**Your next screen is the first one `python3 scripts/next-screen.py` prints.** Do not invent a
different starting point, however tempting a smaller brief looks.

The eight blocks, in order, with the V1 count in each:

```
 1. App shell + entry & tenant           23   SHELL-01/-02/-03, and 20 of M01
 2. Billing & plans                       5   M12 (4) + SHELL-06
 3. M02 · CRM & leads                     6
 4. M08 · Projects                        6
 5. M11 · Payments & collections          4
 6. Sales exec, calling core + owner home 12  11 of M07 + M13-01
 7. M05 · Design Studio                  18   ← ported from the POC, not drawn from nothing
 8. M06 · Proposals + Customer link (F5)  25
                                         ---
                                          99
```

Block 2 (`M12`) is how the platform charges an EPC company. Block 5 (`M11`) is how that company
collects from a homeowner. Different money, different module — don't merge them in your head.

Two things about this order are deliberate, so you don't "correct" them:

- **It is not the screens register's section order.** That register lists documents; this lists
  the build. The studio sits seventh even though it is the primary product, because it already
  exists as a frontend in `Solar-App-POC`, and the earlier blocks settle the API, schema and data
  conventions the port has to conform to. Proposals travel with it — a proposal quotes the BOM a
  design produces.
- **Blocks 1–6 are a shippable product on their own**: lead → won → project → payment.
  `SCR-SHELL-06` sits with the shell rows in the register, but it renders a tenant's M12 billing
  state, so it belongs to block 2.

Within a block, work top to bottom down the register and skip every row whose `V` column says `V2`
or whose `Status` is already `designed` — with one exception the script already applies: a screen
that OWNS a part is drawn before the screens that reuse it. In billing that is `SCR-M12-03` (the plan
card and the comparison), then `SCR-M12-04` (the meter row), then `SCR-M12-01` and `SCR-M12-02`.

## You never choose a brief — the screens register tells you

Every screen has exactly **one** brief, and its filename is a column in the screen's own row in
`docs/prd/registers/screens.md` §2. `python3 scripts/next-screen.py` prints the screen, the two
files to paste, and the two `file:line` locations to edit afterwards. It reads the register's
header row rather than counting columns, so a new column cannot make it lie.

---

## Step 1 — open a Claude Design session

A message to the design-SYSTEM project states what a component must do, with a neutral example —
never a screen's id or copy: that project cannot open the screens project, and a screen named there
rots in the component's own docs.

One fresh session per screen. **Never two screens in one session** — a session that has drawn
several screens starts forgetting the laws.

> **There are TWO Claude Design projects called exactly "HelioGrid Design System".**
> The live one is **`c8aa4326-21bf-453a-8d11-749cc81dee12`**. The other,
> `dcb4bbee-2b0c-4b9a-845d-cf1e15ad8a7a`, is a different system: it has no contrast fix, no
> `--text-inverse`, no `NoConnection` screen, and it still has `OfflineBanner`.
>
> Tell them apart by date in the picker: the live one is the **more recently updated** of the two.
> Every screen drawn against the wrong one is wrong.

---

## Step 2 — the session: one paste, then three follow-ups

> **Where message 1 goes.** On the Claude Design home screen the composer box **is** the session's
> first message — pressing the arrow both creates the session and starts it generating.

**Message 1 — all three of these, in this order, in the composer box.** Paste the text rather than
attaching the files, so both documents are actually in the prompt.

1. the whole contents of `docs/ux/claude-design-context.md`, unchanged
2. the whole contents of the brief the screens register names
3. this, at the bottom:

> Design the mobile 375px layout for this screen. Just the default state for now — I'll ask for
> desktop and the other states next.
>
> **Sort the words before you draw.** First print the word plan as a table: every fact this screen
> must carry, its kind from the context file's §2 — data, status, action, help, more detail — and
> its form. Where the brief carries a `Words on this screen` section, start from it. No fact is
> planned as a sentence unless §2's never-behind-a-tap list requires one, and then it is ONE line
> at the act. A requirement row is met by the design, never by a sentence about it. Copy the brief
> quotes word for word — a disclosure, a disclaimer, a consent text — is drawn whole and never
> trimmed. Then draw from that plan, in the same turn.
>
> **Compose it, do not just include it.** The context file's §3 is law here: one focal point per
> region, never a card inside a card, the brief's real volume proven in ONE region with the rest
> routed, one banner at a time. Start from the brief's **One job** and **Order of attention** — if
> the brief carries neither, decide them, say them back to me in one line each, and I will write
> them into the brief.
>
> **Draw static frames, not an interactive prototype.** No state machine, no prop editors, no
> click-through. Every situation this screen has is its own labelled frame I can see beside the
> others. Use the real components and realistic content; just don't make them stateful. Sample
> content is yours to invent; a product fact — a plan, a price, a limit, a length — is the brief's
> (§2). Pin any date or time to a fixed value rather than `new Date()`, so the spec does not change
> tomorrow.

Look at what comes back. **Read the word plan first:** a row whose form is "sentence" and whose
reason is "it explains…" is Help — push back before looking at the frame.

**Message 2:**

> Now the 1536px desktop layer.
>
> **Parity means capability, not layout.** Every capability, state and piece of information
> reachable at one width must be reachable at the other — but the *arrangement* should be genuinely
> different, because the constraints are. A 1536px desktop that is the 375px phone stretched wide
> is wrong; so is a desktop that quietly drops something the phone can do.
>
> Two things are genuinely different at this width, and you should let them be:
>
> 1. **The shell is a different object** (`F7-22`) — an arc bar with a raised centre action on
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
> When you're done, name each place the desktop arrangement genuinely differs, one line of why.
> Where a section is honestly the same frame with more whitespace, say that too.
>
> **Then measure the alignment — nothing is placed by eye (§3).** Print, for each 1536 frame: every
> region's left and right x, the height of every card in a row of siblings, and the x of every value
> column in a panel. Fix any number that differs where it should match. A side panel with nothing
> to show is closed, never parked open and empty.

**Message 3:**

> Now every state listed in the brief — the three base states (loading, empty, error) plus every
> screen-specific state.
>
> **A state changes the data, the status chip and the one action. It does not add a paragraph.**
> An error is one banner: what went wrong and what fixes it.
>
> Draw each state at **375px**. Then draw at **1536px only the states whose desktop arrangement
> genuinely differs** from the mobile answer. For every state you do *not* draw at desktop, name it
> and say in one line why the desktop version is the mobile one at width.
>
> **Then the language proof (contract item 4).** Take the 375 frame with the longest copy and draw
> it again in Hindi and in Marathi. Measure both: nothing clips, nothing overlaps, no fixed height.
> A screen without this proof is not finished.

**Message 4:**

> Now run the self-audit from the context file. Walk **all five lists, the word inventory first**:
> the word inventory with its counts per frame, the brief's requirement rows one by one, the
> completion contract item by item, composition in five answers — the alignment numbers among
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

**Review once, completely, with pixels.** One pass over the frames at both widths, every state's
words, the product facts against the brief's rows and the record against the frames — then at most
ONE fix message. Only a fault that changes what gets built or what a person reads goes back; a
cosmetic fault in the record is noted, not sent.

**Read the self-audit properly.** A PASS that names no element is a FAIL. A requirement "met" by a
sentence that is not on the never-behind-a-tap list is a FAIL. Push back on both.

**When you ask for fixes — any time before the screen is recorded:**

> Fix these, and nothing else: *(your list, one line each)*.
>
> Then rewrite the record so it says only what the design is now: one word plan, one inventory,
> ONE version of every line a frame prints. Do not append a second inventory, and do not keep the
> old wording of anything you fixed. Before you reply, read the record against the frames: every
> quoted line and every count equals the frame's. Tell me what you changed in your reply, not in
> the record.

---

## Step 3 — record it

Before the next screen starts, close every open question this one raised: check each against the
repo first, and bring the survivors to the owner as two options at most, with a pick.

Only after you've approved the design. `python3 scripts/next-screen.py` prints the exact
`file:line` for both edits.

**Edit 1 — `docs/prd/registers/screens.md`.** Change `planned` → `designed`, and `—` → your Claude
Design link. Leave the `V` column alone:

```
BEFORE  | SCR-… | **Name** | P0 | 8 | `docs/ux/briefs/…` | V1 | planned | — | …
AFTER   | SCR-… | **Name** | P0 | 8 | `docs/ux/briefs/…` | V1 | designed | <link> | …
```

**Edit 2 — the module's task file.**

```
BEFORE  DESIGN: SCR-… → PENDING
AFTER   DESIGN: SCR-… → <link>
```

Both get the same link: the screen's main (Mobile) board. **When the screen has more than one board**
(States, Desktop States, Language …), the task's `DESIGN:` line lists every other board after the main
link, so whoever builds the screen reaches all of them in one click. The register keeps the one main
link:

```
AFTER   DESIGN: SCR-… → <main link> · also: States <link> · Language <link>
```

Ignore any hit inside `docs/tasks/README.md` — that file only documents what a `DESIGN:` line looks like.

**Edit 3 — only if the brief said "designer decides".** If you made a choice the brief left open,
write it into the brief in the section it belongs to, so the next screen inherits it. An unrecorded
decision is how two screens end up disagreeing about the same flow.

**Edit 4 — LAST: which brief the design was reviewed against.** Run `python3 scripts/gates.py`.
Gate 31 names the brief's digest; write it into the same register row's `Brief reviewed` cell, in
place of `—`. It goes last because Edit 3 changes the brief.

## Fixing a screen that is already designed

A fix to a screen already drawn is made on its board and record in the Claude Design project —
never in `HelioGrid-UX/`, which is your own export and is re-exported once, after every design is
done. A fix to a screen not drawn yet goes into its brief. When a designed screen's brief itself
must change, the next section applies.

## When a brief changes after its screen was designed

Gate 31 refuses a changed brief until someone reviews the design against the brief as it now reads.

- **Still matches** → write the new digest gate 31 names.
- **No longer matches** → write `owed <digest>`, and add a `## Redesign owed` section to the brief
  that says exactly what the design shows and what the brief now requires.
  `python3 scripts/next-screen.py` then lists it FIRST, and it is kept out of the build order until
  cleared.
- **The screen is already BUILT** → its cell also carries the code's verdict: `· code ok` when the
  built screen matches the brief, or `· code owed T-…` naming the task that changes it.

### Redoing the screen, step by step

A redesign EDITS the drawing that exists. Nothing here starts a new file.

1. `python3 scripts/next-screen.py` names the screen and the fault.
2. Open the screen's own file in the design project — the register row's link — with the live
   design system selected, and stay in it. One session per screen.
3. Paste `docs/ux/claude-design-context.md`, then the whole brief, then this instruction:
   *"This is a REDESIGN of an existing screen. Edit the existing `<file>` in place — no new file, no
   copy, no v2. Keep every artboard, name, state and layout the `Redesign owed` section does not
   name. Fix only what it describes, at 375 and at 1536, in every state it touches. Then re-run the
   self-audit, the word inventory first, and rewrite the record so it says only what the design is
   now — never a second inventory, never the old wording. At the end, list every change you made,
   one line each, in your reply."*
4. Read that list against the export: the fault is gone, and nothing else moved.
5. Re-export the screen's pair into `HelioGrid-UX/`, REPLACING both files — never a bundled page,
   and one pair per screen afterwards.
6. Delete the brief's `## Redesign owed` section, run `python3 scripts/gates.py`, and write the
   digest it names in place of `owed …`.
7. A BUILT screen: check the built screen against the redesign too, and keep `· code ok` only if it
   still matches. Otherwise write `· code owed T-…` and open that task.

A fix one screen needs is usually a fact the corridor shares: when a rule is broken in one design,
sweep the others for the same break before recording anything.

---

## How you know you're finished

```bash
grep -c '^| SCR-.*| V1 | planned |' docs/prd/registers/screens.md
```

**0 when you're done.** The `^| SCR-` anchor matters: without it the command also counts the V2
rows and the register's own documentation of this command, and never reaches zero during V1.

---

## Things that will tempt you, and shouldn't

- **Don't batch screens.** One per session. This is the rule that protects quality.
- **The PRD row is the truth; the brief is its summary.** A brief may quote part of a row. Before a
  product fact is drawn — a plan, a price, a limit, a rate, fixed copy — read the WHOLE row it
  cites, and report what the brief cut. A session with no access to the repo names the fact as
  missing instead.
- **Don't give Claude Design visual direction.** Colours, spacing, type and components are the
  design system's job. Your job is *what the screen must do*.
- **Don't skip states.** "Loading, empty, error" is where most real product quality lives, and it's
  the first thing that gets dropped when you're moving fast.
- **Don't accept a paragraph.** A screen that explains itself in sentences has failed the word
  inventory, however correct every sentence is. The only whole paragraphs are the ones §2 leaves
  uncounted: fixed copy the PRD gives word for word, and content a person wrote or reads.
