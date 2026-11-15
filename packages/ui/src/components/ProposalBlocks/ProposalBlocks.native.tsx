/* The proposal's blocks, phone halves — one file per block beside this one. Sibling halves are
   imported with the explicit `.native` specifier: Metro resolves it, and it keeps the native
   tsconfig project from pulling a web `.tsx` in through a bare path. */
export { ProposalEmiBlock } from './EmiBlock.native';
export { ProposalGenerationBlock } from './GenerationBlock.native';
export { ProposalPartsBlock } from './PartsBlock.native';
export { ProposalPriceBlock } from './PriceBlock.native';
export { ProposalSavingsBlock } from './SavingsBlock.native';
export {
  ProposalBankBlock,
  ProposalCompanyBlock,
  ProposalTermsBlock,
  ProposalTimelineBlock,
  ProposalTrackRecordBlock,
} from './SmallBlocks.native';
export { ProposalSplitBlock } from './SplitBlock.native';
