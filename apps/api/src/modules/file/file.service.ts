import {
  type CreateHeaders,
  type DeclaredFile,
  type DeclareFile,
  type FileDownload,
  fileContract,
  OBJECT_STORE,
  type ObjectStore,
  type StoredFile,
} from '@heliogrid/contracts';
import {
  FILE_DOWNLOAD_LINK_SECONDS,
  FILE_SUBJECT_KINDS,
  FILE_SUBJECT_RULES,
  FILE_UPLOAD_LINK_SECONDS,
  type FileSubjectKind,
  type FileSubjectRule,
  IMAGE_SIGNATURE_BYTES,
  judgeFileDeclaration,
  matchesImageSignature,
  mayReadFile,
  mayUploadFile,
  type RolePreset,
  type SubjectKind,
} from '@heliogrid/domain';
import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import { FileRepository, type FileRow } from './file.repository';
import { SUBJECT_LOOKUPS } from './internal/subject-lookup';

const SECOND_MS = 1_000;

/**
 * The one files table's three acts (`T-FPLAT-035`): declare a file and hand back a link the
 * client uploads to directly, confirm what arrived, and hand out a short-lived link to read it.
 * The bytes never pass through here — only a HEAD and the first few bytes, which is how a store
 * that cannot be told the type is still held to it.
 */
@Injectable()
export class FileService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(FileRepository) private readonly files: FileRepository,
    @Inject(OBJECT_STORE) private readonly store: ObjectStore,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FileService.name);
  }

  async declare(
    tenantId: string,
    roles: readonly RolePreset[],
    body: DeclareFile,
    headers: CreateHeaders,
    act: Act,
  ): Promise<DeclaredFile> {
    const rule = FILE_SUBJECT_RULES[body.subjectKind];
    if (!mayUploadFile(roles, rule)) {
      throw new ForbiddenException('You may not store files against this.');
    }
    refuseUnlessAccepted(judgeFileDeclaration(rule, body.contentType, body.byteSize), rule);
    if (!(await SUBJECT_LOOKUPS[body.subjectKind](tenantId, body.subjectRef))) {
      throw new NotFoundException();
    }
    const route = fileContract.declare;
    const key = creationKeyOf(headers, act.actorUserId, route, body);
    const declared = await this.files.declare(
      tenantId,
      { ...body, provider: this.store.provider },
      act,
      key,
    );
    const row = this.replies.rowOf(declared, route, tenantId);
    if (row.uploadedAt !== null) return { file: toWire(row), upload: null };
    const signed = await this.store.signUpload({
      key: row.externalId,
      byteSize: row.byteSize,
      checksumSha256: row.checksumSha256,
      expiresInSeconds: FILE_UPLOAD_LINK_SECONDS,
    });
    return {
      file: toWire(row),
      upload: {
        url: signed.url,
        method: 'PUT',
        headers: { 'content-type': row.contentType, ...signed.headers },
        expiresAt: expiresAt(act.now, FILE_UPLOAD_LINK_SECONDS),
      },
    };
  }

  /**
   * Makes a file readable once the store holds exactly what was declared. Only its uploader, still
   * permitted, confirms it; confirming again answers the same file and asks the store nothing.
   */
  async complete(
    tenantId: string,
    roles: readonly RolePreset[],
    id: string,
    act: Act,
  ): Promise<StoredFile> {
    const row = await this.files.find(tenantId, id);
    if (row === null || row.uploadedBy !== act.actorUserId) throw new NotFoundException();
    if (!mayUploadFile(roles, ruleOf(row.subjectKind))) {
      throw new ForbiddenException('You may no longer store files against this.');
    }
    if (row.uploadedAt !== null) return toWire(row);
    await this.holdToDeclaration(row);
    return toWire(await this.files.markUploaded(tenantId, id, act.now));
  }

  async downloadUrl(
    tenantId: string,
    roles: readonly RolePreset[],
    id: string,
    now: number,
  ): Promise<FileDownload> {
    const row = await this.files.find(tenantId, id);
    if (row === null) throw new NotFoundException();
    if (!mayReadFile(roles, ruleOf(row.subjectKind))) {
      throw new ForbiddenException('You may not read this file.');
    }
    if (row.uploadedAt === null) throw notUploaded();
    const url = await this.store.signDownload({
      key: row.externalId,
      contentType: row.contentType,
      expiresInSeconds: FILE_DOWNLOAD_LINK_SECONDS,
    });
    return { url, expiresAt: expiresAt(now, FILE_DOWNLOAD_LINK_SECONDS) };
  }

  /**
   * The checksum — equal digests are equal bytes, so equal length too — then the first bytes
   * against the declared type. Any difference refuses; a store that kept no checksum refuses too.
   */
  private async holdToDeclaration(row: FileRow): Promise<void> {
    const stored = await this.fromStore(() => this.store.head(row.externalId));
    if (stored === null) throw notUploaded();
    const first = await this.fromStore(() =>
      this.store.readFirstBytes(row.externalId, IMAGE_SIGNATURE_BYTES),
    );
    const asDeclared =
      stored.checksumSha256 === row.checksumSha256 && matchesImageSignature(row.contentType, first);
    if (!asDeclared) {
      throw new ContractException(
        'FILE_CONTENT_MISMATCH',
        'The stored file is not the one declared. Upload it again.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  /** An outage is the store's, never the caller's: nothing was written and a retry is safe. */
  private async fromStore<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      this.logger.warn({ err: error }, 'the object store did not answer');
      throw new ContractException(
        'OBJECT_STORE_UNAVAILABLE',
        'File storage is not answering. Try again in a moment.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}

function refuseUnlessAccepted(
  verdict: ReturnType<typeof judgeFileDeclaration>,
  rule: FileSubjectRule,
): void {
  switch (verdict) {
    case 'accepted':
      return;
    case 'too-large':
      throw new ContractException(
        'FILE_TOO_LARGE',
        `This file is larger than the ${rule.maxBytes}-byte limit.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    case 'type-not-taken':
      throw new ContractException(
        'FILE_TYPE_NOT_TAKEN',
        `This takes only ${rule.contentTypes.join(', ')}.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
  }
}

/** A stored row's kind was a file kind when it was declared; anything else is a broken table. */
function ruleOf(kind: SubjectKind): FileSubjectRule {
  if (!isFileSubjectKind(kind))
    throw new Error(`a file is stored against ${kind}, which owns none`);
  return FILE_SUBJECT_RULES[kind];
}

function isFileSubjectKind(kind: SubjectKind): kind is FileSubjectKind {
  return (FILE_SUBJECT_KINDS as readonly SubjectKind[]).includes(kind);
}

function notUploaded(): ContractException {
  return new ContractException(
    'FILE_NOT_UPLOADED',
    'Nothing is stored for this file yet.',
    HttpStatus.CONFLICT,
  );
}

function expiresAt(now: number, seconds: number): string {
  return new Date(now + seconds * SECOND_MS).toISOString();
}

function toWire(row: FileRow): StoredFile {
  return {
    id: row.id,
    subjectKind: row.subjectKind,
    subjectRef: row.subjectRef,
    contentType: row.contentType,
    byteSize: row.byteSize,
    checksumSha256: row.checksumSha256,
    uploadedAt: row.uploadedAt?.toISOString() ?? null,
  };
}
