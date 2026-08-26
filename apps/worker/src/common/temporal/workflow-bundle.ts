import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Where the pre-built workflow bundle lives, and the assertion that it is actually there.
 *
 * The bundle is built at BUILD time (`scripts/build-workflow-bundle.mjs`), not at boot. Two
 * reasons, and both are about production rather than convenience:
 *
 *  - bundling at boot means the worker needs a bundler, its loaders and the workflow SOURCE
 *    in the runtime image, and a determinism-breaking import would first be discovered on the
 *    machine rather than in CI;
 *  - the artifact is then a named, inspectable file that a build can fail on.
 *
 * A MISSING bundle must stop the process. Falling back to `workflowsPath` would silently
 * bundle at boot and the whole guarantee above would evaporate on the one day it mattered.
 */
// `__dirname`, not `import.meta.url`: this app compiles to CommonJS (Nest + tsx), where
// `import.meta` is a build error rather than a runtime one.
// dist/common/temporal → dist/workflow-bundle.js
// Not exported: `assertWorkflowBundle()` is the only way to obtain it, so no caller can
// reference the path without the existence check that makes booting without it impossible.
const WORKFLOW_BUNDLE_PATH = join(__dirname, '..', '..', 'workflow-bundle.js');

export function assertWorkflowBundle(): string {
  if (!existsSync(WORKFLOW_BUNDLE_PATH)) {
    throw new Error(
      `Temporal workflow bundle missing at ${WORKFLOW_BUNDLE_PATH}. ` +
        'Run `pnpm --filter @heliogrid/worker build` — the bundle is a BUILD artifact, and ' +
        'booting without it would silently bundle at runtime and lose the CI determinism check.',
    );
  }
  return WORKFLOW_BUNDLE_PATH;
}
