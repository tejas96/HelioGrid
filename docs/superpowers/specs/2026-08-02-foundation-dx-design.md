# Foundation DX: validation, error handling, pagination — design

**Date:** 2026-08-02 · **Status:** approved in brainstorming, pending owner review of this doc
**Goal:** a developer (or AI agent) building any feature module composes these three
concerns from vocabulary instead of designing them per screen. Provision the machinery and
the 1–3-line instructions now; end-to-end proof on a live table belongs to the first real
module's `/qa` run.

## Scope

Three areas, client-half completion of machinery that is already contract-complete:

1. **Form validation** shared across web + RN, driven by the contract's own Zod schemas.
2. **Error handling** from `ApiError` to the user's screen, in EN/HI/MR.
3. **Pagination** standardized end to end: offset + totalCount (decided here — see §4).

Out of scope (asked and answered during brainstorming): CRUD mutation conventions
(cache invalidation, optimistic updates) — first real module's concern; translated Zod
field messages (deliberate English fallback, §2.4); any feature contract or endpoint
(Law 9).

## 1. What exists already (unchanged by this work)

- `packages/contracts`: shared field schemas (`phoneE164Schema`, `inrAmountSchema`, enums),
  `errorEnvelope()` + `baseErrorCodes` + `errorHttpStatusByCode`, ts-rest wire validation.
- `apps/api`: `EnvelopeExceptionFilter` (everything non-2xx → canonical envelope),
  `ContractException` for route-specific codes.
- `packages/data`: `toApiError()` parsing the envelope; the repository/hook layering.

The consistent gap: the contract layer is done; the "developer just uses it" layer is not.

## 2. Form validation — `@heliogrid/forms` (new package)

Headless. No UI, no copy, no environment reads. Both platforms share one implementation —
Law 7 parity by construction.

### 2.1 Surface

- `useZodForm(schema, options?)` — wraps react-hook-form's `useForm` with
  `zodResolver(schema)` pre-wired, `mode: 'onTouched'`, values typed `z.infer<schema>`.
  The schema argument is the CONTRACT's schema (or a `.pick()`/`.omit()` of it) — client
  and server validate the same fact, defined once.
- `applyServerErrors(setError, details)` — maps the envelope's `VALIDATION_FAILED`
  `details[]` (`{ path, issue }`) onto fields via `setError(path, { type: 'server',
  message: issue })`. Rare in practice (client pre-validates with the same schema); exists
  so a server rejection never dead-ends as a generic toast.
- Re-exports `Controller` (and the handful of RHF types screens need) so app code imports
  ONLY `@heliogrid/forms`.

### 2.2 Dependencies and fences

- deps: `react-hook-form`, `@hookform/resolvers`, `zod` (pinned `3.25.76` — same landmine
  as `@heliogrid/data`); peer: `react`. No `@heliogrid/contracts` dependency —
  `applyServerErrors` types the envelope details structurally. Regular deps (not peers)
  follow the `data`/`@ts-rest/core` precedent: apps never list react-hook-form at all,
  which is half the fence.
