# SCR-M03-09 · Campaign Templates

Campaign templates (extending the M01-55 class) with channel binding and per-channel registration state; rejected templates editable and resubmittable with the channel's reason.

**Module:** M03 · Marketing · **Personas:** Marketing and EPC Owner (`F2.M03.author-campaign-content` authors campaign content and campaign templates and submits them for registration — M03 §M03.5 permissions) · **Context of use:** an authoring surface — desktop-first and fully functional on mobile (M03 §2); campaign templates are the tenant's existing message-template content class with two additions this module owns: a channel binding and a registration state.

## Entry & exit

Reached from: not pinned by PRD — designer decides, note the decision (campaign templates extend the tenant's existing message-template settings class, whose settings surface, authoring pattern and per-language rule are `modules/M01`'s). Leads to: a rejected template stays visible with the channel's own reason, can be edited and resubmitted, and every campaign that depends on it says it cannot be scheduled until the template clears (M03 §M03.5 behavior detail); further routing not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### prd/modules/M03-marketing.md

- **M03-39** (P0) — **Where a channel requires a registered template, the campaign uses one and its registration state is visible.** A template carries a per-channel state — `draft` · `submitted` · `approved` · `rejected` (with the channel's reason) — and only an approved template can be scheduled on a channel that requires one. Registration is a third-party approval clock: it **gates activation, not scope** — the capability ships and the channel activates when the clock clears (`F1-38` consumed; the IN DLT instance is pack content and is not restated here). _(non-UI half, build-side: only approved template schedulable; third-party approval clock gates activation, not scope — for awareness, not for drawing)_

## States

- **loading**
- **empty** — no campaign templates authored yet.
- **error**
- **draft** — per-channel template state (`M03-39`).
- **submitted** — registration is a third-party approval clock; the state is visible while it runs (`M03-39`).
- **approved** — only an approved template can be scheduled on a channel that requires one (`M03-39`).
- **rejected-with-reason** — a rejected template is a first-class state, not an error toast: it stays visible with the channel's own reason, it can be edited and resubmitted, and every campaign that depends on it says it cannot be scheduled until the template clears (`M03-39`, M03 §M03.5 behavior detail).
- **edit-of-approved-pending** — an author edits an approved template: the edit re-enters `draft`/`submitted` per the channel's own rules, and the approved version stays usable until the new one clears — a campaign never loses its ability to send because someone started an edit (M03 §M03.5 edge case).

## Data volume

Design at the tenant's template set across every channel that requires registration, with each template carrying a per-channel registration state — and per-language versions, since the underlying content class is authored per language (M03 §M03.5). Language coverage per template is visible to the author (M03 §M03.5 localization notes).

## Numbers carrying provenance

No user-visible counts, money or derived figures are pinned by this screen's PRD row. Any registration timestamp or state-change date shown carries its F8 provenance tier in the design; the channel's rejection reason is the channel's own text, attributed to the channel.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state and a Context-of-use clause stating authoring was online-only (register `Q15`). Both are deleted.*
