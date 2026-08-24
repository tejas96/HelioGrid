# Start here — designing the first screen

> ## ▶ Blocks 1–6 are ready. Start at `SCR-SHELL-01`.
>
> A component audit of all 99 briefs against the live design system found **57 gaps**. Rounds 13–17
> closed **51** of them; the remaining six are the 3D canvas, which waits for the studio port and
> only affects block 7.
>
> A verification pass on 2026-08-17 re-read all 48 components sent in rounds 13–16 and returned
> **zero `OPEN`** and **zero that stop a screen being drawn**. Round 17 then corrected the tail it
> found — including a law that told a screen author to ship the wrong control.
>
> **There will not be another audit before screen one.** The design system is now checked by three
> instruments that run inside the project on every load rather than by a workflow that runs when
> someone asks. The next real test is a screen.
>
> **56 screens are drawable today** — blocks 1 through 6, which are the shippable product:
> lead → won → project → payment.
>
> When a screen finds a gap — and one will — record it in that register and keep drawing. It should
> be a trickle now, not 57.

You have **99 screens** to design for V1. This file is how you do **one** of them. Then you
repeat it 98 more times. Nothing else in this repository needs your attention while you do that.

*(The register holds 150. The owner locked V1 to 84 on 2026-08-15 and widened it to 95, then 98, then 99, on 2026-08-16 — the `V` column in
`docs/prd/registers/screens.md` §2 says which. **You skip every `V2` row.** They are real scope, but
they are not designed until V1 ships.)*

## The only four files you ever touch

| # | File | What you do with it |
|---|---|---|
| 1 | `docs/ux/claude-design-context.md` | **Paste it.** Same file, every session, never edited. |
| 2 | `docs/ux/briefs/SCR-….md` | **Paste it.** One per session. This is the screen. |
| 3 | `docs/prd/registers/screens.md` | **Edit 1 line** when the screen is approved. |
| 4 | `docs/tasks/<module>.md` | **Edit 1 line** when the screen is approved. |

That's it. Files 1 and 2 go into Claude Design. Files 3 and 4 record that it's done.
Everything else in this repo is the reasoning behind those briefs — you never open it.

---

## The order is the V1 build order. `V2` rows are skipped.

**Your first screen is `SCR-SHELL-01` — App Shell & Navigation.** Everything renders inside it,
so nothing else can be drawn honestly until it exists. Do not invent a different starting point,
however tempting a smaller brief looks.

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

Blocks 1 and 2 are the two money paths and they are **not** the same thing. Block 2 (`M12`) is how
the platform charges an EPC company. Block 5 (`M11`) is how that company collects from a
homeowner. Different money, different module — don't merge them in your head.

Two things about this order are deliberate and worth knowing, so you don't "correct" them:

- **It is not the register's section order.** The register lists documents; this lists the build.
  The studio sits sixth even though it is the primary product, because it already exists as
  63,527 frontend-only lines in `Solar-App-POC` against an app whose backend is currently a
  health check. The earlier blocks settle the API, schema and data conventions the port has to
  conform to. Proposals travel with it — a proposal quotes the BOM a design produces.
- **Blocks 1–6 are a shippable product on their own**: lead → won → project → payment. The studio
  lands on top of a system that already works.

Within a block, work top to bottom down the register and **skip every row whose `V` column says
`V2`**. Following this order never makes you design a screen whose target doesn't exist yet.

The 20 `M01` screens in block 1 are: Sign In · Company Signup · **Onboarding — Language** ·
**Setup — What You Sell** · Business Profile · **Setup — You're Ready** · Invite Teammate ·
Invite Landing · First-Run Profile · **Role Explainer** · **Profile & Preferences** · Team ·
Assign Roles · **Roles Reference** · Catalog Settings · Add Catalog Item · Catalog Import
Wizard · **Branding Settings** · Proposal Template Settings · Payment Terms Settings.

Four of them are load-bearing in a way the names hide. The **catalog** ones price the bill of
materials — the studio cannot quote without them. **Branding** puts the company's logo on the
proposal PDF and the customer link page; skip it and V1 quotes reach homeowners unbranded. And
**Profile & Preferences** is the only place a user can change their own language after first
run, set their units, mute a notification, or switch on the **high-contrast field mode** — the
sanctioned escape hatch for reading a phone in direct sun (`F7-16`), which matters on a roof.
The six in **bold** were added on 2026-08-16 as the lock widened.

---

## You never choose a brief — the register tells you

Every screen has exactly **one** brief, and its filename is a column in the screen's own row in
`docs/prd/registers/screens.md` §2. So "picking the brief" isn't a decision; it's a lookup.

One row, split out:

```
SCR id       : SCR-SHELL-01
Screen       : App Shell & Navigation
Tier         : P0
Rows         : 8
Brief        : docs/ux/briefs/SCR-SHELL-01-app-shell.md   ← this is the file you paste
V            : V1                                    ← V2 rows are skipped entirely
UX status    : pending                               ← this is how you know it's not done
Design link  : —
```

