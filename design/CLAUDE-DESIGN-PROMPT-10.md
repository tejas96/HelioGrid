> ## ▶ NOT YET SENT — send after prompt 9
>
> Verified against the live HelioGrid Design System (`c8aa4326-21bf-453a-8d11-749cc81dee12` —
> the *more recently updated* of the two projects with that name) on 2026-08-16. All five gaps
> below are real as of that read.
>
> **§5 lands on `SCR-SHELL-01`, the very first screen of the run** — its availability toggle needs
> a time of day and no time control exists. §1 bites at screen 20 and §2 at screen 19 of block 1;
> §4 at block 2. So the run can start before this lands, but not get far.

# Prompt for Claude Design — round ten: five gaps the V1 readiness audit found

Open the **HelioGrid Design System** project and paste everything below the line.

---

A readiness audit of the 98 screens we're about to design found five places where the system
either lacks something a screen needs, or documents behaviour that contradicts a product law.
All five are measured against the live project, not a mirror. Three of them land on the first
screens we draw — one on the very first, so I'd like these closed before the design run starts.

As always: **don't ask me how it should look.** The system owns that. What follows is what the
components must be able to express.

## 1 · There is no colour input, and a first-block screen is built around choosing one

`components/forms/` has Button, Checkbox, DatePicker, Dropzone, IconButton, Input, NumberField,
OptionCardGroup, OtpInput, Radio, SearchField, Select, Slider, Stepper, Switch, Textarea. Nothing
takes a colour.

**`SCR-M01-18` Branding Settings** is in build block 1 — among the first screens drawn — and its
P0 rows are exactly this:

> **`M01-50`** — Branding settings: logo, letterhead, **brand colour**, company details — applied
> to customer documents only.
>
> **`F7-07`** — A tenant supplies a logo and a **primary brand colour** that appear on the
> generated proposal and the customer link page; the operator application is never restyled per
> tenant.

What the component has to carry, beyond taking a value:

- **The brand colour never restyles the app.** It rides the proposal PDF and the customer link
  page only. Whatever preview the control offers must show it in *document* context, never
  applied to the surrounding interface — the law is that the operator app looks the same for
  every tenant, and a colour picker that live-tints the page teaches the opposite.
- **Contrast is a product law here, not a nicety.** The chosen colour is put behind text on a
  customer-facing document. `N4` (contrast verified, not eyeballed) and `F7-11` apply. The
  control should be able to say, honestly, when a chosen colour cannot carry the document's text
  — and it should say what is wrong, not merely refuse.
- **A colour is not a status.** `F7-12` (P0) — status is never conveyed by colour alone — means
  this control must not become the pattern other screens copy for state.
- Field users are on mid-range Android phones; whatever the entry affordance is, it needs to work
  at 375px with a thumb.

Also note `SCR-M01-18` shows a **live document preview** beside the settings. If that is better
served by a preview surface than by the colour control itself, say so and propose the split.

## 2 · `Stepper` types the opposite of what the studio's step navigation requires

`components/forms/Stepper.d.ts` today:

```ts
variant?: "progress" | "numbered" | "dots";
/** Only completed steps are clickable. */
onStepClick?: (index: number) => void;
```

The governing row is **`M05-03` (P0)**, and 17 of the 98 V1 screens sit inside the flow it
describes:

> **Every step carries one of four states — not started / in progress / done / has errors — and
> navigation is always visible.** Mobile: compact indicator ("n / 9 · <step> ‹ ›") opening a
> step-list sheet; desktop: a step rail. Back navigation and re-entry into completed steps are
> always available.

Three mismatches, the second of which is the sharp one:

1. **There is no `has errors` state.** The component models current-and-completed; the product
   models four states per step.
2. **A step with errors is not "completed", so under `onStepClick` it is not clickable.** That is
   backwards: the entire reason to surface *has errors* is to let someone go and fix it. As typed,
   the system marks a problem and then blocks the route to it.
3. **Neither the mobile nor the desktop arrangement `M05-03` names exists.** It asks for a compact
   indicator that *opens a step-list sheet* on mobile, and a *step rail* on desktop. The three
   variants are an overline-and-track, a horizontal numbered row, and dots.

The same component carries the 11-step proposal builder (`SCR-M06-02`) and three import wizards
(`SCR-M01-17`, `SCR-M02-05`, and catalog settings), so whatever you decide is inherited widely.

**One thing to preserve:** "re-entry into completed steps is always available" is a real
constraint — a wizard here is never a one-way corridor. Extending clickability to errored steps
should not quietly extend it to steps not yet started, which would let someone skip ahead of work
the flow depends on.

## 3 · Every `FilterBar` control is below the 44px touch floor

