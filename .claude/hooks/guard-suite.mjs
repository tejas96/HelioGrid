import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  after,
  bash,
  commit,
  expect,
  failureCount,
  gate,
  helper,
  holds,
  hook,
  LAB,
  lab,
  record,
  repo,
  say,
  setRouting,
  sh,
  stop,
  wait,
} from './guard-lab.mjs';
import { COMMIT, FULL_GATE, GUARD_TAMPER, helperRefusal, outputPassed } from './guard-rules.mjs';

/**
 * The task guard's proof: run after any change to `guard*.mjs` — `node .claude/hooks/guard-suite.mjs`.
 * It feeds the real hook the events Claude Code sends, in the throwaway repository `guard-lab.mjs`
 * builds, and checks every refusal and every allowance. A hook that crashes refuses nothing, so a
 * change to the guard is proven here before it lands. Port 3100 must be free while it runs.
 */
const PASSED_GATE = 'Tasks: 9 successful, 9 total';
const LISTENER_ON_3100 = [
  '-e',
  'alarm 20; exec @ARGV',
  '--',
  'python3',
  '-m',
  'http.server',
  '3100',
  '--bind',
  '127.0.0.1',
];
const teardownReport = (extra = {}) =>
  hook({ hook_event_name: 'Stop', last_assistant_message: 'Teardown: all back.', ...extra });

// — the patterns themselves —
holds('a gate on a second line counts', FULL_GATE.test('cd x\npnpm check:all'), true);
holds('a gate after spaces counts', FULL_GATE.test('   pnpm check:all'), true);
holds('a gate under timeout counts', FULL_GATE.test('timeout 900 pnpm check:all'), true);
holds('a gate under env counts', FULL_GATE.test('env CI=1 pnpm check:all'), true);
holds('a gate only mentioned does not count', FULL_GATE.test('rg -n "pnpm check:all" x'), false);
holds('a commit only mentioned does not count', COMMIT.test('rg "git commit"'), false);
holds('wiping .qa by absolute path is refused', GUARD_TAMPER.test(`rm -rf /x/y/${'.qa'}`), true);
holds(
  'a wrapped helper branch -D is refused',
  helperRefusal('timeout 5 git branch -D x') !== undefined,
  true,
);
holds(
  'a background check never passes',
  outputPassed('pnpm check', PASSED_GATE, undefined, true),
  false,
);
holds(
  'a foreground check that passed',
  outputPassed('pnpm check', PASSED_GATE, undefined, false),
  true,
);

// — helpers: what they may and may not run —
const NEVER = 'a helper never runs';
expect('Main starts the branch', bash('ls'), 'allow');
expect('a helper runs git add', bash('git add -A', helper('qa-web')), NEVER);
expect('a helper runs git -c k=v add', bash('git -c core.x=1 add -A', helper('qa-web')), NEVER);
expect('a helper runs git branch -D', bash('git branch -D x', helper('qa-web')), NEVER);
expect(
  'a helper reads the current branch',
  bash('git branch --show-current', helper('qa-web')),
  'allow',
);
expect('a helper runs gh pr merge', bash('gh pr merge 5', helper('reviewer')), NEVER);
expect(
  'a helper posts through gh api -f',
  bash('gh api repos/o/r/issues -f t=x', helper('ci-investigator')),
  NEVER,
);
expect(
  'a helper posts through gh api --method=POST',
  bash('gh api --method=POST repos/o/r', helper('ci-investigator')),
  NEVER,
);
expect('a helper runs pnpm add', bash('pnpm add left-pad', helper('qa-api')), NEVER);
expect('a helper reads a diff', bash('git diff origin/main', helper('reviewer')), 'allow');
expect(
  'a helper reads a CI run',
  bash('gh run view 12 --log-failed', helper('ci-investigator')),
  'allow',
);
expect(
  'a helper reads through gh api',
  bash('gh api repos/o/r/pulls/3', helper('ci-investigator')),
  'allow',
);
expect(
  'a helper taps a device',
  bash("perl -e 'alarm 5; exec @ARGV' -- adb shell input tap 1 2", helper('qa-android')),
  'allow',
);
expect(
  'a search for the gate is not a gate',
  bash('rg -n "pnpm check:all" .claude', helper('reviewer')),
  'allow',
);
expect('a search for a commit is not a commit', bash('rg -n "git commit" .claude'), 'allow');
expect('rm -rf .qa wipes the record', bash(`rm -rf ${'.qa'}`), 'task guard’s record');
expect(
  'find .qa -delete wipes the record',
  bash(`find ${'.qa'} -name x -delete`),
  'task guard’s record',
);

// — writes a helper's command makes —
bash('echo x >> app.ts', helper('qa-ios', 't4'));
appendFileSync(join(repo, 'app.ts'), 'x\n');
after('echo x >> app.ts', helper('qa-ios', 't4'));
bash('python3 crop.py', helper('qa-web', 't5'));
mkdirSync(join(repo, '.qa/board'), { recursive: true });
writeFileSync(join(repo, '.qa/board/f.png'), 'p');
after('python3 crop.py', helper('qa-web', 't5'));
bash('python3 write.py', helper('qa-api', 't6'));
writeFileSync(join(repo, 'failed-write.ts'), 'written by a command that then failed\n');
stop('qa-api', 'FAIL');
bash('sed s/a/b/ .env.local', helper('qa-android', 't7'));
setRouting('heliogrid_test', 'heliogrid_dev');
after('sed s/a/b/ .env.local', helper('qa-android', 't7'));
setRouting('heliogrid_dev', 'heliogrid_test');
stop('reviewer', 'FINDINGS');
const first = commit();
expect('a helper wrote app.ts', first, 'qa-ios changed app.ts');
expect(
  'a failed helper command is checked when the helper stops',
  first,
  'qa-api changed failed-write.ts',
);
expect(
  'a helper changed the database routing',
  first,
  'qa-android changed .env.local (database routing)',
);
expect(
  'a helper writing its own .qa folder is no violation',
  first.includes('qa-web changed') ? 'flagged' : 'allow',
  'allow',
);
expect('review FINDINGS refuses', first, "the reviewer's last verdict is FINDINGS");
expect('a new branch tracking origin/main is not a pushed CI fix', first, 'no full gate');
expect(
  'the searches counted no gate',
  readFileSync(record, 'utf8').includes('gate-start') ? 'counted' : 'allow',
  'allow',
);

