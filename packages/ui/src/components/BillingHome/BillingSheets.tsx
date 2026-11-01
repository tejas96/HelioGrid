import { BillingCancelAsk } from './BillingCancelAsk';
import type { BillingSheetsView } from './BillingHome.parts.types';
import { BillingInvoiceList } from './BillingInvoiceList';
import { BillingRefundAsk } from './BillingRefundAsk';
import { BillingTimeline } from './BillingTimeline';

/**
 * The page's record lists and its two asks (decisions 12–15, D9): at width the lists slide in as
 * non-modal side panels and the asks centre as dialogs; at 375 each rises as a sheet.
 */
export function BillingSheets({ invoices, reminders, history, cancel, refund }: BillingSheetsView) {
  return (
    <>
      <BillingInvoiceList {...invoices} />
      <BillingTimeline {...reminders} />
      <BillingTimeline {...history} />
      {cancel === null ? null : <BillingCancelAsk {...cancel} />}
      {refund === null ? null : <BillingRefundAsk {...refund} />}
    </>
  );
}
