#!/usr/bin/env bash
# Three repo-hygiene gates that Biome cannot express, done with grep rather than a new
# linter (owner decision 2026-07-30: oxlint was installed for this and REMOVED — it does
# not implement `no-restricted-syntax`, which was the whole reason to add it).
#
#   1. no test files            — owner directive: no .test.*/.spec.* until a testing
#                                 program is commissioned
#   2. source files ≲450 lines  — split by RESPONSIBILITY, never `*-part2`
#   3. no raw hex in UI paths   — every visual value comes from @heliogrid/tokens
#
# Each check prints its violations and the script exits 1 if any fired.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

fail=0
# `scripts` and `.` are here because a test file at the repo root or under scripts/ passed the
# gate green — SRC_DIRS was the only thing stopping it and it listed neither. `.` is depth-1
# only (see the find below), so it adds root files without re-walking the whole tree.
SRC_DIRS="apps packages tests scripts"

# A renamed or deleted folder must BREAK this gate, not quietly shrink it. Every path above is
# checked to exist: `find` writes "No such file or directory" to stderr, which was discarded,
# and its exit status was never read — so moving a scanned folder turned its check into a
# silent no-op that still printed "adherence OK".
for d in $SRC_DIRS; do
  [ -e "$d" ] || { printf 'CONFIG ROT: SRC_DIRS names "%s", which does not exist.\n' "$d"; fail=1; }
done
# WHOLE TREES, not hand-picked folders. The previous list named apps/mobile/src/ui and
# apps/mobile/src/screens, so apps/mobile/src/navigation, apps/mobile/src/push, App.tsx and
# apps/web/lib were never scanned — real UI files where a hard-coded colour passed green.
# A new UI folder must be covered on the day it is created, not three files later.
UI_DIRS="packages/ui/src apps/mobile/src apps/mobile/App.tsx apps/web/app apps/web/lib"
for d in $UI_DIRS; do
  [ -e "$d" ] || { printf 'CONFIG ROT: UI_DIRS names "%s", which does not exist.\n' "$d"; fail=1; }
