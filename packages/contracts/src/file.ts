import { FILE_CONTENT_TYPES, FILE_SUBJECT_KINDS } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createHeadersSchema, extensibleEnum, uuidSchema } from './common';
import { baseError, errorEnvelope, IDEMPOTENCY_KEY_REUSED, unauthenticatedEnvelope } from './error';

const c = initContract();

/** Every type a stored file may be — derived from domain, mirrored as a pgEnum (`M17`). */
export const fileContentTypeSchema = z.enum(FILE_CONTENT_TYPES);
export type FileContentType = z.infer<typeof fileContentTypeSchema>;

/** The subjects a file may be stored against; grows with the slice that first stores one. */
export const fileSubjectKindSchema = z.enum(FILE_SUBJECT_KINDS);

/**
 * Base64 of the 32 bytes of a SHA-256 — what the store is told to hold the upload to. Canonical
 * only: 32 bytes leave two spare bits in the last character, and a non-zero pair decodes to the
 * same digest the store verifies but never string-equals the one it reports back, so `complete`
 * would refuse the right bytes forever.
 */
export const checksumSha256Schema = z.string().regex(/^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/);

/**
 * One stored file as a client sees it (`T-FPLAT-035`). No field names the store, the bucket or
 * the key: where bytes live is the server's, and a vendor move changes none of this.
 * `uploadedAt` is null until `complete` confirmed the bytes; until then nothing can read it.
 */
export const fileSchema = z.object({
  id: uuidSchema,
  subjectKind: extensibleEnum(FILE_SUBJECT_KINDS),
  subjectRef: uuidSchema,
  contentType: extensibleEnum(FILE_CONTENT_TYPES),
  byteSize: z.number().int().positive(),
  checksumSha256: checksumSha256Schema,
  uploadedAt: z.string().datetime().nullable(),
});
export type StoredFile = z.infer<typeof fileSchema>;

export const declareFileSchema = z.object({
  subjectKind: fileSubjectKindSchema,
  subjectRef: uuidSchema,
  contentType: fileContentTypeSchema,
  byteSize: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  checksumSha256: checksumSha256Schema,
});
export type DeclareFile = z.infer<typeof declareFileSchema>;

/** Where to PUT the bytes, and exactly the headers to send with them — the store refuses others. */
export const fileUploadSchema = z.object({
  url: z.string().url(),
  method: z.literal('PUT'),
  headers: z.record(z.string()),
  expiresAt: z.string().datetime(),
});
export type FileUpload = z.infer<typeof fileUploadSchema>;

/**
 * `upload` is null only when a replayed key names a file already completed: the bytes are
 * stored, so there is nothing to send. A replay of a pending file gets a fresh link — links are
 * never stored.
 */
export const declaredFileSchema = z.object({
  file: fileSchema,
  upload: fileUploadSchema.nullable(),
});
export type DeclaredFile = z.infer<typeof declaredFileSchema>;

export const fileDownloadSchema = z.object({
  url: z.string().url(),
  expiresAt: z.string().datetime(),
});
export type FileDownload = z.infer<typeof fileDownloadSchema>;

export const fileErrorCodes = [
  /** Larger than the subject kind takes. */
  'FILE_TOO_LARGE',
  /** A type the subject kind does not take, though the platform knows it. */
  'FILE_TYPE_NOT_TAKEN',
  /** Nothing is stored under the file yet — upload first. */
  'FILE_NOT_UPLOADED',
  /** What was stored is not what was declared: another size, checksum or type. */
  'FILE_CONTENT_MISMATCH',
  /** The store did not answer; nothing was written, and the same call may be sent again. */
  'OBJECT_STORE_UNAVAILABLE',
] as const;
export const fileErrorCodeSchema = z.enum(fileErrorCodes);
export type FileErrorCode = z.infer<typeof fileErrorCodeSchema>;

const fileParamsSchema = z.object({ id: uuidSchema });
const forbidden = errorEnvelope(baseError('FORBIDDEN'));
const notFound = errorEnvelope(baseError('NOT_FOUND'));
const notUploaded = errorEnvelope(fileErrorCodeSchema.extract(['FILE_NOT_UPLOADED']));

export const fileContract = c.router({
  declare: {
    method: 'POST',
    path: '/files',
    headers: createHeadersSchema,
    body: declareFileSchema,
    summary:
      'Declare a file for a subject — the row and a short-lived link the client uploads the bytes to directly',
    responses: {
      201: declaredFileSchema,
      401: unauthenticatedEnvelope,
      403: forbidden,
      /** No such subject in this company. */
      404: notFound,
      422: errorEnvelope(
        extensibleEnum(['FILE_TOO_LARGE', 'FILE_TYPE_NOT_TAKEN', IDEMPOTENCY_KEY_REUSED]),
      ),
    },
  },
  complete: {
    method: 'POST',
    path: '/files/:id/complete',
    pathParams: fileParamsSchema,
    body: c.noBody(),
    summary:
      'Confirm the upload arrived as declared — the file becomes readable; sending it again changes nothing',
    responses: {
      200: fileSchema,
      401: unauthenticatedEnvelope,
      403: forbidden,
      404: notFound,
      409: notUploaded,
      422: errorEnvelope(fileErrorCodeSchema.extract(['FILE_CONTENT_MISMATCH'])),
      503: errorEnvelope(fileErrorCodeSchema.extract(['OBJECT_STORE_UNAVAILABLE'])),
    },
  },
  downloadUrl: {
    method: 'GET',
    path: '/files/:id/download-url',
    pathParams: fileParamsSchema,
    summary: 'A short-lived link to a confirmed file, served as an attachment of its declared type',
    responses: {
      200: fileDownloadSchema,
      401: unauthenticatedEnvelope,
      403: forbidden,
      404: notFound,
      409: notUploaded,
    },
  },
});
