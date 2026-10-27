# @heliogrid/forms — the headless form layer, the ONLY form-state path for apps

`useZodForm` takes a contract schema (or a `.pick()`/`.omit()` of it) for both types and
validation; `applyServerErrors` maps an envelope's `details[]` to field errors. NEVER a schema
definition — schemas live in `@heliogrid/contracts` — nor UI, copy or data fetching.

## Traps

- `installFormsErrorMap` mutates zod's PROCESS-GLOBAL error map, so it cannot be per request; it is correct on a client, where one mount has one language → each app root installs it, bound to that mount's translator; server-side translation uses `@heliogrid/i18n`'s `createTranslator` instead.
