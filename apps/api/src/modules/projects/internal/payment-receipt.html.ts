import {
  type FormatPack,
  formatClockAt,
  formatDate,
  formatMinorUnits,
  minorUnits,
} from '@heliogrid/domain';
import {
  projectMoneyOf,
  projectNumberOf,
  receiptNumberOf,
  trancheStandingOf,
} from '@heliogrid/domain/server';
import { RECEIPT_DOCUMENT, type Translator } from '@heliogrid/i18n';
import type { ReceiptFacts } from '../projects.payment-receipt.repository';

/** Who the receipt is from: the company as its profile and its registration say. */
export interface ReceiptIssuer {
  readonly name: string;
  readonly address: string;
  /** `GSTIN 27ABCDE1234F1Z5` — the scheme's own word and the number; null where none is held. */
  readonly registration: string | null;
}

/**
 * A payment's receipt (`M11-41`, `M11-42`, design A's receipt board): one whole HTML document the
 * renderer prints as it is, in the customer's language. The figures are the ledger's as it stood
 * when the payment was recorded. Plain black on white, as every document this app prints: it
 * imports no `theme`, and the worker carries the Noto faces that shape Devanagari.
 *
 * Every value is escaped: a company's name, a customer's name and a reference are typed text.
 */
export function paymentReceiptHtml(
  facts: ReceiptFacts,
  issuer: ReceiptIssuer,
  mode: string,
  pack: { readonly formats: FormatPack },
  { t, locale }: Translator,
): string {
  const formats: FormatPack = { ...pack.formats, timeZone: facts.timeZone };
  const money = (amount: number) => formatMinorUnits(formats, minorUnits(amount));
  const totals = totalsOf(facts);
  const number = receiptNumberOf(facts.receiptNumber);
  const day = facts.receivedOn ?? facts.recordedAt;
  const rows: [string, string, boolean][] = [
    [
      t(RECEIPT_DOCUMENT.forPart),
      t(RECEIPT_DOCUMENT.partLine, {
        position: facts.part.position,
        count: facts.part.count,
        part: facts.part.label,
      }),
      false,
    ],
    [t(RECEIPT_DOCUMENT.paidBy), mode, false],
    ...(facts.reference === null
      ? []
      : [[t(RECEIPT_DOCUMENT.reference), facts.reference, true] as [string, string, boolean]]),
    [t(RECEIPT_DOCUMENT.receivedOn), formatDate(formats, day, locale), false],
    [
      t(RECEIPT_DOCUMENT.recorded),
      t(RECEIPT_DOCUMENT.recordedLine, {
        name: facts.recorderName,
        date: formatDate(formats, facts.recordedAt, locale),
        time: formatClockAt(formats, facts.recordedAt.getTime()),
      }),
      false,
    ],
  ];
  return `<!doctype html>
<html lang="${text(locale)}">
<head>
<meta charset="utf-8">
<title>${text(number)}</title>
<style>
  @page { size: A5; margin: 14mm 12mm; }
  body { font-family: 'Noto Sans', 'Noto Sans Devanagari', sans-serif; font-size: 10pt; line-height: 1.45; color: #000; margin: 0; }
  .mono { font-family: 'Noto Sans Mono', monospace; }
  .serif { font-family: 'Noto Serif', 'Noto Serif Devanagari', 'Noto Sans Devanagari', serif; }
  .top { display: flex; justify-content: space-between; gap: 6mm; border-top: 0.8mm solid #000; padding-top: 4mm; }
  .company { font-weight: 700; font-size: 13pt; }
  .quiet { font-size: 8.5pt; }
  .end { text-align: end; }
  h1 { font-weight: 400; font-size: 20pt; margin: 8mm 0 1mm; }
  .hero { margin-top: 5mm; padding: 4mm 5mm; border: 0.3mm solid #000; border-radius: 3mm; }
  .label { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .figure { font-size: 26pt; line-height: 1.2; }
  table { width: 100%; border-collapse: collapse; margin-top: 4mm; }
  th, td { padding: 1.6mm 0; border-top: 0.2mm solid #000; vertical-align: top; }
  th { text-align: start; font-weight: 400; padding-inline-end: 4mm; }
  td { text-align: end; }
  .totals { display: flex; gap: 2mm; margin-top: 4mm; }
  .totals > div { flex: 1; padding: 2mm 3mm; border: 0.2mm solid #000; border-radius: 2mm; }
  .note { margin-top: 8mm; padding-top: 2mm; border-top: 0.2mm solid #000; font-size: 8pt; }
</style>
</head>
<body>
  <div class="top">
    <div>
      <div class="company">${text(issuer.name)}</div>
      ${issuer.address === '' ? '' : `<div class="quiet">${text(issuer.address)}</div>`}
      ${issuer.registration === null ? '' : `<div class="quiet mono">${text(issuer.registration)}</div>`}
    </div>
    <div class="end">
      <div class="mono">${text(number)}</div>
      <div class="quiet">${text(formatDate(formats, facts.recordedAt, locale))}</div>
    </div>
  </div>
  <h1 class="serif">${text(t(RECEIPT_DOCUMENT.title))}</h1>
  <p>${text(
    t(RECEIPT_DOCUMENT.receivedFrom, {
      customer: facts.customerName ?? facts.phoneE164,
      number: projectNumberOf(facts.projectNumber),
    }),
  )}</p>
  <div class="hero">
    <div class="label">${text(t(RECEIPT_DOCUMENT.amountReceived))}</div>
    <div class="figure serif">${text(money(facts.amountMinor))}</div>
  </div>
  <table>
    ${rows.map(([name, value, isMono]) => `<tr><th>${text(name)}</th><td${isMono ? ' class="mono"' : ''}>${text(value)}</td></tr>`).join('')}
  </table>
  <div class="totals">
    <div><div class="quiet">${text(t(RECEIPT_DOCUMENT.projectTotal))}</div><div class="mono">${text(money(totals.total))}</div></div>
    <div><div class="quiet">${text(t(RECEIPT_DOCUMENT.paidSoFar))}</div><div class="mono">${text(money(totals.collected))}</div></div>
    <div><div class="quiet">${text(t(RECEIPT_DOCUMENT.left))}</div><div class="mono">${text(money(totals.left))}</div></div>
  </div>
  <p class="note">${text(t(RECEIPT_DOCUMENT.notConfirmed, { company: issuer.name }))}</p>
</body>
</html>`;
}

/**
 * The project's total, what had come in and what was left when the payment was recorded — read
 * through the one standing rule the app shows (`trancheStandingOf`, `projectMoneyOf`), so the
 * paper and the screen never disagree.
 */
function totalsOf(facts: ReceiptFacts) {
  const parts = facts.parts.map((part) => {
    const amount = minorUnits(part.amountMinor);
    const received = minorUnits(part.receivedMinor);
    // Due or not, what a part still owes is the same; only the split into due and next needs it.
    const standing = trancheStandingOf({ amount, received, due: true, waived: part.waived });
    return { amount, received, due: true, standing };
  });
  const money = projectMoneyOf(parts);
  return { total: money.total, collected: money.collected, left: money.toCollect };
}

function text(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
