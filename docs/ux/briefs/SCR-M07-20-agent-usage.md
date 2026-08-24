# SCR-M07-20 · Agent Usage

Calls made and minutes used this period, reading the real usage ledger.

**Module:** M07 · Sales Execution (working surface; M13 renders it among the agent dashboard's supporting views; the tenant-wide usage screen is M12's) · **Personas:** EPC Owner · **Context of use:** web emphasis for performance reading, mobile for the daily glance; money-adjacent and read from the billed ledger, so honesty is the whole point (`docs/prd/modules/M07-sales-execution.md` §2, §M07.11).

## Entry & exit

Reached from: the agent-performance dashboard's supporting views — "usage (`M07-59` — the same numbers as billed, entitlement data from M12)" (M13-43, SCR-M07-18). Other entries are not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-59** (P0) — **The usage view shows calls made and minutes used this period, reading the real usage ledger — the same numbers as billed.** Whether a cap applies is entitlement data (`modules/M12`); the deferred-era "no plan cap by design" claim is superseded and appears nowhere.

### docs/prd/modules/M13-dashboards-and-reporting.md

- **M13-43** (P0) — **The supporting views render here as they are specified there:** the call log (`M07-57`), unanswered questions (`M07-58` — "where the dashboard turns into improvement"), usage (`M07-59` — the same numbers as billed, entitlement data from M12), and the per-rep view (`M07-60` — Sales Manager's and EPC Owner's only, per `F2.M07.agent-performance`).

## States

- **Loading** (base) — the period figures while they fetch.
- **Empty** (base / slice `empty`) — no usage this period (agent off or no calls); must read as genuine zero from the ledger, never a broken screen.
- **Error** (base) — fetch failure acknowledged honestly — this screen must never show a number it cannot vouch for.
- **normal** — calls made and minutes used this period, read from the real usage ledger — the same numbers as billed (M07-59); whether a cap applies is entitlement data from M12.
- **over-allowance** — allowance exhausted: the owner "sees why on the usage surface" when AI-inbound falls back per tenant config, and blocked queue entries are marked with the owner notified (§M07.9 edge case citing M07-59; M07-37's allowance law renders on the queue).

## Data volume

Two headline figures per period — calls made and minutes used — read from the real usage ledger, plus the entitlement context (whether a cap applies) from M12. No list of any pinned length; the weight of the screen is the trustworthiness of two numbers.

## Numbers carrying provenance

- **Calls made this period** — read from the real usage ledger, the same numbers as billed (M07-59): billed-ledger provenance, never recomputed on this screen.
- **Minutes used this period** — same ledger, same rule: identical to the invoice for the same period (§M07.11 acceptance: "Given the usage view and the invoice for the same period, then the minutes shown are the same numbers").
- Cap/allowance figure where one applies — entitlement data owned by `modules/M12`, rendered, never restated or invented here (M07-59).
