# SCR-M03-08 · Channel Health

One surface answering "can we reach our customers right now": connection state, registration state, remaining allowance, dependent campaigns, capture-failure log.

**Module:** M03 · Marketing · **Personas:** Marketing (checks it before scheduling anything), EPC Owner (checks it when something looks wrong) (`M03-29`) · **Context of use:** a monitoring surface — mobile-first posture, read at a glance before a scheduling decision or during an incident (M03 §2).

## Entry & exit

Reached from: the PRD pins its role, not its route — it is the surface the Marketing persona checks before scheduling anything and the EPC Owner checks when something looks wrong (`M03-29`); navigation not pinned by PRD — designer decides, note the decision. Leads to: the campaigns currently depending on each channel (`M03-29`) and the capture-failure log entries per campaign and channel (`M03-36`); destinations not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### prd/modules/M03-marketing.md

- **M03-29** (P1) — **One channel-health surface answers "can we reach our customers right now?"** Every channel with its connection state, its registration state where the pack requires one, its remaining metered allowance (`M03-44`), and the campaigns currently depending on it. It is the surface the Marketing persona checks before scheduling anything and the EPC Owner checks when something looks wrong.
- **M03-36** (P0) — **Capture never silently fails.** A channel-side submission the product cannot turn into a lead — malformed payload, missing every usable field, a channel delivering after its connection was removed — is recorded in a capture-failure log on the campaign and the channel, with what arrived and why it could not be used, and is surfaced on the channel-health surface (`M03-29`). The product does not report a capture count it did not achieve, and does not drop an enquiry without a trace. _(non-UI half, build-side: capture-failure log records what arrived and why unusable — for awareness, not for drawing)_
- **M03-52** (P1) — **A meter whose book value is not yet sellable cannot be sold, and the module says so rather than defaulting.** `BM-21`'s per-channel bundles and overage rates now carry the owner's **draft** values in the India book (owner ruling 2026-08-04, Q1: Starter 500 / Growth 2,000 / Pro 10,000 sends/mo; overage ≈ WhatsApp ₹1.5 · SMS ₹0.35 · email ₹0.10) — **draft pending rate-card verification** (`BM-17`/`BM-26`), and `04-business-model.md` fixes the behaviour: a draft rate is never silently treated as launch-final, and the meter is not sellable until its rate card verifies. This module surfaces that state honestly on the channel-health surface: the channel connects, and metered selling in that market waits on the verification. _(non-UI half, build-side: draft rate-card values never treated launch-final; metered selling waits verification — for awareness, not for drawing)_

## States

- **loading**
- **empty** — no channels connected yet; the answer to "can we reach our customers right now?" is an honest no, with connection as the path.
- **error**
- **all-healthy** — every channel with its connection state, its registration state where the pack requires one, its remaining metered allowance, and the campaigns currently depending on it (`M03-29`).
- **action-needed** — one or more channels in `action needed`; the surface answers what is wrong and which campaigns depend on the affected channel (`M03-29`).
- **registration-pending** — a channel whose pack-required registration has not cleared shows that registration state; the clock is the channel's, not ours.
- **capture-failures-present** — the capture-failure log is surfaced here: what arrived and why it could not be used, per campaign and channel; no enquiry dropped without a trace (`M03-36`).
- **awaiting-rate-card-verification** — the channel connects, and metered selling in that market waits on rate-card verification; a draft rate is never silently treated as launch-final (`M03-52`).

## Data volume

Design at the module's full channel set (email, business messaging, SMS, social identities, website form, plus inbound voice as `modules/M07`'s live channel — M03 §1, §M03.3), each row carrying connection state, registration state, remaining allowance and dependent campaigns (`M03-29`); allowances at bundle scale (draft India book: Starter 500 / Growth 2,000 / Pro 10,000 sends/mo, `M03-52`); a capture-failure log with enough entries to need scanning.

## Numbers carrying provenance

Each of these renders with its F8 provenance tier in the design:

- Remaining metered allowance per channel (`M03-29`)
- The campaigns currently depending on each channel (`M03-29`)
- Capture-failure entries — what arrived and why it could not be used; the product does not report a capture count it did not achieve (`M03-36`)
- The awaiting-rate-card-verification state on metered selling — no draft bundle size or overage rate is ever presented as final (`M03-52`)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state and a Context-of-use clause claiming no offline capability (register `Q15`). Both are deleted. Channel connection state is untouched.*
