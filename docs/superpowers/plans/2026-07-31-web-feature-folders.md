# Web Feature-Folder Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/web/app/**/page.tsx` becomes a thin controller (≤50 lines) that renders a screen from a feature folder; every component, hook and stylesheet for a capability lives together under `apps/web/features/<feature>/`.

**Architecture:** `app/` becomes Next.js ROUTING ONLY — a page reads route params, calls one controller hook, renders one screen component. `features/<feature>/` owns the capability: screens, sub-components, controller hooks, and CSS, exposed through a single `index.ts` barrel that is the only thing `app/` may import. A feature maps 1:1 to a module in `docs/modules/` wherever one exists, which keeps Law 6 traceability intact.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.8, Biome, dependency-cruiser, Turborepo Boundaries.

## Global Constraints

- **NO NEW SCRIPTS. A lint rule or a written instruction, never a bash/node checker.**
  A script encodes today's tree shape and rots the moment the tree changes — this repo has
  already lost time to a `PRUNE` array that expanded to garbage, a zsh glob that aborted a
  command so grep printed nothing, and `grep -v $SKIP` filtering nothing because zsh does not
  word-split. A Biome rule is versioned with the toolchain, understands the AST rather than
  the text, and reports at the exact line. Order of preference, always:
  **(1) a type that makes the mistake uncompilable → (2) a lint rule → (3) an instruction in
  the owning CLAUDE.md, reviewed → (4) a script, only with an owner ruling saying why 1–3
  cannot hold it.**
- **NO UNIT TESTS.** Never create a `.test.*` or `.spec.*` file — a PreToolUse hook blocks it and `pnpm check:adherence` fails the build. Verification is: the gate goes red on a violation and green after, plus the app RUNNING in the browser (`/verify-app`).
- **Edit/Write tools for all file changes.** In-place stream edits (`sed -i`, `perl -pi`, `xargs sed -i`) are blocked by `.claude/hooks/bash-guard.sh`.
- **Files ≲450 lines, split by RESPONSIBILITY** — never `*-part2`, `*2`, `*-extra`.
- **Presentation and logic in different files** (`.claude/rules/ui-adherence.md`).
- **No raw colour values** in UI paths — tokens only. `pnpm check:adherence` enforces hex, `rgb()`, `hsl()` and named colours.
- **User-visible copy goes through Lingui** (`<Trans id="…">` / `i18n._()`). Moving a file must not change a msgid — the CI extract guard diffs the catalogs.
- **Git is manual.** Commit only when the user asks. Never push, never open a PR.
- **`pnpm verify` must be green at the end of every task** (lint · boundaries · typecheck · test · build).

## Decisions taken in this plan

1. **A feature folder is named for the MODULE that owns it** (`docs/modules/<module>.md`). `auth` covers login, signup, onboarding. `home` is its own feature because it becomes the CRM My Day surface. `design-reference` covers `/design` and `/design/gallery` — a developer surface, but it gets a feature folder like everything else, because a rule with an exemption list rots.
2. **Migrate the existing screens now, even though auth is being rebuilt** (auth-tenancy ruling 6). The move is mechanical — cut, paste, fix imports — not a rewrite, and it is what lets the 50-line gate be switched ON. A gate that cannot be enabled is not a gate, and the rebuild then lands directly in the correct shape instead of re-establishing the old one.
3. **`lib/` is unchanged.** `api-client.ts`, `auth-client.ts` and `env.ts` are app-wide infrastructure, not a capability. `apps/web/CLAUDE.md` already fixes that list.
4. **Mobile is NOT changed by this plan.** The user scoped this to web, and RN has no router-driven `app/` directory — `src/screens/<name>/` is already the equivalent shape. Task 8 records that asymmetry so the next agent does not "fix" one to match the other.

## Target file structure

```
apps/web/
  app/                        Next.js ROUTING ONLY
    layout.tsx                unchanged (Next reserved)
    providers.tsx             unchanged (Next reserved)
    globals.css               the ONLY css under app/
    page.tsx                  redirect stub (9 lines, already compliant)
    login/page.tsx            ≤50 — renders <LoginScreen/>
    signup/page.tsx           ≤50
    onboarding/page.tsx       ≤50
    home/page.tsx             ≤50
    design/page.tsx           ≤50
    design/gallery/page.tsx   ≤50
  features/
    auth/
      index.ts                  the ONLY import surface for app/
      login/
        LoginScreen.tsx         the screen — composition only
        constants.ts            RESEND_SECONDS, AUTO_VERIFY_DELAY_MS, …
        types.ts                Step, OtpFailure, LoginViewModel
        components/             one file per sub-component
          PhoneStep.tsx
          OtpStep.tsx
          DoneStep.tsx
          OtpErrorRow.tsx
          index.ts              barrel for the folder
        hooks/
          use-login.ts          the controller
          use-resend-countdown.ts
        login.css
      signup/
        SignupScreen.tsx
        signup.css              (no components/ or hooks/ yet — see the growth rule)
      onboarding/
        OnboardingScreen.tsx
        constants.ts            SEGMENTS — Record<TenantSegment, …>, never an as-const array
        components/
          SegmentPicker.tsx
          CapacityField.tsx
          index.ts
        hooks/
          use-onboarding.ts
        onboarding.css
      shared/                   auth-wide, used by two or more of its screens
        hooks/use-online.ts
    home/
      index.ts
      HomeScreen.tsx
      components/…
      hooks/use-home.ts
      home.css
    design-reference/
      index.ts
      DesignScreen.tsx
      components/               the token tables, split by responsibility
        ColorTokens.tsx
        TypographyTokens.tsx
        MotionTokens.tsx
        index.ts
      design.css
      gallery/
        GalleryScreen.tsx
        components/…            the six existing section files, moved verbatim
  lib/                          UNCHANGED
```

