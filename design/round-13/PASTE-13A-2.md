Send 13A landed well in the components. I verified all twenty of its sub-items against the live
project, file by file, and then sent an adversarial reader at every one I had marked done.

**The code is right.** Both P0 breaks are genuinely fixed and I re-measured them rather than
taking the claim: the unread numeral is `var(--fs-caption)` = 12px with no literal left, and
`--danger-text` `#B32226` on `--danger-bg` `#FDECEC` recomputes to **5.79:1**, clearing the floor.
`renderProvenance` reaching `Accordion` and `ListRow` is real. `TenantHeader` / `TenantMark`
exist and are exported. The `[data-field-mode="off"]` scope exists and its 27 values match base
exactly.

**What did not land is the teaching surfaces** — the same failure that made round 12 partial,
in the places 13A's own standing instruction was supposed to catch. Sixteen of twenty sub-items
are held open by an example, a spec card, or the unused half of a template still showing the old
form. Two are real behaviour.

This message is the cleanup. It is mechanical — most items are one line — but please do not
treat it as cosmetic: `readme.md` calls `templates/` *"starting points a consuming project
copies"*, and `SKILL.md` tells every new screen to start from one. A stale example is how the
defect comes back.

**Two of these are genuine bugs, not documentation.** They are §4 and §6(c). Please do those two
first.

---

## 1 · The last `badge: true`, and a docstring that describes a name nothing can produce

**(a)** `templates/mobile-field-app/app.jsx`, inside `Desktop()`:

```jsx
footer={[{ key: "alerts", label: "Notifications", icon: <IcBell />, badge: true }, …]}
```

This is **the only surviving `badge: true` on a Notifications bell in the project**. Its two twins
were both cleaned — `templates/app-layout/app.jsx` and `templates/desktop-web-app/app.jsx` now
read `footer={[{ key: "settings", … }]}` with the count moved to `notifications={7}`. The
straggler is worse than neutral because the same file's header comment claims the opposite: *"the
bell whose badge COUNTS unread (`F6-17`)"*.

It is dead at runtime — `build()` ends `return Mobile;` — which is exactly why it was missed, and
exactly why it still matters: nobody sees it render, and everybody copies it.

**(b)** `AppShell.d.ts`'s `CountBadgeProps.label` still teaches the pre-fix, content-computed
name, and it is **the only place in the system that states the name contract at all**:

```
/** The NOUN only — "notifications", "alerts". The accessible name is built as
    "3 unread notifications", so passing "unread notifications" here would double the word. */
```

Since 13A put `aria-label` on the host button, and `aria-label` wins over contents in accessible
name computation, **no shipped call site can produce "3 unread notifications" any more.** All
three — `RailButton`, `NavItem`, `ShellAction` — feed `label` into a span whose text is now
suppressed. So the typed API contradicts both the `.jsx` and the two surfaces that *were* updated
to *"Notifications, 7 unread"*.

`readme.md`'s `CountBadge` bullet states no name contract at all, so nothing else corrects it.

Fix the docstring to describe the name that is actually produced, and say in `readme.md` what
`label` is now for.

## 2 · The shell's own canonical example still teaches the arrangement that caused the bug

`AppShell.prompt.md` — the component's own example file, and the thing an implementer copies —
still leads with the superseded reasoning:

> *"**`MS12-19`** — brand and tenant identity appear in the top bar. That is `brand` — but **the
> rail and the header are one shell**, so when an `AppRail` is showing the mark, leave `brand`
> off the header rather than drawing the tile twice."*

That is precisely the reasoning that produced a desktop top bar carrying **neither** mark, which
is what item 2a was raised about. It names `brand` as the whole answer and **never mentions
`tenant`**, the slot 13A added. Its first code block, captioned *"// The desktop shell — every
screen starts here"*, still carries `// No brand slot here — the rail already carries the mark`.

Rewrite the bullet and the code block around the `tenant` slot.

