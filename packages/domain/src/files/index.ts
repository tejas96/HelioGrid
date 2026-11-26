/**
 * The one files table's rules (`T-FPLAT-035`): where bytes live, which types exist, which subject
 * may own a file and who may store or read it.
 */

export { base64Of, bytesOfBase64 } from '../format/base64';
export { checksumSha256Of } from './checksum';
export { FILE_SIGNATURE_BYTES, matchesFileSignature } from './file-signature';
export type { FileDeclarationVerdict, FileSubjectKind, FileSubjectRule } from './rules';
export {
  CAD_PLAN_CONTENT_TYPES,
  CAD_PLAN_MAX_BYTES,
  FILE_DOWNLOAD_LINK_SECONDS,
  FILE_MAX_BYTES,
  FILE_STORE_ATTEMPTS,
  FILE_STORE_CONNECT_MS,
  FILE_STORE_REQUEST_MS,
  FILE_SUBJECT_KINDS,
  FILE_SUBJECT_RULES,
  FILE_UPLOAD_LINK_SECONDS,
  judgeFileDeclaration,
  maxBytesOf,
  mayReadFile,
  mayUploadFile,
  SPREADSHEET_CONTENT_TYPES,
  type SubjectAnswer,
} from './rules';
export type { FileContentType, StorageProvider } from './vocabulary';
export { FILE_CONTENT_TYPES, STORAGE_PROVIDERS } from './vocabulary';
