import { createDb, ping } from '@heliogrid/db';
import { Injectable } from '@nestjs/common';
import { ENV } from '../../config/env';

/**
 * Readiness probe's database check. It lives in a repository because it touches Postgres —
 * the rule is about the LAYER, not the volume of SQL (dependency-cruiser
 * `db-access-in-repositories-only`).
 *
 * Deliberately NOT the shared runtime pool: readiness must report on connectivity even
 * when the pool is saturated, so it opens a single throwaway connection and closes it.
 * That is why this is the one repository that does not take a Db by injection.
 */
@Injectable()
export class HealthRepository {
  async check(): Promise<'ok' | 'failed'> {
    const { db, client } = createDb(ENV.DATABASE_URL, { max: 1 });
    try {
      await ping(db);
      return 'ok';
    } catch {
      return 'failed';
    } finally {
      await client.end({ timeout: 2 });
    }
  }
}
