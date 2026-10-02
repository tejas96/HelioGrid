import { FILE_CONTENT_TYPES, STORAGE_PROVIDERS } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { creationKeyColumns } from './creation-key';
import { userAccount } from './identity';
import { subjectKind } from './subject';
import { tenant } from './tenant';

/** Where a row's bytes live; hand-mirrors domain's tuple (invariant `enum-parity`). Never on the wire. */
export const storageProvider = pgEnum('storage_provider', STORAGE_PROVIDERS);

/** Every type a stored file may be; hand-mirrors domain's tuple (invariant `enum-parity`). */
export const fileContentType = pgEnum('file_content_type', FILE_CONTENT_TYPES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * The one files table (`forward-compat.md`): every stored byte-stream in the suite is one row
 * here, and only here are its size, checksum, type and store location kept. A module's own row —
 * a survey photograph, an employee document — holds the domain facts and points at one of these.
 *
 * `provider` + `external_id` is the provider-ref pair, never a path string: a vendor move copies
 * objects and re-points rows, and a row always says which store holds its bytes.
 *
 * A row is written when the file is DECLARED and stays unreadable until `uploaded_at` is set by
 * a `complete` that read the stored bytes back and found them as declared. The grants make that
 * the only thing that ever changes: SELECT, INSERT and UPDATE on `uploaded_at` alone — no role
 * re-points a stored file, and none deletes one.
 *
 * Tenant-scoped, all four always.
 */
export const file = pgTable(
  'file',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    /** The record that owns the file — the suite's one polymorphic pointer (`F2-22`). */
    subjectKind: subjectKind('subject_kind').notNull(),
    subjectRef: uuid('subject_ref').notNull(),
    provider: storageProvider('provider').notNull(),
    /** The object key in that store, built from server ids only. */
    externalId: text('external_id').notNull(),
    contentType: fileContentType('content_type').notNull(),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    /** Base64 SHA-256 the store was told to hold the upload to. */
    checksumSha256: text('checksum_sha256').notNull(),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => userAccount.id),
    declaredAt: instant('declared_at').notNull(),
    /** Null until the stored bytes were confirmed; set once, from null, and never back. */
    uploadedAt: instant('uploaded_at'),
    ...creationKeyColumns(),
  },
  (table) => [
    check('file_byte_size_positive', sql`${table.byteSize} >= 1`),
    /** One row per stored object: two rows never claim the same bytes. */
    uniqueIndex('file_tenant_provider_external_key').on(
      table.tenantId,
      table.provider,
      table.externalId,
    ),
    /** A declare retried with its key finds the file it made (`F4-07`). */
    uniqueIndex('file_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    /** A subject's files — the carrier reads and M12's gauge per owner. */
    index('file_tenant_subject_idx').on(table.tenantId, table.subjectKind, table.subjectRef),
  ],
);
