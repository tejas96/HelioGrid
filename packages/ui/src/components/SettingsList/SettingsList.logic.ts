import type { SettingsListGroup, SettingsRow } from '@heliogrid/domain';
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

/** The person's own row, when the person's group is drawn as their tile. */
export function personRow(group: SettingsListGroup): SettingsListGroup['rows'][number] | null {
  return group.key === 'you' ? (group.rows[0] ?? null) : null;
}
