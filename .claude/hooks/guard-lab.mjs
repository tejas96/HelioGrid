import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * The lab `guard-suite.mjs` runs in: a throwaway git repository in the system temp folder, on a
 * task branch that tracks its own bare origin, and the calls that feed the real hook the events
 * Claude Code sends. Nothing here touches the repository the suite is run from.
 */
const HOOK = join(import.meta.dirname, 'guard.mjs');
export const LAB = mkdtempSync(join(tmpdir(), 'guard-suite-'));
export const repo = join(LAB, 'repo');
export const record = join(repo, '.qa', 'guard', 'feat__T-ZZ-001.jsonl');
export const say = (line) => process.stdout.write(`${line}\n`);
export const sh = (args, cwd = repo) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
export const lab = (...args) => sh(['-c', 'user.email=lab@x', '-c', 'user.name=lab', ...args]);
export const setRouting = (from, to) =>
  writeFileSync(
    join(repo, '.env.local'),
    readFileSync(join(repo, '.env.local'), 'utf8').replaceAll(from, to),
  );
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The teardown cases open a listener on 3100; a listener already there would fail them falsely.
const portBusy = spawnSync('lsof', ['-nP', '-iTCP:3100', '-sTCP:LISTEN']).stdout.length > 0;
if (portBusy) {
  say('port 3100 is in use — free it, then run the suite again');
  process.exit(1);
}

mkdirSync(join(repo, 'docs/tasks'), { recursive: true });
writeFileSync(join(repo, 'app.ts'), 'code\n');
writeFileSync(join(repo, 'docs/tasks/M01.md'), 'task\n');
writeFileSync(
  join(repo, '.env.local'),
  'DATABASE_URL=postgres://u:p@h:1/heliogrid_test\nDATABASE_ADMIN_URL=postgres://u:p@h:1/heliogrid_test\n',
);
writeFileSync(join(repo, '.gitignore'), '.qa/\n.env.local\n');
sh(['init', '-q', '-b', 'main']);
sh(['add', '-A']);
lab('commit', '-q', '-m', 'init');
mkdirSync(join(LAB, 'remote.git'));
sh(['init', '-q', '--bare'], join(LAB, 'remote.git'));
sh(['remote', 'add', 'origin', join(LAB, 'remote.git')]);
sh(['push', '-q', 'origin', 'main']);
// A real task branch tracks origin/main from its first moment (references/runtime.md).
sh(['switch', '-q', '-c', 'feat/T-ZZ-001', '--track', 'origin/main']);

let failures = 0;
export const failureCount = () => failures;
export function hook(event) {
  const result = spawnSync('node', [HOOK], {
    input: JSON.stringify({ cwd: repo, ...event }),
    encoding: 'utf8',
  });
  if (result.status !== 0) return `crash: ${result.stderr.slice(0, 200)}`;
  const out = result.stdout.trim();
  if (out === '') return 'allow';
  const o = JSON.parse(out);
  return o.decision === 'block'
    ? `block: ${o.reason}`
    : `deny: ${o.hookSpecificOutput.permissionDecisionReason}`;
}
export function expect(name, got, want) {
  const refused = got.startsWith('deny') || got.startsWith('block');
  const ok = want === 'allow' ? got === 'allow' : refused && got.includes(want);
  if (!ok) failures++;
  say(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` — got ${got.replaceAll('\n', ' | ')}`}`);
}
export function holds(name, got, want) {
  if (got !== want) failures++;
  say(`${got === want ? 'ok  ' : 'FAIL'} ${name}`);
}
export const bash = (command, extra = {}) =>
  hook({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command }, ...extra });
export const after = (command, extra = {}) =>
  hook({ hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command }, ...extra });
export const helper = (type, id = 't') => ({
  agent_id: `agent-${type}`,
  agent_type: type,
  tool_use_id: id,
});
export const stop = (type, verdict) =>
  hook({
    hook_event_name: 'SubagentStop',
    agent_id: `agent-${type}`,
    agent_type: type,
    last_assistant_message: `verdict: ${verdict}`,
  });
export const commit = () => bash('git commit -m x');
export const gate = (output = 'Tasks: 9 successful, 9 total') => {
  const first = bash('pnpm check:all', helper('evaluator'));
  after('pnpm check:all', { ...helper('evaluator'), tool_response: { stdout: output } });
  return first;
};
