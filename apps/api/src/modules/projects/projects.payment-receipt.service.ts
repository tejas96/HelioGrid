import type { PaymentReceipt, ReceiptPdf } from '@heliogrid/contracts';
import {
  type PaymentReceiptPage,
  type PaymentReceiptStepInput,
  type PaymentReceiptStepResult,
  paymentReceiptWorkflow,
} from '@heliogrid/contracts/workflows';
import {
  formatMoney,
  type MarketPack,
  minorUnits,
  packLabel,
  paymentModeLabel,
  type UiLanguage,
} from '@heliogrid/domain';
import { minorUnitsToDecimal, projectNumberOf, receiptNumberOf } from '@heliogrid/domain/server';
import { createTranslator, receiptMessage } from '@heliogrid/i18n';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { TemporalGateway } from '../../common/temporal/temporal.gateway';
import { FileDocumentService, pdfBytesOf } from '../file/file.public';
import { SettingsService } from '../settings/settings.public';
import { paymentReceiptHtml, type ReceiptIssuer } from './internal/payment-receipt.html';
import { languageOfCustomer } from './internal/payments-view';
import type { ProjectReader } from './internal/reader';
import { ProjectsPaymentReceiptRepository } from './projects.payment-receipt.repository';
import { ProjectsPaymentsReadRepository } from './projects.payments-read.repository';

/**
 * How long a person's ask waits for a first PDF: a warm render takes about a second, a cold
 * Chromium a few. Past it the answer says "still being made", and the next ask joins the same run.
 */
const PDF_WAIT_MS = 15_000;

/**
 * A payment's receipt (`M11-41`): as text to share, and as a PDF made the first time someone asks
 * for it — through the `paymentReceipt` workflow, whose two api steps live here — then kept against
 * the payment. Both are in the customer's language (`F3-06`), and both say a person recorded the
 * money, never a bank (`M11-42`).
 */
