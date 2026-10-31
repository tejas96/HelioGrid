import { OBJECT_STORE } from '@heliogrid/contracts';
import { Module, type Provider } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../config/env';
import { BillingModule } from '../billing/billing.public';
import { FileController } from './file.controller';
import { FileDocumentService } from './file.documents.service';
import { FileRepository } from './file.repository';
import { FileService } from './file.service';
import { objectStoreFor } from './internal/object-store.binding';

/** The store every file's bytes live in, chosen from settings alone (`objectStoreFor`). */
const objectStoreProvider: Provider = {
  provide: OBJECT_STORE,
  useFactory: (logger: PinoLogger) => objectStoreFor(ENV, (message) => logger.warn(message)),
  inject: [PinoLogger],
};

@Module({
  // Billing holds the storage gauge the upload gate reads.
  imports: [BillingModule],
  controllers: [FileController],
  providers: [FileService, FileDocumentService, FileRepository, objectStoreProvider],
  // A module that works on a stored file reaches it through the service, never the store.
  exports: [FileService, FileDocumentService],
})
export class FileModule {}