### Finding today's screen, by hand

Open `docs/prd/registers/screens.md`, go to **§2 Screen index**, and scroll down to the **first row
that says `V1` and whose `UX status` still says `pending`**. That row is today's screen. Its
`Brief` column is the file you paste.

**A `V2` row is not today's screen, ever** — scroll past it. It stays `pending` for the whole of
V1 and that is correct, not a backlog you are falling behind on.

That is the whole method. Every row you finish becomes `designed`, so the first `pending` row
always moves down by one and you never lose your place — even if you stop for a week.

### Finding the two lines to edit afterwards

Search the repo for the screen's `SCR-` id. It appears in exactly two places that matter:

1. **one row** in `docs/prd/registers/screens.md` — the row you just read
2. **one `DESIGN:` line** in `docs/tasks/<module>.md` — e.g. `docs/tasks/SHELL.md` for the SHELL screens,
   `docs/tasks/M06-proposals.md` for the proposal builder

Both get the same link. Ignore any hit inside `docs/tasks/README.md` — that file only *documents* what
a `DESIGN:` line looks like.

*(There is also a `scripts/next-screen.py` that does this lookup for you and prints the
two file:line locations. It's optional — everything above works without it, and the register is
the source of truth either way.)*


## Step 1 — open a Claude Design session

One fresh session per screen. **Never two screens in one session** — a session that has drawn
several screens starts forgetting the laws.

Make sure the right design system is selected — and read this twice, because the name is ambiguous:

> **There are TWO Claude Design projects called exactly "HelioGrid Design System".**
> The live one is **`c8aa4326-21bf-453a-8d11-749cc81dee12`**, last written 2026-08-18 — rounds
> 13 through 17 all landed on it, closing the design-system gap register out.
> The other, `dcb4bbee-2b0c-4b9a-845d-cf1e15ad8a7a`, has not been touched since 2026-07-20 and
> received none of the seventeen rounds of design prompts — no contrast fix, no `--text-inverse`,
> no `NoConnection` screen, and it still has `OfflineBanner`.
>
> Tell them apart by date in the picker: the live one is the **more recently updated** of the two.
> Picking the wrong one does not mean an older copy of the right system — it means a different
> system, and every screen drawn against it is wrong.

---

## Step 2 — the session: one paste, then three follow-ups

