import { studioDocumentSchema } from '@heliogrid/contracts';
import { type DbTransaction, design, designDocument, lead } from '@heliogrid/db';
import { type Coordinate, drawingsAfterPinMove } from '@heliogrid/domain';
import { and, eq, inArray } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { sitePinOf } from '../crm/crm.public';

/** The site's pin as the lead holds it now, before a save moves it. */
export async function storedPinOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<Coordinate | null> {
  const [row] = await tx
    .select({ latitude: lead.siteLatitude, longitude: lead.siteLongitude })
    .from(lead)
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)));
  return row === undefined ? null : sitePinOf(row.latitude, row.longitude);
}

/**
 * Every design of the lead follows its pin (`drawingsAfterPinMove`): a fix keeps each roof on its
 * house, another site clears the roofs once the person agreed. `false` when roofs would be left
 * behind and they were not asked; nothing is written then. The caller holds the lead's lock, the
 * one a document save takes first, so no save lands between the read and the write. Each document
 * written is a new version by this person: a studio still open on the old one is refused its next
 * save, and reads the moved one.
 */
export async function drawingsFollowPin(
  tx: DbTransaction,
  on: { readonly tenantId: string; readonly leadId: string },
  move: {
    readonly before: Coordinate | null;
    readonly after: Coordinate;
    readonly remove: boolean;
  },
  act: Act,
): Promise<boolean> {
  const { tenantId, leadId } = on;
  const rows = await tx
    .select({
      designId: designDocument.designId,
      body: designDocument.body,
      version: designDocument.version,
    })
    .from(designDocument)
    .innerJoin(
      design,
      and(eq(design.tenantId, designDocument.tenantId), eq(design.id, designDocument.designId)),
    )
    .where(and(eq(designDocument.tenantId, tenantId), eq(design.leadId, leadId)));
  const documents = rows.map((row) => studioDocumentSchema.parse(row.body));
  const after = drawingsAfterPinMove(documents, move.before, move.after, move.remove);
  if (after.kind === 'refused') return false;
  const now = new Date(act.now);
  const written: string[] = [];
  for (const [i, row] of rows.entries()) {
    const document = after.documents[i];
    if (document == null) continue;
    await tx
      .update(designDocument)
      .set({
        schemaVersion: document.schemaVersion,
        body: document,
        version: row.version + 1,
        savedAt: now,
        savedBy: act.actorUserId,
        savedOpening: null,
      })
      .where(and(eq(designDocument.tenantId, tenantId), eq(designDocument.designId, row.designId)));
    written.push(row.designId);
  }
  if (written.length > 0) {
    await tx
      .update(design)
      .set({ updatedAt: now, updatedBy: act.actorUserId })
      .where(and(eq(design.tenantId, tenantId), inArray(design.id, written)));
  }
  return true;
}