### The growth rule — when a subfolder appears

Structure follows need; it is not scaffolded up front. Empty `components/` and `hooks/`
folders are noise that trains people to ignore the shape.

| In a screen folder | Put it in |
|---|---|
| 1 sub-component | `components/<Name>.tsx` — a folder from the first one, so the second needs no move |
| 2+ sub-components | same, plus `components/index.ts` barrel |
| the controller hook | `hooks/use-<screen>.ts` — always, even when it is the only hook |
| a second hook | same folder |
| any literal the screen configures itself with | `constants.ts` |
| a type used by more than one file in the screen | `types.ts` |
| something two SCREENS in the feature share | `features/<feature>/shared/` |
| something two FEATURES share | it is not feature-local — `packages/ui` (visual), `packages/domain` (logic) or `apps/web/lib` (app infrastructure) |

`components/` and `hooks/` are folders from the FIRST file, never a flat `components.tsx` that
later needs splitting. `≲450 lines, split by RESPONSIBILITY` still applies inside a feature —
`OtpStep.tsx`, never `login-part2.tsx`.

---

### Task 1: ADR-0022 — record the pattern before any code moves

Law 2: a new folder category needs an approved ADR *before* implementation. `features/` is a new
category, so this task exists and must land first.

**Files:**
- Create: `docs/adr/0022-web-feature-folders.md`
- Modify: `docs/adr/README.md` (index table)

**Interfaces:**
- Consumes: nothing.
- Produces: the authority every later task cites. Tasks 2–8 reference `ADR-0022`.

- [ ] **Step 1: Read the ADR format rules**

Read `docs/adr/README.md`. Required sections, in order: `# ADR-NNNN: title` / `Status:` /
`Date:` / `## Context` (2–4 sentences) / `## Decision` (decisive — one recommendation) /
`## Consequences` (honest, including negatives) / `## Alternatives rejected` / `## Sources`.

- [ ] **Step 2: Write the ADR**

Create `docs/adr/0022-web-feature-folders.md`:

```markdown
# ADR-0022: apps/web feature folders — pages route, features own the capability

**Status:** Accepted (owner request 2026-07-31)
**Date:** 2026-07-31

## Context

`apps/web/CLAUDE.md` prescribed ONE FOLDER PER ROUTE: `app/<route>/` held `page.tsx` plus
`styles.css`, `components.tsx`, `hooks.ts` and `constants.ts` satellites. Under it
`app/login/page.tsx` reached 388 lines carrying a state machine, four sub-components, timers
and transport error handling in one file, and `app/design/page.tsx` reached 317. Nothing
capped page size, so the shape degraded silently. It also scattered one capability across
route folders: auth spans login, signup and onboarding, which under a route layout can share
nothing without a satellite that belongs to neither.

## Decision

`app/` is Next.js ROUTING ONLY. A `page.tsx` is a controller of **at most 50 lines**: it reads
route params, calls one controller hook, and renders one screen component. Everything else —
screens, sub-components, hooks, CSS — lives in `apps/web/features/<feature>/`, exposed through
a single `index.ts` barrel that is the only path `app/` may import.

A feature is named for the MODULE that owns it (`docs/modules/<module>.md`), which keeps Law 6
traceability intact and makes "where does this go?" answerable without judgement.

`lib/` is unchanged: `api-client.ts`, `auth-client.ts`, `env.ts` are app-wide infrastructure,
not a capability.

## Consequences

- The 50-line cap is mechanical — Biome `noExcessiveLinesPerFunction` (maxLines 50) scoped to
  `apps/web/app/**/page.tsx`, added by this plan's Task 6 — so the shape cannot degrade
  silently the way the previous convention did. A lint rule rather than a line-counting script
  is a standing preference (owner directive 2026-07-31): it measures the function BODY, so
  imports and comments do not eat the budget, and it is versioned with the toolchain.
- A capability's files change together and now live together; auth's three screens can share
  `features/auth/shared/` without a satellite that belongs to no route.
- One more indirection: a reader following a route now opens two files instead of one. Accepted
  — it is the same trade the container/presentational split already makes, and 388 lines in a
  route folder was not actually one file's worth of reading.
- **apps/mobile is deliberately NOT changed.** RN has no router-driven `app/` directory;
  `src/screens/<name>/` is already the equivalent shape. The asymmetry is intentional, not
  drift; this plan's Task 7 records it in both CLAUDE.md files so a later agent does not
  "align" one to the other.
- Migration touches screens the auth rebuild (auth-tenancy ruling 6) will replace. Accepted:
  the move is mechanical, and it is what allows the cap to be enabled before the rebuild lands
  rather than after.

## Alternatives rejected

- **Keep route folders, add a line cap.** Caps the symptom, leaves auth scattered across three
  route folders with nowhere shared to put `use-online.ts`.
- **`src/features/` next to `app/`.** Next.js already treats `app/` as special; a sibling
  `features/` under `apps/web/` is one fewer level and matches how `lib/` already sits.
- **Feature-per-route (`features/login`, `features/signup`).** Reproduces the scattering this
  ADR exists to remove — auth's three screens share state shape and copy.

## Sources

- Owner request, 2026-07-31 (this session).
- `apps/web/CLAUDE.md` (the superseded convention), `docs/17-engineering-governance.md` §5.
- Measured: `app/login/page.tsx` 388 lines, `app/design/page.tsx` 317 lines, 2026-07-31.
```

