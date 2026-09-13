import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assertWorkflowBundle } from '../../src/common/temporal/workflow-bundle';

/**
 * This test runs from `src/`, which is the whole point: vitest gives the module the same
 * `__dirname` that `tsx watch` does. A resolver that only understands the COMPILED layout
 * answers with a path inside `src/` that no build ever writes — which is exactly why
 * `pnpm --filter @heliogrid/worker dev` could not boot from a clean checkout, and why the
 * worker has only ever been driven as its built artifact.
 *
 * It needs the bundle BUILT, and that is correct rather than awkward: the bundle is a build
 * artifact by design (`workflow-bundle.ts` says why), `pnpm verify` builds before it tests, and
 * a failure here on an unbuilt tree says the true thing.
 */
describe('assertWorkflowBundle', () => {
  it('finds the built bundle when running from source, as dev mode does', () => {
    const found = assertWorkflowBundle();
    expect(found.endsWith('/dist/workflow-bundle.js')).toBe(true);
    expect(existsSync(found)).toBe(true);
  });

  it('never answers a path inside src/, which no build writes', () => {
    expect(assertWorkflowBundle()).not.toContain('/src/');
  });
});
