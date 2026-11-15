/**
 * The proposals module's export surface (apps/api/CLAUDE.md §Local conventions): the module, and
 * what the customer's link, Mark won and the owner home read and write of a proposal — each
 * function on the CALLER's transaction, naming its tenant, so a customer's answer, the task it
 * raises and the proposal's status commit together.
 */
export { printGrantHolds } from './internal/print-grant';
export { companyOwner } from './proposals.facts.repository';
export {
  type AnsweredLead,
  leadWasShared,
  proposalStatusesOf,
  recordAnswer,
  type ServedVersion,
  servedFigures,
  servedVersionOf,
  stampOpened,
  versionById,
} from './proposals.link.repository';
export { type ProposalLinks, ProposalLinksRegistry } from './proposals.links.repository';
export { ProposalsModule } from './proposals.module';
export {
  type AcceptedVersion,
  dealWon,
  type OpenProposalStageValue,
  openProposalStageValues,
  openProposalValues,
  type UnopenedProposal,
  unopenedProposals,
  type WonBasisOfLead,
  wonBasisOfLead,
} from './proposals.pipeline.repository';
export { ProposalsPrintService } from './proposals.print.service';
export { ProposalsVersionsService } from './proposals.versions.service';
