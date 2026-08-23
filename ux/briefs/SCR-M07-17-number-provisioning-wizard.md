# SCR-M07-17 · Number Provisioning Wizard

Choose instant platform number or BYO inbound forwarding, with honest status and series explainer.

**Module:** M07 · Sales Execution · **Personas:** EPC Owner (rides `F2.M01.manage-tenant-settings`, §M07.10 permissions) · **Context of use:** web emphasis for setup; a settings surface (listed by `M01-57`; behaviour here — §M07.10 behavior detail).

## Entry & exit

Reached from: voice settings — "Given a new tenant, when they open voice settings, then a platform number is available instantly as the default choice" (§M07.10 acceptance); the settings placement is `M01-57`'s surface list. Leads to: not pinned by PRD — designer decides, note the decision. Number-provisioning status notifications register with `foundations/F6` (§M07.10 behavior detail), so status changes reach the owner outside this screen.

## Requirements (verbatim)

### prd/modules/M07-sales-execution.md

- **M07-51** (P0) — **Every tenant gets a platform-provisioned number by default — instant, and the only outbound origin.** Choosing it is the provisioning wizard's default path.
- **M07-52** (P0) — **Bring-your-own number means inbound forwarding only: the tenant's existing number forwards to their platform number; outbound caller identity remains the platform number. Outbound CLI is NOT portable, and product copy must say "forwarding."** The wizard tracks status — requested · verifying · active · failed — with honest lead-time copy. The superseded "hosted/ported with KYC" definition is not implemented, anywhere. _(non-UI half, build-side: BYO is inbound forwarding only; outbound CLI never portable — for awareness, not for drawing)_
- **M07-53** (P0) — **The wizard explains number-series routing in one line, honestly** — which series the tenant's outbound and inbound traffic uses, and why. The series rules and their content are the market pack's (`F1-37` consumed); the wizard renders that key's explanation and this module restates none of its data.

## States

- **Loading** (base) — the wizard while it fetches current provisioning state.
- **Empty** (base) — a new tenant with nothing provisioned: the platform number is offered instantly as the default choice (M07-51).
- **Error** (base) — provisioning failure acknowledged honestly; the platform number keeps working throughout — "provisioning never takes the tenant's voice offline" (§M07.10 edge case).
- **platform-instant-default** — the default path: platform-provisioned number, instant, and the only outbound origin (M07-51).
- **byo-requested** — BYO forwarding requested; copy says "forwarding", with honest lead-time copy (M07-52).
- **verifying** — BYO status verifying (M07-52's status vocabulary).
- **active** — BYO forwarding active: the tenant's existing number forwards in; outbound caller identity remains the platform number, "with the wizard having said exactly that in advance" (§M07.10 acceptance).
- **failed-with-retry** — "status shows failed with the reason and a retry; the platform number keeps working throughout" (§M07.10 edge case).
- **series-explainer** — the one-line honest number-series routing explanation, rendering the market pack's key (M07-53).

## Data volume

One decision and one status: a two-path choice (platform default vs BYO forwarding), a four-value status (requested · verifying · active · failed), the one-line series explainer, and a plain statement of which number outbound calls will present — "always the platform number, stated plainly so no tenant expects their own number on outbound caller ID" (§M07.10 behavior detail).

## Numbers carrying provenance

- The platform number and the tenant's BYO number — identity data, not provenance-tiered figures.
- BYO lead-time copy — honest stated expectation, copy the product owns (M07-52); never a promised date computed from nothing.
- Status timestamps (requested/verifying/active/failed transitions) — recorded system facts.
- No money figures appear on this screen.
