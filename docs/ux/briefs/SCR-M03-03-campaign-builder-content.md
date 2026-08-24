# SCR-M03-03 · Campaign Builder — Content

Channel-shaped content editor: per-language versions, token fallbacks declared at authoring, test send to a nominated recipient.

**Module:** M03 · Marketing · **Personas:** Marketing and EPC Owner (`F2.M03.author-campaign-content` authors campaign content and submits it; in a small firm the Owner *is* the marketing team) · **Context of use:** campaign authoring is desktop-first and fully functional on mobile (M03 §2, `F7-30` posture); the editor's shape follows the channel — "an email editor is not a business-messaging template editor, and the product does not pretend one surface serves both" (M03 §M03.5 behavior detail).

## Entry & exit

Reached from: the audience step (SCR-M03-02), inside the builder flow whose channel was chosen first on the Campaign List (M03 §M03.2 behavior detail). Leads to: the review step (SCR-M03-04). A test send goes out from here to a recipient the author nominates on a connected channel, before scheduling (`M03-15`). Any other exit is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M03-marketing.md

- **M03-15** (P1) — **A test send goes to a person, not to the audience.** Before scheduling, the author sends the composed content to a recipient they nominate on a connected channel, to see exactly what a recipient sees — personalisation tokens resolved against a sample record (`M03-41`). Test sends burn the same meter as real sends (`M03-44`) and say so before they are sent.
- **M03-38** (P0) — **Campaign content is tenant-authored, per language, and the product never translates it.** One stored version per language the tenant uses; authoring is offered per language; nothing is machine-translated, auto-filled from another language, or silently substituted. Where a recipient's language has no authored version, `F3`'s conservative rule governs and the gap is surfaced to the author (register `Q10`, cited — this module does not resolve it and does not invent a different fallback). _(non-UI half, build-side: never machine-translated or auto-substituted; missing-language gap surfaced per F3/Q10 — for awareness, not for drawing)_
- **M03-41** (P0) — **Personalisation tokens resolve or the send does not go.** Content may reference record fields (name, city, the campaign's own link). Every token declares a fallback at authoring time; a token that resolves to nothing at send time uses its fallback, and a token with no fallback that cannot resolve **excludes that recipient from the send** and reports the exclusion — the product never sends a message with a visible broken token. The test send (`M03-15`) resolves tokens against a sample record so the author sees the real thing. _(non-UI half, build-side: send-time token resolution: fallback or exclude recipient, never broken token — for awareness, not for drawing)_

## States

- **loading**
- **empty** — no content authored yet for this campaign.
- **error**
- **per-language-versions** — one stored version per language the tenant uses, authoring offered per language; language coverage per content is visible to the author (`M03-38`, M03 §M03.5 localization notes).
- **missing-language-gap** — a recipient's language has no authored version: the gap is surfaced to the author; nothing is machine-translated, auto-filled or silently substituted (`M03-38`, register `Q10` — the missing version shows the original language with a small note, never silent machine translation, M03 §6).
- **token-missing-fallback** — a token has no declared fallback: every token declares a fallback at authoring time, and the author is confronted with the consequence — a recipient for whom it cannot resolve is excluded from the send and the exclusion reported (`M03-41`).
- **test-send** — the author nominates a recipient on a connected channel; tokens resolve against a sample record so the author sees the real thing; the test send burns the same meter as real sends and says so before it is sent (`M03-15`).

## Data volume

Design at the tenant's full language set: one stored version per language the tenant uses (`M03-38`), with the coverage gap visible per language. Content carries multiple personalisation tokens (name, city, the campaign's own link — `M03-41`), each with its declared fallback.

## Numbers carrying provenance

Each of these renders with its F8 provenance tier in the design:

- The test send's meter burn — test sends burn the same meter as real sends and say so before they are sent (`M03-15`)
- Language-coverage indication (versions authored vs. languages the tenant uses), where shown (`M03-38`)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state and a Context-of-use clause stating authoring was online-only (register `Q15`). Both are deleted.*