## 3 · Both templates still hand-roll the header — in the half nobody looked at

Each of these files was fixed in one branch and left alone in the other, and each still
*advertises* the old arrangement in its own header comment.

**`templates/desktop-web-app/app.jsx`** — destructures `MobileTopBar` and never uses it. Its
`Mobile()` still contains:

```jsx
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
  <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em" }}>Leads</h1>
  <Avatar name="Amit Rane" size={34} />
</div>
```

No `MobileTopBar`, no brand, no tenant, no bell, no shell search — in the file whose own comment
says *"THIS FILE IS THE LAYOUT REFERENCE"*.

**`templates/mobile-field-app/app.jsx`** — destructures `AppShell` and `AppHeader` and uses
neither; its `Desktop()` hand-rolls the same way.

Both files' header comments still describe the hand-rolled arrangement and should be corrected
with them.

## 4 · ⚠ A switch has no edge in field mode — including the field-mode switch itself

**This one is behaviour, not documentation.**

`Switch.jsx`'s track is a plain `<span>` with **no `box-shadow` declared at all**:

```jsx
<span style={{ width: 52, height: 32, borderRadius: "var(--r-pill)", flexShrink: 0,
  position: "relative",
  background: disabled ? "var(--canvas-sunken)" : checked ? "var(--accent)" : "var(--canvas-sunken)", … }}>
```

It is not a `button`, a `[role="tab"]` or a `[role="button"]` — the real `<input role="switch">`
is visually hidden — so `field-mode.css`'s blanket rule never reaches it:

```css
[data-field-mode="on"] :is(button,[role="tab"],[role="button"]):not(:disabled){ box-shadow: var(--control-edge); }
```

So **an OFF switch in field mode is a `#E9ECF0` track on a `#FFFFFF` surface — about 1.15:1 —
with no edge.** On a roof, in direct sun, it is invisible.

The switch this is most obviously true of is `FieldModeToggle`'s own. A person turns on the
high-contrast mode and the control they used to do it is the thing that did not get an edge.

While you are there: `FieldModeToggle`'s copy still promises *"visible edges on every card and
control"*. Either make that true or make the sentence true.

## 5 · Two stale rules that now contradict the files they sit in

**(a)** `tokens/field-mode.css` still carries, verbatim:

> `/* Controls that carry no inline shadow of their own — ghost buttons, nav items, rail tiles —
> get the edge from here. Anything with an inline box-shadow keeps it: inline wins… */`

Ghost buttons now **do** carry an inline `box-shadow` (`var(--control-edge)`) — which is the
correct fix — and are therefore explicitly *not* covered by the rule this comment sits on. The
file already contradicts itself: its own header thirty lines above says correctly *"The blanket
rule below stays for controls that set no shadow at all (nav items, rail tiles)."* Delete the
stale half. `FieldModeToggle.prompt.md` already has it right.

**(b)** `components/data/blocks.card.html` teaches the **opposite** of `readme.md`'s new
provenance carve-out, in a comment written to be copied:

```js
/* Inside a Block the frame is already there, so a figure is a value and its label
   — not a StatCard with its chrome switched off. */
const Figure = ({label, value, unit}) => …
```

`readme.md` now says: *"Where a block has a single headline figure, that figure is a `StatCard`
inside it and takes its own slot."* Both single-headline-figure blocks on that card use the
hand-rolled `Figure` and park the tier in the block footer. One of the two is wrong — decide
which, and make the other match.

## 6 · Brand: three surfaces still teach the old boundary, and one guard was not carried over

**(a)** `branding-settings.card.html` still teaches that the document frame is the boundary — its
subtitle, its *"The only surface it paints"* heading. Gap 7 exists because the customer link
pages are whole pages of ordinary components, not documents. Update it, and add a
`CustomerSurface` / `TenantHeader` instance so the card shows the page case.

**(b)** `readme.md`'s `DocumentPreview` bullet and `DocumentPreview.jsx`'s header comment both
still state the old scope.

