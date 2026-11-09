import type {
  BillingDocumentRow,
  BillingHome,
  BillingStanding,
  TranslatedText,
} from '@heliogrid/contracts';
import { BYTES_PER_GB } from '@heliogrid/domain';
import { pageStripOf } from '../BillingStrip/BillingStrip.logic';
import type { SurfaceRead } from '../UnavailableNote/UnavailableNote.types';
import { needsOf } from './BillingHome.needs';
import { planChipOf, planOf, priceListOf } from './BillingHome.plan';
import type {
  BillingBodyActing,
  BillingChip,
  BillingHomeProps,
  BillingInvoiceRow,
  BillingInvoicesView,
  BillingMethodView,
  BillingNeedsView,
  BillingUsageView,
} from './BillingHome.types';
import { dateRow, fact } from './BillingHome.values';
import type { BillingInput, BillingPageStripWords } from './BillingHome.words';

export type { BillingInput } from './BillingHome.words';

/** What the page draws, before the shell's own parts — the screens hand this to `BillingHome`. */
export type BillingHomeView = Pick<
  BillingHomeProps,
  'strip' | 'needs' | 'plan' | 'usage' | 'method' | 'invoices' | 'records' | 'cancellable'
>;

/** The page's facts: the Owner's home, or a member's standing with whose act it is. */
export type BillingViewFacts =
  | { readonly kind: 'owner'; readonly home: BillingHome }
  | {
      readonly kind: 'member';
      readonly standing: BillingStanding;
      /** *Only Mahesh Bhosale (owner) can pay or manage billing.* — the scope note's sentence. */
      readonly scope: TranslatedText | null;
    };

/** Nothing to draw while the page's one read is out, refused or empty: the body draws that state. */
const NOTHING_READ: BillingHomeView = {
  strip: null,
  needs: null,
  plan: null,
  usage: null,
  method: null,
  invoices: null,
  records: false,
  cancellable: false,
};

/**
 * The billing home's view (`SCR-M12-02`): every figure the server worked out, formatted in the
 * market's grouping; which need is in force is domain's `billingNeedOf`, handed in.
 */
export function billingHomeViewOf(
  facts: BillingViewFacts | null,
  input: BillingInput,
): BillingHomeView {
  if (facts === null) return NOTHING_READ;
  if (facts.kind === 'member') return memberViewOf(input, facts.standing, facts.scope);
  const { home } = facts;
  return {
    strip: pageStripOf(home.standing, {
      words: input.stripWords,
      format: input.format,
      now: input.now,
    }),
    needs: needsOf(input, home),
    plan: planOf(input, home),
    usage: usageOf(input, home),
    method: methodOf(input, home),
    invoices: invoicesOf(input, home),
    records: true,
    cancellable: home.cancellable,
  };
}

/** `M12-56`: the state, its dates and whose act it is — no amount and no act (frame 18). */
function memberViewOf(
  input: BillingInput,
  standing: BillingStanding,
  scope: TranslatedText | null,
): BillingHomeView {
  const { words, format } = input;
  const owed = standing.state === 'past_due';
  const dead = standing.state === 'halted' || standing.state === 'expired';
  const grace = standing.graceEndsAt;
  const needs: BillingNeedsView | null =
    owed || dead
      ? {
          title: words.needsOwner,
          badge: null,
          rows: [
            {
              key: 'state',
              title: owed ? words.paymentFailed : words.account,
              chip: { word: words.stateWord(standing.state), tone: 'danger' },
              figure: null,
              line: null,
            },
            ...(owed && grace !== null
              ? [dateRow('until', words.graceEnds, format.date(grace))]
              : []),
          ],
          dataKept: null,
          working: null,
          act: null,
          scope: scope === null ? null : { title: scope },
        }
      : null;
  const next = standing.state === 'trialing' ? null : standing.paidPeriodEnd;
  return {
    strip: pageStripOf(standing, { words: input.stripWords, format, now: input.now }),
    needs,
    plan: {
      chip: planChipOf(words, standing, input.now),
      countdown: null,
      rows: [
        fact('plan', words.plan, standing.tier === null ? words.trial : words.tier(standing.tier)),
        ...(next === null ? [] : [fact('next', words.nextBill, format.date(next))]),
      ],
      working: null,
      source: null,
      route: null,
      includes: null,
      scope: needs === null && scope !== null ? { title: scope } : null,
    },
    usage: null,
    method: null,
    invoices: null,
    records: false,
    cancellable: false,
  };
}