// — the owner clears the record; the work starts over clean —
rmSync(join(repo, '.qa/guard'), { recursive: true, force: true });
rmSync(join(repo, 'failed-write.ts'));
sh(['checkout', '-q', '--', 'app.ts']);
bash('ls');
stop('reviewer', 'FINDINGS');
stop('reviewer', 'CLEAN');
stop('qa-web', 'FAIL');
stop('qa-web', 'PASS');
expect('first gate', gate(), 'allow');
stop('evaluator', 'PASS');
expect('a commit after review, QA and the gate', commit(), 'allow');
appendFileSync(join(repo, 'app.ts'), 'a fix nobody reviewed\n');
expect('second gate, on the unreviewed fix', gate(), 'allow');
stop('evaluator', 'PASS');
const unreviewed = commit();
expect('a fix the reviewer never read', unreviewed, "changed after the reviewer's CLEAN");
expect(
  '…but an untouched QA surface need not rerun',
  unreviewed.includes("qa-web's") ? 'demanded' : 'allow',
  'allow',
);
expect('third gate', bash('pnpm check:all', helper('evaluator')), 'a third is never run');
sh(['checkout', '-q', '--', 'app.ts']);
expect(
  'the code back as reviewed, but the gate ran on the fix',
  commit(),
  'code changed after the last full gate',
);

// — a fresh record for the ledger, QA and teardown —
rmSync(join(repo, '.qa/guard'), { recursive: true, force: true });
bash('ls');
stop('reviewer', 'CLEAN');
stop('qa-web', 'PASS');
gate();
stop('evaluator', 'PASS');
expect('clean again', commit(), 'allow');
appendFileSync(join(repo, 'docs/tasks/M01.md'), 'z\n');
expect('the ledger edited after the gate', commit(), 'invariants have not passed');
const invariants = (stdout) =>
  after('pnpm --filter @heliogrid/invariants test', { tool_response: { stdout } });
invariants('SKIP invariants: DATABASE_URL not set');
expect('a skipped invariants run is no pass', commit(), 'invariants have not passed');
invariants('invariants green');
expect('the invariants passed after the edit', commit(), 'allow');
stop('qa-ios', 'FAIL');
expect('qa-ios failed', commit(), "qa-ios's last verdict is FAIL");
stop('qa-ios', 'PASS');
expect('qa-ios passed on the same code', commit(), 'allow');

setRouting('heliogrid_test', 'heliogrid_dev');
expect('the routing left on another database', commit(), 'the database routing is');
setRouting('heliogrid_dev', 'heliogrid_test');
spawn('perl', LISTENER_ON_3100, { stdio: 'ignore', detached: true }).unref();
await wait(1500);
expect('a listener the task opened', commit(), 'port 3100');
expect('a Teardown: report while it runs', teardownReport(), 'Teardown is not done');
expect(
  'the stop right after a block passes (the commit is the hold)',
  teardownReport({ stop_hook_active: true }),
  'allow',
);
expect(
  'an ordinary stop while it runs',
  hook({ hook_event_name: 'Stop', last_assistant_message: 'Waiting for QA.' }),
  'allow',
);
for (let i = 0; i < 40 && commit() !== 'allow'; i++) await wait(1000);
expect('after the listener ends', commit(), 'allow');
expect('a Teardown: report after it ends', teardownReport(), 'allow');

// — a late fix, re-reviewed and re-QA'd, but gated by Main instead of the Evaluator —
appendFileSync(join(repo, 'app.ts'), 'a late fix\n');
stop('reviewer', 'CLEAN');
stop('qa-web', 'PASS');
stop('qa-ios', 'PASS');
bash('pnpm check:all');
after('pnpm check:all', { tool_response: { stdout: PASSED_GATE } });
expect('a gate the Evaluator never judged', commit(), 'the Evaluator did not judge');
stop('evaluator', 'PASS');
expect('the Evaluator continued on that code', commit(), 'allow');

// — a CI fix on the pushed branch —
lab('commit', '-qam', 'part');
sh(['push', '-qu', 'origin', 'feat/T-ZZ-001']);
appendFileSync(join(repo, 'app.ts'), 'fix\n');
expect('a CI fix with no check since', commit(), 'run it again');
after('pnpm check', { tool_response: { stdout: 'Found 2 errors.' } });
expect('a CI fix whose check failed', commit(), 'no passing `pnpm check`');
after('pnpm check > .qa/check.log', { tool_response: { stdout: '' } });
expect('a CI fix whose check output went to a file', commit(), 'no passing `pnpm check`');
after('pnpm check', { tool_response: { stdout: 'Tasks: 23 successful, 23 total' } });
expect('a CI fix whose check passed', commit(), 'allow');

sh(['switch', '-q', '-c', 'chore/other']);
expect('a chore branch commit is not guarded', commit(), 'allow');
rmSync(LAB, { recursive: true, force: true });
say(failureCount() === 0 ? 'ALL PASSED' : `${failureCount()} FAILED`);
process.exitCode = failureCount() === 0 ? 0 : 1;
