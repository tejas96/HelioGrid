import type { TransportFailure } from '../format/transport-failure';
import type { LeadStateAct } from './lead-detail-view';

/**
 * Why an act on a lead came back undone, as every screen that acts on one says it (`F8-36`): the
 * lead's standing refused it (`LEAD_TRANSITION_REFUSED`); a call was asked of a number no one may
 * call — a wrong number or do-not-call (`NUMBER_NOT_DIALLABLE`, `M02-44`); or it failed — no
 * readable answer, or the api's own code.
 */
export type LeadActFailure =
  | {
      readonly kind: 'refused';
      /** `LeadActRefusal` — or one a newer server has learned. */
      readonly refusal: string;
    }
  | { readonly kind: 'not_diallable' }
  | {
      readonly kind: 'failed';
      readonly failure: TransportFailure | null;
      readonly code: string | undefined;
      readonly message: string;
    };

/** The state acts that need no sheet: wake up now and reopen (`M02-51`, `M02-56`). */
export type LeadQuickAct = Extract<LeadStateAct, 'wake' | 'reopen'>;

/** A sheet-less act out now — its own pill says so — or come back undone, and why. */
export type LeadQuickStanding =
  | { readonly kind: 'waiting'; readonly act: LeadQuickAct }
  | { readonly kind: 'returned'; readonly act: LeadQuickAct; readonly failure: LeadActFailure };
