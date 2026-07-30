---
name: pr
description: Branch, commit and pull-request conventions for a completed slice. Invoke only when the user explicitly asks to commit, branch, or raise a PR.
disable-model-invocation: true
---

# Shipping a slice

Nothing in here runs on your own initiative. `bash-guard` blocks `git push` and
`gh pr create` so that stays true even if you forget. Commit when the user says commit;
branch or open a PR when the user says so, in those words.

## Branch

`mod/<module>-t<NN>-<slug>` for module work — e.g. `mod/auth-tenancy-t03-signup`.
Otherwise `fix/<slug>`, `docs/<slug>`, `chore/<slug>`.

## Commit message

Record what was **VERIFIED**, not what was written:

    auth-tenancy t3: signup screen web+RN VERIFIED — browser 375/1440, both sims, curl 409

A message describing the code duplicates the diff. A message describing what you ran and
saw is the only place that evidence survives.

Call out a dependency addition explicitly — it is a decision, not an implementation detail.
Docs travel in the same commit as the code that invalidated them (Law 8).

## Before handing over

```bash
pnpm verify        # lint · boundaries · typecheck · test · build — the whole gate set
```

`pnpm turbo test` needs `DATABASE_URL`; without it the invariants skip loudly (and fail hard
under CI), so a local run that skipped them has NOT proven tenancy. If you could not run
something, say so plainly rather than letting the omission imply it passed.

Two gates sit outside `verify` on purpose: `pnpm check:openapi` (its oasdiff half is advisory
and only runs where that binary exists — `verify` must mean the same thing on every machine;
CI enforces the freshness half) and `check:unused` / `check:dupes` (cleanup tools, not gates).

## PR body

Fill `.github/pull_request_template.md`. Keep it honest and short: skip rows that genuinely
don't apply rather than writing a paragraph explaining why they don't.

Two things the template does not ask for and reviewers always want: the **evidence** you
captured (screenshots, curl output, log excerpts — specifics, not "tested"), and what is
deliberately **not** handled yet. Omitting the second is how reviewers get surprised in
production.

The module roadmap IS the changelog — status plus evidence per task. There is no separate
changelog file to update.
