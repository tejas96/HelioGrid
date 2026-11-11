import {
  file,
  project,
  projectDocument,
  projectFile,
  projectStageTransition,
  type TenantPool,
} from '@heliogrid/db';
import { projectNumberOf } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/** One file going into the pack, in the pack's order. */
export interface PackFile {
  readonly fileId: string;
  readonly contentType: string;
}

/** What the pack is made of — or that there is nothing to make. */
export type PackParts =
  | { readonly kind: 'not-handed-over' | 'made' }
  | {
      readonly kind: 'to-make';
      readonly files: readonly PackFile[];
      /** The project's number, which names the pack's file. */
      readonly number: string;
      /** Who handed it over — the pack is filed in their name. */
      readonly handedOverBy: string;
    };

/**
 * The handover pack's rows (`M08-46`, `M08-48`): every done checklist row's files in the pack's
 * row order, then each other file switched on for the customer — and, once made, the pack itself
 * on the `handover_pack` row.
 */
@Injectable()
export class ProjectsPackRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** Whether the project stands handed over — a pack is made for no other, and none for one gone. */
  isHandedOver(tenantId: string, projectId: string): Promise<boolean> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [found] = await tx
        .select({ stage: project.stage })
        .from(project)
        .where(and(eq(project.tenantId, tenantId), eq(project.id, projectId)));
      return found?.stage === 'handed_over';
    });
  }

  /**
   * What a handed-over project's pack holds: `rowOrder` is the market's checklist order and
   * `packRow` the row handover itself fills, which holds the pack once it is made.
   */
  partsOf(
    tenantId: string,
    projectId: string,
    rows: { readonly order: readonly string[]; readonly packRow: string },
  ): Promise<PackParts> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [found] = await tx
        .select({ stage: project.stage, number: project.number })
        .from(project)
        .where(and(eq(project.tenantId, tenantId), eq(project.id, projectId)));
      if (found === undefined || found.stage !== 'handed_over') return { kind: 'not-handed-over' };
      const filed = await tx
        .select({
          fileId: projectFile.fileId,
          slot: projectFile.slot,
          slotKey: projectFile.slotKey,
          shown: projectFile.shownToCustomer,
          contentType: file.contentType,
          addedAt: projectFile.addedAt,
        })
        .from(projectFile)
        .innerJoin(
          file,
          and(eq(file.id, projectFile.fileId), eq(file.tenantId, projectFile.tenantId)),
        )
        .where(
          and(
            eq(projectFile.tenantId, tenantId),
            eq(projectFile.projectId, projectId),
            inArray(projectFile.slot, ['document', 'other']),
          ),
        );
      if (filed.some((one) => one.slot === 'document' && one.slotKey === rows.packRow)) {
        return { kind: 'made' };
      }
      const done = new Set(
        (
          await tx
            .select({ row: projectDocument.rowKey })
            .from(projectDocument)
            .where(
              and(
                eq(projectDocument.tenantId, tenantId),
                eq(projectDocument.projectId, projectId),
                eq(projectDocument.state, 'done'),
              ),
            )
        ).map((one) => one.row),
      );
      const [handover] = await tx
        .select({ by: projectStageTransition.movedBy })
        .from(projectStageTransition)
        .where(
          and(
            eq(projectStageTransition.tenantId, tenantId),
            eq(projectStageTransition.projectId, projectId),
            eq(projectStageTransition.cause, 'handover'),
          ),
        )
        .orderBy(desc(projectStageTransition.movedAt))
        .limit(1);
      if (handover?.by == null)
        throw new Error(`project ${projectId} has no handover to file its pack under`);
      return {
        kind: 'to-make',
        files: packOrderOf(filed, done, rows),
        number: projectNumberOf(found.number),
        handedOverBy: handover.by,
      };
    });
  }

  /**
   * The pack step ran and made no file — nothing to put in it, or no file it could read: the count
   * left out tells the handover to stop waiting.
   */
  recordUnmade(tenantId: string, projectId: string, leftOut: number): Promise<void> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      await tx
        .update(project)
        .set({ packLeftOut: leftOut })
        .where(and(eq(project.tenantId, tenantId), eq(project.id, projectId)));
    });
  }

  /**
   * Puts the made pack on the pack's row with the count of files it left out, once; `false` when
   * an earlier run already had.
   */
  attach(
    tenantId: string,
    projectId: string,
    pack: {
      readonly fileId: string;
      readonly name: string;
      readonly by: string;
      readonly row: string;
      readonly leftOut: number;
    },
    now: Date,
  ): Promise<boolean> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      await tx
        .update(project)
        .set({ packLeftOut: pack.leftOut })
        .where(and(eq(project.tenantId, tenantId), eq(project.id, projectId)));
      const added = await tx
        .insert(projectFile)
        .values({
          tenantId,
          projectId,
          fileId: pack.fileId,
          slot: 'document',
          slotKey: pack.row,
          name: pack.name,
          addedAt: now,
          addedBy: pack.by,
        })
        .onConflictDoNothing()
        .returning({ id: projectFile.id });
      return added.length > 0;
    });
  }
}

interface FiledPart {
  readonly fileId: string;
  readonly slot: string;
  readonly slotKey: string | null;
  readonly shown: boolean;
  readonly contentType: string;
  readonly addedAt: Date;
}

/** Done rows' files in the pack's row order (oldest first within a row), then the shown others. */
function packOrderOf(
  filed: readonly FiledPart[],
  done: ReadonlySet<string>,
  rows: { readonly order: readonly string[]; readonly packRow: string },
): readonly PackFile[] {
  const byAdded = [...filed].sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime());
  const onRows = rows.order
    .filter((row) => row !== rows.packRow && done.has(row))
    .flatMap((row) => byAdded.filter((one) => one.slot === 'document' && one.slotKey === row));
  const others = byAdded.filter((one) => one.slot === 'other' && one.shown);
  return [...onRows, ...others].map(({ fileId, contentType }) => ({ fileId, contentType }));
}
