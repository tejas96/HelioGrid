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
| product behaviour | `docs/prd/` |

Compose from `packages/`. If a primitive is missing, **add it there** rather than inlining a copy.

## Make the fact UNSPEAKABLE — before reaching for a gate

A gate asks *"did you spell it wrong?"*. A type asks *"can you even say it?"*. A fact leaks
because the consumer could simply WRITE it — a number, a string, a role name, a query. The fix is
not a better pattern; it is removing the consumer's ability to write it.

The brand symbol is declared in the owner and never exported, so the owner's constructor is the
only way to obtain the type:

```ts
declare const MONEY: unique symbol;                    // not exported
export type Money = number & { readonly [MONEY]: 'INR' };
export function money(minorUnits: number): Money { … } // the only door in
```

A consumer then cannot write `total * 1.18`, cannot assign a bare number, cannot add two amounts
by hand. Its one hole is a cast, which is why `as <Brand>` outside the owner is a defect
(`CLAUDE.md` §8) — one exact string to look for beats infinite ways to write a formula.

**Apply it when the fact is CREATED**, not later: branding a value after five consumers exist is
five rewrites. Register each brand the day it lands; `M60` says where.

## What is watching, and what is not

`docs/engineering/mechanisms.md` is the answer, per rule, with its status. Read it before
trusting one. The short version: imports and shapes are held; a fact WRITTEN in the wrong place
mostly is not.

## Minimise blast radius

If something small needs edits across many unrelated files, the architecture is wrong. Say so
before writing the workaround.
