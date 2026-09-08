import { healthContract } from '@heliogrid/contracts';
import { Controller, HttpStatus, Inject } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { RouteAccessMap } from '../../common/auth/access';
import { ContractException } from '../../common/errors/contract-exception';
import { ENV } from '../../config/env';
import { HealthRepository } from './health.repository';

const SERVICE = 'heliogrid-api';
const VERSION = ENV.FLY_MACHINE_VERSION;

/**
 * Both probes are PUBLIC, and that mark is load-bearing: the deny-by-default guard refuses a
 * route that declares nothing, and a 401 on the liveness probe fails the machine's health checks.
 */
@Controller()
export class HealthController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(HealthRepository) private readonly repo: HealthRepository) {}

  @TsRestHandler(healthContract)
  @RouteAccessMap(healthContract, { liveness: 'public', readiness: 'public' })
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
          throw new ContractException(
            'INTERNAL',
            'A dependency is unreachable.',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
        return { status: 200, body: { status: 'ok', checks } };
      },
    });
  }
}
