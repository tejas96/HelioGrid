import { Module } from '@nestjs/common';
import { FileModule } from '../file/file.public';
import { MarketModule } from '../market/market.public';
import { InvoiceDocumentActivityRegistration } from './invoice-document.activities';
import { InvoiceDocumentAdminRepository } from './invoice-document.admin.repository';
import { InvoiceDocumentService } from './invoice-document.service';

/**
 * The invoice PDF (`M12-44`). A module of its own beside `BillingModule`, not inside it: the PDF
 * is kept through `FileModule`, which imports `BillingModule` for the storage gauge, so the other
 * way round would close an import cycle. Nothing but `AppModule` imports this one; the invoice's
 * issue hands it the work through an outbox event.
 */
@Module({
  imports: [FileModule, MarketModule],
  providers: [
    InvoiceDocumentService,
    InvoiceDocumentAdminRepository,
    InvoiceDocumentActivityRegistration,
  ],
})
export class InvoiceDocumentModule {}
