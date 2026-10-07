import {
  auditActorKindSchema,
  auditEventTypeSchema,
  catalogAvailabilitySchema,
  catalogImportConflictAnswerSchema,
  catalogImportEntryPointSchema,
  catalogImportRowOutcomeSchema,
  catalogImportStateSchema,
  catalogImportUnreadableReasonSchema,
  catalogProvenanceSchema,
  componentKindSchema,
  fileContentTypeSchema,
  invitationStatusSchema,
  loginProviderSchema,
  measurementSystemSchema,
  membershipStatusSchema,
  notificationTypeGroupSchema,
  notificationTypeSchema,
  otpChannelSchema,
  platformKindSchema,
  priceBookRateBasisSchema,
  pushPlatformSchema,
  releaseChangeKindSchema,
  rolePresetSchema,
  subjectKindSchema,
  tenantSegmentSchema,
  uiLanguageSchema,
} from '@heliogrid/contracts';
import postgres from 'postgres';

/**
 * Enum parity invariant — closes the highest-risk drift in the repo.
 *
 * packages/db hand-mirrors the contracts z.enums, and dependency-cruiser's `db-no-upward`
 * correctly forbids importing contracts there ("db never imports contracts, ui or apps").
 * So the two lists were kept in sync by discipline alone. tests/invariants is tagged `app`,
 * MAY import contracts, and can read live pg_enum values — that is the seam this uses.
 *
 * A value on one side only is a silent production defect: rows the API can never return,
 * or API values the database rejects at insert.
 */

/** pg enum type name → the contract schema whose values it must match, exactly. */
const MAPPED: Record<string, { options: readonly string[]; contract: string }> = {
  tenant_segment: { options: tenantSegmentSchema.options, contract: 'tenantSegmentSchema' },
  ui_language: { options: uiLanguageSchema.options, contract: 'uiLanguageSchema' },
  measurement_system: {
    options: measurementSystemSchema.options,
    contract: 'measurementSystemSchema',
  },
  role_preset: { options: rolePresetSchema.options, contract: 'rolePresetSchema' },
  membership_status: {
    options: membershipStatusSchema.options,
    contract: 'membershipStatusSchema',
  },
  platform_kind: { options: platformKindSchema.options, contract: 'platformKindSchema' },
  otp_channel: { options: otpChannelSchema.options, contract: 'otpChannelSchema' },
  login_provider: { options: loginProviderSchema.options, contract: 'loginProviderSchema' },
  audit_event_type: { options: auditEventTypeSchema.options, contract: 'auditEventTypeSchema' },
  audit_actor_kind: { options: auditActorKindSchema.options, contract: 'auditActorKindSchema' },
  subject_kind: { options: subjectKindSchema.options, contract: 'subjectKindSchema' },
  push_platform: {
    options: pushPlatformSchema.options,
    contract: 'pushPlatformSchema',
  },
  notification_type_group: {
    options: notificationTypeGroupSchema.options,
    contract: 'notificationTypeGroupSchema',
  },
  notification_type: {
    options: notificationTypeSchema.options,
    contract: 'notificationTypeSchema',
  },
  invitation_status: {
    options: invitationStatusSchema.options,
    contract: 'invitationStatusSchema',
  },
  component_kind: { options: componentKindSchema.options, contract: 'componentKindSchema' },
  catalog_provenance_label: {
    options: catalogProvenanceSchema.options,
    contract: 'catalogProvenanceSchema',
  },
  catalog_availability: {
    options: catalogAvailabilitySchema.options,
    contract: 'catalogAvailabilitySchema',
  },
  release_change_kind: {
    options: releaseChangeKindSchema.options,
    contract: 'releaseChangeKindSchema',
  },
  price_book_rate_basis: {
    options: priceBookRateBasisSchema.options,
    contract: 'priceBookRateBasisSchema',
  },
  catalog_import_status: {
    options: catalogImportStateSchema.options,
    contract: 'catalogImportStateSchema',
  },
  catalog_import_entry_point: {
    options: catalogImportEntryPointSchema.options,
    contract: 'catalogImportEntryPointSchema',
  },
  catalog_import_unreadable_reason: {
    options: catalogImportUnreadableReasonSchema.options,
    contract: 'catalogImportUnreadableReasonSchema',
  },
  catalog_import_row_outcome: {
    options: catalogImportRowOutcomeSchema.options,
    contract: 'catalogImportRowOutcomeSchema',
  },
  catalog_import_conflict_answer: {
    options: catalogImportConflictAnswerSchema.options,
    contract: 'catalogImportConflictAnswerSchema',
  },
};

/**
 * A vocabulary held by a CHECK instead of a pgEnum, because one of its values is longer than the
 * 63 bytes Postgres allows an enum label: constraint name → the contract schema whose values its
 * `IN (…)` list must match, exactly.
 */
const CHECKED: Record<string, { options: readonly string[]; contract: string }> = {
  file_content_type_known: {
    options: fileContentTypeSchema.options,
    contract: 'fileContentTypeSchema',
  },
};

/** The quoted literals of a CHECK as Postgres prints it back (`'text/csv'::text`). */
function checkedValues(definition: string): string[] {
  return [...definition.matchAll(/'((?:[^']|'')*)'/g)].map(([, value = '']) =>
    value.replace(/''/g, "'"),
  );
}

/**
 * pg enums that intentionally have NO contract counterpart yet, each with the reason.
 * A new pg enum that is neither mapped nor listed here FAILS — which forces a conscious
 * decision ("does this cross the wire?") instead of a silent omission.
 */
