Good work — the searches and the `startingPoints` probe are exactly the evidence I wanted, and
finding the dangling `IcBell` in `app-layout` was a catch I had missed.

Four items from that list are not in your reply. They may well be done and just not reported, so
this is a confirmation, not a re-ask. For each: search, paste what you find, and fix it if it is
still there.

**1 · `AppShell.d.ts`, `CountBadgeProps.label`.** It read:

```
/** The NOUN only — "notifications", "alerts". The accessible name is built as
    "3 unread notifications", so passing "unread notifications" here would double the word. */
```

Since the `aria-label` went on the host button, and `aria-label` beats contents in accessible-name
computation, no call site can produce `"3 unread notifications"` any more. Does that docstring now
describe the name that is actually produced — and does `readme.md`'s `CountBadge` bullet say what
`label` is now for?

**2 · The other half of both templates.** Removing the dangling `IcBell` is not the same as
adopting the shell. Specifically:

- `templates/desktop-web-app/app.jsx` — does `Mobile()` now use `MobileTopBar`, or does it still
  hand-roll `<h1 …>Leads</h1>` + `<Avatar />`? It destructured `MobileTopBar` and never used it.
- `templates/mobile-field-app/app.jsx` — does `Desktop()` now use `AppShell` / `AppHeader`? It
  destructured both and used neither.

Search both files for `<h1` and tell me what is still there.

**3 · The stale comment in `tokens/field-mode.css`.** It read:

> `/* Controls that carry no inline shadow of their own — ghost buttons, nav items, rail tiles —
> get the edge from here. Anything with an inline box-shadow keeps it: inline wins… */`

Ghost buttons now carry an inline `box-shadow`, so that comment names them under a rule that no
longer covers them — and `Switch` is now a third case in the same family. Does the comment still
say "ghost buttons"?

**4 · `DocumentPreview`'s scope statements.** `readme.md`'s `DocumentPreview` bullet and
`DocumentPreview.jsx`'s own header comment both stated the old boundary — that the document frame
is where tenant branding lives. `CustomerSurface` and `TenantHeader` now make that false. Search
both for the old wording.

Reply with the four search results. If a search is empty, say so — empty is the answer I want.
