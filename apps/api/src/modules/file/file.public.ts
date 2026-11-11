/**
 * The one files table (`T-FPLAT-035`). The service is exported whole for a module that works on a
 * stored file — an import confirms and reads its spreadsheet through `confirmed` and `readStored`
 * (`T-M01-030c`, `M02-18`), then opens it with the one spreadsheet reader; a module never reaches
 * the store or the repository.
 */
export { type DocumentMade, FileDocumentService } from './file.documents.service';
export { FileModule } from './file.module';
export { FileService } from './file.service';
export {
  readSheetRows,
  readSpreadsheet,
  type SheetRowsRead,
  type SpreadsheetRead,
} from './file.spreadsheet';
export {
  FileSubjectRegistry,
  type SubjectJudge,
  type SubjectPerson,
} from './file.subject.registry';
