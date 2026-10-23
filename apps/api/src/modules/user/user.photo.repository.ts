import { memberPhoto, type TenantPool, tenantMembership } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/** A person's photo in the company they act under (`member_photo`), on the runtime pool under RLS. */
@Injectable()
export class UserPhotoRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The file my membership in this company points at, or `null` for my initials. */
  async find(tenantId: string, userId: string): Promise<string | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({ fileId: memberPhoto.fileId })
        .from(memberPhoto)
        .innerJoin(tenantMembership, eq(tenantMembership.id, memberPhoto.membershipId))
        .where(
          and(
            eq(memberPhoto.tenantId, tenantId),
            eq(tenantMembership.tenantId, tenantId),
            eq(tenantMembership.userAccountId, userId),
          ),
        )
        .limit(1);
      return row?.fileId ?? null;
    });
  }

  /** Points the membership at the file, or clears it with `null`; answers what it now holds. */
  async set(
    tenantId: string,
    userId: string,
    fileId: string | null,
    now: number,
  ): Promise<string | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [membership] = await tx
        .select({ id: tenantMembership.id })
        .from(tenantMembership)
        .where(
          and(eq(tenantMembership.tenantId, tenantId), eq(tenantMembership.userAccountId, userId)),
        )
        .limit(1);
      if (!membership) throw new Error('the guard admitted a member route with no membership row');
      if (fileId === null) {
        await tx
          .delete(memberPhoto)
          .where(
            and(eq(memberPhoto.tenantId, tenantId), eq(memberPhoto.membershipId, membership.id)),
          );
        return null;
      }
      const at = new Date(now);
      await tx
        .insert(memberPhoto)
        .values({ membershipId: membership.id, tenantId, fileId, updatedAt: at })
        .onConflictDoUpdate({ target: memberPhoto.membershipId, set: { fileId, updatedAt: at } });
      return fileId;
    });
  }
}