- [ ] **Step 3: Add it to the index**

In `docs/adr/README.md`, add a row to the index table matching the existing format, and set
Status `Accepted`.

- [ ] **Step 4: Verify the citation resolves**

Run: `bash -c 'git ls-files -z | xargs -0 grep -l "ADR-0022"'`
Expected: at least `docs/adr/0022-web-feature-folders.md` and `docs/adr/README.md`.

- [ ] **Step 5: Run the doc-sync citation checks**

Run the three greps in `.claude/skills/doc-sync/SKILL.md`.
Expected: no `DANGLING` lines.

---

### Task 2: Scaffold `features/` and lock the import surface

Establish the directory and the two dependency-cruiser rules that make the boundary real,
BEFORE any screen moves — so the rules are proven on a probe rather than assumed.

**Files:**
- Create: `apps/web/features/.gitkeep` (removed in Task 3 once real files land)
- Modify: `.dependency-cruiser.cjs` (two new rules)
- Modify: `docs/17-engineering-governance.md` (§5 matrix row)

**Interfaces:**
- Consumes: ADR-0022.
- Produces: rules `web-app-imports-feature-barrel-only` and `web-feature-no-cross-internals`,
  cited by Tasks 3–6.

- [ ] **Step 1: Add the two rules**

In `.dependency-cruiser.cjs`, alongside the existing `apps/web` rules:

```js
{
  name: 'web-app-imports-feature-barrel-only',
  severity: 'error',
  comment:
    'apps/web/app is ROUTING ONLY (ADR-0022). A page may import a feature through its ' +
    'index barrel — never a deep path into the feature. A deep import re-creates the ' +
    'scattering the feature folder exists to remove, and makes the barrel a lie.',
  from: { path: '^apps/web/app/' },
  to: {
    path: '^apps/web/features/([^/]+)/.+',
    pathNot: '^apps/web/features/[^/]+/index\\.(ts|tsx)$',
  },
},
{
  name: 'web-feature-no-cross-internals',
  severity: 'error',
  comment:
    'One feature may not reach INTO another (ADR-0022). Import the other feature\'s index ' +
    'barrel, or — if the thing is genuinely shared — move it to packages/ui (visual), ' +
    'packages/domain (logic) or apps/web/lib (app infrastructure).',
  // `pathNot` carries the $1 backreference, NOT a lookahead inside `path`. This mirrors the
  // proven `no-app-to-app` rule twenty lines up. A backreference inside a negative lookahead
  // is the shape that silently matches nothing — `tokens-standalone` was dead for exactly
  // that class of reason until 2026-07-30, so verify this one fires (Step 3a) rather than
  // assuming it does.
  from: { path: '^apps/web/features/([^/]+)/' },
  to: {
    path: '^apps/web/features/[^/]+/.+',
    pathNot: '^(apps/web/features/$1/|apps/web/features/[^/]+/index\\.(ts|tsx)$)',
  },
},
```

- [ ] **Step 2: Prove rule 1 fires**

Create `apps/web/features/probe/index.ts` containing `export const probe = 1;` and
`apps/web/features/probe/deep.ts` containing `export const deep = 2;`. Then add to
`apps/web/app/page.tsx`: `import { deep } from '../features/probe/deep';`

Run: `pnpm exec dependency-cruiser --config .dependency-cruiser.cjs apps packages tests`
Expected: `error web-app-imports-feature-barrel-only: apps/web/app/page.tsx → apps/web/features/probe/deep.ts`

- [ ] **Step 3: Prove the barrel import is ALLOWED**

Change the import to `import { probe } from '../features/probe';`

Run: `pnpm exec dependency-cruiser --config .dependency-cruiser.cjs apps packages tests`
Expected: `no dependency violations found`

