# ADR-0016: No feature-flag system — entitlements-only gating, trunk discipline

Date: 2026-07-24

## Context

The product owner issued a binding directive: no feature-flag infrastructure, no dark launches, no flag-strategy documentation. Flag systems accrete permanent conditional debt, and for AI agents every flag doubles the code paths that must be reasoned about — dead branches are exactly the kind of ambient falsehood that misleads an agent reading the code.

## Decision

**No feature flags anywhere.** Features ship enabled when merged; incomplete work does not merge. Trunk discipline replaces flags: small, complete, verifiable slices, each wired into the flows that reach it. **The ONLY runtime gating in the product is billing entitlements** (plan/usage, ADR-0013) — and entitlements are not to be abused as covert flags: an entitlement row maps to a purchasable plan capability, never to a deploy stage.

## Consequences

- One code path per feature; what an agent reads is what runs. No flag-cleanup backlog, no flag-state combinatorics in testing (which matters double given the deliberately thin test net).
- **No kill switch**: a bad feature is rolled back by redeploy, not toggled off. Fly Machines deploys make this minutes, not hours — but it is honest to say incidents lose one mitigation lever.
- **No gradual rollouts or canaries at the app layer**; risk management moves wholly to slice size and pre-merge verification in the running app.
- Large features must be decomposed into independently shippable slices — a forcing function we accept on purpose; work that cannot be sliced waits on a branch, it does not merge dark.
- If a genuine per-tenant operational toggle ever becomes unavoidable (e.g. a tenant-requested integration pause), it is modelled as explicit tenant configuration with product meaning — not a flag framework.

## Alternatives rejected

- **LaunchDarkly / Unleash / Flagsmith** — vendor or self-hosted flag infrastructure for a product that forbids the practice; pure cost.
- **Homegrown flags table** — same debt without the tooling; historically becomes the junk drawer of half-shipped work.
- **Env-var toggles** — flags with worse observability; also banned.

## Sources

- BLUEPRINT.md — Final-review directive 8 (user-confirmed, binding)
- CLAUDE.md — Hard rules: "No feature flags. Features ship enabled when merged; incomplete work doesn't merge."
- `../research/buildplan.md` (trunk-discipline slicing in the roadmap)
