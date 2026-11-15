import type { VersionInForcePreview, WonBasisWire } from '@heliogrid/contracts';
import { HttpStatus } from '@nestjs/common';
import {
  aLead,
  answerOn,
  aShared,
  aWin,
  type Caller,
  customersLink,
  edited,
  generate,
  linkAct,
  markWon,
  ownLead,
  type ProposalsWorld,
  detailOf as proposalOf,
  systemOf,
} from '../customer-link/support';
import { actOn } from './support';

/* What the hand-off proofs share: a deal whose shared version the customer accepted, won or not. */

/** What the shared sample proposal asks: ₹1,90,575 with tax (`M06-35`'s worked case). */
export const ACCEPTED_PAYABLE = '190575.00';

const PAISE_PER_RUPEE = 100;
export const paise = (amount: string) => Math.round(Number(amount) * PAISE_PER_RUPEE);
export const sumOf = (amounts: readonly string[]) =>
  amounts.reduce((sum, one) => sum + paise(one), 0);

/** Who a hand-off proof needs: the EPC Owner, the lead's own seller and the project's manager. */
export interface HandoffTeam {
  readonly owner: Caller;
  readonly seller: Caller;
  readonly sellerId: string;
  readonly managerId: string;
}

export const basisOf = (caller: Caller, leadId: string) =>
  caller.call<WonBasisWire>('GET', `/leads/${leadId}/won-basis`);

export const previewOf = (caller: Caller, projectId: string, version: number) =>
  caller.call<VersionInForcePreview>('GET', `/projects/${projectId}/version-in-force/${version}`);

export const putInForce = (caller: Caller, projectId: string, version: number) =>
  actOn(caller, projectId, 'version-in-force', { version });

/** A lead the seller owns whose shared version 1 the customer accepted on their link. */
export async function anAcceptedDeal(world: ProposalsWorld, team: HandoffTeam) {
  const leadId = await aLead(team.owner);
  await ownLead(world, leadId, team.sellerId);
  const proposal = await aShared(team.owner, leadId);
  const { token } = await customersLink(team.owner, leadId);
  const accepted = await linkAct(world, token, 'accept', await answerOn(world, token));
  if (accepted.status !== HttpStatus.OK) throw new Error(`accept: got ${accepted.status}`);
  return { leadId, proposalId: proposal.id, token };
}

/** That deal won at the accepted value, managed by the project manager. */
export async function aWonAcceptedDeal(world: ProposalsWorld, team: HandoffTeam) {
  const deal = await anAcceptedDeal(world, team);
  const won = await markWon(
    team.seller,
    deal.leadId,
    aWin(team.managerId, { finalValue: ACCEPTED_PAYABLE }),
  );
  if (won.status !== HttpStatus.CREATED) {
    throw new Error(`mark won: got ${won.status} ${JSON.stringify(won.body)}`);
  }
  return { ...deal, projectId: won.body.projectId };
}

/** A newer version of the deal's proposal at a new price, generated and never shared. */
export async function aNewerVersion(owner: Caller, proposalId: string, priceInclusive: string) {
  const current = (await proposalOf(owner, proposalId)).body;
  const repriced = await edited(owner, current, {
    fields: { system: systemOf(current, { priceInclusive }) },
  });
  const made = await generate(owner, repriced, { changeNote: 'The customer asked for more.' });
  if (made.status !== HttpStatus.CREATED) {
    throw new Error(`generate: got ${made.status} ${JSON.stringify(made.body)}`);
  }
  return made.body;
}
