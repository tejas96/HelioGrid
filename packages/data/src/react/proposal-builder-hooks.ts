/** The proposal builder's view models (block 8): this file re-exports its slice's hooks. */
export type {
  BuilderFrame,
  BuilderSaveState,
  BuilderStepFact,
} from './proposal-builder-frame';
export type * from './proposal-builder-model';
export type {
  PaymentPartDraft,
  PaymentPartEditing,
  PhaseEditing,
} from './proposal-builder-sheets';
export type { NewPart, PartLabels } from './proposal-part-offers';
export type { BuilderCheck, BuilderReady } from './use-builder-check';
export type {
  BuilderIntents,
  BuilderScreenOptions,
  ProposalBuilderScreen,
} from './use-proposal-builder-screen';
export { useProposalBuilderScreen } from './use-proposal-builder-screen';
export type { ProposalParts } from './use-proposal-parts';
