import type { Capability } from '../authz/capabilities';
import { holdsOutright } from '../authz/outright';
import { can } from '../authz/policy';
import type { RolePreset } from '../authz/roles';
import type { SubjectKind } from '../subject/kinds';
import type { FileContentType } from './vocabulary';

/**
 * No stored file is larger than this — the owner's ceiling, which every kind's own limit sits
 * under. A kind whose files are naturally larger (a phone photograph) is shrunk on the device
 * before it is declared, never let past it.
 */
export const FILE_MAX_BYTES = 2_000_000;

/**
 * A CAD plan file is the one file larger than the ceiling (`T-M05-002d`): a house's DWG runs to
 * many MB, it cannot be shrunk on the device, and it is read on our server alone, because its
 * reader may not ship to a device. Every other file stays under `FILE_MAX_BYTES`.
 */
export const CAD_PLAN_MAX_BYTES = 20_000_000;
export const CAD_PLAN_CONTENT_TYPES = [
  'image/vnd.dwg',
  'image/vnd.dxf',
] as const satisfies readonly FileContentType[];

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
  /**
   * A capability held outright; `self`, only the person the subject is may store against it; or
   * `subject`, the subject's own module decides from the record itself — who may see the lead or
   * the project, and act on it — because a capability alone would let anyone holding it reach
   * every customer's papers.
   */
  readonly upload: Capability | 'self' | 'subject';
  readonly read: Capability | 'member' | 'subject';
  readonly maxBytes: number;
  readonly contentTypes: readonly FileContentType[];
}

/**
 * The spreadsheets an import takes (`M01-41`, `M02-18`): CSV and Excel. Every import's subject
 * names this one list, so the device's chooser and the store's rule cannot disagree.
 */
export const SPREADSHEET_CONTENT_TYPES = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const satisfies readonly FileContentType[];

/**
 * The subjects a file may be stored against. It GROWS with the slice that first stores a file
 * for its subject (Law 9); a subject kind absent here owns no file, and the wire refuses it.
 */
export const FILE_SUBJECT_KINDS = [
  'tenant',
  'catalog',
  'user_account',
  'lead_import',
  'lead',
  'project',
  'project_payment',
  'proposal_version',
  'design',
] as const satisfies readonly SubjectKind[];
export type FileSubjectKind = (typeof FILE_SUBJECT_KINDS)[number];

