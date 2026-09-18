import { createApp } from './app';
import { ENV } from './config/env';

/** Production's caller of the one boot path: build the app, then listen. Nothing else lives here. */
async function bootstrap() {
  const app = await createApp();
  await app.listen(ENV.API_PORT, '0.0.0.0');
}

void bootstrap();