- [ ] **Step 3a: Prove rule 2 fires (cross-feature internals)**

Create a second probe feature: `apps/web/features/probe2/index.ts` with
`export const p2 = 1;` and `apps/web/features/probe2/inner.ts` with `export const inner = 2;`.
Then add to `apps/web/features/probe/index.ts`:
`import { inner } from '../probe2/inner';`

Run: `pnpm exec dependency-cruiser --config .dependency-cruiser.cjs apps packages tests`
Expected: `error web-feature-no-cross-internals: apps/web/features/probe/index.ts → apps/web/features/probe2/inner.ts`

If it reports NO violation, the `$1` backreference is not resolving — the rule is dead. Do not
proceed; fix the pattern and re-run this step until it fires.

- [ ] **Step 3b: Prove a feature may import its OWN internals**

Change the import to `import { deep } from './deep';` inside `apps/web/features/probe/index.ts`.

Run: `pnpm exec dependency-cruiser --config .dependency-cruiser.cjs apps packages tests`
Expected: `no dependency violations found` — a feature reaching its own files is the normal
case and must not fire.

- [ ] **Step 4: Remove the probes**

Delete `apps/web/features/probe/` and `apps/web/features/probe2/`, and revert the import line
in `apps/web/app/page.tsx`.

Run: `pnpm exec dependency-cruiser --config .dependency-cruiser.cjs apps packages tests`
Expected: `no dependency violations found`

- [ ] **Step 5: Record the mechanism (Law 8)**

Add to `docs/17-engineering-governance.md` §5 "Enforced today":

```markdown
| apps/web pages route, features own the capability | dependency-cruiser `web-app-imports-feature-barrel-only` (a page reaches a feature only through its `index.ts`) and `web-feature-no-cross-internals` — both live, both proven to fire on a probe. The 50-line page cap is Biome `noExcessiveLinesPerFunction` (maxLines 50) scoped to `apps/web/app/**/page.tsx`, **which lands with the page migrations (this plan's Task 6) — it is NOT enforced until then.** A lint rule rather than a line-counting script is a standing preference (owner directive 2026-07-31): it measures the function BODY, so imports and the doc comment do not eat the budget, and it reports at the exact line. ADR-0022. The previous ONE-FOLDER-PER-ROUTE convention had no size mechanism at all, and `app/login/page.tsx` reached 388 lines. | lint | `.dependency-cruiser.cjs`, `biome.json` (Task 6), `apps/web/CLAUDE.md` |
```

- [ ] **Step 6: Verify**

Run: `pnpm lint`
Expected: `all 6 lint gates green`

- [ ] **Step 7: Commit**

```bash
git add .dependency-cruiser.cjs docs/17-engineering-governance.md apps/web/features
git commit -m "feat(boundaries): app/ may reach a feature only through its barrel (ADR-0022)"
```

---

### Task 3: Migrate the auth feature — login

The largest move (388 lines). Splitting it is the point, not a side effect.

**Files:**
- Create: `apps/web/features/auth/index.ts`
- Create: `apps/web/features/auth/login/LoginScreen.tsx`
- Create: `apps/web/features/auth/login/constants.ts`
- Create: `apps/web/features/auth/login/types.ts`
- Create: `apps/web/features/auth/login/hooks/use-login.ts`
- Create: `apps/web/features/auth/login/hooks/use-resend-countdown.ts`
- Create: `apps/web/features/auth/login/components/{PhoneStep,OtpStep,DoneStep,OtpErrorRow}.tsx`
- Create: `apps/web/features/auth/login/components/index.ts`
- Create: `apps/web/features/auth/login/login.css`
- Create: `apps/web/features/auth/shared/hooks/use-online.ts`
- Modify: `apps/web/app/login/page.tsx` (388 → ≤50)
- Delete: `apps/web/app/login/styles.css` (content moves to `login.css`)

**Interfaces:**
- Consumes: rules from Task 2.
- Produces:
  - `features/auth/index.ts` exports `LoginScreen`, `SignupScreen`, `OnboardingScreen`
    (the latter two added in Task 4).
  - `use-login.ts` exports `useLogin(): LoginViewModel` where
    `LoginViewModel = { step: 'phone'|'otp'|'done'; phone: string; online: boolean; sending: boolean; sendError: boolean; otpFailure: 'mismatch'|'verify-failed'|'resend-failed'|null; resendIn: number; showCallOffer: boolean; onPhoneChange(v: string): void; onSubmitPhone(e: FormEvent): void; onOtpComplete(code: string): void; onResend(): void; onChangeNumber(): void }`.
  - `shared/use-online.ts` exports `useOnline(): boolean`.

- [ ] **Step 1: Extract the online hook**

Create `apps/web/features/auth/shared/hooks/use-online.ts` with the `useOnline` function currently at
`apps/web/app/login/page.tsx:33-47`, moved verbatim, with `'use client';` at the top and
`export` added.

