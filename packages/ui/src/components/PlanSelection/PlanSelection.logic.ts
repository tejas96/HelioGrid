import type { BillingHome, BillingStanding, PublicPricingRead } from '@heliogrid/contracts';
import { billingNeedOf, type Read } from '@heliogrid/domain';
import { stripOf } from '../BillingHome/BillingHome.strip';
import type { BillingInput } from '../BillingHome/BillingHome.words';
import { compareOf } from './PlanSelection.compare';
import { heldOf, pickOf, readOnlyOf } from './PlanSelection.plans';
import { reviewOf } from './PlanSelection.review';
import type {
  PlanSelectionFacts,
  PlanSelectionInput,
  PlanSelectionPlace,
  PlanSelectionState,
} from './PlanSelection.state';
import type {
  PlanRegionRead,
  PlanSelectionActs,
  PlanSelectionProps,
  PlanSelectionView,
} from './PlanSelection.types';
import type { PlanSelectionWords } from './PlanSelection.words';

/** The body's props the page decides — the screen adds its layout and its focus target. */
export type PlanSelectionBody = Omit<PlanSelectionProps, 'ref' | 'layout' | 'focusAfter'>;

/** The plans page as both screens draw it: the body's view, its reads, and the review. */
export function planSelectionPageOf(
  state: PlanSelectionState,
  words: PlanSelectionWords,
  place: PlanSelectionPlace,
): PlanSelectionBody {
  const facts = state.plan.kind === 'ready' ? state.plan.value : null;
  const home = facts?.kind === 'owner' ? facts.home : null;
  const standing: BillingStanding | null =
    facts === null ? null : facts.kind === 'owner' ? facts.home.standing : facts.standing;
  const book = state.book.kind === 'ready' ? state.book.value : null;
  const input = inputOf(words, place, home, standing, book);
  const view = viewOf(state, input, { facts, home, standing, book });
  return {
    words,
    heldRead: regionRead(state.plan),
    plansRead: regionRead(state.book),
    view,
    compareOpen: state.compareOpen,
    acting: state.acting,
    acts: actsOf(state),
  };
}

/** What each region draws, once its read has answered. */
function viewOf(
  state: PlanSelectionState,
  input: PlanSelectionInput,
  read: {
    readonly facts: PlanSelectionFacts | null;
    readonly home: BillingHome | null;
    readonly standing: BillingStanding | null;
    readonly book: PublicPricingRead | null;
  },
): PlanSelectionView {
  const { words, format, now } = input;
  const { facts, home, standing, book } = read;
  const ready = book !== null && facts !== null;
  return {
    strip: standing === null ? null : stripOf(standing, words.strip, format, now),
    failure:
      state.failure?.where === 'page'
        ? { title: words.failedPayment, line: words.failedPaymentLine }
        : null,
    held: facts === null ? null : heldOf(facts, input, book !== null && state.owner),
    plans: !ready
      ? null
      : state.owner
        ? pickOf(state, input, book, home?.taxScheme ?? null)
        : readOnlyOf(input),
    scope: facts?.kind === 'member' ? words.scope(facts.owners) : null,
    compare: ready ? compareOf(state, input, book) : null,
    review: reviewOf(state, input),
  };
}

function inputOf(
  words: PlanSelectionWords,
  place: PlanSelectionPlace,
  home: BillingHome | null,
  standing: BillingStanding | null,
  book: PublicPricingRead | null,
): PlanSelectionInput {
  const marketName = words.packText(place.format.pack.name);
  const billing: BillingInput = {
    need: home === null ? 'none' : billingNeedOf(home, place.now),
    words: words.view,
    stripWords: words.strip,
    format: place.format,
    marketName,
    methodName: null,
    now: place.now,
  };
  const listedAt = book?.publishedAt ?? home?.priceListPublishedAt ?? null;
  return {
    words,
    format: place.format,
    now: place.now,
    billing,
    heldTier: standing?.tier ?? null,
    heldCycle: standing?.cycle ?? null,
    heldPeriodEnd: standing?.paidPeriodEnd ?? null,
    book,
    heldList: home?.plan.listPrice ?? null,
    priceList:
      listedAt === null ? null : words.view.priceList(marketName, place.format.date(listedAt)),
  };
}

/** A region's read, as its part draws it (frames s1, s3). */
function regionRead(read: Read<unknown>): PlanRegionRead {
  return read.kind === 'failed' ? { kind: 'failed', retry: read.retry } : { kind: read.kind };
}

function actsOf(state: PlanSelectionState): PlanSelectionActs {
  return {
    onCycle: state.chooseCycle,
    onPick: state.pick,
    onReview: state.openReview,
    onTalkToSales: () => state.talkToSales?.(),
    onCompare: state.toggleCompare,
    onAgainst: state.chooseAgainst,
    onComparePlan: state.choosePlan,
    onSet: state.chooseSet,
    /* `Try again` re-sends the same pick, from the same preview (frame s11). */
    onRetryFailure: state.confirm,
  };
}
