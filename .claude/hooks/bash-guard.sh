#!/usr/bin/env bash
# PreToolUse:Bash — raises the cost of an ACCIDENT. Exit 2 = block.
#
# HONEST SCOPE, because overstating it is how the rules below rotted: no regex over a command
# string can be complete. A determined path always exists (a heredoc into node, an alias, a
# shell function). What this file buys is that the idioms an agent reaches for BY DEFAULT stop
# working, loudly, with a reason. The real enforcement for the rules that have one lives at
# merge: `scripts/check-adherence.sh` in `pnpm lint` for test files, CI's git diff for
# migrations. Never cite this hook as proof a rule holds.
set -uo pipefail

payload=$(cat)
cmd=$(printf '%s' "$payload" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try { process.stdout.write(JSON.parse(s).tool_input?.command ?? ""); }
    catch { process.stdout.write(""); }
  });
')
# Fail CLOSED if the payload could not be parsed at all. `node` is on a profile-injected PATH
# in this installation (nvm), not a guaranteed absolute one, and a hook that exits 0 when its
# parser is missing silently allows everything it exists to deny.
if [ -z "$cmd" ]; then
  printf 'BLOCKED by .claude/hooks/bash-guard.sh: could not read the command (is `node` on PATH?). Failing closed.\n' >&2
  exit 2
fi

deny() {
  printf 'BLOCKED by .claude/hooks/bash-guard.sh: %s\n' "$1" >&2
  exit 2
}

# A command position is start-of-string, after a separator (| ; & and doubled forms), after an
# opening subshell paren, or after a shell keyword — `(git push …)` and
# `if …; then git push; fi` are command positions too, and the original anchor saw neither.
# `-exec`/`-execdir` and a backtick are command positions too: `find . -exec sed -i …` and
# `` `sed -i …` `` both run the tool, and neither is a | ; & or paren.
CMDPOS='(^|[|;&(`]|[[:space:]](then|else|do)[[:space:]]|[[:space:]]-exec(dir)?[[:space:]])[[:space:]]*'
# What may sit BETWEEN a command position and the tool name without changing which tool runs:
# env-var assignments and wrapper commands. Without this, `env sed -i`, `command git push`,
# `sudo sed -i` and `FOO=1 git push` all walked past every rule in this file.
# `xargs` belongs here for the same reason as `env`: `grep -rl old . | xargs sed -i ''` is THE
# standard bulk in-place rewrite, and it walked past the rule docs/17 calls its only mechanism.
WRAP='([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+|(env|command|exec|nohup|time|sudo|builtin|stdbuf|xargs)([[:space:]]+-[^[:space:]]+)*[[:space:]]+)*'
# An absolute or relative PATH to the tool. `/usr/bin/sed -i` was demonstrated performing a
# real in-place rewrite past this hook — and this environment's own guidance pushes agents
# toward absolute paths, so the single most-encouraged idiom was the one that bypassed
# everything. Tool identity is the BASENAME, never the string someone typed.
BIN='([^[:space:]|;&]*/)?'
# End of a token. `$` and whitespace are not enough: `git push; fi` and `x > a.test.mts; ls`
# end their token with a separator, and requiring whitespace let both through.
END='([[:space:];|&)]|$)'

# In-place stream edits have corrupted files in the predecessor repo (CLAUDE.md §Process).
# Match the FLAG CLUSTER, not a lone `-i` token: requiring whitespace after `-i` missed every
# idiom anyone actually types — `perl -pi -e` (the flag is `-pi`), `sed -i.bak` and `sed -i''`
# (BSD sed on macOS, this repo's dev platform, requires the suffix), `--in-place`.
# `[^[:alnum:]]` accepts all of those while `-E`, `-n`, `-e`, `-ne` still do not match: a
# cluster only counts when `i` is its last letter. ruby and awk are here because `ruby -pi -e`
# and `awk -i inplace` are the same idiom under a different name.
INPLACE_TOOLS='(sed|gsed|perl|python[0-9.]*|ruby|awk|gawk)'
if printf '%s' "$cmd" | grep -Eq "${CMDPOS}${WRAP}${BIN}${INPLACE_TOOLS}[[:space:]]+([^|;&]*[[:space:]])?(--in-place|-[a-zA-Z]*i([^[:alnum:]]|$))"; then
  deny "in-place stream edits (sed -i / perl -i / ruby -pi / awk -i inplace) are banned — they have corrupted files in this codebase. Use the Edit or Write tool instead."
