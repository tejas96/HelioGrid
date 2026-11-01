import type {
  BillingHome,
  BillingStanding,
  TenantOwners,
  TranslatedText,
} from '@heliogrid/contracts';
import type { BillingNeed, CancellationReason, PackLabel, Read } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import { type BillingHomeView, billingHomeViewOf } from './BillingHome.logic';
import type { BillingHomeActs, BillingHomeProps, BillingHomeWords } from './BillingHome.types';
import type { BillingInput, BillingStripWords, BillingViewWords } from './BillingHome.words';

/** The page's facts: the Owner's whole home, or a member's standing and whose act it is. */
export type BillingPageFacts =
  | { readonly kind: 'owner'; readonly home: BillingHome }
  | {
      readonly kind: 'member';
      readonly standing: BillingStanding;
      readonly owners: TenantOwners | null;
    };

/** The page's record lists and its two asks; one stands open at a time. */
export type BillingSheetName = 'invoices' | 'reminders' | 'history' | 'cancel' | 'refund';

/**
 * The page's state and acts as both screens hold them — `@heliogrid/data`'s `useBillingHomeScreen`
 * gives exactly this — so the body, the lists and the asks are assembled once (Law 11).
 */
export interface BillingScreenState {
  readonly read: Read<BillingPageFacts>;
  readonly need: BillingNeed;
  readonly acting: 'need' | 'method' | 'cancel' | 'refund' | 'pdf' | null;
  readonly failure: { readonly act: string; readonly why: string } | null;
  readonly sheet: BillingSheetName | null;
  readonly reason: CancellationReason | null;
  readonly pendingPdf: string | null;
  needAct(): void;
  updateMethod(): void;
  openPlanRoute(): void;
  openPdf(id: string): void;
  openSheet(sheet: BillingSheetName): void;
  closeSheet(): void;
  chooseReason(reason: CancellationReason): void;
  cancel(reason: CancellationReason | null): void;
  refund(): void;
}

/** The page's words in the reader's language — `@heliogrid/i18n`'s `billingPageWords` gives them. */
export interface BillingPageWords {
  readonly home: BillingHomeWords;
  readonly view: BillingViewWords;
  readonly strip: BillingStripWords;
  /** A pack's own label in the reader's language — the market's name, the mandate's rail. */
  packText(label: PackLabel): TranslatedText;
  /** Whose act billing is, for a person who is not the Owner (`M12-56`). */
  scope(owners: TenantOwners | null): TranslatedText | null;
  /** Why an act did not land. */
  failure(why: string): TranslatedText;
}

/** What only the app knows: the market's format, the clock, and where `All usage` goes. */
export interface BillingPagePlace {
  readonly format: MarketFormat;
  readonly now: number;
  readonly onAllUsage: () => void;
}

/** The body's props the page decides — the screen adds its layout and its focus targets. */
export type BillingBody = Omit<BillingHomeProps, 'ref' | 'layout' | 'focusAfter'>;

export interface BillingPage {
  readonly body: BillingBody;
  /** What every builder reads; the lists and the toasts read it too. */
  readonly input: BillingInput;
  /** The Owner's home, whose asks these are; none for anyone else. */
  readonly home: BillingHome | null;
  readonly view: BillingHomeView;
  /** Why `act` did not land, said where the person acted; `null` while it has not failed. */
  readonly failureOf: (act: string) => TranslatedText | null;
}

/** Billing's page as both screens draw it: the body's view, its pending act and its failure. */
export function billingPageOf(
  screen: BillingScreenState,
  words: BillingPageWords,
  place: BillingPagePlace,
): BillingPage {
  const facts = screen.read.kind === 'ready' ? screen.read.value : null;
  const home = facts?.kind === 'owner' ? facts.home : null;
  const input: BillingInput = {
    need: screen.need,
    words: words.view,
    stripWords: words.strip,
    format: place.format,
    marketName: words.packText(place.format.pack.name),
    methodName: home?.method.label == null ? null : words.packText(home.method.label),
    now: place.now,
  };
  const view = billingHomeViewOf(
    facts?.kind === 'member'
      ? { kind: 'member', standing: facts.standing, scope: words.scope(facts.owners) }
      : facts,
    input,
  );
  const { acting, failure } = screen;
  const failureOf = (act: string) => (failure?.act === act ? words.failure(failure.why) : null);
  return {
    body: {
      words: words.home,
      read: screen.read,
      ...view,
      pending: acting === 'need' || acting === 'method' ? acting : null,
      pendingPdf: screen.pendingPdf,
      needFailure: failureOf('need'),
      acts: actsOf(screen, place.onAllUsage),
    },
    input,
    home,
    view,
    failureOf,
  };
}

function actsOf(screen: BillingScreenState, onAllUsage: () => void): BillingHomeActs {
  return {
    onNeedAct: screen.needAct,
    onRoute: screen.openPlanRoute,
    onAllUsage,
    onUpdateMethod: screen.updateMethod,
    onInvoice: screen.openPdf,
    onInvoicePdf: screen.openPdf,
    onAllInvoices: () => screen.openSheet('invoices'),
    onReminders: () => screen.openSheet('reminders'),
    onHistory: () => screen.openSheet('history'),
    onCancel: () => screen.openSheet('cancel'),
  };
}