> **Where message 1 goes.** On the Claude Design home screen the composer box ("Make UI mockups
> for…") **is** the session's first message — pressing the orange arrow both creates the session
> and starts it generating. So there is no "empty session" to paste into first. Everything below
> goes into that box, then you press the arrow once.

**Message 1 — all three of these, in this order, in the composer box:**

1. the whole contents of `docs/ux/claude-design-context.md`, unchanged
2. the whole contents of the brief named by the register — for screen one,
   `docs/ux/briefs/SCR-SHELL-01-app-shell.md`
3. this line at the bottom:

> Design the mobile 375px layout for this screen. Just the default state for now — I'll ask for
> desktop and the other states next.
>
> **Draw static frames, not an interactive prototype.** No state machine, no prop editors, no
> click-through. Every situation this screen has is its own labelled frame I can see beside the
> others — that is what the brief's frame count means, and it is what an engineer reads as the
> spec. Use the real components and realistic content; just don't make them stateful. Pin any date
> or time to a fixed value rather than `new Date()`, so the spec does not change tomorrow.

Then press the arrow. Look at what comes back. React, and ask for changes until it's right.

*(Paste the text rather than attaching the files. The context file's own first line says "paste
this file, unchanged", and pasting guarantees both documents are actually in the prompt.)*

**Message 2:**

> Now the 1536px desktop layer.
>
> **Parity means capability, not layout.** Every capability, state and piece of information
> reachable at one width must be reachable at the other — but the *arrangement* should be
> genuinely different, because the constraints are. A 1536px desktop that is the 375px phone
> stretched wide is wrong; so is a desktop that quietly drops something the phone can do.
>
> Three things change, and you should let them:
>
> 1. **The shell itself changes by law.** `F7-22`: an arc bar with an elevated centre action on
>    mobile, a sidebar-and-header shell on desktop. Not a variant of one thing — two forms.
> 2. **The design system already owns most responsive behaviour.** Its components change form on
>    their own — by their **own width**, not the viewport — so pass the same props at both widths
>    and let each pick its form. Do not hand-roll a second layout for something a component already
>    handles, and do not fight a component that is deliberately changing shape.
> 3. **Desktop has room the phone does not, and using it is the point.** More rows visible at once,
>    more columns, a persistent panel where the phone needed an overlay, less progressive
>    disclosure because there is less to defer. Density is a real difference, not a nicety.
>
> What must **not** change: any capability, any state, any fact. A thing available on one width and
> absent on the other is an `F7-31` violation, not a design decision.
>
> When you're done, name the places where the desktop arrangement genuinely differs and say in one
> line why each. Where a section really is the same frame with more whitespace, say that too — I
> want the judgement visible, not just the frames.

**Message 3:**

> Now every state listed in the brief — the three base states (loading, empty, error)
> plus every screen-specific state.
>
> Draw each state at **375px**. Then draw at **1536px only the states whose desktop arrangement
> genuinely differs** from the mobile answer — not the ones that are the same frame with more
> room. For every state you do *not* draw at desktop, name it and say in one line why the desktop
> version is the mobile one at width. I want the judgement visible, not the frames.

*(Why it's phrased that way: ten states × two widths is twenty frames, most of them identical
apart from whitespace. But "mobile only" means nobody ever thinks about the desktop error state.
Making it name its skips is what keeps this honest — and it is the same instruction on all 99
screens, so they stay consistent with each other.)*

**Message 4:**

> Now run the self-audit from the context file. Walk **all three lists**: the brief's requirement
> rows one by one, the completion contract item by item, and everything else the context file
> states — the N-rules, light-only, the sheet grammar, no emoji, density, progressive disclosure,
> the REC rule, the offline-residue rule. For each, answer PASS or FAIL and name the specific
> element that satisfies it. Where a law has no subject on this screen, say so and say why —
> that is a PASS with a pointed-at absence, and silence is not. Fix every FAIL in this session.

**Read the self-audit properly.** If it says PASS without naming an element, that's a FAIL —
push back. This is the step that does the real work.

*(Message 4 asked for two lists until 2026-08-16. The context file states far more law than its
completion contract carries — contrast, target size, provenance, light-only, density and the rest
live in the N-rules — so a two-list audit pasted those laws at the top of every session and then
never checked them at the end of one. The third list is the fix, and it has to be asked for here
too, because this message is what actually reaches the session.)*

---

## Step 3 — record it (2 lines, and you're done)

Only after you've approved the design.

### Edit 1 — `docs/prd/registers/screens.md` (screen one is line 160)

Change `pending` → `designed`, and `—` → your Claude Design link. Leave the `V` column alone:

```
BEFORE  | SCR-SHELL-01 | **App Shell & Navigation** | P0 | 8 | `docs/ux/briefs/…` | V1 | pending | — | …
AFTER   | SCR-SHELL-01 | **App Shell & Navigation** | P0 | 8 | `docs/ux/briefs/…` | V1 | designed | <link> | …
```

*Don't trust the line number above once you are past the first screen — rows move. `python3
scripts/next-screen.py` prints the exact `file:line` for both edits, and it reads the header row rather
than counting columns, so a new column cannot make it lie.*

### Edit 2 — the module's task file (screen one is `docs/tasks/SHELL.md` line 16)

```
BEFORE  DESIGN: SCR-SHELL-01 → PENDING
AFTER   DESIGN: SCR-SHELL-01 → <link>
```

To find these two lines for any screen, search the repo for the `SCR-` id. It appears in exactly
one register row and one `**DESIGN:**` line.

### Edit 3 — only if the brief said "designer decides"

If you made a choice the brief left open, **write it into the brief** in the section it belongs
to, so the next screen inherits it. Example: when you reach `SCR-M01-01` (Sign In), it leaves the
`verified-success-dwell` duration to you — pick one, draw it, and write the value into that state.

An unrecorded decision is how two screens end up disagreeing about the same flow.

---

## How you know you're finished

Count the V1 rows in the register that still say `pending`:

```bash
grep -c '^| SCR-.*| V1 | pending |' docs/prd/registers/screens.md
```

**99 today. 0 when you're done.** That is your whole progress bar, and it reads the same file
you're working from.

The `^| SCR-` anchor matters: without it the command also counts every non-V1 pending row too
(struck rows, V2 rows written as prose elsewhere in the file), and reports 100 — one over the true
99, not under.

The other 51 rows stay `pending` on purpose — they are V2. A plain `grep -c '| pending |'`
returns **151** — the 150 screen rows plus the register's own documentation of this command —
and it never reaches zero during V1. Don't use it as your progress bar.

There is no equivalent count on the task side, because `docs/tasks/` has no `V` column — the scope
lock lives in the register only. If you want the task-side view of *everything*, designed or not:

```bash
grep -rhoE 'DESIGN:?\*{0,2} *SCR-[A-Z0-9]+-[0-9]+ *→ *PENDING' docs/tasks/ --include='*.md' --exclude=README.md | wc -l
```

That is 150, not 99, and it is the whole product rather than the locked scope.

---

## Things that will tempt you, and shouldn't

- **Don't batch screens.** One per session. This is the rule that protects quality.
- **Don't read the PRD.** The brief already carries every requirement verbatim. If something
  seems missing from a brief, that's a real bug worth reporting — not a reason to go digging.
- **Don't give Claude Design visual direction.** Colours, spacing, type and components are the
  design system's job. Your job is *what the screen must do*.
- **Don't skip states.** "Loading, empty, error" is where 90% of real product quality
  lives, and it's the first thing that gets dropped when you're moving fast.
