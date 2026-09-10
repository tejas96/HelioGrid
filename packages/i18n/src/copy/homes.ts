import type { RolePreset } from '@heliogrid/contracts';
import type { Translator } from '../runtime';

/**
 * The title of each preset's home (`M13-09`, the twelve of §M13.5), spelled as the register
 * names the screen — the words the success dwell says ("Taking you to My Day") and the shell's
 * switcher lists. Authored ONCE here so no screen types a second spelling; the Sales Manager's
 * home is the owner dashboard team-scoped (`M13-30`), so it carries that screen's name.
 */
const HOME_TITLE: Record<RolePreset, { id: string }> = {
  epc_owner: /*i18n*/ { id: 'Owner Dashboard' },
  sales_manager: /*i18n*/ { id: 'Owner Dashboard' },
  operations: /*i18n*/ { id: 'Operations Home' },
  project_manager: /*i18n*/ { id: 'Project Board' },
  marketing: /*i18n*/ { id: 'Campaigns' },
  finance: /*i18n*/ { id: 'Finance Home' },
  hr_admin: /*i18n*/ { id: 'People Today' },
  sales_executive: /*i18n*/ { id: 'My Day' },
  design_engineer: /*i18n*/ { id: 'Design Queue' },
  survey_engineer: /*i18n*/ { id: 'My Visits Today' },
  field_technician: /*i18n*/ { id: 'My Day' },
  installation_team_member: /*i18n*/ { id: 'Installer Job Home' },
};

/** The home's title in the reader's language — `translate` is the mount's `t`. */
export function homeTitle(translate: Translator['t'], preset: RolePreset): string {
  return translate(HOME_TITLE[preset]);
}
