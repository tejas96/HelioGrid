import type { SaveDocument } from '@heliogrid/contracts';
import {
  type DbTransaction,
  design,
  designDocument,
  lead,
  type TenantPool,
  userAccount,
} from '@heliogrid/db';
import {
  type DesignActRefusal,
  EMPTY_STUDIO_DOCUMENT,
  editTurnOpenTo,
  editTurnUntil,
  isClosed,
  STUDIO_DOCUMENT_SCHEMA,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { type LeadReader, leadScopeWhere, lockLeadInScope, memberNameOf } from '../crm/crm.public';

const saver = alias(userAccount, 'document_saver');
const editor = alias(userAccount, 'document_editor');

/** A person as the document names them: their id and their name, when they still have one. */
export interface DocumentMember {
  readonly userId: string;
  readonly name: string | null;
}

/** A design's document as stored; `body` is parsed by the caller against the studio's schema. */
export interface DocumentRow {
  readonly body: unknown;
  readonly version: number;
  readonly savedAt: Date | null;
  readonly savedBy: DocumentMember | null;
  /** The studio opening that made the last save. */
  readonly savedOpening: string | null;
  readonly editor: DocumentEditor | null;
}

/** Who holds the turn to edit, and until when. */
export type DocumentEditor = DocumentMember & { readonly until: Date; readonly untilMs: number };

export type SaveOutcome =
  | { readonly outcome: 'saved'; readonly version: number; readonly savedAt: Date }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'refused'; readonly refusal: DesignActRefusal }
  | { readonly outcome: 'held'; readonly editor: DocumentMember }
  | {
      readonly outcome: 'saved-first';
      readonly version: number;
      readonly savedAt: Date;
      readonly savedBy: DocumentMember | null;
      readonly byThisOpening: boolean;
    };

/** A document's row with its saver's and editor's names. */
async function rowOf(tx: DbTransaction, tenantId: string, designId: string, lockIt: boolean) {
  const select = tx
    .select({
      body: designDocument.body,
      version: designDocument.version,
      savedAt: designDocument.savedAt,
      savedById: designDocument.savedBy,
      savedByName: memberNameOf(saver),
      savedOpening: designDocument.savedOpening,
      editorId: designDocument.editorId,
      editorName: memberNameOf(editor),
      editorUntil: designDocument.editorUntil,
    })
    .from(designDocument)
    .leftJoin(saver, eq(saver.id, designDocument.savedBy))
    .leftJoin(editor, eq(editor.id, designDocument.editorId))
    .where(and(eq(designDocument.tenantId, tenantId), eq(designDocument.designId, designId)));
  const [row] = lockIt ? await select.for('update', { of: designDocument }) : await select;
  if (row === undefined) return null;
  return {
    body: row.body,
    version: row.version,
    savedAt: row.savedAt,
    savedBy:
      row.savedById === null ? null : { userId: row.savedById, name: row.savedByName ?? null },
    savedOpening: row.savedOpening,
    editor:
      row.editorId === null || row.editorUntil === null
        ? null
        : {
            userId: row.editorId,
            name: row.editorName ?? null,
            until: row.editorUntil,
            untilMs: row.editorUntil.getTime(),
          },
  } satisfies DocumentRow;
}

/**
 * Why a save is refused, or `null`: another person holds the turn, or someone saved after the
 * version this change was made on. A turn taken with nothing saved yet is no one's version.
 */
function saveRefusalOf(row: DocumentRow | null, body: SaveDocument, act: Act): SaveOutcome | null {
  if (row === null) return null;
  if (row.editor !== null && !editTurnOpenTo(row.editor, act.actorUserId, act.now)) {
    return { outcome: 'held', editor: row.editor };
  }
  if (body.baseVersion === row.version || row.savedAt === null) return null;
  return {
    outcome: 'saved-first',
    version: row.version,
    savedAt: row.savedAt,
    savedBy: row.savedBy,
    byThisOpening: row.savedOpening === body.opening,
  };
}

/** The lead a design hangs on, in this company; `null` when there is no such design. */
async function leadIdOf(tx: DbTransaction, tenantId: string, designId: string) {
  const [found] = await tx
    .select({ leadId: design.leadId })
    .from(design)
    .where(and(eq(design.tenantId, tenantId), eq(design.id, designId)));
  return found?.leadId ?? null;
}

/**
 * The design document's reads and writes on the runtime pool. Every read is narrowed to the leads
 * the reader's presets reach; every write locks the design's lead first — the one lock order a
 * lead write takes — then the document's row, and reads both after the locks.
 */
