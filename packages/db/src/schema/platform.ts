import {
  bigint,
  index,
  inet,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import {
  auditActorType,
  cliSeries,
  fileKind,
  fileStatus,
  fileSubject,
  mutationResult,
  numberStatus,
  phoneNumberType,
  phoneProvider,
  phonePurpose,
  usageMetric,
} from './enums';
import { tenants, users } from './identity';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** TENANT — object registry (Tigris); bytes never transit the API (presigned only). */
export const files = pgTable(
  'files',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    bucket: text('bucket').notNull(),
    objectKey: text('object_key').notNull(),
    mime: text('mime'),
    bytes: bigint('bytes', { mode: 'number' }),
    sha256: text('sha256'),
    kind: fileKind('kind').notNull(),
    subjectType: fileSubject('subject_type'),
    subjectId: uuid('subject_id'),
    status: fileStatus('status').notNull().default('pending_upload'),
    uploadedBy: uuid('uploaded_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [index('files_tenant_subject_idx').on(t.tenantId, t.subjectType, t.subjectId)],
);

/**
 * Append-only, TENANT-scoped with platform rows (tenant_id null). Range-partitioned by
 * month on occurred_at — the partition DDL lives in migrations/0001 (drizzle-kit cannot
 * express partitioning; this model is the query surface via the parent table).
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').$defaultFn(uuidv7).notNull(),
    tenantId: uuid('tenant_id'),
    actorType: auditActorType('actor_type').notNull(),
    actorId: uuid('actor_id'),
    action: text('action').notNull(),
    subjectType: text('subject_type'),
    subjectId: uuid('subject_id'),
    changes: jsonb('changes'),
    ip: inet('ip'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_log_tenant_idx').on(t.tenantId, t.occurredAt)],
);

/**
 * TENANT, append-only, the metered ledger. Partitioned by period_key (month) in 0001 —
 * the partition key makes `(idempotency_key, period_key)` a real uniqueness guarantee:
 * duplicate emits are no-ops. quantity: minutes/count/gb; storage_gb is a daily gauge.
 */
export const usageEvents = pgTable(
  'usage_events',
  {
    id: uuid('id').$defaultFn(uuidv7).notNull(),
    tenantId: uuid('tenant_id').notNull(),
    metric: usageMetric('metric').notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
    unit: text('unit').notNull(),
    subjectType: text('subject_type'),
    subjectId: uuid('subject_id'),
    providerRef: text('provider_ref'),
    costEstimatePaise: bigint('cost_estimate_paise', { mode: 'number' }),
    idempotencyKey: text('idempotency_key').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    periodKey: text('period_key').notNull(),
  },
  (t) => [
    // tenant_id LEADS the dedupe key (0003): without it one tenant's idempotency_key
    // suppresses another tenant's billable event. period_key stays because a unique index
    // on a partitioned table must contain every partition-key column.
    uniqueIndex('usage_events_idem_idx').on(t.tenantId, t.idempotencyKey, t.periodKey),
    index('usage_events_tenant_metric_idx').on(t.tenantId, t.metric, t.periodKey),
  ],
);

/** TENANT — platform Exophone or BYO (hosted with KYC; never CLI spoofing). */
export const tenantPhoneNumbers = pgTable(
  'tenant_phone_numbers',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    phoneE164: text('phone_e164').notNull(),
    provider: phoneProvider('provider').notNull().default('exotel'),
    providerRef: text('provider_ref'),
    numberType: phoneNumberType('number_type').notNull(),
    cliSeries: cliSeries('cli_series').notNull().default('standard'),
    status: numberStatus('status').notNull().default('provisioning'),
    kyc: jsonb('kyc'),
    purpose: phonePurpose('purpose').notNull().default('both'),
    /** FK to ivr_flows lands with the voice module's first migration (docs/04 §8). */
    ivrFlowId: uuid('ivr_flow_id'),
    ...timestamps,
  },
  (t) => [uniqueIndex('tenant_phone_numbers_unique_idx').on(t.tenantId, t.phoneE164)],
);

/** TENANT — offline-write idempotency ledger: at-least-once upload → exactly-once apply. */
export const syncMutations = pgTable(
  'sync_mutations',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    // Client-generated on an offline device — scoped per tenant (0003), never global.
    mutationId: text('mutation_id').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
    result: mutationResult('result').notNull(),
  },
  (t) => [
    unique('sync_mutations_tenant_mutation_key').on(t.tenantId, t.mutationId),
    index('sync_mutations_entity_idx').on(t.tenantId, t.entityType, t.entityId),
  ],
);
