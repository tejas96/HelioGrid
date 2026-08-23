> ## ▶ NOT YET SENT — the round that unblocks the design run
>
> Verified against the live HelioGrid Design System (`c8aa4326-21bf-453a-8d11-749cc81dee12`) on
> 2026-08-16, after round eleven landed. Every claim below was checked by reading the file named.
>
> **Block 1 — the app shell and the first twenty screens — cannot be drawn until this lands.**
> Round thirteen follows with the canvas, the print surface and rich text, which block 7 and 8
> need and nothing earlier does.

# Prompt for Claude Design — round twelve: the shell, the tokens and the container

Open the **HelioGrid Design System** project and paste everything below the line.

---

Round eleven fixed how a number tells the truth. This round is the other half of what the audit
found: the **permanent chrome** every screen sits inside, two token-layer capabilities the system
says it has and does not, and the container that seventeen screens are assembled from.

Three of these are the same shape of problem, and it is worth naming because it recurs: **the
system documents a rule and implements a narrower version of it.** That is harder to catch than a
missing component, because everything reads as present. It is what happened with `Stepper` before
round ten, and items 1, 4 and 5 below are the same failure at the token layer.

As always: **don't ask me how it should look.** What follows is what must be expressible.

## 1 · Tenant branding is implemented at half the scope its own law states

`F7-07` (P0), verbatim from the PRD:

> *"**Tenant branding applies to customer-facing documents and link pages only**; the operator
> application is never restyled per tenant. A tenant supplies a logo and a primary brand colour
> that appear on the generated proposal document **and the tokenised customer-link pages**."*

Round ten built the first half correctly and closed the door on the second. Live:

- `DocumentPreview.d.ts`: *"the visible boundary of `F7-07`: everything inside the frame may be
  tenant-branded, everything outside it is the operator app and never is."*
- `BrandColorField.d.ts`: *"**It never restyles the app.** … This control writes no token and
  touches no ancestor style."*
- `tokens/colors.css`: `--accent:#5A4BFF` is a fixed product value. No tenant hook, no scope.

The rule has two branded surfaces. The system ships one, and its documentation forbids the other.

**Why this is not a document problem.** `F5-39` makes the *web page* the path of record — *"The
customer link always renders the proposal as web — PDF is an artifact, never the only path to the
number."* And `MS9-11` (P0): *"The link opens the customer's own surface — not the operator's
editor chrome: no operator-only alerts, tool rails, or internal instructions; **branding is the
tenant's**."* So the branded artefact is a **live page of ordinary components** — `Button`,
`StatusChip`, `Timeline`, `Charts`, `ProgressBar`, `Sheet` — not an A4 mock inside a frame.

Five customer-facing screens plus the document carry this P0 obligation. What I need is a scope
the tenant's colour can reach that is bigger than one frame and smaller than the app, with the
operator-app prohibition kept exactly as strict as it is now. `DocumentPreview`'s framing sentence
and `BrandColorField`'s helper will both need correcting so they stop describing the narrower rule
as the whole one.

Note the contrast obligation travels with the scope: a tenant colour behind `Button`'s label on a
link page is subject to `N4` and `F7-11` the same way it is inside a document, and
`color-contrast.js` already exists to answer it.

## 2 · There is no application top bar, and the layout standard hand-rolls one

`F7-22` (P0): *"Desktop uses the sidebar-and-header shell. **Both shells are part of the design
system rather than per-module inventions.**"* Also `MS12-19` (P0): *"brand and tenant identity
appear in the top bar."* `F6-20` (P0): the global search box is *"one box in the app shell on web
and mobile."* `F6-17` (P0): *"the bell in the web header, bell in the mobile shell."*

Live, `components/navigation` ships `AppRail`, `BottomNav`, `Fab`, `Breadcrumb`,
`SegmentedControl`, `Tabs`. **No header.** `AppRail` is a 72px desktop icon rail — the sidebar
half only. `BottomNav` is the parabolic arc with no slot for a search box or a bell.

The one place a header exists is hand-written markup in `templates/app-layout/app.jsx` — the file
`readme.md` calls *"the layout standard: Start here for any new screen."* It holds a raw
`<header>` with an `<h1>`, a count line and a button; the mobile top is a bare `<h1>` plus an
inline `<Avatar>`; `SearchField` sits in the page content rather than the shell; and the bell is
`footer={[{key:"alerts", badge:true}]}` on the rail. **That is precisely the per-module invention
`F7-22` forbids**, in the file every screen is told to copy.

