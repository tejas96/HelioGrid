import type { ProposalDetail, ProposalVersionSummary } from '@heliogrid/contracts';
import {
  type CurrentInputs,
  type Freshness,
  freshnessOf,
  issueBlockedBy,
  type MarketPack,
  minorUnits,
  PROPOSAL_ENGINES,
  proposalStandingOf,
} from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';
import { memberRefOf } from '../crm/crm.public';
import type { ProposalFacts } from './proposals.read.repository';
import type { VersionRow } from './proposals.track.repository';

/*
 * A proposal's standing, its versions and what its link saw, as the track screen and the lists read
 * them (`M06-42`, `M06-54`, `F8-13`): one mapping from the stored facts, so no two surfaces word a
 * proposal's state differently.
 */

/** Where the proposal stands as a person reads it (`proposalStandingOf`). */
export function standingOf(facts: Pick<ProposalFacts, 'proposal' | 'project'>) {
  const { proposal } = facts;
  return proposalStandingOf({
    status: proposal.status,
    generated: proposal.latestVersion !== null,
    opened: proposal.openedAt !== null,
    changeAsked: proposal.answer === 'negotiate',
    won: facts.project !== null,
  });
}

/** Whether the newest version's figures are still current (`F8-13`): its own stored pins against now. */
export function latestFreshness(
  latest: Pick<VersionRow, 'pins'> | undefined,
  pack: MarketPack,
): Freshness | null {
  if (latest === undefined) return null;
  const now: CurrentInputs = { engines: PROPOSAL_ENGINES, recomputeInFlight: false };
  const samePack = latest.pins.marketPack?.version === pack.version;
  // A pack revision since Generate is a moved input: the pinned pack is not fetched to compare key
  // by key, so the version reads unchecked and is generated again rather than trusted (`F8-14`).
  return freshnessOf(samePack ? { engines: latest.pins.engines } : latest.pins, now);
}

/** Why the newest version may not be shared yet (`F8-17`, `F8-18`), or `null`: a shared version is a record. */
export function shareBlockOf(facts: ProposalFacts, pack: MarketPack): string | null {
  const [latest] = facts.versions;
  if (latest === undefined || latest.version === facts.proposal.sharedVersion) return null;
  const freshness = latestFreshness(latest, pack);
  return freshness === null ? null : issueBlockedBy(freshness);
}

export function versionSummaries(facts: ProposalFacts, digits: number): ProposalVersionSummary[] {
  const { proposal } = facts;
  return facts.versions.map((row) => {
    const firstShare = facts.shares.find((share) => share.version === row.version);
    const served = row.version === proposal.sharedVersion;
    const acceptedAt = facts.accepted.get(row.version) ?? null;
    return {
      version: row.version,
      generatedAt: row.generatedAt.toISOString(),
      generatedBy: memberRefOf(row.generatedBy, row.generatorName),
      trigger: row.trigger,
      changeNote: row.changeNote,
      payable: minorUnitsToDecimal(minorUnits(row.payableMinor), digits),
      sharedAt: firstShare?.sharedAt.toISOString() ?? null,
      answer: served ? proposal.answer : acceptedAt === null ? null : 'accept',
      answeredAt: served
        ? (proposal.answeredAt?.toISOString() ?? null)
        : (acceptedAt?.toISOString() ?? null),
      onLink:
        served &&
        (proposal.status === 'shared' ||
          proposal.status === 'accepted' ||
          proposal.status === 'declined'),
      inForce: facts.project !== null && facts.project.proposalVersionId === row.id,
    };
  });
}

export function trackingOf(facts: ProposalFacts): ProposalDetail['tracking'] {
  const { proposal, evidence } = facts;
  const [latest] = facts.versions;
  const lastShare = [...facts.shares]
    .reverse()
    .find((share) => share.version === proposal.sharedVersion);
  return {
    generatedAt: latest?.generatedAt.toISOString() ?? null,
    sharedAt: proposal.sharedAt?.toISOString() ?? null,
    sharedBy:
      lastShare === undefined ? null : memberRefOf(lastShare.sharedBy, lastShare.sharerName),
    firstOpenedAt: evidence.firstOpenedAt?.toISOString() ?? null,
    lastOpenedAt: evidence.lastOpenedAt?.toISOString() ?? null,
    deviceClass: evidence.deviceClass,
    viewedSeconds: evidence.viewedSeconds,
    longestSection: evidence.longestSection,
    answer: proposal.answer,
    answeredAt: proposal.answeredAt?.toISOString() ?? null,
    answerWords: evidence.answerWords,
    answeredVia: evidence.answeredVia,
  };
}
