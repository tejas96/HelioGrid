# SCR-M11-04 · Collections Settings

Show the collections account connection state; disconnect or rotate.

**Module:** M11 · **Personas:** EPC Owner only (`F2.M11.connect-gateway` — the same holder set as the credential surface it rides, `M01-60`) · **Context of use:** an occasional administrative act at a desk, web. The credential entry itself is `M01-60`'s surface; this screen shows the connection's **state** — in the same words every surface that depends on it uses (M11 §M11.3 behavior detail: "connecting is a two-screen act at most").

## Entry & exit

Reached from: the tenant's settings area alongside the credential surface (`M01-60` — M11 §M11.3 behavior detail), and via the persistent settings nag a failing credential probe raises (`M11-19`). Leads to: not pinned by PRD — designer decides, note the decision. Note: there is no "verify later" state that lets a broken connection look live (M11 §M11.3 behavior detail).

## Requirements (verbatim)

### From `prd/modules/M11-payments-and-collections.md`

- **M11-19** (P0) — **A failing connection is loud, never silent.** Credentials are probed on a schedule; an invalid, expired or revoked credential raises an alert and a persistent settings nag, and — the part that belongs to this module — **every collections surface states the failure in place and offers the manual path**, rather than presenting a broken link action or failing blind at the moment someone is trying to collect. _(non-UI half, build-side: scheduled credential probe raises alert and settings nag (probe is M01-60's) — for awareness, not for drawing)_
- **M11-23** (P1) — **Disconnecting is an act with honest consequences, and the product does not claim control it does not have.** A tenant may disconnect or rotate at any time; the act is recorded and audited. Links already minted live on the **tenant's own** account and their fate is that account's — the product says exactly that rather than implying it can revoke them, and it stops offering to mint new ones immediately. Every already-recorded receipt stays exactly where it is. _(non-UI half, build-side: disconnect recorded and audited; no revocation ability claimed over minted links — for awareness, not for drawing)_

## States

- **Loading** (base).
- **Empty** (base) — coincides with not-connected: no collections account has been connected; collections run entirely on manual recording and nothing is blocked.
- **Error** (base).
- **Connected-healthy** — connected and passing its probe.
- **Connected-probe-failing-nag** — an invalid, expired or revoked credential: the alert and the persistent settings nag land here; the failure is stated in place, never silent (`M11-19`).
- **Not-connected** — the state shown before any account is connected, and again after a disconnect.
- **Disconnected-honest-consequences** — after disconnecting: the state is "not connected", link-minting is no longer offered, existing receipts are intact, and the copy about already-minted links makes no claim of revocation — their fate is the tenant's own account's (`M11-23`).

## Data volume

One connection record for the tenant: its state (connected and healthy · connected but failing its probe · not connected), stated in the same words on every surface that depends on it. No lists, no ledger — the states above are the volume.

## Numbers carrying provenance

No money figure renders on this screen — the slice rows pin none. (Credential display, where it appears, is `M01-60`'s surface and shows at most the last four characters; nothing here shows an amount, and any number this screen does end up showing carries its F8 provenance tier in the design.)
