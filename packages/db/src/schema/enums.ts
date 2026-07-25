import { pgEnum } from 'drizzle-orm/pg-core';

/** Postgres enums for closed sets that migrations own (rules/db.md). */

export const tenantSegment = pgEnum('tenant_segment', ['residential', 'ci', 'both']);
export const tenantStatus = pgEnum('tenant_status', ['active', 'suspended', 'churned']);
export const uiLanguage = pgEnum('ui_language', ['en', 'hi', 'mr']);
export const unitPref = pgEnum('unit_pref', ['m', 'ft']);
export const userStatus = pgEnum('user_status', ['invited', 'active', 'deactivated']);
export const rolePreset = pgEnum('role_preset', [
  'owner',
  'manager',
  'sales_rep',
  'surveyor',
  'designer',
  'engineer',
]);

export const fileKind = pgEnum('file_kind', [
  'photo',
  'document',
  'logo',
  'receipt',
  'recording',
  'transcript',
  'export',
  'kyc',
]);
export const fileSubject = pgEnum('file_subject', [
  'lead',
  'survey',
  'design',
  'proposal',
  'project',
  'call',
  'tenant',
]);
export const fileStatus = pgEnum('file_status', ['pending_upload', 'uploaded', 'deleted']);

/** Full metric enum from day one (forward-compat register: billing). */
export const usageMetric = pgEnum('usage_metric', [
  'voice_minutes',
  'ai_detections',
  'otp_sms',
  'storage_gb',
  'solar_data_fetch',
  'map_tile_fetch',
  'dem_tile_fetch',
  'push_sent',
  'document_rendered',
]);

export const auditActorType = pgEnum('audit_actor_type', [
  'user',
  'agent',
  'system',
  'webhook',
  'admin',
]);

export const phoneProvider = pgEnum('phone_provider', ['exotel']);
export const phoneNumberType = pgEnum('phone_number_type', ['platform', 'byo']);
export const cliSeries = pgEnum('cli_series', ['series_1600', 'series_140', 'standard']);
export const numberStatus = pgEnum('number_status', [
  'provisioning',
  'kyc_pending',
  'active',
  'porting',
  'suspended',
  'released',
]);
export const phonePurpose = pgEnum('phone_purpose', ['outbound', 'inbound', 'both']);

export const mutationResult = pgEnum('mutation_result', ['applied', 'rejected']);
