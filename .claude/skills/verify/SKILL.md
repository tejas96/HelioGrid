---
name: verify
description: Run end-to-end QA after development — derive the blast radius, plan four quadrants, drive only the affected surfaces via subagents, check parity, triage and loop until clean. Use before calling any work done.
---

# `/verify` — plan here, execute in agents, loop until clean

Green gates prove the code compiles and the boundaries hold. They never prove a screen works.

Everything this run produces lives in the session scratchpad and is DELETED when it finishes.
The durable record is the `## Verification` section `/finish` puts in the PR.

## 1. Blast radius

`git diff --name-only` plus `--cached` (work here is often uncommitted). Map paths → surfaces:

| Changed path | Surfaces |
|---|---|
| `apps/web/**` | web |
| `apps/mobile/**` | ios, android |
| `apps/api/**`, `apps/worker/**`, `packages/db/**` | api |
| `packages/contracts/**` | api + every consuming surface |
| `packages/data/**` | web, ios, android — it is the ONE data path |
| `packages/ui/**`, `packages/tokens/**` | web (+ mobile if the RN mirror moved) |
| `packages/domain/**`, `packages/i18n/**`, `packages/forms/**` | web, ios, android |

For a shared-code path, **grep the actual consumers** — the symbol may be imported somewhere
the table does not predict.

**Only surfaces in the blast radius get an agent.** A web-only change runs ONE agent, not
four. A diff touching only docs, plans or governance ends here: report "no runnable surface",
which is a complete result, not a skip.

## 2. Plan — four quadrants, no empty cells

Walk `references/test-matrix.md` and author the step list in the scratchpad. Every surface in
the radius gets steps in all four quadrants (happy · edge · negative · adversarial). Count
steps per (surface × quadrant) before dispatching; **a zero cell aborts the run naming the
gap.** Small is fine; lopsided is not.

Each step: `{id, surface, quadrant, actions[], expected, severity_if_failed}`. `expected` must
be a literal string comparison — if it cannot be written as one, it is not yet a step.

**Severity is decided HERE, never by an executor.** Money, tenancy or provenance → `blocker`.

Always-on core regardless of radius: a cross-tenant read returns 404 · money reconciles to
the currency's minor unit · an unauthenticated request to a protected route is rejected.

## 3. Execute

Dispatch one agent per surface in the radius — `qa-web`, `qa-mobile`, `qa-api` — each with
only its own steps. Several surfaces → dispatch in ONE message so they run concurrently; they
share no state. Order each surface's steps so state flows; relaunch only where a cold start
IS the test.

A surface returning nothing, unparseable output, or dying is `inconclusive` — never a pass,
and never the whole run.

## 4. Check the reports before believing them

1. Every `pass` carries an `observed` value and evidence. **A pass without evidence becomes
   `inconclusive`.**
2. Read every failure in full.
3. Spot-check every `blocker` step plus two others against their evidence.
4. **A spot-check that contradicts the report makes the whole run untrusted** — re-run it, do
   not quietly correct one row.

## 5. Parity — only when drift is possible

Run `qa-parity` ONLY when the diff touches a shared package or both app trees. A
single-platform change skips it; say so in the report rather than running it for form.

Pass it the feature's web and mobile paths plus every observed value the surface agents
recorded for the same quantity. A value mismatch is a **blocker** — a platform re-implemented
something that was supposed to be imported (Law 11).

## 6. Triage

- **bug** — fix it.
- **product-question** — a missing business rule or spec ambiguity. **Never invent a
  requirement:** record it in `docs/13` or `docs/15` and ask the owner. Does not block a clean
  run.
- **false-positive** — justify with evidence. Not waved off.
- **environment** — emulator down, server down. Fix and re-run; does not consume a round.

Present findings with root causes before fixing anything. Fixes are yours, in the normal edit
flow — the QA agents never edit source.

## 7. Fix and re-run

Each round re-runs the failed steps **plus a fresh blast radius for the code the fix touched**,
so a fix that breaks something adjacent is caught in the same round. A clean round ends the
loop.

The full re-run in fresh context — the certify pass — is **opt-in**: offer it, run it when the
owner asks or the change touches money, tenancy or auth. It doubles the cost, and the previous
system mandated it then skipped it under pressure, which is worse than never promising it.

**Hard stop after three fix rounds** — escalate rather than grinding. **Never edit the plan to
make a failure disappear.**

## 8. Clean up, then report

Delete the run's scratchpad files. Stop every process this run started — dev server
(`preview_stop`), Metro, any emulator you booted; leave what was already running. Confirm
`git status --short` shows nothing from the run.

Then emit the `## Verification` section for `/finish`: per-surface verdict counts, every
failure with its observed value, every parity comparison with both values, and any surface
recorded `inconclusive` with the reason. **Specifics, not adjectives** — "browser 375+1440
happy / wrong-code paths; curl 409 returns ALREADY_ONBOARDED", never "verified working". A
surface that could not run is stated plainly, never omitted so the silence implies a pass.
