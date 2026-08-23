> ## ⛔ ALREADY SENT — DO NOT RE-SEND
>
> This prompt was sent to the HelioGrid Design System (`c8aa4326-21bf-453a-8d11-749cc81dee12`)
> and **every change in it landed**, verified against the live project on 2026-08-16. It is kept
> as the record of what was asked and why, not as an instruction.
>
> Re-pasting it would ask Claude Design to rebuild components that already exist, and it reasons
> from an inventory that has since changed. If you need a change to the design system, write a
> new numbered prompt.

# Prompt for Claude Design — round six: the contrast failure you found

Paste everything below the line into the **HelioGrid Design System** chat — the design-system
project, not the screen-design session.

*(Context for me: raised by Claude Design itself during the first `SCR-SHELL-01` session, as an
N3·N4 CONFLICT it correctly refused to patch per-screen. Every figure below independently
verified.)*

---

You flagged this yourself during the first screen session, and you were right to refuse to fix it
in the screen. It belongs in the tokens. I have verified every number you gave and found two more.

## The measurements

WCAG AA needs **4.5:1** for normal text. The two backgrounds that matter are `--surface`
`#FFFFFF` and `--canvas` `#F6F7F9`; a text colour has to clear the bar on **both**, and the canvas
is the harder one.

| token | value | on #FFFFFF | on #F6F7F9 | |
|---|---|---|---|---|
| `--text-secondary` | `#74787E` | **4.44:1** | **4.14:1** | fails |
| `--text-tertiary` | `#A1A5AC` | **2.47:1** | **2.31:1** | fails badly |
| `--success` | `#159A5B` | **3.62:1** | **3.37:1** | fails as text |
| `--warning` on `--warning-bg` | `#E9A23B` on `#FDF4E6` | — | **1.99:1** | fails badly |

`--text-primary` `#0A0A0B` is fine at 18.46:1.

This is **N4**, a P0 law — *"contrast verified, not eyeballed"* — and these tokens carry real words
on real screens: the tenant name, every `RecordCard` meta line, the sync strip's second line, every
overline, `ProvenanceTier`'s tier word, `BottomNav`'s labels, `StatusChip`'s text. The users are on
mid-range Android phones **on a roof in direct sunlight**, which is the worst viewing condition
this product will ever face.

## What I'm asking for, and what I'm not

**I'm giving you the requirement, not the palette.** Every text colour must clear 4.5:1 on both
`#FFFFFF` and `#F6F7F9`. The values are yours — you own what this system looks like.

Three things worth knowing before you choose them:

**1. `--text-secondary` is nearly there.** It needs roughly 5% darker to clear the canvas. That one
is easy and costs almost nothing.

**2. `--text-tertiary` is the real design problem, and I don't want you to solve it by darkening.**
To clear 4.5:1 it would land around `#6F7176` — which is essentially the fixed `--text-secondary`.
The two greys would collapse into one and you'd lose a step of the hierarchy the whole system is
built on.

The better answer is probably that **`--text-tertiary` stops being a text colour**: it becomes
decorative only — dividers, disabled states, the inactive half of a control — and everything
currently setting *words* in tertiary moves to secondary. That would mean revisiting the overline
role, which is `11px/700` in tertiary today and is the system's signature device. Your call: you
know what that costs visually better than I do. If you find a third way, take it.

**3. `--warning` fails as text but is fine as a mark.** A dot, a bar, an icon fill only needs 3:1
(non-text contrast). It's `--warning` *as words on the tint* that fails at 1.99:1. So the fix may
be a separate darker token for text while `--warning` itself stays the amber it is — rather than
turning the amber brown. Same question for `--success`.

## Also: two N3 violations in shipped components

**N3 is a 12px type floor, with exactly one exception — the overline role.** These two are not
overlines and are below the floor:

- `ProvenanceTier`'s tier word — 11px
- `BottomNav`'s labels — 11px

Both need to be at least 12px, or to be justified as the overline role, which I don't think either
is.

## Scope

Please treat this as a **token + component fix**, not a redesign:

- `tokens/colors.css` — the text colours, plus any new text-specific semantic tokens you introduce
- the components that set 11px non-overline text — `ProvenanceTier`, `BottomNav`
- `StatusChip` — its text needs to clear the bar on its own tint
- anywhere else in the 60-odd exports that sets words in a failing colour: please sweep for it
  rather than fixing only what I listed, since I found these from one screen

Then update `readme.md` — its colour section states the neutrals and should state the contrast
floor as a rule, so nobody lightens them back later.

**Do not change** `--text-primary`, `--action-primary`, the iridescence, the chart palette, radii,
spacing or elevation. Nothing here is about the look — it's about whether the words can be read.

## Why now

152 screens are about to be designed against these tokens, and the first one is already drawn. Fix
it now and all 152 inherit it. Fix it at screen 60 and 59 screens need re-checking.

When you're done, tell me the new values and their measured ratios on both backgrounds, so I can
verify rather than take it on trust.
