import { DEVICE_CLASSES, SHARE_CHANNELS } from '@heliogrid/domain';
import { z } from 'zod';
import { amountSchema, extensibleEnum, uuidSchema } from '../common';
import { entryOf } from './activity-entry';

/*
 * A proposal's and its link's entries on the lead's timeline (`M06-45`, `F5-31`, `M02-35`). A
 * customer's act is attributed to the link and its contact, never to a user; the entry's actor is
 * then `customer`.
 */

const proposal = { proposalId: uuidSchema, number: z.string().nullable() };
const version = { ...proposal, version: z.number().int().positive() };
/** Which named link carried the act, and whose it is where a contact was named. */
const via = { linkLabel: z.string(), contactName: z.string().nullable() };

const WITHDRAW_CAUSES = ['person', 'lead_closed'] as const;
const LINK_CHANGES = ['minted', 'reminted', 'relabelled', 'revoked'] as const;

export const proposalActivityEntries = [
  /** Generate froze a version; the payable is the amount the audit names (`F2-22`). */
  entryOf('proposal_generated', { ...version, payable: amountSchema }),
  /** A person's tap — never a delivery (`M06-53`). */
  entryOf('proposal_shared', { ...version, channel: extensibleEnum(SHARE_CHANNELS) }),
  entryOf('proposal_withdrawn', { ...proposal, cause: extensibleEnum(WITHDRAW_CAUSES) }),
  entryOf('proposal_opened', {
    ...version,
    ...via,
    deviceClass: extensibleEnum(DEVICE_CLASSES),
  }),
  entryOf('proposal_accepted', { ...version, ...via }),
  entryOf('proposal_negotiation_requested', { ...version, ...via, words: z.string() }),
  entryOf('proposal_declined', { ...version, ...via, reason: z.string().nullable() }),
  /** The customer's words, never translated or altered (`F5-53`). */
  entryOf('customer_question', { ...via, text: z.string() }),
  /** The time the customer named, and when the call falls due (`F5-54`). */
  entryOf('customer_call_requested', {
    ...via,
    namedAt: z.string().datetime().nullable(),
    dueAt: z.string().datetime(),
  }),
  entryOf('customer_link_changed', {
    linkId: uuidSchema,
    label: z.string(),
    change: extensibleEnum(LINK_CHANGES),
  }),
  entryOf('proposal_version_in_force', { ...version, projectId: uuidSchema }),
] as const;
