import { type Db, pushDevice } from '@heliogrid/db';
import type { PushPlatform } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/**
 * The handsets a person is pushed on (`F6-06`, `F6-13`).
 *
 * The ADMIN pool, because `push_device` is a global table with no grant to `app_user` — the same
 * answer `session` gives, and for the same reason: a row keyed to a PERSON rather than a tenant
 * carries no tenant pin to be filtered by, so the runtime role is given no reach at all. Every
 * method here is therefore scoped by `user_ref` in the query, which is the only scoping there is.
 */
@Injectable()
export class PushDeviceAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /**
   * Registers a handset, or re-registers one that came back.
   *
   * The conflict target is the TOKEN, not the person: FCM mints a token per app install, so the
   * same token arriving for a different account means the handset changed hands and the row
   * should follow it rather than push the previous person's notifications to it.
   */
  async register(userRef: string, platform: PushPlatform, token: string, now: Date): Promise<void> {
    await this.db
      .insert(pushDevice)
      .values({ userRef, platform, token, registeredAt: now, lastSeenAt: now })
      .onConflictDoUpdate({
        target: pushDevice.token,
        set: { userRef, platform, lastSeenAt: now },
      });
  }

  /** Idempotent: forgetting a token that is already gone is success, not a missing row. */
  async forget(token: string): Promise<void> {
    await this.db.delete(pushDevice).where(eq(pushDevice.token, token));
  }

  /** Every live handset this person has — one send reaches all of them. */
  async tokensOf(userRef: string): Promise<string[]> {
    const rows = await this.db
      .select({ token: pushDevice.token })
      .from(pushDevice)
      .where(eq(pushDevice.userRef, userRef));
    return rows.map((row) => row.token);
  }

  /**
   * Deletes tokens the provider called dead. `F6` §F6.2 is explicit that nothing retries one:
   * the app is gone or the device was reset, and the inbox loses nothing when a push does.
   */
  async forgetDead(tokens: readonly string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.db.delete(pushDevice).where(inArray(pushDevice.token, [...tokens]));
  }
}
