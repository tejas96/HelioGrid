/**
 * The guard's rules, kept apart from how it reads the machine: what a command is, what a helper may
 * run, and what a task branch owes before a commit (`.claude/skills/task/SKILL.md` steps 5–8,
 * `references/qa.md`, `.claude/agents/evaluator.md`). A message names the rule that refused.
 */

/** A program run at command position — never one named in an argument, as a search for it is. */
const AT_COMMAND = String.raw`(?:^\s*|[\n;&|(]\s*)(?:\w+=\S*\s+)*(?:(?:timeout\s+\S+|time|env|nice|command)\s+)?(?:\w+=\S*\s+)*`;
const run = (program) => new RegExp(`${AT_COMMAND}${program}`);
export const FULL_GATE = run(String.raw`pnpm\s+(?:run\s+)?check:all\b`);
export const FAST_CHECK = run(String.raw`pnpm\s+(?:run\s+)?check(?![:\w-])`);
export const INVARIANTS = run(String.raw`pnpm\s+--filter\s+@heliogrid\/invariants\s+test\b`);
export const COMMIT = run(String.raw`git\s+(?:-[cC]\s+\S+\s+)*commit\b`);
export const GATE_RUNS_ALLOWED = 2;

export const GUARD_RECORD = /\.qa\/guard\b/;
/**
 * A command that would delete, move or write the guard's record, or wipe `.qa/` whole — a mention of
 * the path, as in a doc being edited, is not one. A script written to change it on purpose is not
 * caught: the guard holds against mistakes, and its record is in the owner's hands.
 */
export const GUARD_TAMPER = new RegExp(
  [
    String.raw`(?:\b(?:rm|mv|cp|truncate|tee|touch)\b|>{1,2}|\b(?:sed|perl)\s+-[a-zA-Z]*i)[^|;&\n]*\.qa\/guard\b`,
    String.raw`\b(?:rm|mv)\b[^|;&\n]*[\s/]\.qa\/?(?:\*|\s|$)`,
    String.raw`\bfind\b[^|;&\n]*\.qa\b[^|;&\n]*-delete`,
    String.raw`\bgit\s+clean\b[^|;&\n]*-[a-zA-Z]*[xX]`,
  ].join('|'),
);

/** The only git and gh calls a helper makes: reading history, a diff, a CI run (`.claude/agents/*.md`). */
const HELPER_GIT =
  /^(?:log|diff|show|status|grep|ls-files|ls-tree|rev-parse|blame|merge-base|cat-file|fetch|shortlog|describe|for-each-ref)$/;
/** `git branch` that only lists or names the current branch — never creating, moving or deleting one. */
const READ_BRANCH =
  /^(?:(?:--show-current|--list|-a|-r|-v|-vv|--all|--remotes|--contains\s+\S+|--(?:no-)?merged(?:\s+\S+)?)\s*)*$/;
const HELPER_GH = /^(?:run\s+(?:list|view)|pr\s+(?:view|checks|diff|list)|api)\b/;
const GH_API_WRITE =
  /\s(?:-f|-F|--field|--raw-field|--input)\b|\s(?:-X|--method)[\s=]*(?!GET\b)\w+/;
const GIT_CALL = new RegExp(
  `${AT_COMMAND}git((?:\\s+-[cC]\\s+\\S+|\\s+--?[\\w-]+(?:=\\S+)?)*)\\s+([\\w-]+)([^|;&]*)`,
  'g',
);
const GH_CALL = new RegExp(`${AT_COMMAND}gh\\s+([^|;&]*)`, 'g');
const HELPER_NEVER = [
  run(String.raw`(?:pnpm|npm|yarn)\s+(?:add|install|i|remove|rm|up|update|link)\b`),
  run(String.raw`pnpm\s+(?:db:|infra:|lint:fix)`),
  /\b(?:sed|perl)\s+-[a-zA-Z]*i/,
];

/** A command that cannot change a file: only readers in its pipeline, no redirect, no output file. */
const READ_ONLY =
  /^(?:\s*(?:cat|grep|rg|head|tail|wc|ls|jq|sort|uniq|cut|tr|git\s+(?:log|diff|show|status|grep|ls-files|rev-parse|blame))\b[^>|;&]*(?:\||$))+\s*$/;
const WRITES_A_FILE = /\s(?:--output\b|-o\b)/;

/** Where a helper's own files may change: the git-ignored QA folder, never the tracked tree. */
const HELPER_WRITES = /^\.qa\//;
/** What the full gate rewrites, which Main then commits (`.claude/agents/evaluator.md`). */
export const GATE_REWRITES =
  /^(?:packages\/contracts\/openapi\/openapi\.json|packages\/i18n\/src\/locales\/)/;

/** Why a helper may not run this command, or `undefined` when it may. */
export function helperRefusal(command) {
  for (const [, , sub, rest] of command.matchAll(GIT_CALL)) {
    const readsBranches = sub === 'branch' && READ_BRANCH.test(rest.trim());
    if (!HELPER_GIT.test(sub) && !readsBranches) return `git ${sub}`;
  }
  for (const [, args] of command.matchAll(GH_CALL)) {
    if (!HELPER_GH.test(args) || (args.startsWith('api') && GH_API_WRITE.test(` ${args}`)))
      return `gh ${args.trim()}`;
  }
  return HELPER_NEVER.find((pattern) => pattern.test(command)) ? command.slice(0, 80) : undefined;
}

export function isReadOnly(command) {
  const plain = command.replace(/2>\s*\/dev\/null/g, '');
  return READ_ONLY.test(plain) && !WRITES_A_FILE.test(plain);
}

