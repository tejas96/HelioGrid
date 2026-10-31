import { createHash } from 'node:crypto';
import { type FileContentType, OBJECT_STORE, type ObjectStore } from '@heliogrid/contracts';
import type { SubjectKind } from '@heliogrid/domain';
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
}
