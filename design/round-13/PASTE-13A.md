Round twelve landed, and then I re-read the live files and sent an adversarial reader at every
item I had marked done. Three of the seven were overturned. The cause was the same almost every
time, and it was never the component:

> **The component landed and its documentation did not.**

`CountBadge` shipped correctly — and `AppRail.prompt.md`, the snippet an implementer copies,
still teaches `badge: true`. The rail's own spec card still draws a bare dot. Two of the three
templates still show the old form. Someone copying the canonical example puts the defect straight
back.

So this message is not new design work. It is five corrections, and four of them are the
*examples*. Please treat a component whose own `.prompt.md` still shows the old form as **not
landed** — that is the standard from here on.

As always: **don't ask me how it should look.** The system owns that.

## 1 · `CountBadge` is right, and four things around it are not

The component is correct: `count`, `max = 99`, `"99+"`, nothing at zero, and an `aria-label`
carrying "unread". Keep all of that. Five things around it need fixing, and **two are P0 breaks
the numeral itself introduced**:

**(a) The numeral is below the type floor.** `CountBadge` hardcodes `fontSize: 11, fontWeight:
700` on plain digits. `readme.md` states: *"The type floor is 12px, and the overline role is its
only exception — 11px means uppercase/700/0.12em and nothing else. Nav labels, provenance words,
axis labels, day-of-week headers **and counters** are all ≥12px."* A counter is named
explicitly, and `--fs-caption: 12px` is the floor token.

**(b) The numeral puts words on a mark token, under the contrast floor.** `background:
var(--${tone})` with `tone = "danger"`, `color: "var(--text-inverse)"` → white on `--danger`
`#E5484D` = **3.91:1**, against a 4.5 floor. `tokens/colors.css` is explicit: *"Semantic colours
are MARKS (dots, bars, fills, tints). Their `-text` partners are the only ones allowed to set
words."* A dot was a legal mark. A numeral is words. `Chip.jsx`'s `Badge` already does this
correctly and says so — it uses `var(--danger-text)` on `var(--danger-bg)`.

**(c) `AppRail.prompt.md` still teaches the dot.** Its usage snippet still reads `badge: true`,
and the strings `F6-17`, `CountBadge` and `count` appear nowhere in it. `AppShell.prompt.md` got
the whole "The badge counts" section; its sibling — which documents the surface that actually
carries the bell in the rail — was left stating the old behaviour verbatim.

**(d) `appnav.card.html` renders a bare dot.** The published spec card for the rail. A designer
opening it sees the old answer. The card *is* the spec surface, so this is not a caller's choice.

**(e) Two `aria-label` slips.** `ShellAction` drops the word "unread"; `BottomNav`'s `NavItem`
has no `aria-label` at all, so its accessible name is computed from contents and comes out as
*"7 7 unread leads Leads"*.

## 2 · The top bar exists; the tenant has no name in it, and two templates never adopted it

`AppShell` / `AppHeader` / `MobileTopBar` landed. Two of the five elements I asked for did not.

**(a) Tenant identity has no affordance.** There is only `brand?: React.ReactNode` on
`AppShell`. `Wordmark` and `LogoTile` take no tenant string, `app-shell.card.html` passes the
product mark only, and `templates/app-layout/app.jsx` deliberately passes no `brand` at all,
reasoning that the rail already carries the mark. Net effect: **on desktop the top bar carries
neither the product mark nor any tenant identity.** `MS12-19` asks for both marks to be
placeable; right now the tenant's is expressible only as "pass your own node".

**(b) Two of three templates have no top bar.** `templates/desktop-web-app/app.jsx` destructures
`AppRail, BottomNav, Fab, SearchField, …` — `AppShell`/`AppHeader`/`MobileTopBar` are absent —
and still hand-rolls `<header …><h1 …>Leads</h1>`. Its own comment claims *"THIS FILE IS THE
LAYOUT REFERENCE"*. `templates/mobile-field-app/app.jsx` is worse: its phone screen has no top
bar, no bell and no search entry in a shell at all.

**(c) Still unanswered from round 12:** `tokens/spacing.css` names `--sidebar-w: 260px`, and the
`AppRail` that ships is a 72px rail. Reconcile them or tell me which is wrong.

## 3 · The high-contrast field mode misses the controls it names, and reaches no screen

`tokens/field-mode.css` is a genuine second scope, the import order is right, the specificity is
right, and it overrides *properties* so inline-styled components inherit with no per-component
prop. That design is good. Five things break the promise:

**(a) The rule does not reach ghost controls — the first item in its own list.** The file says:
*"Controls that carry no inline shadow of their own — ghost buttons, nav items, rail tiles — get
the edge from here. Anything with an inline box-shadow keeps it."* But `Button.jsx` ghost applies
`boxShadow: "none"` **inline**, as does `IconButton.jsx`. An inline `box-shadow: none` beats the
un-`!important` `[data-field-mode="on"] :is(button,…)` rule. So the ghost button — transparent,
unfilled, `--text-secondary`, the lowest-contrast control in the system — gets no edge in field
mode. The reasoning has a third case it never considered. (Nav items and rail tiles genuinely do
work.)

