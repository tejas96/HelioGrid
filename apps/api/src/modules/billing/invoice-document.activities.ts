import {
  type InvoiceDocumentActivities,
  invoiceDocumentWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { InvoiceDocumentService } from './invoice-document.service';

/**
 * The invoice PDF's two api steps, registered with the step host on the workflow's queue: they run
 * here, beside the invoice tables. The render between them runs in the worker, on its own queue.
 */
@Injectable()
export class InvoiceDocumentActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(InvoiceDocumentService) private readonly documents: InvoiceDocumentService,
  ) {}

  onModuleInit(): void {
    const activities: InvoiceDocumentActivities = {
      invoiceDocumentPage: (input) => this.documents.page(input),
      attachInvoicePdf: (input) => this.documents.attach(input, Date.now()),
    };
    this.host.register({ taskQueue: invoiceDocumentWorkflow.taskQueue, activities });
  }
}
