import { file, type TenantPool, type TenantScopedDb, uuidv7 } from '@heliogrid/db';
import type { FileContentType, StorageProvider, SubjectKind } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { objectKeyOf } from './internal/object-key';

export interface FileRow {
  readonly id: string;
  readonly subjectKind: SubjectKind;
  readonly subjectRef: string;
  /** The object key; never leaves the server. */
  readonly externalId: string;
  readonly contentType: FileContentType;
  readonly byteSize: number;
  readonly checksumSha256: string;
  readonly uploadedBy: string;
  readonly uploadedAt: Date | null;
}

export interface FileToDeclare {
  readonly subjectKind: SubjectKind;
  readonly subjectRef: string;
  readonly provider: StorageProvider;
  readonly contentType: FileContentType;
  readonly byteSize: number;
  readonly checksumSha256: string;
}

const fileColumns = () => ({
  id: file.id,
  subjectKind: file.subjectKind,
  subjectRef: file.subjectRef,
  externalId: file.externalId,
  contentType: file.contentType,
  byteSize: file.byteSize,
  checksumSha256: file.checksumSha256,
  uploadedBy: file.uploadedBy,
  uploadedAt: file.uploadedAt,
});

/** The one files table, on the runtime pool inside the tenant transaction. */
@Injectable()
export class FileRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * The pending row, keyed where the bytes will go. A declare retried with its key answers the
   * row the first send made (`F4-07`), under the key's lock so two sends never both insert.
   */
  async declare(
    tenantId: string,
    toDeclare: FileToDeclare,
    act: Act,
    key: CreationKey | null,
  ): Promise<Keyed<FileRow>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const earlier = await madeWithKey(tx, tenantId, key);
        if (earlier !== null) return earlier;
      }
      const id = uuidv7();
      const [row] = await tx
        .insert(file)
        .values({
          id,
          tenantId,
          ...toDeclare,
          externalId: objectKeyOf(tenantId, id),
          uploadedBy: act.actorUserId,
          declaredAt: new Date(act.now),
          creationKey: key?.key,
          creationFingerprint: key?.fingerprint,
        })
        .returning(fileColumns());
      if (!row) throw new Error('file insert returned no row');
      return { outcome: 'created', row };
    });
  }

  async find(tenantId: string, id: string): Promise<FileRow | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select(fileColumns())
        .from(file)
        .where(and(eq(file.tenantId, tenantId), eq(file.id, id)))
        .limit(1);
      return row ?? null;
    });
  }

  /**
   * Sets `uploaded_at` once, from null — the grant allows no other change. Two completes at once
   * both land here; the loser updates nothing and reads the winner's row back.
   */
  async markUploaded(tenantId: string, id: string, now: number): Promise<FileRow> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [updated] = await tx
        .update(file)
        .set({ uploadedAt: new Date(now) })
        .where(and(eq(file.tenantId, tenantId), eq(file.id, id), isNull(file.uploadedAt)))
        .returning(fileColumns());
      if (updated) return updated;
      const [already] = await tx
        .select(fileColumns())
        .from(file)
        .where(and(eq(file.tenantId, tenantId), eq(file.id, id)))
        .limit(1);
      if (!already) throw new Error('the file vanished inside its own transaction');
      return already;
    });
  }
}

async function madeWithKey(
  tx: TenantScopedDb,
  tenantId: string,
  key: CreationKey,
): Promise<Keyed<FileRow> | null> {
  const [made] = await tx
    .select({ ...fileColumns(), fingerprint: file.creationFingerprint })
    .from(file)
    .where(and(eq(file.tenantId, tenantId), eq(file.creationKey, key.key)))
    .limit(1);
  if (!made) return null;
  const { fingerprint, ...row } = made;
  return replayOf(row, fingerprint, key);
}
