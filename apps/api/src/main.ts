import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';
import type { Auth } from './auth/better-auth';
import { AUTH } from './auth/tokens';
import { EnvelopeExceptionFilter } from './common/envelope-exception.filter';

async function bootstrap() {
  // bodyParser off globally: Better Auth's handler must read the raw stream on
  // /api/auth/* (S1 pattern); JSON parsing is re-added for everything else below.
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useGlobalFilters(new EnvelopeExceptionFilter());
  app.enableShutdownHooks();

  const auth = app.get<Auth>(AUTH);
  const authHandler = toNodeHandler(auth);
  const jsonParser = express.json({ limit: '1mb' });
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.url.startsWith('/api/auth/')) return authHandler(req, res);
    return jsonParser(req, res, next);
  });

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
