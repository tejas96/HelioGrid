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
nothing detected it because nothing checked. Two grep checks catch this (owner decision:
grep, not a checker script):

```bash
# broken relative links in the files you touched
grep -rHoE '\]\((\.{1,2}/)[^)#]+' docs --include='*.md' | grep -v '/superpowers/' \
  | sed -E 's/^([^:]+):\]\((.+)$/\1\t\2/' \
  | while IFS=$'\t' read -r src rel; do ( cd "$(dirname "$src")" && [ -e "$rel" ] ) \
      || echo "BROKEN $src -> $rel"; done | sort -u
# §Section citations vs headings that exist
grep -E '^## ' CLAUDE.md   # the headings that exist
# -H keeps the filename so the path filters below actually bite; -h would drop it and make
# every `grep -v <path>` a silent no-op.
grep -rHoE 'CLAUDE\.md §[A-Za-z][A-Za-z -]*' docs apps packages .claude .github \
  | grep -v '/dist/' | cut -d: -f2- | sort -u
# docs/NN §M citations — resolve each against that file's own headings
grep -rHoE 'docs/[0-9]{2}[a-z-]* §[0-9]+[a-z]?' docs apps packages .claude .github \
  | grep -v -e '/dist/' -e '/superpowers/' | cut -d: -f2- | sort -u \
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
