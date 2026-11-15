/**
 * The lines of a proposal's payable equation (`M06-35`), by key, in the order a card prints them.
 * The incentive is a line only where the market pack says the company receives it. Apart from the
 * computation, so a screen can read the keys without bundling the code that works the figures out.
 */
export const PROPOSAL_MONEY_LINES = ['system', 'battery', 'discount', 'tax', 'incentive'] as const;
export type ProposalMoneyLineKey = (typeof PROPOSAL_MONEY_LINES)[number];
