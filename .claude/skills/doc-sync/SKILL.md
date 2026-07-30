---
name: doc-sync
description: Keep documentation synchronized with the change in the same commit — update what the diff invalidated, record landmines and UX gaps, and confirm every cross-reference still resolves.
---

# Documentation sync

Law 8 in one sentence: the window between a code commit and a follow-up docs commit is
exactly when the next agent reads the stale version. So they travel together.

## Walk the diff and ask what it invalidated

| If the change touched | Update |
|---|---|
| schema | the `docs/04` section this module owns |
| a contract | the roadmap traceability header; `docs/07` if a port shape moved |
| architecture | `docs/02` — and if it was a new pattern, the ADR should have come first (Law 2) |
| a design-system ruling | `docs/10` |
| **something that cost real debugging time** | the owning package's `CLAUDE.md` Landmines, **date-stamped** — mandatory on first discovery, not optional |
| a surface the mockups don't cover | append a row to `docs/13` |
| a product-shaped call the owner may veto | module rulings in the roadmap |

The landmine row is the one people skip. An hour lost to a trap that nobody wrote down is
an hour the next person will lose too.

## Leave no dangling pointer

Every `docs/NN §M`, relative link and cross-reference you touched must resolve to a real
file and heading. Files once cited constitution sections that were never committed —
nothing detected it because nothing checked. Three grep checks catch this (owner decision:
grep, not a checker script):

Scan every TRACKED-or-untracked file via `git ls-files`, not `grep -r .` and not a hand-listed
set of roots. The old root list (`docs apps packages .claude .github`) omitted repo-root files,
`scripts/` and `tests/`, and walked a live `CLAUDE.md §Structure` in `.dependency-cruiser.cjs`
and a `docs/08 §124` in `.env.example` straight through the "27 → 0" repair. Two traps make the
obvious repairs worse, and both produce output that reads exactly like "clean":

- **Root globs.** `*.example` matches no dotfile, and in zsh a single unmatched glob aborts the
  whole command — the grep never runs and prints nothing.
- **Unquoted `$SKIP` / `$ROOTS` variables.** zsh does not word-split unquoted parameters, so
  `grep -v $SKIP` passes one giant pattern and filters nothing. Use literal arguments.

`--exclude-dir` is not trustworthy here either: this repo's `grep` is ugrep, and it was observed
to stop excluding once several were combined — which is why the walk scanned `node_modules` and
took ~2 minutes. `git ls-files` is 0.2s and excludes build artifacts by construction.

```bash

# Scan scope = every tracked or untracked-but-not-ignored file. NOT `grep -r .`: this repo's
# grep is ugrep, whose --exclude-dir stopped excluding once several were combined, so the walk
# scanned node_modules and took ~2 minutes (0.2s this way). NOT a hand-listed set of roots
# either — that omitted repo-root files, scripts/ and tests/, and walked a live
# `CLAUDE.md §Structure` in .dependency-cruiser.cjs straight through the "27 -> 0" repair.
files() { git ls-files --cached --others --exclude-standard -z; }
# Self-exclude THIS file. Its prose quotes citations while explaining them, and the earlier fix
# skipped the section NAMES instead (`X|'Section citations'*|Structure`) — which permanently
# blinded the check to `§Structure`, the very citation the paragraph above boasts it now
# catches. Skip by SOURCE, never by section name.
skip() { grep -v -e /dist/ -e /node_modules/ -e /.next/ -e /superpowers/ -e /ios/ -e /android/ \
                 -e '^.claude/skills/doc-sync/SKILL.md:'; }

echo "── broken relative links ──"
# Same scope as the other two. Scanning only `docs` meant a broken relative link in a
# per-package CLAUDE.md, a skill, or the PR template was never checked at all.
files | xargs -0 grep -HoE '\]\((\.{1,2}/)[^)#]+' 2>/dev/null | skip \
  | sed -E 's/^([^:]+):\]\((.+)$/\1\t\2/' \
  | while IFS=$'\t' read -r src rel; do ( cd "$(dirname "$src")" && [ -e "$rel" ] ) \
      || echo "BROKEN $src -> $rel"; done | sort -u

echo "── CLAUDE.md §Section citations ──"
files | xargs -0 grep -HoE 'CLAUDE\.md §[A-Za-z][A-Za-z -]*' 2>/dev/null | skip \
  | while IFS= read -r line; do
      f="${line%%:*}"; sec="${line##*§}"; sec="${sec%"${sec##*[![:space:]]}"}"
      owner="CLAUDE.md"
      case "$f" in
        apps/*/*|packages/*/*)
          p=$(printf '%s' "$f" | cut -d/ -f1-2)
          [ -f "$p/CLAUDE.md" ] && owner="$p/CLAUDE.md" ;;
      esac
      printf '%s\t%s\n' "$owner" "$sec"
    done | sort -u \
  | while IFS=$'\t' read -r owner sec; do
      # EITHER direction counts. The capture regex swallows trailing prose ("§Commands per
      # slice PLUS" -> heading prefixes citation), and a citation may name a heading in short
      # form ("§What lives here" for "## What lives here / what must never live here" ->
      # citation prefixes heading). One direction only reported correct citations as dangling.
      grep -E '^## ' "$owner" | sed 's/^## //' \
        | while IFS= read -r h; do
            case "$sec" in "$h"*) echo MATCH;; esac
            case "$h" in "$sec"*) echo MATCH;; esac
          done | grep -q MATCH || echo "DANGLING §$sec (no such heading in $owner)"
    done

echo "── docs/NN §M citations ──"
# `docs/08 §109` and `docs/08 §124` are line numbers written as sections, frozen inside
# sha256-locked migrations 0005 and 0004 — editing those files makes the migrator refuse to
# run, so they are UNFIXABLE and skipped by name. Any OTHER dangle is real.
files | xargs -0 grep -HoE 'docs/[0-9]{2}[a-z-]* §[0-9]+[a-z]?' 2>/dev/null | skip \
  | cut -d: -f2- | sort -u | grep -v -e 'docs/08 §109' -e 'docs/08 §124' \
  | while read -r ref; do n=${ref%% *}; s=${ref##*§}
      f=$(ls docs/${n#docs/}*.md 2>/dev/null | head -1)
      [ -n "$f" ] && grep -qE "^#{2,3} ${s}[. ]" "$f" || echo "DANGLING $ref"; done
```

The third check exists because the first two missed real defects: the PR template cited a
docs/14 section that has never existed (docs/14 uses Track headings), and **docs/04 had lost
its `## 9.` heading entirely** — so `docs/04 §9` dangled while the citation was correct. Both
were invisible because that citation form is `docs/NN §M`, not `CLAUDE.md §X`, and one lived
outside `docs/`. All three checks now include `.github`.

Two exclusions, both deliberate:

- `/superpowers/` — session plans are a historical record. A plan that records extracting the
  forward-compat register out of a numbered docs/14 section is accurately describing a section
  that no longer exists.
- **`docs/08 §109` and `§124` in `packages/db/migrations/*.sql` cannot be fixed.** They are
  line numbers written as § citations, and the runner is sha256-locked — editing an applied
  migration makes `pnpm --filter @heliogrid/db migrate` refuse to run. They stay dangling by
  necessity; fix the DOC side when a migration citation is wrong and the doc is the thing at
  fault (that is how `docs/04 §9` was repaired for an immutable citer).

## Update the roadmap row

Status → VERIFIED with concrete evidence. Update `docs/modules/README.md` if the module's
overall status changed.
