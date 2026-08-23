> ## ⛔ ALREADY SENT — DO NOT RE-SEND
>
> This prompt was sent to the HelioGrid Design System (`c8aa4326-21bf-453a-8d11-749cc81dee12`)
> and **every change in it landed**, verified against the live project on 2026-08-16. It is kept
> as the record of what was asked and why, not as an instruction.
>
> Re-pasting it would ask Claude Design to rebuild components that already exist, and it reasons
> from an inventory that has since changed. If you need a change to the design system, write a
> new numbered prompt.

# Prompt for Claude Design — completing the HelioGrid Design System for V2

Open the **HelioGrid Design System** project in Claude Design and paste everything below the line.

---

I'm extending this design system for HelioGrid V2. The product has grown from the v1 scope this
system was built for, and the component inventory hasn't kept up. I need you to close that gap.

**Read `readme.md`, `SKILL.md`, the `tokens/`, the existing `components/`, and both `ui_kits/`
before you design anything.** Everything you add has to look like the same hand made it — same
restraint, same luminance-not-lines hierarchy, same near-black primary, same iridescence-as-
atmosphere-only discipline. Match the craft level of the existing components; these will sit
beside them on the same page.

## The product this serves

HelioGrid is a mobile-first SaaS platform for solar EPC companies in India — the businesses that
sell, design and install rooftop and commercial solar. V2 covers the full lifecycle across 13
modules: lead capture, marketing campaigns, site survey (remote and physical), a 3D design studio,
proposals, sales execution with a voice agent, projects, field workforce tracking, lightweight HR,
payments and collections, platform billing, and dashboards.

The V2 spec is finished: **150 screens, 1,336 distinct states, 1,656 requirements.** Users are
sales reps, surveyors, design engineers, project managers, field technicians and owners — mostly
on mid-range Android phones, often on a roof with poor signal. **Both 375px and 1536px are
first-class**; the product law is explicit that "mobile-first does NOT mean web is compromised."

## What's missing, and why

The system has 21 excellent primitives — Button, Input, Card, StatCard, StatusChip, Chip, ListRow,
Avatar, IconCircle, EmptyState, Toast, ProgressBar, OfflineBanner, Switch, Radio, Checkbox,
IconButton, Tabs, SegmentedControl. What it doesn't have is the **composite layer** the product is
actually built from.

Seven of the missing pieces **already exist visually** — they were written inline inside the v1 UI
kit screen files rather than as components, so the design system never learned them:

| Component | Needed by | Already drawn in |
|---|---|---|
| **Sheet** / bottom sheet | 180 uses | `ui_kits/mobile/overlays.jsx` — `Sheet` + `SheetBackdrop` |
| **Timeline** | 111 uses | `ui_kits/mobile/overlays.jsx` — `TimelineRow` inside `LeadSheet` |
| **Dropzone** / file upload | 80 uses | `ui_kits/mobile/overlays.jsx` — the dashed block in `NewQuote` step 2 |
| **Stepper** / wizard | 66 uses | `ui_kits/mobile/overlays.jsx` — the "step 1 of 2" header in `NewQuote` |
| **DataTable** | 61 uses | `ui_kits/desktop/screens.jsx` — `DataTable` |
| **Modal** / dialog | 38 uses | no direct source — same family as Sheet and DetailPanel |
| **Kanban** | 27 uses | `ui_kits/desktop/screens.jsx` — `Kanban` |
| **DetailPanel** / drawer | (part of the 38) | `ui_kits/desktop/screens.jsx` — `DetailPanel` |

**For these: read the v1 source and keep the design.** They already look right and they're already
yours — the values, the proportions, the animations, the backdrop treatment. Promote them into
proper components with a real API. Improve the craft where the inline version was rough, but don't
redesign what works.

Three more are **genuinely new**, because V2 added the modules that need them. These you design
from scratch, from the system's own rules:

