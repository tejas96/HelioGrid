# Mobile Screen Segregation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the two god-component RN screens into presentation / logic / style files matching web's proven shape, then make the shape mechanical so the next four RN screens cannot repeat it.

**Architecture:** RN keeps `src/screens/<name>/` — this plan changes the INSIDE of a screen folder, not its location (ADR-0022's web/RN asymmetry stands). Each screen becomes `<Name>Screen.tsx` (composes) + `hooks/use-<thing>.ts` (state, network, timers) + `components/<Thing>.tsx` (one per component) + `styles.ts`. The target is web's existing login/gallery layout, so both platforms end up structurally parallel and a reviewer can diff them side by side.

**Tech Stack:** Bare React Native 0.86, React 19, Biome 2.5.5, Lingui v5 runtime `<Trans>`, `@heliogrid/tokens/theme`, `apps/mobile/src/ui`.

## Global Constraints

- **NO UNIT TESTS.** Never create a `.test.*` or `.spec.*` file (owner directive 2026-07-29). This plan therefore replaces the skill's TDD cycle with: gate red → change → gate green → **run both simulators**. Where a step would normally say "write the failing test", it says "prove the gate goes red".
- **Verification is running the app.** `/verify-app` — iPhone AND Pixel simulators. A refactor that typechecks is not verified.
- **Files ≲450 lines, split by responsibility.** Name the file for what it DOES. Never `*-part2`, `*2`, `*-extra` — and never `components.tsx`/`hooks.ts` grab-bags, which are the same defect wearing a layer name.
- **Presentation and logic in different files** (`.claude/rules/ui-adherence.md`).
- **Import UI ONLY from `src/ui` index; theme ONLY from `@heliogrid/tokens/theme`.** Enforced by Biome `noRestrictedImports`.
- **Copy is `<Trans id="...">` runtime only** — Lingui macros are banned on RN. Every msgid must survive this refactor **byte-identical**; a changed msgid silently drops a translation.
- **Git is manual.** Do NOT commit. Leave each task's work in the tree and report what changed.
- **Never weaken a gate to make a change pass.**

## Current State (measured 2026-07-31, not assumed)

| File | Lines | Problem |
|---|---|---|
| `screens/login/LoginScreen.tsx` | 446 | 11 `useState`, `authClient` calls, 2 `useEffect` timers, ALL markup, `StyleSheet` at :409 |
| `screens/gallery/GalleryScreen.tsx` | 406 | 8 inline `<Section>` blocks |
| `screens/gallery/components.tsx` | 355 | grab-bag, 20 exported symbols |
| `screens/login/components.tsx` | 136 | grab-bag: `H1`, `Small`, `StepRise`, `BloomBackdrop` + 3 bloom constants |
| `screens/login/hooks.ts` | 18 | grab-bag holding one hook |
| `screens/home/HomeScreen.tsx` | 71 | **fine — do not touch** |

Web's equivalents for reference: `LoginScreen.tsx` 70 · `hooks/use-login.ts` 185 · `components/OtpStep.tsx` 123 · gallery screen 39 + six named section files.

**Package usage is already correct and is NOT the problem.** Mobile screens import `../../ui` (5), `@heliogrid/tokens/theme` (5), `@heliogrid/contracts` (2), `@heliogrid/domain` (1), `../../i18n` (1). `H1`/`Small` delegate to `AppText`. Do not "fix" imports.

**Timing:** auth-tenancy tasks 3, 6, 8, 9 add four more RN screens, all `todo`. The vague convention is what produced a 446-line file; fixing it before those land is the point of this plan.

---

## Task 1: Split the login screen

**Files:**
- Create: `apps/mobile/src/screens/login/types.ts`
- Create: `apps/mobile/src/screens/login/styles.ts`
- Create: `apps/mobile/src/screens/login/hooks/use-login.ts`
- Create: `apps/mobile/src/screens/login/hooks/use-resend-countdown.ts`
- Create: `apps/mobile/src/screens/login/hooks/use-reduce-motion.ts`
- Create: `apps/mobile/src/screens/login/components/{PhoneStep,OtpStep,DoneStep,OtpErrorRow,CallOfferCard,BloomBackdrop,StepRise,Typography}.tsx`
- Create: `apps/mobile/src/screens/login/components/index.ts`
- Modify: `apps/mobile/src/screens/login/LoginScreen.tsx` (446 → ~70 lines)
- Delete: `apps/mobile/src/screens/login/components.tsx`, `apps/mobile/src/screens/login/hooks.ts`
- Verify: iPhone + Pixel simulators

**Interfaces:**
- Consumes: `LoginStep`, `OtpFailure`, `RESEND_SECONDS`, `AUTO_VERIFY_DELAY_MS`, `CALL_OFFER_AFTER_RESENDS`, `DONE_DWELL_MS`, `formatPhoneNsn` — all from `@heliogrid/domain`. Do not re-declare any of them.
- Produces: `useLogin(onSignedIn: () => void): LoginViewModel` from `./hooks/use-login`; the `LoginViewModel` interface from `./types`; the eight components from `./components`.

- [ ] **Step 1: Define the view model**

Create `apps/mobile/src/screens/login/types.ts`. This is RN's own shape — web's `LoginViewModel` uses `FormEvent` from react-dom and is not reusable here.

```ts
import type { LoginStep, OtpFailure } from '@heliogrid/domain';

/** Everything the login screen renders from. The screen holds no state of its own. */
export interface LoginViewModel {
  step: LoginStep;
  phone: string;
  otp: string;
  otpSession: number;
  offline: boolean;
  sending: boolean;
  sendFailed: boolean;
  verifying: boolean;
  otpFailure: OtpFailure | null;
  secondsLeft: number;
  resendCount: number;
  callRequested: boolean;
  canSubmitPhone: boolean;
  onPhoneChange(v: string): void;
  onSubmitPhone(): void;
  onOtpChange(v: string): void;
  onOtpComplete(code: string): void;
  onResend(): void;
  onChangeNumber(): void;
  onCallMe(): void;
}
```

- [ ] **Step 2: Move the countdown and reduce-motion hooks**

Create `apps/mobile/src/screens/login/hooks/use-resend-countdown.ts` — lift the `secondsLeft` state, the `useEffect` interval, and the `Date.now()`-based end calculation currently at `LoginScreen.tsx:58,74-88` **verbatim**. Signature:

```ts
export function useResendCountdown(): {
  secondsLeft: number;
  restart: () => void;
};
```

Create `apps/mobile/src/screens/login/hooks/use-reduce-motion.ts` and move `useReduceMotion` from `hooks.ts` unchanged. Then delete `hooks.ts`.

- [ ] **Step 3: Extract the controller**

Create `apps/mobile/src/screens/login/hooks/use-login.ts`. Move, **without behaviour changes**: all remaining `useState` from `LoginScreen.tsx:50-62`, the `sendCode` and `verify` `useCallback`s (`:96-158`), `onOtpChange`, `onOtpComplete`, `changeNumber`, `requestCall`, and the two `useRef` in-flight guards. Keep both `TODO(auth-tenancy roadmap task 7/6)` comments attached to `requestCall`/`openInvite` — they are roadmap anchors, not dead code.

```ts
export function useLogin(onSignedIn: () => void): LoginViewModel;
```

Preserve exactly, because each is a logged spec decision:
- the `sendInFlight` / `verifyInFlight` refs (rapid double-tap guards)
- `setOtpFailure(null)` **and** `setSendFailed(false)` in `onOtpChange` (spec §5 — any edit clears the error)
- `error.status && error.status < 500 ? 'mismatch' : 'verify-failed'`
- `setOtpSession((k) => k + 1)` on resend (remounts OtpInput)

- [ ] **Step 4: Extract the presentational components**

One file per component under `components/`. Move markup verbatim; each takes props and returns markup, with **no** `useState` and **no** `authClient`.

| File | Props | Source lines |
|---|---|---|
| `Typography.tsx` | `H1`, `Small` — move both from `components.tsx` unchanged | components.tsx:17-42 |
| `BloomBackdrop.tsx` | `{ reduceMotion: boolean }` + the 3 `BLOOM_*` constants | components.tsx:13-15,87-126 |
| `StepRise.tsx` | existing props | components.tsx:44-86 |
| `PhoneStep.tsx` | `{ phone, sending, sendFailed, canSubmit, onChange, onSubmit }` | LoginScreen.tsx phone branch |
| `OtpStep.tsx` | `{ phone, otp, otpSession, verifying, otpFailure, sendFailed, secondsLeft, onOtpChange, onOtpComplete, onResend, onChangeNumber }` | LoginScreen.tsx otp branch |
| `DoneStep.tsx` | `{}` | LoginScreen.tsx done branch |
| `OtpErrorRow.tsx` | `{ failure: OtpFailure \| null; sendFailed: boolean }` | the `errorRow(...)` calls |
| `CallOfferCard.tsx` | `{ requested: boolean; onCallMe(): void }` | LoginScreen.tsx:310+ call card |

Create `components/index.ts` re-exporting all eight, matching web's `components/index.ts` pattern.

`OtpErrorRow.tsx` must keep all three msgids byte-identical:

```tsx
<Trans id="That code doesn’t match. Check it and try again." />
<Trans id="Couldn't check the code. Try again." />
<Trans id="Couldn't send the code. Try again." />
```

Note the **typographic apostrophe** (U+2019) in the first and the **straight** apostrophe in the other two. They differ in the source today. Copy, do not retype.

- [ ] **Step 5: Move the stylesheet**

Create `apps/mobile/src/screens/login/styles.ts` exporting the `StyleSheet.create({...})` currently at `LoginScreen.tsx:409` plus the one at `components.tsx:127`. Split into the styles each component needs; a component importing styles it does not use is a review finding.

- [ ] **Step 6: Reduce LoginScreen.tsx to composition**

`LoginScreen.tsx` calls `useLogin`, picks the step, renders. Target ~70 lines, mirroring web's `LoginScreen.tsx`. Shape:

```tsx
export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const vm = useLogin(onSignedIn);
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <BloomBackdrop reduceMotion={reduceMotion} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}>
        <StepRise key={vm.step} reduceMotion={reduceMotion}>
          {vm.step === 'phone' ? (
            <PhoneStep {...} />
          ) : vm.step === 'otp' ? (
            <OtpStep {...} />
          ) : (
            <DoneStep />
          )}
        </StepRise>
        {vm.offline ? <OfflineBanner message={i18n._("You're offline — check your connection and try again.")} style={styles.offline} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

Then delete `components.tsx`.

- [ ] **Step 7: Prove no msgid moved**

The catalog is the risk in any copy-bearing refactor.

```bash
git stash && pnpm --filter @heliogrid/i18n extract >/dev/null 2>&1 && cp packages/i18n/src/locales/en/messages.po /tmp/before.po && git stash pop
pnpm --filter @heliogrid/i18n extract >/dev/null 2>&1
diff <(grep '^msgid' /tmp/before.po | sort) <(grep '^msgid' packages/i18n/src/locales/en/messages.po | sort)
```

Expected: **no output**. Any line means a msgid changed — fix the string, do not update the catalog.

- [ ] **Step 8: Gates**

```bash
pnpm verify
```

Expected: exit 0. Needs a live postgres (`DATABASE_URL`) or the invariants skip and the run proves less than it looks.

- [ ] **Step 9: Run it on both simulators**

Use `/verify-app`. Walk every state — phone entry, invalid number, send failure, OTP entry, wrong code, verify failure, resend, resend failure, the call-offer card after 2 resends, change-number, done → Home. Confirm the error clears when you type (spec §5) and the resend countdown still starts at 30.

Capture what you saw. **Do not commit** — report the file list and the evidence.

---

## Task 2: Split the gallery screen

**Files:**
- Create: `apps/mobile/src/screens/gallery/components/{GalleryChrome,AuthSections,FormsSections,DataSections,FeedbackNavSections,RowsSections}.tsx`
- Create: `apps/mobile/src/screens/gallery/components/index.ts`
- Create: `apps/mobile/src/screens/gallery/styles.ts`
- Modify: `apps/mobile/src/screens/gallery/GalleryScreen.tsx` (406 → ~50 lines)
- Delete: `apps/mobile/src/screens/gallery/components.tsx`
- Verify: iPhone + Pixel simulators

**Interfaces:**
- Consumes: `ChipTone` from `../../ui`; `WorkflowStatus`, `workflowStatusSchema` from `@heliogrid/contracts`.
- Produces: six section components from `./components`.

Use **web's existing section names** (`apps/web/features/design-reference/gallery/components/`) so a reviewer can diff the two platforms file-for-file. That parity is the reason for these names rather than any others.

- [ ] **Step 1: Move the shared chrome**

Create `components/GalleryChrome.tsx` holding `Section`, `Demo`, `BackGlyph`, the placeholder icon helper, `noop`, `TONES`/`ALL_TONES`, `STATUS_LABEL`, and `PEOPLE` from `components.tsx`. Keep `ALL_TONES` as `Record<ChipTone, null>` — it is what makes a new tone a compile error here.

- [ ] **Step 2: Move the sections**

| File | Sections moved from `GalleryScreen.tsx` |
|---|---|
| `AuthSections.tsx` | Auth composites, OTP input, Step indicator · spinner, Radio cards (`:66-165`) |
| `FormsSections.tsx` | Inputs; Checkbox · radio · switch (`:201-253`) |
| `DataSections.tsx` | Card · icon circle; Chips — tones + dot (`:254-311`) |
| `FeedbackNavSections.tsx` | Progress; Segmented control; Tabs (`:312-360`) |
| `RowsSections.tsx` | remaining list-row / stat sections |

Each is `export function XSections()` taking no props. Move markup verbatim — this is a move, **not** a rewrite: no restyling, no prop changes, no new components.

- [ ] **Step 3: Reduce GalleryScreen.tsx**

Screen renders the nav chrome and the six sections in the current order. Target ~50 lines.

- [ ] **Step 4: Gates and simulators**

```bash
pnpm verify
```

Then `/verify-app`: scroll the whole gallery on both simulators and confirm every section still renders, all six chip tones appear, and the switches/tabs still toggle. A section silently lost in a move is exactly what this step catches.

**Do not commit.**

---

## Task 3: Make the shape mechanical

Prose did not hold this shape — a 446-line screen passed every gate. This task adds the mechanism and the convention together.

**Files:**
- Modify: `biome.json` (new override)
- Modify: `apps/mobile/CLAUDE.md` (§Local conventions, §Landmines)
- Modify: `docs/adr/0022-web-feature-folders.md` (amendment)
- Modify: `docs/17-engineering-governance.md` (§5 matrix row)

- [ ] **Step 1: Add the screen-size cap**

Web caps `page.tsx` bodies at 50 lines via `noExcessiveLinesPerFunction`. RN screens compose more, so cap at 80. Append to `biome.json` `overrides`:

```json
{
  "includes": ["apps/mobile/src/screens/**/*Screen.tsx"],
  "linter": {
    "rules": {
      "complexity": {
        "noExcessiveLinesPerFunction": {
          "level": "error",
          "options": { "maxLines": 80, "skipBlankLines": true }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Prove it bites**

A gate nobody proves is a gate nobody has.

```bash
npx biome check apps/mobile/src/screens          # expect exit 0 after Tasks 1-2
git stash && npx biome check apps/mobile/src/screens/login/LoginScreen.tsx; git stash pop
```

Expected: exit 0 now; **non-zero on the stashed 446-line version**, citing `noExcessiveLinesPerFunction`. If the stashed check passes, the rule is mis-scoped — fix the `includes` glob before continuing. Record both numbers.

- [ ] **Step 3: Write the convention into `apps/mobile/CLAUDE.md`**

Replace the vague `Screen folders: docs/02 §2 (<Name>Screen.tsx + satellites)` line. "Satellites" is what permitted the grab-bags.

```markdown
- **Inside a screen folder, structure follows need** — the same shape as web, in RN's own
  location (ADR-0022): `<Name>Screen.tsx` composes and holds no state · `components/` one file
  per component · `hooks/use-<thing>.ts` for state, network and timers · `styles.ts` for
  `StyleSheet` · `types.ts` when two files share a type. A screen component body is capped at
  80 lines (Biome). **Never a `components.tsx` or `hooks.ts` grab-bag** — a file named for its
  layer instead of its job is the same defect as `*-part2`.
```

Add to §Landmines:

```markdown
- **A screen that fetches, holds state, renders and styles in one file passes every gate**
  (2026-07-31: LoginScreen 446 lines, GalleryScreen 406). Only the 80-line cap catches it now.
  When a screen grows, extract the hook first — logic is what makes the file unreadable, not markup.
```

- [ ] **Step 4: Amend ADR-0022**

The ADR says RN "is NOT migrating to web's `features/` shape". That stays true and is being misread as "RN has no internal convention". Add:

```markdown
**Amended 2026-07-31 — the asymmetry is LOCATION, not structure.** RN keeps
`src/screens/<name>/`; web keeps `features/<feature>/`. Inside that folder both platforms use
the same split: screen composes · `components/` one file each · `hooks/use-<thing>.ts` ·
styles beside them. Reading the ADR as licence for a single-file RN screen produced a 446-line
LoginScreen against web's 70. Structural parity is also what lets a reviewer diff the two
platforms file-for-file.
```

- [ ] **Step 5: Add the docs/17 matrix row**

One line, in the "Enforced today" table:

```markdown
| RN screens compose, hooks own logic | Biome `noExcessiveLinesPerFunction` (80) on `screens/**/*Screen.tsx`, mirroring web's 50-line `page.tsx` cap | lint | `biome.json` |
```

- [ ] **Step 6: Full gates**

```bash
pnpm verify
```

Expected: exit 0. **Do not commit** — report the diff for the owner to read.

---

## Explicitly out of scope

- `screens/home/HomeScreen.tsx` (71 lines) — already correct. Do not touch it.
- Behaviour changes of any kind. Every task is a move. If a step tempts you to fix a bug you notice, record it and keep moving — mixing a fix into a move makes the diff unreviewable.
- `BloomBackdrop`'s geometry (520 / −150 / 8000) duplicating `packages/ui/BloomLayer`. It is a real cross-platform duplication, but the shared home would be `packages/tokens` and these values are not in `design/ds-source` — that is a design-system ruling, not a refactor.
- Moving `H1`/`Small` into `src/ui`. They delegate to `AppText` correctly; promoting them is a design-system API decision.

## Self-review

- **Spec coverage:** "single file" → Tasks 1, 2. "no proper code segregation" → Tasks 1, 2 + the Task 3 cap. "update claude instructions" → Task 3 Steps 3–5. "are they 100% using packages" → measured before planning; they are, and the finding is recorded above so nobody re-opens it.
- **Placeholders:** none. Every file has a name, every hook a signature, every component a prop list and a source line range.
- **Type consistency:** `LoginViewModel` is defined in Task 1 Step 1 and consumed in Steps 3 and 6 under that name. `useLogin(onSignedIn)` matches its call site. `ChipTone` and `ALL_TONES` in Task 2 match the names those symbols already have in the tree.