- [ ] **Step 2: Extract the controller**

Three files, by responsibility:

- `login/constants.ts` — `RESEND_SECONDS`, `CALL_OFFER_AFTER_RESENDS`, `AUTO_VERIFY_DELAY_MS`,
  `DONE_REDIRECT_DWELL_MS`, each keeping its existing comment. The spec citations
  (`docs/modules/auth-tenancy/specs/login.md` §5, Q9) are load-bearing — carry them across.
- `login/types.ts` — `Step`, `OtpFailure`, and the `LoginViewModel` declared above.
- `login/hooks/use-login.ts` — every `useState`/`useEffect`/`useRef`/`useCallback` and every
  handler; exports `useLogin(): LoginViewModel`. Pull the resend countdown out into
  `hooks/use-resend-countdown.ts` — it is a self-contained timer with its own cleanup, and
  separating it is what keeps `use-login.ts` readable.

**Do not change behaviour in this task.** Timings, the auto-verify delay and the dwell stay
exactly as they are; the RN mirror depends on them matching (Law 7).

- [ ] **Step 3: Extract the presentation**

One file per sub-component under `login/components/` — `PhoneStep.tsx`, `OtpStep.tsx`,
`DoneStep.tsx`, `OtpErrorRow.tsx` — plus `components/index.ts` re-exporting them. Each takes
props and returns markup: no data access, no navigation, no `useLogin()` call.

`login/LoginScreen.tsx` takes no props, calls `useLogin()` once, and switches on `step` to
render the right sub-component. Move `apps/web/app/login/styles.css` to
`apps/web/features/auth/login/login.css` and import it from `LoginScreen.tsx`.

Every `<Trans id="…">` and `i18n._()` msgid moves VERBATIM — a changed msgid breaks the CI
extract guard and orphans the Hindi and Marathi translations.

- [ ] **Step 4: Create the barrel**

Create `apps/web/features/auth/index.ts`:

```ts
/**
 * The ONLY import surface `app/` may use for auth (ADR-0022, enforced by
 * dependency-cruiser `web-app-imports-feature-barrel-only`).
 */
export { LoginScreen } from './login/LoginScreen';
```

- [ ] **Step 5: Reduce the page to a controller**

Replace `apps/web/app/login/page.tsx` entirely:

```tsx
'use client';
import { LoginScreen } from '../../features/auth';

/** Route only — the screen and its logic live in features/auth/login (ADR-0022). */
export default function LoginPage() {
  return <LoginScreen />;
}
```

- [ ] **Step 6: Verify size, boundaries and types**

Run: `wc -l apps/web/app/login/page.tsx`
Expected: ≤50.

Run: `pnpm lint && pnpm turbo typecheck --filter=@heliogrid/web`
Expected: all green, no dependency violations.

- [ ] **Step 7: Verify the catalogs did not move**

Run: `pnpm --filter @heliogrid/i18n extract && git diff --stat packages/i18n/src/locales`
Expected: NO diff. A diff means a msgid changed during the move — fix the string, do not
commit the catalog change.

- [ ] **Step 8: Verify it RUNS**

Start the dev server and walk `/login` in the browser at 375px and 1440px: phone entry → OTP →
resend countdown → change number. Check the console and network panel. Green gates do not prove
UI work (CLAUDE.md §Commands).

- [ ] **Step 9: Commit**

```bash
git add apps/web/features/auth apps/web/app/login docs/adr .dependency-cruiser.cjs docs/17-engineering-governance.md
git commit -m "refactor(web): login moves to features/auth — page.tsx is a 6-line controller (ADR-0022)"
```

---

### Task 4: Migrate the rest of auth — signup, onboarding

**Files:**
- Create: `apps/web/features/auth/signup/SignupScreen.tsx`, `signup.css`
- Create: `apps/web/features/auth/onboarding/OnboardingScreen.tsx`, `use-onboarding.ts`, `onboarding.css`
- Modify: `apps/web/features/auth/index.ts`
- Modify: `apps/web/app/signup/page.tsx` (32 → ≤50, already compliant but must not hold markup)
- Modify: `apps/web/app/onboarding/page.tsx` (98 → ≤50)
- Delete: `apps/web/app/signup/styles.css`, `apps/web/app/onboarding/styles.css`

**Interfaces:**
- Consumes: `features/auth/index.ts` from Task 3.
- Produces: barrel additionally exports `SignupScreen`, `OnboardingScreen`.

- [ ] **Step 1: Move signup**

Move the markup from `app/signup/page.tsx` into
`features/auth/signup/SignupScreen.tsx`; move `app/signup/styles.css` to
`features/auth/signup/signup.css`. Then replace `app/signup/page.tsx` entirely:

```tsx
'use client';
import { SignupScreen } from '../../features/auth';

/** Route only — the screen and its logic live in features/auth/signup (ADR-0022). */
export default function SignupPage() {
  return <SignupScreen />;
}
```

