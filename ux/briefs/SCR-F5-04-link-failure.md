# SCR-F5-04 · Link Failure Page

Honest failure rendering of a link that cannot serve: states what happened, names a contact person with number, shows no customer data.

**Module:** F5 (Customer link — the no-login tokenised customer journey) · **Personas:** Customer (an audience, never a role — no login, no account, no app) · **Context of use:** phone, at the moment a bookmark or forwarded link fails — the customer has no other route into the product, so this page is the whole of what they get; it must be readable on a slow connection and in the customer's language.

## Entry & exit

Reached from: any customer link URL that cannot serve — revoked, rate-limited, pointing at a cancelled deal, or (for a legacy pre-ruling token) expired (`F5-25`, `F5-78`). Leads to: nowhere in-product — recovery is out-of-band by design: the named contact's phone number is the route, and the operator re-mint is the recovery path (`F5-25`). No in-page navigation is pinned by the PRD — designer decides, note the decision.

## Requirements (verbatim)

### From `prd/foundations/F5-customer-link.md`

- **F5-25** (P0) — **A link that cannot serve fails honestly and names a person to contact.** Revoked, rate-limited, pointing at a cancelled deal, or (for a legacy pre-ruling token) expired, the page states plainly what has happened, shows the tenant's named contact and their number, and shows **no customer data** — never a blank page, never a raw error, never a silent redirect to nothing. **The expiry gap is closed (owner ruling 2026-08-04, Q34):** links are permanent — view scopes never expire and the post-handover page is the customer's permanent read-only solar file — so the late-returning-bookmark case the source feared no longer produces a dead page; the honest failure page remains for revocation and the other cases, with the operator re-mint as the recovery path.
- **F5-78** (P0) — **Public access is rate-limited, and a customer who meets a ceiling meets an honest page rather than silence.** Ceilings exist per link on viewing and, more tightly, on responding, with a global ceiling on the public surface and backoff behind it; the source's stated figures are the baseline. The ceilings are set so that ordinary reading — a customer showing the proposal to their family across an evening — does not reach one, and a customer who does is told what happened and who to call (`F5-25`), never left with a blank page. _(non-UI half, build-side: per-link view and respond ceilings, global public-route ceiling with backoff, tuned above ordinary reading — for awareness, not for drawing)_

## States

Three base states, then every screen-specific state from the slice and the rows:

- **loading** — the page must never present as a blank page while resolving (`F5-25`: never a blank page, never a raw error, never a silent redirect to nothing).
- **empty** — does not exist as a distinct rendering: this page always carries its full content — what happened, the named contact, the number — and nothing else; it shows no customer data (`F5-25`).
- **error** — this page *is* the honest error surface; a failure of the failure page itself must still never be a raw error or a blank page (`F5-25`).
- **revoked** — the link was revoked by an operator: the page states plainly what has happened, shows the tenant's named contact and their number, and shows no customer data (`F5-25`).
- **rate-limited** — a viewing or responding ceiling was met: the customer is told what happened and who to call, never left with a blank page (`F5-78`, `F5-25`).
- **legacy-token-expired** — a legacy pre-ruling token past its horizon: the honest page with the named contact; the operator re-mint is the recovery path (`F5-25`).
- **deal-cancelled** — the link points at a cancelled deal: the same honest statement and named contact (`F5-25`).

## Data volume

Minimal by law: the page shows **no customer data** (`F5-25`). Its whole content is the plain statement of what happened (one of four causes), the tenant's named contact person and their phone number. Design each of the four cause statements as distinct copy — the customer must learn which thing happened, not a generic "something went wrong".

## Numbers carrying provenance

None. The page shows no customer data, no money, no dates and no figures (`F5-25`). The only number present is the named contact's phone number, which is a contact detail, never translated and not a provenance-carrying figure.
