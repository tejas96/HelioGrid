/**
 * The sell loop's hooks (`M06`, `F5`): proposals, the company's saved parts, both sides of the
 * customer's link and where a proposal meets its project. Listed here so the adapter's index
 * names them in one line; each hook still lives in its own file beside this one.
 */

export * from './customer-page-hooks';
export * from './proposal-builder-hooks';
export type { MovedTo, ProposalActFailure } from './proposal-cache';
export * from './proposal-defaults-hooks';
export type {
  DraftChange,
  DraftConflict,
  DraftFieldState,
  ProposalDealEdit,
  UnsavedReason,
} from './proposal-draft-queue';
export * from './proposal-screen-hooks';
export type {
  CustomerLinkPage,
  CustomerLinkPageOptions,
  CustomerPageRead,
  LinkAct,
  LinkActFailure,
  LinkActKind,
} from './use-customer-link-page';
export { useCustomerLinkPage } from './use-customer-link-page';
export type { CustomerLinksRead, LinkAddress, MintAsk } from './use-customer-links';
export { useCustomerLinks } from './use-customer-links';
export type { MadeFile, MadeFileRead } from './use-made-file';
export type { ProposalRead } from './use-proposal';
export { useProposal } from './use-proposal';
export type { ProposalDraft } from './use-proposal-draft';
export { useProposalDraft } from './use-proposal-draft';
export type { ProposalEnergy } from './use-proposal-energy';
export { useProposalEnergy } from './use-proposal-energy';
export type {
  GenerateAsk,
  GeneratedVersion,
  GenerateFailure,
  ProposalGenerate,
} from './use-proposal-generate';
export { useProposalGenerate } from './use-proposal-generate';
export type { VersionInForce } from './use-proposal-hand-off';
export {
  useCrewMessage,
  usePrintableProposal,
  useVersionInForce,
  useWonBasis,
} from './use-proposal-hand-off';
export type { ProposalListHead, ProposalListRead } from './use-proposal-list';
export { useProposalList } from './use-proposal-list';
export type { ProposalShare, ShareChannel, SharedOut, ShareSheets } from './use-proposal-share';
export { useProposalShare } from './use-proposal-share';
export type { ProposalStart, StartAsk, StartedDraft } from './use-proposal-start';
export { useProposalStart } from './use-proposal-start';
export type { ProposalVersions } from './use-proposal-versions';
export { useProposalVersions } from './use-proposal-versions';
export type { SavedPartFailure, SavedParts } from './use-saved-parts';
export { useSavedParts } from './use-saved-parts';
