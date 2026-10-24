import type { RolePreset, SettingsListGroup, SettingsRow } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/AppShell.types';

/** Each row's glyph, as the record names them (Lucide-shaped, drawn once in `ShellGlyph`). */
export const SETTINGS_ROW_GLYPH: Record<SettingsRow, ShellGlyphName> = {
  profile: 'people',
  team: 'people',
  roles: 'shield',
  company_profile: 'building',
  branding: 'palette',
  proposal_templates: 'document',
  payment_terms: 'calendar-clock',
  catalog: 'package',
  agent: 'headset',
  collections: 'wallet',
  billing: 'credit-card',
  usage: 'gauge',
};

/**
 * Each role's own glyph — one per role on every screen that draws one: the Roles reference's tiles
 * (`SCR-M01-14`) and Assign Roles' grant discs (`SCR-M01-13`; owner ruling 2026-10-24). A
 * thirteenth preset fails to compile until it has one.
 */
export const PRESET_GLYPH: Record<RolePreset, ShellGlyphName> = {
  epc_owner: 'shield',
  sales_manager: 'people',
  sales_executive: 'people',
  survey_engineer: 'calendar-clock',
  design_engineer: 'board',
  project_manager: 'board',
  field_technician: 'building',
  installation_team_member: 'package',
  hr_admin: 'pair',
  finance: 'wallet',
  operations: 'gauge',
  marketing: 'megaphone',
};

/** The person's own row, when the person's group is drawn as their tile. */
export function personRow(group: SettingsListGroup): SettingsListGroup['rows'][number] | null {
  return group.key === 'you' ? (group.rows[0] ?? null) : null;
}
