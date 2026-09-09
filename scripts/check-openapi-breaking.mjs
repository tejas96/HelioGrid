#!/usr/bin/env node
/**
 * OpenAPI drift gate — two checks in one:
 *
 *   1. FRESHNESS: the openapi.json on disk already matches what the contract emits.
 *      A stale committed surface is a lie told to every reader. This is the CI gate.
 *   2. BREAKING CHANGES: the emitted surface introduces no breaking change against the
 *      base branch, via oasdiff — the ONE build `scripts/oasdiff-pin.json` names, installed
 *      by `pnpm tools:oasdiff` into .tools/. A GATE (`M26`) on every machine: the tool absent
 *      or at another version is RED, here as under CI, because one release grades a finding a
 *      level lower than the next and a local pass with another build proves nothing. Only an
 *      unfetched base is a labelled skip locally (a clone with no `origin/main` has nothing
 *      to compare); under CI that too fails closed.
 *
 * Freshness is decided by hashing the file BEFORE and AFTER a fresh emit — not by asking
 * git. Two reasons: (a) the emit reads packages/contracts/dist, so we build first, and a
 * byte comparison of "what was on disk" vs "what the contract produces" is exactly the
 * question; (b) a git check (`git diff` / `git status`) conflates freshness with staging
 * state — a correctly re-emitted spec that is already `git add`ed reads as "dirty", and an
 * untracked spec reads as "clean". Bytes don't lie and don't care whether you have staged.
 * CI runs this same script, so CI and local can never diverge on what "fresh" means.
 *
 * A genuinely intended break needs an explicit owner ruling.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SPEC = join(ROOT, 'packages/contracts/openapi/openapi.json');
const BASE = process.env.OPENAPI_BASE_REF ?? 'origin/main';
const UNDER_CI = Boolean(process.env.CI) && process.env.CI !== 'false';
const PIN = JSON.parse(readFileSync(join(ROOT, 'scripts/oasdiff-pin.json'), 'utf8'));
const OASDIFF = join(ROOT, '.tools/oasdiff/oasdiff');

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });

/**
 * The judge must be the pinned build, or its verdict is not this repo's verdict. Absent or at
 * another version it is RED everywhere — never a skip, because a skip reads as a pass in a log.
 */
function assertPinnedJudge() {
  let installed = null;
  try {
    installed = run(OASDIFF, ['--version']).trim().split(/\s+/).at(-1);
  } catch {
    /* absent, or not executable — reported below by the same message */
  }
  if (installed === PIN.version) return;
  console.error(
    `\nOPENAPI BREAKING-CHANGE JUDGE MISSING: oasdiff ${PIN.version} is not installed at\n` +
      `.tools/oasdiff (found: ${installed ?? 'nothing'}). Run \`pnpm tools:oasdiff\` — the pinned\n` +
      'build is the only one whose grading this gate trusts (M26).\n',
  );
  process.exit(1);
}

// ── 1. Freshness (git-independent) ──────────────────────────────────────────────
// Snapshot the bytes, rebuild + re-emit, compare. Build before emit: the emit reads
// dist/, so a source edit that has not been recompiled would emit the stale surface.
const before = existsSync(SPEC) ? readFileSync(SPEC) : null;
run('pnpm', ['--filter', '@heliogrid/contracts', 'build'], { stdio: 'inherit' });
run('pnpm', ['--filter', '@heliogrid/contracts', 'openapi'], { stdio: 'inherit' });
const after = readFileSync(SPEC);

if (before === null || !before.equals(after)) {
  console.error(
    '\nOPENAPI STALE: the committed openapi.json does not match what the contract emits.\n' +
      (before === null ? 'The spec did not exist and has now been emitted. ' : '') +
      'The fresh surface is now on disk — commit it in the same change as the contract edit\n' +
      '(/contract-change step 2).\n',
  );
  process.exit(1);
}
console.log('openapi freshness OK — committed spec matches the contract');

// ── 2. Breaking changes vs the base branch ────────────────────────────────────
assertPinnedJudge();

/**
 * A compare that cannot run is not a pass. Under CI it is a failure (`M26` fails closed);
 * locally an unfetched base is a labelled skip, because a clone with no `origin/main` has
 * nothing to compare. Returns the exit code the caller should use.
 */
function inconclusive(reason) {
  if (UNDER_CI) {
    console.error(
      `\nOPENAPI BREAKING-CHANGE CHECK CANNOT RUN under CI: ${reason}.\n` +
        'A compare that cannot run is not a pass (M26). The workflow installs oasdiff and\n' +
        'fetches the base with full history; one of the two is missing here.\n',
    );
    return 1;
  }
  console.log(`openapi breaking-change check skipped — ${reason} (local, on-demand check)`);
  return 0;
}

function refExists(ref) {
  try {
    run('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

let baseSpec;
try {
  baseSpec = run('git', ['show', `${BASE}:packages/contracts/openapi/openapi.json`]);
} catch {
  if (!refExists(BASE)) process.exit(inconclusive(`${BASE} is not fetched`));
  // The base exists and carries no spec: a genuinely new file has nothing to break.
  console.log(`openapi breaking-change check skipped — no spec at ${BASE} (new file)`);
  process.exit(0);
}

// Show which commit the base actually resolved to: a stale or fork-remote origin/main
// compares against the wrong surface, and silence would hide that.
let baseCommit = '';
try {
  baseCommit = run('git', ['rev-parse', '--short', BASE]).trim();
} catch {
  /* rev-parse can't name it (e.g. a raw sha as BASE) — the label is cosmetic. */
}
console.log(`openapi breaking-change check — base ${BASE}${baseCommit ? ` (${baseCommit})` : ''}`);

const dir = mkdtempSync(join(tmpdir(), 'oasdiff-'));
let code = 0;
try {
  writeFileSync(join(dir, 'base.json'), baseSpec);
  const out = run(OASDIFF, ['breaking', join(dir, 'base.json'), SPEC, '--fail-on', 'ERR']);
  console.log(
    `${out.trim() || 'openapi breaking-change check OK — no breaking changes'} (oasdiff ${PIN.version})`,
  );
} catch (err) {
  // oasdiff exit codes are distinct: 1 = breaking changes found (report on stdout);
  // 100 = bad flag/usage; 102 = unparseable/missing input. Only a status of 1 is a real
  // break — every other failure is the tool unable to compare, which is a SKIP, not a
  // verdict. Misreporting tool drift as a breaking change is a false alarm that trains
  // people to ignore the gate. (An absent binary was refused above, before any compare.)
  if (err.status === 1) {
    console.error(`\nOPENAPI BREAKING CHANGE vs ${BASE}:\n`);
    console.error((err.stdout || err.message).trim());
    console.error(
      '\nA breaking API change needs an explicit owner ruling before\n' +
        'it merges. Additive changes (new optional fields, new endpoints) are not breaking.\n',
    );
    code = 1;
  } else {
    code = inconclusive(`oasdiff could not compare (exit ${err.status})`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
process.exit(code);
