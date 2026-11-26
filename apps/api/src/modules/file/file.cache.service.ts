import { createHash } from 'node:crypto';
import { OBJECT_STORE, type ObjectStore } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';

/**
 * Where the store keeps what a third party answered for a PLACE, shared by every company that
 * works there and holding no company's data — Google's height data for a site (`T-M05-002`, part
 * g). Every key is under `KEPT_FOR_A_PLACE_PREFIX`, whose store rule deletes an object 30 days
 * after it was written (Solar terms §21.2; `infra/compose.yaml` locally, the vendor's settings in
 * production); a reader checks the age itself as well, so a rule that ran late is never relied on.
 */
export const KEPT_FOR_A_PLACE_PREFIX = 'kept-for-a-place/';

@Injectable()
export class FileCacheService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(OBJECT_STORE) private readonly store: ObjectStore) {}

  /** Keeps a JSON answer under its place's key, over any kept before. Throws on an outage. */
  async keep(key: string, json: unknown): Promise<void> {
    const bytes = new TextEncoder().encode(JSON.stringify(json));
    await this.store.put({
      key: `${KEPT_FOR_A_PLACE_PREFIX}${key}`,
      bytes,
      contentType: 'application/json',
      checksumSha256: createHash('sha256').update(bytes).digest('base64'),
    });
  }

  /** The JSON kept under a place's key; `null` when none is. Throws on an outage. */
  async read(key: string): Promise<unknown | null> {
    const full = `${KEPT_FOR_A_PLACE_PREFIX}${key}`;
    if ((await this.store.head(full)) === null) return null;
    return JSON.parse(new TextDecoder().decode(await this.store.read(full)));
  }
}
