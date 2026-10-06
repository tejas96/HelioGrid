---
paths:
  - "apps/web/features/**"
  - "apps/mobile/src/screens/**"
---

# Screens — a part both platforms draw is authored once

## The twin question

Before writing a screen part, name the screen's twin in the RFC's `##### Proposal` — the same
screen on the other platform, built or not — or say it has none, and, part by part, where each
shared part lives. For each part ask: does the other platform draw the same thing? If yes, the part is authored ONCE and both screens import it.
"Not built over there yet" is not a no: the phone's number step and the web's are one door.

## What leaves the screen

- **A component both platforms draw** — a frame, a block, a beat, a card — is a `packages/ui`
  component with one `<Name>.types.ts`, landed before either screen consumes it (Law 7).
- **Words chosen by state** — which title, which primary, which caption a frame shows — are a
  `packages/i18n` copy function over the facts that choose them, beside the screen's other words.
- **The stylesheet follows the component.** When a part moves into the package its rules move
  with it; a screen's stylesheet keeps only what the screen alone owns.

## What stays in the screen

- **The platform adapter the package refuses to hold** — a safe-area inset, a keyboard avoider,
  a sheet where the other platform has a panel — one app-owned wrapper AROUND the package's
  component, never a copy of it.

## When the package may not import what the part needs

`packages/ui` may not import `data` or `i18n`; `i18n` may not import `data`. That is never a
reason to keep a copy in the app. The part takes the FACT as a prop, named for what it measures
— the frame's `taskMeasure`, not which door; `companySignupWords` over three booleans, not the
hook's state — and the screen, which may import both sides, supplies it.

## Verify

- Verify a twinned screen on both platforms, side by side; a one-platform change to a twinned screen
  is where drift starts.

A pair that already exists is a finding, not a rule to bend: it goes to `docs/tasks/deferred.md`
with what blocks the lift, and the next screen task on either twin lifts it.
