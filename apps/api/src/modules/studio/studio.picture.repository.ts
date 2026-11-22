import { designPlanReadWorkflow } from '@heliogrid/contracts/workflows';
import {
  type DbTransaction,
  design,
  designPicture,
  designPictureFile,
  lead,
  type TenantPool,
  userAccount,
  uuidv7,
} from '@heliogrid/db';
import {
  type DesignActRefusal,
  type DesignPictureFileRole,
  type DesignPictureKind,
  type DesignPictureRefusal,
  type DesignPictureState,
  isClosed,
  type LeadScope,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { TENANT_DB } from '../../common/db/tenant.token';
import { recordOutboxEvent } from '../../common/temporal/outbox.repository';
import { type LeadReader, leadScopeWhere, lockLeadInScope, memberNameOf } from '../crm/crm.public';

/** A box in the picture's own units. */
export interface PictureBox {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

/** One stored part of a picture. */
export interface PictureFileRow {
  readonly fileId: string;
  readonly page: number;
  readonly role: DesignPictureFileRole;
  readonly box: PictureBox | null;
}

/** A picture as stored, with who added it. `facts` is the envelope, parsed by the service. */
export interface PictureRow {
  readonly id: string;
  readonly kind: DesignPictureKind;
  readonly name: string;
  readonly state: DesignPictureState;
  readonly refusal: DesignPictureRefusal | null;
  readonly facts: unknown;
  readonly addedAt: Date;
  readonly addedBy: string;
  readonly addedByName: string | null;
  readonly files: readonly PictureFileRow[];
}

/** A picture to keep: read on the device (`ready`, its parts given), or a plan our server reads. */
export type NewPicture =
  | {
      readonly read: 'device';
      readonly kind: DesignPictureKind;
      readonly name: string;
      readonly facts: object;
      readonly files: readonly PictureFileRow[];
    }
  | { readonly read: 'server'; readonly name: string; readonly sourceFileId: string };

/** The picture made, and the read our server starts on it — `null` for one read on the device. */
export interface PictureMade {
  readonly pictureId: string;
  readonly eventId: string | null;
}

export type AddPictureOutcome =
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'refused'; readonly refusal: DesignActRefusal }
  | Keyed<PictureMade>;

const boxOf = (row: {
  boxWest: number | null;
  boxSouth: number | null;
  boxEast: number | null;
  boxNorth: number | null;
}): PictureBox | null =>
  row.boxWest === null || row.boxSouth === null || row.boxEast === null || row.boxNorth === null
    ? null
    : { west: row.boxWest, south: row.boxSouth, east: row.boxEast, north: row.boxNorth };

async function partsOf(
  tx: DbTransaction,
  tenantId: string,
  pictureId: string,
): Promise<PictureFileRow[]> {
  const rows = await tx
    .select({
      fileId: designPictureFile.fileId,
      page: designPictureFile.page,
      role: designPictureFile.role,
      boxWest: designPictureFile.boxWest,
      boxSouth: designPictureFile.boxSouth,
      boxEast: designPictureFile.boxEast,
      boxNorth: designPictureFile.boxNorth,
    })
    .from(designPictureFile)
    .where(
      and(eq(designPictureFile.tenantId, tenantId), eq(designPictureFile.pictureId, pictureId)),
    )
    .orderBy(asc(designPictureFile.page), asc(designPictureFile.fileId));
  return rows.map((row) => ({
    fileId: row.fileId,
    page: row.page,
    role: row.role,
    box: boxOf(row),
  }));
}

export async function insertParts(
  tx: DbTransaction,
  tenantId: string,
  pictureId: string,
  parts: readonly PictureFileRow[],
): Promise<void> {
  if (parts.length === 0) return;
  await tx.insert(designPictureFile).values(
    parts.map((part) => ({
      pictureId,
      tenantId,
      fileId: part.fileId,
      page: part.page,
      role: part.role,
      boxWest: part.box?.west ?? null,
      boxSouth: part.box?.south ?? null,
      boxEast: part.box?.east ?? null,
      boxNorth: part.box?.north ?? null,
    })),
  );
}

/**
 * A design's pictures of its own (`T-M05-002d`) on the runtime pool. A read is narrowed to the
 * leads the reader's presets reach, as every design read is: another company's picture and one on a
 * lead out of scope answer alike, as no such picture. Adding one locks the design's lead first —
 * the one lock order a lead write takes.
 */
@Injectable()
export class StudioPictureRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** Keeps the picture with the design; a plan our server reads starts its read in the same commit. */
  add(
    reader: LeadReader,
    designId: string,
    picture: NewPicture,
    key: CreationKey | null,
    act: Act,
  ): Promise<AddPictureOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx): Promise<AddPictureOutcome> => {
      const [found] = await tx
        .select({ leadId: design.leadId })
        .from(design)
        .where(and(eq(design.tenantId, tenantId), eq(design.id, designId)));
      if (found === undefined) return { outcome: 'not-found' };
      const locked = await lockLeadInScope(tx, reader, found.leadId);
      if (locked === null) return { outcome: 'not-found' };
      if (key !== null) {
        const [made] = await tx
          .select({ id: designPicture.id, fingerprint: designPicture.creationFingerprint })
          .from(designPicture)
          .where(and(eq(designPicture.tenantId, tenantId), eq(designPicture.creationKey, key.key)));
        if (made !== undefined) {
          return replayOf({ pictureId: made.id, eventId: null }, made.fingerprint, key);
        }
      }
      if (isClosed(locked.lifecycle)) return { outcome: 'refused', refusal: 'host_closed' };
      const pictureId = uuidv7();
      const common = {
        id: pictureId,
        tenantId,
        designId,
        name: picture.name,
        addedAt: new Date(act.now),
        addedBy: act.actorUserId,
        creationKey: key?.key,
        creationFingerprint: key?.fingerprint,
      };
      if (picture.read === 'device') {
        await tx.insert(designPicture).values({
          ...common,
          kind: picture.kind,
          state: 'ready',
          facts: picture.facts as { pages: number; pickedPage: number },
        });
        await insertParts(tx, tenantId, pictureId, picture.files);
        return { outcome: 'created', row: { pictureId, eventId: null } };
      }
      await tx.insert(designPicture).values({
        ...common,
        kind: 'plan',
        state: 'reading',
        sourceFileId: picture.sourceFileId,
      });
      const eventId = uuidv7();
      await recordOutboxEvent(tx, tenantId, designPlanReadWorkflow, {
        eventId,
        tenantId,
        pictureId,
      });
      return { outcome: 'created', row: { pictureId, eventId } };
    });
  }

  /** One picture of the design; `null` when the design's lead is not the reader's to see. */
  find(reader: LeadReader, designId: string, pictureId: string): Promise<PictureRow | null> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          id: designPicture.id,
          kind: designPicture.kind,
          name: designPicture.name,
          state: designPicture.state,
          refusal: designPicture.refusal,
          facts: designPicture.facts,
          addedAt: designPicture.addedAt,
          addedBy: designPicture.addedBy,
          addedByName: memberNameOf(userAccount),
        })
        .from(designPicture)
        .innerJoin(
          design,
          and(eq(design.id, designPicture.designId), eq(design.tenantId, designPicture.tenantId)),
        )
        .innerJoin(lead, and(eq(lead.id, design.leadId), eq(lead.tenantId, design.tenantId)))
        .innerJoin(userAccount, eq(userAccount.id, designPicture.addedBy))
        .where(
          and(
            eq(designPicture.tenantId, tenantId),
            eq(designPicture.id, pictureId),
            eq(designPicture.designId, designId),
            leadScopeWhere(reader.scope, reader.actorId),
          ),
        );
      if (row === undefined) return null;
      return { ...row, files: await partsOf(tx, tenantId, pictureId) };
    });
  }

  /** Whether the design is in the company and on a lead the person's presets reach. */
  designInScope(
    tenantId: string,
    designId: string,
    person: { readonly userId: string; readonly scope: LeadScope },
  ): Promise<boolean> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [found] = await tx
        .select({ id: design.id })
        .from(design)
        .innerJoin(lead, and(eq(lead.id, design.leadId), eq(lead.tenantId, design.tenantId)))
        .where(
          and(
            eq(design.tenantId, tenantId),
            eq(design.id, designId),
            leadScopeWhere(person.scope, person.userId),
          ),
        );
      return found !== undefined;
    });
  }
}
