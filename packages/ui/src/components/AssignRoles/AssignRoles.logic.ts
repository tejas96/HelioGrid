import type { RolePreset } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { LoadingBarSize } from '../LoadingBars/LoadingBars.types';

/**
 * The glyph each preset's disc carries in the grant card's cluster (`SCR-M01-13` brief). Decoration
 * only: the sentence beside it is the meaning. A thirteenth preset fails to compile until it has one.
 */
export const PRESET_GLYPH: Record<RolePreset, ShellGlyphName> = {
  epc_owner: 'building',
  sales_manager: 'gauge',
  sales_executive: 'document',
  survey_engineer: 'search',
  design_engineer: 'palette',
  project_manager: 'board',
  field_technician: 'calendar-clock',
  installation_team_member: 'house',
  hr_admin: 'pair',
  finance: 'wallet',
  operations: 'package',
  marketing: 'megaphone',
};

/** The cluster shows four discs, then its own *+N* (`AvatarGroup`). */
export const GRANT_DISCS_SHOWN = 4;

/** The grant cluster's disc size, in px (`SCR-M01-13`, `size: 36`). */
export const GRANT_DISC_SIZE = 36;

/** At or above this layer width the editor is the side panel, whose width the board gives (560). */
export const ASSIGN_ROLES_PANEL_WIDTH = 560;

/** The skeleton draws nine option cards — as many as the board's sheet shows before it scrolls. */
export const OPTION_BARS: readonly LoadingBarSize[] = Array.from({ length: 9 }, () => 'option');
