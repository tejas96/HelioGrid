import { randomUUID } from 'node:crypto';
import { type Db, session } from '@heliogrid/db';
import { sessionExpiresAt } from '@heliogrid/domain';
import { hashSecret } from '../../src/common/auth/secrets';

/**
 * A session a proof holds as a device would: the row stores only the hash of `secret`, exactly as
 * a signed-in session's does, so a proof can present the cookie. Its life follows the real policy
 * unless the case needs it run out or revoked.
 */
export interface Device {
  readonly sessionId: string;
  readonly secret: string;
  /** The fixture's `Person` and `Company` fit here; only their ids reach the row. */
  readonly of: { readonly userId: string };
  readonly under: { readonly tenantId: string };
  readonly expiresAt?: number;
  readonly revokedAt?: number;
}

export const aDevice = (
  of: Device['of'],
  under: Device['under'],
  life: { expiresAt?: number; revokedAt?: number } = {},
): Device => ({ sessionId: randomUUID(), secret: randomUUID(), of, under, ...life });

export async function seedDevices(db: Db, devices: readonly Device[], now: Date): Promise<void> {
  await db.insert(session).values(
    devices.map((device) => ({
      id: device.sessionId,
      userAccountId: device.of.userId,
      tokenHash: hashSecret(device.secret),
      platformKind: 'mobile' as const,
      activeTenantId: device.under.tenantId,
      // The real policy, so a seeded device lives exactly as long as a signed-in one does.
      expiresAt: new Date(device.expiresAt ?? sessionExpiresAt('mobile', now.getTime())),
      revokedAt: device.revokedAt === undefined ? null : new Date(device.revokedAt),
      lastForegroundActivityAt: now,
      createdAt: now,
    })),
  );
}
