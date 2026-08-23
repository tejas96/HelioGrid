Four capabilities for the proposal builder — the eleven-step flow on `SCR-M06-02` through
`SCR-M06-13`. The brief calls it *"the most-used screen in the product. Every deal passes through
it."*

§1 is a rule the product **killed by ruling** and the system reintroduced one component down. I
would take that first.

**Don't ask me how it should look.** The system owns that.

## Patterns already settled — compose with these, don't re-answer them

- **`Stepper` / `StepList`** — four step states including `errors` with `errorCount`, plus `rail`
  and `indicator` arrangements. **§1 is its clickability contract, not a second `Stepper`.**
- **`NumberField`** — `outOfRange="refuse"`, currency from the pack, no steppers under currency.
  **That is a *correction* path; §2 is a *validation failure*, which is a different state.**
- **`FieldOverride`** — a value and the one it superseded. **`CompareGrid`** — 2–N whole options
  side by side. **§4 is neither, and I say why below.**
- **`UsageMeter`** — a billing meter, walled off by `readme.md`. **§3 is not billing.**
- **`ActionReason`** · **`NamedGap`** · **`PendingAction`** · **`Provenance`**.

## 1 · A ruling that was made, and un-made by a default

`M06-22` is a P0 row whose **title** is the ruling:

> **"Free navigation everywhere; validation at Generate ONLY; the Next-disabled rule is killed."**
>
> The source's gating *"is **superseded by ruling and never ships**: Back/Next always navigate,
> every chip always jumps, and **no step ever blocks another**."*
>
> `M06-21`: *"A chip rail (top) carries eleven jump chips, one per step — tap any chip to jump to
> any step **in any order**."*

**All eleven step briefs repeat it verbatim** in Entry & exit.

Live, `Stepper`'s `onStepClick`:

> *"A step is clickable **once it has been entered** — done, in-progress and errors are all
> reachable; **not-started never is**. An errored step must be reachable (that is the point of
> marking it), and a not-started one must not be, **so nobody skips ahead of work the flow depends
> on**."*

`resolveSteps` hard-codes it as a returned `reachable` flag, `StepList` inherits it, and
`readme.md` restates it as system law.

**The reasoning in that docstring is good, and it is wrong for this flow.** On `SCR-M06-02`'s own
Empty state — *"a fresh Path B proposal: nothing pre-filled beyond lead/tenant data; every chip
incomplete"* — **all eleven steps are `not-started`, so exactly one chip is clickable.** The rule
`M06-22` killed as Next-disabled is back as chip-disabled.

Note this is the same component the round-ten rebuild touched. That rebuild correctly closed
`M05-03`'s four states and the studio's rail arrangements, and left this contract alone — so this
is not a regression, it is a survivor.

What it needs is **a per-flow opt-out or an explicit `reachable` override, not a second
`Stepper`.** The studio's flow may genuinely want the existing rule; the builder must not have it.
Whatever you choose, the default has to stop being a law that one P0 ruling already overturned.

## 2 · The system's own numeric field cannot say it is the reason Generate refused

Another false clearance: an earlier pass cleared `NumberField` for the builder's ranges — capacity
0.5–7000, battery 1–100 kWh, PR 50–100, dip 0–50, EMI 0–100%, tariff 1–50 — and never asked
whether the field can **show a failure**.

> `M06-22` (P0): *"Generate lists every failure as a tappable jump ('Fix 2 issues to share') —
> **tapping a failure opens the exact step, with the failing fields highlighted**."*
>
> `SCR-M06-05`: *"payable floor, battery validity and required-field failures land here
> **highlighted**."*

**Because `M06-22` kills the Next-disabled rule, this highlight is the only validation rendering
the eleven-step builder has.**

Live: `Input` has *"`error?: string` — error message, inset 1.5px danger ring + text below"*, and
`Select`, `Textarea`, `DatePicker` and `OtpInput` all have `error`.

| component | has `error` |
|---|---|
| `NumberField` | **no** — only `hint` and `correctionMessage` |
| `SegmentedControl` | **no** — and no `label` either |
| `OptionCardGroup` | no |
| `Switch` | no |
| `TimeField` | no |

And the required fields the gate checks are **overwhelmingly these components**: step 3's
capacity, tariff and the ONGRID/OFFGRID/HYBRID control; step 4's PR %, seasonal dip %, units per
kW/day; step 5's savings, payback, lifetime, inflation %; step 7's tranche percentages.