One more thing to reconcile: `tokens/spacing.css` names geometry nothing implements —
`--header-h:64px`, `--topbar-h-mobile:56px`, `--sidebar-w:260px`, `--sidebar-w-collapsed:68px` —
and the 260px sidebar those tokens describe is not the 72px rail that ships. Either the tokens or
the rail is wrong; say which.

Twenty-three shell-bearing screens would each invent this, and the other seventy-six inherit
whatever they invent.

## 3 · The notification badge is a boolean, and the brief asks it to count

`F6-17` (P0): *"One notification centre: the bell, the badge, the list. **The badge counts unread
from the record** (never from push state)."* `SCR-SHELL-03`'s state is `unread-badge` — *"badge
counting unread from the record, matching the list"* — and its provenance list opens with *"The
unread badge count — derived from the records."*

Live, `AppRail.d.ts`, the only badge slot in either shell:

```ts
/** Red dot for unread notifications. */
badge?: boolean;
```

A boolean renders a dot. It cannot match the list, it has nowhere for the `derived` tier the brief
assigns it, and it fails `F7-12` — *status is never conveyed by colour alone* — on the one surface
every other screen copies. A red dot is the mark with the word removed.

The studio needs the same thing: `MS6-06` asks for live **count** badges on the electrical tool
buttons, and this boolean is the only badge in the system it could reach for.

## 4 · The high-contrast field mode is asserted by the readme and implemented nowhere

`F7-16` (P1): *"A high-contrast field mode exists as a sanctioned, opt-in escape hatch for working
in sunlight. **It is a product-visible capability, not a styling variant** … turning it on is the
one condition under which the no-borders law of `F7-15` yields."* `SCR-M01-11` carries two states
for it, `field-mode-off` and `field-mode-on`.

`readme.md` says it exists:

> *"There are exactly two exceptions, and both are deliberate: **`Dropzone`'s dashed edge** … and
> the opt-in **high-contrast field mode**. Anything else with a border is a bug."*

I read `tokens/colors.css` end to end this morning. It is **a single `:root` block** — no second
scope, no mode selector, nothing. `tokens/base.css` sets `color-scheme: light`. `_ds_manifest.json`
lists exactly one theme. No component among the 54 takes a field-mode prop or reads a field-mode
attribute. `Switch` can draw the toggle; there is nothing behind it.

This is the cheapest item here to close now and among the most expensive to retrofit, because
every component's contrast decision is made once, in that one file, and there is no second set.
Your users are surveyors and installers reading a mid-range Android phone on a roof in Indian
sunlight — this is the mode that makes the product usable for them.

Keep the light-only law intact. This is not a dark theme and not a per-tenant theme; `F7-04` still
holds.

## 5 · Four controls sit at 32px, and the written exception does not reach them

`readme.md` permits exactly one exception to the 44px floor:

> *"a pointer-only affordance **inside** a data row (the call / message buttons in a leads table):
> those sit at 32px inside a 48px row where the whole row is the primary target **and the same
> action is repeated at full size in the record's detail panel**."*

Four sites are 32px and none of them qualifies:

| site | why the exception fails |
|---|---|
| `Kanban.jsx` `MoveControls` (32) | its own comment says *"always visible (never hover-only), so a technician on an Android tablet … gets the same capability as a dragger"* — the opposite of pointer-only. `SCR-M08-01`'s context is *"phone on site for stage moves"* |
| `DataTable.jsx` `SelectionBar` clear (32) | not inside a row at all |
| `Menu.d.ts` default trigger (32) | *"Defaults to a 32px overflow button"* — the control every records screen hangs its per-row actions on |
| `Banner.jsx` dismiss (32) | the shell banner on `SCR-SHELL-06` |

The exception also fails on its own terms at `SCR-M02-02`, where `M02-24` rules that everything
beyond triage waits for the detail screen — so there is no full-size repeat to fall back on.

**`FilterBar` already solved this in round ten** and says so: *"each control's `<button>` is 44px
(the target) and the pill drawn inside it keeps its own height … expressed once, in the component,
rather than left to twenty records screens to remember."* The pattern exists. Four components do
not use it.

## 6 · `StatusChip` is a closed 17-value union, and eight other vocabularies need it

```ts
export type SolarStatus =
  | "lead" | "survey-scheduled" | "design-in-progress" | "approved" | "installing"
  | "commissioned" | "on-hold" | "new-lead" | "contacted" | "qualified" | "site-visit"
  | "designing" | "proposal-sent" | "negotiating" | "won" | "lost" | "snoozed";
```

