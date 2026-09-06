#!/usr/bin/env bash
# Three repo-hygiene gates that Biome cannot express, done with grep rather than a new
# linter (owner decision 2026-07-30: oxlint was installed for this and REMOVED — it does
# not implement `no-restricted-syntax`, which was the whole reason to add it).
#
#   1.  unit-test shape         — `*.test.ts` under `<package>/tests/`, logic packages only
#                                 (owner ruling 2026-09-03 commissioned the testing programme)
#   3.  no raw hex in UI paths  — every visual value comes from @heliogrid/theme
#   10. app-declared vocabulary — a union, a lookup or a POLICY NUMBER an app writes itself
#   10b. a brand obtained by a cast — the one hole in an unspeakable fact (CLAUDE.md §8)
#
# Numbering is stable; a gap is a check that was retired in place.
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
# packages/ui/src landed 2026-08-19 (V2 primitives, docs/engineering/17 §4) and is scanned from day one,
# per the rule that used to sit here. The 95-component layer landed into the same tree the same
# day and is covered by that entry — a component folder is not a separate opt-in.
# packages/theme/src is scanned, EXCEPT src/_generated — that is the pulled design-system
# source itself (ds:pull, docs/engineering/17 §6), raw colour by definition; the --exclude-dir below
# keeps the gate on the HAND-WRITTEN theme source without firing on the DS it enforces.
# Being the token package is NOT itself an exemption, and the whole tree is not dropped to buy
# one: _generated is the exempt part, and it is excluded by path so the hand-written source
# beside it stays covered. That distinction is the reason --exclude-dir exists here.
UI_DIRS="apps/mobile/src apps/mobile/App.tsx apps/web/app apps/web/features apps/web/lib packages/theme/src packages/ui/src"
for d in $UI_DIRS; do
  [ -e "$d" ] || { printf 'CONFIG ROT: UI_DIRS names "%s", which does not exist.\n' "$d"; fail=1; }
