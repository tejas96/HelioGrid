import { healthContract } from '@heliogrid/contracts';
import { createDb, ping } from '@heliogrid/db';
import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

const SERVICE = 'heliogrid-api';
const VERSION = process.env.FLY_MACHINE_VERSION ?? '0.0.1';

@Controller()
export class HealthController {
  @TsRestHandler(healthContract)
  handler() {
    return tsRestHandler(healthContract, {
      liveness: async () => ({
        status: 200,
        body: { status: 'ok', service: SERVICE, version: VERSION },
      }),
      readiness: async () => {
        const checks: Record<string, 'ok' | 'skipped' | 'failed'> = {};
        const url = process.env.DATABASE_URL;
        if (!url) {
          checks.database = 'skipped';
        } else {
          const { db, client } = createDb(url, { max: 1 });
          try {
            await ping(db);
            checks.database = 'ok';
          } catch {
            checks.database = 'failed';
          } finally {
            await client.end({ timeout: 2 });
          }
        }
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
