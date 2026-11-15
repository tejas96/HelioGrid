import type {
  ComponentLineWire,
  EditProposal,
  ProposalDetail,
  ProposalFieldsEdit,
} from '@heliogrid/contracts';
import {
  acceptanceRecord,
  callbackRequest,
  customerLink,
  customerQuestion,
  linkEvent,
  linkToken,
  project,
  proposal,
  proposalShare,
  proposalVersion,
  savedPart,
  task,
} from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import type { Caller, Staffed, Team } from '../crm/support';
import { retryKey } from '../crm/support';
import { openProjectsWorld, type ProjectsWorld } from '../projects/support';
import type { Reply } from '../support/http';

export { auditEntriesOf, ownLead, retryKey, storedEntriesOf } from '../crm/support';
export {
  aLead,
  aStaffedCompany,
  aWin,
  type Caller,
  markWon,
  now,
  preset,
  type Refused,
  refusalOf,
} from '../projects/support';

/*
 * One proposals proof's world: the projects world (its companies, people, leads and projects), and
 * the proposal rows it made removed before the rows they point at — a proposal names its lead and
 * its people, a link its lead, so those could not be removed while one stands.
 */
export type ProposalsWorld = ProjectsWorld;

export async function openProposalsWorld(
  staffed: readonly Staffed<Team>[],
): Promise<ProposalsWorld> {
  const world = await openProjectsWorld(staffed);
  const companies = staffed.map((one) => one.company.tenantId);
  return {
    ...world,
    async close() {
      const db = world.pools.admin.db;
      // A project names the version it runs on (`M08-50`): the pointer goes before the version.
      await db
        .update(project)
        .set({ proposalVersionId: null })
        .where(inArray(project.tenantId, [...companies]));
      for (const table of [
        acceptanceRecord,
        customerQuestion,
        callbackRequest,
        linkEvent,
        linkToken,
        customerLink,
        proposalShare,
        proposalVersion,
        proposal,
        savedPart,
        task,
      ]) {
        await db.delete(table).where(inArray(table.tenantId, [...companies]));
      }
      await world.close();
    },
  };
}

const at = () => new Date().toISOString();

/** Pune, Maharashtra: a region and a district the India pack holds. */
export const pune = { area: 'IN-MH', district: 'Pune' } as const;

export function start(
  caller: Caller,
  leadId: string,
  typed: { quickMode?: boolean; copyOf?: string | null } = {},
  key = retryKey(),
): Promise<Reply<ProposalDetail>> {
  return caller.call<ProposalDetail>(
    'POST',
    `/leads/${leadId}/proposals`,
    { quickMode: typed.quickMode ?? false, copyOf: typed.copyOf ?? null, capturedAt: at() },
    key,
  );
}

