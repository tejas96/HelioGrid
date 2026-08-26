/**
 * Pre-bundles the workflow code into ONE named artifact at build time.
 *
 * Why not bundle at boot (the SDK's `workflowsPath`)? Because then the runtime image needs a
 * bundler and the workflow SOURCE, and a determinism-breaking import — a `node:fs` reached
 * through three levels of helper — is discovered on the machine instead of in CI. Here it
 * fails the build.
 *
 * The bundle is written beside the compiled output so the runtime resolves it as a sibling,
 * and `assertWorkflowBundle()` refuses to boot without it.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleWorkflowCode } from '@temporalio/worker';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist', 'workflow-bundle.js');

// The compiled workflow file, not the TypeScript source: `tsc` has already run and the bundler
// then sees exactly what ships.
const workflowsPath = join(ROOT, 'dist', 'modules', 'platform', 'platform.workflows.js');

const { code } = await bundleWorkflowCode({ workflowsPath });
writeFileSync(OUT, code);

const kb = Math.round(code.length / 1024);
console.log(`workflow bundle → ${OUT} (${kb} KB)`);

// A bundle that somehow contains a Node builtin is a determinism failure the sandbox would
// only surface at replay time. Fail the BUILD instead.
const forbidden = ['node:fs', 'node:child_process', 'node:net', 'node:http'];
const found = forbidden.filter(
  (m) => code.includes(`require("${m}")`) || code.includes(`from"${m}"`),
);
if (found.length > 0) {
  console.error(`workflow bundle contains Node builtins: ${found.join(', ')}`);
  process.exit(1);
}
