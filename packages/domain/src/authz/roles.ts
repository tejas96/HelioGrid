/**
 * The twelve fixed preset roles — `docs/prd/foundations/F2-roles-and-permissions.md` F2-01.
 * They supersede the retired six-value set, which must not be restored.
 *
 * A readonly tuple rather than a Zod enum because domain carries no dependencies — contracts
 * declares `z.enum(ROLE_PRESETS)` from this exact list, so the two can never disagree.
 *
 * ORDER IS PART OF THE SPEC. F2-25 fixes the column order of every permission matrix in the
 * product suite, and the role-administration screens render the same order. Sorting this
 * alphabetically would silently reorder every matrix a reader checks against the PRD.
 *
 * Identifiers are market-neutral snake_case; the DISPLAY names F2 fixes verbatim (EPC Owner,
 * Sales Manager, …) are user-visible copy and live in `packages/i18n` — never here.
 *
 * Presets are FIXED: no editor, no duplicate-from-preset, no tenant-created role (F2-02,
 * F2-16). Stacking them is the only widening mechanism there is (F2-10).
 */
export const ROLE_PRESETS = [
  'epc_owner',
  'sales_manager',
  'sales_executive',
  'survey_engineer',
  'design_engineer',
  'project_manager',
  'field_technician',
  'installation_team_member',
  'hr_admin',
  'finance',
  'operations',
  'marketing',
] as const;

export type RolePreset = (typeof ROLE_PRESETS)[number];

/** The role the person who creates a company holds from its first second (M01-01). */
export const FOUNDER_ROLE = 'epc_owner' satisfies RolePreset;

/**
 * A set of presets in the order the matrix fixes (F2-25) — the order chips render in and records
 * compare in, so one set always reads the same whatever order a request typed it, and a preset
 * typed twice is held once.
 */
export function inMatrixOrder(presets: Iterable<RolePreset>): RolePreset[] {
  const held = new Set(presets);
  return ROLE_PRESETS.filter((preset) => held.has(preset));
}
