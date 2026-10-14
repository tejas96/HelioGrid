import type { SettingsGroup, SettingsListGroup, SettingsRow } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/AppShell.types';

/**
 * Where each group sits at the desktop width — the record's three columns, by what is decided
 * together: the person and their team · the company, what it sells and says on calls · money.
 */
const SETTINGS_GROUP_COLUMN: Record<SettingsGroup, 0 | 1 | 2> = {
  you: 0,
  team: 0,
  company: 1,
  catalog: 1,
  agent: 1,
  money: 2,
};

/**
 * The groups as columns, each column its groups in page order, a column with no group left out —
 * so a role with one group draws one column, and nothing stands empty beside it.
 */
export function settingsColumns(
  groups: readonly SettingsListGroup[],
): readonly (readonly SettingsListGroup[])[] {
  const columns: SettingsListGroup[][] = [[], [], []];
  for (const group of groups) columns[SETTINGS_GROUP_COLUMN[group.key]]?.push(group);
  return columns.filter((column) => column.length > 0);
}

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

/** The person's own row, when the person's group is drawn as their tile. */
export function personRow(group: SettingsListGroup): SettingsListGroup['rows'][number] | null {
  return group.key === 'you' ? (group.rows[0] ?? null) : null;
}
