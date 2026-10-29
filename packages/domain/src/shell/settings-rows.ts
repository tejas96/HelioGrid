import type { Capability } from '../authz/capabilities';
import { can } from '../authz/policy';
import type { RolePreset } from '../authz/roles';

/**
 * The groups of the settings list behind `More` (`SCR-SHELL-01`, *More: the settings list*), in
 * the order the page draws them. The words are `packages/i18n`'s.
 */
export const SETTINGS_GROUPS = ['you', 'team', 'company', 'catalog', 'agent', 'money'] as const;
export type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

/** Every settings screen a row may lead to — V1 screens only, in the order the page draws them. */
export const SETTINGS_ROWS = [
  'profile',
  'team',
  'roles',
  'company_profile',
  'branding',
  'proposal_templates',
  'payment_terms',
  'catalog',
  'agent',
  'collections',
  'billing',
  'usage',
] as const;
export type SettingsRow = (typeof SETTINGS_ROWS)[number];

/**
 * Where each row sits and what opens it: the F2 matrix's own capability (`F7-48` — the list
 * never offers a screen the role cannot open), or none for a screen every signed-in person has.
 * A limited grant opens the row (`can`), as it opens the screen.
 */
const SETTINGS_ROW_RULE: Record<SettingsRow, { group: SettingsGroup; opens: Capability | null }> = {
  profile: { group: 'you', opens: null },
  team: { group: 'team', opens: 'onboarding.manage_team' },
  roles: { group: 'team', opens: 'onboarding.manage_team' },
  company_profile: { group: 'company', opens: 'onboarding.manage_tenant_settings' },
  branding: { group: 'company', opens: 'onboarding.manage_tenant_settings' },
  proposal_templates: { group: 'company', opens: 'onboarding.manage_tenant_settings' },
  payment_terms: { group: 'company', opens: 'onboarding.manage_tenant_settings' },
  catalog: { group: 'catalog', opens: 'onboarding.manage_catalog' },
  agent: { group: 'agent', opens: 'onboarding.configure_agent' },
  collections: { group: 'money', opens: 'payments.connect_gateway' },
  billing: { group: 'money', opens: 'billing.manage_billing' },
  usage: { group: 'money', opens: 'billing.view_usage_and_invoices' },
};

/**
 * Each row's address segment under `More`, one fact on both apps: the web's `/more/team` and the
 * phone's `heliogrid://more/team` are the same link (`M01-61`). A segment changed here changes a
 * public address.
 */
export const SETTINGS_SEGMENT: Record<SettingsRow, string> = {
  profile: 'profile',
  team: 'team',
  roles: 'roles',
  company_profile: 'company-profile',
  branding: 'branding',
  proposal_templates: 'proposal-templates',
  payment_terms: 'payment-terms',
  catalog: 'catalog',
  agent: 'agent',
  collections: 'collections',
  billing: 'billing',
  usage: 'usage',
};

/**
 * The Roles reference opened from Assign Roles (`SCR-M01-14`, `d-from-assign`): one word on both apps
 * — the web's `?from=` and the phone's route param — so its way back names Assign Roles.
 */
export const OPENED_FROM_ASSIGN_ROLES = 'assign-roles';

/** One group of the list as a person sees it: its rows, in order, never empty. */
export interface SettingsGroupRows {
  readonly group: SettingsGroup;
  readonly rows: readonly SettingsRow[];
}

/** One row of the list, worded: the screen it leads to and its name. `Words` is `packages/i18n`'s words, which this package may not name. */
export interface SettingsListRow<Words extends string = string> {
  readonly key: SettingsRow;
  readonly name: Words;
}

/** One group of the list, worded: its name and its rows in order. */
export interface SettingsListGroup<Words extends string = string> {
  readonly key: SettingsGroup;
  readonly name: Words;
  readonly rows: readonly SettingsListRow<Words>[];
}

/**
 * The list as a screen draws it — the groups a person's presets leave them, each row named. One
 * shape: `packages/i18n` words it, `packages/ui` draws it, and neither may import the other.
 */
export interface SettingsListView<Words extends string = string> {
  readonly title: Words;
  readonly groups: readonly SettingsListGroup<Words>[];
}

/** Whether the held presets open this row — a row every person has, or one the matrix grants. */
export function opensSettingsRow(roles: readonly RolePreset[], row: SettingsRow): boolean {
  const { opens } = SETTINGS_ROW_RULE[row];
  return opens === null || can(roles, opens);
}

/**
 * The list for a person holding `roles`: each group in order with the rows the presets open, a
 * group with none left out. A role's rows follow the matrix, never a table of their own.
 */
export function settingsRowsFor(roles: readonly RolePreset[]): readonly SettingsGroupRows[] {
  return SETTINGS_GROUPS.flatMap((group) => {
    const rows = SETTINGS_ROWS.filter(
      (row) => SETTINGS_ROW_RULE[row].group === group && opensSettingsRow(roles, row),
    );
    return rows.length === 0 ? [] : [{ group, rows }];
  });
}

/** The row a link's segment names, or null for an address that is no row's. */
export function settingsRowOfSegment(segment: string): SettingsRow | null {
  return SETTINGS_ROWS.find((row) => SETTINGS_SEGMENT[row] === segment) ?? null;
}

/**
 * The settings page a person's list opens first when it stands beside settings pages at the shell's
 * desktop width — its first row — or null when it has nothing to move between (one row), and so
 * stays a list page with no side list (`SCR-SHELL-01`, *More: the settings list*).
 */
export function firstSettingsPageBeside(roles: readonly RolePreset[]): SettingsRow | null {
  const rows = settingsRowsFor(roles).flatMap((group) => group.rows);
  return rows.length > 1 ? (rows[0] ?? null) : null;
}
