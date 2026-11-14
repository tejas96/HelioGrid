import { type Db, linkToken } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { linkTokenHash } from './internal/link-secret';

/** A presented token, found: whose it is, and whether that address was turned off. */
export interface PresentedToken {
  readonly tenantId: string;
  readonly linkId: string;
  readonly tokenId: string;
  readonly revoked: boolean;
}

/**
 * Whose link a token opens (`F5-21`): the customer arrives with no session and no company — the
 * token is their whole authority — so the company is found here, by the token's hash, on the admin
 * path, and every read and write after it is that company's own. It answers the ids and nothing a
 * page could show.
 */
@Injectable()
export class LinkTokenAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async presented(token: string): Promise<PresentedToken | null> {
    const [row] = await this.db
      .select({
        tenantId: linkToken.tenantId,
        linkId: linkToken.linkId,
        tokenId: linkToken.id,
        revokedAt: linkToken.revokedAt,
      })
      .from(linkToken)
      .where(eq(linkToken.tokenHash, linkTokenHash(token)));
    if (row === undefined) return null;
    const { revokedAt, ...found } = row;
    return { ...found, revoked: revokedAt !== null };
  }
}
