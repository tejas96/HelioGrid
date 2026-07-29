import { healthContract } from '@heliogrid/contracts';
import { Controller, Inject } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { Public } from '../../common/decorators/public.decorator';
import { ENV } from '../../config/env';
import { HealthRepository } from './health.repository';

const SERVICE = 'heliogrid-api';
const VERSION = ENV.FLY_MACHINE_VERSION;

/**
 * @Public is LOAD-BEARING: SessionGuard is global deny-by-default, so without it Fly's
 * liveness/readiness probes would 401 and the machine would fail its health checks.
 */
@Public()
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
