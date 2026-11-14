import type { ProposalList, ProposalRow } from '@heliogrid/contracts';
import {
  can,
  draftProgress,
  listFilterOf,
  type MarketPack,
  minorUnits,
  type ProposalListFilter,
  proposalStandingOf,
} from '@heliogrid/domain';
import { minorUnitsToDecimal, proposalNumberOf } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { type LeadReader, memberRefOf } from '../crm/crm.public';
import { SettingsService } from '../settings/settings.public';
import { type ProposalListRead, ProposalsListRepository } from './proposals.list.repository';
import { latestFreshness } from './proposals.track-wire';

type ListRow = ProposalListRead['rows'][number];

/** The newest thing that happened to a proposal, and when — the list row's one line (`M06-48`). */
function latestOf(row: ListRow, standing: ProposalRow['standing']): ProposalRow['latest'] {
  const at = (moment: Date | null) => (moment ?? row.updatedAt).toISOString();
  const event = (name: ProposalRow['latest']['event'], moment: Date | null) => ({
    event: name,
    at: at(moment),
    viewedSeconds: null,
  });
  switch (standing) {
    case 'ready':
      return event('generated', row.generatedAt);
    case 'shared':
      return event('shared', row.sharedAt);
    case 'opened':
      return event('opened', row.openedAt);
    case 'negotiating':
      return event('change_asked', row.answeredAt);
    case 'accepted':
      return event('accepted', row.answeredAt);
    case 'declined':
      return event('declined', row.answeredAt);
    case 'won':
      return event('won', row.wonAt);
    case 'replaced':
      return event('replaced', null);
    case 'withdrawn':
      return event('withdrawn', null);
    default:
      return event('drafted', null);
  }
}

/**
 * The proposals list (`M06-48`, `T-M06-019`): each proposal with where it stands as a word, its
 * number, its system and its price, and the newest thing that happened to it; each chip's count;
 * and what the waiting ones are worth together — a pipeline figure, never revenue (`M13-03`).
 */
@Injectable()
export class ProposalsListService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProposalsListRepository) private readonly rows: ProposalsListRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  async list(
    reader: LeadReader,
    query: { filter: ProposalListFilter; mine?: boolean; limit: number; page: number },
  ): Promise<ProposalList> {
    const pack = await this.settings.packOf(reader.tenantId);
    const digits = pack.formats.minorUnitDigits;
    const read = await this.rows.list(reader, {
      filter: query.filter,
      mine: query.mine === true,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
    const under = (filter: Exclude<ProposalListFilter, 'all'>) =>
      read.byStatus.filter((group) => listFilterOf(group.status, group.won) === filter);
    const countOf = (filter: Exclude<ProposalListFilter, 'all'>) =>
      under(filter).reduce((sum, group) => sum + group.n, 0);
    const waiting = under('waiting').reduce((sum, group) => sum + Number(group.payable), 0);
    return {
      currencyCode: pack.formats.currency,
      rows: {
        items: read.rows.map((row) => rowWire(row, pack)),
        totalCount: read.totalCount,
      },
      counts: {
        all: read.byStatus.reduce((sum, group) => sum + group.n, 0),
        waiting: countOf('waiting'),
        draft: countOf('draft'),
        accepted: countOf('accepted'),
        closed: countOf('closed'),
      },
      waitingValue: minorUnitsToDecimal(minorUnits(waiting), digits),
      // *New proposal* starts with a new lead: offered only to who can save one (`T-M06-032`).
      canStart:
        can(reader.roles, 'crm.add_edit_leads') &&
        can(reader.roles, 'proposals.create_edit_proposals'),
    };
  }
}

function rowWire(row: ListRow, pack: MarketPack): ProposalRow {
  const standing = proposalStandingOf({
    status: row.status,
    generated: row.latestVersion !== null,
    opened: row.openedAt !== null,
    changeAsked: row.answer === 'negotiate',
    won: row.wonAt !== null,
  });
  const unshared = row.latestVersion !== null && row.latestVersion !== row.sharedVersion;
  const freshness =
    unshared && row.latestPins !== null && row.generatedAt !== null
      ? latestFreshness({ pins: row.latestPins }, pack)
      : null;
  return {
    id: row.id,
    leadId: row.leadId,
    customerName: row.customerName,
    city: row.city,
    number: row.number === null ? null : proposalNumberOf(row.number),
    // The version whose price the row shows: the one on the customer's link (`M06-45`).
    version: row.versionOnLink,
    capacityKw: row.fieldSet.system.capacityKw,
    systemType: row.fieldSet.system.systemType,
    payable:
      row.payableMinor === null
        ? null
        : minorUnitsToDecimal(minorUnits(row.payableMinor), pack.formats.minorUnitDigits),
    standing,
    progress: draftProgress({
      fields: row.fieldSet,
      deal: {
        segment: null,
        area: row.siteArea === null ? null : { area: row.siteArea, district: row.siteDistrict },
        siteAddress: row.siteAddress,
        sanctionedLoadKw: null,
        supplyPhase: null,
        monthlyBill: null,
        clientName: row.customerName,
        clientPhoneValid: true,
      },
      // Done and default both count: the templates only tell those two apart.
      templates: row.fieldSet,
    }),
    latest: latestOf(row, standing),
    stale: freshness !== null && freshness.kind !== 'current',
    createdBy: memberRefOf(row.createdBy, row.creatorName),
  };
}