Measured from `components/data/FilterBar.jsx` on the live project:

| Export | Height in the file | Floor |
|---|---|---|
| `ScopeToggle` | `minHeight: 36` | 44 |
| `FilterChips` | `height: 34, minHeight: 34` | 44 |
| `SortPills` | `minHeight: 32` | 44 |
| `FiltersButton` | `height: 36, minHeight: 36` | 44 |

This is not a desktop-only arrangement that a mobile variant fixes. The file's own header comment
says:

> *"Same parts on 375 and 1440; only the arrangement changes."*

So these are the phone sizes. The binding laws:

- **`N2`** — touch targets ≥ 44×44. This one is in the context file pasted at the top of all 98
  design sessions, so every screen is audited against it.
- **`F7-29` and `F7-32`** (both P0) — the same floor, as product law.
- The readme states the floor itself, so the system currently contradicts its own documentation.

`FilterBar` is the shared filtering vocabulary for **every records screen** — leads, projects,
payments ledger, catalog, call log. Whatever the fix is, it is inherited by all of them, which is
why I'd rather change it here than have 20 screens each work around it.

Worth noting so the fix isn't cosmetic: the visible pill and the touch target don't have to be the
same rectangle. A 34px pill with a 44px hit area is a legitimate answer and may be the right one
for a dense desktop filter row — but if that's the route, the component should express it
deliberately rather than leaving it to whoever uses it.

## 4 · `ProgressBar` cannot express the usage screen, and billing is build block 2

`components/feedback/ProgressBar.d.ts` in full:

```ts
value?: number;    // 0-100
gradient?: boolean;
```

`SCR-M12-04` Usage is the screen it has to carry, and its P0 rows ask for considerably more:

- **`BM-27`** — *"Usage transparency is law, not UX polish."* The screen shows exactly the rollups
  the product enforces and bills from — same numbers, no smoothing — **labelled with period and
  provenance**, and a bundle's consumption shown against its bundle. So each meter needs a
  **denominator** ("1,340 of 2,000 sends"), a **period**, and room for a provenance tier — `N7`
  and `F8-01` put a tier on every user-visible number, and every one of these is one.
- **`BM-34` / `M12-30`** — the screen **warns at 80%**, and at **100%** a banner appears and a
  **7-day grace** begins. So a meter needs a **threshold marker**, not just a fill.
- **`M12-35`** — overage **accrues visibly** beyond the bundle. So the value goes **past full**,
  and "100%" is not the end of the scale.
- **`M12-36`** — *"no scary meters"*. A tone constraint on all of the above, and the reason I am
  not telling you what it should look like.

The four states it must sit inside: `overage-accruing`, `tracked-seats-accruing`,
`cap-reached-grace`, `creations-paused`.

`ProgressBar` as typed can express none of it — no label, no denominator, no threshold, no value
above 100, nowhere for a tier. Decide whether this is a richer `ProgressBar` or a separate meter
component and say which, and why.

## 5 · There is no time-of-day control, and the first screen of the run needs one

The system ships `Calendar` and `DatePicker`, both date-only — `ISODate`, a month grid, "12 Mar
2026". Nothing takes a time.

**`SCR-SHELL-01` is the first screen we draw and it needs one.** `M07-46` (P0) gives every user a
routing-availability toggle — available · busy · off — with an **optional until-time**, and the
brief's own worked example is *"busy until 17:00"*. The brief already flags the gap in a component
note; this is that note reaching you.

**Nine V1 briefs touch a time of day.** Three need genuine entry rather than display:
`SCR-SHELL-01` (the until-time), and `SCR-M07-05` / `SCR-M07-06`, where an EPC sets the **calling
window** its voice agent may dial inside — a compliance boundary, not a preference.

Worth knowing before you design it: a time in this product is frequently **not** free-form. The
calling window is bounded by the market pack's statutory hours (`F1-15`, `F1-36`), so the control
needs to be able to express a permitted range and refuse outside it — and the refusal has to name
the window rather than silently clamping. Whether that is one component with a `min`/`max` or two
is your call.

## Deliverables

Same conventions as every previous round: `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` with
realistic Indian solar content, and the group card updated so the new or changed parts render
with real content.

When you're done, tell me for each of the five:

- what you changed and what you deliberately left alone,
- for §1, whether the colour control and the document preview are one component or two, and why,
- for §2, what a step with errors can and cannot be clicked into, stated as a rule,
- for §3, the measured touch target of every `FilterBar` export after the change.

For §4, whether the usage meter is a richer `ProgressBar` or a new component. For §5, what a
time outside a permitted window does.

If any of the five is already fixed since my read, say so plainly rather than redoing it — that
happened with round nine and cost a session.
