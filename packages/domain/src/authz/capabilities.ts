import type { CapabilityRowKey, RolePreset } from './roles';

/**
 * Capabilities — the rows of `docs/prd/foundations/F2-roles-and-permissions.md` §F2.5.
 *
 * **Only M01's rows are here** (Law 9: a module authors its own slice). Each later module
 * appends its own file beside this one when its slice begins; the union below grows with
 * them, and the guard's `@Capability(...)` argument stays exhaustively typed the whole way.
 *
 * Rows are phrased as ACTS, never as CRUD on entities (F2-25, journey L1440–1441). "Manage
 * team and roles" is a row; "update users" is not.
 */
export const M01_CAPABILITIES = [
  'm01.manage_team',
  'm01.configure_agent',
  'm01.manage_catalog',
  'm01.manage_tenant_settings',
  'm01.add_own_catalog_items',
] as const;

export type Capability = (typeof M01_CAPABILITIES)[number];

/**
 * How a preset holds a row.
 *
 * `granted` and `denied` are the ✓ and — cells. `limited` is F2's third cell form, which the
 * matrix calls "a phrase in a cell is a scoped grant": Finance holds `manage-catalog` as
 * *"view prices & margins"*, which is neither a full grant nor one of the four visibility
 * scopes — it is a NARROWER ACT.
 *
 * We carry the phrase VERBATIM rather than inventing a `view-catalog-prices` row the PRD does
 * not have. A boolean guard cannot enforce a sentence, so `limited` grants the act and
 * surfaces the limit for the owning slice to enforce; it never silently drops it, and it
 * never silently widens it either. Recorded as an open question (`Q72`) so the catalog slice
 * splits it into a real row rather than inheriting a string.
 */
export type CapabilityGrant =
  | { readonly held: false }
  | { readonly held: true }
  | { readonly held: true; readonly limitedTo: string };

const DENIED: CapabilityGrant = { held: false };
const GRANTED: CapabilityGrant = { held: true };
const limited = (limitedTo: string): CapabilityGrant => ({
  held: true,
  limitedTo,
});

export interface CapabilityRow {
  /** The binding cell in the PRD. Where this file and that cell differ, the CELL wins. */
  readonly rowKey: CapabilityRowKey;
  readonly grants: Readonly<Record<RolePreset, CapabilityGrant>>;
}

/**
 * `Record<Capability, …>` and `Record<RolePreset, …>` are the mechanism, not decoration:
 * a new capability or a thirteenth preset fails to compile until every cell is stated. There
 * is no default — an unstated cell is exactly how a permission silently appears.
 */
export const CAPABILITY_MATRIX: Readonly<Record<Capability, CapabilityRow>> = {
  'm01.manage_team': {
    rowKey: 'F2.M01.manage-team',
    grants: {
      epc_owner: GRANTED,
      sales_manager: DENIED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: DENIED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: DENIED,
      marketing: DENIED,
    },
  },
  'm01.configure_agent': {
    rowKey: 'F2.M01.configure-agent',
    grants: {
      epc_owner: GRANTED,
      sales_manager: DENIED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: DENIED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: DENIED,
      marketing: DENIED,
    },
  },
  'm01.manage_catalog': {
    rowKey: 'F2.M01.manage-catalog',
    grants: {
      epc_owner: GRANTED,
      sales_manager: DENIED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: DENIED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: limited('view prices & margins'),
      operations: GRANTED,
      marketing: DENIED,
    },
  },
  'm01.manage_tenant_settings': {
    rowKey: 'F2.M01.manage-tenant-settings',
    grants: {
      epc_owner: GRANTED,
      sales_manager: DENIED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: DENIED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: DENIED,
      marketing: DENIED,
    },
  },
  'm01.add_own_catalog_items': {
    rowKey: 'F2.M01.add-own-catalog-items',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
      survey_engineer: DENIED,
      design_engineer: GRANTED,
      project_manager: DENIED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: GRANTED,
      marketing: DENIED,
    },
  },
};