fi

# `git` may carry any run of GLOBAL options before the subcommand. The previous version
# enumerated six (-c -C --git-dir --work-tree --no-pager --exec-path), so `git -P push` and
# `git --paginate push` slipped every rule below. Match the SHAPE — dash-led tokens, each
# optionally taking a value — instead of a list that goes stale the next time git adds one.
GIT="${BIN}git([[:space:]]+-{1,2}[^[:space:]]+([[:space:]]+[^-][^[:space:]]*)?)*[[:space:]]+"

# Force-pushing main destroys shared history. Anchored at a command position for the same
# reason as above — a commit message that MENTIONS a force push is not a force push.
if printf '%s' "$cmd" | grep -Eq "${CMDPOS}${WRAP}${GIT}push([[:space:]]+[^|;&]*)?[[:space:]]+(--force|-f)([[:space:]]|$)" \
  && printf '%s' "$cmd" | grep -Eq '(^|[[:space:]])main([[:space:]]|$|:)'; then
  deny "force-pushing main is not allowed. Push a branch and open a PR (docs/foundation-redesign.md §8)."
fi

# Git stays manual (CLAUDE.md §Process): pushes and PRs happen only when the user asks.
# The user's own terminal is unaffected — this guards the agent, not the human.
if printf '%s' "$cmd" | grep -Eq "${CMDPOS}${WRAP}${GIT}push${END}"; then
  deny "git push is manual. Push only when the user explicitly asks — never on your own initiative (CLAUDE.md §Process)."
fi
if printf '%s' "$cmd" | grep -Eq "${CMDPOS}${WRAP}${BIN}gh[[:space:]]+(pr[[:space:]]+(create|merge|ready)${END}|api[^|;&]*(pulls|merges))"; then
  deny "opening or merging a PR is manual — including via \`gh api\`. Do it only on an explicit user command (CLAUDE.md §Process)."
fi

# Test files are not authored here — close the shell-redirect route that write-guard
# (which only sees Edit/Write file_path) cannot see. Any extension, not the ts/tsx/js/jsx
# four: `.test.mts` and `.spec.cjs` are test files too.
#
# The REDIRECT rule is independent of the writer command. Enumerating `cat|echo|printf|tee`
# meant `node -e … > x.test.ts`, `python … > x.test.ts` and every other producer wrote freely;
# what makes it a test file is the TARGET, not who wrote it. `>|` (clobber) counts, an
# optional quote around the path counts, and the terminator is END — a `;` after the filename
# was the same bug already fixed for git eleven lines above and not applied here.
test_target="\\.(test|spec)\\.[a-zA-Z]+[\"']?${END}"
if printf '%s' "$cmd" | grep -Eq ">\\|?[[:space:]]*[\"']?[^[:space:];|&\"']*${test_target}" \
  || printf '%s' "$cmd" | grep -Eq "${CMDPOS}${WRAP}${BIN}(touch|cp|mv|install|dd|tee|ln)[[:space:]]+[^|;&]*${test_target}" \
  || printf '%s' "$cmd" | grep -Eq "[[:space:]]-[oO][[:space:]]+[\"']?[^[:space:];|&\"']*${test_target}"; then
  deny "test files are not authored in this repo (owner directive 2026-07-29). Features are verified by RUNNING them — see /verify-app. Ask the owner before adding any test."
fi

