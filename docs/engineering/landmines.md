# Landmines — live traps only

A trap that is real TODAY, that no type, lint rule or invariant can hold, and that costs an hour
when you meet it cold. One line each.

**What does not belong here.** A rule (that is `CLAUDE.md`) · a mechanism (that is
`mechanisms.md`) · a fact the tree already states · anything about code that no longer exists ·
the story of how the trap was found, which belongs in the commit that added the line.

**Every entry carries a retire-when.** A trap with no retirement is a trap nobody will ever
delete. Law 8's deletion sweep covers this file: when the path goes, the row goes.

| path | trap | fix | retire when |
|---|---|---|---|
| workspace | A deleted source file leaves a stale `dist/`, which keeps `boundaries` red on code that is already gone. | `pnpm turbo build --force` | never — it is how Turbo caches |
| workspace (zsh) | A bare glob that matches nothing aborts the whole command and prints nothing, which reads exactly like "clean". | Enumerate with `git ls-files`, never a bare glob. | never — it is zsh's `nomatch` |
