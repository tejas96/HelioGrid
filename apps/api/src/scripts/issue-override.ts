import 'reflect-metadata';
import { parseArgs } from 'node:util';
import { ENTITLEMENT_KEYS, type EntitlementKey } from '@heliogrid/domain';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EntitlementService } from '../modules/billing/billing.public';
import { redactCredentials } from './redact-credentials';

/**
 * `pnpm --filter @heliogrid/api billing:override` — support's audited override on one company
 * (`M12-19`, `M12-52`). No staff console exists, so this is support's one door; the service writes
 * the override, its audit entry and the recomputed limits in one transaction.
 *
 *   --tenant <company id> --staff <staff account id> --reason "<why>" --credit voice_minutes=120
 *   --tenant <company id> --staff <staff account id> --reason "<why>" --extend-trial
 *
 * It prints the override's id, or why it was refused and exits non-zero.
 */
const USAGE =
  'usage: billing:override --tenant <id> --staff <user id> --reason "<why>" (--credit <key>=<amount> | --extend-trial)';

function creditOf(text: string): { key: EntitlementKey; amount: number } {
  const [key, amount] = text.split('=');
  const known: readonly string[] = ENTITLEMENT_KEYS;
  if (key === undefined || !known.includes(key) || amount === undefined) {
    throw new Error(`--credit takes <key>=<amount>, a key of ${ENTITLEMENT_KEYS.join(', ')}`);
  }
  return { key: key as EntitlementKey, amount: Number(amount) };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      tenant: { type: 'string' },
      staff: { type: 'string' },
      reason: { type: 'string' },
      credit: { type: 'string' },
      'extend-trial': { type: 'boolean' },
    },
  });
  const { tenant, staff, reason, credit } = values;
  const extend = values['extend-trial'] === true;
  if (!tenant || !staff || !reason || (credit === undefined) === !extend) throw new Error(USAGE);
  // `abortOnError: false` and no logger, as `publish-pack.ts` says why: a boot error is seen, redacted.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
    abortOnError: false,
  });
  try {
    const entitlements = app.get(EntitlementService);
    // Taken after the boot, which takes seconds: the trial's end is judged against this moment.
    const act = { tenantId: tenant, staffUserId: staff, reason, now: Date.now() };
    const issued = extend
      ? await entitlements.extendTrial(act)
      : await entitlements.issueCredit(act, creditOf(credit ?? ''));
    if (issued.kind === 'refused') throw new Error(`refused: ${issued.reason}`);
    console.log(`override ${issued.overrideId} issued`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(redactCredentials(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