@Injectable()
export class ProjectsPaymentReceiptService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProjectsPaymentsReadRepository) private readonly reads: ProjectsPaymentsReadRepository,
    @Inject(ProjectsPaymentReceiptRepository)
    private readonly receipts: ProjectsPaymentReceiptRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(FileDocumentService) private readonly documents: FileDocumentService,
    @Inject(TemporalGateway) private readonly temporal: TemporalGateway,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {}

  /** The receipt as text, for a payment the reader may see. */
  async text(reader: ProjectReader, projectId: string, entryId: string): Promise<PaymentReceipt> {
    await this.paymentSeenBy(reader, projectId, entryId);
    const facts = await this.receipts.factsOf(reader.tenantId, entryId);
    if (facts === null) throw new NotFoundException('No such payment.');
    const language = languageOfCustomer(facts.preferredLanguage);
    const [pack, issuer, { t }] = await Promise.all([
      this.settings.packOf(reader.tenantId),
      this.issuerOf(reader.tenantId, language),
      createTranslator(language),
    ]);
    const number = receiptNumberOf(facts.receiptNumber);
    return {
      receiptNumber: number,
      language,
      text: receiptMessage(t, {
        number,
        company: issuer.name,
        customer: facts.customerName ?? facts.phoneE164,
        project: projectNumberOf(facts.projectNumber),
        part: facts.part.label,
        amount: formatMoney(
          pack.formats,
          minorUnitsToDecimal(minorUnits(facts.amountMinor), pack.formats.minorUnitDigits),
        ),
        mode: modeOf(pack, facts.mode, language),
        date: facts.receivedOn ?? '',
        reference: facts.reference,
        recorder: facts.recorderName,
      }),
    };
  }

  /**
   * The receipt PDF's link, for a payment the reader may see: the kept one, or one made now. A
   * render still going after `PDF_WAIT_MS` — or a renderer that cannot be reached — answers null,
   * and the next ask joins the same run (its id is the payment's).
   */
  async pdf(reader: ProjectReader, projectId: string, entryId: string): Promise<ReceiptPdf> {
    await this.paymentSeenBy(reader, projectId, entryId);
    const { tenantId } = reader;
    const kept =
      (await this.documents.kept(tenantId, 'project_payment', entryId)) ??
      (await this.made({ tenantId, entryId }));
    if (kept === null) return { download: null };
    return { download: await this.documents.signedDownload(tenantId, kept, Date.now()) };
  }

  /** The page to print, in the customer's language; nothing when the PDF is kept already. */
  async page({ tenantId, entryId }: PaymentReceiptStepInput): Promise<PaymentReceiptPage> {
    const kept = await this.documents.kept(tenantId, 'project_payment', entryId);
    if (kept !== null) return { kind: 'kept', fileId: kept };
    const facts = await this.receipts.factsOf(tenantId, entryId);
    if (facts === null) return null;
    const language = languageOfCustomer(facts.preferredLanguage);
    const [pack, issuer, translator] = await Promise.all([
      this.settings.packOf(tenantId),
      this.issuerOf(tenantId, language),
      createTranslator(language),
    ]);
    const mode = modeOf(pack, facts.mode, language);
    return { kind: 'page', html: paymentReceiptHtml(facts, issuer, mode, pack, translator) };
  }

  /** Keeps the printed PDF against the payment, once; a payment gone since ends the step. */
  async keep(
    { tenantId, entryId, pdfBase64 }: PaymentReceiptStepInput & { readonly pdfBase64: string },
    now: number,
  ): Promise<PaymentReceiptStepResult> {
    if ((await this.receipts.factsOf(tenantId, entryId)) === null) return { fileId: null };
    const fileId = await this.documents.keep({
      tenantId,
      subjectKind: 'project_payment',
      subjectRef: entryId,
      contentType: 'application/pdf',
      bytes: pdfBytesOf(pdfBase64, entryId),
      now,
    });
    return { fileId };
  }

  /** The PDF made by its workflow, waited for a while; null when it is not ready in time. */
  private async made(input: PaymentReceiptStepInput): Promise<string | null> {
    try {
      await this.temporal.start(paymentReceiptWorkflow, input);
      // A run that fails after the wait gave up answers nobody: its failure is let go here.
      const result = this.temporal
        .result(paymentReceiptWorkflow, paymentReceiptWorkflow.workflowId(input))
        .catch(() => null);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const waited = new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), PDF_WAIT_MS);
      });
      try {
        return (await Promise.race([result, waited]))?.fileId ?? null;
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      // The payment stands and the text receipt still answers: an unreachable renderer only delays.
      this.logger.warn({ err: error, entryId: input.entryId }, 'receipt PDF not made');
      return null;
    }
  }

  /** A standing payment of this project, in the reader's money reach (`M11-56`); else 404. */
  private async paymentSeenBy(
    reader: ProjectReader,
    projectId: string,
    entryId: string,
  ): Promise<void> {
    const facts = await this.reads.payments(reader, projectId);
    const entries = facts?.entries ?? [];
    const found = entries.some((one) => one.id === entryId && one.kind === 'payment');
    // A payment taken back has no receipt: a paper saying it was received would be untrue.
    const reversed = entries.some((one) => one.reversesId === entryId);
    if (!found || reversed) throw new NotFoundException('No such payment.');
  }

  /** The company the receipt is from: its name, address and the registration it holds. */
  private async issuerOf(tenantId: string, language: UiLanguage): Promise<ReceiptIssuer> {
    const [profile, registrations, pack] = await Promise.all([
      this.settings.businessProfile(tenantId),
      this.settings.taxRegistrations(tenantId),
      this.settings.packOf(tenantId),
    ]);
    const held = registrations.registrations[0] ?? null;
    const scheme =
      held === null
        ? null
        : (pack.tax.registrationTypes.find((known) => known.type === held.registrationType)?.name ??
          null);
    const place = [profile.city, profile.postalCode].filter((part) => part !== null).join(' ');
    return {
      name: profile.companyName ?? '',
      address: [profile.address, place].filter((part) => part !== null && part !== '').join(', '),
      registration:
        held === null
          ? null
          : `${scheme === null ? '' : `${packLabel(scheme, language)} `}${held.value}`,
    };
  }
}

/** A mode as the market pack names it, in the customer's language. */
function modeOf(pack: MarketPack, mode: string | null, language: UiLanguage): string {
  if (mode === null) return '';
  const label = paymentModeLabel(pack.formats.vocabulary, mode);
  return label === null ? mode : packLabel(label, language);
}
