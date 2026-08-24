# SCR-F5-05 · Customer 3D View

Read-only 3D behind the proposal link's View-in-3D button; tokenised, no login.

**Module:** F5 (Customer link framework; the 3D surface itself is produced by M05 Design Studio) · **Personas:** Customer (an audience, never a role — no login, no account, no app) · **Context of use:** phone, in the evening, inside the one-sitting proposal reading — this is the differentiating moment where the customer sees their own roof; opened from the proposal page, never from a separate URL; slow connections are normal, so the proposal's decisive figures never wait on this view. The scene is light like every other surface — v1 is light-only, with no dark theme and no dark variant of any surface (`foundations/F7`, `F7-04`, P0; the global law sheet `docs/ux/claude-design-context.md` carries it for every session).

## Entry & exit

Reached from: the **"View in 3D"** button on the proposal phase of the customer link (SCR-F5-01) — the customer's 3D view ships inside the proposal link (owner ruling Q27, `M05-55`, `F5-33`); no separate customer-facing 3D URL exists. Leads to: back to the proposal page it opened from (back navigation returns to where the reader came from — `MS9-25`, on the proposal surface). No other exit is pinned by the PRD — designer decides, note the decision.

## Requirements (verbatim)

### From `docs/prd/modules/M05-design-studio.md`

- **M05-55** (P0) — **Chart colours come from the design system's data ramp, never the product accent; the read-only share state hides all edit controls and the share button itself.** The census's original "never brass" phrasing is superseded in premise (that palette is retired); the surviving requirement is data-ramp usage per `foundations/F7`. **The customer's 3D view ships inside the proposal link (owner ruling 2026-08-04, Q27):** the read-only 3D surface renders behind the proposal page's **"View in 3D"** button (`F5-33`) — no separate customer-facing 3D URL exists, and the census's copy-share-link acceptance items are satisfied by the proposal link whose page carries the view; captures/pictures remain the fallback. _(non-UI half, build-side: no separate customer 3D URL, ships inside proposal link; data-ramp chart colours — for awareness, not for drawing)_

### From `docs/prd/modules/M05-studio/05-step6-editor.md`

- **MS6-37** (P0) — Scene surfaces: 3D entry from the layout, customer share link (per Q27 the 3D lives inside the proposal link), read-only share rendering, energy-report trigger, and capture mode for proposal hero shots (`scene3d.38–.42`). _(This screen is the customer-facing half of this row — the read-only share rendering reached from inside the proposal link; the operator-side 3D entry, energy-report trigger and capture mode belong to the studio editor screen.)_

## States

Three base states, then every screen-specific state from the slice and the rows:

- **loading** — the 3D model loading behind the button; nothing load-bearing on the proposal page waits on it (the proposal's figures are already read — `F5-07` on SCR-F5-01), and hydration never presents a blank page (`MS9-15` on the carrying link).
- **empty / captures-fallback** — where the live view cannot serve, captures/pictures remain the fallback (`M05-55`); the customer is never shown a void where the roof should be.
- **error** — a live view that fails to serve falls back to captures/pictures (`M05-55`) rather than a raw error.
- **read-only / read-only-no-edit-no-share** — the read-only share state hides all edit controls and the share button itself (`M05-55`); read-only share rendering (`MS6-37`); every control absent per the carrying proposal page's law (`F5-33`).
- **gated-unapproved-hidden** — an unapproved design never reaches the customer: where no signed-off design exists, this view is not reachable and the proposal page renders without the model (the sign-off gate consumed by the F5 framework; the carrying page's `no-approved-design-indicative` state on SCR-F5-01).

## Data volume

Design at the Definition of Done's realistic volume for a large design — the 221-panel design (`F7-43`), not a demo roof: the full recommended design's model with its panels, roof geometry and obstructions rendered read-only, on a phone-class device over a slow connection (which is why the captures/pictures fallback of `M05-55` exists).

## Numbers carrying provenance

The slice rows put no standalone customer-visible money or energy figure on this view — the figures live on the carrying proposal page (SCR-F5-01), which the reader returns to. Where any chart or figure renders inside the read-only share rendering (`M05-55`, `MS6-37`), it carries its F8 provenance tier in the design like every user-visible number on the customer surface; charts use the design system's data ramp per `M05-55` (a design-system fact restated from the requirement, not new styling guidance).