- **Lint fence:** apps importing `react-hook-form` or `@hookform/resolvers` directly is a
  build failure pointing at `@heliogrid/forms` — same mechanism as the ADR-0023 data fence.
  Prove the rule fires by injecting the violation (data package's own landmine lesson).

### 2.3 Screen pattern (the thing devs copy)

```tsx
const form = useZodForm(createLeadSchema);
const submit = form.handleSubmit(async (values) => {
  try {
    await onCreate(values);
  } catch (err) {
    if (err instanceof ApiError && err.code === 'VALIDATION_FAILED' && err.details) {
      applyServerErrors(form.setError, err.details);
      return;
    }
    throw err; // non-validation failures → ApiErrorText (§3)
  }
});
// fields: <Controller control={form.control} name="phone" render={({ field, fieldState }) =>
//   <Input … error={fieldState.error?.message} />} />
```

Web and RN differ only in which `Input` renders. RHF's `Controller` idiom is the one
convention to learn; the gallery carries a live example (§5).

### 2.4 Validation copy — defaults translated, authored messages deliberately English

Zod's DEFAULT messages are translated (owner request, 2026-08-02 follow-up):
`packages/i18n/src/copy/validation.ts` maps the common issue codes (required / invalid /
too-small / too-large) to EN/HI/MR copy via the package's i18n singleton, and
`installFormsErrorMap(formsValidationMessage)` from `@heliogrid/forms` wires it into
`z.setErrorMap` — called once at each app's start (web `providers.tsx`, RN `App.tsx`).
A user never sees zod's bare "Required".

The remaining deliberate gap: schema-AUTHORED messages (e.g. the E.164 hint in
`common.ts`) stay English — zod never consults the error map when a message was given.
The owning module authors screen copy where it matters (static `<Trans>` per the i18n
convention). The i18n gate explicitly allows "gap is deliberate (English fallback)".

## 3. Error handling — complete the client half

Server half unchanged.

### 3.1 `ApiError` carries what the envelope already sends

`@heliogrid/data` `errors.ts`: `ApiError` gains `code: string`,
`details?: readonly { path: string; issue: string }[]`, `requestId?: string` — all parsed
by `toApiError()` from the envelope it already receives and currently discards.
`UnauthorizedError` subclass unchanged.

### 3.2 Error copy — defined ONCE in `packages/i18n`, presentation per platform

The copy (the fact) and the text container (the presentation) split — which ui-adherence
already demands. The copy module is `packages/i18n/src/copy/api-error.ts` — **pure data,
no React** — added to the Lingui extractor sweep (one scoped include line in
`lingui.config.js`):

- `const COPY: Record<BaseErrorCode, { id: string }>` of `/*i18n*/`-annotated message
  descriptors (the extractor's documented non-JSX form) — one definition,
  extractor-visible, and a new base code fails compile ONCE for both platforms
  (contracts.md enum-map rule).
- `apiErrorMessageId(code)` → the catalog id, or `undefined` for unknown/route-specific
  codes (wrapper then renders `error.message`, the server's human-safe copy, until the
  owning module adds copy). `apiErrorRef(error)` → the `Ref: {requestId}` suffix for
  `INTERNAL`, so support tickets carry the trace id. Both take STRUCTURAL args — no
  `@heliogrid/data` dependency.
- Each platform keeps a small presentational `ApiErrorText` wrapper (web:
  `apps/web/lib/ApiErrorText.tsx` + colocated css; RN:
  `apps/mobile/src/lib/ApiErrorText.tsx` — NOT `src/ui/`, it is not a parity-checked
  _ds component) rendering `<Trans id={apiErrorMessageId(code)} />` with **its own**
  `@lingui/react`. Zero copy in either wrapper.

Why the package holds ids, not `<Trans>` elements (learned by hitting it, 2026-08-02):
`@lingui/react` ships dual ESM/CJS builds. The app's `I18nProvider` loads the `.mjs`
build; a tsc-compiled CJS package `require`s the `.cjs` build — two module instances, two
React contexts, and every `<Trans>` from the package throws "rendered without
I18nProvider" under Next SSR. Keeping React out of the package makes the hazard
structurally impossible; the wrappers' `<Trans>` always shares the app's instance.

Costs (accepted): the extractor include gains `packages/i18n/src/copy`, and the i18n
CLAUDE.md charter gains one line. No new dependencies anywhere.

### 3.3 The copy-placement guardrail

Goes in both app CLAUDE.mds so agents never copy shared things per-platform:

> Copy BOTH platforms need lives in `packages/i18n/src/copy` — extractor-swept, exhaustive
> `Record` over the owning enum. Screen-specific copy stays in its screen (static
> `<Trans id>`). Platform files hold presentation only; logic, constants, enums, types:
> always a package.

### 3.4 Conventions

- Form submits branch `VALIDATION_FAILED` → `applyServerErrors` first; everything else
  renders `<ApiErrorText error={e} />` near the action. Never a hand-written failure string.
- Query errors: screen renders `ApiErrorText` in the list/detail error state.
- `UnauthorizedError` → session flow (unchanged, rebuild's concern).

## 4. Pagination — offset + totalCount

**Decision (2026-08-02, owner):** offset pagination, revising the earlier cursor
convention in `common.ts` while it has ZERO consumers. Rationale: per-tenant B2B CRM lists
(thousands–tens of thousands of rows, RLS-scoped) don't hit offset's deep-page cost for
years, and the product needs cursor's three weaknesses natively: total counts ("1,240
leads"), jump-to-page pagers, sort-by-any-column. Escape hatch: a future hot endpoint
(e.g. call logs) may go cursor-based per-route by owner ruling — documented, not built.

### 4.1 Contract (`common.ts` revision)

```ts
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  page: z.coerce.number().int().min(1).default(1),
});
export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), totalCount: z.number().int().nonnegative() });
}
export type Paginated<T> = { items: T[]; totalCount: number }; // keep in step with paginated()
```

`hasNextPage`/`pageCount` are derivable (`page × limit < totalCount`) — they don't travel.

### 4.2 Server recipe (instruction, not a helper — §3 no single-use abstractions)

Idiomatic drizzle in the module's repository; no shared code lands in `apps/api` now:

```ts
const where = and(/* tenant-scoped filters */);
const [rows, [count]] = await Promise.all([
  db.select().from(t).where(where)
    .orderBy(desc(t.createdAt), desc(t.id))            // stable order + id tiebreaker: MANDATORY
    .limit(query.limit).offset((query.page - 1) * query.limit),
  db.select({ n: count() }).from(t).where(where),      // same WHERE, both queries
]);
return { items: rows.map(toDto), totalCount: count?.n ?? 0 };
```

User-sortable columns: the active sort becomes the `orderBy` (id tiebreaker stays), each
sortable column indexed — decided per module.

### 4.3 Client hooks (`packages/data/src/react/`)

Two thin wrappers (~15 lines each), because the two real UI patterns differ:

- `usePaginatedList({ queryKey, fetchPage, limit? })` — ACCUMULATING (RN infinite scroll,
  web load-more). Wraps `useInfiniteQuery`: `initialPageParam: 1`, next page while
  `page × limit < totalCount`, flattens pages into `items` and **dedupes by `id`** (a row
  inserted mid-scroll shifts pages; dedupe makes that invisible). Exposes
  `items, totalCount, fetchNextPage, hasNextPage, isFetchingNextPage, status, error`.
- `usePagedList({ queryKey, fetchPage, page, limit? })` — SINGLE-PAGE (web numbered-pager
  tables). Wraps `useQuery` with `placeholderData: keepPreviousData` so page flips don't
  flash empty. Exposes `items, totalCount, pageCount, status, error, isPlaceholderData`.

Screens choose by UI pattern; nothing else varies. Feature hooks (e.g. `useLeadList`)
wrap these with their repository + query key, in `src/react/` per data-package law.

## 5. Verification (honest statement of what runs where)

No reference endpoint (Law 9; owner decision 2026-08-02). Proof lands in two stages:

1. **Now, via the gallery** (both platforms, walked through `/qa` on browser + both
   simulators): one gallery form section converts from hand-rolled `useState` to
   `useZodForm` (live example of the Controller idiom); a demo list section drives
   `usePaginatedList`/`usePagedList` with an in-memory `fetchPage`; `ApiErrorText` renders
   in the feedback section from a synthesized `ApiError`. This also keeps knip clean —
   every new export has a real consumer.
2. **First real module's `/qa`:** the §4.2 repository recipe against a live table (curl
   the envelope + page math), `applyServerErrors` against a real 400, route-specific code
   fallback in `ApiErrorText`.

Gates: `pnpm verify` green repo-wide; the new forms fence proven by injecting a violation.

## 6. The instruction layer (lands with the code, 1–3 lines each, owning file)

- `apps/web/CLAUDE.md` + `apps/mobile/CLAUDE.md`: forms line (§2.3 pattern), ApiErrorText
  line (§3.4), the copy-placement guardrail (§3.3).
- `packages/i18n/CLAUDE.md`: shared copy modules live in `src/copy/` (extractor-swept,
  enum-keyed `Record`); one line.
- `packages/data/CLAUDE.md`: `usePaginatedList`/`usePagedList` line — never hand-wire
  `useInfiniteQuery`/pagination `useQuery` in an app.
- `apps/api/CLAUDE.md`: list-endpoint recipe line (§4.2) — stable order + id tiebreaker,
  same WHERE for rows and count, never a divergent count query.
- `packages/forms/CLAUDE.md`: new, package charter (what lives here / never here / landmines:
  zod pin, resolver peer).
- `packages/contracts/CLAUDE.md`: one-line note that pagination is offset + totalCount and
  the cursor escape hatch needs an owner ruling.

## 7. New/changed surface summary

| Where | Change |
| --- | --- |
| `packages/forms` | NEW: `useZodForm`, `applyServerErrors`, `Controller` re-export, CLAUDE.md |
| `packages/contracts` | `common.ts`: pagination schemas revised (offset), `Paginated<T>` export |
| `packages/data` | `ApiError` +code/details/requestId; `react/`: `usePaginatedList`, `usePagedList` |
| `packages/i18n` | NEW `src/copy/api-error.ts` (COPY ids + `apiErrorMessageId`/`apiErrorRef`, no React); extractor include; CLAUDE.md line |
| `apps/web` | `lib/ApiErrorText.tsx` (presentation wrapper); gallery demo sections; CLAUDE.md lines |
| `apps/mobile` | `src/lib/ApiErrorText.tsx` (presentation wrapper); gallery demo sections; CLAUDE.md lines |
| `apps/api` | nothing lands; CLAUDE.md recipe line only |
| lint config | forms fence (apps must import `@heliogrid/forms`, never react-hook-form) |

Roughly 300 lines of new source plus gallery edits and doc lines. No endpoints, no schema,
no migrations, no new scripts.
