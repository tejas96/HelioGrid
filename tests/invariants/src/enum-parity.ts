import { rolePresetSchema, uiLanguageSchema, unitsPrefSchema } from '@heliogrid/contracts';
import { TENANT_SEGMENTS } from '@heliogrid/domain';
import postgres from 'postgres';

/**
 * Enum parity invariant — closes the drift packages/db/CLAUDE.md calls "the highest-risk
 * drift in the repo".
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
  tenant_segment: { options: TENANT_SEGMENTS, contract: 'TENANT_SEGMENTS (@heliogrid/domain)' },
  ui_language: { options: uiLanguageSchema.options, contract: 'uiLanguageSchema' },
  unit_pref: { options: unitsPrefSchema.options, contract: 'unitsPrefSchema' },
  role_preset: { options: rolePresetSchema.options, contract: 'rolePresetSchema' },
  // tenant_status, user_status and invite_status were mapped to contract enums that the
  // 2026-08-01 auth teardown deleted. The pg enums go with the greenfield reset,
  // so there is nothing on EITHER side to compare; the rebuild re-authors both halves and
  // re-adds the rows here. Leaving stale entries would fail on a database that is correct.
};

/**
 * pg enums that intentionally have NO contract counterpart yet, each with the reason.
 * A new pg enum that is neither mapped nor listed here FAILS — which forces a conscious
 * decision ("does this cross the wire?") instead of a silent omission.
 */
const NO_CONTRACT_YET: Record<string, string> = {
  file_kind: 'files module not started — no API surface yet',
  file_subject: 'files module not started',
  file_status: 'files module not started',
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
 * wire-only today). The /migration skill is what pairs a new stored enum with its contract.
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
    problems.push(`pg enum "${typname}" is missing, but ${contract} expects it`);
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
       * This guard exists to catch "you pointed the invariants at an unmigrated database",
       * which used to be indistinguishable from a passing run. After the 2026-08-01
       * greenfield reset zero enums is the CORRECT state — but only if there are
       * also zero tables. Enums missing while tables exist is still the original defect.
       */
      const [tables] = await sql<{ n: number }[]>`
        select count(*)::int as n from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('r', 'p')
          and c.relname <> 'schema_migrations'`;
      assert(
        (tables?.n ?? 0) === 0,
        `no pg enums in public, but ${tables?.n} table(s) exist — is the database migrated?`,
      );
      console.log(
        'enum parity VACUOUS — no pg enums and no tables (greenfield since 2026-08-01). ' +
          'Contract↔database enum drift is UNCHECKED until the first migration lands.',
      );
      return;
    }

    const problems: string[] = [];

    // Every mapped pair must match value-for-value.
    for (const [typname, { options, contract }] of Object.entries(MAPPED)) {
      checkMappedPair(typname, options, contract, dbEnums, problems);
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
      `enum parity OK — ${Object.keys(MAPPED).length} contract-backed enums match, ` +
        `${excused} intentionally contract-free`,
    );
  } finally {
    await sql.end();
  }
}