**(b) The resting list row gains nothing.** `ListRow.jsx` is a `div` at
`background: hover ? var(--surface) : "transparent"`, `boxShadow: hover ? var(--e2) : "none"` —
neither the token ring nor the `:is(button…)` rule touches it. Its only edge is hover-only, and
`readme.md` forbids that outright: *"Nothing is hover-only, anywhere."* This is the densest
repeated surface on a phone.

**(c) The user-facing copy is therefore false.** `FieldModeToggle` ships *"Stronger text, visible
edges on every card and control."* Per (a) and (b), it is not every card and control.

**(d) The specimen breaks when you use it.** There is no `[data-field-mode="off"]` rule anywhere.
Custom properties inherit, so `field-mode.card.html`'s "Default" pane cannot un-inherit: flip the
card's own toggle, `<html>` gets `on`, and the side-by-side comparison collapses into two
identical field-mode panes.

**(e) It reaches zero screens.** `templates/mobile-field-app/app.jsx` — the phone-on-a-roof
reference build, the exact user this exists for — never references `FieldModeToggle`, and
`_ds_manifest.json` has `"startingPoints": []`. A surveyor in the product has no way to turn it
on.

Also: `FieldModeToggle.d.ts` declares `density?: "expressive" | "functional"`, defaults it, and
forwards it to `Switch`, which takes no such prop. Typed, documented, silently discarded. And
`readme.md` says the file scopes `:root[data-field-mode="on"]` while it uses the bare attribute —
that breadth is what causes (d), so it is not a cosmetic doc slip.

## 4 · A tier still has no stated home on three of the four surfaces named

`Provenance` and the slot rule landed for `StatCard`, `NumberField`, `Block` and the charts. Three
gaps remain, and the point of this item is that **six blocks must not answer them six ways**:

- **`AccordionItem` is unchanged** — `meta?: string`, no `provenance` field on the item or on
  `AccordionProps`, and `Accordion.jsx` only prints the string. Named verbatim last round; did not
  move.
- **`ListRow` has no slot at all** — `title`, `subtitle`, `trailing`, no provenance handling, no
  import of `Provenance`. So a tier on a list-row number goes in `subtitle` or in `trailing`,
  author's choice. That is exactly the situation the rule exists to prevent.
- **`Block` answers differently** — `/** Provenance for the block's figures, rendered in the
  footer. */`. Footer, not beside the value. Defensible per component, but it means the only rule
  covering all of them is the weak one, and it lives in `StatCard`'s docblock and a comment in
  `NumberField.jsx` — **not in `readme.md`**. A `Block` author reading `readme.md` alone learns
  the abstract law and not the slot.

State the slot rule at system level, in `readme.md`, covering the headline figure, the editable
field, the list row, the accordion header and the section header. Where a component legitimately
differs — `Block`'s footer may well be right — say so *in the rule*, so the difference is a stated
exception rather than a discovery.

## 5 · The customer link page can take a tenant's colour but not its logo

`CustomerSurface` landed and scopes `brandColor` across a whole subtree — good, and it is the
right shape. But its props are `brandColor`, `tenantName`, `as`, `fullHeight`, `style`,
`children`, and **`tenantName` is explicitly non-visual**: `/** Recorded as \`data-tenant\` —
useful in review and in QA, never rendered. */`. There is no logo prop and no logo slot.

`F7-07` names *"a logo **and** a primary brand colour"*. Logo support exists only inside
`DocumentPreview`, the document frame this gap exists because it is insufficient — `SCR-F5-01`
through `-05` are whole pages of ordinary components, not documents.

Worse: `CustomerSurface.prompt.md`'s canonical example papers over it with a component that does
not exist —

```jsx
<CustomerSurface brandColor={tenant.brandColor} tenantName={tenant.name} as="main" fullHeight>
  <TenantHeader logo={tenant.logoUrl} name={tenant.name} />
```

There is no `TenantHeader` anywhere under `components/brand/`, and `readme.md`'s inventory is
`Wordmark`, `LogoTile`, `DocumentPreview`, `CustomerSurface`. The live demo hand-rolls the
identity as bare text: `<strong style={{fontSize:16,…}}>Suryodaya Solar</strong>`.

So either build the lockup the example promises, or correct the example. Keep the boundary
`F7-07` draws in the other direction: the **operator** application is never restyled per tenant.

## Deliverables for 13A

Same conventions as every round: `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` with realistic
Indian solar content, and the group cards updated so changed parts render with real content.

**And the standing instruction, which is why this message exists:**

> For every item, also update **every** surface that teaches the old behaviour — the
> `.prompt.md`, the `@dsCard` spec card, the templates under `templates/`, `readme.md`, and any
> sibling component's docs showing the pattern. Then list, per item, exactly which files you
> changed. **A component whose own example still shows the old form has not landed.**

Tell me, per item: what changed, what you deliberately left alone, and the file list. For §1(a)
and §1(b) give me the measured type size and the measured contrast ratio after the change.

If any item is already fixed since my read, say so plainly rather than redoing it.
