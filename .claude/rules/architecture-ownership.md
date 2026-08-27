---
paths:
  - "apps/**/*.{ts,tsx}"
  - "packages/**/*.{ts,tsx}"
---

# Where a new file, type, constant or helper belongs

**Run `docs/engineering/architecture.md` §4 before creating any of them.** It names the owning
package. §2 says what each package may hold and import; §3 what is web-only, RN-only or shared.

## Never duplicate a definition

A fact both platforms need lives in a package **before** either screen uses it.

| the fact | its home |
|---|---|
| enums, wire shapes, string-literal unions | `packages/contracts` |
| logic, policy numbers, formatters, money maths | `packages/domain` |
| visual values — colour, spacing, radius, type | `packages/theme` |
| schema | `packages/db/migrations` |
| user-visible copy | `packages/i18n` |
| product behaviour | `docs/prd/` — never a doc under `docs/` |

Compose from `packages/`. If a primitive is missing, **add it there** rather than inlining a copy.

## What is mechanically caught, and what is not

Caught: biome `noEnum` bans a TS `enum` in an app · `check:adherence` #10 bans an app **exporting**
a string-literal union or a SCREAMING_CASE lookup · `boundaries` and dependency-cruiser hold the
import graph · `check:dupes` finds clones of 12+ lines.

**Not caught, and yours to hold:** a single duplicated scalar (`const GST = 0.18`), a re-derived
formula, a re-typed shape that differs by one field. These are the ones that drift.

## Minimise blast radius

If something small needs edits across many unrelated files, the architecture is wrong. Say so
before writing the workaround.
