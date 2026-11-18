import { z } from 'zod';
import {
  amountSchema,
  currencyCodeSchema,
  memberRefSchema,
  paginated,
  paginationQuerySchema,
  phoneE164Schema,
  uuidSchema,
} from '../common';
import { designMountReadSchema, designStatusReadSchema } from '../studio/vocabulary';
import { proposalRowSchema } from './detail';
import { proposalEntryFilterSchema } from './vocabulary';

/*
 * The Proposals page (`SCR-M06-19`, `T-M05-001b`): the proposals of the leads the reader may see
 * and, between them by time, each design that has no proposal yet. A route of its own, because the
 * list's rows (`GET /proposals`) are proposals alone, and an app built before designs reads them.
 * The page is the host's: it reads the studio's vocabulary, and the studio never reads this file.
 */

/** A proposal on the page — the list's own row. */
export const proposalEntryProposalSchema = proposalRowSchema.extend({
  kind: z.literal('proposal'),
});

/** A design with no proposal yet: who it is for, Design N, where it stands, who changed it last. */
export const proposalEntryDesignSchema = z.object({
  kind: z.literal('design'),
  /** The design's id: a tap opens the design. */
  id: uuidSchema,
  leadId: uuidSchema,
  customerName: z.string().nullable(),
  /** The lead's number: what names the row while the customer has no name. */
  customerPhone: phoneE164Schema,
  city: z.string().nullable(),
  /** The N of "Design N". */
  ordinal: z.number().int().positive(),
  mount: designMountReadSchema,
  status: designStatusReadSchema,
  changedAt: z.string().datetime(),
  changedBy: memberRefSchema.nullable(),
});

export const proposalEntrySchema = z.discriminatedUnion('kind', [
  proposalEntryProposalSchema,
  proposalEntryDesignSchema,
]);
export type ProposalEntry = z.infer<typeof proposalEntrySchema>;
export type ProposalEntryDesign = z.infer<typeof proposalEntryDesignSchema>;
export type ProposalEntryProposal = z.infer<typeof proposalEntryProposalSchema>;

export const proposalEntriesQuerySchema = paginationQuerySchema.extend({
  filter: proposalEntryFilterSchema.default('all'),
});

/** What each chip holds, whatever chip is on. `all` counts the designs too; `3d` the designs. */
const proposalEntryCountsSchema = z.object({
  '3d': z.number().int().nonnegative(),
  all: z.number().int().nonnegative(),
  waiting: z.number().int().nonnegative(),
  draft: z.number().int().nonnegative(),
  accepted: z.number().int().nonnegative(),
  closed: z.number().int().nonnegative(),
});

const proposalEntriesObject = z.object({
  currencyCode: currencyCodeSchema,
  rows: paginated(proposalEntrySchema),
  counts: proposalEntryCountsSchema,
  /** What the waiting proposals are worth together — a pipeline figure, never revenue (`M13-03`). */
  waitingValue: amountSchema,
  /** *New proposal* is offered only to who can save the lead it starts with (`T-M06-032`). */
  canStart: z.boolean(),
});
/** Named, so each route that carries it references the name rather than spelling its whole type. */
export interface ProposalEntriesSchema extends ProposalEntriesSchemaObject {}
type ProposalEntriesSchemaObject = typeof proposalEntriesObject;
export const proposalEntriesSchema: ProposalEntriesSchema = proposalEntriesObject;
export type ProposalEntries = z.infer<typeof proposalEntriesSchema>;
