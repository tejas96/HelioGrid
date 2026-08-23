> ## ⛔ ALREADY SENT — DO NOT RE-SEND
>
> This prompt was sent to the HelioGrid Design System (`c8aa4326-21bf-453a-8d11-749cc81dee12`)
> and **every change in it landed**, verified against the live project on 2026-08-16. It is kept
> as the record of what was asked and why, not as an instruction.
>
> Re-pasting it would ask Claude Design to rebuild components that already exist, and it reasons
> from an inventory that has since changed. If you need a change to the design system, write a
> new numbered prompt.

# Prompt for Claude Design — round two, closing the last gaps

Open the **HelioGrid Design System** project in Claude Design and paste everything below the line.

---

The composite layer you built is right — the four laws are genuinely in the APIs, not just the prose,
and `SheetActions` measuring its own width rather than the viewport is exactly the reading I wanted.
This round is smaller: three fixes to what's already there, and six things the 152 screens need that
neither of us listed the first time.

Same rules as before. **Read `readme.md`, `tokens/`, and the components you already built** — these sit
beside them and have to look like the same hand made them. Everything below is a product law with a
requirement id you can check me against, not a preference.

## Part 1 — three fixes

**1. `Sheet` hardcodes a timestamp.** The offline strip renders the literal string
`"Showing last saved copy — synced 10:42 AM"`, with no prop to change it. Every offline sheet in the
product would claim 10:42 AM. The governing requirement is `F4-26` (P0):

> *"Whenever a screen is served from cache, a banner on that screen states it and states when the data
> was last synced (`F4-10`). It is not a dialog, does not cover content and never blocks interaction;
> it disappears when the read is fresh again rather than being dismissible into permanent silence."*

The sync time is data. It has to arrive as a prop, and the strip should be the shared `Banner` from
Part 2 rather than markup that only exists inside `Sheet`. Note also that `F4-26` forbids dismissal —
so no close affordance on this one.

**2. `Sheet`'s error defaults are wrong twice.** `errorTitle` defaults to `"Couldn't load this lead"` on
a generic overlay that also carries surveys, quotes, filters and confirmations. Worse, `errorMessage`
defaults to `"You're offline. Reconnect and try again."` — which asserts a cause. A 500 would be
reported to the user as being offline. That breaks the honesty law in the component that sets the tone
for the other nine.

The content rule is that errors state the problem *and* the fix. A generic overlay cannot know either,
so the honest default is no fabricated default: require the caller to say what failed, or fall back to
something that claims nothing. Same check on `Modal`, `DetailPanel`, `DataTable` and `ChartFrame` —
if any of their error or empty defaults name a specific domain object or a specific cause, fix those too.

**3. `readme.md` claims a dark mode that doesn't exist.** The index line reads
``` `tokens/` — `fonts.css`, `colors.css` (+ dark mode), … ```
but `colors.css` has no dark block, and the product is **light-only** by `F7-04` (P0) — v1 has no dark
theme, no per-user theme switch and no dark variant of any surface. The readme's own colour section
says light-only correctly; only the index line is stale. Left there, it invites someone to "restore"
dark mode later.

*Minor, while you're in `Sheet`:* the offline strip has no `role="status"`, so a screen-reader user
gets no announcement when it appears.

## Part 2 — six components the screens need

Each of these is cited by a P0 requirement. I've quoted the requirement text verbatim so you can see
exactly what the component has to be able to express.

### 1. `Banner` — the biggest gap (21 screens, ~60 distinct instances)

`OfflineBanner` exists, but it's one special case: a queued-change count for field work. The product
runs on a whole family of them, and right now 60 of them would be hand-rolled boxes.

`F4-10` (P0) is the base law:

> *"A read served from cache says so, wherever it is served. Reads everywhere degrade to cache rather
> than to an error, and the surface carries a **staleness banner** stating that what is shown is the
> last synced copy and when it was last synced. Money figures shown from cache additionally carry the
> **provisional** label — the money-never-stale rule applies without exception."*

The kinds actually in use, by frequency: **staleness** (16), **state** (9), **review-needed** (4),
**freshness** (4, "while shading recalculates"), **validation** (3), **suggestion** (3), **dunning** (3),
**provisional** (2), **data-integrity** (2), plus orphan-override, below-cost, preliminary-quote,
disclaimer and cap banners.

Two behaviours matter more than the visual:

- **They stack, and they have a precedence rule.** One screen quotes *"stacked banners (stale, orphan,
  below-cost, preliminary, disclaimer)"*. Billing states it as a law: *"One banner at a time: gates
  compose with one rule — the broadest true fact speaks (state before cap, cap before bundle), so a
  user never gets two banners for one act."* Different surfaces resolve this differently — some stack,
  some collapse to one — so the component needs to support both rather than pick.
- **Most are not dismissible.** Per `F4-26` a staleness banner *"disappears when the read is fresh again
  rather than being dismissible into permanent silence."* Dismissal is the exception, not the default.