# Applied migrations are append-only, and RENAMING one edits it as surely as opening it.
# write-guard only sees Edit/Write file_paths and only denies paths git already tracks, so a
# `git mv 0001_foundation.sql 0001_foundation.v2.sql` left the new path untracked and free to
# author. CI's `--diff-filter=MD` does not see an R either. This closes the author-time route.
# The REDIRECT and `cp` routes are closed here for the same reason as test files, ten lines
# above: this rule was written from that premise and then omitted both. `echo … >
# 0001_foundation.sql` and `cp /tmp/x.sql packages/db/migrations/0001_foundation.sql` rewrite an
# applied migration without ever calling it a rename.
MIGRATION_PATH='[^|;&]*packages/db/migrations/'
if printf '%s' "$cmd" | grep -Eq "${CMDPOS}${WRAP}${BIN}(mv|rename|cp|install|dd)[[:space:]]+${MIGRATION_PATH}" \
  || printf '%s' "$cmd" | grep -Eq "${CMDPOS}${WRAP}${GIT}(mv|rm)[[:space:]]+${MIGRATION_PATH}" \
  || printf '%s' "$cmd" | grep -Eq ">\\|?[[:space:]]*[\"']?${MIGRATION_PATH}"; then
  deny "shell writes into packages/db/migrations/ are blocked. Applied migrations are append-only and sha256-locked by the runner (packages/db/CLAUDE.md), and this hook cannot tell an applied file from a new one. Author a NEW migration with the Write tool — write-guard.sh allows that and denies only paths git already tracks."
fi

# Destructive recursive deletes outside the repo.
#
# This rule was left on the ORIGINAL anchor and terminator when the four primitives above were
# introduced — the only one of six not migrated — and it missed 21 of 25 destructive spellings:
# `rm -rf /*` (the canonical catastrophic form: `/*` is not `/` followed by space-or-end),
# `sudo rm -rf /`, `/bin/rm -rf $HOME`, `rm -rf ~/Documents`, `rm -rf "/"`, `rm -rf /;`,
# `rm -rf -- /`, `rm --recursive --force /`, and `rm -rf /Volumes/...` — an absolute path
# OUTSIDE the repo, which is how a sibling checkout or a whole worktree gets destroyed.
#
# Shape, not enumeration: any `rm` at a command position (paths and wrappers included) whose
# flags request recursion in any spelling, targeting anything that is not clearly repo-relative.
# `--` is skipped as a separator; a quote may open the path; the target may end at ANY
# separator, not only whitespace.
RM_RECURSIVE='(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)'
RM_TARGET='["'"'"']?(/|~|\$HOME|\$\{HOME\})'
# Session scratch directories are EXEMPT: agents are explicitly instructed to work in them and
# they exist to be discarded. Without this the rule fires on routine cleanup, and a gate that
# blocks sanctioned work is one people learn to route around — the failure mode this whole
# audit keeps finding. `..` anywhere disables the exemption so it cannot be used to escape.
SCRATCH='["'"'"']?((/private)?/tmp/|/var/folders/)'
if { printf '%s' "$cmd" | grep -Eq "${CMDPOS}${WRAP}${BIN}rm([[:space:]]+(-{1,2}[a-zA-Z-]+))*[[:space:]]+${RM_RECURSIVE}([[:space:]]+(-{1,2}[a-zA-Z-]+|--))*[[:space:]]+${RM_TARGET}" \
    || printf '%s' "$cmd" | grep -Eq "${CMDPOS}${WRAP}${BIN}rm([[:space:]]+(-{1,2}[a-zA-Z-]+|--))*[[:space:]]+${RM_TARGET}[^[:space:];|&]*[[:space:]]*${RM_RECURSIVE}"; } \
  && ! { printf '%s' "$cmd" | grep -Eq "rm[^|;&]*[[:space:]]${SCRATCH}" \
         && ! printf '%s' "$cmd" | grep -q '\.\.'; }; then
  deny "recursive delete targeting an absolute path, \$HOME or ~. Scope the path inside the repository (or a /tmp scratch dir) — and prefer a named subdirectory over a glob."
fi

exit 0
