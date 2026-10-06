import { createApp } from './app';
import { TemporalActivityHost } from './common/temporal/temporal.activity-host';
import { ENV } from './config/env';

/**
 * Production's caller of the one boot path: build the app, listen, then host the workflow steps.
 * Only this process hosts them — a test or a script boots the same app and never polls a queue
 * (`temporal.activity-host.ts` says why).
 */
async function bootstrap() {
  const app = await createApp();
  await app.listen(ENV.API_PORT, '0.0.0.0');
  app.get(TemporalActivityHost).start();
}

void bootstrap();
