import { billingGatewayEvent, type Db } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** The transport dedupe of the gateway's messages: a global table, on the admin path. */
@Injectable()
export class GatewayEventAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** Whether this message was acted on before. */
  async handled(provider: string, eventRef: string): Promise<boolean> {
    const [row] = await this.db
      .select({ eventRef: billingGatewayEvent.eventRef })
      .from(billingGatewayEvent)
      .where(
        and(eq(billingGatewayEvent.provider, provider), eq(billingGatewayEvent.eventRef, eventRef)),
      )
      .limit(1);
    return row !== undefined;
  }

  /** Written only once the message's effect is done, so a crash before that is acted on again. */
  async remember(provider: string, eventRef: string, at: number): Promise<void> {
    await this.db
      .insert(billingGatewayEvent)
      .values({ provider, eventRef, receivedAt: new Date(at) })
      .onConflictDoNothing();
  }
}