done
PRUNE=(-not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.next/*'
       -not -path '*/ios/*' -not -path '*/android/*')

# ── 1. Unit tests: one name, one place, one set of packages ──────────────────
# Unit tests were forbidden until the owner ruling of 2026-09-03 and are now REQUIRED for the
# logic layers — but the shape is fixed, because a suite that spreads is a suite nobody
# maintains. This is the backstop for `.claude/hooks/block-test-files.sh`, which stops the same
# three things at authoring time; change BOTH or the pair disagrees.
#
#   * name  — `*.test.ts`. `*.spec.*` and `__tests__/` are the competing conventions; allowing
#             any of them means every glob in this repo has to match three shapes and one day
#             misses half the suite.
#   * place — `<package>/tests/**`, never inside `src/`. Inside src the package's own `tsc -b`
#             compiles tests into `dist/`, which then ships.
#   * scope — the logic packages only. Frontend is proven by running it, `packages/data` by
#             driving the real client, `packages/db` by migrations plus tests/invariants/.
UNIT_TEST_PACKAGES='packages/domain packages/contracts packages/forms apps/api apps/worker'

bad_name=$(
  find $SRC_DIRS -type f -name '*.spec.*' "${PRUNE[@]}" 2>/dev/null
  find $SRC_DIRS -type d \( -name '__tests__' -o -name '__mocks__' \) "${PRUNE[@]}" 2>/dev/null
  find . -maxdepth 1 \( -type f -name '*.spec.*' \
                     -o -type d \( -name '__tests__' -o -name '__mocks__' \) \) 2>/dev/null
)
if [ -n "$bad_name" ]; then
  printf 'WRONG TEST CONVENTION (this repo uses `*.test.ts` in a package tests/ tree):\n%s\n' "$bad_name"
  echo '  `*.spec.*`, `__tests__/` and `__mocks__/` are not used here — CLAUDE.md §8.'
  fail=1
fi

# Every `*.test.*` that is NOT under an allowed `<package>/tests/` tree.
allowed_re="^\./($(echo "$UNIT_TEST_PACKAGES" | tr ' ' '|'))/tests/"
misplaced=$(
  find $SRC_DIRS -type f -name '*.test.*' "${PRUNE[@]}" 2>/dev/null
  find . -maxdepth 1 -type f -name '*.test.*' 2>/dev/null
)
misplaced=$(printf '%s\n' "$misplaced" | sed '/^$/d' | sed 's|^|./|; s|^\./\./|./|' \
            | grep -Ev "$allowed_re" || true)
if [ -n "$misplaced" ]; then
  printf 'MISPLACED UNIT TESTS:\n%s\n' "$misplaced"
  echo "  A unit test lives at <package>/tests/**/*.test.ts, in one of: $UNIT_TEST_PACKAGES"
  echo '  Inside src/ the package build compiles it into dist/; outside those packages it is'
  echo '  testing a layer this repo proves by running (CLAUDE.md §8).'
  fail=1
fi

# ── 2. (retired 2026-08-27) Source files over ~300 lines ────────────────────
# Replaced by Biome `style/noExcessiveLinesPerFile` at maxLines 300, which does the same job
# as a LINT RULE — CLAUDE.md §8 mechanism order puts a lint rule above a script. It is faster,
# reports in the editor as you type, and is not blind the way this grep was: SRC_DIRS listed
# only "apps packages tests scripts", so the 3,400-line render harness under docs/ passed
# green for months. Biome sees the whole tree; configs and that harness are excluded in
# biome.json deliberately, by name. One behaviour change, accepted: Biome counts CODE lines,
# so comments no longer push a file over. Measured 2026-08-27 — zero files in the tree differ
# between the two.

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
# by a DIGIT to count: a `rgb(${mix(r)},…)` call is RN's
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
#
# TWO MORE THINGS ARE NOT STYLING VALUES, and both were firing. The gate's job is "no raw colour
# as a STYLING value", so each is stripped by SHAPE — never by path, which would blind the file:
#
#   · A HEX INSIDE A SENTENCE. `helper='Enter a 6-digit hex colour, e.g. #1F5FA9'` is UI copy
#     DEMONSTRATING the format the field accepts; there is no token for it because it is not a
#     colour, it is a word. The strip is deliberately narrow: the quoted string must start
#     sentence-cased (`[A-Z][a-z]`) AND contain a space. No CSS or RN colour value has that
#     shape — `'#ff0000'`, `'2px solid #ff0000'`, `'bg-[#ff0000]'`, `'0 1px 2px #00ff00'` and
#     every template literal all still fire, so `color: '#ff0000'` is as caught as it ever was.
#
#   · A FULLY TRANSPARENT STOP. `rgba(255,255,255,0)` at alpha ZERO carries no colour — it is the
#     "nothing here" end of a gradient, and the design system's own --glow-brand spells it exactly
#     that way (ds tokens/colors.css). `transparent` is NOT a substitute: it means rgba(0,0,0,0),
#     which interpolates through grey and fringes the gradient. Only a literal zero alpha is
#     stripped; rgba(...,0.22) still fires.
COLOUR_PROSE='s{"[A-Z][a-z][^"\n]*[ ][^"\n]*"}{}g; s{\x27[A-Z][a-z][^\x27\n]*[ ][^\x27\n]*\x27}{}g'
COLOUR_ZERO_ALPHA='s{\b(?:rgba|hsla)\([^()\n]*,[[:space:]]*0(?:\.0+)?[[:space:]]*\)}{}g'
# The ONE path exemption, and it is a whole file that holds nothing but data. BrandColorField's
# preset swatches are the starting points an operator picks their OWN company's colour from —
# tenant data, not our styling — so @heliogrid/theme cannot hold them: it is GENERATED from the
# design system (ds:pull) and never hand-transcribed. Keeping them in a file of their own is what
# makes the exemption narrow: every styling line in BrandColorField beside it stays covered.
# One exact path per line; `grep -vxF` drops whole lines, so a near-miss path exempts nothing.
COLOUR_DATA_FILES='packages/ui/src/components/BrandColorField/brand-swatches.ts'
for d in $COLOUR_DATA_FILES; do
  [ -e "$d" ] || { printf 'CONFIG ROT: COLOUR_DATA_FILES names "%s", which does not exist.\n' "$d"; fail=1; }
done
hex=$(for f in $(grep -rlE "$COLOUR" $UI_DIRS --include='*.ts' --include='*.tsx' \
                   --include='*.mts' --include='*.cts' --include='*.jsx' --include='*.css' \
                   --exclude-dir='_generated' 2>/dev/null \
                 | grep -vxF "$COLOUR_DATA_FILES"); do
        perl -0pe "s{/\*.*?\*/}{}gs; $COLOUR_PROSE; $COLOUR_ZERO_ALPHA" "$f" | grep -nE "$COLOUR" \
          | grep -vE '^[0-9]+:[[:space:]]*(//|\*)' | sed "s|^|$f:|"
      done)
if [ -n "$hex" ]; then
  printf 'RAW COLOUR in a UI path — use a token from @heliogrid/theme:\n%s\n' "$hex"
  echo '  Tokens come from @heliogrid/theme, which is GENERATED from the live design'
  echo '  system (docs/engineering/17 §6). Only packages/theme/src/_generated — the pulled DS source'
  echo '  itself — is exempt. See .claude/rules/ui-adherence.md.'
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
# packages/ui IS SCANNED. It was not, and it is where the copy actually is: the package holds
# no i18n dependency by design, so every string it renders must arrive as a prop. Leaving it
# unscanned meant the one package that must hold no English was the only one nobody checked.
#
# COPY_DEBT lists files that are NOT yet wrapped, each of which becomes a required prop on the
# component's one <Name>.types.ts — a design-system change that alters both platform halves and
# every call site together (Law 7), sequenced with the design-system work rather than here. The
# debt is LISTED rather than invisible, and a NEW file gets no grace. The real mechanism is the
# TranslatedText brand (mechanisms.md M50), which makes a bare string a compile error and retires
# this list wholesale.
#
# Each entry is checked to EXIST: a debt file that was deleted or renamed must break this gate,
# not silently keep an exemption alive.
COPY_DEBT='packages/ui/src/components/ActivityStream/ActivityStream.native.tsx|packages/ui/src/components/BrandColorField/BrandColorSpecimen.native.tsx|packages/ui/src/components/BrandColorField/BrandColorSpecimen.tsx|packages/ui/src/components/Checklist/ChecklistRow.tsx|packages/ui/src/components/CompareGrid/CompareGridTable.tsx|packages/ui/src/components/CompareGrid/CompareValueCell.tsx|packages/ui/src/components/DataTable/DataTableHead.tsx|packages/ui/src/components/DocumentPreview/DocumentBands.native.tsx|packages/ui/src/components/DocumentPreview/DocumentBands.tsx|packages/ui/src/components/DocumentPreview/DocumentHeader.native.tsx|packages/ui/src/components/DocumentPreview/DocumentHeader.tsx|packages/ui/src/components/DrawingSheet/DrawingSheetParts.tsx|packages/ui/src/components/FilterBar/FacetChips.tsx|packages/ui/src/components/PagedDocument/DocumentSheet.tsx|packages/ui/src/components/RichText/RichTextToolbar.tsx|packages/ui/src/components/Stepper/StepperNumbered.tsx|packages/ui/src/components/Wordmark/Wordmark.native.tsx|packages/ui/src/components/Wordmark/Wordmark.tsx'
for d in $(printf '%s' "$COPY_DEBT" | tr '|' ' '); do
  [ -e "$d" ] || { printf 'CONFIG ROT: COPY_DEBT names "%s", which does not exist.\n' "$d"; fail=1; }
done
copy=$(grep -rnE ">[[:space:]]*[A-Z][a-z]{3,}[^<>{}]*<" \
         apps/web/app apps/web/features apps/mobile/src/screens packages/ui/src --include='*.tsx' \
         --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null \
       | grep -vE '<Trans|i18n\._|aria-|placeholder=|^[^:]+:[0-9]+:[[:space:]]*(//|\*)' \
       | grep -vE "^($COPY_DEBT):")
if [ -n "$copy" ]; then
  printf 'UNWRAPPED USER-VISIBLE COPY (EN/HI/MR — docs/prd/foundations/F3-localization.md):\n%s\n' "$copy"
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
  printf 'UNTRANSLATED MESSAGES (docs/prd/foundations/F3-localization.md — EN/HI/MR):\n'
  printf "$untranslated"
  echo '  `lingui extract` only proves catalogs are FRESH. An empty msgstr survives it, and'
  echo '  compiles, and renders English to a Hindi or Marathi user.'
  fail=1
fi

# ── 8. (retired 2026-08-19) Screens compose from @heliogrid/ui ──────────────
# Checked that no feature screen used the pre-component `.hg-*` scaffold instead of the
# design system. Both sides of that comparison are gone: the v1 packages/ui was deleted and
# globals.css no longer defines `.hg-*`. Restore it — matching whatever the V2 scaffold is
# called, if there is one — in the change that creates packages/ui (docs/engineering/17 §5 step 2).

# ── 9. Every contract UI language is fully REGISTERED in packages/i18n ──────
# `UI_LANGUAGES` in packages/contracts/src/locale.ts is the one place the set is written.
# Two of the three registrations it implies are held by TYPES — LANGUAGE_META and
# CATALOG_LOADERS are `satisfies Record<UiLanguage, …>`, so a new language fails typecheck
# until both exist. The THIRD cannot be: the Hermes plural-rule data is a bare side-effect
# import, referenced by nothing, so no type and no lint rule can see that it is missing.
# It would fail on a device, mid-sentence, as English plural rules applied to Hindi.
#
# So this reads the tuple and greps for the import line. It is a grep in an existing gate,
# not a new script (CLAUDE.md §8 mechanism order) — and it derives its expectation from the
# source of truth rather than restating the list, so it cannot rot into a fourth locale list.
LOCALE_FILE='packages/contracts/src/locale.ts'
RN_ENTRY='packages/i18n/src/rn/index.ts'
if [ -e "$LOCALE_FILE" ] && [ -e "$RN_ENTRY" ]; then
  langs=$(sed -n "/UI_LANGUAGES = \[/,/\] as const/p" "$LOCALE_FILE" | grep -oE "'[a-z-]+'" | tr -d "'")
  [ -n "$langs" ] || { printf 'CONFIG ROT: could not read UI_LANGUAGES from %s.\n' "$LOCALE_FILE"; fail=1; }
  unregistered=''
  for lang in $langs; do
    grep -q "intl-pluralrules/locale-data/$lang'" "$RN_ENTRY" \
      || unregistered="${unregistered}  ${lang}: no plural-rule data import in ${RN_ENTRY}\n"
  done
  if [ -n "$unregistered" ]; then
    printf 'UI LANGUAGE NOT FULLY REGISTERED (packages/contracts/src/locale.ts is the source):\n'
    printf "$unregistered"
    echo '  Add the @formatjs/intl-pluralrules/locale-data import. Without it Hermes falls'
    echo '  back to English plural rules and the UI is silently wrong, not broken.'
    fail=1
  fi
else
  printf 'CONFIG ROT: check 9 names a file that does not exist (%s or %s).\n' "$LOCALE_FILE" "$RN_ENTRY"
  fail=1
fi

# ── 10. Apps must not declare shared vocabulary ──────────────────────────────
# A string-literal union or a SCREAMING_CASE lookup object IS a shared vocabulary: it belongs
# to packages/contracts (enums, wire shapes) or packages/domain (policy). An app that declares
# its own creates a second source of truth that drifts silently — the exact defect the package
# split exists to prevent. Biome's noEnum bans the `enum` form on apps/**; these two shapes
# have no Biome rule (noRestrictedTypes restricts type NAMES, not declaration SHAPES), so they
# are matched here.
#
# EXPORTED only, deliberately: a type nothing can import cannot become a second source of
# truth. `NavigationPhase` in the mobile shell and `ValidationSource` in the API's exception
# filter are both file-local state machines, and both are correct as written (checked
# 2026-08-27). The defect this check exists for is a vocabulary that LEAKS.
app_vocab=$(
  find apps -type f \( -name '*.ts' -o -name '*.tsx' \) "${PRUNE[@]}" \
    -not -name '*.d.ts' 2>/dev/null \
  | while IFS= read -r f; do
      grep -nE "^[[:space:]]*export[[:space:]]+type[[:space:]]+[A-Za-z0-9_]+[[:space:]]*=[[:space:]]*'[^']+'[[:space:]]*\|" "$f" \
        | sed "s|^|  UNION    ${f}:|"
      grep -nE "^[[:space:]]*export[[:space:]]+const[[:space:]]+[A-Z][A-Z0-9_]+[[:space:]]*=[[:space:]]*\{" "$f" \
        | sed "s|^|  AS-CONST ${f}:|"
      # A POLICY NUMBER is shared vocabulary too, and it was the hole this check left open:
      # `export const GST_RATE = 0.18` passed every gate in the repo (measured 2026-09-03).
      # Biome's noMagicNumbers stops the INLINE form (`n * 1.18`) and by design accepts a named
      # constant — which is exactly this shape. The two together close the pair.
      # Numeric only: a string constant in an app is usually a local key, and widening this to
      # strings fires on legitimate ones while catching nothing the union check misses.
      grep -nE "^[[:space:]]*export[[:space:]]+const[[:space:]]+[A-Z][A-Z0-9_]+[[:space:]]*(:[^=]+)?=[[:space:]]*-?[0-9]" "$f" \
        | sed "s|^|  POLICY-N ${f}:|"
    done)
if [ -n "$app_vocab" ]; then
  printf 'APP DECLARES SHARED VOCABULARY — it belongs in a package, not an app:\n%s\n' "$app_vocab"
  echo '  Union of string literals  -> packages/contracts (it is an enum by another name)'
  echo '  SCREAMING_CASE lookup     -> packages/domain (policy) or packages/contracts (wire)'
  echo '  SCREAMING_CASE number     -> packages/domain (policy) or the market pack (a market fact)'
  echo '  Import it back into the app; never re-declare it (Law 5, CLAUDE.md §6).'
  fail=1
fi

# ── 10c. A role name and a query belong to their owner ───────────────────────
# Two facts a consumer can WRITE rather than import, both measured uncaught 2026-09-03.
#
#   * A ROLE PRESET literal outside domain/contracts is a permission decision taken where the
#     permission model cannot see it. `docs/engineering/architecture.md` §4: "A capability or a
#     visibility scope is ALWAYS domain — never an `if role === …` in a handler." The preset
#     list is CLOSED and lives in `packages/domain/src/authz/roles.ts`, which is what makes a
#     grep the right shape here: twelve exact strings, no guessing.
#   * A SQL verb in an app is a query outside `packages/db`, which owns schema, tenancy
#     predicates and the index-backed reads CLAUDE.md §8 requires.
#
# Both cost ZERO on the day they landed — the apps were empty. That is the only cheap moment
# a rule like this ever has.
ROLE_PRESETS_RE="epc_owner|sales_manager|sales_executive|survey_engineer|design_engineer|project_manager|field_technician|installation_team_member|hr_admin|finance|operations|marketing"

role_literals=$(git ls-files apps packages 2>/dev/null | grep -E '\.tsx?$' \
  | grep -v '^packages/domain/\|^packages/contracts/' \
  | xargs grep -nE "'(${ROLE_PRESETS_RE})'" 2>/dev/null)
if [ -n "$role_literals" ]; then
  printf 'ROLE NAME WRITTEN OUTSIDE THE PERMISSION MODEL:\n%s\n' "$role_literals"
  echo '  A capability is ALWAYS packages/domain. Call can(roles, capability) — never compare a'
  echo '  role string, which puts the decision where the matrix cannot see it.'
  fail=1
fi

app_sql=$(git ls-files apps 2>/dev/null | grep -E '\.tsx?$' \
  | xargs grep -niE "'(select |insert into |update .* set |delete from )" 2>/dev/null)
if [ -n "$app_sql" ]; then
  printf 'SQL IN AN APP — queries belong to packages/db:\n%s\n' "$app_sql"
  echo '  packages/db owns schema, the tenant predicate and the index-backed read. A query'
  echo '  written in an app carries none of them.'
  fail=1
fi

# ── 10b. A branded type is never obtained by casting ─────────────────────────
# A brand makes a shared fact unspeakable outside its owner (CLAUDE.md §8): `Money` has one
# constructor, so `total * 1.18` in a screen is a compile error. TypeScript's one hole is a
# cast — `x as Money` compiles — which is why the cast is a DEFECT outside the owning package
# and not a shortcut. Unlike a formula, it is one exact string, so a grep is the right shape
# of check here.
#
# The registry is declared EMPTY on purpose (2026-09-03): brands land with the slices that
# create them, and a rule authored after its first violation has already been broken once.
# This is the same reason the domain-purity rules existed before packages/domain did.
# Add `<Brand>:<owning path prefix>` as each one lands.
BRANDS=''   # e.g. 'Money:packages/domain/ TranslatedText:packages/i18n/'

cast_escapes=''
for entry in $BRANDS; do
  brand="${entry%%:*}"; owner="${entry#*:}"
  hits=$(git ls-files apps packages | grep -E '\.tsx?$' \
         | grep -v "^${owner}" \
         | xargs grep -nE "\bas[[:space:]]+(unknown[[:space:]]+as[[:space:]]+)?${brand}\b" 2>/dev/null)
  [ -n "$hits" ] && cast_escapes="${cast_escapes}${hits}
"
done
if [ -n "$(printf '%s' "$cast_escapes")" ]; then
  printf 'BRAND OBTAINED BY CAST — the one hole in an unspeakable fact:\n%s\n' "$cast_escapes"
  echo '  Call the owning package'"'"'s constructor instead. A cast re-opens exactly what the'
  echo '  brand was added to close (CLAUDE.md §8, architecture.md §4).'
  fail=1
fi

# ── 11. A control must not declare a shrink range ────────────────────────────
# `width: 48px` with `min-width: 44px` tells the browser "48 is what I want, 44 is what I will
# accept". In a flex row it takes the 44 — silently, and the touch-target check then measures 44
# and PASSES, so nothing downstream reports it.
#
# Either value is a defect on its own terms: in a flex context it is a silent shrink, and
# outside one the smaller min-* is dead code. Wrap the row, or set `flex-shrink: 0`.
#
# This is the one of the four render-harness probes that does NOT need a browser — the CSS
# declares the shrink range itself, so it is caught here rather than at runtime. The other
# three (empty containers, Devanagari overflow, the quiet role on load-bearing text) need
# computed layout or human judgement: docs/engineering/harness/README.md owns those.
shrink_range=$(
  find packages/ui/src -type f -name '*.css' 2>/dev/null \
  | while IFS= read -r f; do
      awk -v F="$f" '
        function num(s,   t) {
          if (match(s, /:[ \t]*[0-9]+px/)) { t = substr(s, RSTART, RLENGTH); gsub(/[^0-9]/, "", t); return t + 0 }
          return 0
        }
        /\{[ \t]*$/ { sel = $0; sub(/[ \t]*\{[ \t]*$/, "", sel); line = NR; w = 0; mw = 0; h = 0; mh = 0; pinned = 0; next }
        /^[ \t]*width:[ \t]*[0-9]+px/      { w  = num($0) }
        /^[ \t]*min-width:[ \t]*[0-9]+px/  { mw = num($0) }
        /^[ \t]*height:[ \t]*[0-9]+px/     { h  = num($0) }
        /^[ \t]*min-height:[ \t]*[0-9]+px/ { mh = num($0) }
        /^[ \t]*flex-shrink:[ \t]*0/       { pinned = 1 }
        /^[ \t]*\}/ {
          if (pinned) { w = 0; mw = 0; h = 0; mh = 0; pinned = 0; next }
          if (w > 0 && mw > 0 && mw < w) printf "  %s:%d  %s  declares width:%dpx but accepts min-width:%dpx\n", F, line, sel, w, mw
          if (h > 0 && mh > 0 && mh < h) printf "  %s:%d  %s  declares height:%dpx but accepts min-height:%dpx\n", F, line, sel, h, mh
          w = 0; mw = 0; h = 0; mh = 0; pinned = 0
        }
      ' "$f"
    done)
if [ -n "$shrink_range" ]; then
  printf 'CONTROL DECLARES A SHRINK RANGE — it will render smaller than designed, silently:\n%s\n' "$shrink_range"
  echo '  A control never renders below the size it was designed at. Let the row wrap, or set'
  echo '  flex-shrink: 0 — then a container that is too narrow is VISIBLE instead of silent.'
  echo '  (.claude/rules/ui-adherence.md — what a static gate cannot see)'
  fail=1
fi

[ "$fail" = "0" ] && echo 'adherence OK — unit tests correctly placed, no raw hex in UI, domain pure, copy wrapped + translated, every UI language registered, no app-declared vocabulary, no brand obtained by a cast, no control declaring a shrink range'
exit $fail
