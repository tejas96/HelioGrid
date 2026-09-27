import { OBJECT_STORE } from '@heliogrid/contracts';
import { Module, type Provider } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../config/env';
import { FileController } from './file.controller';
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
  controllers: [FileController],
  providers: [FileService, FileRepository, objectStoreProvider],
})
export class FileModule {}
