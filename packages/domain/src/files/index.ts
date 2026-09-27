/**
 * The one files table's rules (`T-FPLAT-035`): where bytes live, which types exist, which subject
 * may own a file and who may store or read it.
 */

export { IMAGE_SIGNATURE_BYTES, matchesImageSignature } from './image-signature';
export type { FileDeclarationVerdict, FileSubjectKind, FileSubjectRule } from './rules';
export {
  FILE_DOWNLOAD_LINK_SECONDS,
  FILE_MAX_BYTES,
  FILE_STORE_ATTEMPTS,
  FILE_STORE_CONNECT_MS,
  FILE_STORE_REQUEST_MS,
  FILE_SUBJECT_KINDS,
  FILE_SUBJECT_RULES,
  FILE_UPLOAD_LINK_SECONDS,
  judgeFileDeclaration,
  mayReadFile,
  mayUploadFile,
} from './rules';
export type { FileContentType, StorageProvider } from './vocabulary';
export { FILE_CONTENT_TYPES, STORAGE_PROVIDERS } from './vocabulary';