Signup is already 32 lines, under the cap — it still moves, because the cap is not the point.
`app/` holding markup at all is what ADR-0022 removes.

- [ ] **Step 2: Move onboarding**

Same, splitting the controller into `use-onboarding.ts`. `apps/web/CLAUDE.md` records that
onboarding's `SEGMENTS` must be `Record<TheEnum, …>` iterating `schema.options` — carry that
shape across unchanged; an `as const` array is only subset-assignable and made a new
`tenantSegmentSchema` value unselectable while compiling green.

- [ ] **Step 3: Extend the barrel**

```ts
export { LoginScreen } from './login/LoginScreen';
export { OnboardingScreen } from './onboarding/OnboardingScreen';
export { SignupScreen } from './signup/SignupScreen';
```

- [ ] **Step 4: Verify**

Run: `pnpm lint && pnpm turbo typecheck --filter=@heliogrid/web`
Expected: green.

Run: `for f in apps/web/app/*/page.tsx; do printf '%s %s\n' "$(wc -l < $f)" "$f"; done`
Expected: every auth page ≤50.

- [ ] **Step 5: Verify catalogs unchanged**

Run: `pnpm --filter @heliogrid/i18n extract && git diff --stat packages/i18n/src/locales`
Expected: no diff.

- [ ] **Step 6: Verify it RUNS**

Walk `/signup` and `/onboarding` in the browser at 375px and 1440px.

- [ ] **Step 7: Commit**

```bash
git add apps/web/features/auth apps/web/app/signup apps/web/app/onboarding
git commit -m "refactor(web): signup and onboarding move to features/auth (ADR-0022)"
```

---

### Task 5: Migrate home and design-reference

**Files:**
- Create: `apps/web/features/home/{index.ts,HomeScreen.tsx,use-home.ts,home.css}`
- Create: `apps/web/features/design-reference/{index.ts,DesignScreen.tsx,design.css}`
- Create: `apps/web/features/design-reference/gallery/GalleryScreen.tsx`
- Move: the six files in `apps/web/app/design/gallery/components/` → `apps/web/features/design-reference/gallery/components/`
- Modify: `apps/web/app/home/page.tsx` (89 → ≤50), `apps/web/app/design/page.tsx` (317 → ≤50), `apps/web/app/design/gallery/page.tsx` (37 → ≤50)
- Delete: `apps/web/app/home/styles.css`, `apps/web/app/design/styles.css`

**Interfaces:**
- Consumes: rules from Task 2.
- Produces: `features/home` exports `HomeScreen`; `features/design-reference` exports
  `DesignScreen` and `GalleryScreen`.

- [ ] **Step 1: Move home**

`home` is its own feature, not part of `auth`: it becomes the CRM My Day surface, so filing it
under auth would guarantee a second move later.

- [ ] **Step 2: Move design-reference**

`app/design/page.tsx` is 317 lines of token tables. Split by RESPONSIBILITY into
`DesignScreen.tsx` plus section components under `features/design-reference/` — never
`design-part2.tsx`. The six gallery section files move verbatim.

- [ ] **Step 3: Verify**

Run: `pnpm lint && pnpm turbo typecheck --filter=@heliogrid/web && pnpm turbo build --filter=@heliogrid/web`
Expected: green.

Run: `find apps/web/app -name '*.css' -not -name 'globals.css'`
Expected: EMPTY — `globals.css` is the only stylesheet left under `app/`.

- [ ] **Step 4: Verify it RUNS**

Walk `/`, `/home`, `/design` and `/design/gallery` in the browser. `/design` renders
`dist/tokens.json`; a token that does not render there does not exist
(`apps/web/CLAUDE.md`).

- [ ] **Step 5: Commit**

```bash
git add apps/web/features apps/web/app
git commit -m "refactor(web): home and design-reference move to feature folders (ADR-0022)"
```

---

### Task 6: Enable the page cap — as a BIOME RULE, not a script

Last, because it can only be switched on once every page complies — and it must be proven to
fail, not assumed.

**No script.** `noExcessiveLinesPerFunction` is a real Biome rule (verified present in 2.5.5,
`maxLines` default 50) and it is strictly better than counting file lines: it measures the
FUNCTION BODY, so imports, the `'use client'` directive and the doc comment do not eat the
budget — the component itself is what gets capped. It also reports at the exact line and is
versioned with the toolchain instead of with a bash array.

**Files:**
- Modify: `biome.json` (one override)

**Interfaces:**
- Consumes: Tasks 3–5 (every page body under 50 lines).
- Produces: a red build for any page component over the cap.

- [ ] **Step 1: Add the override**

In `biome.json`, append to `overrides`:

```json
{
  "includes": ["apps/web/app/**/page.tsx"],
  "linter": {
    "rules": {
      "complexity": {
        "noExcessiveLinesPerFunction": {
          "level": "error",
          "options": { "maxLines": 50, "skipBlankLines": true }
        }
      }
    }
  }
}
```

