# SCR-M06-20 · Deal Link Manager

Tenant-side surface on the deal listing named links with labels, contacts, open history and state; mint, label, re-mint and revoke actions (drawn by M06).

**Module:** M06 draws the screen; `foundations/F5` fixes what it must show (`F5-30`: "The screens are `modules/M06`'s share and deal surfaces; this document fixes what they must show") · **Personas:** EPC Owner, Sales Manager, Sales Executive (minting/labelling/re-minting ride `F2.F5.mint-customer-link`, revocation `F2.F5.revoke-customer-link`; reading rides the reader's existing lead or project scope — F5 §F5.4 permissions) · **Context of use:** operator working a deal at desk or on phone; in a C&I deal several stakeholders each hold a named link and who-opened matters commercially.

## Entry & exit

Reached from: the deal — the PRD pins it as "a tenant-side surface on the deal" (`F5-30`; `UXG-11`: "link manager on the deal"). Leads to: not pinned by PRD — designer decides, note the decision (the acts available here are mint, label, re-mint and revoke; the customer-facing challenge sheet is on the customer's page, never here, and the customer link itself is `foundations/F5`'s surface, SCR-F5-01).

## Requirements (verbatim)

### From `docs/prd/foundations/F5-customer-link.md`

- **F5-30** (P0) — **Link management is a tenant-side surface on the deal, and the customer-facing challenge surface is on the customer's page.** The operator sees the deal's links with their labels, their contacts, their open history and their state, and can mint, label, re-mint and revoke from there; the customer meets only the challenge sheet, and only at acceptance. The screens are `modules/M06`'s share and deal surfaces; this document fixes what they must show and what the customer must never be shown (the other contacts' links, labels or open history). _(non-UI half, build-side: customer page never shows other contacts' links, labels or open history; challenge sheet appears only at acceptance — for awareness, not for drawing)_

## States

- **loading** — the deal's links and their histories loading.
- **empty** — a deal with no links minted yet (nothing has been shared).
- **error** — a failed load or a failed mint/re-mint/revoke act stated plainly.
- **normal** — the deal's links with their labels, their contacts, their open history and their state; mint, label, re-mint and revoke available.
- **link-revoked** — a revoked link's state shown; revoking one named link never affects another link on the same deal (F5 §F5.4 context).
- **open-history** — the per-link open history: who opened, attributed to the link and its contact.
- **unattributed-open** — an open on a link minted without a contact — an operational signal, not a failure (F5 §F5.4 analytics note).
- **sent-on-connected-channel** — the message carrying this link went out from the tenant's connected transactional channel: that channel's delivery state reads alongside the link's own record state, as the channel reports it and no further (`F5-28` reconciled, `M03-03`, owner ruling 2026-08-04 Q33).
- **fallback-share-no-delivery-state** — the link was copied for a person to send: the row carries its label, contact, open history and record state and **no delivery state at all**; the absence is a property of that path only, never generalized to a link the product's own channel sent (`F5-28`).

## Data volume

A C&I deal with several labelled links, each addressed to one contact, each carrying its own open history (a link opened many times in a short window is normal reading — a customer showing their family, per F5 §F5.4's edge cases); a residential deal with one named link must feel no heavier for the simple case.

## Numbers carrying provenance

- **Open moments per link** — the product's own evidence: an open is the link, the moment and a device class only (F5's open-event law); shown as tracked, attributed to the link and its contact.
- **Link states** — record facts (active / revoked).
- **Delivery state, scoped — never generalized from the fallback** (`F5-28` as reconciled by owner ruling 2026-08-04, Q33; `M03-03`): where the tenant's connected transactional channel sent the message carrying a link, that channel's own delivery state renders with the link, exactly as the channel reports it and no further; on the copy-paste fallback path — a person sent from their own device — **no delivery state exists here or anywhere**, because the product did not do the sending. Opens remain the product's own evidence on both paths.
- No money figures appear on this surface.