/** A draft started on the lead, which must succeed. */
export async function aDraft(
  caller: Caller,
  leadId: string,
  quickMode = false,
): Promise<ProposalDetail> {
  const reply = await start(caller, leadId, { quickMode });
  if (reply.status !== HttpStatus.CREATED) {
    throw new Error(`start: expected 201, got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return reply.body;
}

export function detailOf(caller: Caller, proposalId: string) {
  return caller.call<ProposalDetail>('GET', `/proposals/${proposalId}`);
}

export function edit(
  caller: Caller,
  on: Pick<ProposalDetail, 'id' | 'revision'>,
  change: Omit<EditProposal, 'revision' | 'capturedAt'>,
): Promise<Reply<ProposalDetail>> {
  return caller.call<ProposalDetail>('PATCH', `/proposals/${on.id}`, {
    revision: on.revision,
    capturedAt: at(),
    ...change,
  });
}

/** One commit that must succeed: the proposal as it then stands. */
export async function edited(
  caller: Caller,
  on: Pick<ProposalDetail, 'id' | 'revision'>,
  change: Omit<EditProposal, 'revision' | 'capturedAt'>,
): Promise<ProposalDetail> {
  const reply = await edit(caller, on, change);
  if (reply.status !== HttpStatus.OK) {
    throw new Error(`edit: expected 200, got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return reply.body;
}

const line: Pick<
  ComponentLineWire,
  'description' | 'count' | 'source' | 'catalogItemId' | 'savedPartId' | 'tier' | 'certifications'
> = {
  description: null,
  count: null,
  source: 'custom',
  catalogItemId: null,
  savedPartId: null,
  tier: 'assumed',
  certifications: [],
};

/** One brand in each of the five mandatory sections — six panels of 500 Wp on a 3 kW inverter. */
export function fiveComponents(panel: Partial<ComponentLineWire> = {}): ComponentLineWire[] {
  return [
    {
      ...line,
      category: 'panel',
      brand: 'Waaree',
      count: 6,
      wattPeak: 500,
      technology: 'topcon',
      warranty: '25 years',
      certifications: [{ scheme: 'DCR', reference: null }],
      ...panel,
    } as ComponentLineWire,
    {
      ...line,
      category: 'inverter',
      brand: 'Growatt',
      count: 1,
      capacityKw: 3,
      inverterType: 'on_grid',
      phases: 1,
      warranty: '10 years',
    },
    {
      ...line,
      category: 'cable',
      brand: 'Polycab',
      cableType: 'DC',
      specification: '4 sq mm',
      warranty: null,
    },
    { ...line, category: 'electrical', brand: 'Havells', includes: 'ACDB, DCDB', standard: null },
    {
      ...line,
      category: 'structure',
      brand: 'Tata',
      warranty: null,
      weightPerKw: null,
      standard: null,
    },
  ];
}

/** Step 3 as a person fills it: 3 kW on-grid at ₹1,90,575 with tax, incentive claimed. */
export function systemOf(
  detail: ProposalDetail,
  typed: Partial<ProposalFieldsEdit['system'] & object> = {},
) {
  return {
    ...detail.document.fields.system,
    capacityKw: 3,
    priceInclusive: '190575.00',
    ...typed,
  };
}

/**
 * A draft every check passes on: the site in Pune with its address, a residential 3 kW system at
 * ₹1,90,575, the generation filled, and one brand in each mandatory section.
 */
export async function aReadyDraft(caller: Caller, leadId: string): Promise<ProposalDetail> {
  const named = await caller.call('PATCH', `/leads/${leadId}`, {
    name: 'Anil Sharma',
    capturedAt: at(),
  });
  if (named.status !== HttpStatus.OK) throw new Error(`lead name: got ${named.status}`);
  const draft = await aDraft(caller, leadId);
  const sited = await edited(caller, draft, {
    deal: { segment: 'residential', area: pune, siteAddress: '12 Baner Road, Pune' },
    fields: { system: systemOf(draft), components: fiveComponents() },
  });
  const filled = await caller.call<ProposalDetail>('POST', `/proposals/${draft.id}/energy`, {
    revision: sited.revision,
    mode: 'fill',
    capturedAt: at(),
  });
  if (filled.status !== HttpStatus.OK) {
    throw new Error(`energy: expected 200, got ${filled.status} ${JSON.stringify(filled.body)}`);
  }
  return filled.body;
}

export interface Generated {
  readonly proposal: ProposalDetail;
  readonly number: string;
  readonly version: number;
}

export function generate(
  caller: Caller,
  on: Pick<ProposalDetail, 'id' | 'revision'>,
  typed: { changeNote?: string | null; belowCostConfirmed?: boolean } = {},
  key = retryKey(),
): Promise<Reply<Generated>> {
  return caller.call<Generated>(
    'POST',
    `/proposals/${on.id}/generate`,
    {
      revision: on.revision,
      changeNote: typed.changeNote ?? null,
      belowCostConfirmed: typed.belowCostConfirmed ?? false,
      capturedAt: at(),
    },
    key,
  );
}

/** A ready draft generated: the proposal with its number and first version. */
export async function aGenerated(caller: Caller, leadId: string): Promise<Generated> {
  const ready = await aReadyDraft(caller, leadId);
  const reply = await generate(caller, ready);
  if (reply.status !== HttpStatus.CREATED) {
    throw new Error(`generate: expected 201, got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return reply.body;
}

export function share(
  caller: Caller,
  proposalId: string,
  channel: 'whatsapp' | 'copy_link' = 'whatsapp',
) {
  return caller.call<{
    proposal: ProposalDetail;
    followUpOn: string;
    message: { text: string; link: string | null };
  }>('POST', `/proposals/${proposalId}/share`, { channel, capturedAt: at() });
}

/** A generated proposal marked shared, which must succeed. */
export async function aShared(caller: Caller, leadId: string): Promise<ProposalDetail> {
  const made = await aGenerated(caller, leadId);
  const reply = await share(caller, made.proposal.id);
  if (reply.status !== HttpStatus.OK) {
    throw new Error(`share: expected 200, got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return reply.body.proposal;
}