const NO_CONTRACT_YET: Record<string, string> = {
  storage_provider: "where a file's bytes live is server-internal; it never crosses the wire",
  usage_metric:
    'billing module not started (full metric enum seeded per the forward-compat register)',
  audit_actor_type: 'audit log is server-internal; never crosses the wire',
  phone_provider: 'telephony module not started (ADR-0019 seams only)',
  phone_number_type: 'telephony module not started',
  cli_series: 'telephony module not started',
  number_status: 'telephony module not started',
  phone_purpose: 'telephony module not started',
  mutation_result: 'offline sync module not started (Track E)',
};

/**
 * Deliberately one-directional. A contract enum with no pg counterpart is NOT a failure:
 * under Law 9 its table lands with its owning module (provenanceTier and workflowStatus are
 * wire-only today). The migration that stores a new enum pairs it with its contract.
 */

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`enum-parity: ${msg}`);
}

/**
 * One mapped pair's value-for-value comparison, split out so the caller stays a flat loop.
 * Order-insensitive: pgEnum sort order and z.enum declaration order are both arbitrary, so
 * only the SET matters.
 */
function checkMappedPair(
  typname: string,
  options: readonly string[],
  contract: string,
  dbEnums: Map<string, string[]>,
  problems: string[],
): void {
  const dbValues = dbEnums.get(typname);
  if (!dbValues) {
    problems.push(`"${typname}" is missing from the database, but ${contract} expects it`);
    return;
  }
  const inDb = [...dbValues].sort();
  const inContract = [...options].sort();
  const onlyDb = inDb.filter((v) => !inContract.includes(v));
  const onlyContract = inContract.filter((v) => !inDb.includes(v));
  if (onlyDb.length || onlyContract.length) {
    problems.push(
      `${typname} ↔ ${contract} DRIFT` +
        (onlyDb.length ? `\n      only in database: ${onlyDb.join(', ')}` : '') +
        (onlyContract.length ? `\n      only in contract: ${onlyContract.join(', ')}` : ''),
    );
  }
}

export async function runEnumParity(adminUrl: string) {
  const sql = postgres(adminUrl, { max: 1, onnotice: () => {} });
  try {
    const rows = await sql<{ typname: string; enumlabel: string }[]>`
      select t.typname, e.enumlabel
      from pg_type t
      join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      order by t.typname, e.enumsortorder`;

    const dbEnums = new Map<string, string[]>();
    for (const r of rows) {
      const list = dbEnums.get(r.typname) ?? [];
      list.push(r.enumlabel);
      dbEnums.set(r.typname, list);
    }
    if (dbEnums.size === 0) {
      /*
       * Zero enums is the correct state of a migrated database whose migrations declare none —
       * and the original defect when nothing was migrated at all, which used to be
       * indistinguishable from a passing run. The migration LEDGER tells the two apart, not a
       * table count: a readable-global table is not an enum, and its presence must not fail
       * this guard. A missing ledger reads as zero applied migrations.
       */
      const [ledger] = await sql<{ n: number }[]>`
        select count(*)::int as n from schema_migrations`.catch(() => [{ n: 0 }]);
      assert(
        (ledger?.n ?? 0) > 0,
        'no pg enums in public and no applied migration in schema_migrations — is the ' +
          'database migrated?',
      );
      console.log(
        'enum parity VACUOUS — the applied migrations declare no pg enum yet. ' +
          'Contract↔database enum drift is UNCHECKED until the first migration that adds one.',
      );
      return;
    }

    const problems: string[] = [];

    // Every mapped pair must match value-for-value.
    for (const [typname, { options, contract }] of Object.entries(MAPPED)) {
      checkMappedPair(typname, options, contract, dbEnums, problems);
    }

    // Every CHECK-held vocabulary must match value-for-value, as an enum does.
    const checks = await sql<{ conname: string; definition: string }[]>`
      select conname, pg_get_constraintdef(oid) as definition
      from pg_constraint
      where contype = 'c' and conname in ${sql(Object.keys(CHECKED))}`;
    const dbChecks = new Map(checks.map((c) => [c.conname, checkedValues(c.definition)]));
    for (const [conname, { options, contract }] of Object.entries(CHECKED)) {
      checkMappedPair(conname, options, contract, dbChecks, problems);
    }

    // A new pg enum must be consciously mapped or consciously excused.
    for (const typname of dbEnums.keys()) {
      if (typname in MAPPED || typname in NO_CONTRACT_YET) continue;
      problems.push(
        `pg enum "${typname}" is neither mapped to a contract schema nor listed in ` +
          'NO_CONTRACT_YET. Add it to MAPPED with its z.enum, or to NO_CONTRACT_YET with ' +
          'the reason it has no API surface.',
      );
    }

    if (problems.length) {
      throw new Error(
        `${problems.length} problem(s)\n  - ${problems.join('\n  - ')}\n\n` +
          '  A value on one side only is a silent production defect: rows the API can never\n' +
          '  return, or API values the database rejects at insert.',
      );
    }

    const excused = Object.keys(NO_CONTRACT_YET).filter((t) => dbEnums.has(t)).length;
    console.log(
      `enum parity OK — ${Object.keys(MAPPED).length} contract-backed enums and ` +
        `${Object.keys(CHECKED).length} CHECK-held vocabularies match, ` +
        `${excused} intentionally contract-free`,
    );
  } finally {
    await sql.end();
  }
}
