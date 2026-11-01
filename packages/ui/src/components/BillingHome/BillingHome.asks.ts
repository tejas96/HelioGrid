import type { BillingHome } from '@heliogrid/contracts';
import type { MarketFormat } from '../../utils/format';
import type { BillingValue } from './BillingHome.types';
import { figure } from './BillingHome.values';

/** What the two asks show before their acts: the cancel's last paid day, the refund's amount. */
export interface BillingAsksView {
  /** `Runs until` in the cancel ask: the paid period's end, in the market's style. */
  readonly runsUntil: string;
  /** `Refund` in its ask: the first payment, to the minor unit; `null` outside the window. */
  readonly refund: BillingValue | null;
}

/** Both asks read off the Owner's home, so the web and the phone say the same day and amount. */
export function billingAsksOf(home: BillingHome, format: MarketFormat): BillingAsksView {
  const end = home.standing.paidPeriodEnd ?? home.standing.stateEnteredAt;
  return {
    runsUntil: format.date(end),
    refund:
      home.refund === null ? null : figure(format.money(home.refund.amount, { fractionDigits: 2 })),
  };
}