`status` selects the tone *and* the dot. `label` overrides the word only. There is no `tone` prop.
And `StatusChip.jsx` falls back silently — `const s = STATUS[status] || STATUS.lead` — so an
unrecognised status renders as a grey "Lead" rather than failing loudly.

Eight vocabularies are required by P0 rows and **not one of their values is in the union**:

- **invite** — pending / accepted / expired / revoked (`M01-12`)
- **membership** — invited / active / deactivated (`M01-19`)
- **document checklist** — pending / uploaded / verified (`M08-31`, drawn *"label plus mark, never
  colour alone"*)
- **payment tranche** — due / part-received / awaiting-confirmation / received / superseded /
  waived / reversed
- **billing** — trialing / active / past-due / halted / expired / cancelled
- **calling outcome** — interested / callback requested / not interested / no answer / busy /
  wrong number / voicemail / escalated / transferred / opted out (`M07-38`)
- **proposal & link** — draft → shared → accepted / declined, with superseded; active / revoked
- **studio** — pending → verified; ready / needs attention / blocking; locked

So today "Awaiting confirmation" must be dressed as `negotiating` and "Overdue" as `lost`, which
puts a wrong semantic colour on a correct word. `Kanban.d.ts` imports the same union — *"Drives the
header StatusChip"* — confirming it is the system's one status registry.

Honest scoping: `Chip` already takes `dot` + `tone` + children, so `F7-12`'s label-plus-mark is
satisfiable there. The question is whether `StatusChip` opens up or whether the product's answer is
"use `Chip` for anything outside the pipeline" — if that is the answer, say it in the docs, because
right now nothing does and twenty-six screens will each guess.

## 7 · There is no section frame, and seventeen screens are assembled from one

Three unrelated parts of the product arrive at the same missing unit.

**Composed homes.** `M13-10` (P0) is carried verbatim by five V1 screens: *"that preset's
today-work is composed into THIS screen as a block rather than sent to a second home… **Design the
block seams**: this screen must be able to host one or more foreign today-blocks without the layout
breaking or the screen's own purpose being buried."* A block composed into two different homes must
look like itself in both — which hand-rolled chrome cannot do.

**Composed objects.** `M08-16` (P0): *"One screen holds the whole project: the stage timeline, the
approved design, the accepted proposal, the payments, the documents, the blockers and the
activity… Each block is a view onto the object that owns it"* — each *"naming the object it reads
and the version in force"*, and blocks with nothing in them *"say so ('No blockers — nothing is
waiting on anyone') rather than disappearing."*

**Named cards.** Block 7 alone names ten with their own headers and states — the Site Intelligence
card with loading, no-coverage and unreachable states plus a provider badge and an honest footer;
the readiness card with its verdict; per-category cards with a provenance footer.

Live: `Card.d.ts` is `{children, density, interactive, selected, style, onClick}` — no title, no
overline, no meta, no footer, no action slot, and **no `state`**, while `DataTable`, `ChartFrame`,
`Sheet`, `DetailPanel`, `Timeline` and `MapSurface` all have one. `Accordion`'s item is
`{key, title, meta?: string, content}`, collapsible-only. `EmptyState` hardcodes `48px 24px`
padding, a 72px icon and a 180px bloom — a full-region treatment that cannot sit inside a block
that has nothing in it.

The empty case is the one to get right: a block with nothing in it **says so and stays**, and that
is different from a screen with nothing on it.

## Deliverables

Same conventions: `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` with realistic Indian solar
content, group cards updated. Where `readme.md` states something now false — item 1's branding
scope, item 4's assertion that the field mode exists, item 5's exception if you widen it — correct
it in the same pass. If `templates/app-layout/app.jsx` is *"the layout standard"*, it should use
the new shell rather than hand-rolling one.

When you're done, tell me:

- **§1** — what scope a tenant colour reaches, and how the operator-app prohibition stays enforced;
- **§2** — what the shell components are now, and whether the spacing tokens or the rail were wrong;
- **§3** — how a count renders and what it does at 100+;
- **§4** — how field mode is switched on and what it changes, in one sentence a designer can hold;
- **§5** — the measured target of each of the four, after;
- **§6** — whether `StatusChip` opened or the answer is `Chip`, and where that is now written down;
- **§7** — the block's states, and what an empty block does that `EmptyState` would not.

If any of the seven is already fixed since my read, say so plainly rather than redoing it.