Scoped to `page.tsx` ONLY. A screen component in a feature folder is allowed to be longer —
it is composition, and `≲450 lines split by responsibility` already governs it. `layout.tsx`
and `providers.tsx` are Next reserved plumbing, not pages, and are not matched.

- [ ] **Step 2: Verify the tree passes**

Run: `pnpm exec biome check apps/web`
Expected: no `noExcessiveLinesPerFunction` diagnostics.

- [ ] **Step 3: PROVE it fails**

Add 60 lines of `const filler0 = 0;` … inside the component body of
`apps/web/app/login/page.tsx` (inside the function, not at module scope — the rule measures
the body).

Run: `pnpm exec biome check apps/web/app/login/page.tsx`
Expected: `lint/complexity/noExcessiveLinesPerFunction` naming `apps/web/app/login/page.tsx`.

Measured before this plan: the rule fired on `app/login/page.tsx` (388 lines) and
`app/design/page.tsx` (317) and on nothing else — so the cap is real and the two migrations
are what make it satisfiable.

- [ ] **Step 4: Revert and re-verify**

Restore the file.

Run: `pnpm lint`
Expected: `all 6 lint gates green`.

- [ ] **Step 5: Retire the "not yet enforced" caveat (Law 8)**

Task 2 added a §5 row to `docs/17-engineering-governance.md` that deliberately said the Biome
half "**lands with the page migrations (this plan's Task 6) — it is NOT enforced until then.**"
That sentence becomes FALSE the moment Step 1 lands. Replace that clause with a statement that
it IS enforced, keeping the rest of the row intact:

```
The 50-line page cap is Biome `noExcessiveLinesPerFunction` (maxLines 50) scoped to
`apps/web/app/**/page.tsx` — LIVE since 2026-07-31, and proven to fire on planted filler.
```

Verify: `grep -n "NOT enforced until then" docs/17-engineering-governance.md` → NO matches.

- [ ] **Step 6: Commit**

```bash
git add biome.json docs/17-engineering-governance.md
git commit -m "feat(lint): cap apps/web page components at 50 lines (Biome, not a script) — ADR-0022"
```

---

### Task 7: Rewrite the conventions and purge every stale reference

The user asked explicitly for this: shorter instructions, and no stale pointer left behind.

**Files:**
- Modify: `apps/web/CLAUDE.md` (lines 17–23, the ONE-FOLDER-PER-ROUTE block)
- Modify: `.claude/rules/ui-adherence.md` (lines 33–41, the `components.tsx`/`hooks.ts` satellite wording)
- Modify: `apps/mobile/CLAUDE.md` (one line recording the deliberate asymmetry)
- Modify: `CLAUDE.md` (the standing no-new-scripts rule — owner directive 2026-07-31)
- Modify: `docs/17-engineering-governance.md` (§5 preamble: the enforcement ladder gains an explicit anti-script rung)

**Interfaces:**
- Consumes: ADR-0022 and the landed structure.
- Produces: the conventions an agent reads on every future web change.

- [ ] **Step 1: Replace the apps/web convention**

In `apps/web/CLAUDE.md`, replace the ONE-FOLDER-PER-ROUTE bullet with:

```markdown
- **`app/` ROUTES, `features/` OWNS.** A `page.tsx` body is ≤50 lines (Biome
  `noExcessiveLinesPerFunction`): read route params, call one controller hook, render one
  screen. Everything else lives in `features/<feature>/`, imported ONLY through its `index.ts`
  barrel (dependency-cruiser). A feature is named for its module in `docs/modules/`.
- **Inside a feature, structure follows need:** `<Screen>.tsx` composes · `components/` one
  file per sub-component (a folder from the first one) · `hooks/use-<screen>.ts` for the
  controller · `constants.ts` for literals · `types.ts` when two files share a type ·
  `<feature>/shared/` when two SCREENS share. Two FEATURES sharing means it is not
  feature-local: `packages/ui`, `packages/domain` or `lib/`. ADR-0022.
- `globals.css` is the only stylesheet under `app/`. Next reserved files
  (layout/providers/loading/error/not-found/route) stay in `app/`; `route.ts` is cookie/session
  BFF glue ONLY. `lib/` is unchanged: `*-client.ts` · `env.ts` · `hooks/` · `constants.ts`.
```

- [ ] **Step 2: Fix the rule file**

In `.claude/rules/ui-adherence.md`, the presentation/logic section names `components.tsx` and
`hooks.ts` satellites — the superseded shape. Replace those two bullets with:

```markdown
- **Presentational** — a component in `apps/web/features/<feature>/` or `packages/ui`: props
  in, markup out. No data access, no navigation.
- **Logic** — a `use-<thing>.ts` controller hook beside it in the same feature folder; shared
  logic that both platforms need belongs in a shared package, never copied into each platform.
```

- [ ] **Step 3: Record the asymmetry where it will be read**

Add one line to `apps/mobile/CLAUDE.md` §Local conventions:

