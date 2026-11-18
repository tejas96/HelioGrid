import type { DesignDetail, DesignSet, SaveSite } from '@heliogrid/contracts';
import { design } from '@heliogrid/db';
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
 * One studio proof's world: the proposals world, and the designs it made removed before the leads
 * they hang on.
 */
export type StudioWorld = ProposalsWorld;

export async function openStudioWorld(staffed: readonly Staffed<Team>[]): Promise<StudioWorld> {
  const world = await openProposalsWorld(staffed);
  const companies = staffed.map((one) => one.company.tenantId);
  return {
    ...world,
    async close() {
      await world.pools.admin.db.delete(design).where(inArray(design.tenantId, [...companies]));
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
