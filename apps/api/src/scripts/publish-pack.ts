import 'reflect-metadata';
import { IN_PACK } from '@heliogrid/domain';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import {
  CatalogPlatformService,
  IN_PLATFORM_ITEMS,
  type PlatformPublishOutcome,
} from '../modules/catalog/catalog.public';
import { MarketPackService, type PublishOutcome } from '../modules/market/market.public';
import { redactCredentials } from './redact-credentials';

/**
 * `pnpm --filter @heliogrid/api pack:publish` — publishes the typed India pack as its market's
 * next revision (`F1-11`): revision 1 on an empty market, the next number when the literal
 * differs from the stored row, nothing when it does not. A rate change is this command, not a
 * deploy. Then the India platform catalog (`T-M01-027`), idempotently: an item is written where
 * new or changed and left alone otherwise. It boots the application context the API itself runs,
 * so both writes take the admin path through their own modules and no second wiring exists.
 */
function describe({ current, written }: PublishOutcome): string {
  if (written === null) {
    const revision = current === null ? 'none' : String(current.revision);
    return `IN_PACK: no difference from revision ${revision}; nothing written`;
  }
  const seeded = current === null ? ' (the seed)' : '';
  return `IN_PACK: published revision ${written.revision}${seeded} at ${written.publishedAt}`;
}

function describeCatalog({
  items,
  availabilities,
  certifications,
}: PlatformPublishOutcome): string {
  if (items + availabilities + certifications === 0) {
    return 'IN platform catalog: no difference; nothing written';
  }
  return `IN platform catalog: ${items} items, ${availabilities} market rows, ${certifications} certifications written`;
}

async function main(): Promise<void> {
  /*
   * `abortOnError: false` is what lets the failure be SEEN. Nest's default is to log a boot
   * error through its own logger and exit — and `logger: false` sends that log nowhere, so the
   * command died with an empty stdout AND an empty stderr, telling an operator nothing at all.
   * Throwing instead hands the error to the handler below, which is the one that redacts the
   * connection string. The logger stays off for exactly that reason: Nest's own writer does not
   * redact, and a command's stderr is what an operator pastes into a chat window.
   */
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
    abortOnError: false,
  });
  try {
    const now = new Date();
    const outcome = await app.get(MarketPackService).publish(IN_PACK, now.toISOString());
    console.log(describe(outcome));
    const book = await app.get(CatalogPlatformService).publish(IN_PLATFORM_ITEMS, now.getTime());
    console.log(describeCatalog(book));
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  /*
   * The MESSAGE, redacted — never the error object. A Postgres driver puts the connection string
   * in its own message, password and all, and a command's stderr is exactly what an operator
   * pastes into a chat window when asking for help. The stack goes with it: it names this file,
   * which the message above already says.
   */
  console.error(redactCredentials(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
