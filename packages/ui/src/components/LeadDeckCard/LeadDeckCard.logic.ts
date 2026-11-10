import {
  type InboxActState,
  type InboxLead,
  UNASSIGNED_ESCALATES_AFTER_MS,
} from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { leadAgeStandingOf } from '../LeadAge/LeadAge.logic';
import type { PendingActionSpec } from '../PendingAction/PendingAction.types';
import type { InboxActLineWords, WaitingLead } from './LeadDeckCard.types';

/** At most two leads peek out under the deck: a third would read as a pile, not a queue. */
const PEEKS_DRAWN = 2;

/** How many cards peek out under the deck for `behind` leads waiting under it. */
export function peeksOf(behind: number): number {
  return Math.max(0, Math.min(PEEKS_DRAWN, behind));
}

/**
 * The age ring's fill: how far the lead is through the 24 hours before its owner is told
 * (`M02-50`) — full once past them.
 */
export function ageShareOf(elapsedMs: number): number {
  return Math.min(1, Math.max(0, elapsedMs / UNASSIGNED_ESCALATES_AFTER_MS));
}

/** Past the escalation: the ring's caption turns to the warning mark. */
export function isPastDay(elapsedMs: number): boolean {
  return leadAgeStandingOf(elapsedMs) === 'past';
}

/**
 * A queued lead as the deck, a tile and a row draw it: the bill put in the tenant's currency by
 * the caller's formatter (`useFormat().money`), its tier kept beside it.
 */
export function waitingLeadOf(
  card: { readonly lead: InboxLead; readonly elapsedMs: number },
  money: (amount: string) => string,
): WaitingLead {
  const { lead } = card;
  return {
    id: lead.id,
    name: lead.name,
    city: lead.city,
    source: lead.source,
    elapsedMs: card.elapsedMs,
    bill:
      lead.monthlyBill === null
        ? null
        : { money: money(lead.monthlyBill.amount), tier: lead.monthlyBill.tier },
  };
}

/**
 * The stage's keys as their caps read (`SCR-M02-02` desktop): the digits give to the first nine
 * faces, J bins, the down arrow moves to the next lead. Key caps, not words — the same on every
 * keyboard layout the app is used with.
 */
export const DECK_KEY_CAPS = { give: '1–9', junk: 'J' } as const;

/**
 * The line an inbox act draws in its lead's card, row or tile (`M02-67`): what is being done while
 * the server has it; once back undone, why — with *Try again* where sending it again may land (no
 * answer came, or the server refused it), and a way to clear it always.
 */
export function actLineOf(
  act: InboxActState | null,
  words: InboxActLineWords,
  acts: { readonly onRetry: () => void; readonly onDismiss: () => void },
  focusAfter: FocusAfter,
): PendingActionSpec | undefined {
  if (act === null) return undefined;
  const why = act.returned;
  if (why === null) return { label: words.out(act) };
  const again = why.kind === 'unanswered' || why.kind === 'refused';
  return {
    state: 'returned',
    reason: words.returned(act, why),
    onDismiss: acts.onDismiss,
    dismissLabel: words.dismiss,
    focusAfter,
    ...(again ? { onRetry: acts.onRetry, retryLabel: words.retry } : {}),
  };
}
