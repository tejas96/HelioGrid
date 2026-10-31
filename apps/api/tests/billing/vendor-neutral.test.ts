import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `M12-03` — billing is provider-neutral: the launch market's gateway is named once in the
 * module's PRD, as its reference implementation, and in code only in its adapter and the one
 * line that binds it. Every other file of the billing module, its port, its contract and its
 * workflows says "gateway".
 */

const REPO = join(__dirname, '../../../..');
const VENDOR = /razorpay/i;
const SCANNED = [
  'apps/api/src/modules/billing',
  'apps/worker/src/modules/billing',
  'packages/contracts/src/ports/billing-gateway.ts',
  'packages/contracts/src/billing.ts',
  'packages/contracts/src/workflows/billing-timers.ts',
  'packages/contracts/src/workflows/billing-reconcile.ts',
  'packages/domain/src/commerce',
];
/** The adapter, and the module that binds it when the keys are set. */
const MAY_NAME_IT = [/\.razorpay\.ts$/, /^apps\/api\/src\/modules\/billing\/billing\.module\.ts$/];

function filesUnder(path: string): string[] {
  const full = join(REPO, path);
  if (!statSync(full).isDirectory()) return [path];
  return readdirSync(full).flatMap((name) => filesUnder(join(path, name)));
}

describe('provider-neutral billing (M12-03)', () => {
  it('the vendor is named only in its adapter and once in the module’s PRD', () => {
    const files = SCANNED.flatMap(filesUnder);
    expect(files.length).toBeGreaterThan(10);
    const naming = files.filter(
      (file) =>
        !MAY_NAME_IT.some((allowed) => allowed.test(file)) &&
        VENDOR.test(readFileSync(join(REPO, file), 'utf8')),
    );
    expect(naming.map((file) => relative('.', file))).toEqual([]);

    const prd = readFileSync(join(REPO, 'docs/prd/modules/M12-platform-billing.md'), 'utf8');
    expect(prd.match(new RegExp(VENDOR.source, 'gi'))).toHaveLength(1);
  });
});