| Component | Needed by | Why it's new |
|---|---|---|
| **Calendar / DatePicker** | 36 uses | V2 added HR — attendance register, leave requests — and a calling-window editor |
| **Charts** — bar, line, donut, funnel | 23 uses | V2 added dashboards, the pipeline funnel, win/loss analytics |
| **MapSurface** | 41 uses | V2 added field workforce — routes, day playback, geofences, address confirmation |

The chart palette already exists in `tokens/colors.css`: `--chart-1` … `--chart-8`, ordered and
colourblind-safe, plus `--chart-gridline`. Use it exactly; don't invent colours.

## Requirements that come from the product spec, not from taste

These aren't preferences — they're laws the product is held to, and a component that can't express
them will fail review on 152 screens.

1. **Every component needs its states.** Loading, empty, error and offline are part of "done" for
   every surface in this product. A chart with no empty state, a table with no empty state, a map
   with no "tiles unavailable" state — those are incomplete.

2. **Honesty is a product law.** The system must never draw something that implies certainty it
   doesn't have. A chart with one data point should say "not enough data" rather than render a
   confident-looking bar. A map that can't load tiles should say so rather than show blank space
   that reads as "no sites". A last-known-position marker must be visibly different from a live one.

3. **Every user-visible number carries a provenance tier** (measured / derived / estimated /
   assumed). Components that display numbers need somewhere for that marker to live.

4. **Tables have to work at 375px.** 74 of the 152 screens carry tabular content — leads list,
   payments ledger, bill of materials, call log, attendance register. A horizontally-scrolling
   table is not an acceptable answer. Decide what a table becomes on a phone, and build it into
   the component so all 74 screens inherit one answer instead of inventing 74.
   *Note: measure the component's own width, not the viewport — a table inside a 480px detail
   panel on a 1536px screen has the same problem. The product law is explicit: "no layout tuned to
   a fixed viewport."*

5. **The Timeline is mostly full-page in V2**, not the cramped 4-step sheet it was in v1 — it
   carries the customer's progress page, lead detail, project stages and the field activity log.
   Whatever makes it read as a *sequence* rather than a list of dots should be the default.

6. **Both density modes** where the surface appears in both. Note that `readme.md` assigns data
   tables and kanban to Functional only — respect that.

7. **Touch targets ≥ 44×44**, nothing hover-only, focus rings never removed. Field users are
   wearing gloves on a roof.

8. **Content is Indian and sentence case**: ₹4,52,471 grouping, kWp, DISCOM, "12 Mar 2026". Errors
   state the problem *and* the fix. Buttons are verbs. No emoji.

## The one border rule worth flagging

The system's governing rule is *no structural borders — hierarchy comes from luminance and soft
shadow.* The upload dropzone's dashed edge is one of only **two** legal exceptions in the entire
system (the other is the opt-in high-contrast field mode). Please note that in the component's own
documentation so nobody "fixes" it later.

## Deliverables

For each component, follow the conventions already in this project:

- `<Name>.jsx` — the component
- `<Name>.d.ts` — types, matching the existing `.d.ts` style
- `<Name>.prompt.md` — a short description plus 2–3 realistic usage examples with real Indian
  solar content
- a group card (`<group>.card.html`) whose first line carries the `@dsCard` marker, rendering the
  components with realistic content — same scaffold as `components/feedback/feedback.card.html`

Suggested grouping: **`components/overlays/`** (Sheet, DetailPanel, Modal) ·
**`components/data/`** (DataTable, Timeline, Kanban — new cards, don't overwrite `data.card.html`) ·
**`components/forms/`** (Dropzone, Stepper, DatePicker — same, new card) ·
**`components/charts/`** (Charts, MapSurface — new folder).

Don't touch `tokens/`, the existing 21 components, `guidelines/`, or the v1 `ui_kits/` — this is
purely additive.

## How I'd like to work through it

Start with **Sheet**. It's needed by 180 screens, it's the most distinctive thing in the system
(the backdrop blurs and fades toward white — never a dark scrim), and DetailPanel and Modal are
the same family, so getting it right sets the tone for the rest.

Show me Sheet first and let me react to it before you build the other nine.
