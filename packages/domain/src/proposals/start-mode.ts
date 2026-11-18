/**
 * How a proposal starts on a lead (`M06-05`, `M06-19`, `T-M05-001b`): four steps, all eleven, or a
 * 3D design first — the design makes the proposal later, so this one makes a design, not a draft.
 */
export const PROPOSAL_START_MODES = ['quick', 'full', 'design'] as const;
export type ProposalStartMode = (typeof PROPOSAL_START_MODES)[number];