/** `satisfies`, so a reader of one kind's rule sees its own capability, not the union with `self`. */
export const FILE_SUBJECT_RULES = {
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
    contentTypes: SPREADSHEET_CONTENT_TYPES,
  },
  /**
   * A person's photo in this company (`M01-14`): stored by that person alone, whatever they hold,
   * and seen by everyone they work with. Its ref is their user id.
   */
  user_account: {
    upload: 'self',
    read: 'member',
    maxBytes: FILE_MAX_BYTES,
    contentTypes: ['image/png', 'image/jpeg'],
  },
  /**
   * An old spreadsheet of leads for the lead import (`M02-18`), its ref the company's own id because
   * the file is stored before the import that reads it exists. Read by whoever may import leads: the
   * file is customers' numbers.
   */
  lead_import: {
    upload: 'crm.import_leads',
    read: 'crm.import_leads',
    maxBytes: FILE_MAX_BYTES,
    contentTypes: SPREADSHEET_CONTENT_TYPES,
  },
  /**
   * A customer's papers on their lead (`M02-32`) — a bill, a roof photo. Who may see the lead may
   * read them, and who may also edit it may add one; the project won from the lead shows them too
   * (ruling 2026-11-10), so its people read them through it.
   */
  lead: {
    upload: 'subject',
    read: 'subject',
    maxBytes: FILE_MAX_BYTES,
    contentTypes: ['image/png', 'image/jpeg', 'application/pdf'],
  },
  /**
   * A project's documents, install photos and other files (`M08-30`, `M08-42`, ruling 2026-11-10):
   * read by whoever may see the project; stored by who may work its documents, and by its crew for
   * their own steps' photos. A phone photo is shrunk before it is declared.
   */
  project: {
    upload: 'subject',
    read: 'subject',
    maxBytes: FILE_MAX_BYTES,
    contentTypes: ['image/png', 'image/jpeg', 'application/pdf'],
  },
  /**
   * A payment's receipt photo (`M11-37`): stored after the payment is saved, so a slow upload never
   * holds the money back; by who may record payments, read by whoever may see the project's money.
   * Its receipt PDF hangs on the same payment, made by the platform, never uploaded.
   */
  project_payment: {
    upload: 'subject',
    read: 'subject',
    maxBytes: FILE_MAX_BYTES,
    contentTypes: ['image/png', 'image/jpeg'],
  },
  /**
   * A generated version's document (`M06-42`, `M06-51`): made by the platform at Generate and kept
   * against the version, never uploaded — its module answers no to every upload. Read by whoever
   * may see the proposal's lead; the customer reads it through their link's own file route (`F5-70`).
   */
  proposal_version: {
    upload: 'subject',
    read: 'subject',
    maxBytes: FILE_MAX_BYTES,
    contentTypes: ['application/pdf'],
  },
  /**
   * A design's own picture (`T-M05-002d`): the cut-out pieces of a photo, a drone map or a picture
   * page, the plan's lines, and a CAD plan read on the server. Who may see the design reads them,
   * and who may also change it adds one — the studio's own judge decides, as the CRM does for a lead.
   */
  design: {
    upload: 'subject',
    read: 'subject',
    maxBytes: FILE_MAX_BYTES,
    contentTypes: ['image/jpeg', 'application/json', ...CAD_PLAN_CONTENT_TYPES],
  },
} as const satisfies Readonly<Record<FileSubjectKind, FileSubjectRule>>;

export type FileDeclarationVerdict = 'accepted' | 'too-large' | 'type-not-taken';

/** The largest file of this type the rule takes: a CAD plan's own limit, else the kind's. */
export function maxBytesOf(
  rule: Pick<FileSubjectRule, 'maxBytes'>,
  contentType: FileContentType,
): number {
  return (CAD_PLAN_CONTENT_TYPES as readonly FileContentType[]).includes(contentType)
    ? CAD_PLAN_MAX_BYTES
    : rule.maxBytes;
}

export function judgeFileDeclaration(
  rule: Pick<FileSubjectRule, 'contentTypes' | 'maxBytes'>,
  contentType: FileContentType,
  byteSize: number,
): FileDeclarationVerdict {
  if (!rule.contentTypes.includes(contentType)) return 'type-not-taken';
  if (byteSize > maxBytesOf(rule, contentType)) return 'too-large';
  return 'accepted';
}

/**
 * Storing a file is a write, so it needs the capability held outright: a limited cell is a narrower
 * act — Finance's "view prices & margins" on the catalog — and never stores anything. A `self` kind
 * needs no capability, only that the subject is the caller; a `subject` kind takes its own module's
 * answer about the record (`subject.allows`).
 */
export function mayUploadFile(
  roles: readonly RolePreset[],
  rule: FileSubjectRule,
  subject: SubjectAnswer,
): boolean {
  if (rule.upload === 'self') return subject.isCaller;
  if (rule.upload === 'subject') return subject.allows;
  return holdsOutright(roles, rule.upload);
}

/**
 * `member` reads for anyone the session guard already admitted into the company; a `subject` kind
 * reads for whoever its own module says may see the record.
 */
export function mayReadFile(
  roles: readonly RolePreset[],
  rule: FileSubjectRule,
  subject: SubjectAnswer,
): boolean {
  if (rule.read === 'member') return true;
  if (rule.read === 'subject') return subject.allows;
  return can(roles, rule.read);
}

/**
 * What the file service learns about the subject before it judges: whether the subject is the
 * caller (a `self` kind), and whether the subject's module lets the caller do the act (a `subject`
 * kind). A kind that uses neither is handed `false` for both.
 */
export interface SubjectAnswer {
  readonly isCaller: boolean;
  readonly allows: boolean;
}
