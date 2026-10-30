import type { TranslatedText } from '@heliogrid/contracts';
import {
  type BillingCapability,
  type BillingNotice,
  type BillingPhase,
  disclosesForfeiture,
  pauseNoticeOf,
} from '@heliogrid/domain';
/**
 * The words of a billing notice (`M12-39`, `M12-41`, `M12-42`) as an EPC Owner reads it in the app
 * and on the push. The api renders them in the owner's language when the notice is told and stores
 * them as written (`F6-08`).
 *
 * Honest by construction: every notice names the state, what will actually happen and the one way
 * out, and none names a loss of data, because nothing is ever deleted (`BM-32`). What is paused and
 * what still works are read off the soft-block matrix (`pauseNoticeOf`), never typed here.
 */
import type { MessageRef, Translator } from '../runtime';
import { assembled } from './assembled';
import { joinAnd } from './list-join';

/** Each capability as a sentence names it, lowercase, inside a list. */
const CAPABILITY_NAMES = {
  read_and_search: /*i18n*/ { id: 'reading and search' },
  export: /*i18n*/ { id: 'exports' },
  customer_links: /*i18n*/ { id: 'customer links' },
  billing_screens: /*i18n*/ { id: 'billing' },
  create_edit_records: /*i18n*/ { id: 'creating and editing records' },
  studio_design_edit: /*i18n*/ { id: 'editing designs' },
  sell_and_deliver: /*i18n*/ { id: 'selling and delivery' },
  new_file_upload: /*i18n*/ { id: 'new file uploads' },
  pending_field_photo_upload: /*i18n*/ { id: 'uploading field photos already taken' },
  voice_agent: /*i18n*/ { id: 'the voice agent' },
  ai_roof_detections: /*i18n*/ { id: 'AI roof detection' },
  team_invites: /*i18n*/ { id: 'team invites' },
} satisfies Record<BillingCapability, MessageRef>;

/** One capability as a sentence names it (`M12-31`). */
export function billingCapabilityName(
  translate: Translator['t'],
  capability: BillingCapability,
): TranslatedText {
  return translate(CAPABILITY_NAMES[capability]);
}

interface NoticeCopy {
  readonly title: MessageRef;
  /** The state and what follows from it; `{paused}` and `{working}` are the matrix's lists. */
  readonly facts: MessageRef;
  /** The one way out. */
  readonly way: MessageRef;
}

const PAY_OR_UPDATE = /*i18n*/ { id: 'Pay or update your payment method in Billing.' };
const PICK_A_PLAN = /*i18n*/ { id: 'Pick a plan in Billing to keep creating.' };

const NOTICES = {
  payment_failed: {
    title: /*i18n*/ { id: 'Payment failed' },
    facts: /*i18n*/ { id: 'We could not collect your plan payment. We will try again.' },
    way: PAY_OR_UPDATE,
  },
  payment_reminder: {
    title: /*i18n*/ { id: 'Payment still due' },
    facts: /*i18n*/ { id: 'Your plan payment is still due. Everything works for now.' },
    way: PAY_OR_UPDATE,
  },
  metered_paused: {
    title: /*i18n*/ { id: 'Some features are paused' },
    facts: /*i18n*/ {
      id: 'Your plan is unpaid. Paused until you pay: {paused}. Still working: {working}.',
    },
    way: /*i18n*/ { id: 'Pay in Billing to turn them back on.' },
  },
  final_warning: {
    title: /*i18n*/ { id: 'Your plan halts within a day' },
    facts: /*i18n*/ {
      id: 'If the payment stays unpaid, your plan halts within a day. Your data stays safe and readable.',
    },
    way: /*i18n*/ { id: 'Pay now in Billing.' },
  },
  halted: {
    title: /*i18n*/ { id: 'Your plan is halted' },
    facts: /*i18n*/ { id: 'Your plan is halted because it is unpaid. Still working: {working}.' },
    way: /*i18n*/ { id: 'Reactivate with one payment in Billing.' },
  },
  win_back: {
    title: /*i18n*/ { id: 'Your data is safe' },
    facts: /*i18n*/ { id: 'Your data is safe and readable.' },
    way: /*i18n*/ { id: 'Reactivate any time with one payment, at today’s prices, in Billing.' },
  },
  trial_half_way: {
    title: /*i18n*/ { id: '7 days left in your trial' },
    facts: /*i18n*/ { id: 'Your free trial has 7 days left.' },
    way: /*i18n*/ { id: 'Pick a plan in Billing to keep going.' },
  },
  trial_ending: {
    title: /*i18n*/ { id: 'Your trial ends in 2 days' },
    facts: /*i18n*/ { id: 'Your free trial ends in 2 days.' },
    way: PICK_A_PLAN,
  },
  trial_ended: {
    title: /*i18n*/ { id: 'Your trial has ended' },
    facts: /*i18n*/ { id: 'Your free trial has ended. Still working: {working}.' },
    way: PICK_A_PLAN,
  },
} satisfies Record<BillingNotice, NoticeCopy>;

/** `M12-41` — a company inside its price-protection horizon, before the lapse and at it. */
const FORFEITS = /*i18n*/ {
  id: 'If the plan halts, your launch price ends and a restart bills at today’s prices.',
};
const FORFEITED = /*i18n*/ {
  id: 'Your launch price has ended; reactivating bills at today’s prices.',
};

/** The billing phase whose matrix column a notice's lists are read from; `null` for one with none. */
const LISTED_PHASE: Record<BillingNotice, BillingPhase | null> = {
  payment_failed: null,
  payment_reminder: null,
  metered_paused: 'past_due_metered_paused',
  final_warning: null,
  halted: 'halted',
  win_back: null,
  trial_half_way: null,
  trial_ending: null,
  trial_ended: 'expired',
};

function listed(
  translate: Translator['t'],
  notice: BillingNotice,
): { paused: TranslatedText; working: TranslatedText } | undefined {
  const phase = LISTED_PHASE[notice];
  if (phase === null) return undefined;
  const { paused, stillWorks } = pauseNoticeOf(phase);
  const names = (capabilities: readonly BillingCapability[]) =>
    joinAnd(
      translate,
      capabilities.map((capability) => billingCapabilityName(translate, capability)),
    );
  return { paused: names(paused), working: names(stillWorks) };
}

/**
 * One notice's words. `whileProtected` adds what a halt costs a company inside its protection
 * horizon — that it will end the launch price, or at the halt that it has (`M12-39`, `M12-41`).
 */
export function billingNoticeWords(
  translate: Translator['t'],
  notice: BillingNotice,
  whileProtected: boolean,
): { title: TranslatedText; body: TranslatedText } {
  const copy: NoticeCopy = NOTICES[notice];
  const forfeiture =
    whileProtected && disclosesForfeiture(notice)
      ? [translate(notice === 'halted' ? FORFEITED : FORFEITS)]
      : [];
  return {
    title: translate(copy.title),
    body: assembled(
      [translate(copy.facts, listed(translate, notice)), ...forfeiture, translate(copy.way)].join(
        ' ',
      ),
    ),
  };
}