Several carry a named action ("take the new value", one-tap pay) and several name specific fields, so
they need room for a body and a trailing action, not just a line of text. Design the dunning one at the
longer of its two copy lengths — a protected tenant's copy carries a forfeiture disclosure from day 0.

Once this exists, `OfflineBanner` should become a thin wrapper over it rather than a separate thing.

### 2. `Slider` + `NumberField` (8 P0 rows, all in the 3D design studio)

`MS12-26` (P0), verbatim: *"Shared controls behave identically everywhere: **sliders with stepper
buttons**, switches, segmented radiogroups, option cards, unit toggle, number and text fields that
COMMIT ONCE on blur or Enter (never per keystroke)…"*

Real uses, all P0: eave-height 2–30 m and pitch 0–60° (`MS2-27`) · uniform setback 0–3 m (`MS2-31`) ·
rotation 0–359° (`MS3-26`) · bridging clearance 0–1 m (`MS3-30`) · racking tilt "stepper+slider" and an
azimuth stepper (`MS6-20`) · sun-simulation time (`MS6-31`).

The one thing that will bite if the API doesn't have it — `MS3-27` (P0) is a step-wide law:

> *"Slider law (step-wide): any slider drag = exactly ONE undo entry; setback slider 0–3 m with live
> ring redraw."*

So a drag has to report continuously (the 3D preview redraws live at 60 Hz) but commit **once** at the
end. If the component exposes only one change callback, every one of those eight screens invents its
own debounce and they diverge. Give it a live signal and a commit signal as separate things.

Also: values carry units that the user can switch (`MS2-27` puts a unit toggle in the sheet header), and
several sliders show a role-aware hint next to the value. `SegmentedControl` already covers the unit
toggle itself — don't rebuild that, just leave the slider somewhere to display the unit.

### 3. Commit-once-on-blur behaviour on `Input`

Same `MS12-26` sentence — *"number and text fields that COMMIT ONCE on blur or Enter (never per
keystroke)"* — and `MS3-26` (P0) adds the failure mode:

> *"typed dims in the display unit, COMMIT-ON-BLUR/Enter with the drag-path floors (0.3 m size / 0.1 m
> height; **empty/invalid never commits**) and friendly correction."*

`Input` today is a plain controlled field: `onChange` per keystroke, nothing else. The point of
`MS12-26` is that these controls behave *identically everywhere*, which only the shared component can
guarantee — so this one is worth changing an existing v1 component for. Make it additive and opt-in so
nothing already using `Input` changes behaviour. "Friendly correction" means a value clamped to a floor
should say so rather than silently snapping.

### 4. `Menu` — actions / overflow menu

`MS12-12` (P0): *"Design cards: real buttons with keyboard support, satellite thumbnail of the confirmed
pin, status chip, capacity/updated stats, and an **actions menu (open · duplicate · delete) with correct
menu semantics**."*

Your own `DataTable` already documents `rowActions` as taking an *"overflow"* — with nothing in the
system to put there. "Correct menu semantics" is the explicit requirement: real menu roles, arrow-key
navigation, Escape, focus restore, and a destructive item that reads as destructive without relying on
colour alone.

### 5. `OptionCard`

`MS12-26` (P0) again, verbatim: *"…switches, segmented radiogroups, **option cards**, unit toggle…"*

`Radio` is a 20px dot with a label; there's no card form. This is the "pick one of these, each with a
title, a line of explanation and sometimes an icon or a price" control — used for racking type, panel
choice, plan selection. It's a radiogroup, so it needs radiogroup semantics, not a row of buttons.

### 6. `QRCode`

`MS9-14` (P0): *"The 3D moment lives INSIDE the proposal link per Q27 — one link, with the 3D model
card, working copy-link feedback and **a scannable QR that fails visibly rather than silently**."*

`MS9-24` (P0): *"Accessible names attach to elements with real roles (images, QR, status)."*

Used on the proposal document and the customer-facing proposal link — both surfaces a homeowner sees.
"Fails visibly rather than silently" is the honesty law stated for this component specifically: if the
code can't be generated, the surface has to say so and still offer the link, never render an empty
square that looks like a QR that simply won't scan.

## Conventions

Same as last time — `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` with real Indian solar content, and
a group card carrying the `@dsCard` marker on its first line. Suggested placement:
`components/forms/` (Slider, NumberField, OptionCard, the `Input` change) ·
`components/feedback/` (Banner) · `components/overlays/` (Menu) · `components/data/` (QRCode).

Don't touch `tokens/`, `guidelines/`, or the templates. `Input` is the one existing component in scope,
and only additively.

Every one of these still owes the four laws you already built into the others: all four states, honesty,
provenance where numbers appear, and own-width rather than viewport. Touch targets ≥ 44×44, nothing
hover-only, focus rings never removed.

## Order

Start with **`Banner`** — it's the widest by a distance, and `Sheet`'s fix depends on it existing.
Show me `Banner` and the three Part 1 fixes together, then carry on through the other five.
