import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerErrorInterceptor } from 'nestjs-pino';
import { dbProviders } from './db/db.providers';
import { EnvelopeExceptionFilter } from './filters/envelope-exception.filter';

/**
 * Cross-cutting plumbing, registered DECLARATIVELY — `main.ts` is bootstrap only, so a
 * filter/interceptor can inject dependencies and nothing is wired imperatively behind
 * Nest's back (apps/api/CLAUDE.md §Structure).
 *
 * SessionGuard is deliberately NOT provided here. Nest resolves a provider's dependencies
 * in the injector of the module that DECLARES it, and the guard needs SESSION_RESOLVER —
 * a port `modules/auth` provides, which `common/` may never import. Declaring it here fails
 * at boot with "argument Symbol(SESSION_RESOLVER) at index [1] is available in the
 * CommonModule module". AppModule binds it as APP_GUARD instead: it is the one place that
 * already imports both CommonModule and AuthModule.
 */
@Global()
@Module({
  providers: [
    ...dbProviders,
    { provide: APP_FILTER, useClass: EnvelopeExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggerErrorInterceptor },
  ],
  // Repositories across every module inject these; nothing else should.
  exports: [...dbProviders.map((p) => (p as { provide: symbol }).provide)],
})
export class CommonModule {}
