import {
  type DisqualifyLead,
  LEAD_TRANSITION_REFUSED,
  type LeadAct,
  type LeadDetail,
  type MarkLost,
  type SnoozeLead,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { ApiError, bodyOrRefusalAt } from '../errors/errors';

/**
 * A move the lead's standing does not allow (`F4-16`): an `ApiError` with code
 * `LEAD_TRANSITION_REFUSED` that keeps domain's reason, so the screen says why in place.
 */
export class LeadActRefusedError extends ApiError {
  constructor(
    /** Domain's `LeadActRefusal` — or one a newer server has learned. */
    readonly refusal: string,
    message: string,
  ) {
    super(422, message, { code: LEAD_TRANSITION_REFUSED });
    this.name = 'LeadActRefusedError';
  }
}

/**
 * The R9 acts and Mark qualified (`M02-45`, `M02-49`…`M02-56`), each answering the lead as it now
 * stands. A move the lead's standing does not allow leaves as a `LeadActRefusedError`.
 */
export interface LeadLifecycleRepository {
  markQualified(leadId: string, body: LeadAct): Promise<LeadDetail>;
  /** The wake date is mandatory; the lead wakes at 09:00 tenant time that day (`M02-51`). */
  snooze(leadId: string, body: SnoozeLead): Promise<LeadDetail>;
  wake(leadId: string, body: LeadAct): Promise<LeadDetail>;
  /** One of the six reasons, mandatory (`M02-42`). */
  disqualify(leadId: string, body: DisqualifyLead): Promise<LeadDetail>;
  /** One of the seven reasons; *postponed* carries its day (`M07-63`). The lead's open tasks end. */
  lost(leadId: string, body: MarkLost): Promise<LeadDetail>;
  junk(leadId: string, body: LeadAct): Promise<LeadDetail>;
  reopen(leadId: string, body: LeadAct): Promise<LeadDetail>;
}

/** Every act answers alike: the lead at 200, or the refusal with its reason at 422. */
type LifecycleAnswer = Awaited<ReturnType<ApiClient['leadLifecycle']['wake']>>;

async function standingAfter(send: () => Promise<LifecycleAnswer>): Promise<LeadDetail> {
  const answer = await bodyOrRefusalAt(send, 200, 422);
  if (answer.answered) return answer.body;
  const { error } = answer.refusal;
  throw new LeadActRefusedError(error.facts.refusal, error.message);
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createLeadLifecycleRepository(api: ApiClient): LeadLifecycleRepository {
  const lifecycle = api.leadLifecycle;
  return {
    markQualified: (leadId, body) =>
      standingAfter(() => lifecycle.markQualified({ params: { id: leadId }, body })),
    snooze: (leadId, body) =>
      standingAfter(() => lifecycle.snooze({ params: { id: leadId }, body })),
    wake: (leadId, body) => standingAfter(() => lifecycle.wake({ params: { id: leadId }, body })),
    disqualify: (leadId, body) =>
      standingAfter(() => lifecycle.disqualify({ params: { id: leadId }, body })),
    lost: (leadId, body) => standingAfter(() => lifecycle.lost({ params: { id: leadId }, body })),
    junk: (leadId, body) => standingAfter(() => lifecycle.junk({ params: { id: leadId }, body })),
    reopen: (leadId, body) =>
      standingAfter(() => lifecycle.reopen({ params: { id: leadId }, body })),
  };
}
