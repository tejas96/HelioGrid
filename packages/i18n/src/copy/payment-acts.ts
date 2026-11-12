import type { MessageRef } from '../runtime';

/**
 * The words a money act says beyond its sheet (`SCR-M11-02`, `SCR-M11-03`): the request opened in
 * the customer's chat, what the record sheet says while the amount and the UTR are typed, the ask
 * after a hand-off, a photo stored after its payment, and the receipt PDF.
 */
export const PAYMENT_ACTS = {
  sendChat: /*i18n*/ { id: 'Send on WhatsApp' },
  amountMatches: /*i18n*/ { id: 'Matches what is left — this part becomes received' },
  amountLess: /*i18n*/ { id: 'Less than what is left — the rest stays due' },
  amountMore: /*i18n*/ { id: 'More than what is left — the extra shows on this part' },
  referenceNew: /*i18n*/ { id: 'New — on no receipt yet' },
  askSent: /*i18n*/ { id: 'Did the message go out?' },
  yesSent: /*i18n*/ { id: 'Yes, sent' },
  photoNotStored: /*i18n*/ { id: 'Payment saved. The photo did not upload.' },
  photoAdded: /*i18n*/ { id: 'Photo added' },
  receiptPreparing: /*i18n*/ { id: 'The receipt PDF is being made. Try again in a moment.' },
  receiptPdf: /*i18n*/ { id: 'Receipt PDF' },
  addReceiptPhoto: /*i18n*/ { id: 'Add receipt photo' },
  photoAttaching: /*i18n*/ { id: 'Photo uploading' },
} satisfies Record<string, MessageRef>;