```markdown
- **RN keeps `src/screens/<name>/` — it is NOT migrating to web's `features/` shape** (ADR-0022
  Consequences). RN has no router-driven `app/` directory, so screen folders already are the
  equivalent. The asymmetry is deliberate; do not "align" one to the other.
```

- [ ] **Step 3a: Add the standing no-new-scripts rule to the constitution**

Owner directive, 2026-07-31. Add to `CLAUDE.md` §Process, kept short — it is always-loaded
context:

```markdown
- **Mechanism order: type → lint rule → instruction → (script only by owner ruling).**
  A script encodes today's tree and rots when the tree changes; this repo has lost real time
  to a bash array that expanded to garbage, an unmatched zsh glob that aborted a command so
  grep printed nothing, and an unquoted `$VAR` that filtered nothing. Prefer a Biome rule:
  versioned with the toolchain, AST-aware, reports at the line. **Do not add new checker
  scripts.** The existing ones stay; each new one needs an owner ruling saying why a type or
  a lint rule cannot hold it.
```

- [ ] **Step 3b: Record it in the governance ladder**

`docs/17-engineering-governance.md` §5's preamble already ranks mechanisms. Add one sentence
making the anti-script preference explicit, so the matrix and the constitution agree:

```markdown
A rule earns the LOWEST rung that can hold it, and rung 2 means a LINT RULE in preference to a
checker script (owner directive 2026-07-31). Scripts encode the tree's current shape and fail
open when it changes — the three silent-no-op bugs found on 2026-07-30/31 were all in scripts,
not in lint configuration. Existing scripts stay; a NEW one needs an owner ruling recorded here
saying why no type and no lint rule can express the rule.
```

- [ ] **Step 4: Hunt every remaining stale reference**

Run:

```bash
# Shape 1 — the superseded convention's vocabulary.
git ls-files -z | xargs -0 grep -n "ONE FOLDER PER ROUTE\|components\.tsx\|hooks\.ts\|<route>/" \
  | grep -v superpowers | grep -v apps/mobile

# Shape 2 — pointers at a route path that is now a 7-line stub. The Task 5 review found
# `docs/10-i18n-and-design-system.md` still describing `apps/web/app/design` as the living
# token reference; shape 1's patterns do not catch that class at all.
git ls-files -z | xargs -0 grep -nE "apps/web/app/(login|signup|onboarding|home|design)" \
  | grep -v superpowers
```

Every hit from shape 2 must either point at `apps/web/features/<feature>/…` or be genuinely
about routing. A route file is 7 lines — if the prose describes behaviour, styling or content,
it is pointing at the wrong file now.

Expected: only the new wording. Any hit describing the old satellite shape for web is stale —
fix it. Note `apps/mobile` legitimately keeps `components.tsx`/`hooks.ts` under
`src/screens/`, which is why it is excluded from this sweep.

- [ ] **Step 5: Verify citations resolve**

Run the three greps in `.claude/skills/doc-sync/SKILL.md`.
Expected: no `DANGLING` lines.

- [ ] **Step 6: Commit**

```bash
git add apps/web/CLAUDE.md .claude/rules/ui-adherence.md apps/mobile/CLAUDE.md
git commit -m "docs: app/ routes, features/ owns — conventions rewritten, stale satellite refs purged (ADR-0022)"
```

---

### Task 8: Full verification

**Files:** none modified — this task only runs things.

- [ ] **Step 1: Full gate set**

Requires a database:

```bash
docker run --rm -d --name hg-verify -e POSTGRES_USER=heliogrid -e POSTGRES_PASSWORD=heliogrid \
  -e POSTGRES_DB=heliogrid_ci -p 55600:5432 postgres:16
export DATABASE_URL=postgres://heliogrid:heliogrid@localhost:55600/heliogrid_ci
export DATABASE_ADMIN_URL=$DATABASE_URL
pnpm turbo build && pnpm --filter @heliogrid/db migrate
pnpm verify; echo "EXIT=$?"
```

Expected: `EXIT=0`. **Read the exit code from that echo, not from a pipeline** — a `| tail`
swallows it and reports the pipe's status instead.

- [ ] **Step 2: Structural assertions**

```bash
find apps/web/app -name '*.css' -not -name 'globals.css'          # expect empty
find apps/web/app -name 'components.tsx' -o -name 'hooks.ts'      # expect empty
for f in $(find apps/web/app -name 'page.tsx'); do printf '%s %s\n' "$(wc -l < $f)" "$f"; done
```

Expected: no stray CSS, no satellites, every page ≤50.

- [ ] **Step 3: Verify every route RUNS**

Walk `/`, `/login`, `/signup`, `/onboarding`, `/home`, `/design`, `/design/gallery` in the
browser at 375px and 1440px. Console and network panel clean. This is the step green gates
cannot replace.

- [ ] **Step 4: Clean up**

```bash
docker rm -f hg-verify
```

- [ ] **Step 5: Report**

State: pages before/after line counts, gate output, which routes were walked and at what
widths, and anything that changed behaviour (there should be nothing — this is a move).
