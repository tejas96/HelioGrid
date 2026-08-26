/**
 * The twelve fixed preset roles — `docs/prd/foundations/F2-roles-and-permissions.md` F2-01,
 * and owner ruling `Q69` (2026-08-25), which supersedes the retired six-value set and says
 * it "must not be restored".
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

/**
 * The row-key prefix convention F2-25 fixes: `F2.M<nn>.<slug>`. Every capability below
 * carries its row key so a reader can find the binding cell in the PRD rather than trusting
 * this file. Where a matrix cell and this file could ever be read differently, the CELL wins.
 */
export type CapabilityRowKey = `F2.M${string}.${string}`;
