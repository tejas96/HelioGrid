import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every guard in `.claude/hooks/` still passes what it must pass and blocks what it must block.
 *
 * A hook is a Python program inside a shell script, and Claude Code reads only its exit code: 2
 * blocks, anything else lets the command through. A hook that breaks — a regex that no longer
 * matches, a tool that moved — lets everything through and says nothing. So each hook is fed the
 * hook input Claude Code would send, for a fixed list of cases, and a broken input that must block.
 * A hook with no cases here fails, so a new guard is enrolled the day it lands.
 */
const HOOKS = '.claude/hooks';
const BLOCKS = 2;
/** Each hook answers in well under a second; one that takes this long is stuck. */
const HOOK_TIMEOUT_MS = 20_000;

type ToolInput = { readonly command: string } | { readonly file_path: string };
interface HookCases {
  readonly pass: readonly ToolInput[];
  readonly block: readonly ToolInput[];
}

const run = (command: string): ToolInput => ({ command });
const edit = (repo: string, file: string): ToolInput => ({ file_path: join(repo, file) });

function casesFor(repo: string): ReadonlyMap<string, HookCases> {
  return new Map<string, HookCases>([
    [
      'block-applied-migration-edit.sh',
      {
        pass: [edit(repo, 'packages/db/migrations/9999_not_applied.sql'), edit(repo, 'README.md')],
        block: [edit(repo, 'packages/db/migrations/0001_market_pack.sql')],
      },
    ],
    [
      'block-lockfile-edit.sh',
      {
        pass: [edit(repo, 'package.json')],
        block: [edit(repo, 'pnpm-lock.yaml'), edit(repo, 'apps/web/package-lock.json')],
      },
    ],
    [
      'block-no-verify.sh',
      {
        pass: [run("git commit -m 'never use --no-verify'"), run('git push -n origin feat/x')],
        block: [run('git commit --no-verify -m x'), run('git commit -n -m x')],
      },
    ],
    [
      'block-main-push.sh',
      {
        pass: [run('git push -u origin feat/x'), run('git stash push')],
        block: [
          run('git push origin main'),
          run('git push --force origin feat/x'),
          run('git push origin +feat/x'),
        ],
      },
    ],
    [
      'block-db-write.sh',
      {
        pass: [
          run(
            'docker exec heliogrid-pg-local psql -U qa_readonly -d heliogrid_dev -qtAc "SELECT 1"',
          ),
          run('grep -n "DELETE FROM" packages/db/src/schema/tenant.ts'),
        ],
        block: [
          run('docker exec heliogrid-pg-local psql -U x -d heliogrid_dev -c "DELETE FROM tenant"'),
          run('psql heliogrid_dev -c "UPDATE tenant SET city = 1"'),
        ],
      },
    ],
    [
      'block-curl-file-io.sh',
      {
        pass: [
          run('curl -i http://localhost:8084/x'),
          run("curl -s -o /dev/null -w '%{http_code}' http://localhost:8084/x"),
          run('curl -i http://localhost:8084/x -c .qa/T-X/jar -b .qa/T-X/jar'),
          run('grep -n curl .claude/hooks/block-curl-file-io.sh'),
          run('for p in a b; do curl -s -o /dev/null http://localhost:8084/$p; done'),
          run(
            'for s in ios android; do curl -i http://localhost:8084/x -c .qa/accounts/$s.jar; done',
          ),
          run('grep -rn "curl\\|\\`deny\\`" .claude'),
        ],
        block: [
          run('curl -i http://localhost:8084/x https://example.com/y'),
          run('curl -sSo out http://localhost:8084/x'),
          run('curl http://localhost:8084/x > out'),
          run('curl -K f http://localhost:8084/x'),
          run('bash -c "curl -o f http://localhost:8084/x"'),
          run('echo "$(curl -o f http://localhost:8084/x)"'),
          run('if true; then curl -o f http://localhost:8084/x; fi'),
          run('c=curl; $c -o f http://localhost:8084/x'),
          run('for s in ios ../../x; do curl -i http://localhost:8084/x -c .qa/$s.jar; done'),
        ],
      },
    ],
  ]);
}

/** Run from the repo root: a hook with no `CLAUDE_PROJECT_DIR` reads the project from where it runs. */
function runHook(repo: string, hook: string, input: string): { blocked: boolean; said: string } {
  const result = spawnSync('bash', [join(repo, HOOKS, hook)], {
    cwd: repo,
    input,
    encoding: 'utf8',
    timeout: HOOK_TIMEOUT_MS,
  });
  if (result.error) throw new Error(`hook-cases: ${hook} did not answer: ${result.error.message}`);
  return { blocked: result.status === BLOCKS, said: result.stderr.split('\n')[0] ?? '' };
}

/** The findings for one hook: each case it answered wrongly, with what it said. */
function judgeHook(repo: string, hook: string, { pass, block }: HookCases): string[] {
  const asInput = (input: ToolInput) => JSON.stringify({ tool_input: input, cwd: repo });
  const expected = [
    ...pass.map((input) => ({ input: asInput(input), blocks: false })),
    ...block.map((input) => ({ input: asInput(input), blocks: true })),
    { input: '{not json', blocks: true },
  ];
  return expected.flatMap(({ input, blocks }) => {
    const { blocked, said } = runHook(repo, hook, input);
    if (blocked === blocks) return [];
    return [
      `${hook}: should ${blocks ? 'block' : 'pass'} ${input}${said ? ` — it said: ${said}` : ''}`,
    ];
  });
}

function scanHooks(repo: string): { findings: string[]; hooks: number; cases: number } {
  const hooks = readdirSync(join(repo, HOOKS)).filter((file) => file.endsWith('.sh'));
  if (hooks.length === 0) {
    throw new Error(
      `hook-cases: found no hook under ${HOOKS} — the folder moved, and a scan of nothing proves nothing`,
    );
  }
  const cases = casesFor(repo);
  const enrolled = [...cases].filter(([hook]) => hooks.includes(hook));
  const findings = [
    ...hooks
      .filter((hook) => !cases.has(hook))
      .map((hook) => `${hook}: no cases — enrol it in hook-cases.ts`),
    ...[...cases.keys()]
      .filter((hook) => !hooks.includes(hook))
      .map((hook) => `${hook}: has cases but no hook`),
    ...enrolled.flatMap(([hook, hookCases]) => judgeHook(repo, hook, hookCases)),
  ];
  const count = enrolled.reduce(
    (sum, [, { pass, block }]) => sum + pass.length + block.length + 1,
    0,
  );
  return { findings, hooks: hooks.length, cases: count };
}

export function findHookCaseFailures(repo: string): string[] {
  return scanHooks(repo).findings;
}

export function runHookCases(repo: string): void {
  const { findings, hooks, cases } = scanHooks(repo);
  if (findings.length > 0) {
    throw new Error(
      `hook-cases: every guard passes and blocks what it must:\n  ${findings.join('\n  ')}`,
    );
  }
  console.log(`hook-cases OK — ${hooks} hooks, ${cases} cases, each as expected`);
}
