import type { LeadActContext, LeadActResult, LeadLifecycle } from '../../src/crm/lifecycle-model';

/** An active lead at `new`, owned, with nothing scheduled and nothing closed. */
export const ACTIVE_LEAD: LeadLifecycle = {
  stage: 'new',
  state: null,
  ownerId: 'rajesh',
  wakeOn: null,
  resurfaceOn: null,
  noCallUntil: null,
  close: null,
  reopenCount: 0,
};

export function leadAt(overrides: Partial<LeadLifecycle>): LeadLifecycle {
  return { ...ACTIVE_LEAD, ...overrides };
}

/** A person's act at 09:30 IST on 9 November 2026. */
export const CONTEXT: LeadActContext = {
  at: Date.parse('2026-11-09T04:00:00Z'),
  by: 'priya',
  today: '2026-11-09',
};

/** The close that act records: who and when. */
export const CLOSED_BY_PRIYA = { at: CONTEXT.at, by: CONTEXT.by };

/** The lead after an act that must have moved — a refusal fails the test with its reason. */
export function nextOf(result: LeadActResult): LeadLifecycle {
  if (result.kind === 'refused') throw new Error(`the act was refused: ${result.refusal}`);
  return result.next;
}

/** The refusal of an act that must have been refused, or `null` when it moved. */
export function refusalOf(result: LeadActResult): string | null {
  return result.kind === 'refused' ? result.refusal : null;
}
