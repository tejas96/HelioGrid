import {
  type PaymentReceiptActivities,
  paymentReceiptWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { ProjectsPaymentReceiptService } from './projects.payment-receipt.service';

/**
 * A payment's receipt PDF's two api steps, registered with the step host on the workflow's queue:
 * they run here, beside the ledger. The render between them runs in the worker, on its own queue.
 */
@Injectable()
export class ProjectsPaymentReceiptActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(ProjectsPaymentReceiptService) private readonly receipts: ProjectsPaymentReceiptService,
  ) {}

  onModuleInit(): void {
    const activities: PaymentReceiptActivities = {
      paymentReceiptPage: (input) => this.receipts.page(input),
      keepPaymentReceipt: (input) => this.receipts.keep(input, Date.now()),
    };
    this.host.register({ taskQueue: paymentReceiptWorkflow.taskQueue, activities });
  }
}