@Injectable()
export class StudioDocumentRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * The document as it stands; `undefined` when its design is not the reader's to see, `null` when
   * no one has taken its turn or saved it yet.
   */
  documentOf(reader: LeadReader, designId: string): Promise<DocumentRow | null | undefined> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [seen] = await tx
        .select({ id: design.id })
        .from(design)
        .innerJoin(lead, and(eq(lead.id, design.leadId), eq(lead.tenantId, design.tenantId)))
        .where(
          and(
            eq(design.tenantId, tenantId),
            eq(design.id, designId),
            leadScopeWhere(reader.scope, reader.actorId),
          ),
        );
      if (seen === undefined) return undefined;
      return rowOf(tx, tenantId, designId, false);
    });
  }

  /**
   * The whole document saved over the version it was changed from. Refused when someone saved
   * since — with who and when — or holds the turn; a save takes or renews the saver's turn.
   */
  save(reader: LeadReader, designId: string, body: SaveDocument, act: Act): Promise<SaveOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx): Promise<SaveOutcome> => {
      const leadId = await leadIdOf(tx, tenantId, designId);
      if (leadId === null) return { outcome: 'not-found' };
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return { outcome: 'not-found' };
      if (isClosed(locked.lifecycle)) return { outcome: 'refused', refusal: 'host_closed' };
      const now = new Date(act.now);
      const row = await rowOf(tx, tenantId, designId, true);
      const refused = saveRefusalOf(row, body, act);
      if (refused !== null) return refused;
      const current = row?.version ?? 0;
      const written = {
        schemaVersion: body.document.schemaVersion,
        body: body.document,
        version: current + 1,
        savedAt: now,
        savedBy: act.actorUserId,
        savedOpening: body.opening,
        editorId: act.actorUserId,
        editorUntil: new Date(editTurnUntil(act.now)),
      };
      if (row === null) {
        await tx.insert(designDocument).values({ designId, tenantId, ...written });
      } else {
        await tx
          .update(designDocument)
          .set(written)
          .where(and(eq(designDocument.tenantId, tenantId), eq(designDocument.designId, designId)));
      }
      await tx
        .update(design)
        .set({ updatedAt: now, updatedBy: act.actorUserId })
        .where(and(eq(design.tenantId, tenantId), eq(design.id, designId)));
      return { outcome: 'saved', version: current + 1, savedAt: now };
    });
  }

  /**
   * The turn to edit taken or renewed when it is free, the reader's own, or run out; answered with
   * whoever holds it after. `undefined` when the design is not the reader's to see, `closed` when its
   * lead takes no more change.
   */
  takeTurn(
    reader: LeadReader,
    designId: string,
    act: Act,
  ): Promise<DocumentEditor | 'closed' | undefined> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const leadId = await leadIdOf(tx, tenantId, designId);
      if (leadId === null) return undefined;
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return undefined;
      // A closed lead takes no change, so no one takes its design's turn: it opens view-only.
      if (isClosed(locked.lifecycle)) return 'closed';
      const row = await rowOf(tx, tenantId, designId, true);
      if (row?.editor != null && !editTurnOpenTo(row.editor, act.actorUserId, act.now)) {
        return row.editor;
      }
      const turn = { editorId: act.actorUserId, editorUntil: new Date(editTurnUntil(act.now)) };
      if (row === null) {
        await tx.insert(designDocument).values({
          designId,
          tenantId,
          schemaVersion: STUDIO_DOCUMENT_SCHEMA,
          body: EMPTY_STUDIO_DOCUMENT,
          version: 0,
          ...turn,
        });
      } else {
        await tx
          .update(designDocument)
          .set(turn)
          .where(and(eq(designDocument.tenantId, tenantId), eq(designDocument.designId, designId)));
      }
      const [me] = await tx
        .select({ name: memberNameOf(userAccount) })
        .from(userAccount)
        .where(eq(userAccount.id, act.actorUserId));
      return {
        userId: act.actorUserId,
        name: me?.name ?? null,
        until: turn.editorUntil,
        untilMs: turn.editorUntil.getTime(),
      };
    });
  }

  /** The reader's turn given back; a turn held by another stays. `false` when the design is not theirs to see. */
  giveTurn(reader: LeadReader, designId: string, act: Act): Promise<boolean> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const leadId = await leadIdOf(tx, tenantId, designId);
      if (leadId === null || (await lockLeadInScope(tx, reader, leadId)) === null) return false;
      await tx
        .update(designDocument)
        .set({ editorId: null, editorUntil: null })
        .where(
          and(
            eq(designDocument.tenantId, tenantId),
            eq(designDocument.designId, designId),
            eq(designDocument.editorId, act.actorUserId),
          ),
        );
      return true;
    });
  }
}
