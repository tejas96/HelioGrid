import { randomUUID } from 'node:crypto';
import type {
  DesignDetail,
  DesignDocumentWire,
  DesignSet,
  EditTurnWire,
  SavedDocument,
  SaveSite,
  SiteDataWire,
  SkyPictureWire,
  StudioDocumentWire,
} from '@heliogrid/contracts';
import { design, designDocument, designPicture, designPictureFile } from '@heliogrid/db';
import { EMPTY_STUDIO_DOCUMENT } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import type { Staffed, Team } from '../crm/support';
import {
  type Caller,
  openProposalsWorld,
  type ProposalsWorld,
  retryKey,
} from '../proposals/support';

export { ownLead, storedEntriesOf } from '../crm/support';
export {
  aLead,
  aStaffedCompany,
  type Caller,
  preset,
  refusalOf,
  retryKey,
} from '../proposals/support';

/*
 * One studio proof's world: the proposals world, and the designs it made — their pictures and
 * documents first — removed before the leads they hang on.
 */
export type StudioWorld = ProposalsWorld;

export async function openStudioWorld(staffed: readonly Staffed<Team>[]): Promise<StudioWorld> {
  const world = await openProposalsWorld(staffed);
  const companies = staffed.map((one) => one.company.tenantId);
  return {
    ...world,
    async close() {
      const { db } = world.pools.admin;
      await db.delete(designPictureFile).where(inArray(designPictureFile.tenantId, [...companies]));
      await db.delete(designPicture).where(inArray(designPicture.tenantId, [...companies]));
      await db.delete(designDocument).where(inArray(designDocument.tenantId, [...companies]));
      await db.delete(design).where(inArray(design.tenantId, [...companies]));
      await world.close();
    },
  };
}

export const at = () => new Date().toISOString();

/** Create design as sent, whatever it answers. */
export function create(
  caller: Caller,
  leadId: string,
  copyOf: string | null = null,
  key = retryKey(),
) {
  return caller.call<DesignDetail>(
    'POST',
    `/leads/${leadId}/designs`,
    { copyOf, capturedAt: at() },
    key,
  );
}

/** A design made on the lead, or the test stops. */
export async function aDesign(caller: Caller, leadId: string): Promise<DesignDetail> {
  const reply = await create(caller, leadId);
  if (reply.status !== HttpStatus.CREATED) {
    throw new Error(
      `create design: expected 201, got ${reply.status} ${JSON.stringify(reply.body)}`,
    );
  }
  return reply.body;
}

export const designsOf = (caller: Caller, leadId: string) =>
  caller.call<DesignSet>('GET', `/leads/${leadId}/designs`);

export const detailOf = (caller: Caller, designId: string) =>
  caller.call<DesignDetail>('GET', `/designs/${designId}`);

/** Site details in Sangli, Maharashtra: every fact given. */
export const aSite = (typed: Partial<SaveSite> = {}): SaveSite => ({
  name: 'Sharma residence',
  address: 'Swapnanagri, Vishrambag, Sangli 416415',
  pin: { latitude: 16.8367, longitude: 74.5966 },
  area: { area: 'IN-MH', district: null },
  utilityOperator: 'MSEDCL',
  supplyPhase: 'single',
  sanctionedLoadKw: 8,
  mount: 'roof',
  capturedAt: at(),
  ...typed,
});

export const saveSite = (caller: Caller, designId: string, body: SaveSite = aSite()) =>
  caller.call<DesignDetail>('PUT', `/designs/${designId}/site`, body);

export const recommend = (caller: Caller, designId: string, recommended: boolean) =>
  caller.call<DesignSet>('PUT', `/designs/${designId}/recommended`, { recommended });

/** The document of a design as the reader reads it. */
export const documentOf = (caller: Caller, designId: string) =>
  caller.call<DesignDocumentWire>('GET', `/designs/${designId}/document`);

/** A save of the document over the version it was changed from, whatever it answers. */
export const saveDocument = (
  caller: Caller,
  designId: string,
  baseVersion: number,
  picture: StudioDocumentWire['picture'] = 'none',
  opening: string = randomUUID(),
) =>
  caller.call<SavedDocument>('PUT', `/designs/${designId}/document`, {
    baseVersion,
    document: { ...EMPTY_STUDIO_DOCUMENT, picture },
    opening,
  });

export const takeTurn = (caller: Caller, designId: string) =>
  caller.call<EditTurnWire>('PUT', `/designs/${designId}/edit-turn`);

export const giveTurn = (caller: Caller, designId: string) =>
  caller.call<undefined>('DELETE', `/designs/${designId}/edit-turn`);

export const skyPictureOf = (caller: Caller, designId: string, view?: 'straight_down') =>
  caller.call<SkyPictureWire>(
    'GET',
    `/designs/${designId}/sky-picture${view === undefined ? '' : `?view=${view}`}`,
  );

export const siteDataOf = (caller: Caller, designId: string) =>
  caller.call<SiteDataWire>('GET', `/designs/${designId}/site-data`);
