#!/usr/bin/env node
/**
 * OpenAPI drift gate — two checks in one:
 *
 *   1. FRESHNESS: the openapi.json on disk already matches what the contract emits.
 *      A stale committed surface is a lie told to every reader. This is the CI gate.
 *   2. BREAKING CHANGES: the emitted surface introduces no breaking change against the
 *      base branch, via oasdiff. Under CI this is a GATE (`M26`): an absent tool, a tool
 *      that cannot compare, or an unfetched base fails closed. Locally the same cases skip
 *      and say so, so `pnpm check:openapi` degrades to the freshness half on any machine.
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

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });

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
/**
 * A compare that cannot run is not a pass. Under CI it is a failure (`M26` fails closed);
 * locally it is a labelled skip, because a developer without oasdiff is not a broken build.
 * Returns the exit code the caller should use.
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
  const out = run('oasdiff', ['breaking', join(dir, 'base.json'), SPEC, '--fail-on', 'ERR']);
  console.log(out.trim() || 'openapi breaking-change check OK — no breaking changes');
} catch (err) {
  // oasdiff exit codes are distinct: 1 = breaking changes found (report on stdout);
  // ENOENT = binary absent; 100 = bad flag/usage; 102 = unparseable/missing input. Only a
  // status of 1 is a real break — every other failure is the tool unable to compare, which
  // is a SKIP, not a verdict. Misreporting tool drift as a breaking change is a false alarm
  // that trains people to ignore the gate.
  if (err.status === 1) {
    console.error(`\nOPENAPI BREAKING CHANGE vs ${BASE}:\n`);
    console.error((err.stdout || err.message).trim());
    console.error(
      '\nA breaking API change needs an explicit owner ruling before\n' +
        'it merges. Additive changes (new optional fields, new endpoints) are not breaking.\n',
    );
    code = 1;
  } else {
    code = inconclusive(
      err.code === 'ENOENT'
        ? 'oasdiff is not installed'
        : `oasdiff could not compare (exit ${err.status})`,
    );
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
process.exit(code);
