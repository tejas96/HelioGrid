import { type Db, userAccount } from '@heliogrid/db';
import type { MeasurementSystem, UiLanguage } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

export interface ProfileRow {
  readonly id: string;
  readonly phoneE164: string;
  readonly name: string | null;
  readonly interfaceLanguage: UiLanguage;
  readonly unitPreference: MeasurementSystem;
}

/**
 * The one profile write (`M01-14`). `user_account` is a platform table every write reaches on
 * the admin path; the actor is the session's, never a body field, so a person edits only their
 * own row.
 */
@Injectable()
export class UserAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async byId(userId: string): Promise<ProfileRow | null> {
    const [row] = await this.db
      .select(profileColumns())
      .from(userAccount)
      .where(eq(userAccount.id, userId))
      .limit(1);
    return row ?? null;
  }

  async update(
    userId: string,
    patch: { name?: string; interfaceLanguage?: UiLanguage; unitPreference?: MeasurementSystem },
  ): Promise<ProfileRow | null> {
    const [row] = await this.db
      .update(userAccount)
      .set(patch)
      .where(eq(userAccount.id, userId))
      .returning(profileColumns());
    return row ?? null;
  }
}

function profileColumns() {
  return {
    id: userAccount.id,
    phoneE164: userAccount.phoneE164,
    name: userAccount.name,
    interfaceLanguage: userAccount.interfaceLanguage,
    unitPreference: userAccount.unitPreference,
  };
}
