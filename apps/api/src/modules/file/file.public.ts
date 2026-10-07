/**
 * The one files table (`T-FPLAT-035`). The service is exported whole for a module that works on a
 * stored file — the catalog import confirms and reads its price list through `confirmed` and
 * `readStored` (`T-M01-030c`); a module never reaches the store or the repository.
 */
export { FileModule } from './file.module';
export { FileService } from './file.service';
