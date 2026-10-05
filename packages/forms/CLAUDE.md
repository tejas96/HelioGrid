# @heliogrid/forms — the headless form layer, the ONLY form-state path for apps

## What lives here / what must never live here

- Exports: `useZodForm` (a contract schema, or a `.pick()`/`.omit()` of it, drives both types and
  validation) · `applyServerErrors` (envelope `details[]` → field errors) · `installFormsErrorMap`
  (translated zod defaults) · `z` and the react-hook-form re-exports.
- NEVER: UI components, copy, data fetching, an environment read, or a schema definition —
  schemas live in `@heliogrid/contracts`.

## Done means

Consumed by BOTH platforms · the form driven in a browser and on both simulators.

## Traps

- `installFormsErrorMap` mutates zod's PROCESS-GLOBAL error map, so it cannot be per request; it is correct on a client, where one mount has one language → each app root installs it, bound to that mount's translator; server-side translation uses `@heliogrid/i18n`'s `createTranslator` instead.