/** The paths a helper's command changed that it had no right to. */
export function forbiddenChanges(paths, agentType, command) {
  const gateRun = agentType === 'evaluator' && FULL_GATE.test(command);
  return paths.filter(
    (path) => !HELPER_WRITES.test(path) && !(gateRun && GATE_REWRITES.test(path)),
  );
}

export function verdictOf(message) {
  return /^verdict:\s*([A-Z_]+)/m.exec(message ?? '')?.[1] ?? 'NONE';
}

/**
 * Whether a check passed, read from its own output — no exit code reaches a hook. Output sent to a
 * file or a background run cannot be read, so it does not pass; nor does a skipped or vacuous run.
 */
export function outputPassed(command, output, exitCode, inBackground) {
  if (inBackground === true) return false;
  if (typeof exitCode === 'number' && exitCode !== 0) return false;
  if (/>\s*[^&\s]|&\s*$/.test(command)) return false;
  return !/ERR_PNPM_|ELIFECYCLE|error TS\d|Found [1-9]\d* errors?|Tasks:\s+(\d+) successful, (?!\1 total)|\bSKIP invariants\b|VACUOUS/.test(
    output,
  );
}

/** Why a commit on a task branch is refused; empty when it may go to the owner's prompt. */
export function commitRefusals({ log, now, live, start, pushed }) {
  const refusals = [...violations(log), ...teardownDifferences(live, start)];
  return pushed
    ? [...refusals, ...ciFixProofs(log, now)]
    : [...refusals, ...helperProofs(log), ...gateProofs(log, now)];
}

function violations(log) {
  return log
    .filter((entry) => entry.kind === 'violation')
    .map(
      (v) =>
        `${v.agent} changed ${v.paths.join(', ')} with \`${v.command}\` — a helper changes no repository file; show the owner, who clears .qa/guard/`,
    );
}

/** Every resource the task started is stopped and the routing restored (`references/runtime.md`). */
export function teardownDifferences(live, start) {
  const differences = [];
  if (JSON.stringify(live.databases) !== JSON.stringify(start.databases)) {
    differences.push(
      `the database routing is ${live.databases.join(', ')}; it was ${start.databases.join(', ')}`,
    );
  }
  for (const port of live.listeners.filter((l) => !start.listeners.includes(l))) {
    differences.push(`${port} was opened by the task and still listens`);
  }
  for (const phone of live.phones.filter((p) => !start.phones.includes(p))) {
    differences.push(`${phone} was booted by the task and still runs`);
  }
  return differences;
}

function lastOf(log, kind, match) {
  return log.filter((entry) => entry.kind === kind && match(entry)).at(-1);
}

/**
 * The reviewer's last word is CLEAN and the Evaluator's PASS, both on the code the last gate ran on,
 * and each QA helper's last word is PASS. QA reruns only the rows a fix touched
 * (`references/qa.md`), so a QA PASS is not tied to the final code; the Evaluator re-judges every
 * touched row on it (`.claude/agents/evaluator.md`).
 */
function helperProofs(log) {
  const reviewer = lastOf(log, 'helper', (e) => e.agent === 'reviewer');
  const evaluator = lastOf(log, 'helper', (e) => e.agent === 'evaluator');
  const gate = lastOf(log, 'ran', (e) => e.check === 'gate');
  const refusals = [];
  if (reviewer?.verdict !== 'CLEAN')
    refusals.push(`the reviewer's last verdict is ${reviewer?.verdict ?? 'missing'}, not CLEAN`);
  else if (gate !== undefined && reviewer.reviewed !== gate.reviewed)
    refusals.push(
      "the code changed after the reviewer's CLEAN — continue the reviewer with the fix",
    );
  const qaAgents = new Set(
    log.filter((e) => e.kind === 'helper' && e.agent.startsWith('qa-')).map((e) => e.agent),
  );
  for (const agent of qaAgents) {
    const qa = lastOf(log, 'helper', (e) => e.agent === agent);
    if (qa?.verdict !== 'PASS')
      refusals.push(
        `${agent}'s last verdict is ${qa?.verdict}, not PASS — rerun the rows after the fix`,
      );
  }
  if (evaluator?.verdict !== 'PASS')
    refusals.push(`the Evaluator's last verdict is ${evaluator?.verdict ?? 'missing'}, not PASS`);
  else if (gate !== undefined && evaluator.reviewed !== gate.reviewed)
    refusals.push(
      'the Evaluator did not judge the code the last full gate ran on — continue it for the final run',
    );
  return refusals;
}

/** The last full gate passed on the code as it stands, and the invariants passed on the ledger as it stands. */
function gateProofs(log, now) {
  const gate = lastOf(log, 'ran', (e) => e.check === 'gate');
  const ledger = lastOf(log, 'ran', (e) => e.check === 'gate' || e.check === 'invariants');
  const refusals = [];
  if (gate === undefined) refusals.push('no full gate (`pnpm check:all`) ran on this branch');
  else if (!gate.passed)
    refusals.push('the last full gate did not pass, or its output could not be read');
  else if (gate.code !== now.code)
    refusals.push(
      'code changed after the last full gate — it returns to review, affected QA and the Evaluator',
    );
  if (ledger !== undefined && (!ledger.passed || ledger.tasks !== now.tasks)) {
    refusals.push(
      'the invariants have not passed on docs/tasks as it stands — run `pnpm --filter @heliogrid/invariants test`',
    );
  }
  return refusals;
}

/** A fix after the PR is open: its fast check passed on the code as it stands (`/task` step 7). */
function ciFixProofs(log, now) {
  const check = lastOf(log, 'ran', (e) => e.check === 'check' || e.check === 'gate');
  if (check === undefined || !check.passed) return ['no passing `pnpm check` ran on the fix'];
  if (check.code !== now.code || check.tasks !== now.tasks)
    return ['the fix changed after its last `pnpm check` — run it again'];
  return [];
}
