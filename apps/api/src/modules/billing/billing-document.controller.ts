import { billingDocumentContract } from '@heliogrid/contracts';
import { Controller, Inject, NotFoundException, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { tenantIdOf } from '../../common/auth/session-context';
import { FileDocumentService } from '../file/file.public';
import { BillingDocumentRepository } from './billing-document.repository';

@Controller()
export class BillingDocumentController {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(BillingDocumentRepository) private readonly documents: BillingDocumentRepository,
    @Inject(FileDocumentService) private readonly files: FileDocumentService,
  ) {}

  @TsRestHandler(billingDocumentContract)
  // Invoices are the Owner's (`M12-56`) and exportable in every billing state (`M12-46`): a read,
  // which the billing gate never refuses.
  @RouteAccessMap(billingDocumentContract, {
    documentDownload: { capability: 'billing.view_usage_and_invoices' },
  })
  handler(@Req() req: Request) {
    return tsRestHandler(billingDocumentContract, {
      documentDownload: async ({ params }) => {
        const tenantId = tenantIdOf(req);
        const fileId = await this.documents.pdfOf(tenantId, params.id);
        const signed =
          fileId === null ? null : await this.files.signedDownload(tenantId, fileId, Date.now());
        if (signed === null) throw new NotFoundException();
        return { status: 200, body: signed };
      },
    });
  }
}
