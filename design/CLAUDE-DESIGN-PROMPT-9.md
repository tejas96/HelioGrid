> ## ⛔ ALREADY LANDED — DO NOT RE-SEND
>
> **Correcting a wrong marker.** This file was stamped "NOT YET SENT — none of the six changes
> below has landed" on 2026-08-16. That was wrong: all six had already landed in the live design
> system (`c8aa4326-21bf-453a-8d11-749cc81dee12`) before the stamp was written, and the readiness
> audit of the same day had said so explicitly. The stamp asserted a verification that was never
> performed.
>
> The owner re-ran this prompt on 2026-08-16 as a result. **No harm done** — re-verified against
> the live project afterwards: no file added, removed or duplicated, `OfflineBanner` still absent,
> `NoConnection` present once, `BannerKind` still the clean twelve. The project's `updatedAt`
> moved but its structure did not.
>
> Verified landed, 2026-08-16, by direct read: (1) no `OfflineBanner.*`; (2) no `offline` prop on
> Sheet / DataTable / Timeline / MapSurface / ChartFrame; (3) `BannerKind` = 12 kinds, no
> staleness / freshness / provisional; (4) the Switch demo reads "Notify me on WhatsApp";
> (5) `NoConnection.{jsx,d.ts,prompt.md}` + `no-connection.card.html` all present;
> (6) the readme lists `NoConnection` and its composite law reads "loading, empty and error".
>
> Kept as the record of what was asked and why. **Prompt 10 is the one still to send.**

# Prompt for Claude Design — round nine: remove offline from the design system

Paste into the **HelioGrid Design System** chat (the design-system project).

*This is a scope change from the owner, not a defect. The design system is otherwise closed.*

---

The product has changed. **HelioGrid no longer has an offline capability.** The app requires a live
connection: no cache, no local-first reads, no sync engine, no queue, no staleness, no conflict
resolution. Losing the connection is an ordinary network error.

The design system still ships the whole vocabulary for a feature that no longer exists, and every
one of the 150 remaining screen sessions loads it. So it has to come out of the package, or it
leaks back in at draw time.

## 1. Delete `OfflineBanner`

Delete `components/feedback/OfflineBanner.jsx`, `.d.ts` and `.prompt.md`. Remove it from
`readme.md`'s index and from the `feedback.card.html` card (it currently renders
`<OfflineBanner count={3} />`). There is no replacement — nothing in the product shows a queued
count any more.

## 2. Remove the `offline` prop from every composite

`Sheet`, `DataTable`, `ChartFrame`, `MapSurface` and `Timeline` each take an `offline` boolean.
Remove it from all of them, along with the strip it renders. `Sheet` in particular renders
`<Banner kind="staleness" syncedAt={syncedAt} />` when `offline` is true — that whole branch goes,
and the `syncedAt` prop with it.

## 3. Remove the staleness half of `Banner`

`BannerKind` currently includes `"staleness"`, `"freshness"` and `"provisional"`. Delete those
three kinds and their entries in `BANNER_KINDS`, plus the `syncedAt` prop and the copy it
generates.

**Keep everything else about `Banner`** — it is a good component and the rest of its family is
untouched: `state`, `review-needed`, `validation`, `suggestion`, `dunning`, `data-integrity`,
`orphan-override`, `below-cost`, `preliminary`, `disclaimer`, `cap`, `bundle`. Keep `BannerStack`,
its precedence ranking and its `single` mode.

Also revisit the `dismissible` rule: it is currently a no-op for `staleness` and `provisional`
because `F4-26` forbade dismissing them. `F4-26` no longer exists. The other protected kinds —
`validation`, `data-integrity`, `below-cost` — keep their rule for their own reasons.

## 4. Delete the "Work offline" demo

`components/forms/forms.card.html` demos a `Switch` labelled `"Work offline"`. Change the label to
anything real from the product — `"Notify me on WhatsApp"` would do.

## 5. Add one component: the offline screen

This is the only thing being **added**, and the brief is deliberately small.

When the device has no connection, the product shows **one shared full-screen state**. Not a state
on every surface — one screen, everywhere, always the same.

The owner's direction, verbatim: *"show them simple offline banner with something great UI like how
Google Chrome show a dinosaur game. keep things very simple initially."*

So: a full-screen surface that says the connection is gone, offers a retry, and **has some charm
in it** — the Chrome dinosaur is the reference for *tone*, not for literally shipping a game. This
is the one place in this system where a little delight is right, because it is the screen a
frustrated surveyor on a roof is staring at. Everything else in the product is a precision
instrument; this is the one that should feel human.

Constraints, and they are few:
- **It does not block anything it doesn't have to.** If the app can still show something, show it.
- **Retry is the primary action**, and it must not lie — if retrying fails, say so plainly rather
  than spinning.
- **No sync vocabulary.** No counts, no "waiting", no "will upload", no last-synced time. The
  product has nothing pending, because it never queues anything.
- The one exception in the whole product is **photographs**, which are held on the device and
  upload when the connection returns. That status lives on the capture screen, not here. This
  screen never mentions it.
- Sentence case, a verb on the button, no emoji, ≥44×44, works at 375 and 1536.

Name it whatever fits the system. `components/feedback/` is the natural home.

## 6. Update `readme.md`

Remove `OfflineBanner` from the index and add the new screen. In the **V2 composite layer** section,
law 1 currently reads *"Every composite ships loading, empty, error and offline states."* It is now
**three** states — loading, empty, error. Law 2 (honesty), law 3 (provenance) and law 4 (own-width)
are unchanged.

## Not in scope

Do not touch tokens, type, elevation, radius, the charts, or anything from rounds 6–8. The contrast
work stands exactly as it is.