/** `SCR-M12-04`'s meter rows, nearest their limits first (the server's order). */
function usageOf(input: BillingInput, home: BillingHome): BillingUsageView {
  const { words } = input;
  const enterprise = home.standing.tier === 'enterprise';
  return {
    meters: home.usage.map((meter) =>
      meter.meter === 'storage'
        ? {
            key: 'storage',
            glyph: 'layers',
            label: words.limits.storage,
            value: Math.round(meter.used / BYTES_PER_GB),
            limit: meter.included === null ? null : Math.round(meter.included / BYTES_PER_GB),
            unit: words.gb,
          }
        : {
            key: 'voice',
            glyph: 'headset',
            label: words.limits.voiceMinutes,
            value: meter.used,
            limit: meter.included,
            unit: words.minutes,
          },
    ),
    sources: [
      words.actualUsage,
      words.limitsFrom(enterprise ? words.yourContract : priceListOf(input, home)),
    ],
  };
}

/** The method as the gateway names it, never an instrument detail (`M12-10`; decision 6a). */
function methodOf(input: BillingInput, home: BillingHome): BillingMethodView {
  const { words } = input;
  const { method } = home;
  if (method.standing === 'none') {
    return { chip: null, value: null, gap: words.methodLater, canUpdate: false };
  }
  const named = method.label === null ? null : input.methodName;
  const { cycle } = home.standing;
  // A payment link names its cycle, since each period is its own link (frame 24).
  const generic =
    home.standing.collection === 'invoice' && cycle !== null
      ? words.linkCycle(cycle)
      : words.autoPay;
  return {
    chip:
      method.standing === 'live'
        ? { word: words.stateWord('active'), tone: 'success' }
        : { word: words.ended, tone: 'neutral' },
    value: named ?? generic,
    gap: null,
    canUpdate: method.standing === 'live' && method.manageUrl !== null,
  };
}

/** The three latest, then every one (decision 4); the list's source line, with its tax once registered. */
function invoicesOf(input: BillingInput, home: BillingHome): BillingInvoicesView {
  const { words } = input;
  const { latest, totalCount } = home.invoices;
  if (totalCount === 0) {
    const trial = home.standing.state === 'trialing';
    return {
      rows: [],
      all: null,
      empty: {
        title: words.noInvoicesYet,
        message: trial ? words.firstOnConvert : words.firstOnChoose,
      },
      source: null,
    };
  }
  return {
    rows: latest.map((row) => invoiceRowOf(row, input)),
    all: totalCount > latest.length ? words.allCountInvoices(totalCount) : words.allInvoices,
    empty: null,
    source: invoiceSourceOf(input, home),
  };
}

/** One invoice or credit note as a row: the home's latest three and the full list draw the same. */
export function invoiceRowOf(row: BillingDocumentRow, input: BillingInput): BillingInvoiceRow {
  const { words, format, stripWords } = input;
  return {
    id: row.id,
    date: format.date(row.issuedAt),
    forWhat: words.forPlan(row.tier, row.cycle),
    chip: documentChipOf(stripWords, row.document, row.status),
    amount: format.money(row.total, { fractionDigits: 2 }),
    pdfLabel: row.hasPdf ? words.invoicePdf(row.number) : null,
  };
}

function invoiceSourceOf(input: BillingInput, home: BillingHome): TranslatedText {
  const { words } = input;
  if (home.standing.tier === 'enterprise') return words.yourContract;
  const listed = priceListOf(input, home);
  const rate = home.plan.nextBill?.sale.taxRateBasisPoints ?? null;
  if (home.taxScheme === null || rate === null) return listed;
  const BASIS_POINTS_PER_PERCENT = 100;
  return words.withTax(
    listed,
    input.format.number(rate / BASIS_POINTS_PER_PERCENT),
    home.taxScheme,
  );
}

/** An invoice's state, or a credit note's own word; a state this release does not know is neutral. */
export function documentChipOf(
  words: BillingPageStripWords,
  document: 'invoice' | 'credit_note',
  status: string | null,
): BillingChip {
  if (document === 'credit_note') return { word: words.creditNote, tone: 'info' };
  switch (status) {
    case 'paid':
      return { word: words.paid, tone: 'success' };
    case 'failed':
      return { word: words.failed, tone: 'danger' };
    case 'refunded':
      return { word: words.refunded, tone: 'neutral' };
    case 'issued':
      return { word: words.issued, tone: 'info' };
    default:
      return { word: words.issued, tone: 'neutral' };
  }
}

/** What the body's acts wait on: the act whose answer is out, else a PDF being signed. */
export function bodyActingOf(
  props: Pick<BillingHomeProps, 'pending' | 'pendingPdf'>,
): BillingBodyActing {
  return props.pending ?? (props.pendingPdf === null ? null : 'pdf');
}

/** The page's failed read with its retry handing focus on, since `Try again` leaves with it. */
export function retryLandingOn(
  read: Extract<SurfaceRead, { kind: 'failed' }>,
  land: () => void,
): SurfaceRead {
  return {
    kind: 'failed',
    retry: () => {
      read.retry();
      land();
    },
  };
}
