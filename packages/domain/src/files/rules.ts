import type { Capability } from '../authz/capabilities';
import { can, limitsOn } from '../authz/policy';
import type { RolePreset } from '../authz/roles';
import type { SubjectKind } from '../subject/kinds';
import type { FileContentType } from './vocabulary';

/**
 * No stored file is larger than this — the owner's ceiling, which every kind's own limit sits
 * under. A kind whose files are naturally larger (a phone photograph) is shrunk on the device
 * before it is declared, never let past it.
 */
export const FILE_MAX_BYTES = 2_000_000;

/** How long an upload link works (`02-system-architecture.md` §8): one slow mobile upload. */
export const FILE_UPLOAD_LINK_SECONDS = 15 * 60;
/** How long a download link works: long enough to fetch, short enough that a leaked one dies. */
export const FILE_DOWNLOAD_LINK_SECONDS = 5 * 60;

/**
 * How long confirming an upload waits on the store before it answers "unavailable, try again": a
 * HEAD and a few-byte read, so seconds, not the minute an S3 client would otherwise wait. One retry
 * covers a dropped connection without doubling a real outage's wait.
 */
export const FILE_STORE_CONNECT_MS = 2_000;
export const FILE_STORE_REQUEST_MS = 5_000;
export const FILE_STORE_ATTEMPTS = 2;

/**
 * What one kind of subject may own. Every field is required, so a kind cannot be enrolled
 * without saying who may read its files — an employee document readable by every member because
 * a slice forgot is the leak this shape exists to prevent.
 */
export interface FileSubjectRule {
  readonly upload: Capability;
  readonly read: Capability | 'member';
  readonly maxBytes: number;
  readonly contentTypes: readonly FileContentType[];
}

/**
 * The subjects a file may be stored against. It GROWS with the slice that first stores a file
 * for its subject (Law 9); a subject kind absent here owns no file, and the wire refuses it.
 */
export const FILE_SUBJECT_KINDS = ['tenant', 'catalog'] as const satisfies readonly SubjectKind[];
export type FileSubjectKind = (typeof FILE_SUBJECT_KINDS)[number];

export const FILE_SUBJECT_RULES: Readonly<Record<FileSubjectKind, FileSubjectRule>> = {
  /** The company's own files — its logo (`M01-50`), changed only by who manages its settings. */
  tenant: {
    upload: 'onboarding.manage_tenant_settings',
    read: 'member',
    maxBytes: FILE_MAX_BYTES,
    contentTypes: ['image/png', 'image/jpeg'],
  },
  /**
   * The company's catalog — a supplier's price list for the import (`M01-41`), its ref the
   * company's own id because the file is stored before the import that reads it exists. Read by
   * the same people who manage the catalog: a price list is prices.
   */
  catalog: {
    upload: 'onboarding.manage_catalog',
    read: 'onboarding.manage_catalog',
    maxBytes: FILE_MAX_BYTES,
    contentTypes: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
};

export type FileDeclarationVerdict = 'accepted' | 'too-large' | 'type-not-taken';

export function judgeFileDeclaration(
  rule: FileSubjectRule,
  contentType: FileContentType,
  byteSize: number,
): FileDeclarationVerdict {
  if (!rule.contentTypes.includes(contentType)) return 'type-not-taken';
  if (byteSize > rule.maxBytes) return 'too-large';
  return 'accepted';
}

/**
 * Storing a file is a write, so it needs the capability held outright: a limited cell is a narrower
 * act — Finance's "view prices & margins" on the catalog — and never stores anything.
 */
export function mayUploadFile(roles: readonly RolePreset[], rule: FileSubjectRule): boolean {
  return can(roles, rule.upload) && limitsOn(roles, rule.upload).length === 0;
}

/** `member` reads for anyone the session guard already admitted into the company. */
export function mayReadFile(roles: readonly RolePreset[], rule: FileSubjectRule): boolean {
  return rule.read === 'member' || can(roles, rule.read);
}
