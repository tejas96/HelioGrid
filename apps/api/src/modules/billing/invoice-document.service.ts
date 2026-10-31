import type {
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

  /** Keeps the PDF and points the invoice at it, once; a second run points nothing. */
  async attach(
    { tenantId, invoiceId, pdfBase64 }: InvoiceDocumentStepInput & { readonly pdfBase64: string },
    now: number,
  ): Promise<InvoiceDocumentStepResult> {
    const bytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'));
    if (bytes.length === 0 || bytes.length > MAX_PDF_BYTES) {
      throw new Error(`invoice ${invoiceId}'s PDF is ${bytes.length} bytes: not a document`);
    }
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
}
