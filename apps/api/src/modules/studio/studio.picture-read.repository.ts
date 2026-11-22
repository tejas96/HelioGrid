import { designPicture, type TenantPool } from '@heliogrid/db';
import type { DesignPictureRefusal, DesignPictureState } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { insertParts } from './studio.picture.repository';

/** A plan our server is still to read: the stored file it reads. */
export interface PlanToRead {
  readonly sourceFileId: string;
}

/**
 * A CAD plan's read on our server (`designPlanRead`), its writes on the runtime pool: what is left
 * to read, and the one end each read takes. A workflow step has no reader: it acts for the company
 * the picture is in, and only on the picture the workflow names.
 */
@Injectable()
export class StudioPictureReadRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The plan our server is to read; `null` when the picture is gone or its read has ended. */
  planToRead(tenantId: string, pictureId: string): Promise<PlanToRead | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({ sourceFileId: designPicture.sourceFileId, state: designPicture.state })
        .from(designPicture)
        .where(and(eq(designPicture.tenantId, tenantId), eq(designPicture.id, pictureId)));
      if (row === undefined || row.state !== 'reading' || row.sourceFileId === null) return null;
      return { sourceFileId: row.sourceFileId };
    });
  }

  /**
   * Ends the read as `ready` with its facts and lines, or `refused` with the reason — once: a read
   * already ended keeps its answer, and the state it holds is answered.
   */
  endRead(
    tenantId: string,
    pictureId: string,
    end:
      | { readonly state: 'ready'; readonly facts: object; readonly linesFileId: string }
      | { readonly state: 'refused'; readonly refusal: DesignPictureRefusal },
  ): Promise<DesignPictureState | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({ state: designPicture.state })
        .from(designPicture)
        .where(and(eq(designPicture.tenantId, tenantId), eq(designPicture.id, pictureId)))
        .for('update');
      if (row === undefined) return null;
      if (row.state !== 'reading') return row.state;
      const ofPicture = and(eq(designPicture.tenantId, tenantId), eq(designPicture.id, pictureId));
      if (end.state === 'refused') {
        await tx
          .update(designPicture)
          .set({ state: 'refused', refusal: end.refusal })
          .where(ofPicture);
        return 'refused';
      }
      await insertParts(tx, tenantId, pictureId, [
        { fileId: end.linesFileId, page: 1, role: 'lines', box: null },
      ]);
      await tx
        .update(designPicture)
        .set({ state: 'ready', facts: end.facts as { pages: number; pickedPage: number } })
        .where(ofPicture);
      return 'ready';
    });
  }
}
