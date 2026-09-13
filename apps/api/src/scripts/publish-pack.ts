import 'reflect-metadata';
import { IN_PACK } from '@heliogrid/domain';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MarketPackService, type PublishOutcome } from '../modules/market/market.public';
import { redactCredentials } from './redact-credentials';

/**
 * `pnpm --filter @heliogrid/api pack:publish` — publishes the typed India pack as its market's
 * next revision (`F1-11`): revision 1 on an empty market, the next number when the literal
 * differs from the stored row, nothing when it does not. A rate change is this command, not a
 * deploy. It boots the application context the API itself runs, so the write takes the admin
 * path through the same module and no second wiring exists.
 */
function describe({ current, written }: PublishOutcome): string {
  if (written === null) {
    const revision = current === null ? 'none' : String(current.revision);
    return `IN_PACK: no difference from revision ${revision}; nothing written`;
  }
  const seeded = current === null ? ' (the seed)' : '';
  return `IN_PACK: published revision ${written.revision}${seeded} at ${written.publishedAt}`;
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const outcome = await app.get(MarketPackService).publish(IN_PACK, new Date().toISOString());
    console.log(describe(outcome));
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
