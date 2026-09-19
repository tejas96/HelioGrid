# SCR-M11-04 · Collections Settings

Show the collections account connection state; disconnect or rotate.

**Module:** M11 · **Personas:** EPC Owner only (`F2.M11.connect-gateway` — the same holder set as the credential surface it rides, `M01-60`) · **Context of use:** an occasional administrative act at a desk, web. The credential entry itself is `M01-60`'s surface; this screen shows the connection's **state** — in the same words every surface that depends on it uses (M11 §M11.3 behavior detail: "connecting is a two-screen act at most").

**One job:** see whether the collections account is connected and healthy — and disconnect or rotate it.
**Order of attention:** 1 the connection's state · 2 what that state means for collecting · 3 disconnect, or rotate.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **The product does not claim control it does not have (`M11-23`)** — and it says so in rows at
the act, not in a paragraph of caveats.

| Fact | Kind | Its form here |
|---|---|---|
| The connection's state | status | the screen's ONE chip, in the same words every surface that depends on it uses |
| A healthy connection | data | label–value rows: the account, as the credential surface shows it, and when it was last checked — a recorded time, so it carries no tier |
| The check is failing (`M11-19`) | error | one banner, in place: what failed and what fixes it. Its act leads to the credential surface. There is no "verify later" state that lets it look live |
| Not connected | teaching | at most two short sentences — collecting runs on manual recording and nothing is blocked — and ONE act, connect, which leads to the credential surface |
| Disconnecting (`M11-23`) | action | a confirm whose consequences are three label–value rows, not a paragraph: links already sent stay live on the tenant's own account · new links stop being offered · recorded receipts are unchanged. The product never says it can cancel a link |
| After disconnecting | status | the chip reads not connected, and the same three rows stand as what changed |
| Rotating | action | an act that leads to the credential surface |
| No money figure | — | none is drawn, and nothing says so |
| The screen failed to load | error | one banner — what failed and what to do |

## Arrangement

- **375.** The state region, then the acts.
- **1536.** Honestly the same frame in a settings column with more room. Say so on the board.

## Entry & exit

Reached from: the tenant's settings area alongside the credential surface (`M01-60` — M11 §M11.3 behavior detail), and via the persistent settings nag a failing credential probe raises (`M11-19`). Leads to: not pinned by PRD — designer decides, note the decision. Note: there is no "verify later" state that lets a broken connection look live (M11 §M11.3 behavior detail).

## Requirements (verbatim)

### From `docs/prd/modules/M11-payments-and-collections.md`

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
