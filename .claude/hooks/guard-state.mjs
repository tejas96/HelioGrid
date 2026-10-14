import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GATE_REWRITES } from './guard-rules.mjs';

/**
 * What the guard remembers about one task branch, in the git-ignored `.qa/guard/`: an append-only
 * log of what helpers reported and which checks ran, and the machine's state when the branch's work
 * began. Keyed by branch, so an app restart that starts a new session keeps the same record.
 */
export const TASK_BRANCH = /^feat\/T-[A-Z0-9]+-\d+[a-z]?$/;
const PORTS = [3002, 8084, 8081, 3100];
const TASK_DOCS = 'docs/tasks/';

export function git(root, args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 1 << 28,
  });
}

/** The repository and branch a hook call runs in, or `undefined` outside a repository. */
export function repoOf(cwd) {
  try {
    const root = git(cwd, ['rev-parse', '--show-toplevel']).trim();
    return { root, branch: git(root, ['branch', '--show-current']).trim() };
  } catch {
    return undefined;
  }
}

function recordPath(root, branch, kind) {
  const dir = join(root, '.qa', 'guard');
  mkdirSync(dir, { recursive: true });
  return join(dir, `${branch.replaceAll('/', '__')}.${kind}`);
}

export function record(root, branch, entry) {
  appendFileSync(
    recordPath(root, branch, 'jsonl'),
    `${JSON.stringify({ at: Date.now(), ...entry })}\n`,
  );
}

export function readLog(root, branch) {
  const file = recordPath(root, branch, 'jsonl');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => JSON.parse(line));
}

/** The state when the branch's work began, written once, on the first command seen on it. */
export function startState(root, branch) {
  const file = recordPath(root, branch, 'start.json');
  if (!existsSync(file)) writeFileSync(file, JSON.stringify(liveState(root)));
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** The database names `.env.local` routes to, the listeners on the stack's ports, the booted phones. */
export function liveState(root) {
  return { databases: databaseNames(root), listeners: listeners(), phones: phones() };
}

function databaseNames(root) {
  try {
    return readFileSync(join(root, '.env.local'), 'utf8')
      .split('\n')
      .filter((line) => /^DATABASE_(ADMIN_)?URL=/.test(line))
      .map((line) => `${line.split('=')[0]}=${line.split('/').pop()}`)
      .sort();
  } catch {
    return [];
  }
}

/** The stack's ports that listen; a port open at the start is pre-existing, whoever restarts it. */
function listeners() {
  const args = ['-nP', ...PORTS.map((port) => `-iTCP:${port}`), '-sTCP:LISTEN', '-Fn'];
  const ports = quietly('lsof', args)
    .split('\n')
    .flatMap((line) => /^n.*:(\d+)$/.exec(line)?.[1] ?? []);
  return [...new Set(ports)].map((port) => `port ${port}`).sort();
}

function phones() {
  const booted = [];
  try {
    const devices = JSON.parse(quietly('xcrun', ['simctl', 'list', 'devices', 'booted', '-j']));
    for (const list of Object.values(devices.devices ?? {})) {
      for (const device of list) booted.push(`simulator ${device.udid}`);
    }
  } catch {
    // no simulator tooling: no simulator can be booted
  }
  if (quietly('pgrep', ['-x', 'adb']).trim() === '') return booted.sort();
  for (const line of quietly('adb', ['devices']).split('\n').slice(1)) {
    const [serial, state] = line.split('\t');
    if (state === 'device') booted.push(`emulator ${serial}`);
  }
  return booted.sort();
}

/** A command's output, or nothing when it fails — `lsof` with no listener exits 1. */
function quietly(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 20_000,
    });
  } catch (error) {
    return typeof error?.stdout === 'string' ? error.stdout : '';
  }
}

/** Every changed, staged or untracked path with its status and content digest. */
export function changedFiles(root) {
  const files = new Map();
  const entries = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']).split(
    '\0',
  );
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i] ?? '';
    if (entry === '') continue;
    const status = entry.slice(0, 2);
    const path = entry.slice(3);
    if (status.startsWith('R') || status.startsWith('C')) i++;
    files.set(path, `${status} ${digestOf(join(root, path))}`);
  }
  return files;
}

function digestOf(file) {
  try {
    return createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16);
  } catch {
    return 'gone';
  }
}

/** The paths whose status or content differs between two `changedFiles` reads. */
export function differingPaths(before, after) {
  const paths = new Set([...before.keys(), ...after.keys()]);
  return [...paths].filter((path) => before.get(path) !== after.get(path)).sort();
}

/**
 * Digests of HEAD and every changed file: `code` without the task's own ledger (`docs/tasks/`),
 * `tasks` the ledger alone, and `reviewed` the code a review and QA read — the gate's own rewrites
 * left out, since the gate writes them after both.
 */
export function fingerprints(root) {
  const files = changedFiles(root);
  const head = git(root, ['rev-parse', 'HEAD']).trim();
  const of = (keep) =>
    createHash('sha256')
      .update(head)
      .update(JSON.stringify([...files].filter(([path]) => keep(path)).sort()))
      .digest('hex')
      .slice(0, 16);
  const isCode = (path) => !path.startsWith(TASK_DOCS);
  return {
    code: of(isCode),
    tasks: of((path) => !isCode(path)),
    reviewed: of((path) => isCode(path) && !GATE_REWRITES.test(path)),
  };
}

/** What a helper's command could change: every changed file, and the routing `.env.local` holds. */
export function helperSnapshot(root) {
  const files = changedFiles(root);
  files.set('.env.local (database routing)', databaseNames(root).join(' '));
  return files;
}

/** The branch itself is on the remote — not merely tracking `origin/main`, as a new branch does. */
export function isPushed(root, branch) {
  try {
    git(root, ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${branch}`]);
    return true;
  } catch {
    return false;
  }
}
