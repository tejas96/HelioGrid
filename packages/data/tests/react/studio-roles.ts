import { can, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';

/* By the matrix, never by spelling: who may make a design is F2's. */
export const mayDesign = (role: RolePreset) => can([role], 'studio.create_edit_designs');
function presetWhere(test: (role: RolePreset) => boolean): RolePreset {
  const found = ROLE_PRESETS.find(test);
  if (found === undefined) throw new Error('no preset fits');
  return found;
}
export const DESIGNS_ROLE = presetWhere(mayDesign);
export const READS_ONLY_ROLE = presetWhere((role) => !mayDesign(role));
