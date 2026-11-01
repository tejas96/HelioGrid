import { BillingCancelAsk } from './BillingCancelAsk.native';
import type { BillingSheetsView } from './BillingHome.parts.types';
import { BillingInvoiceList } from './BillingInvoiceList.native';
import { BillingRefundAsk } from './BillingRefundAsk.native';
import { BillingTimeline } from './BillingTimeline.native';

/** The page's record lists and its two asks (decisions 12–15, D9), each rising as a sheet. */
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
