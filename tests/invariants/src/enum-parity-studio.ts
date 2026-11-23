import {
  designMountSchema,
  designPictureFileRoleSchema,
  designPictureKindSchema,
  designPictureRefusalSchema,
  designPictureStateSchema,
  designStatusSchema,
  numberEntrySchema,
  studioHelperSchema,
} from '@heliogrid/contracts';

/**
 * The design studio's pg enums (migrations 0071, 0073 and 0074) → the contract schema each must match,
 * exactly.
 */
export const STUDIO_ENUMS: Record<string, { options: readonly string[]; contract: string }> = {
  design_mount: { options: designMountSchema.options, contract: 'designMountSchema' },
  design_status: { options: designStatusSchema.options, contract: 'designStatusSchema' },
  studio_helper: { options: studioHelperSchema.options, contract: 'studioHelperSchema' },
  number_entry: { options: numberEntrySchema.options, contract: 'numberEntrySchema' },
  design_picture_kind: {
    options: designPictureKindSchema.options,
    contract: 'designPictureKindSchema',
  },
  design_picture_state: {
    options: designPictureStateSchema.options,
    contract: 'designPictureStateSchema',
  },
  design_picture_refusal: {
    options: designPictureRefusalSchema.options,
    contract: 'designPictureRefusalSchema',
  },
  design_picture_file_role: {
    options: designPictureFileRoleSchema.options,
    contract: 'designPictureFileRoleSchema',
  },
};
