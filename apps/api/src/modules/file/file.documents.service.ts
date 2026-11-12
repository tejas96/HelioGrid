import { createHash } from 'node:crypto';
import {
  type FileContentType,
  type FileDownload,
  OBJECT_STORE,
  type ObjectStore,
} from '@heliogrid/contracts';
import { FILE_DOWNLOAD_LINK_SECONDS, type SubjectKind } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { FileRepository } from './file.repository';
import { documentKeyOf } from './internal/object-key';

/** What the platform made, and the record it belongs to. */
export interface DocumentMade {
  readonly tenantId: string;
  readonly subjectKind: SubjectKind;
  readonly subjectRef: string;
  readonly contentType: FileContentType;
  readonly bytes: Uint8Array;
  readonly now: number;
}

/**
 * Documents the platform makes itself — an invoice's PDF (`M12-44`) — kept in the one files table
 * like any upload, with no uploader. For a workflow step only: the user file flow matches the
 * uploader, so it never serves one, and the storage meter counts none (`M12-18`).
 */
@Injectable()
export class FileDocumentService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(FileRepository) private readonly files: FileRepository,
    @Inject(OBJECT_STORE) private readonly store: ObjectStore,
  ) {}

  /** The document the platform already made for this record, if it did. */
  kept(tenantId: string, subjectKind: SubjectKind, subjectRef: string): Promise<string | null> {
    return this.files.documentOf(tenantId, this.store.provider, subjectKind, subjectRef);
  }

  /**
   * Stores the bytes, then writes their row, and answers its id. A record whose row exists already
   * keeps it and its bytes: a second render differs byte for byte (its timestamp), and the row,
   * which never changes, must go on describing what the store holds. A run stopped between the
   * store and the row stores again over its own unrecorded bytes. An outage throws, and the step
   * is retried.
   */
  async keep(made: DocumentMade): Promise<string> {
    const kept = await this.files.documentOf(
      made.tenantId,
      this.store.provider,
      made.subjectKind,
      made.subjectRef,
    );
    if (kept !== null) return kept;
    const checksumSha256 = createHash('sha256').update(made.bytes).digest('base64');
    await this.store.put({
      key: documentKeyOf(made.tenantId, made.subjectKind, made.subjectRef),
      bytes: made.bytes,
      contentType: made.contentType,
      checksumSha256,
    });
    return this.files.keepDocument(
      made.tenantId,
      {
        subjectKind: made.subjectKind,
        subjectRef: made.subjectRef,
        provider: this.store.provider,
        contentType: made.contentType,
        byteSize: made.bytes.length,
        checksumSha256,
      },
      made.now,
    );
  }

  /**
   * A short-lived link to a document the platform made for this company — an invoice's or a credit
   * note's PDF, which its own record's route asks for (`M12-46`); `null` when the company holds no
   * such file.
   */
  async signedDownload(
    tenantId: string,
    fileId: string,
    now: number,
  ): Promise<FileDownload | null> {
    const row = await this.files.find(tenantId, fileId);
    if (row === null) return null;
    const url = await this.store.signDownload({
      key: row.externalId,
      contentType: row.contentType,
      expiresInSeconds: FILE_DOWNLOAD_LINK_SECONDS,
    });
    return {
      url,
      expiresAt: new Date(now + FILE_DOWNLOAD_LINK_SECONDS * MS_PER_SECOND).toISOString(),
    };
  }
}

const MS_PER_SECOND = 1_000;

/** A Temporal payload is held to 2 MB; a document's PDF is tens of KB, so this is a broken render. */
const MAX_PDF_BYTES = 1_048_576;

/** A rendered PDF's bytes from its payload, refused when they cannot be a document. */
export function pdfBytesOf(pdfBase64: string, documentId: string): Uint8Array {
  const bytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'));
  if (bytes.length === 0 || bytes.length > MAX_PDF_BYTES) {
    throw new Error(`document ${documentId}'s PDF is ${bytes.length} bytes: not a document`);
  }
  return bytes;
}
