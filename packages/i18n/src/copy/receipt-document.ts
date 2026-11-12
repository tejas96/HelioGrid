/**
 * Every word a payment's receipt PDF prints (`M11-41`, `M11-42`), in the CUSTOMER's language
 * (`F3-06`). The figures, the numbers, the names and the reference arrive as the ledger holds them;
 * a mode prints as the market pack names it.
 */
export const RECEIPT_DOCUMENT = {
  title: /*i18n*/ { id: 'Payment receipt' },
  receivedFrom: /*i18n*/ { id: 'Received from {customer} for project {number}' },
  amountReceived: /*i18n*/ { id: 'Amount received' },
  forPart: /*i18n*/ { id: 'For' },
  partLine: /*i18n*/ { id: 'Part {position} of {count} · {part}' },
  paidBy: /*i18n*/ { id: 'Paid by' },
  reference: /*i18n*/ { id: 'Reference' },
  receivedOn: /*i18n*/ { id: 'Received on' },
  recorded: /*i18n*/ { id: 'Recorded' },
  recordedLine: /*i18n*/ { id: 'By {name}, {date} at {time}' },
  projectTotal: /*i18n*/ { id: 'Project total' },
  paidSoFar: /*i18n*/ { id: 'Paid so far' },
  left: /*i18n*/ { id: 'Left' },
  /** `M11-42`: a person's record, never a bank's confirmation — said on the paper itself. */
  notConfirmed: /*i18n*/ {
    id: 'This is a payment receipt, not a tax invoice. {company} recorded it from the customer’s payment; no bank confirmed it.',
  },
} as const;
