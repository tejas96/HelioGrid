# Round 13 — the round that unblocks the design run

**This file is the index. The prompts themselves live in [`round-13/`](round-13/), one file per
send, and each is copied whole.** There is no text here to paste — keeping a second copy of each
prompt in this file is how the two drift apart, so it does not exist.

Round 13 closes every open gap that lands on **build block 1** — the shell, entry and tenant
screens, 23 of the 99. `SCR-SHELL-01` cannot be drawn until they close. Register and evidence:
[`DESIGN-SYSTEM-GAPS.md`](DESIGN-SYSTEM-GAPS.md).

## The sends, in order

| # | file | items | what it is | status |
|---|---|---|---|---|
| 1 | [`round-13/PASTE-13A.md`](round-13/PASTE-13A.md) | gaps 4, 5, 7, 8, 9 | corrections to round 12 | **run** — 5 of 21 sub-items closed |
| 2 | [`round-13/PASTE-13A-2.md`](round-13/PASTE-13A-2.md) | the 16 that stayed open | cleanup, incl. 2 real bugs | **run** |
| 3 | [`round-13/PASTE-13A-3-check.md`](round-13/PASTE-13A-3-check.md) | 4 confirmations | same session as 13A-2 | **run** |
| 4 | [`round-13/PASTE-13B.md`](round-13/PASTE-13B.md) | gaps 14, 17, 18, 26, 33 | five new blockers | next |
| 5 | [`round-13/PASTE-13C.md`](round-13/PASTE-13C.md) | gaps 35, 36, 39, 40, 52 | five defects | after 13B |

**One session per send. Never two sends in one session.** Make sure the right project is selected
— two are named "HelioGrid Design System" and the live one is `c8aa4326-21bf-453a-8d11-749cc81dee12`,
the more recently updated of the two.

## Why it is split at all

Round 12 carried seven items in one message and six landed only partially. Round 11 carried five
and did measurably better. Five per message, fresh session each.

13A ran first on purpose: three of its five items were the *examples other people copy*, so
leaving them wrong would have had 13B and 13C inherit the defect.

## What every send now carries, and why

Rounds 11, 12 and 13A each half-landed the same way — the component was fixed and its
`.prompt.md`, spec card or template still taught the old form. The instruction those rounds
carried was *"update every surface that teaches the old behaviour"*, which cannot be followed: a
session cannot update files it does not know exist, so it fixes what it opened and reports done
honestly.

Every send now ends with a mechanical version instead:

> Search the whole project for the old form — the literal string or prop you just replaced — and
> paste every file that still contains it. Fix them and search again until the list is empty.
> Include the unused half of a file: a `Desktop()` that never renders is still copied.

That change is why 13A-2 came back with search results rather than assurances, and why it found a
stale `IcBell` in a third template nobody had flagged.

## What 13A established that later sends build on

Recorded here because 13B's preamble depends on it, and because a later round re-deciding any of
these would fracture the system:

- a control needing a field-mode edge reads **`--control-edge` inline** — ghost `Button`,
  `IconButton`, `Switch`'s track. The stylesheet's `:is(button,[role="button"],[role="tab"])`
  selector keys on control semantics and is deliberately not widened to `<span>`;
- a provenance tier goes in the component's own **`provenance` slot via `renderProvenance`**,
  never in `children` or a free-text `meta`;
- a tenant colour that will carry words is **gated through `bestTextOn(brand).passes`** and
  darkened rather than dropped to neutral, so the tenant keeps their hue;
- tenant identity on a customer-facing page is **`CustomerSurface` + `TenantHeader`** — the
  document frame is no longer the boundary. This one materially changed 13B §4, which used to
  claim the customer-link header could not be drawn at all.

Two things 13A surfaced that are **not** part of the 57 and are recorded in the register:
`Slider`'s unfilled track has no field-mode edge (round 14), and `@startingPoint` tags are inert
because the compiler owns `startingPoints` and reads no author-facing marker.