**One distinction to hold.** `NumberField`'s `correctionMessage` is documented for clamping —
*"overrides the generated 'Rounded up to the 0.3 m minimum.' correction line"* — and 15C added
`outOfRange="refuse"`. Both are the component saying *what it did with your input*. A validation
failure is different: **the value may be perfectly typeable and still be the reason Generate
refused**, and the field has to say so when the jump lands on it.

## 3 · An allocation that must reach exactly 100%, and a meter that cannot say how far off it is

> `M06-13` (P0), `SCR-M06-09`: *"tranche rows (label + % + ✕) · ＋ Add tranche · **progress bar +
> validation: 'Total allocation must = 100%'** — post-R12 this is a Generate-time block, shown
> live as feedback and enforced only at Generate **with the remainder stated ('12% unallocated')**"*
>
> State `allocation-incomplete-remainder`. Data volume: *"the progress bar and remainder line
> **always visible at 375 px**."*

`ProgressBar` has no label, no target, no remainder slot, and **no way to render a total above
100%** when the rep's rows over-allocate — which is half the failure the live feedback exists to
catch.

`UsageMeter` is mechanically closer — it has a denominator, a scale past 100% and a note — and
`readme.md` walls it off on purpose: *"A billing meter for `SCR-M12-04`… `ProgressBar` stays a 6px
operation bar with no billing semantics."*

**A tranche split is not a billing period against a bundle.** Borrowing the billing meter here is
the wrong-instrument failure this whole audit exists to catch, so please do not — but do say
whether the two share anything, since both are "a figure against a target that can be exceeded."

Two things to carry: the remainder is stated **in words** (*"12% unallocated"*), not inferred from
a gap in a bar; and over-allocation is a real state, not an error — the rep is mid-edit, and
`M06-13` shows it live and blocks only at Generate.

## 4 · Two immutable snapshots, and nothing in the system compares anything

> `M06-42` (P0), `SCR-M06-16`: *"Each version snapshots the **full eleven-step field set plus the
> computed money block**… Each version carries a change note — 'what changed and why.' The versions
> screen shows **v1 vs v2 with what changed, and why**."*
>
> Data volume: *"design the v1-vs-v2 comparison at that snapshot size, **at phone width**."*
> Numbers: *"changed money figures in the diff — each figure shows **at the provenance tier its own
> version pinned**."*
>
> `M06-47` (P0), `SCR-M06-18`: the Path B upgrade *"offers to upgrade the numbers from
> `estimated`/`assumed` to `derived`, **showing the differences before anything commits**"* —
> `F8-05`: **a tier change is shown, never silent.** State `upgrade-offered-diff`.

I walked the component folders with the audit and **no comparison, diff or compare carrier
existed** at the time. Two components have since landed that are adjacent, and neither is this:

- **`CompareGrid`** compares **2–N whole options** — different things, same attributes, pick one.
  A version diff is **one thing at two times**, and the reader is not choosing between them.
- **`FieldOverride`** shows a value and the one it superseded — the right *shape* for one field,
  but it is about a human override of a derived default, not about two immutable snapshots, and it
  has no changed/unchanged or added/removed notion across a field **set**.

Say plainly whether the diff extends one of them or is its own component, and why.

Three things the brief makes non-optional: **changed, unchanged, added and removed are four
states**, not two; **each figure carries the tier its own version pinned**, so a cell can read
`estimated → derived` and that tier change is itself the content on `SCR-M06-18`; and it has to
work **at phone width** on a full eleven-step field set, where showing both columns side by side is
not available.

---

## Deliverables

Same conventions. Plus the standing instruction:

> **Do not judge for yourself which files teach a behaviour.** For each item, **search the whole
> project for the old form** — the literal string or prop you just replaced — and paste the list
> of every file that still contains it. Fix every one, then search again until the list is empty.
>
> Search all of it: `.jsx`, `.d.ts`, `.prompt.md`, every `*.card.html`, everything under
> `templates/`, `readme.md`, `SKILL.md`, `_ds_manifest.json`. **Include the unused half of a
> file.** If a search comes back empty, say so — that is the evidence, not the claim.

**For §1 specifically:** `readme.md` restates the old clickability rule as system law, so this is a
law change, not just a prop. Say what the law reads now and which flows take which behaviour.

Tell me:

- for **§1**, how a flow opts out, and what the default becomes;
- for **§2**, which components gained `error`, and how it differs from a correction;
- for **§3**, what the meter is, how the remainder reads in words, and what over-allocation looks
  like;
- for **§4**, whether the diff is new or an extension, how four states render, and what it does at
  375px.

If any item is already fixed since my read, say so plainly rather than redoing it.
