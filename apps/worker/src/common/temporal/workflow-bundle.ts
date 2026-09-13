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
//
// TWO layouts, because this file runs from two places. Compiled, `__dirname` is
// `dist/common/temporal` and the artifact is its grandparent's `dist/workflow-bundle.js`. Under
// `tsx watch` it is `src/common/temporal`, and the build writes nothing into `src/` — so the
// same climb lands on a path that cannot exist and `pnpm --filter @heliogrid/worker dev` died on
// the boot assertion from a clean clone until someone copied the artifact across by hand.
// Not exported: `assertWorkflowBundle()` is the only way to obtain a path, so no caller can
// reference one without the existence check that makes booting without it impossible.
const COMPILED_BUNDLE_PATH = join(__dirname, '..', '..', 'workflow-bundle.js');
const SOURCE_RUN_BUNDLE_PATH = join(__dirname, '..', '..', '..', 'dist', 'workflow-bundle.js');

export function assertWorkflowBundle(): string {
  const found = [COMPILED_BUNDLE_PATH, SOURCE_RUN_BUNDLE_PATH].find((path) => existsSync(path));
  if (found === undefined) {
    throw new Error(
      `Temporal workflow bundle missing. Looked in ${COMPILED_BUNDLE_PATH} and ` +
        `${SOURCE_RUN_BUNDLE_PATH}. Run \`pnpm --filter @heliogrid/worker build\` — the bundle ` +
        'is a BUILD artifact, and booting without it would silently bundle at runtime and lose ' +
        'the CI determinism check.',
    );
  }
  return found;
}
