import { Module } from '@nestjs/common';
import { FileModule } from '../file/file.public';
import { MarketModule } from '../market/market.public';
import { BillingDocumentController } from './billing-document.controller';
import { BillingDocumentRepository } from './billing-document.repository';
import { InvoiceDocumentActivityRegistration } from './invoice-document.activities';
import { InvoiceDocumentAdminRepository } from './invoice-document.admin.repository';
import { InvoiceDocumentService } from './invoice-document.service';

/**
 * The invoice and credit note PDFs (`M12-44`, `M12-47`), and the route that signs one for the
 * Owner (`M12-46`). A module of its own beside `BillingModule`, not inside it: the PDF
 * is kept through `FileModule`, which imports `BillingModule` for the storage gauge, so the other
 * way round would close an import cycle. Nothing but `AppModule` imports this one; the invoice's
 * issue hands it the work through an outbox event.
 */
@Module({
  imports: [FileModule, MarketModule],
  controllers: [BillingDocumentController],
  providers: [
    BillingDocumentRepository,
    InvoiceDocumentService,
    InvoiceDocumentAdminRepository,
    InvoiceDocumentActivityRegistration,
  ],
})
export class InvoiceDocumentModule {}