done
PRUNE=(-not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.next/*'
       -not -path '*/ios/*' -not -path '*/android/*')

# ── 1. No test files ─────────────────────────────────────────────────────────
# `*.test.*` / `*.spec.*`, matching the rule as CLAUDE.md states it. The old eight-clause
# extension list (ts/tsx/js/jsx only) missed .mts/.cts/.mjs/.cjs — and write-guard.sh
# enumerated the same four, so the hook and this backstop shared one blind spot.
# `__tests__/` is the other half of the convention: a directory named that way holds test
# files whatever the filenames inside it are, and both the hook and this gate matched only on
# filename, so the whole directory form passed green.
tests_found=$(
  find $SRC_DIRS -type f \( -name '*.test.*' -o -name '*.spec.*' \) "${PRUNE[@]}" 2>/dev/null
  find $SRC_DIRS -type d \( -name '__tests__' -o -name '__mocks__' \) "${PRUNE[@]}" 2>/dev/null
  find . -maxdepth 1 \( -type f \( -name '*.test.*' -o -name '*.spec.*' \) \
                     -o -type d \( -name '__tests__' -o -name '__mocks__' \) \) 2>/dev/null
)
if [ -n "$tests_found" ]; then
  printf 'TEST FILES (owner directive 2026-07-29 — not authored in this repo):\n%s\n' "$tests_found"
  echo '  The only sanctioned checks are tests/invariants/ and on-demand scripts/.'
  echo '  Features are verified by RUNNING them — see the /verify-app skill.'
  fail=1
fi

# ── 2. Source files over ~450 lines ──────────────────────────────────────────
oversize=$(find $SRC_DIRS -type f \
  \( -name '*.ts' -o -name '*.tsx' -o -name '*.mts' -o -name '*.cts' \
     -o -name '*.js' -o -name '*.jsx' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.css' \) \
  "${PRUNE[@]}" -not -name '*.d.ts' 2>/dev/null \
  | while IFS= read -r f; do
      n=$(wc -l < "$f" | tr -d ' ')
      if [ "$n" -gt 450 ]; then printf '  %5s  %s\n' "$n" "$f"; fi
    done)
if [ -n "$oversize" ]; then
  printf 'OVER 450 LINES — split by RESPONSIBILITY (never *-part2 / *2 / *-extra):\n%s\n' "$oversize"
  fail=1
fi

# ── 3. Raw hex in UI paths ───────────────────────────────────────────────────
# Matches hex ANYWHERE on the line. The old pattern required the hex to be the first token
# after a colon, or a whole quoted string — so `border: 2px solid #ff0000`, `box-shadow: 0 1px
# 2px #00ff00`, `linear-gradient(#123456, #654321)`, Tailwind `bg-[#ff0000]` and template
# literals all passed a green "no raw hex in UI". Those are the shapes real UI code uses.
#
# Comments are still exempt: packages/ui CSS legitimately MENTIONS reference hex while
# explaining the token that replaced it, and noise is how a gate teaches people to ignore it.
# Two passes because a comment can be a whole line OR trail real code — the first grep drops
# comment-led lines, the sed removes same-line /* … */ spans, then the hex must survive both.
#
# The comment test is ANCHORED to grep -n's `path:lineno:` prefix. Unanchored, it matched a
# colon ANYWHERE followed by `//` — so every line containing `://` was treated as a comment
# and exempted. `<svg xmlns="http://www.w3.org/2000/svg" fill="#ff0000">` is exactly that
# shape, and inline SVG is the single most likely place to find a hard-coded fill.
# Hex is not the only raw colour. `rgb()`, `rgba()`, `hsl()` and a named colour are all
# untokenised values that passed a green "no raw hex in UI" — and the contrast-coverage gate
# skips a rule whose fg/bg are literals rather than var(), so nothing saw them at all.
# `color-mix()` over TOKENS is house style (packages/ui/CLAUDE.md) so it is not matched here;
# it resolves to tokens, which is the point. For the same reason `rgb(`/`hsl(` must be followed
# by a DIGIT to count: `rgb(${mix(r)},…)` in apps/mobile/src/ui/data/Card.tsx is RN's
# hand-rolled color-mix — RN has no such function — and it computes from a token, so it is not
# a raw value. A literal colour always starts with a number.
# ONE pattern, used by both passes. It was defined twice before, and only the first copy was
# widened — so rgb()/hsl()/named colours matched the opening grep and were then filtered out
# again by the closing one, which still said hex. A pattern used twice belongs in a variable.
COLOUR='#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch|lab)\([[:space:]]*[0-9.]|(color|background|background-color|borderColor|shadowColor|tintColor)[[:space:]]*[:=][[:space:]]*["'"'"']?(black|white|red|green|blue|gray|grey|orange|yellow|purple|pink|brown|cyan|magenta)\b'
# Block comments are stripped over the WHOLE FILE (perl -0, non-greedy, /s) before matching.
# A per-line filter cannot see that line 3 of a 5-line /* ... */ is inside a comment, so a
# reference palette written across several lines produced false positives — and noise is how a
# gate teaches people to ignore it.
hex=$(for f in $(grep -rlE "$COLOUR" $UI_DIRS --include='*.ts' --include='*.tsx' \
                   --include='*.mts' --include='*.cts' --include='*.jsx' --include='*.css' \
                   2>/dev/null); do
        perl -0pe 's{/\*.*?\*/}{}gs' "$f" | grep -nE "$COLOUR" \
          | grep -vE '^[0-9]+:[[:space:]]*(//|\*)' | sed "s|^|$f:|"
      done)
if [ -n "$hex" ]; then
  printf 'RAW COLOUR in a UI path — use a token from @heliogrid/tokens:\n%s\n' "$hex"
  echo '  Tokens are GENERATED from design/ds-source; see docs/10 §3 and'
  echo '  .claude/rules/ui-adherence.md. packages/tokens and design/ds-source are exempt.'
  echo '  color-mix() OVER TOKENS is fine — a literal colour in any notation is not.'
  fail=1
fi

# ── 4. packages/domain purity: no ambient clock, randomness or I/O ───────────
# ADR-0021 and packages/domain/CLAUDE.md require reducers to be total and deterministic —
# "time enters as a parameter (now: number), never Date.now() inside a reducer", and a
# module-level mutable cache is named there as THE anti-pattern the package exists to prevent.
# Both documents read as though a gate covered that. Nothing did: the dependency-cruiser
# purity rules are import-graph rules, and none of these shapes is an import.
PURE_DIRS="packages/domain/src"
for d in $PURE_DIRS; do
  [ -e "$d" ] || { printf 'CONFIG ROT: PURE_DIRS names "%s", which does not exist.\n' "$d"; fail=1; }
done
if [ -e packages/domain/src ]; then
  # Aliased and indirect forms count: `const now = Date.now` then `now()`, crypto.randomUUID,
  # performance.now and the timer family are all ambient nondeterminism, which is what
  # ADR-0021 actually forbids — not the literal spelling `Date.now(`.
  impure=$(grep -rnE '(Date\.now|Math\.random|new Date\(|\bfetch\(|XMLHttpRequest|crypto\.randomUUID|performance\.now|\bset(Timeout|Interval)\()' \
             packages/domain/src --include='*.ts' --include='*.mts' --include='*.cts' 2>/dev/null \
           | grep -vE '^[^:]+:[0-9]+:[[:space:]]*(/\*|\*|//)')
  if [ -n "$impure" ]; then
    printf 'IMPURITY in packages/domain (ADR-0021 — no clock, no randomness, no I/O):\n%s\n' "$impure"
    echo '  Time and randomness ENTER AS PARAMETERS (`now: number`, an injected id source) so a'
    echo '  reducer is total and replayable. I/O belongs to the app that calls it.'
    fail=1
  fi
fi

# ── 5. The tenant pin must be TRANSACTION-local ──────────────────────────────
# `set_config('app.tenant_id', v, is_local)` — the third argument is is_local. `true` scopes
# the pin to the transaction; `false` (or an omitted third argument) pins it to the whole
# CONNECTION, and under a pool the next request on that connection inherits the previous
# tenant's pin. That is the one way tenancy fails OPEN rather than closed, and no invariant can
# see it: the database is configured correctly either way, and every RLS proof still passes.
pin=$(grep -rnE "set_config\([[:space:]]*'app\.tenant_id'" apps packages --include='*.ts' \
        --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next \
      | grep -vE ',[[:space:]]*true[[:space:]]*\)')
if [ -n "$pin" ]; then
  printf 'TENANT PIN NOT TRANSACTION-LOCAL (set_config third argument must be true):\n%s\n' "$pin"
  echo '  `false` or a missing third argument pins app.tenant_id to the CONNECTION, so the'
  echo '  next request served by that pooled connection inherits this tenant. RLS still'
  echo '  passes every check — it is doing exactly what it was told.'
  fail=1
fi

# ── 6. User-visible copy goes through Lingui ────────────────────────────────
# The i18n CI guard proves the CATALOGS ARE FRESH (`lingui extract` + `git diff --exit-code`).
# It cannot see a string that was never extracted, because an unwrapped literal produces no
# catalog entry to be stale — so a new screen full of hard-coded English passes it, and the
# product line is EN/HI/MR in every document.
#
# HEURISTIC, and narrow on purpose: a JSX text node that looks like PROSE (a capital followed
# by lowercase letters, four or more characters). Icons, numbers, symbols and single words in
# caps are not matched. Copy belongs in `<Trans id="…">` or `i18n._()`.
# `/design` and the RN `gallery` screen are the DEVELOPER-facing token and component
# reference — English by design, never shipped to a customer, and translating them would make
# the reference harder to check against the design source. They are excluded by path.
#
# COPY_DEBT lists product screens that are NOT yet wrapped, each with a reason and an owner.
# They are being rebuilt with auth (auth-tenancy ruling 6), so wrapping them now would be
# translating markup that is about to be deleted — but the debt is LISTED rather than invisible,
# and a NEW screen gets no such grace.
COPY_DEBT='apps/web/app/home/page.tsx|apps/web/app/onboarding/page.tsx'
copy=$(grep -rnE ">[[:space:]]*[A-Z][a-z]{3,}[^<>{}]*<" \
         apps/web/app apps/mobile/src/screens --include='*.tsx' \
         --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null \
       | grep -vE '<Trans|i18n\._|aria-|placeholder=|^[^:]+:[0-9]+:[[:space:]]*(//|\*)' \
       | grep -vE "^(apps/web/app/design/|apps/mobile/src/screens/gallery/)" \
       | grep -vE "^($COPY_DEBT):")
if [ -n "$copy" ]; then
  printf 'UNWRAPPED USER-VISIBLE COPY (EN/HI/MR — docs/10 §7):\n%s\n' "$copy"
  echo '  Wrap it: <Trans id="…"> in a component, i18n._() where a string is needed. The i18n'
  echo '  CI guard only proves catalogs are FRESH — a literal that was never extracted has no'
  echo '  catalog entry to go stale, so nothing else sees it.'
  fail=1
fi

# ── 7. Every extracted message is actually TRANSLATED ───────────────────────
# The CI i18n guard runs `lingui extract` + `git diff --exit-code`, which proves the catalogs
# are FRESH. It says nothing about whether anyone translated them: commit a .po with empty
# `msgstr ""` entries and extract is a no-op on the next run, the diff is clean, `lingui
# compile` succeeds, and the Hindi/Marathi UI silently renders English. The product line is
# EN/HI/MR in every document.
#
# The leading `msgid ""` / `msgstr ""` pair is the PO HEADER, not a message — skipped by
# requiring a non-empty msgid on the preceding line.
untranslated=''
for po in packages/i18n/src/locales/*/messages.po; do
  [ -e "$po" ] || continue
  case "$po" in */en/*) continue;; esac   # en IS the source language
  n=$(awk '/^msgid "..*"/ { pending=1; next } /^msgstr ""$/ { if (pending) c++ } { pending=0 } END { print c+0 }' "$po")
  [ "$n" -gt 0 ] && untranslated="${untranslated}  ${po}: ${n} untranslated\n"
done
if [ -n "$untranslated" ]; then
  printf 'UNTRANSLATED MESSAGES (docs/10 §7 — EN/HI/MR):\n'
  printf "$untranslated"
  echo '  `lingui extract` only proves catalogs are FRESH. An empty msgstr survives it, and'
  echo '  compiles, and renders English to a Hindi or Marathi user.'
  fail=1
fi

[ "$fail" = "0" ] && echo 'adherence OK — no test files, no oversize source, no raw hex in UI, domain pure, copy wrapped + translated'
exit $fail
