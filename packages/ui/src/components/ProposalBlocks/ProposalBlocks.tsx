/* The proposal's blocks, web halves — one file per block beside this one, so each stays readable
   and under the line limit. The contract is `ProposalBlocks.types.ts`. */
export { ProposalEmiBlock } from './EmiBlock';
export { ProposalGenerationBlock } from './GenerationBlock';
export { ProposalPartsBlock } from './PartsBlock';
export { ProposalPriceBlock } from './PriceBlock';
export { ProposalSavingsBlock } from './SavingsBlock';
export {
  ProposalBankBlock,
  ProposalCompanyBlock,
  ProposalTermsBlock,
  ProposalTimelineBlock,
  ProposalTrackRecordBlock,
} from './SmallBlocks';
export { ProposalSplitBlock } from './SplitBlock';
