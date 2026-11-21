import {
  designMountSchema,
  designStatusSchema,
  numberEntrySchema,
  studioHelperSchema,
} from '@heliogrid/contracts';

/**
 * The design studio's pg enums (migrations 0071 and 0073) → the contract schema each must match,
 * exactly.
 */
export const STUDIO_ENUMS: Record<string, { options: readonly string[]; contract: string }> = {
  design_mount: { options: designMountSchema.options, contract: 'designMountSchema' },
  design_status: { options: designStatusSchema.options, contract: 'designStatusSchema' },
  studio_helper: { options: studioHelperSchema.options, contract: 'studioHelperSchema' },
  number_entry: { options: numberEntrySchema.options, contract: 'numberEntrySchema' },
};
