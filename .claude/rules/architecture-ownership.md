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

## Make the fact UNSPEAKABLE — do this before reaching for a gate

A gate asks *"did you spell it wrong?"*. A type asks *"can you even say it?"*. Everything that
leaked in the 2026-09-03 measurement leaked because the consumer could simply WRITE the fact — a
number, a string, a role name, a query. So the fix is not a better pattern; it is removing the
consumer's ability to write it.

**The recipe.** The brand symbol is declared in the owner and never exported, so the owner's
constructor is the only way to obtain the type:

```ts
declare const MONEY: unique symbol;                                 // not exported
export type Money = number & { readonly [MONEY]: 'INR' };
export function money(minorUnits: number): Money { … }              // the only door in
```

A consumer then cannot write `total * 1.18`, cannot assign a bare number, cannot add two amounts
by hand — each is a compile error, verified. The same shape brands `TranslatedText` in
`packages/i18n`, so a hardcoded English string is a compile error too.

**Its one hole is a cast.** `x as Money` compiles. That is TypeScript, not a repo defect — and it
is why `as <Brand>` outside the owning package is a defect by CLAUDE.md §8. One exact string to
look for beats infinite ways to write a formula.

**Apply it when the fact is CREATED**, not later: branding a value after five consumers exist is
five rewrites.

## What is mechanically caught, and what is not

Measured 2026-09-03 by injecting each violation and running every gate — not by reading configs.

**Caught:** a wrong-direction import (`boundaries`, dependency-cruiser) · an app `enum` (biome
`noEnum`) · an app exporting a string-literal union, a SCREAMING_CASE lookup or a policy NUMBER
(`check:adherence` 10) · an inline magic number in an app (biome `noMagicNumbers`) · a role-preset
literal outside domain/contracts, and a SQL verb in an app (`check:adherence` 10c) · a brand
obtained by a cast (10b) · a raw `fetch` in an app (biome `noRestrictedGlobals`) · a raw
`process.env` read (`check:env`) · raw colour or spacing in a UI path · a second `Intl` formatter
anywhere (`tests/invariants` format rendering).

**NOT caught — no gate fires, and these are yours to hold:**

| written in the wrong place | belongs in | closes when |
|---|---|---|
| a hardcoded user-visible string | `packages/i18n` | `TranslatedText` lands (`docs/tasks/UI.md`) |
| a business formula in `packages/ui` | `packages/domain` | the gates above are apps-scoped; ui holds legitimate geometry, so scoping it needs the brand instead |
| a flow state machine in a screen | `packages/domain` (Law 11) | the flow's view-model type lands in a shared package first |
| a verbatim copy of another package's function | its owner | — `check:dupes` reports it and exits 0 |
| a formula re-derived under different names | its owner | never — no mechanism reads intent |

**`check:dupes` is a REPORT, not a gate** — it printed 99 clones and exited 0. Never cite it as
proof that duplication is held.

## Minimise blast radius

If something small needs edits across many unrelated files, the architecture is wrong. Say so
before writing the workaround.
