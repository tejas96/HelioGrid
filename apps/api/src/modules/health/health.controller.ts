import { healthContract } from '@heliogrid/contracts';
import { Controller, Inject } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { ENV } from '../../config/env';
import { HealthRepository } from './health.repository';

const SERVICE = 'heliogrid-api';
const VERSION = ENV.FLY_MACHINE_VERSION;

/**
 * Carried `@Public()` until 2026-08-01, where it was LOAD-BEARING against the global
 * deny-by-default SessionGuard — without it Fly's probes 401'd and the machine failed its
 * health checks. The guard and the decorator went with the auth teardown (ADR-0024). When
 * the guard returns, THIS controller needs the opt-out back or deployment breaks.
 */
@Controller()
export class HealthController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(HealthRepository) private readonly repo: HealthRepository) {}

  @TsRestHandler(healthContract)
  handler() {
    return tsRestHandler(healthContract, {
      liveness: async () => ({
        status: 200,
        body: { status: 'ok', service: SERVICE, version: VERSION },
      }),
      readiness: async () => {
        // DATABASE_URL is required by the env schema, so there is no 'skipped' path any
        // more — a boot without it never reaches this handler.
        const checks: Record<string, 'ok' | 'skipped' | 'failed'> = {
          database: await this.repo.check(),
        };
        if (checks.database === 'failed') {
          return {
            status: 503,
            body: {
              error: {
                code: 'INTERNAL' as const,
                message: 'A dependency is unreachable.',
                requestId: 'health',
              },
            },
          };
        }
        return { status: 200, body: { status: 'ok', checks } };
      },
    });
  }
}