**(c)** ⚠ **Behaviour, and it is a contrast guard that exists ten lines away.**
`DocumentPreview.jsx` guards the tenant colour before putting anything on it:

```js
const bandOk = on.passes;
background: bandOk ? hex : "#FFFFFF"   // + a warning caption
```

`TenantMark` applies the raw fill **unconditionally**. Same module, same colour, two answers —
against `CustomerSurface`'s own stated law, *"this component does not assign the raw colour to
anything that carries words"*.

It bites on a colour already in your own picker: `tenant-branding.card.html` offers `#006FFF`,
which computes to **4.45:1** — under 4.5 — so `bestTextOn("#006FFF").passes === false`, and that
flag is discarded. The same card's footnote boasts *"Try #006FFF: the link page's buttons and
links do **not** take that colour, because at 4.45:1 on white it fails N4."* One click renders the
monogram at 4.45:1 on the very card claiming it cannot happen.

Either gate `--tenant-brand-on` on `bestTextOn(…).passes`, or have `TenantMark` fall back to
neutral when it fails. *(Fair caveat: the monogram carries `role="img"`/`aria-hidden`, so a
logotype exemption is arguable and it clears the 3:1 mark floor. Decide it deliberately and write
the decision down — do not leave the two components disagreeing.)*

**(d)** `tenant-branding.card.html` passes no real `logo`, so the URL branch of `TenantHeader` is
never exercised anywhere. Give it one.

## 7 · Two loose ends

**(a) `--rail-w` is as orphaned as `--sidebar-w` was.** The token was renamed from `--sidebar-w:
260px` to `--rail-w: 72px` — correct number, and `_ds_manifest.json` agrees. But **nothing reads
it.** `AppRail.jsx` takes the width as a raw JS number and spreads it in:

```jsx
export function AppRail({ items = [], value, onChange, footer = [], avatar, width = 72, brand, style = {} })
```

`spacing.css`'s own comment is honest about it — it names `AppHeader` as implementing
`--header-h` and `MobileTopBar` as implementing `--topbar-h-mobile`, and names no implementer for
`--rail-w`. `AppShell.jsx` wired its pair (`const HEADER_H = "var(--header-h, 64px)"`), so the
omission next door is not house style. Either have `AppRail` default from the token, or delete
the token — an unread token is the thing the original item was about.

**(b) `_ds_manifest.json` still reads `"startingPoints": []`.** `FieldModeToggle.d.ts` carries
`@startingPoint section="Forms" …` and so does `Button.d.ts` — **no `@startingPoint` anywhere is
reaching the manifest.** So the field mode still has no entry point a person can find, which was
the whole of item 3e. If starting points are generated, that generation is broken; if they are
authored, they were not authored.

---

## Deliverables

Same conventions. And the standing instruction, which is what this whole message is about:

> **Do not judge for yourself which files teach a behaviour.** For each item, **search the whole
> project for the old form** — the literal string or prop you just replaced — and paste the list
> of every file that still contains it. Fix every one, then search again until the list is empty.
>
> Search all of it: `.jsx`, `.d.ts`, `.prompt.md`, every `*.card.html`, everything under
> `templates/`, `readme.md`, `SKILL.md`, `_ds_manifest.json`. **Include the unused half of a
> file** — the `badge: true` in §1(a) survived precisely because it sits in a `Desktop()` that
> never renders.
>
> If a search comes back empty, say so — that is the evidence, not the claim.

Tell me:

- for **§4**, what a `Switch` looks like in field mode now, and whether the fix is on `Switch` or
  on the stylesheet — and why that is the right layer;
- for **§6(c)**, which answer you took and where the decision is written down;
- for **§7(a)**, whether `--rail-w` now has a reader or was deleted;
- for **§7(b)**, why `startingPoints` is empty and whether that is generation or authoring.

If any item is already fixed since my read, say so plainly rather than redoing it.
