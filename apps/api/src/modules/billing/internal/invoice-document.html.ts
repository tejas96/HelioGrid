import {
  basisPointsToPercent,
  type FormatPack,
  formatDate,
  formatMinorUnits,
  formatNumber,
  type MarketPack,
  packLabel,
} from '@heliogrid/domain';
import { invoiceTotals } from '@heliogrid/domain/server';
import {
  INVOICE_CYCLE,
  INVOICE_DOCUMENT,
  INVOICE_METER,
  TIER_LABEL,
  type Translator,
} from '@heliogrid/i18n';
import type { DocumentLine, InvoiceForDocument } from '../invoice-document.admin.repository';

/**
 * The invoice's page (`M12-44`, `M12-45`): one whole HTML document the renderer prints as it is.
 * It prints what the invoice stored at issue — never a figure worked out again — and the parties.
 * Plain black on white: no board draws a document yet, and this app imports no `theme`.
 *
 * Every value is escaped: a company's name or address is text its owner typed.
 */
export function invoiceDocumentHtml(
  invoice: InvoiceForDocument,
  pack: MarketPack,
  { t, locale }: Translator,
): string {
  const supplier = pack.tax.platformSupplier;
  if (supplier === null) {
    throw new Error(
      `the ${pack.market} pack names no supplier, so invoice ${invoice.number} cannot print`,
    );
  }
  // Dates on the company's own clock (`F1-10`); money in the currency's grouping in every language.
  const formats: FormatPack = { ...pack.formats, timeZone: invoice.company.timeZone };
  const money = (amount: Parameters<typeof formatMinorUnits>[1]) =>
    mono(formatMinorUnits(formats, amount));
  const registrationName = (type: string) => {
    const name = pack.tax.registrationTypes.find((known) => known.type === type)?.name ?? null;
    return name === null ? t(INVOICE_DOCUMENT.taxRegistration) : packLabel(name, locale);
  };
  const registrationLine = (held: InvoiceForDocument['supplierRegistration']) =>
    held === null ? '' : `<p>${text(registrationName(held.type))}: ${mono(held.value)}</p>`;
  const taxed = invoice.supplierRegistration !== null;
  const totals = invoiceTotals(invoice.lines);

  const lineRows = invoice.lines
    .map(
      (line) => `<tr>
        <td>${text(describe(line, formats, t))}</td>
        <td class="figure">${line.rateBasisPoints === null ? '' : mono(`${formatNumber(formats, basisPointsToPercent(line.rateBasisPoints))}%`)}</td>
        <td class="figure">${money(line.taxableAmount)}</td>
      </tr>`,
    )
    .join('');
  const taxRows = totals.taxByCode
    .map(
      (tax) =>
        `<tr><th colspan="2">${text(tax.code)}</th><td class="figure">${money(tax.amount)}</td></tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="${text(locale)}">
<head>
<meta charset="utf-8">
<title>${text(invoice.number)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: 'Noto Sans', 'Noto Sans Devanagari', sans-serif; font-size: 10pt; color: #000; margin: 0; }
  .mono { font-family: 'Noto Sans Mono', monospace; }
  h1 { font-size: 16pt; margin: 0 0 4mm; }
  h2 { font-size: 9pt; text-transform: uppercase; margin: 0 0 1mm; }
  p { margin: 0 0 1mm; }
  .facts, .parties { display: flex; gap: 10mm; margin-bottom: 6mm; }
  .parties > section { flex: 1; }
  .address { white-space: pre-line; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; }
  th, td { text-align: start; padding: 1.5mm 0; border-bottom: 0.3mm solid #000; vertical-align: top; }
  .figure { text-align: end; white-space: nowrap; }
  tfoot th { text-align: end; }
  .total th, .total td { font-weight: 700; }
</style>
</head>
<body>
  <h1>${text(t(taxed ? INVOICE_DOCUMENT.taxInvoice : INVOICE_DOCUMENT.plainInvoice))}</h1>
  <div class="facts">
    <p>${text(t(INVOICE_DOCUMENT.number))}: ${mono(invoice.number)}</p>
    <p>${text(t(INVOICE_DOCUMENT.issuedOn))}: ${text(formatDate(formats, invoice.issuedAt, locale))}</p>
    <p>${text(t(INVOICE_DOCUMENT.paysThrough))}: ${text(formatDate(formats, invoice.paysThrough, locale))}</p>
  </div>
  <div class="parties">
    <section>
      <h2>${text(t(INVOICE_DOCUMENT.supplier))}</h2>
      <p>${text(supplier.legalName)}</p>
      <p class="address">${text(supplier.address)}</p>
      ${registrationLine(invoice.supplierRegistration)}
    </section>
    <section>
      <h2>${text(t(INVOICE_DOCUMENT.billedTo))}</h2>
      <p>${text(invoice.company.name)}</p>
      <p class="address">${text(companyAddress(invoice.company))}</p>
      ${registrationLine(invoice.recipientRegistration)}
    </section>
  </div>
  ${invoice.recipientPlace === null ? '' : `<p>${text(t(INVOICE_DOCUMENT.placeOfSupply))}: ${mono(invoice.recipientPlace)}</p>`}
  ${invoice.serviceCode === null ? '' : `<p>${text(t(INVOICE_DOCUMENT.serviceCode))}: ${mono(invoice.serviceCode)}</p>`}
  <table>
    <thead><tr>
      <th>${text(t(INVOICE_DOCUMENT.description))}</th>
      <th class="figure">${taxed ? text(t(INVOICE_DOCUMENT.rate)) : ''}</th>
      <th class="figure">${text(t(INVOICE_DOCUMENT.amount))}</th>
    </tr></thead>
    <tbody>${lineRows}</tbody>
    <tfoot>
      <tr><th colspan="2">${text(t(INVOICE_DOCUMENT.subtotal))}</th><td class="figure">${money(totals.subtotal)}</td></tr>
      ${taxRows}
      <tr class="total"><th colspan="2">${text(t(INVOICE_DOCUMENT.total))}</th><td class="figure">${money(totals.total)}</td></tr>
    </tfoot>
  </table>
  ${taxed ? '' : `<p>${text(t(INVOICE_DOCUMENT.noTax))}</p>`}
  <p>${text(t(INVOICE_DOCUMENT.supplierOfRecord, { supplier: supplier.legalName }))}</p>
</body>
</html>`;
}

/** What a line sells, in words: the plan on its cycle, or the overage at its rate (`M12-35`). */
function describe(line: DocumentLine, formats: FormatPack, t: Translator['t']): string {
  const { sells } = line;
  if (sells.kind === 'plan') {
    return t(INVOICE_DOCUMENT.planLine, {
      tier: TIER_LABEL[sells.tier],
      cycle: t(INVOICE_CYCLE[sells.cycle]),
    });
  }
  return t(INVOICE_DOCUMENT.overageLine, {
    meter: t(INVOICE_METER[sells.meter]),
    quantity: formatNumber(formats, sells.quantity),
    rate: formatMinorUnits(formats, sells.unitRate),
  });
}

/** The company's address as it stands: its street lines, then its city and postal code. */
function companyAddress(company: InvoiceForDocument['company']): string {
  const place = [company.city, company.postalCode].filter((part) => part !== null).join(' ');
  return [company.address, place].filter((part) => part !== null && part !== '').join('\n');
}

/** A figure, a number or a registration: mono (`F7-09`). */
function mono(value: string): string {
  return `<span class="mono">${text(value)}</span>`;
}

function text(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
