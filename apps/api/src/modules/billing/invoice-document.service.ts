import type {
  CreditNoteDocumentPage,
  CreditNoteDocumentStepInput,
  CreditNoteDocumentStepResult,
  InvoiceDocumentPage,
  InvoiceDocumentStepInput,
  InvoiceDocumentStepResult,
} from '@heliogrid/contracts/workflows';
import { createTranslator } from '@heliogrid/i18n';
import { Inject, Injectable } from '@nestjs/common';
import { FileDocumentService } from '../file/file.public';
import { MarketPackService } from '../market/market.public';
import { invoiceDocumentHtml } from './internal/invoice-document.html';
import { InvoiceDocumentAdminRepository } from './invoice-document.admin.repository';

/** A Temporal payload is held to 2 MB; an invoice's PDF is tens of KB, so this is a broken render. */
const MAX_PDF_BYTES = 1_048_576;

/**
 * An invoice's PDF (`M12-44`): the page it is printed from, and the PDF kept once it is rendered.
 * Both run as steps of the `invoiceDocument` workflow, after the charge committed, so neither can
 * ever touch the payment.
 */
@Injectable()
export class InvoiceDocumentService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(InvoiceDocumentAdminRepository)
    private readonly invoices: InvoiceDocumentAdminRepository,
    @Inject(MarketPackService) private readonly packs: MarketPackService,
    @Inject(FileDocumentService) private readonly documents: FileDocumentService,
  ) {}

  /** The page in the company's document language; `null` once the invoice has its PDF. */
  async page({ tenantId, invoiceId }: InvoiceDocumentStepInput): Promise<InvoiceDocumentPage> {
    const invoice = await this.invoices.invoiceForDocument(tenantId, invoiceId);
    if (invoice === null) return null;
    const pack = await this.packs.currentPackOf(invoice.marketCode);
    const translator = await createTranslator(invoice.company.language);
    return { html: invoiceDocumentHtml(invoice, pack, translator) };
  }

  /**
   * Keeps the PDF and points the invoice at it, once; a second run points nothing. An invoice gone
   * since its page was read (its company removed) ends the step: the workflow retries without end,
   * so a write that can never land would retry forever.
   */
  async attach(
    { tenantId, invoiceId, pdfBase64 }: InvoiceDocumentStepInput & { readonly pdfBase64: string },
    now: number,
  ): Promise<InvoiceDocumentStepResult> {
    const waiting = await this.invoices.invoiceForDocument(tenantId, invoiceId);
    if (waiting === null) return { attached: false };
    const bytes = pdfBytesOf(pdfBase64, invoiceId);
    const fileId = await this.documents.keep({
      tenantId,
      subjectKind: 'subscription_invoice',
      subjectRef: invoiceId,
      contentType: 'application/pdf',
      bytes,
      now,
    });
    return { attached: await this.invoices.attachPdf(tenantId, invoiceId, fileId) };
  }

  /** A credit note's page (`M12-47`): its invoice's lines under the note's title; `null` once made. */
  async creditNotePage({
    tenantId,
    creditNoteId,
  }: CreditNoteDocumentStepInput): Promise<CreditNoteDocumentPage> {
    const found = await this.invoices.creditNoteForDocument(tenantId, creditNoteId);
    if (found === null) return null;
    const pack = await this.packs.currentPackOf(found.invoice.marketCode);
    const translator = await createTranslator(found.invoice.company.language);
    return { html: invoiceDocumentHtml(found.invoice, pack, translator, found.note) };
  }

  /** Keeps the credit note's PDF and points the note at it, once; a note gone since ends the step. */
  async attachCreditNote(
    {
      tenantId,
      creditNoteId,
      pdfBase64,
    }: CreditNoteDocumentStepInput & { readonly pdfBase64: string },
    now: number,
  ): Promise<CreditNoteDocumentStepResult> {
    const waiting = await this.invoices.creditNoteForDocument(tenantId, creditNoteId);
    if (waiting === null) return { attached: false };
    const bytes = pdfBytesOf(pdfBase64, creditNoteId);
    const fileId = await this.documents.keep({
      tenantId,
      subjectKind: 'credit_note',
      subjectRef: creditNoteId,
      contentType: 'application/pdf',
      bytes,
      now,
    });
    return { attached: await this.invoices.attachCreditNotePdf(tenantId, creditNoteId, fileId) };
  }
}

/** The rendered bytes, refused when they cannot be a document. */
function pdfBytesOf(pdfBase64: string, documentId: string): Uint8Array {
  const bytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'));
  if (bytes.length === 0 || bytes.length > MAX_PDF_BYTES) {
    throw new Error(`document ${documentId}'s PDF is ${bytes.length} bytes: not a document`);
  }
  return bytes;
}
