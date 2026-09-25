#!/usr/bin/env bash
# One red proof, restored the only safe way (`.claude/rules/testing.md`): the file is copied aside,
# broken, the guarding test runs, and the saved copy is copied BACK — never undone by a reverse
# edit, which can land on another occurrence and leave a break behind. The tree is compared before
# and after, and a tree that did not come back is a failure of the proof itself.
#
#   scripts/break-and-run.sh <file> <runs> -- <break command> -- <test command>
#
# The break command edits <file> in place; the test command runs <runs> times against the break.
# Exit 0 only when EVERY run of the test failed (the guard fired each time) and the tree came back.
set -u
file="$1"; runs="$2"; shift 2
[ "${1:-}" = "--" ] || { echo "break-and-run: '--' missing before the break command" >&2; exit 2; }
shift; brk="$1"; shift
[ "${1:-}" = "--" ] || { echo "break-and-run: '--' missing before the test command" >&2; exit 2; }
shift; test_cmd="$1"
root="$(git rev-parse --show-toplevel)"
state() { { git -C "$root" status --porcelain; git -C "$root" diff; } | shasum | cut -c1-12; }
before="$(state)"
saved="$(mktemp)"; cp "$root/$file" "$saved"
(cd "$root" && bash -c "$brk") || { cp "$saved" "$root/$file"; rm -f "$saved"; echo "break-and-run: the break did not apply" >&2; exit 2; }
if cmp -s "$saved" "$root/$file"; then rm -f "$saved"; echo "break-and-run: the break changed nothing" >&2; exit 2; fi
fired=0
for i in $(seq "$runs"); do
  if (cd "$root" && bash -c "$test_cmd") >/dev/null 2>&1; then echo "run $i: GREEN with the rule broken"; else echo "run $i: red"; fired=$((fired + 1)); fi
done
cp "$saved" "$root/$file"; rm -f "$saved"
after="$(state)"
[ "$before" = "$after" ] || { echo "break-and-run: the tree did not come back — restore $file by hand" >&2; exit 3; }
echo "fired $fired of $runs; tree restored"
[ "$fired" -eq "$runs" ]
